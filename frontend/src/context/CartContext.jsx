import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api/services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY = { items: [], total: '0.00', item_count: 0 };

// O carrinho fica no servidor; aqui guardamos só a última resposta da API.
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    const { cart } = await fn();
    setCart(cart);
    return cart;
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return setCart(EMPTY);
    setLoading(true);
    setError(null);
    try {
      await run(cartApi.get);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, run]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      refresh,
      add: (productId, qty) => run(() => cartApi.add(productId, qty)),
      update: (productId, qty) => run(() => cartApi.update(productId, qty)),
      remove: (productId) => run(() => cartApi.remove(productId)),
      clear: () => run(cartApi.clear),
      reset: () => setCart(EMPTY),
    }),
    [cart, loading, error, refresh, run]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
