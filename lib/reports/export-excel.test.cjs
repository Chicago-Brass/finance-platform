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
    title: 'Balance Sheet', entity: 'Chicago Brass Inc.', periodLabel: 'As of Nov 3, 2026', basis: 'Accrual',
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

function inspectWorkbook(bytes) {
  return JSON.parse(execFileSync('python3', ['-c', `
import io, json, sys, zipfile, xml.etree.ElementTree as ET
ns = {'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as book:
    assert book.testzip() is None
    for filename in book.namelist():
        if filename.endswith(('.xml','.rels')):
            ET.fromstring(book.read(filename))
    styles = ET.fromstring(book.read('xl/styles.xml'))
    xfs = list(styles.find('x:cellXfs',ns))
    sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
    workbook = ET.fromstring(book.read('xl/workbook.xml'))
    cells = {}
    for c in sheet.findall('.//x:c',ns):
        text = c.find('x:is/x:t',ns)
        number = c.find('x:v',ns)
        style = xfs[int(c.attrib.get('s',0))]
        align = style.find('x:alignment',ns)
        cells[c.attrib['r']] = {'type':c.attrib.get('t'), 'text':text.text if text is not None else None, 'value':number.text if number is not None else None, 'wrap':align is not None and align.attrib.get('wrapText') == '1'}
    print(json.dumps({'cells':cells, 'dimension':sheet.find('x:dimension',ns).attrib['ref'], 'pane':sheet.find('x:sheetViews/x:sheetView/x:pane',ns).attrib, 'pageSetup':sheet.find('x:pageSetup',ns).attrib, 'title':workbook.find('x:sheets/x:sheet',ns).attrib['name'], 'printTitles':workbook.find('x:definedNames/x:definedName',ns).text, 'formulas':len(sheet.findall('.//x:f',ns)), 'logo':book.read('xl/media/logo.png')[:8].hex()}))
`], { input: Buffer.from(bytes), encoding: 'utf8' }));
}

test('Excel keeps filtered scope explicit, wraps long labels and treats account text as text', () => {
  const { reportToXlsx } = load(path.join(__dirname, 'export-excel.ts'));
  const label = '=SUM(1,2) - A very long account label <with> & special "characters"\u0001';
  const report = {
    title: "Director's Income Statement", entity: 'Chicago Brass Inc.', periodLabel: 'Jan 1, 2026 to Dec 31, 2026', basis: 'Accrual',
    columns: [{ key: 'amount', label: 'Actual', sublabel: '2026', kind: 'amount' }, { key: 'share', label: 'Margin', kind: 'percent' }],
    checks: [{ ok: true, label: 'Balanced', detail: 'All accounts' }],
    lines: [
      { id: 'hidden', label: 'Hidden account', depth: 1, kind: 'account', values: { amount: 50, share: null } },
      { id: 'visible', label, depth: 1, kind: 'account', values: { amount: -0.01, share: 0.1234 } },
      { id: 'total', label: 'Total', depth: 0, kind: 'grandTotal', values: { amount: 49.99, share: null } },
    ],
  };
  const filtered = inspectWorkbook(reportToXlsx(report, report.lines.slice(1)));
  const allText = Object.values(filtered.cells).map(cell => cell.text).filter(Boolean);
  assert.ok(allText.includes('Some detail rows are hidden. Financial totals include all accounts.'));
  assert.ok(!allText.includes('Hidden account'));
  const labelCell = Object.values(filtered.cells).find(cell => cell.text === label.replace('\u0001',''));
  assert.equal(labelCell.type, 'inlineStr');
  assert.equal(labelCell.wrap, true);
  assert.equal(filtered.formulas, 0, 'labels beginning with equals never become Excel formulas');
  assert.equal(filtered.cells.B10.value, '-0.01');
  assert.equal(filtered.cells.C10.value, '0.1234');
  assert.equal(filtered.cells.B11.value, '49.99', 'filtering account rows does not recompute financial totals');
  assert.equal(filtered.cells.C11.value, null, 'missing percentage is a blank cell, not zero');
  assert.equal(filtered.cells.B9.text, 'Actual\n2026');
  assert.equal(filtered.title, report.title);
  assert.equal(filtered.printTitles, "'Director''s Income Statement'!$9:$9");
  assert.equal(filtered.pane.topLeftCell, 'B10');
  assert.equal(filtered.pageSetup.orientation, 'landscape');
  assert.equal(filtered.logo, '89504e470d0a1a0a');
  const complete = inspectWorkbook(reportToXlsx(report));
  assert.ok(!Object.values(complete.cells).some(cell => cell.text?.includes('Some detail rows are hidden')));
});

test('Full-year Excel includes every period, account and total rather than a viewport slice', () => {
  const { reportToXlsx } = load(path.join(__dirname, 'export-excel.ts'));
  const columns = Array.from({ length: 12 }, (_, index) => ({ key: `m${index + 1}`, label: `Month ${index + 1}`, kind: 'amount' })).concat({ key: 'total', label: 'Total', kind: 'amount' });
  const values = Object.fromEntries(columns.map((column,index) => [column.key, index === 12 ? 12.12 : 1.01]));
  const lines = Array.from({ length: 120 }, (_, index) => ({ id: String(index), label: `Account ${index + 1}`, depth: 0, kind: index === 119 ? 'grandTotal' : 'account', values }));
  const report = { title: 'Income Statement', entity: 'Chicago Brass Inc.', periodLabel: '2026', basis: 'Accrual', columns, lines, checks: [] };
  const actual = inspectWorkbook(reportToXlsx(report));
  assert.equal(actual.cells.N8.text, 'Total');
  assert.equal(actual.cells.A128.text, 'Account 120');
  assert.equal(actual.cells.N128.value, '12.12');
  assert.equal(Object.values(actual.cells).filter(cell => cell.value !== null).length, 120 * 13);
  assert.equal(actual.dimension, 'A1:N129');
});
