import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  buildPdfDocumentFile,
  configurePdfJsWorker,
  resolveFloorPlanMediaUrl,
} from './floorPlanPdf';

configurePdfJsWorker();

const DEFAULT_PAGE_WIDTH = 420;

/**
 * Resolve preview input for react-pdf (File/Blob, blob URL, or API media path/URL).
 * Encodes media paths the same way as heatmap/FOFP so names with spaces load.
 */
function resolvePdfFile(source) {
  if (!source) return null;
  if (typeof source !== 'string') return source; // File | Blob

  if (source.startsWith('blob:') || source.startsWith('data:')) {
    return source;
  }

  // Absolute URL (may include cache-bust query) — keep query, encode pathname if needed.
  if (/^https?:\/\//i.test(source)) {
    try {
      const parsed = new URL(source);
      const encodedPath = parsed.pathname
        .split('/')
        .map((segment) => {
          if (!segment) return '';
          try {
            return encodeURIComponent(decodeURIComponent(segment));
          } catch {
            return encodeURIComponent(segment);
          }
        })
        .join('/');
      parsed.pathname = encodedPath;
      return buildPdfDocumentFile(parsed.toString());
    } catch {
      return buildPdfDocumentFile(source);
    }
  }

  // Relative API media path
  const absolute = resolveFloorPlanMediaUrl(source);
  return absolute ? buildPdfDocumentFile(absolute) : null;
}

/**
 * In-app floor PDF preview (pdf.js canvas). Avoids Chrome PDF <iframe>
 * which can block DevTools under org policy when that viewer frame is focused.
 */
export default function FloorPlanPdfPreview({
  source = null,
  emptyLabel = 'No Document Selected',
  emptyTextColor,
  maxHeight = 240,
}) {
  const containerRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(DEFAULT_PAGE_WIDTH);
  const [loadError, setLoadError] = useState(false);

  const file = useMemo(() => resolvePdfFile(source), [source]);
  const fileKey =
    typeof source === 'string'
      ? source
      : source && typeof source === 'object' && 'name' in source && 'size' in source && 'lastModified' in source
        ? `${source.name}-${source.size}-${source.lastModified}`
        : String(Boolean(source));

  useEffect(() => {
    setLoadError(false);
  }, [fileKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const next = Math.floor(el.clientWidth);
      if (next > 0) {
        setPageWidth(next);
      }
    };

    updateWidth();
    const raf = requestAnimationFrame(updateWidth);
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateWidth) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', updateWidth);
    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [fileKey]);

  if (!file) {
    return (
      <Typography
        variant="body2"
        sx={{ color: emptyTextColor || 'inherit', textAlign: 'center', px: 1 }}
      >
        {emptyLabel}
      </Typography>
    );
  }

  if (loadError) {
    return (
      <Typography
        variant="body2"
        sx={{ color: emptyTextColor || 'inherit', textAlign: 'center', px: 1 }}
      >
        Unable to preview PDF
      </Typography>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: maxHeight,
        height: maxHeight,
        maxHeight,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <Document
        key={fileKey}
        file={file}
        loading={
          <CircularProgress size={24} sx={{ color: emptyTextColor || '#fff' }} />
        }
        onLoadError={() => setLoadError(true)}
        error={
          <Typography variant="body2" sx={{ color: emptyTextColor || 'inherit', px: 1 }}>
            Unable to preview PDF
          </Typography>
        }
      >
        <Page
          pageNumber={1}
          width={Math.max(pageWidth - 8, 120)}
          renderAnnotationLayer={false}
          renderTextLayer={false}
        />
      </Document>
    </Box>
  );
}
