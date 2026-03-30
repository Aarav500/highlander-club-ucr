// API Service — connects mobile app to UniPulse backend
import { Platform } from 'react-native';

// Set EXPO_PUBLIC_API_URL in your .env or EAS environment variables
// e.g. EXPO_PUBLIC_API_URL=http://ec2-xx-xx-xx-xx.compute.amazonaws.com:3001
const PRODUCTION_API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const getApiUrl = () => {
  // Web uses same-origin proxy (server.js forwards /api → EC2 API)
  if (Platform.OS === 'web') return '';
  // Native: production builds use EC2, dev builds use localhost
  if (!__DEV__) return PRODUCTION_API;
  if (Platform.OS === 'ios') return 'http://localhost:3001';
  return 'http://10.0.2.2:3001'; // Android emulator
};
const API_URL = getApiUrl();

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

// ═══════════════════════════════════════════════════════════════════════════════
// Auth — UCR CAS SSO + Email Code Fallback
// ═══════════════════════════════════════════════════════════════════════════════
export const auth = {
  // Get the CAS login URL for redirect
  getCASLoginUrl: (platform: string = 'mobile') => {
    const baseUrl = API_URL || PRODUCTION_API;
    return `${baseUrl}/api/auth/cas/login?platform=${platform}`;
  },
  // Validate a CAS callback (used when deep link returns with ticket)
  casCallback: (ticket: string) =>
    request(`/api/auth/cas/callback?ticket=${encodeURIComponent(ticket)}&platform=mobile`),
  // Email-code flow (fallback for development)
  login: (email: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (email: string, code: string) =>
    request('/api/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  // Session
  logout: () =>
    request('/api/auth/logout', { method: 'POST' }),
  me: () =>
    request('/api/auth/me'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// Clubs
// ═══════════════════════════════════════════════════════════════════════════════
export const clubs = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/clubs${query}`);
  },
  get: (id: string) => request(`/api/clubs/${id}`),
  create: (data: any) => request('/api/clubs', { method: 'POST', body: JSON.stringify(data) }),
  follow: (id: string) => request(`/api/clubs/${id}/follow`, { method: 'POST' }),
  dashboard: (id: string) => request(`/api/clubs/${id}/dashboard`),
  // Staff management
  staff: (id: string) => request(`/api/clubs/${id}/staff`),
  inviteStaff: (id: string, email: string, role: string) =>
    request(`/api/clubs/${id}/staff/invite`, { method: 'POST', body: JSON.stringify({ email, role }) }),
  staffInvites: (id: string) => request(`/api/clubs/${id}/staff/invites`),
  updateStaffRole: (clubId: string, userId: string, role: string) =>
    request(`/api/clubs/${clubId}/staff/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) }),
  removeStaff: (clubId: string, userId: string) =>
    request(`/api/clubs/${clubId}/staff/${userId}`, { method: 'DELETE' }),
  transferPresidency: (clubId: string, userId: string) =>
    request(`/api/clubs/${clubId}/transfer`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════════
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

// Upload — S3 presigned URL generation
export const upload = {
  getPresignedUrl: (contentType: string) =>
    request(`/api/upload/presign?contentType=${encodeURIComponent(contentType)}`),
};
