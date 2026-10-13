// Indicador das etapas da compra: Carrinho → Entrega → Confirmação
const STEPS = ['Carrinho', 'Entrega', 'Confirmação'];

export default function Steps({ current }) {
  return (
    <ol className="steps" aria-label="Etapas da compra">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'current' : 'todo';
        return (
          <li key={label} className={`steps__item is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="steps__dot">{state === 'done' ? '✓' : n}</span>
            <span className="steps__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
