import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

export default function FavoriteButton({ product, className = '' }) {
  const { has, toggle } = useFavorites();
  const notify = useToast();
  const active = has(product.id);

  return (
    <button
      type="button"
      className={`favbtn ${active ? 'is-on' : ''} ${className}`}
      aria-pressed={active}
      aria-label={active ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
      onClick={(e) => {
        e.preventDefault();
        toggle(product.id);
        notify(active ? 'Removido dos favoritos.' : 'Salvo nos favoritos.', 'info');
      }}
    >
      <Icon name="heart" size={20} filled={active} />
    </button>
  );
}
