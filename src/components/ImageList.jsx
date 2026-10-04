import ImageCard from './ImageCard.jsx';

export default function ImageList({ items, onRemove, onDownload, onClear, disabled = false }) {
  if (items.length === 0) {
    return (
      <section className="empty-state" aria-labelledby="empty-title">
        <div className="empty-art" aria-hidden="true">
          <span className="empty-art-square empty-art-square--a" />
          <span className="empty-art-square empty-art-square--b" />
          <span className="empty-art-square empty-art-square--c" />
        </div>
        <h2 id="empty-title" className="empty-title">
          No images yet
        </h2>
        <p className="empty-text">Drop a few images above. They will show up here, ready to convert.</p>
      </section>
    );
  }

  return (
    <section className="image-list" aria-labelledby="list-title">
      <div className="section-head">
        <h2 id="list-title" className="section-title">
          Your images <span className="count">{items.length}</span>
        </h2>
        <button type="button" className="text-button" onClick={onClear} disabled={disabled}>
          Clear all
        </button>
      </div>

      <ul className="cards">
        {items.map((item) => (
          <ImageCard key={item.id} item={item} onRemove={onRemove} onDownload={onDownload} />
        ))}
      </ul>
    </section>
  );
}
