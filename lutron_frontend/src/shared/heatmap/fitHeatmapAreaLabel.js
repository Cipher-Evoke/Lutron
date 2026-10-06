/**
 * Fit heatmap area-name labels to the polygon bbox and name length.
 * Font sizes are in PDF/SVG user units (same space as coordinates).
 */

/** Bold Arial is wider than regular; stay conservative so glyphs aren't cut. */
const CHAR_WIDTH_FACTOR = 0.66;
const LINE_HEIGHT_FACTOR = 1.2;

function normalizeLabelName(text) {
  return String(text || "")
    .trim()
    .toUpperCase();
}

/**
 * Split area name into up to two balanced display lines.
 * Prefers whole words (LADIES / WASHROOM, CENTRAL / PASSAGE) over first-space cuts.
 */
export function createHeatmapAreaLabelLines(text, { mainLimit = 36, secondLimit = 28 } = {}) {
  const upper = normalizeLabelName(text);
  if (!upper) return [];

  const osMatch = upper.match(/OS[-\s]?([\w\-/]+)/) || upper.match(/\b(\d+[/-]\d+)\b/);
  const os = osMatch
    ? osMatch[0].startsWith("OS")
      ? osMatch[0]
      : `OS-${osMatch[1] || osMatch[0]}`
    : "";

  let main = upper.split("(")[0].trim();
  if (os && main.includes(osMatch[0])) {
    main = main.replace(osMatch[0], " ").replace(/\s+/g, " ").trim();
  }

  const words = main.split(/\s+/).filter(Boolean);
  let lines = [];

  if (!words.length && os) {
    lines = [os];
  } else if (words.length <= 1) {
    lines = os ? [words[0] || os, words[0] ? os : ""].filter(Boolean) : words;
  } else if (words.length === 2) {
    lines = [words[0], words[1]];
    if (os) {
      // Keep room name readable: line1 = words, line2 = OS when present on longer names
      lines = [`${words[0]} ${words[1]}`.slice(0, mainLimit), os];
    }
  } else {
    // Balance by character count so "CENTRAL PASSAGE" / multi-word names wrap evenly.
    const totalChars = words.reduce((n, w) => n + w.length, 0);
    let bestSplit = 1;
    let bestScore = Infinity;
    for (let i = 1; i < words.length; i += 1) {
      const left = words.slice(0, i).join(" ");
      const right = words.slice(i).join(" ");
      const score = Math.abs(left.length - right.length) + Math.max(left.length, right.length) * 0.01;
      if (score < bestScore) {
        bestScore = score;
        bestSplit = i;
      }
    }
    // Prefer earlier split when first chunk is still shorter than ~half (avoids CENT|RAL).
    const leftChars = words.slice(0, bestSplit).join("").length;
    if (leftChars > totalChars * 0.65 && bestSplit > 1) {
      bestSplit -= 1;
    }
    lines = [
      words.slice(0, bestSplit).join(" "),
      words.slice(bestSplit).join(" "),
    ];
    if (os) {
      lines = [lines[0], `${lines[1]} ${os}`.trim()];
    }
  }

  lines = lines
    .map((line, idx) => line.slice(0, idx === 0 ? mainLimit : secondLimit))
    .filter(Boolean);

  return lines.length ? lines : [upper.slice(0, mainLimit)];
}

function measureLinesWidth(lines, fontSize) {
  if (!lines.length) return 0;
  return Math.max(...lines.map((line) => line.length * fontSize * CHAR_WIDTH_FACTOR));
}

function measureLinesHeight(lines, fontSize) {
  return lines.length * fontSize * LINE_HEIGHT_FACTOR;
}

function candidateLineSets(name) {
  const upper = normalizeLabelName(name);
  if (!upper) return [];

  const twoLine = createHeatmapAreaLabelLines(name);
  const oneLine = [upper.split("(")[0].trim()].filter(Boolean);

  const sets = [];
  if (twoLine.length) sets.push(twoLine);
  if (oneLine.length && (oneLine.length !== twoLine.length || oneLine[0] !== twoLine[0])) {
    sets.push(oneLine);
  }
  // Three-word names: try one-word-per-line when height allows (caller picks by font).
  const words = upper.split("(")[0].trim().split(/\s+/).filter(Boolean);
  if (words.length === 3) {
    sets.push([words[0], words[1], words[2]]);
  }
  return sets;
}

/**
 * Choose font size + lines so the full label fits inside the area bbox.
 * Avoids mid-word ellipsis whenever shrinking/wrapping can keep the name intact.
 */
export function fitHeatmapAreaLabel({
  name,
  bboxWidth,
  bboxHeight,
  baseFont = 8,
}) {
  const w = Number(bboxWidth) || 0;
  const h = Number(bboxHeight) || 0;
  const areaSize = Math.min(w, h);
  const availableWidth = Math.max(0, w * 0.92);
  const availableHeight = Math.max(0, h * 0.92);

  if (!name || availableWidth < 4 || availableHeight < 4 || areaSize < 6) {
    return {
      lines: [],
      fontSize: baseFont,
      shouldShowText: false,
      lineHeight: baseFont * LINE_HEIGHT_FACTOR,
      padding: baseFont * 0.12,
      availableWidth,
      availableHeight,
      areaSize,
    };
  }

  const lineSets = candidateLineSets(name);
  if (!lineSets.length) {
    return {
      lines: [],
      fontSize: baseFont,
      shouldShowText: false,
      lineHeight: baseFont * LINE_HEIGHT_FACTOR,
      padding: baseFont * 0.12,
      availableWidth,
      availableHeight,
      areaSize,
    };
  }

  const fits = (size, candidateLines) => {
    if (size <= 0 || !candidateLines.length) return false;
    const tw = measureLinesWidth(candidateLines, size);
    const th = measureLinesHeight(candidateLines, size);
    return tw <= availableWidth && th <= availableHeight;
  };

  // Absolute floor: still readable when zoomed; narrow rooms need to go below 7.
  const absoluteMin = 4;
  const maxFont = Math.min(
    42,
    Math.max(baseFont * 2.2, areaSize * 0.26, 10)
  );

  let best = null;

  for (const lines of lineSets) {
    const longest = Math.max(...lines.map((l) => l.length), 1);
    // Font that would use full width for the longest line.
    const widthCap = availableWidth / (longest * CHAR_WIDTH_FACTOR);
    const heightCap = availableHeight / (lines.length * LINE_HEIGHT_FACTOR);
    let fontSize = Math.min(maxFont, widthCap, heightCap);

    if (fontSize < absoluteMin) {
      continue;
    }

    // Nudge down until it truly fits (float safety).
    while (fontSize > absoluteMin && !fits(fontSize, lines)) {
      fontSize -= 0.25;
    }

    if (!fits(fontSize, lines)) {
      continue;
    }

    fontSize = Math.round(fontSize * 10) / 10;
    if (!best || fontSize > best.fontSize || (fontSize === best.fontSize && lines.length < best.lines.length)) {
      best = { lines, fontSize };
    }
  }

  // Last resort: shrink a single truncated line rather than clipping glyphs in the SVG.
  if (!best) {
    const full = normalizeLabelName(name).split("(")[0].trim() || normalizeLabelName(name);
    let fontSize = Math.max(absoluteMin, Math.min(maxFont, availableHeight / LINE_HEIGHT_FACTOR));
    let maxChars = Math.max(
      3,
      Math.floor(availableWidth / (fontSize * CHAR_WIDTH_FACTOR))
    );
    while (fontSize > absoluteMin && maxChars < Math.min(full.length, 4)) {
      fontSize -= 0.5;
      maxChars = Math.max(
        3,
        Math.floor(availableWidth / (fontSize * CHAR_WIDTH_FACTOR))
      );
    }
    const lines =
      full.length > maxChars
        ? [`${full.slice(0, Math.max(2, maxChars - 1))}…`]
        : [full];
    best = { lines, fontSize: Math.round(fontSize * 10) / 10 };
  }

  return {
    lines: best.lines,
    fontSize: best.fontSize,
    shouldShowText: best.lines.length > 0,
    lineHeight: best.fontSize * LINE_HEIGHT_FACTOR,
    padding: best.fontSize * 0.12,
    availableWidth,
    availableHeight,
    areaSize,
  };
}
