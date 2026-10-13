// Linha do tempo do pedido. O caminho normal tem 4 etapas; cancelado é um desvio.
const FLOW = [
  ['pending', 'Pedido recebido'],
  ['processing', 'Em separação'],
  ['shipped', 'Enviado'],
  ['delivered', 'Entregue'],
];

export default function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="timeline timeline--cancelled" role="status">
        <span className="timeline__x" aria-hidden="true">✕</span>
        Pedido cancelado. Os itens voltaram para o estoque.
      </div>
    );
  }
  const reached = FLOW.findIndex(([s]) => s === status);
  return (
    <ol className="timeline" aria-label="Andamento do pedido">
      {FLOW.map(([s, label], i) => (
        <li key={s} className={i < reached ? 'is-done' : i === reached ? 'is-current' : ''} aria-current={i === reached ? 'step' : undefined}>
          <span className="timeline__dot" aria-hidden="true" />
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
