import { OUTPUT_FORMATS } from '../utils/convertImage.js';

// Three big radio "tiles". Native radio inputs keep keyboard and screen reader support.
export default function FormatSelector({ value, onChange, disabled = false }) {
  return (
    <fieldset className="format-selector" disabled={disabled}>
      <legend className="field-label">Convert to</legend>

      <div className="format-tiles">
        {Object.values(OUTPUT_FORMATS).map((format) => (
          <label key={format.key} className={`format-tile format-tile--${format.key}`}>
            <input
              className="visually-hidden"
              type="radio"
              name="output-format"
              value={format.key}
              checked={value === format.key}
              onChange={() => onChange(format.key)}
            />
            <span className="format-tile-ext">.{format.ext}</span>
            <span className="format-tile-name">{format.label}</span>
            <span className="format-tile-hint">{format.hint}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
