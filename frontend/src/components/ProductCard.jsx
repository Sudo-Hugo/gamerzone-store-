import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import Price from './Price';
import AddToCartButton from './AddToCartButton';

export default function ProductCard({ product }) {
  const lowStock = product.stock > 0 && product.stock <= 5;
  return (
    <article className="pcard">
      <Link to={`/produto/${product.id}`} className="pcard__link">
        <ProductImage product={product} />
        <div className="pcard__body">
          <span className="pcard__cat">{product.category_name || 'Sem categoria'}</span>
          <h3 className="pcard__name">{product.name}</h3>
        </div>
      </Link>
      <div className="pcard__foot">
        <div>
          <Price value={product.price} />
          {product.stock === 0 ? (
            <span className="stock stock--out">Esgotado</span>
          ) : lowStock ? (
            <span className="stock stock--low">Restam {product.stock}</span>
          ) : null}
        </div>
        <AddToCartButton product={product} compact />
      </div>
    </article>
  );
}
