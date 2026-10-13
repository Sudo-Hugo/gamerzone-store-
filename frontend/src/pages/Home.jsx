import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoriesApi, productsApi } from '../api/services';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { Empty, ErrorBox, Loading } from '../components/Status';

// Catálogo: busca, filtros e paginação ficam na URL (?search=&category=...),
// então dá para compartilhar o link de uma busca e o botão "voltar" funciona.
export default function Home() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const filters = {
    search: params.get('search') || '',
    category: params.get('category') || '',
    min_price: params.get('min_price') || '',
    max_price: params.get('max_price') || '',
    sort: params.get('sort') || 'newest',
    page: Number(params.get('page')) || 1,
  };
  const [searchText, setSearchText] = useState(filters.search);
  const [priceDraft, setPriceDraft] = useState({ min: filters.min_price, max: filters.max_price });

  useEffect(() => {
    categoriesApi.list().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  const queryKey = params.toString();
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    productsApi
      .list({ ...Object.fromEntries(new URLSearchParams(queryKey)), limit: 12 })
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [queryKey, reloadKey]);

  // Atualiza um ou mais filtros e volta para a página 1
  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: '', ...changes }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const hasFilters = filters.search || filters.category || filters.min_price || filters.max_price;

  return (
    <>
      <section className="hero">
        <h1 className="hero__title">Escolha sua fase. Monte o seu setup.</h1>
        <p className="hero__sub">Periféricos, hardware, jogos e colecionáveis com estoque conferido na hora da compra.</p>
        <div className="levels" role="list">
          <button
            role="listitem"
            className={`level ${!filters.category ? 'is-active' : ''}`}
            onClick={() => update({ category: '' })}
            aria-pressed={!filters.category}
          >
            <span className="level__name">Tudo</span>
            <span className="level__meta">{categories.reduce((s, c) => s + c.product_count, 0) || '—'} itens</span>
          </button>
          {categories.map((c, i) => (
            <button
              role="listitem"
              key={c.id}
              className={`level ${filters.category === c.slug ? 'is-active' : ''}`}
              onClick={() => update({ category: c.slug })}
              aria-pressed={filters.category === c.slug}
            >
              <span className="level__stage">Fase {i + 1}</span>
              <span className="level__name">{c.name}</span>
              <span className="level__meta">{c.product_count} itens</span>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog" aria-label="Produtos">
        <form
          className="filters"
          onSubmit={(e) => {
            e.preventDefault();
            update({ search: searchText.trim(), min_price: priceDraft.min, max_price: priceDraft.max });
          }}
        >
          <label className="field field--search">
            <span className="sr-only">Buscar produtos</span>
            <input
              type="search"
              placeholder="Buscar por nome ou descrição"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              maxLength={100}
            />
          </label>
          <label className="field field--price">
            <span>Preço mín.</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={priceDraft.min}
              onChange={(e) => setPriceDraft({ ...priceDraft, min: e.target.value })} />
          </label>
          <label className="field field--price">
            <span>Preço máx.</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={priceDraft.max}
              onChange={(e) => setPriceDraft({ ...priceDraft, max: e.target.value })} />
          </label>
          <button className="btn btn--primary">Buscar</button>
          <label className="field field--sort">
            <span>Ordenar</span>
            <select value={filters.sort} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
              <option value="newest">Mais recentes</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome (A–Z)</option>
            </select>
          </label>
        </form>

        <div className="catalog__head">
          <h2>{activeCategory ? activeCategory.name : 'Todos os produtos'}</h2>
          {data && !loading && (
            <p className="muted">
              {data.pagination.total} {data.pagination.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
              {filters.search && <> para “{filters.search}”</>}
            </p>
          )}
          {hasFilters && (
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSearchText('');
                setPriceDraft({ min: '', max: '' });
                setParams({});
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {loading && <Loading label="Carregando produtos..." />}
        {!loading && error && <ErrorBox message={error} onRetry={() => setReloadKey((k) => k + 1)} />}
        {!loading && !error && data?.products.length === 0 && (
          <Empty title="Nenhum produto encontrado com esses filtros.">
            <p className="muted">Tente outra palavra ou remova o filtro de preço.</p>
          </Empty>
        )}
        {!loading && !error && data?.products.length > 0 && (
          <>
            <div className="grid">
              {data.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onChange={(page) => {
                const next = new URLSearchParams(params);
                next.set('page', page);
                setParams(next);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </section>
    </>
  );
}
