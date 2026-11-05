import { createKeyboard, defineUyghurKeyboard } from '../src/index.js';
defineUyghurKeyboard();
const target = document.getElementById('message');
const keyboard = createKeyboard(target, { container: document.getElementById('keyboard-mount') });
const status = document.getElementById('status');
const toast = document.getElementById('toast');
let timer;
function announce(text) { toast.textContent = text; clearTimeout(timer); timer = setTimeout(() => { toast.textContent = ''; }, 2600); }
function update() {
  const count = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter('ug', { granularity: 'grapheme' }).segment(target.value)].length : [...target.value].length;
  document.getElementById('count').textContent = count + ' ھەرپ';
}
target.addEventListener('input', () => { update(); status.textContent = 'تېكىست يېڭىلاندى'; });
document.getElementById('physical').addEventListener('change', (event) => {
  keyboard.setPhysicalMapping(event.target.checked);
  document.getElementById('map-note').hidden = !event.target.checked;
  status.textContent = event.target.checked ? 'ئاھاڭداش ھەرپ خەرىتىسى ئېچىلدى' : 'ئېكران كۇنۇپكىلىرى بىلەن يېزىڭ';
  target.focus({ preventScroll: true });
});
document.getElementById('clear').addEventListener('click', () => {
  target.focus({ preventScroll: true }); target.setSelectionRange(0, target.value.length); keyboard.insert('');
  status.textContent = 'تېكىست تازىلاندى';
});
async function copy(text) {
  try { await navigator.clipboard.writeText(text); announce('كۆچۈرۈلدى ✓'); }
  catch { announce('كۆچۈرگىلى بولمىدى. تېكىستنى تاللاپ كۆچۈرۈڭ.'); }
}
document.getElementById('copy').addEventListener('click', () => copy(target.value));
document.querySelectorAll('.copy-example').forEach((button) => button.addEventListener('click', () => copy(document.getElementById(button.dataset.example).textContent)));
update();
