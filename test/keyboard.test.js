import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeyboard, defineUyghurKeyboard, KEY_LAYOUT, PHONETIC_MAP, replaceSelection, deleteSelectionBackward } from '../src/index.js';

class Element extends EventTarget {
  constructor(tag, doc) { super(); this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.attrs = new Map(); this.dataset = {}; this.children = []; this.className = ''; this.parentNode = null; this.value = ''; this.selectionStart = 0; this.selectionEnd = 0; this.listeners = new Map(); }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  hasAttribute(key) { return this.attrs.has(key); }
  removeAttribute(key) { this.attrs.delete(key); }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  insertBefore(child, before) { child.parentNode = this; const index = this.children.indexOf(before); if (index < 0) this.children.push(child); else this.children.splice(index, 0, child); return child; }
  replaceChildren() { this.children.forEach((child) => { child.parentNode = null; }); this.children = []; }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this); this.parentNode = null; }
  contains(node) { return node === this || this.children.some((child) => child.contains(node)); }
  closest(selector) { return selector === 'button.ug-keyboard__key' && this.tagName === 'BUTTON' && this.className === 'ug-keyboard__key' ? this : this.parentNode?.closest(selector); }
  focus() { this.ownerDocument.activeElement = this; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  addEventListener(name, fn, options) { super.addEventListener(name, fn, options); if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); }
  removeEventListener(name, fn, options) { super.removeEventListener(name, fn, options); this.listeners.get(name)?.delete(fn); }
}
function setup(value = 'سالام دۇنيا') {
  const doc = new EventTarget(); doc.defaultView = { Event, CustomEvent }; doc.readyState = 'complete'; doc.createElement = (tag) => new Element(tag, doc); doc.ids = new Map(); doc.head = doc.createElement('head');
  const findId = (node, id) => node.id === id || node.getAttribute('id') === id ? node : node.children.map((child) => findId(child, id)).find(Boolean);
  doc.getElementById = (id) => doc.ids.get(id) || findId(doc.head, id);
  const parent = doc.createElement('main'), target = doc.createElement('textarea'); target.value = value; target.setSelectionRange(value.length, value.length); parent.appendChild(target);
  return { doc, target, parent };
}
function key(target, name, modifiers = {}) { const event = new Event('keydown', { cancelable: true }); Object.assign(event, { key: name, ...modifiers }); target.dispatchEvent(event); return event; }
function rootClick(root, button, name = 'click') { const event = new Event(name, { cancelable: true }); Object.defineProperty(event, 'target', { value: button }); root.dispatchEvent(event); return event; }
function buttons(root) { return root.children.flatMap((child) => child.tagName === 'BUTTON' ? [child] : buttons(child)); }

test('package can be imported in Node/SSR without defining browser globals', () => { assert.equal(defineUyghurKeyboard(), null); });
test('virtual layout includes every Uyghur alphabet letter and phonetic map stays explicit', () => {
  for (const letter of [...'ئابپتجچخدرزژسشغفقكگڭلمنھەوۇۆۈۋېىي']) {
    assert(KEY_LAYOUT.flat().includes(letter), `Missing ${letter}`);
  }
  assert.equal(PHONETIC_MAP.q, 'ق'); assert.equal(PHONETIC_MAP.N, 'ڭ');
});
test('selection insertion replaces precisely the chosen middle range and updates caret', () => {
  assert.deepEqual(replaceSelection('سالام دۇنيا', 6, 11, 'ئۇيغۇر'), { value: 'سالام ئۇيغۇر', start: 12, end: 12 });
  assert.deepEqual(replaceSelection('abc', 2, 1, 'X'), { value: 'aXc', start: 2, end: 2 });
  assert.deepEqual(replaceSelection('abc', -4, 100, 'ئۈ'), { value: 'ئۈ', start: 2, end: 2 });
});
test('deletion handles selected ranges, start of text, emoji and combining characters', () => {
  assert.deepEqual(deleteSelectionBackward('سالام', 1, 4), { value: 'سم', start: 1, end: 1 });
  assert.deepEqual(deleteSelectionBackward('سالام', 0, 0), { value: 'سالام', start: 0, end: 0 });
  const text = 'A👩‍💻ب'; assert.deepEqual(deleteSelectionBackward(text, text.length - 1, text.length - 1), { value: 'Aب', start: 1, end: 1 });
  assert.deepEqual(deleteSelectionBackward('بَ', 2, 2), { value: '', start: 0, end: 0 });
  assert.throws(() => deleteSelectionBackward(null, 0, 0), TypeError);
});
test('controller inserts at selection and dispatches cancellable beforeinput then input', () => {
  const { target } = setup('سالام'); target.setSelectionRange(1, 3); const events = [];
  target.addEventListener('beforeinput', (event) => events.push([event.type, target.value, event.data, event.inputType]));
  target.addEventListener('input', (event) => events.push([event.type, target.value, event.data, event.inputType]));
  const keyboard = createKeyboard(target); assert.equal(keyboard.insert('ئۈ'), true);
  assert.equal(target.value, 'سئۈام'); assert.equal(target.selectionStart, 3); assert.equal(target.getAttribute('dir'), 'rtl');
  assert.deepEqual(events, [['beforeinput', 'سالام', 'ئۈ', 'insertText'], ['input', 'سئۈام', 'ئۈ', 'insertText']]);
});
test('cancelled beforeinput preserves value and blocks the Latin physical fallback', () => {
  const { target } = setup('abc'); const keyboard = createKeyboard(target, { physical: true }); target.addEventListener('beforeinput', (event) => event.preventDefault());
  assert.equal(keyboard.insert('ئ'), false); assert.equal(target.value, 'abc'); assert.equal(key(target, 'q').defaultPrevented, true); assert.equal(target.value, 'abc');
});
test('virtual keys preserve selection focus and emit composed public events', () => {
  const { target, doc } = setup('ab'); target.setSelectionRange(1, 1); const keyboard = createKeyboard(target); const keys = buttons(keyboard.element), q = keys.find((button) => button.dataset.text === 'ق');
  assert(rootClick(keyboard.element, q, 'pointerdown').defaultPrevented); let detail;
  keyboard.element.addEventListener('uyghur-input', (event) => { detail = event.detail; assert(event.composed); });
  rootClick(keyboard.element, q); assert.equal(target.value, 'aقb'); assert.equal(doc.activeElement, target); assert.equal(detail.value, 'aقb');
  rootClick(keyboard.element, keys.find((button) => button.dataset.action === 'backspace')); assert.equal(target.value, 'ab');
  rootClick(keyboard.element, keys.find((button) => button.dataset.action === 'space')); assert.equal(target.value, 'a b');
});
test('physical mapping is opt-in and leaves shortcuts, composition and unmapped keys alone', () => {
  const { target } = setup(''); const keyboard = createKeyboard(target); assert.equal(key(target, 'q').defaultPrevented, false); assert.equal(target.value, '');
  keyboard.setPhysicalMapping(true); assert(key(target, 'q').defaultPrevented); assert.equal(target.value, 'ق');
  for (const options of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }]) assert.equal(key(target, 'a', options).defaultPrevented, false);
  target.dispatchEvent(new Event('compositionstart')); assert.equal(key(target, 'a').defaultPrevented, false); assert.equal(keyboard.insert('ا'), false); target.dispatchEvent(new Event('compositionend'));
  assert(key(target, 'A').defaultPrevented); assert.equal(target.value, 'قئا'); assert.equal(key(target, 'Escape').defaultPrevented, false);
  keyboard.setPhysicalMapping(false); assert.equal(key(target, 'a').defaultPrevented, false);
});
test('read-only/disabled targets reject mutation; destroy removes listeners and restores direction', () => {
  const { target, parent } = setup('abc'); target.setAttribute('dir', 'auto'); const keyboard = createKeyboard(target);
  target.readOnly = true; assert.equal(keyboard.insert('ا'), false); target.readOnly = false; target.disabled = true; assert.equal(keyboard.backspace(), false); target.disabled = false;
  keyboard.setVisible(false); assert.equal(keyboard.element.hidden, true); keyboard.setVisible(true); assert.equal(keyboard.element.hidden, false);
  keyboard.destroy(); keyboard.destroy(); assert.equal(target.getAttribute('dir'), 'auto'); assert.equal(parent.children.length, 1); assert.equal(keyboard.insert('ا'), false);
  assert([...target.listeners.values()].every((listeners) => listeners.size === 0));
});
test('consumer direction changes survive cleanup and invalid targets are rejected', () => {
  const { target } = setup(); const keyboard = createKeyboard(target); target.setAttribute('dir', 'ltr'); keyboard.destroy(); assert.equal(target.getAttribute('dir'), 'ltr');
  assert.throws(() => createKeyboard({}), TypeError); const email = setup().doc.createElement('input'); email.type = 'email'; assert.throws(() => createKeyboard(email), TypeError);
});
test('standalone keyboards share one document font registration and clean up the last owned reference', () => {
  const { target, doc } = setup();
  const first = createKeyboard(target), second = createKeyboard(target);
  assert.equal(doc.head.children.length, 1);
  const font = doc.head.children[0];
  assert.equal(font.id, 'uyghur-keyboard-alkatip-font');
  assert.match(font.textContent, /font-family: "ALKATIP Basma"/);
  assert.match(font.textContent, /3c16518f40da2fc2901f37666c0556a7\.woff2/);
  assert.match(font.textContent, /font-display: swap/);
  first.destroy(); assert.equal(doc.head.children.length, 1);
  second.destroy(); assert.equal(doc.head.children.length, 0);
  second.destroy(); assert.equal(doc.head.children.length, 0);
});
test('consumer-provided document font styles are reused and preserved on cleanup', () => {
  const { target, doc } = setup();
  const existing = doc.createElement('link'); existing.id = 'uyghur-keyboard-alkatip-font'; doc.head.appendChild(existing);
  const keyboard = createKeyboard(target);
  assert.equal(doc.head.children.length, 1);
  keyboard.destroy(); assert.equal(doc.head.children[0], existing);
});
test('web component registers idempotently, mounts, updates physical mapping and cleans up', () => {
  const { doc, target } = setup(''); doc.ids.set('target', target); const oldElement = globalThis.HTMLElement, oldRegistry = globalThis.customElements;
  const classes = new Map(); globalThis.HTMLElement = class extends Element { constructor() { super('uyghur-keyboard', doc); this.isConnected = false; } attachShadow() { this.shadowRoot = new Element('shadow-root', doc); return this.shadowRoot; } };
  globalThis.customElements = { get: (name) => classes.get(name), define: (name, value) => classes.set(name, value) };
  try {
    const Component = defineUyghurKeyboard(); assert.equal(defineUyghurKeyboard(), Component); const element = new Component(); element.setAttribute('for', 'target'); element.isConnected = true; element.connectedCallback();
    assert.equal(doc.head.children.length, 1);
    assert.match(element.controller.element.children[0].textContent, /"ALKATIP Basma"/);
    assert.doesNotMatch(element.controller.element.children[0].textContent, /@font-face/);
    assert.equal(element.insert('ئ'), true); assert.equal(target.value, 'ئ');
    element.setAttribute('physical', ''); element.attributeChangedCallback(); key(target, 'q'); assert.equal(target.value, 'ئق');
    element.disconnectedCallback(); assert.equal(element.insert('ا'), false); assert.equal(doc.head.children.length, 0); assert([...target.listeners.values()].every((listeners) => listeners.size === 0));
  } finally { if (oldElement === undefined) delete globalThis.HTMLElement; else globalThis.HTMLElement = oldElement; if (oldRegistry === undefined) delete globalThis.customElements; else globalThis.customElements = oldRegistry; }
});
