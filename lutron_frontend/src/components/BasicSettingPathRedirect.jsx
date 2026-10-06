import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { stripBasicSettingsPrefix } from "../utils/variantRouteMap";

/** Redirect `/setting/...` URLs to legacy paths (advanced/customized). */
export default function BasicSettingPathRedirect() {
  const location = useLocation();
  const target = stripBasicSettingsPrefix(location.pathname);
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />;
}
