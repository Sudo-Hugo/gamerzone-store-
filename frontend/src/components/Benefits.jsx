import Icon from './Icon';

const ITEMS = [
  ['truck', 'Frete grátis', 'Para todo o Brasil nesta demonstração'],
  ['card', 'Até 10x sem juros', 'Parcela mínima de R$ 20'],
  ['shield', 'Compra segura', 'Senhas com bcrypt e dados isolados por conta'],
  ['swap', 'Cancelamento fácil', 'Cancele enquanto o pedido não foi separado'],
];

export default function Benefits() {
  return (
    <ul className="benefits">
      {ITEMS.map(([icon, title, text]) => (
        <li key={title}>
          <span className="benefits__icon">
            <Icon name={icon} size={26} />
          </span>
          <span>
            <strong>{title}</strong>
            <small>{text}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
