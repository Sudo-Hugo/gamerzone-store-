import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../api/services';
import Price from '../components/Price';
import StatusBadge from '../components/StatusBadge';
import { Empty, ErrorBox, Loading } from '../components/Status';
import { formatDate } from '../utils/format';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    ordersApi.listMine().then(({ orders }) => setOrders(orders)).catch((err) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!orders) return <Loading label="Carregando pedidos..." />;
  if (!orders.length)
    return (
      <Empty title="Você ainda não fez nenhum pedido.">
        <Link className="btn btn--primary" to="/">
          Ver produtos
        </Link>
      </Empty>
    );

  return (
    <section>
      <h1>Meus pedidos</h1>
      <ul className="orders">
        {orders.map((o) => (
          <li key={o.id}>
            <Link to={`/pedidos/${o.id}`} className="orderrow">
              <span className="orderrow__id">Pedido #{o.id}</span>
              <span className="muted">{formatDate(o.created_at)}</span>
              <span className="muted">{o.item_count} {o.item_count === 1 ? 'item' : 'itens'}</span>
              <StatusBadge status={o.status} />
              <Price value={o.total} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
