export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button className="btn btn--ghost btn--sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Próxima
      </button>
    </nav>
  );
}
