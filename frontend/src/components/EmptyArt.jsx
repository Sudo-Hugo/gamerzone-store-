// Pequenas ilustrações em traço para telas vazias, no mesmo estilo da loja.
const ART = {
  cart: (
    <>
      <path d="M22 30h10l9 44h46l9-30H40" />
      <circle cx="48" cy="86" r="5" />
      <circle cx="80" cy="86" r="5" />
      <path className="accent" d="M58 46l10 10M68 46L58 56" />
    </>
  ),
  search: (
    <>
      <circle cx="54" cy="52" r="22" />
      <path d="M70 68l18 18" />
      <path className="accent" d="M46 52h16" />
    </>
  ),
  heart: <path d="M60 88S28 68 28 46a16 16 0 0 1 32-6 16 16 0 0 1 32 6c0 22-32 42-32 42z" />,
  box: (
    <>
      <path d="M26 42l34-16 34 16v40L60 98 26 82z" />
      <path d="M26 42l34 16 34-16M60 58v40" />
      <path className="accent" d="M43 34l34 16" />
    </>
  ),
  ghost: (
    <>
      <path d="M34 92V52a26 26 0 0 1 52 0v40l-9-7-8 7-9-7-8 7-9-7z" />
      <circle className="accent fill" cx="50" cy="54" r="4" />
      <circle className="accent fill" cx="70" cy="54" r="4" />
    </>
  ),
};

export default function EmptyArt({ name = 'box' }) {
  return (
    <svg className="emptyart" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
      <circle cx="60" cy="60" r="56" className="emptyart__bg" />
      <g fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {ART[name]}
      </g>
    </svg>
  );
}
