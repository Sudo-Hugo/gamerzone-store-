import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

// Favoritos ficam salvos no navegador (localStorage), separados por usuário.
// É uma lista de desejos local: não vai para o servidor.
const FavoritesContext = createContext(null);

const keyFor = (user) => `gz_favs_${user ? user.id : 'visitante'}`;
const read = (key) => {
  try {
    const ids = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(ids) ? ids.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
};

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const key = keyFor(user);
  const [ids, setIds] = useState(() => read(key));

  useEffect(() => setIds(read(key)), [key]);

  const save = useCallback(
    (next) => {
      setIds(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* navegação privada: mantém só em memória */
      }
    },
    [key]
  );

  const value = useMemo(
    () => ({
      ids,
      has: (id) => ids.includes(id),
      toggle: (id) => save(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]),
    }),
    [ids, save]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
