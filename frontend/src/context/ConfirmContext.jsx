import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// Diálogo de confirmação próprio (substitui o window.confirm do navegador).
// Uso: const confirm = useConfirm(); if (await confirm({ title, message })) { ... }
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const confirmBtn = useRef(null);
  const lastFocus = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        lastFocus.current = document.activeElement;
        setDialog({ confirmLabel: 'Confirmar', cancelLabel: 'Voltar', danger: false, ...opts, resolve });
      }),
    []
  );

  const close = (answer) => {
    dialog?.resolve(answer);
    setDialog(null);
    lastFocus.current?.focus?.();
  };

  useEffect(() => {
    if (!dialog) return undefined;
    confirmBtn.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-msg">
            <h2 id="dlg-title">{dialog.title}</h2>
            <p id="dlg-msg">{dialog.message}</p>
            <div className="dialog__actions">
              <button className="btn btn--ghost" onClick={() => close(false)}>
                {dialog.cancelLabel}
              </button>
              <button ref={confirmBtn} className={`btn ${dialog.danger ? 'btn--dangerfill' : 'btn--primary'}`} onClick={() => close(true)}>
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
