import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import Price from './Price';
import AddToCartButton from './AddToCartButton';
import FavoriteButton from './FavoriteButton';

export default function ProductCard({ product }) {
  const lowStock = product.stock > 0 && product.stock <= 5;
  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link to={`/produto/${product.id}`} tabIndex={-1} aria-hidden="true">
          <ProductImage product={product} />
        </Link>
        <div className="pcard__badges">
          {product.discount_percent > 0 && <span className="tag tag--sale">-{product.discount_percent}%</span>}
          {product.featured && <span className="tag tag--hot">Destaque</span>}
          {lowStock && <span className="tag tag--low">Últimas {product.stock}</span>}
          {product.stock === 0 && <span className="tag tag--out">Esgotado</span>}
        </div>
        <FavoriteButton product={product} className="pcard__fav" />
      </div>
      <div className="pcard__body">
        <span className="pcard__brand">{product.brand || product.category_name}</span>
        <h3 className="pcard__name">
          <Link to={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <Price product={product} showInstallments />
      </div>
      <div className="pcard__foot">
        <AddToCartButton product={product} compact block />
      </div>
    </article>
  );
}
