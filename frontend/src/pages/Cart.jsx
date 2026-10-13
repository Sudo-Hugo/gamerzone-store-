import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import Steps from '../components/Steps';
import ProductImage from '../components/ProductImage';
import Price from '../components/Price';
import QuantityStepper from '../components/QuantityStepper';
import { Empty, ErrorBox, Loading } from '../components/Status';
import { formatPrice } from '../utils/format';
import { productsApi } from '../api/services';
import useFetch from '../utils/useFetch';
import ProductRail from '../components/ProductRail';

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, error, refresh, update, remove, clear } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);
  const [leaving, setLeaving] = useState(null);
  const confirm = useConfirm();
  const suggestions = useFetch(() => productsApi.bestSellers(10), []);

  if (!user)
    return (
      <Empty title="Entre na sua conta para ver o carrinho." art="cart">
        <Link className="btn btn--primary" to="/login" state={{ from: '/carrinho' }}>
          Entrar
        </Link>
      </Empty>
    );
  if (loading && cart.items.length === 0) return <Loading label="Carregando carrinho..." />;
  if (error) return <ErrorBox message={error} onRetry={refresh} />;
  if (cart.items.length === 0)
    return (
      <Empty title="Seu carrinho está vazio." art="cart">
        <Link className="btn btn--primary" to="/">
          Ver produtos
        </Link>
      </Empty>
    );

  const act = async (productId, fn, success) => {
    setBusyId(productId);
    try {
      await fn();
      if (success) notify(success);
    } catch (err) {
      notify(err.message, 'bad');
    } finally {
      setBusyId(null);
    }
  };

  // Remove com uma saída suave do item antes de atualizar a lista
  const removeItem = async (it) => {
    setLeaving(it.product_id);
    await new Promise((r) => setTimeout(r, 180));
    await act(it.product_id, () => remove(it.product_id), `${it.name} saiu do carrinho.`);
    setLeaving(null);
  };

  const clearAll = async () => {
    const ok = await confirm({
      title: 'Esvaziar o carrinho?',
      message: `Os ${cart.item_count} itens serão removidos. Os produtos continuam disponíveis na loja.`,
      confirmLabel: 'Esvaziar',
      danger: true,
    });
    if (ok) act('all', clear, 'Carrinho esvaziado.');
  };

  return (
    <section>
      <Steps current={1} />
      <h1>Carrinho</h1>
      <div className="cart">
        <ul className="cart__list">
          {cart.items.map((it) => (
            <li key={it.product_id} className={`cartitem ${leaving === it.product_id ? 'is-leaving' : ''}`}>
              <Link to={`/produto/${it.product_id}`} className="cartitem__img">
                <ProductImage product={it} size="sm" />
              </Link>
              <div className="cartitem__info">
                <Link to={`/produto/${it.product_id}`} className="cartitem__name">{it.name}</Link>
                <span className="muted">{formatPrice(it.unit_price)} cada</span>
                {it.quantity > it.stock && (
                  <span className="stock stock--out">Só restam {it.stock} em estoque</span>
                )}
              </div>
              <QuantityStepper
                value={it.quantity}
                max={Math.min(99, it.stock)}
                disabled={busyId === it.product_id}
                onChange={(q) => act(it.product_id, () => update(it.product_id, q))}
              />
              <Price value={it.subtotal} />
              <button
                className="btn btn--ghost btn--sm"
                disabled={busyId === it.product_id}
                onClick={() => removeItem(it)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <div className="summary__row">
            <span>Itens</span>
            <span>{cart.item_count}</span>
          </div>
          <div className="summary__row summary__total">
            <span>Total</span>
            <Price value={cart.total} size="lg" />
          </div>
          <p className="muted small">Frete grátis nesta demonstração. O total é recalculado pelo servidor na finalização.</p>
          <button className="btn btn--primary btn--lg btn--block" onClick={() => navigate('/checkout')}>
            Continuar para entrega
          </button>
          <button
            className="btn btn--ghost btn--sm btn--block"
            onClick={clearAll}
            disabled={busyId === 'all'}
          >
            Esvaziar carrinho
          </button>
        </aside>
      </div>
      {suggestions.data && (
        <div className="section">
          <ProductRail
            title="Aproveite e leve também"
            subtitle="Os mais vendidos da loja"
            products={suggestions.data.products.filter((p) => !cart.items.some((i) => i.product_id === p.id))}
          />
        </div>
      )}
    </section>
  );
}
