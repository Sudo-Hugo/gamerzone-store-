import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import { Empty, ErrorBox, Loading } from '../../components/Status';
import { formatDate, formatPrice, NEXT_STATUS, ORDER_STATUS, STATUS_ACTION } from '../../utils/format';

export default function AdminOrders() {
  const notify = useToast();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setError(null);
    ordersApi.listAll().then(({ orders }) => setOrders(orders)).catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const change = async (order, status) => {
    if (status === 'cancelled' && !window.confirm(`Cancelar o pedido #${order.id}? Os itens voltam para o estoque.`)) return;
    setBusy(order.id);
    try {
      await ordersApi.updateStatus(order.id, status);
      notify(`Pedido #${order.id}: ${ORDER_STATUS[status].label}.`);
      load();
    } catch (err) {
      notify(err.message, 'bad');
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!orders) return <Loading label="Carregando pedidos..." />;
  if (!orders.length) return <Empty title="Nenhum pedido feito na loja ainda." />;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Data</th>
            <th className="num">Total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link to={`/pedidos/${o.id}`}>#{o.id}</Link>
              </td>
              <td>
                {o.user_name}
                <br />
                <span className="muted small">{o.user_email}</span>
              </td>
              <td>{formatDate(o.created_at)}</td>
              <td className="num">{formatPrice(o.total)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td className="actions">
                {NEXT_STATUS[o.status].length === 0 && <span className="muted small">Finalizado</span>}
                {NEXT_STATUS[o.status].map((s) => (
                  <button
                    key={s}
                    className={`btn btn--sm ${s === 'cancelled' ? 'btn--ghost' : 'btn--outline'}`}
                    disabled={busy === o.id}
                    onClick={() => change(o, s)}
                  >
                    {STATUS_ACTION[s]}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
