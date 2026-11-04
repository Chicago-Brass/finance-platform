const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}

test('Excel preserves cents and formats every money cell with dollars, parentheses and explicit zero', () => {
  const { reportToXlsx } = load(path.join(__dirname, 'export-excel.ts'));
  const report = {
    title: 'Balance Sheet', entity: 'Chicago Brass Inc.', periodLabel: 'As of Nov 3, 2026', basis: 'Accrual', isSample: false,
    columns: [{ key: 'amount', label: 'Amount', kind: 'amount' }], checks: [],
    lines: [0, 0.01, -0.72, 1254.6].map((value, index) => ({ id: String(index), label: String(index), depth: 0, kind: index === 3 ? 'grandTotal' : 'account', values: { amount: value } })),
  };
  const result = execFileSync('python3', ['-c', `
import io, json, sys, zipfile, xml.etree.ElementTree as ET
ns = {'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as book:
    assert book.testzip() is None
    styles = ET.fromstring(book.read('xl/styles.xml'))
    formats = {n.attrib['numFmtId']:n.attrib['formatCode'] for n in styles.find('x:numFmts',ns)}
    xfs = list(styles.find('x:cellXfs',ns))
    sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
    cells = [c for c in sheet.findall('.//x:c',ns) if c.find('x:v',ns) is not None]
    print(json.dumps({'values':[float(c.find('x:v',ns).text) for c in cells], 'formats':[formats[xfs[int(c.attrib['s'])].attrib['numFmtId']] for c in cells]}))
`], { input: Buffer.from(reportToXlsx(report)), encoding: 'utf8' });
  const actual = JSON.parse(result);
  assert.deepEqual(actual.values, [0, 0.01, -0.72, 1254.6]);
  assert.ok(actual.formats.every(format => format === '"$"#,##0.00;("$"#,##0.00);"$0.00"'));
});
