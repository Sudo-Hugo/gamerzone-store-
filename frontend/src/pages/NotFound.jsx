import { Link } from 'react-router-dom';
import { Empty } from '../components/Status';

export default function NotFound() {
  return (
    <Empty title="Game over: essa página não existe." art="ghost">
      <Link className="btn btn--primary" to="/">
        Voltar para a loja
      </Link>
    </Empty>
  );
}
