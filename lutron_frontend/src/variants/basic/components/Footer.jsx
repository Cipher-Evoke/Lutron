import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { FOOTER_VERSION_FONT_SIZE, getAppDisplayVersion } from "../../../utils/appVersion";

const Footer = () => {
  let [roleName, setRoleName] = useState('')
  useEffect(() => {
    let role = localStorage.getItem("role");
    setRoleName(role)
  }, [])
  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        color: "#000000",
        textAlign: "right",
        paddingTop: "5px",
        paddingBottom: "2px",
        paddingLeft: "12px",
        marginTop: "0px",
        height: "auto",
        minHeight: "15px",
        maxHeight: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: roleName === "Superadmin"?"space-between":"flex-end",
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1300,
        // Decorative only — must not intercept Cancel/Save (bottom-right) clicks
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Typography sx={{ color: "#000000", fontSize: FOOTER_VERSION_FONT_SIZE }}>
        {roleName === "Superadmin" && `Version ${getAppDisplayVersion()}`}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, paddingRight: "20px" }}>
        <Typography
          component="span"
          sx={{
            color: "#000000",
            fontSize: FOOTER_VERSION_FONT_SIZE,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Communicating with
        </Typography>
        <img
          src="/assets/loginlogo.png" // Replace with your logo path
          alt="Lutron Logo"
          style={{
            height: "15px",
            marginBottom: "0px",
            /* Wordmark is an image; map artwork to black for contrast on white footer */
            filter: "brightness(0)",
          }}
        />
      </Box>

    </Box>
  );
};

export default Footer;