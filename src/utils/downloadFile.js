// Helpers for naming and saving converted files.

// "holiday.photo.png" -> "holiday.photo"
export function getBaseName(filename) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
}

// "holiday.png" + "jpg" -> "holiday.jpg"
export function getOutputName(originalName, extension) {
  return `${getBaseName(originalName)}.${extension}`;
}

// Saves a Blob to the user's device as a real file.
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // Wait a moment before revoking so every browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// If two files end up with the same name, add " (2)", " (3)" and so on.
function makeUniqueName(name, usedNames) {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const base = getBaseName(name);
  const extension = name.slice(base.length); // includes the dot
  let counter = 2;
  let candidate = `${base} (${counter})${extension}`;

  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }

  usedNames.add(candidate);
  return candidate;
}

// files: [{ name, blob }]. JSZip is loaded only when needed, so the first page load stays small.
export async function downloadAsZip(files, zipName = 'palitpix-converted.zip') {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const usedNames = new Set();

  files.forEach(({ name, blob }) => {
    zip.file(makeUniqueName(name, usedNames), blob);
  });

  // Images are already compressed, so storing them as-is is faster.
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  downloadBlob(zipBlob, zipName);
}
