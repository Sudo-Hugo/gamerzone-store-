import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { productsApi } from '../api/services';
import ProductImage from '../components/ProductImage';
import Price from '../components/Price';
import QuantityStepper from '../components/QuantityStepper';
import AddToCartButton from '../components/AddToCartButton';
import { ErrorBox, Loading } from '../components/Status';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setProduct(null);
    setError(null);
    setQty(1);
    productsApi
      .get(id)
      .then(({ product }) => setProduct(product))
      .catch((err) => setError(err.status === 404 || err.status === 400 ? 'Este produto não existe ou foi retirado da loja.' : err.message));
  }, [id]);

  if (error)
    return (
      <>
        <ErrorBox message={error} />
        <p className="center">
          <Link to="/" className="btn btn--ghost">
            Voltar para a loja
          </Link>
        </p>
      </>
    );
  if (!product) return <Loading label="Carregando produto..." />;

  return (
    <article className="detail">
      <nav className="crumbs" aria-label="Você está em">
        <Link to="/">Loja</Link>
        {product.category_slug && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/?category=${product.category_slug}`}>{product.category_name}</Link>
          </>
        )}
      </nav>
      <div className="detail__grid">
        <ProductImage product={product} size="lg" />
        <div className="detail__info">
          <h1>{product.name}</h1>
          <Price value={product.price} size="lg" />
          <p className="detail__desc">{product.description || 'Sem descrição.'}</p>
          <p className={`stock ${product.stock === 0 ? 'stock--out' : product.stock <= 5 ? 'stock--low' : 'stock--ok'}`}>
            {product.stock === 0 ? 'Esgotado' : `${product.stock} em estoque`}
          </p>
          {product.stock > 0 && (
            <div className="detail__buy">
              <QuantityStepper value={qty} max={Math.min(product.stock, 99)} onChange={setQty} />
              <AddToCartButton product={product} quantity={qty} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
