const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(name, mocks = {}) {
  const file = path.join(__dirname, name), module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const localRequire = specifier => mocks[specifier] ?? (specifier.endsWith('.css') ? {} : specifier.startsWith('.') ? load(`${specifier}${fs.existsSync(path.join(__dirname, `${specifier}.tsx`)) ? '.tsx' : '.ts'}`, mocks) : require(specifier));
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { selectGroups, selectActive } = load('searchable-select-utils.ts');
const { SearchableSelect } = load('SearchableSelect.tsx');
const options = [
  { value: '', label: 'All accounts' },
  { value: '112.100', label: 'Operating bank', group: 'Assets' },
  { value: '112.200', label: 'Inactive account', group: 'Assets', disabled: true },
  { value: '211.100', label: 'Accounts payable', group: 'Liabilities' },
];
test('Search matches labels, account codes and group names without losing disabled choices', () => {
  assert.deepEqual(selectGroups(options, ' 112.1 ')[0].options.map(option => option.value), ['112.100']);
  assert.deepEqual(selectGroups(options, 'ASSETS')[0].options.map(option => option.value), ['112.100', '112.200']);
  assert.equal(selectGroups(options, 'payable')[0].label, 'Liabilities');
  assert.deepEqual(selectGroups(options, 'unmatched'), []);
  assert.equal(selectGroups(options, '')[0].options[0].value, '');
});
test('Keyboard choices skip disabled options, preserve empty values and stop at list boundaries', () => {
  assert.equal(selectActive(options, '', 'ArrowDown'), '112.100');
  assert.equal(selectActive(options, '112.100', 'ArrowDown'), '211.100');
  assert.equal(selectActive(options, '211.100', 'ArrowDown'), '211.100');
  assert.equal(selectActive(options, '211.100', 'ArrowUp'), '112.100');
  assert.equal(selectActive(options, '112.100', 'Home'), '');
  assert.equal(selectActive(options, '', 'End'), '211.100');
  assert.equal(selectActive(options, null, 'ArrowUp'), '211.100');
  assert.equal(selectActive([{ value: 'a', label: 'A', disabled: true }], null, 'Home'), null);
});
test('Closed control exposes a labeled combobox and a successful named form value without a native select', () => {
  const markup = renderToStaticMarkup(React.createElement(SearchableSelect, { label: 'Account', value: '112.100', name: 'account', id: 'account-filter', options, onChange() {} }));
  assert.match(markup, /for="account-filter"/);
  assert.match(markup, /role="combobox"/);
  assert.match(markup, /aria-expanded="false"/);
  assert.match(markup, /value="Operating bank"/);
  assert.match(markup, /type="hidden" name="account" value="112.100"/);
  assert.doesNotMatch(markup, /<select|role="listbox"/);
});
test('Disabled control cannot submit a hidden filter or open an interactive combobox', () => {
  const markup = renderToStaticMarkup(React.createElement(SearchableSelect, { label: 'Account', value: '', name: 'account', options, disabled: true, onChange() {} }));
  assert.equal((markup.match(/disabled=""/g) || []).length, 2);
  assert.match(markup, /value="All accounts"/);
});

test('Enter selects without submitting; Escape closes locally; Tab leaves normal focus navigation intact', () => {
  const previousDocument = global.document;
  global.document = { body: {} };
  try {
    for (const key of ['Enter', 'Escape', 'Tab']) {
      const updates = [], changes = []; let state = 0;
      const mockReact = { ...React,
        useId: () => 'keyboard-test', useRef: () => ({ current: null }), useMemo: fn => fn(), useEffect() {}, useLayoutEffect() {},
        useState: initial => { const index = state++; return [index === 0 ? true : initial, value => updates.push([index, value])]; },
      };
      const control = load('SearchableSelect.tsx', { react: mockReact, 'react-dom': { createPortal: child => child } }).SearchableSelect;
      const tree = control({ label: 'Account', value: '', options, onChange: value => changes.push(value) });
      const findInput = element => {
        if (!element || typeof element !== 'object') return null;
        if (element.props?.role === 'combobox') return element;
        for (const child of React.Children.toArray(element.props?.children)) { const found = findInput(child); if (found) return found; }
        return null;
      };
      const input = findInput(tree); let prevented = false, stopped = false;
      input.props.onKeyDown({ key, nativeEvent: { isComposing: false }, preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
      assert.ok(updates.some(([index, value]) => index === 0 && value === false), `${key} closes the popup`);
      assert.equal(prevented, key !== 'Tab');
      assert.equal(stopped, key === 'Escape');
      assert.deepEqual(changes, key === 'Enter' ? [''] : []);
    }
  } finally { global.document = previousDocument; }
});

test('Popup stays inside its nearest menu or modal dialog, otherwise using the body', () => {
  const previousDocument = global.document;
  const body = { kind: 'body' }, dialog = { kind: 'dialog' }, menu = { kind: 'details' };
  global.document = { body };
  try {
    for (const nearestDialog of [menu, dialog, null]) {
      let state = 0, reference = 0, portalTarget;
      const mockReact = { ...React,
        useId: () => 'portal-test', useMemo: fn => fn(), useEffect() {}, useLayoutEffect() {},
        useRef: () => ({ current: reference++ === 1 ? { closest: selector => { assert.equal(selector, 'details, [role="dialog"]'); return nearestDialog; } } : null }),
        useState: initial => [state++ === 0 ? true : initial, () => {}],
      };
      const control = load('SearchableSelect.tsx', { react: mockReact, 'react-dom': { createPortal: (child, target) => { portalTarget = target; return child; } } }).SearchableSelect;
      control({ label: 'Account', value: '', options, onChange() {} });
      assert.equal(portalTarget, nearestDialog ?? body);
    }
  } finally { global.document = previousDocument; }
});

test('Shared search uses an associated top label and native submit-friendly input', () => {
  const { SearchField } = load('FilterControls.tsx');
  const markup = renderToStaticMarkup(React.createElement(SearchField, { label: 'Search accounts', id: 'shared-search', name: 'q', value: 'bank', onChange() {} }));
  assert.match(markup, /<label class="filter-control-label" for="shared-search">Search accounts<\/label>/);
  assert.match(markup, /id="shared-search" type="search"/);
  assert.match(markup, /name="q"/);
  assert.match(markup, /enterKeyHint="search"/);
});

test('Shared segmented controls move selection and focus with arrows, Home and End', () => {
  const changes = [], focused = [], refs = { current: [] };
  const mockReact = { ...React, useRef: () => refs };
  const { SegmentedControl } = load('FilterControls.tsx', { react: mockReact });
  const element = SegmentedControl({ label: 'View', value: 'month', options: [{ value: 'month', label: 'Monthly' }, { value: 'quarter', label: 'Quarterly' }, { value: 'year', label: 'Annual' }], onChange: value => changes.push(value) });
  const buttons = element.props.children.props.children;
  buttons.forEach((button, index) => button.props.ref({ focus() { focused.push(index); } }));
  for (const [index, key, expected] of [[0, 'ArrowLeft', 'year'], [0, 'ArrowRight', 'quarter'], [1, 'Home', 'month'], [1, 'End', 'year']]) {
    let prevented = false;
    buttons[index].props.onKeyDown({ key, preventDefault() { prevented = true; } });
    assert.equal(changes.at(-1), expected);
    assert.equal(prevented, true);
  }
  assert.deepEqual(focused, [2, 1, 0, 2]);
  assert.deepEqual(buttons.map(button => button.props.tabIndex), [0, -1, -1]);
});
