import { keyboardStyles } from './style.js';

/** The complete 32-letter alphabet is represented across these virtual rows. */
export const KEY_LAYOUT = Object.freeze([
  Object.freeze(['چ', 'ۋ', 'ې', 'ر', 'ت', 'ي', 'ۇ', 'ڭ', 'و', 'پ']),
  Object.freeze(['ھ', 'س', 'د', 'ا', 'ە', 'ى', 'ق', 'ك', 'ل', 'ژ']),
  Object.freeze(['ز', 'ش', 'غ', 'ۈ', 'ب', 'ن', 'م', 'ۆ', 'گ', 'خ', 'ف', 'ج']),
  Object.freeze(['ئ', 'ئا', 'ئە', 'ئې', 'ئى', 'ئو', 'ئۇ', 'ئۆ', 'ئۈ']),
]);

/** An explicit, optional phonetic map. This is not an operating-system layout. */
export const PHONETIC_MAP = Object.freeze({
  a: 'ا', b: 'ب', c: 'چ', d: 'د', e: 'ە', f: 'ف', g: 'گ', h: 'ھ', i: 'ى', j: 'ج',
  k: 'ك', l: 'ل', m: 'م', n: 'ن', o: 'و', p: 'پ', q: 'ق', r: 'ر', s: 'س', t: 'ت',
  u: 'ۇ', v: 'ۆ', w: 'ۋ', x: 'خ', y: 'ي', z: 'ز',
  Z: 'ژ', A: 'ئا', E: 'ئە', I: 'ئى', O: 'ئو', U: 'ئۇ', G: 'غ', N: 'ڭ', S: 'ش', V: 'ئۆ', W: 'ئۈ', C: 'ج', Y: 'ې',
});

function selection(value, start, end) {
  const length = value.length;
  const first = Number.isFinite(start) ? Math.max(0, Math.min(length, Math.trunc(start))) : length;
  const last = Number.isFinite(end) ? Math.max(0, Math.min(length, Math.trunc(end))) : first;
  return [Math.min(first, last), Math.max(first, last)];
}

/** Pure UTF-16 selection replacement, using the same offsets as HTML inputs. */
export function replaceSelection(value, start, end, text) {
  if (typeof value !== 'string' || typeof text !== 'string') throw new TypeError('value and text must be strings');
  const [a, b] = selection(value, start, end);
  return { value: value.slice(0, a) + text + value.slice(b), start: a + text.length, end: a + text.length };
}

/** Remove a selected range or the preceding complete grapheme. */
export function deleteSelectionBackward(value, start, end) {
  if (typeof value !== 'string') throw new TypeError('value must be a string');
  const [a, b] = selection(value, start, end);
  if (a !== b) return replaceSelection(value, a, b, '');
  if (!a) return { value, start: 0, end: 0 };
  let previous = 0;
  if (typeof Intl.Segmenter === 'function') {
    for (const part of new Intl.Segmenter('ug', { granularity: 'grapheme' }).segment(value)) {
      if (part.index >= a) break;
      previous = part.index;
    }
  } else {
    previous = a - 1;
    const code = value.charCodeAt(previous);
    if (previous && code >= 0xdc00 && code <= 0xdfff) previous--;
  }
  return replaceSelection(value, previous, a, '');
}

function makeEvent(target, name, type, text, cancelable) {
  const view = target.ownerDocument?.defaultView || globalThis;
  if (typeof view.InputEvent === 'function') {
    return new view.InputEvent(name, { bubbles: true, composed: true, cancelable, inputType: type, data: text });
  }
  const event = new view.Event(name, { bubbles: true, composed: true, cancelable });
  Object.defineProperties(event, { inputType: { value: type }, data: { value: text } });
  return event;
}

/** Mount a virtual keyboard next to a text input/textarea, or in options.container. */
export function createKeyboard(target, options = {}) {
  if (!target || typeof target.value !== 'string' || typeof target.setSelectionRange !== 'function' || !target.ownerDocument) {
    throw new TypeError('createKeyboard needs a text input or textarea');
  }
  if (target.tagName === 'INPUT' && !['text', 'search', 'tel', 'url', 'password'].includes(target.type || 'text')) {
    throw new TypeError('The input type must support text selection');
  }
  const doc = target.ownerDocument;
  const root = doc.createElement('div');
  root.className = 'ug-keyboard';
  root.lang = 'ug';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', options.label || 'ئۇيغۇرچە كۇنۇپكا تاختىسى');
  const style = doc.createElement('style');
  style.textContent = keyboardStyles;
  root.appendChild(style);
  let physical = options.physical === true;
  let destroyed = false;
  let composing = false;
  const originalDirection = target.getAttribute('dir');
  const direction = options.direction || 'rtl';
  if (!['rtl', 'auto', 'preserve'].includes(direction)) throw new TypeError('direction must be rtl, auto, or preserve');
  if (direction !== 'preserve') target.setAttribute('dir', direction);

  function keyButton(text, action) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'ug-keyboard__key';
    button.textContent = text;
    if (action) button.dataset.action = action;
    else button.dataset.text = text;
    button.setAttribute('aria-label', action === 'backspace' ? 'ئالدىنقى ھەرپنى ئۆچۈرۈش' : action === 'space' ? 'بوشلۇق' : text);
    return button;
  }
  KEY_LAYOUT.forEach((keys) => {
    const row = doc.createElement('div');
    row.className = 'ug-keyboard__row';
    keys.forEach((key) => row.appendChild(keyButton(key)));
    root.appendChild(row);
  });
  const actions = doc.createElement('div');
  actions.className = 'ug-keyboard__row';
  actions.appendChild(keyButton('بوشلۇق', 'space'));
  actions.appendChild(keyButton('⌫ ئۆچۈرۈش', 'backspace'));
  root.appendChild(actions);

  if (options.container) options.container.appendChild(root);
  else if (target.parentNode) target.parentNode.insertBefore(root, target.nextSibling);
  else throw new Error('Attach the target to a document or provide a container');

  function commit(result, inputType, text) {
    if (destroyed || target.disabled || target.readOnly || composing) return false;
    if (!target.dispatchEvent(makeEvent(target, 'beforeinput', inputType, text, true))) return false;
    target.value = result.value;
    target.focus({ preventScroll: true });
    target.setSelectionRange(result.start, result.end);
    target.dispatchEvent(makeEvent(target, 'input', inputType, text, false));
    const view = doc.defaultView || globalThis;
    if (typeof view.CustomEvent === 'function') {
      root.dispatchEvent(new view.CustomEvent('uyghur-input', { bubbles: true, composed: true, detail: { value: target.value, inputType, text } }));
    }
    return true;
  }
  function insert(text) {
    if (typeof text !== 'string') throw new TypeError('insert expects a string');
    return commit(replaceSelection(target.value, target.selectionStart, target.selectionEnd, text), 'insertText', text);
  }
  function backspace() {
    return commit(deleteSelectionBackward(target.value, target.selectionStart, target.selectionEnd), 'deleteContentBackward', null);
  }
  function onClick(event) {
    const button = event.target.closest?.('button.ug-keyboard__key');
    if (!button || !root.contains(button)) return;
    if (button.dataset.action === 'backspace') backspace();
    else insert(button.dataset.action === 'space' ? ' ' : button.dataset.text);
  }
  function onPointerDown(event) {
    // Keep the selection in the target while clicking the virtual keys.
    if (event.target.closest?.('button.ug-keyboard__key')) event.preventDefault();
  }
  function onKeyDown(event) {
    if (!physical || composing || event.isComposing || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const mapped = PHONETIC_MAP[event.key];
    if (mapped) { event.preventDefault(); insert(mapped); }
  }
  const beginComposition = () => { composing = true; };
  const endComposition = () => { composing = false; };
  root.addEventListener('click', onClick);
  root.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('compositionstart', beginComposition);
  target.addEventListener('compositionend', endComposition);

  return {
    element: root,
    insert,
    backspace,
    setPhysicalMapping(enabled) { physical = Boolean(enabled); },
    setVisible(visible) { root.hidden = !visible; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeEventListener('click', onClick);
      root.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('compositionstart', beginComposition);
      target.removeEventListener('compositionend', endComposition);
      root.remove();
      if (direction !== 'preserve' && target.getAttribute('dir') === direction) {
        if (originalDirection === null) target.removeAttribute('dir');
        else target.setAttribute('dir', originalDirection);
      }
    },
  };
}

/** Define the optional Web Component. Safe to import the package in Node/SSR. */
export function defineUyghurKeyboard(name = 'uyghur-keyboard', registry = globalThis.customElements) {
  if (!registry || typeof globalThis.HTMLElement !== 'function') return null;
  if (registry.get(name)) return registry.get(name);
  class UyghurKeyboardElement extends HTMLElement {
    static get observedAttributes() { return ['for', 'physical']; }
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.mountKeyboard();
      this.readyListener = () => this.mountKeyboard();
      if (this.ownerDocument.readyState === 'loading') this.ownerDocument.addEventListener('DOMContentLoaded', this.readyListener, { once: true });
    }
    attributeChangedCallback() { if (this.isConnected) this.mountKeyboard(); }
    disconnectedCallback() {
      this.controller?.destroy();
      this.controller = null;
      if (this.readyListener) this.ownerDocument.removeEventListener('DOMContentLoaded', this.readyListener);
    }
    mountKeyboard() {
      this.controller?.destroy();
      this.controller = null;
      this.shadowRoot?.replaceChildren();
      const hostStyle = this.ownerDocument.createElement('style');
      hostStyle.textContent = ':host { display: block; }';
      this.shadowRoot?.appendChild(hostStyle);
      const target = this.ownerDocument.getElementById(this.getAttribute('for') || '');
      if (!target) return;
      this.controller = createKeyboard(target, { container: this.shadowRoot, physical: this.hasAttribute('physical') });
    }
    insert(text) { return this.controller?.insert(text) || false; }
    backspace() { return this.controller?.backspace() || false; }
  }
  registry.define(name, UyghurKeyboardElement);
  return UyghurKeyboardElement;
}
