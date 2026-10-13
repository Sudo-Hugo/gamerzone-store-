import { Link } from 'react-router-dom';
import { productsApi } from '../api/services';
import { useFavorites } from '../context/FavoritesContext';
import useFetch from '../utils/useFetch';
import ProductCard from '../components/ProductCard';
import { Empty, ErrorBox, Loading } from '../components/Status';

export default function Favorites() {
  const { ids } = useFavorites();
  // Busca cada favorito na API; produtos retirados da loja (404) são ignorados.
  const favs = useFetch(
    () => Promise.all(ids.map((id) => productsApi.get(id).then((r) => r.product).catch(() => null))),
    [ids.join(',')]
  );

  if (!ids.length)
    return (
      <div className="wrap">
        <Empty title="Você ainda não favoritou nenhum produto.">
          <p className="muted">Toque no coração de um produto para guardar aqui.</p>
          <Link className="btn btn--primary" to="/loja">
            Explorar a loja
          </Link>
        </Empty>
      </div>
    );

  const products = favs.data?.filter(Boolean) || [];
  return (
    <section className="wrap">
      <h1>Favoritos</h1>
      <p className="muted">Sua lista fica salva neste navegador.</p>
      {favs.loading && <Loading />}
      {favs.error && <ErrorBox message={favs.error.message} onRetry={favs.retry} />}
      {favs.data && (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
