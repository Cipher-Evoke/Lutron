import React from 'react';

export function buildExportMenuItemStyle({
  padding,
  fontSize,
  textColor,
  mutedColor,
  dividerColor,
  disabled,
  withDivider,
}) {
  return {
    width: '100%',
    padding,
    border: 'none',
    background: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    fontSize,
    color: disabled ? mutedColor : textColor,
    fontWeight: '500',
    ...(withDivider ? { borderBottom: `1px solid ${dividerColor}` } : {}),
    opacity: disabled ? 0.6 : 1,
  };
}

export default function ExportMenuAction({
  label,
  loading = false,
  disabled = false,
  onClick,
  withDivider = false,
  item = {},
}) {
  const isDisabled = disabled || loading;
  const {
    padding = '12px 16px',
    fontSize = '14px',
    textColor = 'rgba(0, 0, 0, 0.87)',
    mutedColor = 'rgba(0, 0, 0, 0.45)',
    dividerColor = 'rgba(0, 0, 0, 0.12)',
  } = item;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
      disabled={isDisabled}
      style={buildExportMenuItemStyle({
        padding,
        fontSize,
        textColor,
        mutedColor,
        dividerColor,
        disabled: isDisabled,
        withDivider,
      })}
    >
      {label}
    </button>
  );
}
