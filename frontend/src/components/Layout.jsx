import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { cart, reset } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    reset();
    navigate('/');
  };

  return (
    <div className="app">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topbar">
        <div className="wrap topbar__inner">
          <Link to="/" className="logo" aria-label="GamerZone Store, página inicial">
            <span className="logo__mark" aria-hidden="true">GZ</span>
            <span className="logo__text">GamerZone</span>
          </Link>
          <nav className="topnav" aria-label="Principal">
            <NavLink to="/" end>
              Loja
            </NavLink>
            {user && <NavLink to="/pedidos">Meus pedidos</NavLink>}
            {isAdmin && <NavLink to="/admin">Painel admin</NavLink>}
          </nav>
          <div className="topbar__actions">
            {user ? (
              <>
                <span className="hello">Olá, {user.name.split(' ')[0]}</span>
                <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn--ghost btn--sm" to="/login">
                  Entrar
                </Link>
                <Link className="btn btn--sm btn--outline" to="/cadastro">
                  Criar conta
                </Link>
              </>
            )}
            <Link to="/carrinho" className="cartlink" aria-label={`Carrinho com ${cart.item_count} itens`}>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M3 4h2l2.4 11h11.2L21 7H7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                <circle cx="9" cy="19.5" r="1.5" fill="currentColor" />
                <circle cx="17" cy="19.5" r="1.5" fill="currentColor" />
              </svg>
              {cart.item_count > 0 && <span className="cartlink__count">{cart.item_count}</span>}
            </Link>
          </div>
        </div>
      </header>
      <main id="conteudo" className="wrap main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="wrap">
          GamerZone Store · projeto acadêmico de Engenharia de Software. Produtos e pagamentos são fictícios.
        </div>
      </footer>
    </div>
  );
}
