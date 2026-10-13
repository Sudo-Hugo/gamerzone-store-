import { useCallback, useEffect, useState } from 'react';

// Hook para carregar dados da API com estados de carregando/erro e "tentar de novo".
// `deps` define quando recarregar (ex.: id do produto, filtros).
export default function useFetch(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loader()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err) => alive && setState({ data: null, error: err, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, retry };
}
