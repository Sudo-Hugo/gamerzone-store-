// Funções de acesso à API agrupadas por recurso. As telas usam só estas funções.
import { api } from './client';

export const authApi = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password) => api('/auth/register', { method: 'POST', body: { name, email, password } }),
  me: () => api('/auth/me'),
};

export const productsApi = {
  list: (params) => api('/products', { params }),
  get: (id) => api(`/products/${id}`),
  bestSellers: (limit = 8) => api('/products/best-sellers', { params: { limit } }),
  related: (id, limit = 4) => api(`/products/${id}/related`, { params: { limit } }),
  brands: () => api('/products/brands'),
  listAll: () => api('/products/admin/all'),
  create: (data) => api('/products', { method: 'POST', body: data }),
  update: (id, data) => api(`/products/${id}`, { method: 'PUT', body: data }),
  remove: (id) => api(`/products/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  list: () => api('/categories'),
};

export const cartApi = {
  get: () => api('/cart'),
  add: (product_id, quantity = 1) => api('/cart/items', { method: 'POST', body: { product_id, quantity } }),
  update: (productId, quantity) => api(`/cart/items/${productId}`, { method: 'PATCH', body: { quantity } }),
  remove: (productId) => api(`/cart/items/${productId}`, { method: 'DELETE' }),
  clear: () => api('/cart', { method: 'DELETE' }),
};

export const addressesApi = {
  list: () => api('/addresses'),
  create: (data) => api('/addresses', { method: 'POST', body: data }),
  remove: (id) => api(`/addresses/${id}`, { method: 'DELETE' }),
};

export const ordersApi = {
  create: (address_id) => api('/orders', { method: 'POST', body: { address_id } }),
  listMine: () => api('/orders'),
  get: (id) => api(`/orders/${id}`),
  cancel: (id) => api(`/orders/${id}/cancel`, { method: 'PATCH' }),
  listAll: () => api('/orders/admin/all'),
  updateStatus: (id, status) => api(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
};
