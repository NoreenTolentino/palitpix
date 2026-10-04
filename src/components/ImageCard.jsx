import { useState } from 'react';
import { formatBytes, getSizeChange } from '../utils/formatBytes.js';
import { AlertIcon, ArrowRightIcon, CheckIcon, DownloadIcon, ImageIcon, TrashIcon } from './Icons.jsx';

const STATUS_LABELS = {
  ready: 'Ready',
  converting: 'Converting',
  done: 'Done',
  error: 'Error',
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {status === 'converting' && <span className="spinner" aria-hidden="true" />}
      {status === 'done' && <CheckIcon size={14} />}
      {status === 'error' && <AlertIcon size={14} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function changeText({ percent, direction }) {
  if (direction === 'same') return 'Same size';
  return `${percent}% ${direction}`;
}

export default function ImageCard({ item, onRemove, onDownload }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const { id, name, formatLabel, size, previewUrl, status, result, error } = item;

  const change = result ? getSizeChange(size, result.size) : null;
  const barWidth = result ? Math.min(100, (result.size / size) * 100) : 0;

  return (
    <li className={`image-card is-${status}`}>
      <div className="image-thumb">
        {thumbnailFailed ? (
          <ImageIcon size={26} />
        ) : (
          <img src={previewUrl} alt={`Preview of ${name}`} onError={() => setThumbnailFailed(true)} />
        )}
      </div>

      <div className="image-body">
        <div className="image-title-row">
          <p className="image-name" title={name}>
            {name}
          </p>
          <StatusBadge status={status} />
        </div>

        <div className="image-meta">
          <span className="format-chip">{formatLabel}</span>
          <span className="image-size">{formatBytes(size)}</span>
        </div>

        {status === 'converting' && <div className="progress" aria-hidden="true" />}

        {status === 'done' && result && (
          <div className="size-compare">
            <div className="size-line">
              <span className="size-before">{formatBytes(size)}</span>
              <ArrowRightIcon size={16} />
              <span className="format-chip format-chip--output">{result.label}</span>
              <strong className="size-after">{formatBytes(result.size)}</strong>
              <span className={`change-chip change-chip--${change.direction}`}>{changeText(change)}</span>
            </div>
            <div className={`size-bar size-bar--${change.direction}`} aria-hidden="true">
              <span style={{ width: `${barWidth}%` }} />
            </div>
          </div>
        )}

        {status === 'error' && error && <p className="image-error">{error}</p>}
      </div>

      <div className="image-actions">
        {status === 'done' && result && (
          <button type="button" className="button button--primary button--small" onClick={() => onDownload(item)}>
            <DownloadIcon size={16} />
            Download {result.label}
          </button>
        )}
        <button
          type="button"
          className="icon-button"
          onClick={() => onRemove(id)}
          disabled={status === 'converting'}
          aria-label={`Remove ${name}`}
          title="Remove"
        >
          <TrashIcon size={20} />
        </button>
      </div>
    </li>
  );
}
