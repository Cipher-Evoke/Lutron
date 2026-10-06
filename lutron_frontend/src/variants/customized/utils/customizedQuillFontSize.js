import Quill from 'quill';

/** Word-style numeric font sizes for customized Settings Home description editor. */
export const CUSTOMIZED_HOME_FONT_SIZE_WHITELIST = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '26px',
  '28px',
  '36px',
  '48px',
  '72px',
];

// Style-only size (px whitelist). Do not register class size — that warns
// "Overwriting formats/size with ClassAttributor" and is unused here.
const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = CUSTOMIZED_HOME_FONT_SIZE_WHITELIST;
Quill.register(SizeStyle, true);
