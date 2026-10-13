import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addressesApi, ordersApi } from '../api/services';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import AddressForm from '../components/AddressForm';
import Price from '../components/Price';
import { Empty, ErrorBox, Loading } from '../components/Status';
import { formatZip } from '../utils/format';

export default function Checkout() {
  const { cart, refresh } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  const load = () => {
    setError(null);
    addressesApi
      .list()
      .then(({ addresses }) => {
        setAddresses(addresses);
        setSelected((s) => s ?? addresses[0]?.id ?? null);
        setShowForm(addresses.length === 0);
      })
      .catch((err) => setError(err.message));
  };
  useEffect(load, []);

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const { order } = await ordersApi.create(selected);
      await refresh(); // o servidor esvaziou o carrinho
      notify(`Pedido #${order.id} confirmado!`);
      navigate(`/pedidos/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      notify(err.message, 'bad');
      await refresh(); // estoque pode ter mudado: mostra o carrinho atualizado
    } finally {
      setPlacing(false);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!addresses) return <Loading label="Carregando endereços..." />;
  if (cart.items.length === 0)
    return (
      <Empty title="Não há itens para finalizar.">
        <Link className="btn btn--primary" to="/">
          Ver produtos
        </Link>
      </Empty>
    );

  return (
    <section>
      <h1>Entrega e confirmação</h1>
      <div className="cart">
        <div className="stack">
          <h2 className="h3">Endereço de entrega</h2>
          {addresses.length > 0 && (
            <fieldset className="addrlist">
              <legend className="sr-only">Escolha o endereço</legend>
              {addresses.map((a) => (
                <label key={a.id} className={`addr ${selected === a.id ? 'is-selected' : ''}`}>
                  <input type="radio" name="address" checked={selected === a.id} onChange={() => setSelected(a.id)} />
                  <span>
                    <strong>{a.label}</strong> · {a.recipient}
                    <br />
                    {a.street}, {a.number}
                    {a.complement ? ` – ${a.complement}` : ''} · {a.district}
                    <br />
                    {a.city}/{a.state} · CEP {formatZip(a.zip_code)}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {showForm ? (
            <AddressForm
              onCreated={(a) => {
                setAddresses([a, ...addresses]);
                setSelected(a.id);
                setShowForm(false);
                notify('Endereço salvo.');
              }}
              onCancel={addresses.length ? () => setShowForm(false) : undefined}
            />
          ) : (
            <button className="btn btn--ghost" onClick={() => setShowForm(true)}>
              Adicionar outro endereço
            </button>
          )}

          <h2 className="h3">Pagamento</h2>
          <p className="notice">
            Pagamento simulado: o pedido é registrado como “Aguardando pagamento”. Nenhum dado de cartão é solicitado.
          </p>
        </div>

        <aside className="summary">
          <ul className="summary__items">
            {cart.items.map((it) => (
              <li key={it.product_id}>
                <span>
                  {it.quantity}× {it.name}
                </span>
                <Price value={it.subtotal} size="sm" />
              </li>
            ))}
          </ul>
          <div className="summary__row summary__total">
            <span>Total</span>
            <Price value={cart.total} size="lg" />
          </div>
          <button className="btn btn--primary btn--lg btn--block" disabled={!selected || placing || showForm} onClick={placeOrder}>
            {placing ? 'Confirmando...' : 'Confirmar pedido'}
          </button>
          {!selected && <p className="muted small">Cadastre um endereço para continuar.</p>}
        </aside>
      </div>
    </section>
  );
}
