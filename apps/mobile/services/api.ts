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
    // Ensure profile exists (fallback if trigger failed)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.email?.split('@')[0] || 'UCR Student',
        display_name: data.user.email?.split('@')[0] || 'UCR Student',
      }, { onConflict: 'id', ignoreDuplicates: true });
    }
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
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not logged in');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  friends: async () => [],
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
function mapHLCategory(name: string, summary: string): string {
  const t = (name + ' ' + summary).toLowerCase();
  if (/tech|computer|engineer|software|data|ai|robotics|cyber/.test(t)) return 'Technology';
  if (/business|finance|entrepreneur|marketing|accounting|invest/.test(t)) return 'Business';
  if (/art|music|danc|theater|media|film|photo/.test(t)) return 'Arts';
  if (/sport|athletic|fitness|hiking|climb|soccer|basketball|tennis/.test(t)) return 'Sports';
  if (/pre.med|health|nurs|biolog|pharmacy|dental|medical/.test(t)) return 'Health';
  if (/volunteer|service|communit|humanitarian/.test(t)) return 'Service';
  return 'Cultural';
}

const HL_SEARCH = 'https://highlanderlink.ucr.edu/api/discovery/search/organizations';

function parseHLOrg(org: any) {
  return {
    id: String(org.Id),
    name: org.Name,
    description: org.Summary || null,
    logo_url: null,
    websiteKey: org.WebsiteKey,
    url: `https://highlanderlink.ucr.edu/organization/${org.WebsiteKey}`,
    from_highlander_link: true,
    highlander_link_id: String(org.Id),
    category: (org.CategoryNames?.[0]) || mapHLCategory(org.Name, org.Summary || ''),
  };
}

export const highlanderLink = {
  search: async (query: string) => {
    try {
      const res = await fetch(`${HL_SEARCH}?query=${encodeURIComponent(query)}&limit=20`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.value || []).map(parseHLOrg);
    } catch { return []; }
  },

  syncToSupabase: async () => {
    try {
      let skip = 0;
      const limit = 100;
      while (true) {
        const res = await fetch(`${HL_SEARCH}?query=&limit=${limit}&skip=${skip}`);
        if (!res.ok) break;
        const data = await res.json();
        const orgs: any[] = data.value || [];
        if (orgs.length === 0) break;
        const clubs = orgs.map((org: any) => ({
          name: org.Name,
          description: org.Summary || null,
          logo_url: null,
          category: (org.CategoryNames?.[0]) || mapHLCategory(org.Name, org.Summary || ''),
          highlander_link_key: org.WebsiteKey || null,
          highlander_link_id: String(org.Id),
        }));
        await supabase.from('clubs').upsert(clubs, { onConflict: 'highlander_link_id', ignoreDuplicates: true });
        if (orgs.length < limit) break;
        skip += limit;
      }
    } catch { /* silent */ }
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

// ── Search (events + clubs + Highlander Link) ────────────────────────────────
export const search = {
  query: async (q: string, _category?: string) => {
    const [evtRes, clubRes, hlClubs] = await Promise.all([
      supabase.from('events').select('*, clubs(name, logo_url)').ilike('title', `%${q}%`).eq('status', 'published').limit(10),
      supabase.from('clubs').select('*').ilike('name', `%${q}%`).limit(10),
      highlanderLink.search(q),
    ]);
    return {
      events: evtRes.data || [],
      clubs: clubRes.data || [],
      highlanderClubs: hlClubs,
    };
  },
  clubs: async (query: string) => {
    const { data } = await supabase.from('clubs').select('*').ilike('name', `%${query}%`).limit(10);
    const hlClubs = await highlanderLink.search(query);
    return [...(data || []), ...hlClubs.map((c: any) => ({ ...c, from_highlander_link: true }))];
  },
  events: async (query: string) => {
    const { data } = await supabase.from('events').select('*, clubs(name, logo_url)').ilike('title', `%${query}%`).limit(10);
    return data || [];
  },
};

// ── Club Claims ──────────────────────────────────────────────────────────────
export const claimsApi = {
  submit: async (clubId: string, role: string, message: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('club_claims')
      .upsert({ club_id: clubId, user_id: user?.id, role, message, status: 'pending' }, { onConflict: 'club_id,user_id' })
      .select().single();
    if (error) throw error;
    return data;
  },
  myClaimForClub: async (clubId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('club_claims').select('*').eq('club_id', clubId).eq('user_id', user?.id).maybeSingle();
    return data;
  },
  // Admin only
  listPending: async () => {
    const { data, error } = await supabase.from('club_claims')
      .select('*, clubs(name, category), user:profiles!user_id(name, email)')
      .eq('status', 'pending').order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  approve: async (claimId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: claim, error: ce } = await supabase.from('club_claims')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', claimId).select().single();
    if (ce) throw ce;
    // Grant role
    const { error: me } = await supabase.from('club_members')
      .upsert({ club_id: claim.club_id, user_id: claim.user_id, role: claim.role }, { onConflict: 'club_id,user_id' });
    if (me) throw me;
    return claim;
  },
  reject: async (claimId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('club_claims')
      .update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', claimId);
    if (error) throw error;
  },
};

// ── Club Chat ────────────────────────────────────────────────────────────────
export const chat = {
  messages: async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_messages')
      .select('*, profiles(name, avatar_url)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return data || [];
  },
  send: async (clubId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('club_messages')
      .insert({ club_id: clubId, user_id: user?.id, content })
      .select('*, profiles(name, avatar_url)')
      .single();
    if (error) throw error;
    return data;
  },
  deleteMessage: async (_clubId: string, messageId: string) => {
    const { error } = await supabase.from('club_messages').delete().eq('id', messageId);
    if (error) throw error;
  },
};

// ── Tickets (maps to RSVPs for free events) ───────────────────────────────────
export const tickets = {
  getForEvent: async (eventId: string) => {
    const { data: event, error } = await supabase
      .from('events')
      .select('*, clubs(name, logo_url), rsvps(user_id)')
      .eq('id', eventId)
      .single();
    if (error) throw error;
    const { data: { user } } = await supabase.auth.getUser();
    const hasRsvp = (event.rsvps || []).some((r: any) => r.user_id === user?.id);
    return { event, hasTicket: hasRsvp, ticketCount: event.rsvps?.length || 0 };
  },
  purchase: async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('rsvps').insert({ event_id: eventId, user_id: user?.id });
    if (error) throw error;
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
