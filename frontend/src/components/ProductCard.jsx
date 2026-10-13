import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import Price from './Price';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';

export default function ProductCard({ product }) {
  const lowStock = product.stock > 0 && product.stock <= 5;
  // No máximo dois selos sobre a imagem: desconto primeiro, depois destaque
  const badges = [];
  if (product.stock === 0) badges.push(<span key="out" className="tag tag--out">Esgotado</span>);
  if (product.discount_percent > 0) badges.push(<span key="sale" className="tag tag--sale">-{product.discount_percent}%</span>);
  if (product.featured) badges.push(<span key="hot" className="tag tag--hot">Destaque</span>);

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link to={`/produto/${product.id}`} tabIndex={-1} aria-hidden="true">
          <ProductImage product={product} />
        </Link>
        <div className="pcard__badges">{badges.slice(0, 2)}</div>
        <FavoriteButton product={product} className="pcard__fav" />
      </div>
      <div className="pcard__body">
        <span className="pcard__brand">{product.brand || product.category_name}</span>
        <h3 className="pcard__name">
          <Link to={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <Price product={product} showInstallments />
        {lowStock && <span className="pcard__low">Restam só {product.stock}</span>}
      </div>
      <div className="pcard__foot">
        <AddToCartButton product={product} variant="card" block />
      </div>
    </article>
  );
}
