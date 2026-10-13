import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ordersApi } from '../api/services';
import { useToast } from '../context/ToastContext';
import Price from '../components/Price';
import StatusBadge from '../components/StatusBadge';
import { ErrorBox, Loading } from '../components/Status';
import { formatDate, formatPrice, formatZip } from '../utils/format';

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const notify = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    ordersApi
      .get(id)
      .then(({ order }) => setOrder(order))
      .catch((err) => setError(err.status === 404 || err.status === 400 ? 'Pedido não encontrado.' : err.message));
  }, [id]);

  const cancel = async () => {
    if (!window.confirm(`Cancelar o pedido #${order.id}? Os itens voltam para o estoque.`)) return;
    setCancelling(true);
    try {
      const { order: updated } = await ordersApi.cancel(order.id);
      setOrder(updated);
      notify('Pedido cancelado.');
    } catch (err) {
      notify(err.message, 'bad');
    } finally {
      setCancelling(false);
    }
  };

  if (error)
    return (
      <>
        <ErrorBox message={error} />
        <p className="center">
          <Link to="/pedidos" className="btn btn--ghost">
            Ver meus pedidos
          </Link>
        </p>
      </>
    );
  if (!order) return <Loading label="Carregando pedido..." />;

  return (
    <section>
      {location.state?.justPlaced && (
        <div className="banner" role="status">
          Pedido recebido! Guarde o número <strong>#{order.id}</strong> para acompanhar.
        </div>
      )}
      <div className="orderhead">
        <h1>Pedido #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="muted">Feito em {formatDate(order.created_at)}</p>

      <div className="cart">
        <table className="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th className="num">Preço unit.</th>
              <th className="num">Qtd.</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td>{it.product_id ? <Link to={`/produto/${it.product_id}`}>{it.product_name}</Link> : it.product_name}</td>
                <td className="num">{formatPrice(it.unit_price)}</td>
                <td className="num">{it.quantity}</td>
                <td className="num">{formatPrice(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <aside className="summary">
          <div className="summary__row summary__total">
            <span>Total</span>
            <Price value={order.total} size="lg" />
          </div>
          <h2 className="h3">Entrega</h2>
          <p className="small">
            {order.ship_recipient}
            <br />
            {order.ship_street}, {order.ship_number}
            {order.ship_complement ? ` – ${order.ship_complement}` : ''}
            <br />
            {order.ship_district} · {order.ship_city}/{order.ship_state}
            <br />
            CEP {formatZip(order.ship_zip_code)}
          </p>
          {order.status === 'pending' && (
            <button className="btn btn--danger btn--block" onClick={cancel} disabled={cancelling}>
              {cancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}
