import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

// Botão de adicionar ao carrinho, usado no card e na página do produto.
// variant "card" = botão discreto (contorno); "main" = botão amarelo cheio.
export default function AddToCartButton({ product, quantity = 1, variant = 'main', block = false }) {
  const { user } = useAuth();
  const { add } = useCart();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState('idle'); // idle | busy | done
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);
  const soldOut = product.stock === 0;
  const card = variant === 'card';

  const handleClick = async () => {
    if (!user) {
      notify('Entre na sua conta para montar o carrinho.', 'info');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setState('busy');
    try {
      await add(product.id, quantity);
      setState('done'); // confirmação visual no próprio botão por um instante
      timer.current = setTimeout(() => setState('idle'), 1400);
      if (!card) notify(`${product.name} foi para o carrinho.`);
    } catch (err) {
      setState('idle');
      notify(err.message, 'bad');
    }
  };

  const label = soldOut
    ? 'Esgotado'
    : state === 'busy'
      ? 'Adicionando...'
      : state === 'done'
        ? 'Adicionado'
        : card
          ? 'Adicionar'
          : 'Adicionar ao carrinho';

  return (
    <button
      className={`btn addbtn ${card ? 'btn--card btn--sm' : 'btn--primary btn--lg'} ${block ? 'btn--block' : ''} ${state === 'done' ? 'is-done' : ''}`}
      onClick={handleClick}
      disabled={soldOut || state === 'busy'}
      aria-live="polite"
    >
      {!soldOut && state !== 'busy' && <Icon name={state === 'done' ? 'check' : 'cart'} size={18} />}
      {state === 'busy' && <span className="spinner spinner--sm" aria-hidden="true" />}
      {label}
    </button>
  );
}
