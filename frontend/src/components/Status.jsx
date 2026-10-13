import EmptyArt from './EmptyArt';

// Estados de tela reutilizados: carregando, erro, vazio e esqueletos.
export function Loading({ label = 'Carregando...' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <EmptyArt name="ghost" />
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn--ghost" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Empty({ title, art = 'box', children }) {
  return (
    <div className="state state--empty">
      <EmptyArt name={art} />
      <p className="state__title">{title}</p>
      {children}
    </div>
  );
}

// Esqueletos: blocos no formato do conteúdo enquanto a API responde
export function SkeletonCard() {
  return (
    <div className="pcard pcard--skeleton" aria-hidden="true">
      <div className="sk sk--media" />
      <div className="pcard__body">
        <div className="sk sk--line sk--short" />
        <div className="sk sk--line" />
        <div className="sk sk--line sk--price" />
      </div>
      <div className="pcard__foot">
        <div className="sk sk--btn" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8, rail = false }) {
  return (
    <div className={rail ? 'rail__track' : 'grid'} role="status" aria-label="Carregando produtos">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
