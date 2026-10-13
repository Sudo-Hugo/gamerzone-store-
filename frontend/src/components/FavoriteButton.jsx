import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

export default function FavoriteButton({ product, className = '' }) {
  const { has, toggle } = useFavorites();
  const notify = useToast();
  const [pop, setPop] = useState(false);
  const active = has(product.id);

  return (
    <button
      type="button"
      className={`favbtn ${active ? 'is-on' : ''} ${pop ? 'is-pop' : ''} ${className}`}
      aria-pressed={active}
      aria-label={active ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
      onAnimationEnd={() => setPop(false)}
      onClick={(e) => {
        e.preventDefault();
        if (!active) setPop(true); // pulinho só ao favoritar
        toggle(product.id);
        notify(active ? 'Removido dos favoritos.' : 'Salvo nos favoritos.', 'info');
      }}
    >
      <Icon name="heart" size={20} filled={active} />
    </button>
  );
}
