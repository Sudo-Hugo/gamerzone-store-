import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FieldErrors, { fieldError } from '../components/FieldErrors';

export default function Register() {
  const { register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError({ message: 'As senhas não conferem.', details: [{ field: 'confirm', message: 'Digite a mesma senha nos dois campos.' }] });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(form.name, form.email, form.password);
      notify('Conta criada. Você já está conectado.');
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const err = (f) => fieldError(error, f) && <small className="field__err">{fieldError(error, f)}</small>;

  return (
    <section className="authwrap">
      <div className="authwrap__art" aria-hidden="true">
        <img src="/categories/hardware.svg" alt="" />
        <div>
          <strong>Crie sua conta em segundos</strong>
          <p>Monte o carrinho, acompanhe cada pedido e cancele enquanto ele não foi separado.</p>
        </div>
      </div>
      <div className="auth">
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit} className="stack" noValidate>
        <label className="field">
          <span>Nome</span>
          <input required minLength={2} maxLength={100} autoComplete="name" value={form.name} onChange={set('name')}
            aria-invalid={!!fieldError(error, 'name')} />
          {err('name')}
        </label>
        <label className="field">
          <span>E-mail</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')}
            aria-invalid={!!fieldError(error, 'email')} />
          {err('email')}
        </label>
        <label className="field">
          <span>Senha (mínimo 6 caracteres)</span>
          <input type="password" required minLength={6} maxLength={72} autoComplete="new-password" value={form.password}
            onChange={set('password')} aria-invalid={!!fieldError(error, 'password')} />
          {err('password')}
        </label>
        <label className="field">
          <span>Confirmar senha</span>
          <input type="password" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')}
            aria-invalid={!!fieldError(error, 'confirm')} />
          {err('confirm')}
        </label>
        <FieldErrors error={error} />
        <button className="btn btn--primary btn--lg" disabled={busy}>
          {busy ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      <p className="muted">
        Já tem conta? <Link to="/login" state={location.state}>Entrar</Link>
      </p>
      </div>
    </section>
  );
}
