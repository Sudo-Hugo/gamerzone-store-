export default function QuantityStepper({ value, min = 1, max = 99, onChange, disabled, label = 'Quantidade' }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Diminuir">
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Aumentar">
        +
      </button>
    </div>
  );
}
