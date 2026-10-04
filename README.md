# PalitPix

*Change your image format in seconds.* PalitPix is a free image converter that runs entirely in your browser. Nothing is uploaded to a server, so your images stay on your device.

*[Live demo](https://NoreenTolentino.github.io/palitpix/)*

## Features

- Drag and drop or pick multiple images at once
- Convert between PNG, JPEG and WebP in any direction
- Supports PNG, JPEG, JFIF, WebP, GIF and BMP as input
- Quality slider for JPEG and WebP
- Before and after file size for every image
- Download one file or all of them as a ZIP
- Clear error messages for unsupported or damaged files
- Light and dark mode with a toggle that remembers your choice
- Responsive and keyboard accessible

## Tech stack

- React 18 and Vite
- Plain CSS with design tokens (CSS variables)
- Canvas API for the image conversion
- JSZip for ZIP downloads
- GitHub Pages for hosting

There is no backend and no database.

## How it works

1. The image is decoded with createImageBitmap.
2. It is drawn on an off-screen <canvas>.
3. canvas.toBlob() re-encodes it in the chosen format and quality.
4. The result is saved as a real file with URL.createObjectURL and a download link.

JPEG has no transparency, so a white background is painted first. Otherwise transparent areas would turn black.

## Author

NoreenTolentino 
[GitHub](https://github.com/NoreenTolentino)
