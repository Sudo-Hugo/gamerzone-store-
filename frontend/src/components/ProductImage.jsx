import { useId, useState } from 'react';

// Ilustração própria por categoria (sem depender de imagens externas na demo).
const GLYPHS = {
  perifericos: (
    <g>
      <rect x="18" y="40" width="64" height="26" rx="4" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={23 + i * 9.6} y="45" width="6" height="6" rx="1" className="k" />)}
      {[0, 1, 2, 3, 4].map((i) => <rect key={`b${i}`} x={27 + i * 9.6} y="54" width="6" height="6" rx="1" className="k" />)}
    </g>
  ),
  jogos: (
    <g>
      <rect x="30" y="24" width="40" height="52" rx="4" />
      <rect x="36" y="30" width="28" height="22" rx="2" className="k" />
      <rect x="36" y="62" width="4" height="10" className="k" /><rect x="44" y="62" width="4" height="10" className="k" />
      <rect x="52" y="62" width="4" height="10" className="k" /><rect x="60" y="62" width="4" height="10" className="k" />
    </g>
  ),
  acessorios: (
    <g>
      <path d="M28 58a22 22 0 0 1 44 0" fill="none" strokeWidth="6" className="s" />
      <rect x="22" y="54" width="12" height="20" rx="4" />
      <rect x="66" y="54" width="12" height="20" rx="4" />
    </g>
  ),
  hardware: (
    <g>
      <rect x="30" y="30" width="40" height="40" rx="3" />
      <rect x="40" y="40" width="20" height="20" className="k" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className="k">
          <rect x={35 + i * 9} y="22" width="3" height="8" /><rect x={35 + i * 9} y="70" width="3" height="8" />
          <rect x="22" y={35 + i * 9} width="8" height="3" /><rect x="70" y={35 + i * 9} width="8" height="3" />
        </g>
      ))}
    </g>
  ),
  colecionaveis: (
    <g>
      <path d="M50 20l8.8 17.8 19.7 2.9-14.3 13.9 3.4 19.6L50 64.9l-17.6 9.3 3.4-19.6-14.3-13.9 19.7-2.9z" />
    </g>
  ),
};
const HUES = { perifericos: '#FFD23F', jogos: '#3DDC97', acessorios: '#7FB2FF', hardware: '#FF8A5B', colecionaveis: '#E28BFF' };

export default function ProductImage({ product, size = 'card' }) {
  const [failed, setFailed] = useState(false);
  const patternId = useId();
  const slug = product.category_slug || 'perifericos';

  if (product.image_url && !failed) {
    return (
      <div className={`pimg pimg--${size}`}>
        <img src={product.image_url} alt={product.name} loading="lazy" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div className={`pimg pimg--${size} pimg--art`} style={{ '--hue': HUES[slug] || '#FFD23F' }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={product.name}>
        <defs>
          <pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="1.2" height="1.2" className="dot" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#${patternId})`} />
        <g className="glyph">{GLYPHS[slug] || GLYPHS.perifericos}</g>
      </svg>
    </div>
  );
}
