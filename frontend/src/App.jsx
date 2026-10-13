import { Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Favorites from './pages/Favorites';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Admin from './pages/admin/Admin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import NotFound from './pages/NotFound';

// Páginas de conteúdo estreito (formulários, carrinho, pedidos) ficam dentro da largura padrão
const Contained = () => (
  <div className="wrap">
    <Outlet />
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="loja" element={<Shop />} />
        <Route path="favoritos" element={<Favorites />} />
        <Route path="produto/:id" element={<ProductDetail />} />
        <Route element={<Contained />}>
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="pedidos" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="pedidos/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>}>
          <Route index element={<AdminProducts />} />
          <Route path="pedidos" element={<AdminOrders />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
