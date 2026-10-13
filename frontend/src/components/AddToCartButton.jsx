import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

// Botão de adicionar ao carrinho, usado no card e na página do produto.
export default function AddToCartButton({ product, quantity = 1, compact = false }) {
  const { user } = useAuth();
  const { add } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const soldOut = product.stock === 0;

  const handleClick = async () => {
    if (!user) {
      notify('Entre na sua conta para montar o carrinho.', 'info');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setBusy(true);
    try {
      await add(product.id, quantity);
      notify(`${product.name} foi para o carrinho.`);
    } catch (err) {
      notify(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={`btn btn--primary ${compact ? 'btn--sm' : 'btn--lg'}`}
      onClick={handleClick}
      disabled={soldOut || busy}
    >
      {soldOut ? 'Esgotado' : busy ? 'Adicionando...' : compact ? 'Adicionar' : 'Adicionar ao carrinho'}
    </button>
  );
}
