import { useState } from 'react';
import { addressesApi } from '../api/services';
import FieldErrors, { fieldError } from './FieldErrors';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const EMPTY = { label: 'Casa', recipient: '', street: '', number: '', complement: '', district: '', city: '', state: 'PR', zip_code: '' };

export default function AddressForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { address } = await addressesApi.create(form);
      onCreated(address);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <label className={`field ${props.wide ? 'field--wide' : ''}`}>
      <span>{label}</span>
      <input value={form[name]} onChange={set(name)} aria-invalid={!!fieldError(error, name)} {...props} wide={undefined} />
      {fieldError(error, name) && <small className="field__err">{fieldError(error, name)}</small>}
    </label>
  );

  return (
    <form className="addrform" onSubmit={handleSubmit}>
      <div className="grid-form">
        {field('recipient', 'Quem vai receber', { required: true, wide: true, autoComplete: 'name' })}
        {field('zip_code', 'CEP', { required: true, inputMode: 'numeric', placeholder: '00000-000', autoComplete: 'postal-code' })}
        {field('street', 'Rua', { required: true, wide: true, autoComplete: 'address-line1' })}
        {field('number', 'Número', { required: true })}
        {field('complement', 'Complemento (opcional)')}
        {field('district', 'Bairro', { required: true })}
        {field('city', 'Cidade', { required: true, autoComplete: 'address-level2' })}
        <label className="field">
          <span>UF</span>
          <select value={form.state} onChange={set('state')}>
            {UFS.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </select>
        </label>
        {field('label', 'Apelido do endereço')}
      </div>
      <FieldErrors error={error} />
      <div className="row">
        <button className="btn btn--primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar endereço'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
