import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoriesApi, productsApi } from '../api/services';
import useFetch from '../utils/useFetch';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import { Empty, ErrorBox, SkeletonGrid } from '../components/Status';

// Catálogo completo: filtros ficam na URL (?category=&brand=&on_sale=...),
// então dá para compartilhar o link e o botão "voltar" funciona.
export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const categories = useFetch(() => categoriesApi.list(), []);
  const brands = useFetch(() => productsApi.brands(), []);

  const f = Object.fromEntries(params);
  const [price, setPrice] = useState({ min: f.min_price || '', max: f.max_price || '' });
  useEffect(() => setPrice({ min: params.get('min_price') || '', max: params.get('max_price') || '' }), [params]);

  const queryKey = params.toString();
  const list = useFetch(() => productsApi.list({ ...Object.fromEntries(new URLSearchParams(queryKey)), limit: 12 }), [queryKey]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: '', ...changes }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
  };

  const catName = categories.data?.categories.find((c) => c.slug === f.category)?.name;
  const title = f.search ? `Resultados para “${f.search}”` : f.on_sale ? 'Ofertas' : catName || 'Todos os produtos';
  const active = ['category', 'brand', 'on_sale', 'min_price', 'max_price', 'search'].filter((k) => f[k]);

  return (
    <div className="wrap shop">
      <header className="shop__head">
        <div>
          <h1>{title}</h1>
          {list.data && (
            <p className="muted">
              {list.data.pagination.total} {list.data.pagination.total === 1 ? 'produto' : 'produtos'}
            </p>
          )}
        </div>
        <div className="row">
          <button className="btn btn--ghost btn--sm shop__toggle" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <Icon name="filter" size={16} /> Filtros {active.length > 0 && `(${active.length})`}
          </button>
          <label className="field field--inline">
            <span>Ordenar por</span>
            <select value={f.sort || 'newest'} onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
              <option value="newest">Mais recentes</option>
              <option value="discount">Maior desconto</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome (A–Z)</option>
            </select>
          </label>
        </div>
      </header>

      <div className="shop__body">
        <aside className={`filters ${showFilters ? 'is-open' : ''}`} aria-label="Filtros">
          <div className="filters__group">
            <h2>Departamento</h2>
            <button className={`chip ${!f.category ? 'is-on' : ''}`} onClick={() => update({ category: '' })}>
              Todos
            </button>
            {categories.data?.categories.map((c) => (
              <button key={c.id} className={`chip ${f.category === c.slug ? 'is-on' : ''}`} onClick={() => update({ category: c.slug })}>
                {c.name} <small>{c.product_count}</small>
              </button>
            ))}
          </div>

          <div className="filters__group">
            <h2>Promoção</h2>
            <label className="check">
              <input type="checkbox" checked={!!f.on_sale} onChange={(e) => update({ on_sale: e.target.checked ? 'true' : '' })} />
              Somente produtos em oferta
            </label>
          </div>

          <form
            className="filters__group"
            onSubmit={(e) => {
              e.preventDefault();
              update({ min_price: price.min, max_price: price.max });
            }}
          >
            <h2>Faixa de preço</h2>
            <div className="pricerange">
              <label className="field">
                <span>Mín. (R$)</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
              </label>
              <label className="field">
                <span>Máx. (R$)</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
              </label>
            </div>
            <button className="btn btn--outline btn--sm btn--block">Aplicar preço</button>
          </form>

          <div className="filters__group">
            <h2>Marca</h2>
            <select value={f.brand || ''} onChange={(e) => update({ brand: e.target.value })} aria-label="Marca">
              <option value="">Todas as marcas</option>
              {brands.data?.brands.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.product_count})
                </option>
              ))}
            </select>
          </div>

          {active.length > 0 && (
            <button className="btn btn--ghost btn--sm btn--block" onClick={() => setParams({})}>
              Limpar todos os filtros
            </button>
          )}
        </aside>

        <section className="shop__results" aria-live="polite">
          {list.loading && <SkeletonGrid count={8} />}
          {list.error && <ErrorBox message={list.error.message} onRetry={list.retry} />}
          {list.data?.products.length === 0 && (
            <Empty title="Nenhum produto encontrado com esses filtros." art="search">
              <p className="muted">Tente outra palavra, outra marca ou remova o filtro de preço.</p>
              <button className="btn btn--primary" onClick={() => setParams({})}>
                Limpar filtros
              </button>
            </Empty>
          )}
          {list.data?.products.length > 0 && (
            <>
              <div className="grid grid--shop is-fadein" key={queryKey}>
                {list.data.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination
                page={list.data.pagination.page}
                totalPages={list.data.pagination.totalPages}
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
      </div>
    </div>
  );
}
