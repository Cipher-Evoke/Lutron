import Quill from 'quill';

/** Word-style numeric font sizes for Settings Home description editors. */
export const HOME_FONT_SIZE_WHITELIST = [
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

const SizeStyle = Quill.import('attributors/style/size');
SizeStyle.whitelist = HOME_FONT_SIZE_WHITELIST;
Quill.register(SizeStyle, true);
