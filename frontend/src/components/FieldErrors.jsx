// Mostra a mensagem geral de erro da API. Erros por campo são exibidos
// junto de cada input com fieldError().
export function fieldError(error, name) {
  return error?.details?.find((d) => d.field === name)?.message;
}

export default function FieldErrors({ error }) {
  if (!error) return null;
  return (
    <p className="form-error" role="alert">
      {error.message}
    </p>
  );
}
