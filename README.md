# ئۇيغۇرچە كۇنۇپكا تاختىسى · Uyghur Keyboard

A dependency-free virtual keyboard, optional phonetic mapping, and Web Component for Uyghur text entry. This project runs locally in the browser and sends no text to a server.

[Browser demo](https://uyghurcommunity.github.io/uyghur-keyboard/) · [UyghurCommunity](https://github.com/UyghurCommunity)

## ئۇيغۇرچە

ھەر قانداق تېكىست كىرگۈزۈش رامكىسى ياكى كۆپ قۇرلۇق يېزىش مەيدانىغا ئۇيغۇرچە كۇنۇپكا تاختىسى قوشۇڭ. كورسىر ۋە تاللانغان تېكىست ئورنى ساقلىنىدۇ. ئۆچۈرۈش كۇنۇپكىسى بىرلەشمە ھەرپ ۋە ئېموجىنى پۈتۈن ئۆچۈرىدۇ.

- ئۇيغۇرچە ھەرپلەر ۋە ھەمزىلىك سوزۇق تاۋۇش كۇنۇپكىلىرى
- ئېكراندىكى كۇنۇپكىلار، كۇنۇپكا تاختىسى ۋە تېگىش ئارقىلىق ئىشلىتىش
- ئىختىيارىي فىزىكىلىق ھەرپ ماسلاشتۇرۇش؛ كۆڭۈلدىكى ھالەتتە تاقاق
- RTL، تاللانغان تېكىستنى ئالماشتۇرۇش، `beforeinput` ۋە `input` ھادىسىلىرى
- يەرلىك تور تەركىبى، TypeScript تىپلىرى ۋە تازا ئۆچۈرۈش API سى

## Package and source

Package name: **`@uyghurcommunity/keyboard`**, version **0.1.1**. Install the [GitHub release archive](https://github.com/UyghurCommunity/uyghur-keyboard/releases/tag/v0.1.1) while npm registry publishing is deferred:

```sh
npm install https://github.com/UyghurCommunity/uyghur-keyboard/releases/download/v0.1.1/uyghurcommunity-keyboard-0.1.1.tgz
```

No build step is needed. In this checkout:

```bash
npm test
npm run check
npm pack
python3 -m http.server 4173
```

Open `http://localhost:4173/` for both the vanilla and Web Component demos.

## Vanilla JavaScript

In an npm project with a module bundler:

```js
import { createKeyboard } from '@uyghurcommunity/keyboard';

const input = document.querySelector('textarea');
const keyboard = createKeyboard(input, {
  physical: false,
  direction: 'rtl',
  // container: document.querySelector('#keyboard'),
});

keyboard.insert('سالام');
keyboard.backspace();
keyboard.setPhysicalMapping(true);
keyboard.setVisible(false);
keyboard.destroy();
```

Without a bundler, import `./src/index.js` from a local HTTP server. Mount only after the input is in the document, or supply an attached `container`.

Supported targets: `textarea` and text-selection-capable inputs (`text`, `search`, `tel`, `url`, `password`). `email` and numeric/date inputs do not support the required selection API.

### Options

| Option | Default | Behavior |
| --- | --- | --- |
| `physical` | `false` | Translate supported printable keys while the target is focused. |
| `container` | After the target | Mount in the supplied element or shadow root. |
| `direction` | `rtl` | Set `rtl`, `auto`, or `preserve` the target direction. |
| `label` | Uyghur keyboard label | Accessible name for the keyboard group. |

`destroy()` removes listeners and markup. It restores the target's original direction unless the consumer has changed it while mounted. Repeated destruction is safe. `setVisible(false)` hides virtual keys; physical mapping remains independently controlled.

### Web Component

```html
<textarea id="uyghur-text"></textarea>
<uyghur-keyboard for="uyghur-text"></uyghur-keyboard>

<script type="module">
  import '@uyghurcommunity/keyboard/element';
</script>
```

Use `physical` as a boolean attribute to enable the optional map. The element creates its keyboard in a shadow root and cleans up on disconnect. Change `for` to rebind it to another input. For direct source use, replace the package import with `./src/element.js`. Browser import maps or a bundler are needed for bare npm imports.

Calling `defineUyghurKeyboard()` from the main module registers the component manually. Importing the main package in Node or during server rendering does not access `document` or register elements.

## Phonetic map

This is an explicitly defined convenience map, **not an operating-system keyboard-layout implementation**. It does not automatically transliterate words or insert contextual hamza. Virtual keys provide all Uyghur letters; uppercase mappings provide common additional forms.

```text
Lowercase:
a ا  b ب  c چ  d د  e ە  f ف  g گ  h ھ  i ى  j ج
k ك  l ل  m م  n ن  o و  p پ  q ق  r ر  s س  t ت
u ۇ  v ۆ  w ۋ  x خ  y ي  z ز

Uppercase:
A ئا  E ئە  I ئى  O ئو  U ئۇ  G غ  N ڭ  S ش
V ئۆ  W ئۈ  C ج  Y ې  Z ژ
```

Ctrl, Command, Alt shortcuts, unmapped keys, and active IME composition are passed through. The map is off by default. Native undo grouping for programmatic insertions depends on the host browser; the library does not implement its own undo stack.

## Events

Each edit first emits cancellable `beforeinput` on the target, then applies the edit and emits `input`. A cancelled `beforeinput` leaves the value unchanged. Framework-controlled inputs should update their model from the `input` event.

The keyboard also emits a bubbling, composed `uyghur-input` event:

```js
keyboard.element.addEventListener('uyghur-input', ({ detail }) => {
  console.log(detail.value, detail.inputType, detail.text);
});
```

Disabled, read-only, and actively composing targets reject virtual changes. Virtual buttons are native buttons with accessible labels; using the physical map is optional.

## Pure selection helpers

```js
import { replaceSelection, deleteSelectionBackward } from '@uyghurcommunity/keyboard';

replaceSelection('ab', 1, 1, 'ئ');
// { value: 'aئb', start: 2, end: 2 }

deleteSelectionBackward('A👩‍💻ب', 6, 6);
// { value: 'Aب', start: 1, end: 1 }
```

Offsets are UTF-16 offsets, matching `selectionStart`/`selectionEnd`. Grapheme-aware deletion uses `Intl.Segmenter`; environments without it fall back to whole Unicode code points.

## Contributing

Bug reports with browser details, accessibility fixes, reviewed layout improvements, and integration examples are welcome. Run `npm test` before submitting a pull request. Tests cover selection behavior, composition/shortcut handling, cancellation, lifecycle cleanup, and the Web Component.

## License

[MIT](LICENSE), © 2026 UyghurCommunity. Uyghur typography uses externally linked ALKATIP Basma with system Tahoma/Arial fallbacks. The font is not bundled or covered by this code license. No external dataset is bundled.

## Typography

The demo and keyboard keys use **ALKATIP Basma**, requested from OnlineWebFonts using WOFF2 with WOFF/TTF fallbacks and `font-display: swap`. Font binaries are not included in the package. The font host receives the browser's normal font request; typed text is never included in that request. If loading is blocked, the interface falls back to system fonts.

Standalone keyboard instances register one shared `@font-face` stylesheet in their owner document. This allows the same face to render keys inside Web Component shadow roots. The registration is reference-counted and removed when the last keyboard that owns it is destroyed. A document stylesheet with the ID `uyghur-keyboard-alkatip-font` can supply the face instead; consumer-owned stylesheets are preserved on cleanup.

The `.alkatip-basma` helper sets the font, `direction: rtl`, `unicode-bidi: embed`, and `line-height: 2.2`. Apply it to Uyghur containers; keep explicit LTR code blocks and identifiers in their own direction context. The library styles keyboard keys without changing the consumer's input font or overriding its configured input direction.
