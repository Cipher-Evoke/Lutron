import { pdfjs } from "react-pdf";
import { getValidToken } from "../auth/authToken";
import { resolveApiOrigin } from "../utils/resolveMediaUrl";

/** Runtime API origin (follows page hostname — not baked 127.0.0.1). */
export function getApiMediaBase() {
  return String(resolveApiOrigin()).replace(/\/$/, "");
}

/** @deprecated use getApiMediaBase() — kept for callers that read a constant at load time */
export const API_MEDIA_BASE = (
  process.env.REACT_APP_API_URL || "https://lutron.onrender.com"
).replace(/\/$/, "");

/**
 * Turn a backend media path into an absolute URL the PDF viewer can fetch.
 */
export function resolveFloorPlanMediaUrl(rawPath) {
  if (!rawPath || typeof rawPath !== "string") return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Encode each segment so names like "2nd Floor_511.pdf" load reliably.
  const encodedPath = path
    .split("/")
    .map((segment) => (segment ? encodeURIComponent(segment) : ""))
    .join("/");
  return `${getApiMediaBase()}${encodedPath}`;
}

let workerConfigured = false;

/** Configure pdf.js worker once (version-matched file in /public). */
export function configurePdfJsWorker() {
  if (workerConfigured) return;
  workerConfigured = true;
  const publicUrl = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  pdfjs.GlobalWorkerOptions.workerSrc = `${publicUrl}/pdf.worker.min.mjs?pdfworker=2`;
}

/**
 * react-pdf file descriptor with auth headers for protected floor-plan media.
 * Returns a stable object reference per url+token so <Document file={...}> does not
 * reload when callers remount or re-invoke with the same inputs (avoids
 * "File prop changed but equal" + "Worker was terminated" noise).
 */
const pdfDocumentFileCache = new Map();

export function buildPdfDocumentFile(pdfUrl) {
  if (!pdfUrl) return null;
  const token = getValidToken();
  if (!token) return pdfUrl;

  const cacheKey = `${pdfUrl}\0${token}`;
  const cached = pdfDocumentFileCache.get(cacheKey);
  if (cached) return cached;

  const file = {
    url: pdfUrl,
    httpHeaders: { Authorization: `Bearer ${token}` },
  };
  pdfDocumentFileCache.set(cacheKey, file);
  return file;
}
