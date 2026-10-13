import { useEffect, useState } from 'react';
import { categoriesApi, productsApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import FieldErrors, { fieldError } from '../../components/FieldErrors';
import { ErrorBox, Loading } from '../../components/Status';
import { formatPrice } from '../../utils/format';

const EMPTY = {
  name: '', brand: '', description: '', price: '', compare_at_price: '', stock: '', category_id: '',
  image_url: '', featured: false, specs: '',
};

// Ficha técnica: uma linha por item no formato "Nome: valor"
const specsToText = (specs = {}) => Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n');
const textToSpecs = (text) =>
  Object.fromEntries(
    text
      .split('\n')
      .map((line) => line.split(':'))
      .filter((parts) => parts.length >= 2 && parts[0].trim())
      .map(([k, ...v]) => [k.trim(), v.join(':').trim()])
  );

export default function AdminProducts() {
  const notify = useToast();
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(null); // null = fechado, 'new' ou id
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoadError(null);
    Promise.all([productsApi.listAll(), categoriesApi.list()])
      .then(([p, c]) => {
        setProducts(p.products);
        setCategories(c.categories);
      })
      .catch((err) => setLoadError(err.message));
  };
  useEffect(load, []);

  const open = (product) => {
    setFormError(null);
    if (!product) {
      setEditing('new');
      setForm(EMPTY);
    } else {
      setEditing(product.id);
      setForm({
        name: product.name,
        brand: product.brand || '',
        description: product.description || '',
        price: product.price,
        compare_at_price: product.compare_at_price || '',
        stock: String(product.stock),
        category_id: product.category_id ? String(product.category_id) : '',
        image_url: product.image_url || '',
        featured: !!product.featured,
        specs: specsToText(product.specs),
      });
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      stock: form.stock,
      category_id: form.category_id ? Number(form.category_id) : null,
      image_url: form.image_url || null,
      brand: form.brand || null,
      compare_at_price: form.compare_at_price === '' ? null : form.compare_at_price,
      featured: form.featured,
      specs: textToSpecs(form.specs),
    };
    try {
      if (editing === 'new') await productsApi.create(payload);
      else await productsApi.update(editing, payload);
      notify(editing === 'new' ? 'Produto criado.' : 'Produto atualizado.');
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setSaving(false);
    }
  };

  const confirm = useConfirm();
  const toggleActive = async (p) => {
    if (p.active) {
      const ok = await confirm({
        title: `Desativar "${p.name}"?`,
        message: 'Ele sai da loja e dos carrinhos, mas continua nos pedidos antigos. Dá para reativar depois.',
        confirmLabel: 'Desativar',
        danger: true,
      });
      if (!ok) return;
    }
    try {
      if (p.active) await productsApi.remove(p.id);
      else await productsApi.update(p.id, { active: true });
      notify(p.active ? `"${p.name}" foi desativado.` : `"${p.name}" voltou para a loja.`);
      load();
    } catch (err) {
      notify(err.message, 'bad');
    }
  };

  if (loadError) return <ErrorBox message={loadError} onRetry={load} />;
  if (!products) return <Loading label="Carregando produtos..." />;

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const err = (f) => fieldError(formError, f) && <small className="field__err">{fieldError(formError, f)}</small>;

  return (
    <>
      <div className="row row--between">
        <p className="muted">{products.length} produtos cadastrados. Produtos desativados somem da loja, mas continuam nos pedidos antigos.</p>
        {editing === null && (
          <button className="btn btn--primary" onClick={() => open(null)}>
            Novo produto
          </button>
        )}
      </div>

      {editing !== null && (
        <form className="panel reveal" onSubmit={save}>
          <h2 className="h3">{editing === 'new' ? 'Novo produto' : 'Editar produto'}</h2>
          <div className="grid-form">
            <label className="field field--wide">
              <span>Nome</span>
              <input required value={form.name} onChange={set('name')} />
              {err('name')}
            </label>
            <label className="field">
              <span>Preço (R$)</span>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={set('price')} />
              {err('price')}
            </label>
            <label className="field">
              <span>Estoque</span>
              <input required type="number" min="0" step="1" value={form.stock} onChange={set('stock')} />
              {err('stock')}
            </label>
            <label className="field">
              <span>Categoria</span>
              <select value={form.category_id} onChange={set('category_id')}>
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Marca</span>
              <input value={form.brand} onChange={set('brand')} maxLength={80} />
              {err('brand')}
            </label>
            <label className="field">
              <span>Preço antigo (R$, opcional)</span>
              <input type="number" min="0" step="0.01" value={form.compare_at_price} onChange={set('compare_at_price')} />
              {err('compare_at_price')}
            </label>
            <label className="field field--wide">
              <span>Imagem: URL https://... ou /products/arquivo.svg</span>
              <input value={form.image_url} onChange={set('image_url')} placeholder="https://..." />
              {err('image_url')}
            </label>
            <label className="check field--wide">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Mostrar no banner de destaques da página inicial
            </label>
            <label className="field field--full">
              <span>Ficha técnica (uma linha por item, no formato Nome: valor)</span>
              <textarea rows={4} value={form.specs} onChange={set('specs')} placeholder={'Conexão: USB-C\nPeso: 69 g'} />
              {err('specs')}
            </label>
            <label className="field field--full">
              <span>Descrição</span>
              <textarea rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
            </label>
          </div>
          <FieldErrors error={formError} />
          <div className="row">
            <button className="btn btn--primary" disabled={saving}>
              {saving ? 'Salvando...' : editing === 'new' ? 'Criar produto' : 'Salvar alterações'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th className="num">Preço</th>
              <th className="num">Estoque</th>
              <th>Situação</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={p.active ? '' : 'is-off'}>
                <td>
                  {p.name}
                  {p.featured && <span className="tag tag--hot tag--inline">Destaque</span>}
                  {p.discount_percent > 0 && <span className="tag tag--sale tag--inline">-{p.discount_percent}%</span>}
                </td>
                <td>{p.category_name || '—'}</td>
                <td className="num">{formatPrice(p.price)}</td>
                <td className="num">{p.stock}</td>
                <td>{p.active ? 'Na loja' : 'Desativado'}</td>
                <td className="actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => open(p)}>
                    Editar
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => toggleActive(p)}>
                    {p.active ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
