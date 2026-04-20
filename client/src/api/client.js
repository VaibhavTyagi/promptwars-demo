const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Venues
  getVenues: () => request('/venues'),
  getVenue: (id) => request(`/venues/${id}`),

  // Events
  getEvents: (params = '') => request(`/events?${params}`),
  getEvent: (id) => request(`/events/${id}`),
  updateEventStatus: (id, status) => request(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Amenities
  getAmenities: (params = '') => request(`/amenities?${params}`),
  getAmenity: (id) => request(`/amenities/${id}`),
  getMenu: (amenityId, params = '') => request(`/amenities/${amenityId}/menu?${params}`),
  getWaitTimes: (eventId) => request(`/amenities/wait-times/${eventId}`),
  getCrowdDensity: (eventId) => request(`/amenities/crowd-density/${eventId}`),

  // Orders
  getOrders: (params = '') => request(`/orders?${params}`),
  getOrder: (id) => request(`/orders/${id}`),
  placeOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getVenueOrders: (eventId) => request(`/orders/venue/${eventId}`),

  // Incidents
  getIncidents: (params = '') => request(`/incidents?${params}`),
  getIncident: (id) => request(`/incidents/${id}`),
  createIncident: (data) => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateIncident: (id, data) => request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Staff
  getStaff: (params = '') => request(`/staff?${params}`),
  assignStaff: (data) => request('/staff/assign', { method: 'POST', body: JSON.stringify(data) }),
  getAssignments: (eventId) => request(`/staff/assignments/${eventId}`),
  updateAssignment: (id, status) => request(`/staff/assignments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Dashboard
  getDashboardOverview: (eventId) => request(`/dashboard/overview/${eventId}`),
  getRevenue: (eventId) => request(`/dashboard/revenue/${eventId}`),
  getAnalytics: (eventId) => request(`/dashboard/analytics/${eventId}`),
};
