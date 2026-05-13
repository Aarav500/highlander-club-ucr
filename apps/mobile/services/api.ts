import { supabase } from '../lib/supabase';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  // Send OTP to @ucr.edu email
  sendOTP: async (email: string) => {
    if (!email.endsWith('@ucr.edu')) throw new Error('Only @ucr.edu emails allowed');
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  },

  // Verify OTP code
  verifyOTP: async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    return data;
  },

  resetPassword: async (email: string) => {
    if (!email.endsWith('@ucr.edu')) throw new Error('Only @ucr.edu emails allowed');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb: any) => supabase.auth.onAuthStateChange(cb),
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const profilesApi = {
  get: async (id: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ── Clubs ────────────────────────────────────────────────────────────────────
export const clubsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('clubs')
      .select('*, club_members(role, user_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  get: async (id: string) => {
    const { data, error } = await supabase
      .from('clubs')
      .select('*, club_members(role, user_id, profiles(name, avatar_url))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  create: async (club: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('clubs').insert({ ...club, created_by: user?.id }).select().single();
    if (error) throw error;
    // Auto-assign creator as president
    await supabase.from('club_members').insert({ club_id: data.id, user_id: user?.id, role: 'president' });
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('clubs').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  follow: async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('follows').insert({ club_id: clubId, user_id: user?.id });
  },
  unfollow: async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('follows').delete().eq('club_id', clubId).eq('user_id', user?.id);
  },
};

// ── Events ───────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: async (filters?: { category?: string; upcoming?: boolean }) => {
    let q = supabase.from('events').select('*, clubs(name, logo_url)').eq('status', 'published');
    if (filters?.category && filters.category !== 'All') q = q.eq('category', filters.category);
    if (filters?.upcoming) q = q.gte('start_time', new Date().toISOString());
    const { data, error } = await q.order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },
  get: async (id: string) => {
    const { data, error } = await supabase
      .from('events')
      .select('*, clubs(name, logo_url, instagram), rsvps(user_id), event_photos(id, photo_url, user_id)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  create: async (event: any) => {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  rsvp: async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('rsvps').insert({ event_id: eventId, user_id: user?.id });
  },
  unrsvp: async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', user?.id);
  },
};

// ── Highlander Link ──────────────────────────────────────────────────────────
export const highlanderLink = {
  search: async (query: string) => {
    const res = await fetch(
      `https://highlanderlink.ucr.edu/api/discovery/organization/search?query=${encodeURIComponent(query)}&top=10`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.value || []).map((org: any) => ({
      id: org.Id,
      name: org.Name,
      description: org.Summary,
      logo_url: org.ProfilePicture,
      websiteKey: org.WebsiteKey,
      url: `https://highlanderlink.ucr.edu/organization/${org.WebsiteKey}`,
    }));
  },
};

// ── Storage (photos) ─────────────────────────────────────────────────────────
export const storageApi = {
  uploadPhoto: async (uri: string, bucket = 'photos') => {
    const ext = uri.split('.').pop() || 'jpg';
    const path = `${Date.now()}.${ext}`;
    const res = await fetch(uri);
    const blob = await res.blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: `image/${ext}` });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

// Legacy compat exports
export const API_URL = '';
export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};
export const setAuthToken = (_: any) => {};
export const upload = { getPresignedUrl: async () => ({ uploadUrl: '', publicUrl: '' }) };
export const users = profilesApi;
export const clubs = clubsApi;
export const events = eventsApi;
