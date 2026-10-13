import { formatPrice, installments, isOnSale } from '../utils/format';

// Preço estilo placar. Com `product`, mostra também o preço antigo e o parcelamento.
export default function Price({ value, product, size = 'md', showInstallments = false }) {
  const amount = value ?? product?.price;
  const [int, cents] = formatPrice(amount).replace('R$', '').trim().split(',');
  const sale = product && isOnSale(product);
  const parc = showInstallments ? installments(amount) : null;

  return (
    <span className={`pricebox pricebox--${size}`}>
      {sale && (
        <span className="pricebox__was">
          <s>{formatPrice(product.compare_at_price)}</s>
        </span>
      )}
      <span className={`price price--${size}`} aria-label={formatPrice(amount)}>
        <span className="price__cur">R$</span>
        <span className="price__int">{int}</span>
        <span className="price__cents">,{cents}</span>
      </span>
      {parc && (
        <span className="pricebox__parc">
          ou {parc.n}x de {formatPrice(parc.each)} sem juros
        </span>
      )}
    </span>
  );
}
