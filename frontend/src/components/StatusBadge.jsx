import { ORDER_STATUS } from '../utils/format';

export default function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] || { label: status, tone: 'info' };
  return <span className={`badge badge--${s.tone}`}>{s.label}</span>;
}
