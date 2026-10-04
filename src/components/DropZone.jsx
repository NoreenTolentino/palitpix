import { useId, useRef, useState } from 'react';
import { UploadIcon } from './Icons.jsx';
import { ACCEPT_ATTRIBUTE } from '../utils/convertImage.js';

// A big target for dragging images in. The whole area is a <label> for a hidden file input,
// so clicking it or pressing Enter/Space when it has focus opens the file picker.
export default function DropZone({ onFiles, disabled = false, compact = false }) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  // dragenter/dragleave also fire for child elements, so count them to avoid flicker.
  const dragDepth = useRef(0);

  const handleDragEnter = (event) => {
    event.preventDefault();
    dragDepth.current += 1;
    if (!disabled) setIsDragging(true);
  };

  const handleDragOver = (event) => {
    // Always cancel the default, otherwise the browser would open the dropped file in this tab.
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
  };

  const handleDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 0) onFiles(files);
  };

  const handleChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) onFiles(files);
    event.target.value = ''; // lets the same file be chosen again later
  };

  const classes = ['dropzone'];
  if (isDragging) classes.push('is-dragging');
  if (compact) classes.push('is-compact');
  if (disabled) classes.push('is-disabled');

  let title = 'Drop images here';
  if (compact) title = 'Add more images';
  if (isDragging) title = 'Release to add your images';

  const hint = compact
    ? 'Drop them here or choose them from your device.'
    : 'Or choose them from your device. PNG, JPEG, JFIF, WebP, GIF and BMP work, up to 30 MB each.';

  return (
    <label
      htmlFor={inputId}
      className={classes.join(' ')}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id={inputId}
        className="visually-hidden"
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleChange}
        disabled={disabled}
      />

      <span className="dropzone-icon">
        <UploadIcon size={compact ? 22 : 28} />
      </span>

      <span className="dropzone-text">
        <span className="dropzone-title">{title}</span>
        <span className="dropzone-hint">{hint}</span>
      </span>

      <span className="button button--primary dropzone-button" aria-hidden="true">
        Choose images
      </span>
    </label>
  );
}
