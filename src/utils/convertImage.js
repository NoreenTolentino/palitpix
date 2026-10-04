// All the image conversion logic lives here. It runs fully in the browser.

export const OUTPUT_FORMATS = {
  png: {
    key: 'png',
    label: 'PNG',
    ext: 'png',
    mime: 'image/png',
    lossy: false,
    hint: 'Best quality. Keeps Transparent backgrounds.',
  },
  jpeg: {
    key: 'jpeg',
    label: 'JPEG',
    ext: 'jpg',
    mime: 'image/jpeg',
    lossy: true,
    hint: 'Small files. Transparent areas turn white.',
  },
  webp: {
    key: 'webp',
    label: 'WebP',
    ext: 'webp',
    mime: 'image/webp',
    lossy: true,
    hint: 'Small files. Keeps transparent backgrounds.',
  },
};

export const ACCEPTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'jfif', 'webp', 'gif', 'bmp'];

// Used by the hidden file input. Extensions are listed too because some browsers
// report an empty MIME type for .jfif files.
export const ACCEPT_ATTRIBUTE =
  '.png,.jpg,.jpeg,.jfif,.webp,.gif,.bmp,image/png,image/jpeg,image/webp,image/gif,image/bmp';

const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/pjpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
];

export const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB per image

// An error whose message is safe and helpful to show directly to the user.
export class ConversionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConversionError';
  }
}

export function getExtension(filename) {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex === -1 ? '' : filename.slice(dotIndex + 1).toLowerCase();
}

// Returns an error message if the file can't be used, or null if it is fine.
export function validateFile(file) {
  const typeIsSupported = ACCEPTED_MIME_TYPES.includes(file.type);
  const extensionIsSupported = ACCEPTED_EXTENSIONS.includes(getExtension(file.name));

  if (!typeIsSupported && !extensionIsSupported) {
    return `${file.name} isn't supported. Use PNG, JPEG, JFIF, WebP, GIF or BMP.`;
  }
  if (file.size === 0) {
    return `${file.name} is empty. Choose a different file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} is larger than 30 MB. Choose a smaller image.`;
  }
  return null;
}

// The label shown on the card, e.g. "PNG" or "JFIF".
export function getFormatLabel(file) {
  const extension = getExtension(file.name);
  if (extension) return extension.toUpperCase();
  return (file.type.split('/')[1] || 'Image').toUpperCase();
}

// Decodes the file into something we can draw on a canvas.
// createImageBitmap is fast and handles EXIF rotation. If it fails, fall back to <img>.
async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> approach below.
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () =>
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ConversionError('This image could not be read. The file may be damaged.'));
    };

    image.src = url;
  });
}

// Converts one image file and resolves with the converted Blob.
// formatKey: "png" | "jpeg" | "webp"      quality: 0.1 to 1 (ignored for PNG)
export async function convertImage(file, formatKey, quality = 0.9) {
  const format = OUTPUT_FORMATS[formatKey];
  if (!format) throw new ConversionError('That output format is not supported.');

  const image = await loadImage(file);

  try {
    if (!image.width || !image.height) {
      throw new ConversionError('This image has no size. The file may be damaged.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new ConversionError('Your browser could not prepare the image. Try a different browser.');
    }

    // JPEG has no transparency. Without a background, transparent pixels turn black.
    if (formatKey === 'jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(image.source, 0, 0);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, format.mime, format.lossy ? quality : undefined);
    });

    if (!blob) {
      throw new ConversionError('This image is too large for your browser to convert. Try a smaller one.');
    }

    // Some browsers quietly fall back to PNG when they can't export a format (e.g. old Safari and WebP).
    if (blob.type !== format.mime) {
      throw new ConversionError(`Your browser can't export ${format.label}. Choose another format.`);
    }

    return blob;
  } finally {
    image.release();
  }
}
