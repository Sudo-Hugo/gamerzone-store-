import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productsApi } from '../api/services';
import useFetch from '../utils/useFetch';
import ProductImage from '../components/ProductImage';
import Price from '../components/Price';
import QuantityStepper from '../components/QuantityStepper';
import AddToCartButton from '../components/AddToCartButton';
import FavoriteButton from '../components/FavoriteButton';
import ProductRail from '../components/ProductRail';
import Icon from '../components/Icon';
import { ErrorBox } from '../components/Status';
import { formatPrice, isOnSale } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const { data, error, loading, retry } = useFetch(() => productsApi.get(id), [id]);
  const related = useFetch(() => productsApi.related(id, 8), [id]);

  useEffect(() => {
    setQty(1);
    setTab('desc');
    window.scrollTo({ top: 0 });
  }, [id]);
  // (o Layout já volta ao topo; aqui cobre a troca entre produtos relacionados)

  if (loading)
    return (
      <div className="wrap">
        <div className="detail" aria-hidden="true">
          <div className="sk sk--media sk--round" />
          <div className="stack">
            <div className="sk sk--line sk--short" />
            <div className="sk sk--title" />
            <div className="sk sk--box" />
          </div>
        </div>
        <p className="sr-only" role="status">Carregando produto...</p>
      </div>
    );
  if (error)
    return (
      <div className="wrap">
        <ErrorBox
          message={error.status === 404 || error.status === 400 ? 'Este produto não existe ou foi retirado da loja.' : error.message}
          onRetry={error.status >= 500 || error.status === 0 ? retry : undefined}
        />
        <p className="center">
          <Link to="/loja" className="btn btn--ghost">
            Voltar para a loja
          </Link>
        </p>
      </div>
    );

  const product = data.product;
  const specs = Object.entries(product.specs || {});
  const saving = isOnSale(product) ? Number(product.compare_at_price) - Number(product.price) : 0;

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Você está em">
        <Link to="/">Início</Link>
        <span aria-hidden="true">/</span>
        <Link to="/loja">Loja</Link>
        {product.category_slug && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/loja?category=${product.category_slug}`}>{product.category_name}</Link>
          </>
        )}
      </nav>

      <article className="detail">
        <div className="detail__stage">
          <ProductImage product={product} size="lg" />
          <div className="pcard__badges">
            {product.discount_percent > 0 && <span className="tag tag--sale">-{product.discount_percent}%</span>}
            {product.featured && <span className="tag tag--hot">Destaque</span>}
          </div>
        </div>

        <div className="detail__info">
          {product.brand && (
            <Link to={`/loja?brand=${encodeURIComponent(product.brand)}`} className="detail__brand">
              {product.brand}
            </Link>
          )}
          <h1>{product.name}</h1>

          <div className="buybox">
            <Price product={product} size="xl" showInstallments />
            {saving > 0 && <p className="saving">Você economiza {formatPrice(saving)}</p>}
            <p className={`stock ${product.stock === 0 ? 'stock--out' : product.stock <= 5 ? 'stock--low' : 'stock--ok'}`}>
              {product.stock === 0
                ? 'Esgotado no momento'
                : product.stock <= 5
                  ? `Corra: restam só ${product.stock} unidades`
                  : `Em estoque (${product.stock} unidades)`}
            </p>
            {product.stock > 0 && (
              <div className="detail__buy">
                <QuantityStepper value={qty} max={Math.min(product.stock, 99)} onChange={setQty} />
                <AddToCartButton product={product} quantity={qty} />
                <FavoriteButton product={product} className="favbtn--lg" />
              </div>
            )}
          </div>

          <ul className="perks">
            <li><Icon name="truck" size={20} /> Frete grátis para todo o Brasil</li>
            <li><Icon name="shield" size={20} /> Preço e estoque conferidos na finalização</li>
            <li><Icon name="swap" size={20} /> Cancele enquanto o pedido estiver aguardando pagamento</li>
          </ul>
        </div>
      </article>

      <section className="info">
        <div className="tabs" role="tablist" aria-label="Informações do produto">
          <button role="tab" aria-selected={tab === 'desc'} className={tab === 'desc' ? 'active' : ''} onClick={() => setTab('desc')}>
            Descrição
          </button>
          <button role="tab" aria-selected={tab === 'specs'} className={tab === 'specs' ? 'active' : ''} onClick={() => setTab('specs')}>
            Especificações técnicas
          </button>
        </div>
        {tab === 'desc' ? (
          <div role="tabpanel" className="info__panel" key="desc">
            <p>{product.description || 'Sem descrição.'}</p>
          </div>
        ) : (
          <div role="tabpanel" className="info__panel" key="specs">
            {specs.length ? (
              <table className="specs">
                <tbody>
                  {specs.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">Ficha técnica não cadastrada para este produto.</p>
            )}
          </div>
        )}
      </section>

      {related.data?.products.length > 0 && (
        <div className="section">
          <ProductRail title={`Mais em ${product.category_name}`} subtitle="Outros produtos do mesmo departamento" products={related.data.products} />
        </div>
      )}
    </div>
  );
}
