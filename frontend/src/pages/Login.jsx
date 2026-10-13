import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FieldErrors, { fieldError } from '../components/FieldErrors';

export default function Login() {
  const { login } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(form.email, form.password);
      notify(`Bem-vindo de volta, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="authwrap">
      <div className="authwrap__art" aria-hidden="true">
        <img src="/categories/perifericos.svg" alt="" />
        <div>
          <strong>De volta ao jogo</strong>
          <p>Seu carrinho, seus favoritos e seus pedidos ficam salvos na sua conta.</p>
        </div>
      </div>
      <div className="auth">
      <h1>Entrar</h1>
      <p className="muted">Use sua conta para montar o carrinho e acompanhar pedidos.</p>
      <form onSubmit={handleSubmit} className="stack">
        <label className="field">
          <span>E-mail</span>
          <input type="email" required autoComplete="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!fieldError(error, 'email')} />
        </label>
        <label className="field">
          <span>Senha</span>
          <input type="password" required autoComplete="current-password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <FieldErrors error={error} />
        <button className="btn btn--primary btn--lg" disabled={busy}>
          {busy ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="muted">
        Ainda não tem conta? <Link to="/cadastro" state={location.state}>Criar conta</Link>
      </p>
      <aside className="demo-creds">
        <strong>Contas de demonstração (fictícias)</strong>
        <span>Cliente: cliente@gamerzone.com / cliente123</span>
        <span>Admin: admin@gamerzone.com / admin123</span>
      </aside>
      </div>
    </section>
  );
}
