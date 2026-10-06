import SvgIcon from "@mui/material/SvgIcon";

const BOX_STROKE = "#D1D1D1";
const BOX_STROKE_CHECKED = "#1565C0";
const TICK_BLUE = "#1565C0";

/** Light-theme: white box, gray border, blue tick (Quantum-style). */
export function WhiteThemeCheckboxUncheckedIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        fill="#FFFFFF"
        stroke={BOX_STROKE}
        strokeWidth="1.25"
      />
    </SvgIcon>
  );
}

export function WhiteThemeCheckboxCheckedIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        fill="#FFFFFF"
        stroke={BOX_STROKE_CHECKED}
        strokeWidth="1.25"
      />
      <path
        d="M7 12.5 L11 15.8 L17 8.2"
        fill="none"
        stroke={TICK_BLUE}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

export function WhiteThemeCheckboxIndeterminateIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        fill="#FFFFFF"
        stroke={BOX_STROKE_CHECKED}
        strokeWidth="1.25"
      />
      <rect x="7" y="10.25" width="10" height="2.75" rx="1.25" fill={TICK_BLUE} />
    </SvgIcon>
  );
}
