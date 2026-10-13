import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import Price from './Price';
import AddToCartButton from './AddToCartButton';
import Icon from './Icon';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Banner principal com os produtos em destaque (featured = true no banco).
export default function HeroCarousel({ products }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  useEffect(() => {
    if (paused || count < 2 || reducedMotion()) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [paused, count]);

  if (!count) return null;
  const go = (d) => setIndex((i) => (i + d + count) % count);

  return (
    <section
      className="hero"
      aria-roledescription="carrossel"
      aria-label="Produtos em destaque"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {products.map((p, i) => (
        <article
          key={p.id}
          className={`hero__slide ${i === index ? 'is-active' : ''}`}
          aria-hidden={i !== index}
          aria-roledescription="slide"
          aria-label={`${i + 1} de ${count}`}
        >
          <div className="hero__text">
            <span className="hero__kicker">
              <Icon name="bolt" size={16} filled /> Destaque {p.brand ? `· ${p.brand}` : ''}
            </span>
            <h1 className="hero__title">{p.name}</h1>
            <p className="hero__desc">{p.description}</p>
            <Price product={p} size="xl" showInstallments />
            {i === index && (
              <div className="hero__cta">
                <AddToCartButton product={p} />
                <Link className="btn btn--outline btn--lg" to={`/produto/${p.id}`}>
                  Ver detalhes
                </Link>
              </div>
            )}
          </div>
          <Link to={`/produto/${p.id}`} className="hero__art" tabIndex={-1} aria-hidden="true">
            <ProductImage product={p} size="hero" />
            {p.discount_percent > 0 && <span className="hero__off">-{p.discount_percent}%</span>}
          </Link>
        </article>
      ))}
      {count > 1 && (
        <div className="hero__nav">
          <button className="iconbtn" onClick={() => go(-1)} aria-label="Destaque anterior">
            <Icon name="chevronLeft" />
          </button>
          <div className="hero__dots">
            {products.map((p, i) => (
              <button
                key={p.id}
                className={i === index ? 'is-active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`Ir para ${p.name}`}
                aria-current={i === index}
              />
            ))}
          </div>
          <button className="iconbtn" onClick={() => go(1)} aria-label="Próximo destaque">
            <Icon name="chevronRight" />
          </button>
        </div>
      )}
    </section>
  );
}
