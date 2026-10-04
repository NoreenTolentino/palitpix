// Turns a size in bytes into a short, readable string like "1.2 MB".
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 100 ? Math.round(value) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

// Compares the original size with the converted size.
// Returns { percent, direction } where direction is "smaller", "larger" or "same".
export function getSizeChange(originalSize, newSize) {
  if (!originalSize) return { percent: 0, direction: 'same' };

  const difference = ((originalSize - newSize) / originalSize) * 100;
  const percent = Math.abs(Math.round(difference));

  if (percent === 0) return { percent: 0, direction: 'same' };
  return { percent, direction: difference > 0 ? 'smaller' : 'larger' };
}
