const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

test('Menus dismiss on outside pointer or focus, preserve nested interactions and release listeners', () => {
  const previousDocument = global.document, listeners = new Map(), cleanups = [];
  let focused = 0;
  const inside = {}, nestedPopup = {}, outside = {};
  const menu = { open: true, contains: target => target === inside || target === nestedPopup, querySelector: () => ({ focus() { focused++; } }) };
  global.document = {
    addEventListener: (name, handler, capture) => listeners.set(name, { handler, capture }),
    removeEventListener: (name, handler, capture) => {
      assert.equal(listeners.get(name).handler, handler);
      assert.equal(listeners.get(name).capture, capture);
      listeners.delete(name);
    },
  };
  try {
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, 'DismissibleMenu.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const hooks = { ...React, useRef: () => ({ current: menu }), useEffect: effect => cleanups.push(effect()) };
    new Function('require', 'module', 'exports', code)(name => name === 'react' ? hooks : require(name), module, module.exports);
    const tree = module.exports.DismissibleMenu({ className: 'period-picker', children: 'Menu contents' });
    assert.equal(tree.type, 'details');
    assert.equal(tree.props.className, 'period-picker');
    assert.equal(listeners.get('pointerdown').capture, true);
    for (const name of ['pointerdown', 'focusin']) {
      for (const target of [inside, nestedPopup]) {
        menu.open = true;
        listeners.get(name).handler({ target });
        assert.equal(menu.open, true, `${name} inside keeps menu open`);
      }
      listeners.get(name).handler({ target: outside });
      assert.equal(menu.open, false, `${name} outside closes menu`);
    }
    let prevented = 0, stopped = 0;
    tree.props.onKeyDown({ key: 'Escape', currentTarget: menu, preventDefault() { prevented++; }, stopPropagation() { stopped++; } });
    assert.equal(menu.open, false);
    assert.equal(focused, 1);
    assert.equal(prevented, 1);
    assert.equal(stopped, 1);
    cleanups.forEach(cleanup => cleanup());
    assert.equal(listeners.size, 0);
  } finally { global.document = previousDocument; }
});

test('All period, Filters and account menus use shared outside-dismiss behavior', () => {
  for (const file of ['components/ReportFilters.tsx', 'components/BalanceSheetFilters.tsx', 'components/DateFilter.tsx', 'components/ReportView.tsx', 'app/(reports)/layout.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(source, /<DismissibleMenu /, file);
    assert.doesNotMatch(source, /<details /, file);
  }
});
