import { useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import DropZone from './components/DropZone.jsx';
import FormatSelector from './components/FormatSelector.jsx';
import QualitySlider from './components/QualitySlider.jsx';
import ImageList from './components/ImageList.jsx';
import { AlertIcon, CloseIcon, DownloadIcon, InfoIcon } from './components/Icons.jsx';
import {
  ConversionError,
  OUTPUT_FORMATS,
  convertImage,
  getFormatLabel,
  validateFile,
} from './utils/convertImage.js';
import { downloadAsZip, downloadBlob, getOutputName } from './utils/downloadFile.js';

const DEFAULT_FORMAT = 'jpeg';
const DEFAULT_QUALITY = 0.9;
const THEME_STORAGE_KEY = 'palitpix-theme';

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// A short pause so the browser can paint the "Converting" state before heavy work starts.
const pause = () => new Promise((resolve) => setTimeout(resolve, 30));

// index.html already set the theme before the page painted, so we just read it.
function getInitialTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [format, setFormat] = useState(DEFAULT_FORMAT);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [items, setItems] = useState([]);
  const [notices, setNotices] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Keep a ref to the latest items so cleanup code can free preview URLs.
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const outputFormat = OUTPUT_FORMATS[format];
  const pendingCount = items.filter((item) => item.status === 'ready' || item.status === 'error').length;
  const doneCount = items.filter((item) => item.status === 'done').length;

  // Apply the theme to <html>.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Without this, dropping a file just outside the drop zone would open it in the tab.
  useEffect(() => {
    const stopBrowserFromOpeningFiles = (event) => event.preventDefault();
    window.addEventListener('dragover', stopBrowserFromOpeningFiles);
    window.addEventListener('drop', stopBrowserFromOpeningFiles);
    return () => {
      window.removeEventListener('dragover', stopBrowserFromOpeningFiles);
      window.removeEventListener('drop', stopBrowserFromOpeningFiles);
    };
  }, []);

  // Free the preview URLs when the app unmounts.
  useEffect(() => {
    return () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked (private mode). The theme still changes for this visit.
    }
  };

  const updateItem = (id, changes) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  // Results only match the settings they were made with, so changing a setting
  // sends finished (or failed) images back to "Ready".
  const resetResults = () => {
    setItems((current) =>
      current.map((item) =>
        item.status === 'done' || item.status === 'error'
          ? { ...item, status: 'ready', result: null, error: null }
          : item
      )
    );
  };

  const handleFormatChange = (nextFormat) => {
    setFormat(nextFormat);
    resetResults();
  };

  const handleQualityChange = (nextQuality) => {
    setQuality(nextQuality);
    resetResults();
  };

  const addFiles = (files) => {
    const accepted = [];
    const messages = [];

    files.forEach((file) => {
      const problem = validateFile(file);
      if (problem) {
        messages.push({ id: createId(), text: problem });
        return;
      }

      accepted.push({
        id: createId(),
        file,
        name: file.name,
        size: file.size,
        formatLabel: getFormatLabel(file),
        previewUrl: URL.createObjectURL(file),
        status: 'ready',
        result: null,
        error: null,
      });
    });

    if (accepted.length > 0) setItems((current) => [...current, ...accepted]);
    setNotices(messages);
  };

  const removeItem = (id) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    setItems((current) => current.filter((entry) => entry.id !== id));
  };

  const clearAll = () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    setNotices([]);
  };

  const convertAll = async () => {
    const targets = items.filter((item) => item.status === 'ready' || item.status === 'error');
    if (targets.length === 0) return;

    // Use the settings from the moment the button was pressed.
    const chosen = OUTPUT_FORMATS[format];
    const chosenQuality = quality;

    setNotices([]);
    setIsConverting(true);

    for (const item of targets) {
      updateItem(item.id, { status: 'converting', error: null });
      await pause();

      try {
        const blob = await convertImage(item.file, chosen.key, chosenQuality);
        updateItem(item.id, {
          status: 'done',
          result: {
            blob,
            size: blob.size,
            label: chosen.label,
            filename: getOutputName(item.name, chosen.ext),
          },
        });
      } catch (error) {
        const message =
          error instanceof ConversionError
            ? error.message
            : 'Something went wrong while converting this image. Try again or choose another file.';
        updateItem(item.id, { status: 'error', error: message });
      }
    }

    setIsConverting(false);
  };

  const downloadOne = (item) => {
    if (item.result) downloadBlob(item.result.blob, item.result.filename);
  };

  const downloadZip = async () => {
    const files = items
      .filter((item) => item.status === 'done' && item.result)
      .map((item) => ({ name: item.result.filename, blob: item.result.blob }));
    if (files.length === 0) return;

    setIsZipping(true);
    try {
      await downloadAsZip(files);
    } catch {
      setNotices([
        {
          id: createId(),
          text: 'The ZIP file could not be created. Download the images one by one instead.',
        },
      ]);
    } finally {
      setIsZipping(false);
    }
  };

  let convertLabel = 'Convert images';
  if (pendingCount > 0) convertLabel = `Convert ${pendingCount} ${pendingCount === 1 ? 'image' : 'images'}`;
  else if (items.length > 0) convertLabel = 'All converted';

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="main">
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="hero-title">
            Change your image format in seconds
          </h1>
          <p className="hero-lead">
            Convert PNG, JPEG, JFIF, WebP and more right in your browser. Nothing is uploaded, so your images stay on
            your device.
          </p>
        </section>

        <DropZone onFiles={addFiles} disabled={isConverting} compact={items.length > 0} />

        {notices.length > 0 && (
          <div className="notices" role="alert">
            <AlertIcon size={20} />
            <div className="notices-list">
              {notices.map((notice) => (
                <p key={notice.id}>{notice.text}</p>
              ))}
            </div>
            <button
              type="button"
              className="icon-button icon-button--small"
              onClick={() => setNotices([])}
              aria-label="Dismiss messages"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        <section className="settings" aria-label="Conversion settings">
          <FormatSelector value={format} onChange={handleFormatChange} disabled={isConverting} />

          {outputFormat.lossy && (
            <QualitySlider value={quality} onChange={handleQualityChange} disabled={isConverting} />
          )}

          <ul className="notes">
            <li className="note">
              <InfoIcon size={18} />
              <span>Converting from JPEG back to PNG will not restore lost quality or transparency.</span>
            </li>
            <li className="note">
              <InfoIcon size={18} />
              <span>Animated GIFs are converted as a single still image.</span>
            </li>
          </ul>
        </section>

        <ImageList
          items={items}
          onRemove={removeItem}
          onDownload={downloadOne}
          onClear={clearAll}
          disabled={isConverting}
        />

        {items.length > 0 && (
          <div className="action-bar">
            <button
              type="button"
              className="button button--primary"
              onClick={convertAll}
              disabled={isConverting || pendingCount === 0}
              aria-busy={isConverting}
            >
              {isConverting && <span className="spinner" aria-hidden="true" />}
              {isConverting ? 'Converting…' : convertLabel}
            </button>

            <button
              type="button"
              className="button button--secondary"
              onClick={downloadZip}
              disabled={isConverting || isZipping || doneCount === 0}
              aria-busy={isZipping}
            >
              {isZipping ? <span className="spinner" aria-hidden="true" /> : <DownloadIcon size={18} />}
              {isZipping ? 'Preparing ZIP…' : 'Download all as ZIP'}
            </button>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>PalitPix runs entirely in your browser. Your images never leave your device.</p>
      </footer>
    </div>
  );
}
