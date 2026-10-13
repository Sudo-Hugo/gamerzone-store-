import { Link } from 'react-router-dom';
import { Empty } from '../components/Status';

export default function NotFound() {
  return (
    <Empty title="Game over: essa página não existe.">
      <Link className="btn btn--primary" to="/">
        Voltar para a loja
      </Link>
    </Empty>
  );
}
