/** Settings Home Quill toolbar + font-size picker (customized variant only). */
export const customizedSettingsHomeQuillSx = {
  backgroundColor: '#eee',
  borderRadius: '8px',
  overflow: 'visible',
  mb: 2,
  position: 'relative',
  zIndex: 2,
  '& .quill': {
    backgroundColor: '#eee',
    borderRadius: '8px',
  },
  '& .ql-toolbar.ql-snow': {
    backgroundColor: '#fff',
    border: 'none',
    borderBottom: '1px solid #d8d8d8',
    padding: '8px 10px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    boxSizing: 'border-box',
    lineHeight: 1.4,
    overflow: 'visible',
  },
  '& .ql-toolbar.ql-snow .ql-formats': {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: '12px',
    marginBottom: '4px',
  },
  '& .ql-toolbar.ql-snow button': {
    width: 28,
    height: 28,
    padding: '3px 5px',
  },
  '& .ql-toolbar.ql-snow .ql-picker': {
    color: '#444',
    height: 28,
    position: 'relative',
  },
  '& .ql-toolbar.ql-snow .ql-picker.ql-size': {
    width: 58,
  },
  '& .ql-toolbar.ql-snow .ql-color-picker': {
    width: 28,
  },
  '& .ql-toolbar.ql-snow .ql-icon-picker': {
    width: 28,
  },
  '& .ql-toolbar.ql-snow .ql-picker-label': {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 4px',
  },
  '& .ql-toolbar.ql-snow .ql-picker-label svg': {
    display: 'block',
  },
  '& .ql-toolbar.ql-snow .ql-picker-options': {
    display: 'none',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 200,
    maxHeight: 280,
    overflowY: 'auto',
    color: '#444',
  },
  '& .ql-toolbar.ql-snow .ql-picker.ql-expanded': {
    zIndex: 201,
  },
  '& .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options': {
    display: 'block',
  },
  '& .ql-toolbar.ql-snow .ql-picker.ql-size .ql-picker-item::before': {
    color: '#444',
    display: 'inline-block',
    lineHeight: '22px',
  },
  '& .ql-toolbar.ql-snow .ql-picker.ql-size .ql-picker-label::before': {
    color: '#444',
    display: 'inline-block',
    lineHeight: '22px',
  },
  '& .ql-toolbar.ql-snow .ql-stroke': {
    stroke: '#444',
  },
  '& .ql-toolbar.ql-snow .ql-fill': {
    fill: '#444',
  },
  '& .ql-container.ql-snow': {
    backgroundColor: '#eee',
    border: 'none',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    fontSize: '14px',
  },
  '& .ql-editor': {
    minHeight: 120,
    fontSize: '14px',
    lineHeight: 1.5,
    padding: '12px 15px',
    color: '#000',
    backgroundColor: '#eee',
  },
  '& .ql-editor.ql-blank::before': {
    fontStyle: 'normal',
    color: 'rgba(0,0,0,0.45)',
    left: 15,
  },
};
