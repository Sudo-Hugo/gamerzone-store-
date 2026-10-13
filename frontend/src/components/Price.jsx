import { formatPrice } from '../utils/format';

// Preço no estilo "placar": a parte inteira grande, centavos menores.
export default function Price({ value, size = 'md' }) {
  const [int, cents] = formatPrice(value).replace('R$', '').trim().split(',');
  return (
    <span className={`price price--${size}`} aria-label={formatPrice(value)}>
      <span className="price__cur">R$</span>
      <span className="price__int">{int}</span>
      <span className="price__cents">,{cents}</span>
    </span>
  );
}
