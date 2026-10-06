import { getProcessorId, processorIdsEqual } from './processorId';

/** First CSV field (handles quoted values in column 0). */
function firstCsvField(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('"')) {
    const end = trimmed.indexOf('"', 1);
    if (end > 0) return trimmed.slice(1, end).trim();
  }
  const comma = trimmed.indexOf(',');
  return comma >= 0 ? trimmed.slice(0, comma).trim() : trimmed;
}

/**
 * Validate Area Coordinates CSV processor_id column matches the selected processor.
 * Same column layout as backend `upload_area_coordinates` (row[0] = processor_id).
 */
export async function validateAreaCoordinatesCsvFile(file, expectedProcessorId) {
  const expected = getProcessorId(expectedProcessorId);
  if (expected == null) {
    return { valid: false, error: 'Invalid processor selected.' };
  }

  let text;
  try {
    text = await file.text();
  } catch {
    return { valid: false, error: 'Could not read the CSV file.' };
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { valid: false, error: 'CSV file is empty or missing data rows.' };
  }

  const processorIdsInFile = new Set();
  for (let i = 1; i < lines.length; i += 1) {
    const raw = firstCsvField(lines[i]);
    if (!raw) continue;
    const pid = Number(raw);
    if (!Number.isFinite(pid)) {
      return { valid: false, error: `Invalid processor ID in row ${i + 1}.` };
    }
    processorIdsInFile.add(pid);
  }

  if (processorIdsInFile.size === 0) {
    return { valid: false, error: 'No processor IDs found in CSV. Use the Areas CSV for this processor.' };
  }

  if (processorIdsInFile.size > 1) {
    return {
      valid: false,
      error: 'CSV contains multiple processor IDs. Upload coordinates for one processor at a time.',
    };
  }

  const fileProcessorId = processorIdsInFile.values().next().value;
  if (!processorIdsEqual(fileProcessorId, expected)) {
    return {
      valid: false,
      error: `Processor ID mismatch: CSV has ${fileProcessorId}, but selected processor is ${expected}. Download Areas for this processor and upload matching coordinates.`,
    };
  }

  return { valid: true, processorId: fileProcessorId };
}
