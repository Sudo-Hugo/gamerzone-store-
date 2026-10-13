import { Link } from 'react-router-dom';
import { categoriesApi, productsApi } from '../api/services';
import useFetch from '../utils/useFetch';
import HeroCarousel from '../components/HeroCarousel';
import Benefits from '../components/Benefits';
import ProductRail from '../components/ProductRail';
import ProductCard from '../components/ProductCard';
import { ErrorBox, SkeletonGrid } from '../components/Status';

// Ilustração de cada departamento (public/categories/<slug>.svg)
const categoryArt = (slug) => `/categories/${slug}.svg`;

// Página inicial: vitrine montada com dados reais da API.
export default function Home() {
  const featured = useFetch(() => productsApi.list({ featured: true, limit: 6 }), []);
  const offers = useFetch(() => productsApi.list({ on_sale: true, sort: 'discount', limit: 10 }), []);
  const best = useFetch(() => productsApi.bestSellers(10), []);
  const latest = useFetch(() => productsApi.list({ sort: 'newest', limit: 24 }), []);
  const categories = useFetch(() => categoriesApi.list(), []);

  // "Lançamentos" não repete o que já apareceu no banner, nas ofertas e nos mais vendidos
  const shown = new Set(
    [featured.data, offers.data, best.data].flatMap((d) => (d ? d.products.map((p) => p.id) : []))
  );
  const othersReady = [featured, offers, best].every((x) => !x.loading);
  const fresh = othersReady ? latest.data?.products.filter((p) => !shown.has(p.id)).slice(0, 8) : null;

  return (
    <>
      <div className="wrap">
        {featured.loading && <div className="hero hero--skeleton sk" role="status" aria-label="Carregando destaques" />}
        {featured.error && <ErrorBox message={featured.error.message} onRetry={featured.retry} />}
        {featured.data && <HeroCarousel products={featured.data.products} />}
        <Benefits />
      </div>

      <section className="wrap section">
        <header className="section__head">
          <h2>Escolha sua fase</h2>
          <p className="muted">Navegue por departamento</p>
        </header>
        {categories.error && <ErrorBox message={categories.error.message} onRetry={categories.retry} />}
        <div className="cats">
          {categories.data?.categories.map((c) => (
            <Link key={c.id} to={`/loja?category=${c.slug}`} className="cat">
              <span className="cat__art">
                <img src={categoryArt(c.slug)} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
              </span>
              <span className="cat__text">
                <strong>{c.name}</strong>
                <small>{c.product_count} produtos</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="wrap section">
        <ProductRail
          title="Ofertas da semana"
          subtitle="Os maiores descontos primeiro"
          products={offers.data?.products}
          loading={offers.loading}
          error={offers.error}
          onRetry={offers.retry}
          moreLink="/loja?on_sale=true&sort=discount"
        />
      </div>

      <section className="wrap section setup">
        <Link to="/loja?category=perifericos" className="setup__card setup__card--a">
          <span>
            <small>Periféricos</small>
            <strong>Mira, reflexo e conforto</strong>
            <span className="btn btn--primary btn--sm">Ver periféricos</span>
          </span>
          <img src="/products/mouse-gamer-vortex-16000-dpi.svg" alt="" loading="lazy" />
        </Link>
        <Link to="/loja?category=hardware" className="setup__card setup__card--b">
          <span>
            <small>Hardware</small>
            <strong>Mais FPS para o seu setup</strong>
            <span className="btn btn--primary btn--sm">Ver hardware</span>
          </span>
          <img src="/products/monitor-horizon-27-165hz.svg" alt="" loading="lazy" />
        </Link>
      </section>

      <div className="wrap section">
        <ProductRail
          title="Mais vendidos"
          subtitle="Calculado a partir dos pedidos da loja"
          products={best.data?.products}
          loading={best.loading}
          error={best.error}
          onRetry={best.retry}
        />
      </div>

      <section className="wrap section">
        <header className="section__head">
          <h2>Lançamentos</h2>
          <Link to="/loja" className="btn btn--ghost btn--sm">
            Ver catálogo completo
          </Link>
        </header>
        {(latest.loading || !othersReady) && <SkeletonGrid count={4} />}
        {latest.error && <ErrorBox message={latest.error.message} onRetry={latest.retry} />}
        {fresh && (
          <div className="grid">
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
