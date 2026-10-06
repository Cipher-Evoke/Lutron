import React, { useState } from 'react';

export const NATIVE_DATE_PLACEHOLDER = 'DD-MM-YYYY';

/**
 * Native date input with DD-MM-YYYY placeholder overlay.
 * Value/onChange stay in YYYY-MM-DD (browser native format) — display only.
 */
export default function NativeDateInput({
  value,
  onChange,
  style,
  wrapperStyle,
  className = '',
  onFocus,
  onBlur,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value);
  const showPlaceholderOverlay = !hasValue && !focused;

  return (
    <div
      className="native-date-input-wrapper"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: style?.fontSize,
        fontWeight: style?.fontWeight,
        fontFamily: style?.fontFamily,
        ...wrapperStyle,
      }}
    >
      <input
        type="date"
        value={value || ''}
        onChange={onChange}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`native-date-input${showPlaceholderOverlay ? ' native-date-input--empty' : ''} ${className}`.trim()}
        style={style}
        {...rest}
      />
      {showPlaceholderOverlay && (
        <span aria-hidden="true" className="native-date-input-placeholder">
          {NATIVE_DATE_PLACEHOLDER}
        </span>
      )}
    </div>
  );
}
