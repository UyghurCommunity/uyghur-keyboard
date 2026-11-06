export const alkatipFontFace = `@font-face {
  font-family: "ALKATIP Basma";
  src: url("https://db.onlinewebfonts.com/t/3c16518f40da2fc2901f37666c0556a7.woff2") format("woff2"),
       url("https://db.onlinewebfonts.com/t/3c16518f40da2fc2901f37666c0556a7.woff") format("woff"),
       url("https://db.onlinewebfonts.com/t/3c16518f40da2fc2901f37666c0556a7.ttf") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
export const alkatipHelperStyles = `.alkatip-basma {
  font-family: "ALKATIP Basma", serif;
  direction: rtl;
  unicode-bidi: embed;
  line-height: 2.2;
}`;
export const keyboardStyles = `
${alkatipHelperStyles}
.ug-keyboard{--ug-bg:#f1f3ef;--ug-key:#fff;--ug-ink:#17362f;--ug-line:#ccd7cf;box-sizing:border-box;width:100%;padding:12px;border:1px solid var(--ug-line);border-radius:16px;background:var(--ug-bg);color:var(--ug-ink);font-family:"ALKATIP Basma",Tahoma,Arial,sans-serif;direction:rtl}
.ug-keyboard *{box-sizing:border-box}.ug-keyboard__row{display:flex;justify-content:center;gap:6px;margin-block:6px}.ug-keyboard__key{display:inline-flex;align-items:center;justify-content:center;flex:1;min-width:0;min-height:46px;padding:8px 4px;background:var(--ug-key);color:inherit;border:1px solid var(--ug-line);border-radius:8px;font:22px/1.5 "ALKATIP Basma",Tahoma,Arial,sans-serif;cursor:pointer;box-shadow:0 2px 0 #17362f0a}.ug-keyboard__key:hover{background:#e3ede5}.ug-keyboard__key:active{transform:translateY(1px)}.ug-keyboard__key:focus-visible{outline:2px solid #087866;outline-offset:2px}.ug-keyboard__key[data-action]{font-size:14px}.ug-keyboard__key[data-action=space]{flex:4}.ug-keyboard[hidden]{display:none}.ug-keyboard__key:disabled{opacity:.45;cursor:default}
@media(max-width:420px){.ug-keyboard{padding:8px}.ug-keyboard__row{gap:4px}.ug-keyboard__key{font-size:20px;min-height:42px;padding-inline:2px}}
@media(prefers-reduced-motion:reduce){.ug-keyboard__key:active{transform:none}}
`;
