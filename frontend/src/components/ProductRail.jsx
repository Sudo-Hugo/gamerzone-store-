import { useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import Icon from './Icon';
import { ErrorBox, SkeletonGrid } from './Status';

// Vitrine horizontal com rolagem por setas (e arraste no celular).
export default function ProductRail({ title, subtitle, products, loading, error, onRetry, moreLink }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' });

  return (
    <section className="rail">
      <header className="rail__head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="rail__ctrl">
          {moreLink && (
            <Link className="btn btn--ghost btn--sm" to={moreLink}>
              Ver todos
            </Link>
          )}
          <button className="iconbtn" onClick={() => scroll(-1)} aria-label="Rolar para a esquerda">
            <Icon name="chevronLeft" />
          </button>
          <button className="iconbtn" onClick={() => scroll(1)} aria-label="Rolar para a direita">
            <Icon name="chevronRight" />
          </button>
        </div>
      </header>
      {loading && <SkeletonGrid count={4} rail />}
      {error && <ErrorBox message={error.message} onRetry={onRetry} />}
      {products && (
        <div className="rail__track" ref={ref}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
