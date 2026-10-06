import React from "react";
import { IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export function PasswordVisibilityAdornment({ show, onToggle, iconSx, className }) {
  return (
    <InputAdornment position="end">
      <IconButton
        type="button"
        className={className}
        onClick={onToggle}
        onMouseDown={(e) => e.preventDefault()}
        edge="end"
        aria-label={show ? "Hide password" : "Show password"}
        sx={iconSx}
      >
        {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );
}

/** MUI TextField `InputProps` for a password field with show/hide toggle. */
export function buildPasswordVisibilityInputProps(show, setShow, iconSx, className) {
  return {
    endAdornment: (
      <PasswordVisibilityAdornment
        show={show}
        onToggle={() => setShow((prev) => !prev)}
        iconSx={iconSx}
        className={className}
      />
    ),
  };
}
