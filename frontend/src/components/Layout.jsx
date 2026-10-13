import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import Icon from './Icon';

const CATEGORIES = [
  ['perifericos', 'Periféricos'],
  ['hardware', 'Hardware'],
  ['acessorios', 'Acessórios'],
  ['jogos', 'Jogos'],
  ['colecionaveis', 'Colecionáveis'],
];

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { cart, reset } = useCart();
  const { ids: favs } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');

  // Mantém o campo de busca igual ao da URL ao navegar
  useEffect(() => {
    if (location.pathname === '/loja') setQ(params.get('search') || '');
  }, [location.pathname, params]);

  const handleLogout = () => {
    logout();
    reset();
    navigate('/');
  };

  // Cabeçalho compacto depois de rolar um pouco a página
  const [condensed, setCondensed] = useState(false);
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // "Pulo" no contador do carrinho quando a quantidade aumenta
  const [bump, setBump] = useState(false);
  const prevCount = useRef(cart.item_count);
  useEffect(() => {
    if (cart.item_count > prevCount.current) setBump(true);
    prevCount.current = cart.item_count;
  }, [cart.item_count]);

  // Volta ao topo ao trocar de página (mas não ao mudar só os filtros)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const current = location.pathname === '/loja' ? params.get('category') : null;
  const onSale = location.pathname === '/loja' && params.get('on_sale') === 'true';

  return (
    <div className="app">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="promobar">
        <div className="wrap promobar__inner">
          <span>Frete grátis em todo o Brasil</span>
          <span>Até 10x sem juros</span>
          <span>Loja de demonstração: produtos e pagamentos fictícios</span>
        </div>
      </div>
      <header className={`topbar ${condensed ? 'is-condensed' : ''}`}>
        <div className="wrap topbar__inner">
          <Link to="/" className="logo" aria-label="GamerZone Store, página inicial">
            <span className="logo__mark" aria-hidden="true">GZ</span>
            <span className="logo__text">
              GamerZone<small>store</small>
            </span>
          </Link>

          <form
            className="searchbar"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(q.trim() ? `/loja?search=${encodeURIComponent(q.trim())}` : '/loja');
            }}
          >
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar teclado, headset, placa de vídeo..."
              aria-label="Buscar produtos"
              maxLength={100}
            />
            <button type="submit" aria-label="Buscar">
              <Icon name="search" />
            </button>
          </form>

          <div className="topbar__actions">
            {user ? (
              <div className="account">
                <Icon name="user" />
                <span className="account__text">
                  <small>Olá, {user.name.split(' ')[0]}</small>
                  <span className="account__links">
                    <Link to="/pedidos">Meus pedidos</Link>
                    <button type="button" onClick={handleLogout}>
                      Sair
                    </button>
                  </span>
                </span>
              </div>
            ) : (
              <Link to="/login" className="account">
                <Icon name="user" />
                <span className="account__text">
                  <small>Bem-vindo</small>
                  <strong>Entrar ou cadastrar</strong>
                </span>
              </Link>
            )}
            <Link to="/favoritos" className="hdricon" aria-label={`Favoritos (${favs.length})`}>
              <Icon name="heart" />
              {favs.length > 0 && <span className="hdricon__count">{favs.length}</span>}
            </Link>
            <Link
              to="/carrinho"
              className={`hdricon hdricon--cart ${bump ? 'is-bump' : ''}`}
              onAnimationEnd={() => setBump(false)}
              aria-label={`Carrinho com ${cart.item_count} itens`}
            >
              <Icon name="cart" />
              {cart.item_count > 0 && <span className="hdricon__count">{cart.item_count}</span>}
            </Link>
          </div>
        </div>
        <nav className="catnav" aria-label="Categorias">
          <div className="wrap catnav__inner">
            <Link to="/loja?on_sale=true&sort=discount" className={onSale ? 'is-active catnav__sale' : 'catnav__sale'}>
              <Icon name="bolt" size={16} filled /> Ofertas
            </Link>
            {CATEGORIES.map(([slug, name]) => (
              <Link key={slug} to={`/loja?category=${slug}`} className={current === slug ? 'is-active' : ''}>
                {name}
              </Link>
            ))}
            <Link to="/loja" className={location.pathname === '/loja' && !current && !onSale ? 'is-active' : ''}>
              Todos os produtos
            </Link>
            {isAdmin && (
              <NavLink to="/admin" className="catnav__admin">
                Painel admin
              </NavLink>
            )}
          </div>
        </nav>
        <div className="rgbline" aria-hidden="true" />
      </header>

      <main id="conteudo" className="main">
        {/* key: a cada página nova, o conteúdo entra com um fade curto */}
        <div className="page" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="wrap footer__grid">
          <div>
            <Link to="/" className="logo">
              <span className="logo__mark" aria-hidden="true">GZ</span>
              <span className="logo__text">
                GamerZone<small>store</small>
              </span>
            </Link>
            <p className="muted small">
              Projeto acadêmico de Engenharia de Software. Marcas, produtos e pagamentos são fictícios.
            </p>
          </div>
          <nav aria-label="Departamentos">
            <h3>Departamentos</h3>
            {CATEGORIES.map(([slug, name]) => (
              <Link key={slug} to={`/loja?category=${slug}`}>
                {name}
              </Link>
            ))}
          </nav>
          <nav aria-label="Minha conta">
            <h3>Minha conta</h3>
            <Link to="/pedidos">Meus pedidos</Link>
            <Link to="/favoritos">Favoritos</Link>
            <Link to="/carrinho">Carrinho</Link>
            {!user && <Link to="/cadastro">Criar conta</Link>}
          </nav>
          <div>
            <h3>Como funciona</h3>
            <p className="muted small">
              Os preços, o estoque e o total do pedido são sempre conferidos pelo servidor. O pagamento é simulado: o pedido
              fica como “Aguardando pagamento”.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
