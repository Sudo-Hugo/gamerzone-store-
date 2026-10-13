const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// A API envia valores monetários como texto ("349.90") para não perder precisão
export const formatPrice = (value) => brl.format(Number(value));

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export const formatZip = (zip) => (zip ? `${zip.slice(0, 5)}-${zip.slice(5)}` : '');

export const ORDER_STATUS = {
  pending: { label: 'Aguardando pagamento', tone: 'warn' },
  processing: { label: 'Em separação', tone: 'info' },
  shipped: { label: 'Enviado', tone: 'info' },
  delivered: { label: 'Entregue', tone: 'ok' },
  cancelled: { label: 'Cancelado', tone: 'bad' },
};

// Mesmas transições aceitas pela API (o servidor é quem decide de verdade)
export const NEXT_STATUS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Rótulo do botão que leva o pedido a cada status (ação, não estado)
export const STATUS_ACTION = {
  processing: 'Separar pedido',
  shipped: 'Marcar como enviado',
  delivered: 'Marcar como entregue',
  cancelled: 'Cancelar',
};
