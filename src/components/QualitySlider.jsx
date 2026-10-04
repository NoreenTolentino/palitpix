const MIN_QUALITY = 0.1;
const MAX_QUALITY = 1;

// Only shown for JPEG and WebP. PNG is lossless, so it has no quality setting.
export default function QualitySlider({ value, onChange, disabled = false }) {
  const percent = Math.round(value * 100);
  const fillPercent = ((value - MIN_QUALITY) / (MAX_QUALITY - MIN_QUALITY)) * 100;

  const handleChange = (event) => {
    // Round to avoid values like 0.15000000000000002
    onChange(Math.round(Number(event.target.value) * 100) / 100);
  };

  return (
    <div className="quality">
      <div className="quality-head">
        <label htmlFor="quality-range" className="field-label">
          Quality
        </label>
        <output htmlFor="quality-range" className="quality-value">
          {percent}%
        </output>
      </div>

      <input
        id="quality-range"
        className="quality-range"
        type="range"
        min={MIN_QUALITY}
        max={MAX_QUALITY}
        step="0.05"
        value={value}
        disabled={disabled}
        onChange={handleChange}
        aria-valuetext={`${percent} percent`}
        style={{ '--fill': `${fillPercent}%` }}
      />

      <p className="quality-hint">Lower quality makes smaller files.</p>
    </div>
  );
}
