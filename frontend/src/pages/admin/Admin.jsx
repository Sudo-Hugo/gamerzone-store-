import { NavLink, Outlet } from 'react-router-dom';

export default function Admin() {
  return (
    <section>
      <h1>Painel administrativo</h1>
      <nav className="tabs" aria-label="Seções do painel">
        <NavLink to="/admin" end>
          Produtos
        </NavLink>
        <NavLink to="/admin/pedidos">Pedidos</NavLink>
      </nav>
      <Outlet />
    </section>
  );
}
