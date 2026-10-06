import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  let [roleName, setRoleName] = useState('')
  useEffect(() => {
    let role = localStorage.getItem("role");
    setRoleName(role)
  }, [])
  return (
    <Box
      sx={{
        backgroundColor: "ffffff",
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
      }}
    >
      <Typography>
        {roleName === "Superadmin" && `Version ${process.env.REACT_APP_VERSION}`}
      </Typography>
      <img
        src="/assets/loginlogo.png" // Replace with your logo path
        alt="Lutron Logo"
        style={{ height: "15px", marginBottom: "0px", paddingRight: "20px" }}
      />

    </Box>
  );
};

export default Footer;