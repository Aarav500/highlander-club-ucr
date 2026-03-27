// API Service — connects mobile app to Highlander Events backend
import { Platform } from 'react-native';

const getApiUrl = () => {
  if (!__DEV__) return 'https://api.highlanderevents.com';
  // Web and iOS can reach localhost directly; Android emulator uses 10.0.2.2
  if (Platform.OS === 'web' || Platform.OS === 'ios') return 'http://localhost:3001';
  return 'http://10.0.2.2:3001';
};
const API_URL = getApiUrl();
// For physical device, use your machine's local IP e.g. 'http://192.168.x.x:3001'

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export const auth = {
  login: (email: string) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (email: string, code: string) => request('/api/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

// Events
export const events = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/events${query}`);
  },
  happeningNow: () => request('/api/events/happening-now'),
  recommended: () => request('/api/events/recommended'),
  get: (id: string) => request(`/api/events/${id}`),
  create: (data: any) => request('/api/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/api/events/${id}`, { method: 'DELETE' }),
  rsvp: (id: string) => request(`/api/events/${id}/rsvp`, { method: 'POST' }),
  attendees: (id: string) => request(`/api/events/${id}/attendees`),
  friends: (id: string) => request(`/api/events/${id}/friends`),
  photos: (id: string) => request(`/api/events/${id}/photos`),
  deletePhoto: (eventId: string, photoId: string) => request(`/api/events/${eventId}/photos/${photoId}`, { method: 'DELETE' }),
};

// Clubs
export const clubs = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/clubs${query}`);
  },
  get: (id: string) => request(`/api/clubs/${id}`),
  create: (data: any) => request('/api/clubs', { method: 'POST', body: JSON.stringify(data) }),
  follow: (id: string) => request(`/api/clubs/${id}/follow`, { method: 'POST' }),
  dashboard: (id: string) => request(`/api/clubs/${id}/dashboard`),
};

// Users
export const users = {
  me: () => request('/api/users/me'),
  update: (data: any) => request('/api/users/me', { method: 'PUT', body: JSON.stringify(data) }),
  feed: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/users/me/feed${query}`);
  },
  friendsActivity: () => request('/api/users/me/friends-activity'),
  addFriend: (email: string) => request('/api/users/me/friends', { method: 'POST', body: JSON.stringify({ email }) }),
  friends: () => request('/api/users/me/friends'),
};

// Notifications
export const notifications = {
  register: (pushToken: string) => request('/api/notifications/register', { method: 'POST', body: JSON.stringify({ push_token: pushToken }) }),
};

// Search
export const search = {
  query: (q: string, type?: string) => {
    const params: Record<string, string> = { q };
    if (type) params.type = type;
    return request('/api/search?' + new URLSearchParams(params).toString());
  },
};

// Digest
export const digest = {
  weekly: () => request('/api/digest/weekly'),
};

// V2: Chat
export const chat = {
  messages: (clubId: string, before?: string) => {
    const params: Record<string, string> = {};
    if (before) params.before = before;
    const query = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/chat/${clubId}/messages${query}`);
  },
  send: (clubId: string, content: string) =>
    request(`/api/chat/${clubId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteMessage: (clubId: string, msgId: string) =>
    request(`/api/chat/${clubId}/messages/${msgId}`, { method: 'DELETE' }),
};

// V2: Tickets
export const tickets = {
  getForEvent: (eventId: string) => request(`/api/tickets/event/${eventId}`),
  purchase: (eventId: string) => request(`/api/tickets/event/${eventId}/purchase`, { method: 'POST' }),
  mine: () => request('/api/tickets/mine'),
};

// V2: Points & Rewards
export const points = {
  me: () => request('/api/points/me'),
  checkin: (eventId: string) => request(`/api/points/checkin/${eventId}`, { method: 'POST' }),
  leaderboard: () => request('/api/points/leaderboard'),
};
