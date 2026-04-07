import { SPIRITUAL_LEVELS } from './constants';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import {
  User,
  Prayer,
  Circulo,
  Post,
  SpiritualLevel,
  UserRole,
  CirculoScheduleItem,
  PrayerSchedule,
  DayCompletion,
  PrayerEditSuggestion,
  CirculoDevocionary,
  RichContent,
} from './types';

// ─── Helpers de data / streak (igual ao mock anterior) ─────────────────────

const calculateCurrentStreak = (history: Record<string, DayCompletion>): number => {
  const dates = Object.keys(history).sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(dates[0] + 'T00:00:00');
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

  if (diffDays > 1) return 0;

  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i] + 'T00:00:00');
    streak++;
    if (i < dates.length - 1) {
      const nextDate = new Date(dates[i + 1] + 'T00:00:00');
      const gap = Math.floor((current.getTime() - nextDate.getTime()) / (1000 * 3600 * 24));
      if (gap > 1) break;
    }
  }
  return streak;
};

function formatRelativePt(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return `há ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `há ${h} h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

function profileRowToUser(
  p: Record<string, unknown>,
  email: string,
  joinedCirculoIds: string[],
): User {
  const role = p.role === 'EDITOR' ? UserRole.Editor : UserRole.User;
  const level = (p.level as SpiritualLevel) || SpiritualLevel.Peregrino;
  return {
    id: p.id as string,
    name: (p.display_name as string) || '',
    email,
    city: (p.city as string) || 'Nova Comunidade',
    avatarUrl: (p.avatar_url as string) || '',
    graces: (p.graces as number) || 0,
    totalPrayers: (p.total_prayers as number) || 0,
    streak: (p.streak as number) || 0,
    level,
    favoritePrayerIds: ((p.favorite_prayer_ids as string[]) || []).filter(Boolean),
    joinedCirculoIds,
    role,
    schedule: (p.schedule as PrayerSchedule[]) || [],
    history: (p.history as Record<string, DayCompletion>) || {},
  };
}

function rowToPrayer(r: Record<string, unknown>): Prayer {
  return {
    id: r.id as string,
    title: (r.title as string) || '',
    text: (r.text as string) || '',
    content: (r.content as RichContent) || undefined,
    latinText: (r.latin_text as string) || undefined,
    category: r.category as Prayer['category'],
    tags: (r.tags as string[]) || [],
    imageUrl: (r.image_url as string) || undefined,
    authorId: (r.author_id as string) || 'system',
    authorName: (r.author_name as string) || '',
    createdAt: formatRelativePt(r.created_at as string),
    prayerCount: (r.prayer_count as number) || 0,
    parentPrayerId: (r.parent_prayer_id as string) || undefined,
    isDevotion: Boolean(r.is_devotion),
  };
}

function rowToSuggestion(r: Record<string, unknown>): PrayerEditSuggestion {
  return {
    id: r.id as string,
    prayerId: r.prayer_id as string,
    authorId: r.author_id as string,
    authorName: r.author_name as string,
    createdAt: formatRelativePt(r.created_at as string),
    status: r.status as PrayerEditSuggestion['status'],
    proposed: (r.proposed as Partial<Prayer>) || {},
    reason: (r.reason as string) || undefined,
    reviewerId: (r.reviewer_id as string) || undefined,
    reviewedAt: r.reviewed_at ? formatRelativePt(r.reviewed_at as string) : undefined,
    reviewerNote: (r.reviewer_note as string) || undefined,
  };
}

function dbPostToPost(
  row: Record<string, unknown>,
  reactions: { user_id: string; emoji: string }[],
  replies: Post[],
): Post {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorName: row.author_name as string,
    authorAvatarUrl: (row.author_avatar_url as string) || '',
    text: (row.text as string) || '',
    createdAt: formatRelativePt(row.created_at as string),
    mentionedPrayerIds: (row.mentioned_prayer_ids as string[] | null) || undefined,
    reactions: reactions.map((x) => ({ userId: x.user_id, emoji: x.emoji })),
    replies,
    isPinned: Boolean(row.is_pinned),
  };
}

async function loadJoinedCirculoIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from('circulo_members').select('circulo_id').eq('user_id', userId);
  return (data || []).map((x) => x.circulo_id as string);
}

async function buildUserFromProfile(userId: string, emailFallback: string): Promise<User | null> {
  const { data: p, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !p) return null;
  const joined = await loadJoinedCirculoIds(userId);
  const email =
    (await supabase.auth.getUser()).data.user?.email || (p as { email?: string }).email || emailFallback;
  let user = profileRowToUser(p as Record<string, unknown>, email, joined);
  const streak = calculateCurrentStreak(user.history || {});
  if (streak !== user.streak) {
    await supabase.from('profiles').update({ streak }).eq('id', userId);
    user = { ...user, streak };
  }
  return user;
}

async function fetchReactionsForPosts(postIds: string[]): Promise<Map<string, { user_id: string; emoji: string }[]>> {
  const map = new Map<string, { user_id: string; emoji: string }[]>();
  if (postIds.length === 0) return map;
  const { data } = await supabase.from('post_reactions').select('post_id, user_id, emoji').in('post_id', postIds);
  for (const row of data || []) {
    const pid = row.post_id as string;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push({ user_id: row.user_id as string, emoji: row.emoji as string });
  }
  return map;
}

async function assembleCirculoList(rows: Record<string, unknown>[]): Promise<Circulo[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id as string);

  const { data: schedRows } = await supabase
    .from('circulo_schedule_items')
    .select('*')
    .in('circulo_id', ids);

  const { data: postRows } = await supabase
    .from('posts')
    .select('*')
    .in('circulo_id', ids)
    .order('created_at', { ascending: false });

  const posts = (postRows || []) as Record<string, unknown>[];
  const postIds = posts.map((p) => p.id as string);
  const reactionMap = await fetchReactionsForPosts(postIds);

  const scheduleByCirculo = new Map<string, CirculoScheduleItem[]>();
  for (const s of schedRows || []) {
    const cid = s.circulo_id as string;
    if (!scheduleByCirculo.has(cid)) scheduleByCirculo.set(cid, []);
    scheduleByCirculo.get(cid)!.push({
      id: s.id as string,
      title: s.title as string,
      time: s.time as string,
      prayerId: s.prayer_id as string,
    });
  }

  const postsByCirculo = new Map<string, Record<string, unknown>[]>();
  for (const p of posts) {
    const cid = p.circulo_id as string;
    if (!postsByCirculo.has(cid)) postsByCirculo.set(cid, []);
    postsByCirculo.get(cid)!.push(p);
  }

  const buildPostsForCirculo = (cid: string): Post[] => {
    const list = postsByCirculo.get(cid) || [];
    const roots = list.filter((x) => !x.parent_post_id);
    roots.sort((a, b) => {
      if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
    });
    return roots.map((root) => {
      const rid = root.id as string;
      const childRows = list
        .filter((x) => x.parent_post_id === rid)
        .sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime());
      const replies = childRows.map((cr) => {
        const crid = cr.id as string;
        return dbPostToPost(cr, reactionMap.get(crid) || [], []);
      });
      return dbPostToPost(root, reactionMap.get(rid) || [], replies);
    });
  };

  return rows.map((r) => {
    const id = r.id as string;
    const ext = r.external_links;
    const dev = r.devocionary;
    return {
      id,
      name: r.name as string,
      description: (r.description as string) || '',
      leaderId: r.leader_id as string,
      moderatorIds: (r.moderator_ids as string[]) || [],
      memberCount: (r.member_count as number) || 0,
      imageUrl: (r.image_url as string) || '',
      coverImageUrl: (r.cover_image_url as string) || '',
      externalLinks: (Array.isArray(ext) ? ext : []) as Circulo['externalLinks'],
      posts: buildPostsForCirculo(id),
      schedule: scheduleByCirculo.get(id) || [],
      devocionary: (dev as CirculoDevocionary) || undefined,
    };
  });
}

async function fetchAllCirculosDetailed(): Promise<Circulo[]> {
  const { data, error } = await supabase.from('circulos').select('*').order('name');
  if (error) throw error;
  return assembleCirculoList((data || []) as Record<string, unknown>[]);
}

async function fetchCirculoById(circuloId: string): Promise<Circulo | null> {
  const { data, error } = await supabase.from('circulos').select('*').eq('id', circuloId).maybeSingle();
  if (error || !data) return null;
  const list = await assembleCirculoList([data as Record<string, unknown>]);
  return list[0] || null;
}

function proposedToPrayerUpdate(proposed: Partial<Prayer>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (proposed.title !== undefined) row.title = proposed.title;
  if (proposed.text !== undefined) row.text = proposed.text;
  if (proposed.content !== undefined) row.content = proposed.content;
  if (proposed.latinText !== undefined) row.latin_text = proposed.latinText;
  if (proposed.category !== undefined) row.category = proposed.category;
  if (proposed.tags !== undefined) row.tags = proposed.tags;
  if (proposed.imageUrl !== undefined) row.image_url = proposed.imageUrl;
  if (proposed.isDevotion !== undefined) row.is_devotion = proposed.isDevotion;
  if (proposed.parentPrayerId !== undefined) row.parent_prayer_id = proposed.parentPrayerId;
  if (proposed.authorName !== undefined) row.author_name = proposed.authorName;
  return row;
}

function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example e docs/DEPLOY.md).',
    );
  }
}

// ─── API exportada ──────────────────────────────────────────────────────────

export const api = {
  async restoreSession(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return buildUserFromProfile(session.user.id, session.user.email ?? '');
  },

  async login(email: string, password: string): Promise<User> {
    assertConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Sessão inválida.');
    const u = await buildUserFromProfile(data.user.id, data.user.email ?? email);
    if (!u) throw new Error('Perfil não encontrado.');
    return u;
  },

  async signup(name: string, email: string, password: string): Promise<void> {
    assertConfigured();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
  },

  async logout(): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  },

  async getData(userId: string) {
    assertConfigured();
    const authUser = (await supabase.auth.getUser()).data.user;
    const email = authUser?.email ?? '';
    const user = await buildUserFromProfile(userId, email);
    if (!user) throw new Error('Usuário não encontrado.');

    const { data: prayersData, error: pe } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false });
    if (pe) throw pe;

    const circulos = await fetchAllCirculosDetailed();

    const { data: sugData, error: se } = await supabase
      .from('prayer_edit_suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    if (se) throw se;

    return {
      user,
      prayers: (prayersData || []).map((r) => rowToPrayer(r as Record<string, unknown>)),
      circulos,
      editSuggestions: (sugData || []).map((r) => rowToSuggestion(r as Record<string, unknown>)),
    };
  },

  async fetchPublicPrayers(): Promise<Prayer[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => rowToPrayer(r as Record<string, unknown>));
  },

  async fetchPublicCirculos(): Promise<Circulo[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('circulos').select('*').order('member_count', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      const ext = row.external_links;
      return {
        id: row.id as string,
        name: row.name as string,
        description: (row.description as string) || '',
        leaderId: row.leader_id as string,
        moderatorIds: (row.moderator_ids as string[]) || [],
        memberCount: (row.member_count as number) || 0,
        imageUrl: (row.image_url as string) || '',
        coverImageUrl: (row.cover_image_url as string) || '',
        externalLinks: (Array.isArray(ext) ? ext : []) as Circulo['externalLinks'],
        posts: [],
        schedule: [],
        devocionary: (row.devocionary as CirculoDevocionary) || undefined,
      };
    });
  },

  fetchCirculoById,

  listPendingSuggestions: async (): Promise<PrayerEditSuggestion[]> => {
    assertConfigured();
    const { data, error } = await supabase
      .from('prayer_edit_suggestions')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => rowToSuggestion(r as Record<string, unknown>));
  },

  submitPrayerEditSuggestion: async (
    prayerId: string,
    proposed: Partial<Prayer>,
    user: User,
    reason?: string,
  ) => {
    assertConfigured();
    const { data, error } = await supabase
      .from('prayer_edit_suggestions')
      .insert({
        prayer_id: prayerId,
        author_id: user.id,
        author_name: user.name,
        status: 'PENDING',
        proposed: proposed as object,
        reason: reason?.trim() || null,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToSuggestion(data as Record<string, unknown>);
  },

  approveSuggestion: async (suggestionId: string, editor: User) => {
    assertConfigured();
    if (editor.role !== UserRole.Editor) throw new Error('Sem permissão para aprovar sugestões.');
    const { data: sug, error: e1 } = await supabase
      .from('prayer_edit_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single();
    if (e1 || !sug) return null;
    const patch = proposedToPrayerUpdate((sug as { proposed: Partial<Prayer> }).proposed || {});
    if (Object.keys(patch).length > 0) {
      const { error: e2 } = await supabase.from('prayers').update(patch).eq('id', sug.prayer_id);
      if (e2) throw e2;
    }
    const now = new Date().toISOString();
    const { data: updatedSug, error: e3 } = await supabase
      .from('prayer_edit_suggestions')
      .update({
        status: 'APPROVED',
        reviewer_id: editor.id,
        reviewed_at: now,
      })
      .eq('id', suggestionId)
      .select()
      .single();
    if (e3) throw e3;
    const { data: prayer } = await supabase.from('prayers').select('*').eq('id', sug.prayer_id).single();
    return {
      suggestion: rowToSuggestion(updatedSug as Record<string, unknown>),
      prayer: prayer ? rowToPrayer(prayer as Record<string, unknown>) : null,
    };
  },

  rejectSuggestion: async (suggestionId: string, editor: User, note?: string) => {
    assertConfigured();
    if (editor.role !== UserRole.Editor) throw new Error('Sem permissão para rejeitar sugestões.');
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('prayer_edit_suggestions')
      .update({
        status: 'REJECTED',
        reviewer_id: editor.id,
        reviewed_at: now,
        reviewer_note: note?.trim() || null,
      })
      .eq('id', suggestionId)
      .select()
      .single();
    if (error) throw error;
    return rowToSuggestion(data as Record<string, unknown>);
  },

  incrementPrayerCount: async (prayerId: string) => {
    assertConfigured();
    const { data, error } = await supabase.rpc('increment_prayer_count', { pid: prayerId });
    if (error) throw error;
    return (data as number) || 0;
  },

  toggleFavorite: async (userId: string, prayerId: string) => {
    assertConfigured();
    const { data: p, error: e1 } = await supabase.from('profiles').select('favorite_prayer_ids').eq('id', userId).single();
    if (e1) throw e1;
    const arr = ((p as { favorite_prayer_ids: string[] }).favorite_prayer_ids || []).slice();
    const idx = arr.indexOf(prayerId);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(prayerId);
    const { error: e2 } = await supabase.from('profiles').update({ favorite_prayer_ids: arr }).eq('id', userId);
    if (e2) throw e2;
    return arr;
  },

  addScheduledPrayer: async (userId: string, time: string, prayerId: string, label?: string) => {
    assertConfigured();
    const { data: p, error: e1 } = await supabase.from('profiles').select('schedule').eq('id', userId).single();
    if (e1) throw e1;
    const sched = ((p as { schedule: PrayerSchedule[] }).schedule || []).slice();
    sched.push({ id: `s${Date.now()}`, time, prayerId, label, completed: false });
    const { error: e2 } = await supabase.from('profiles').update({ schedule: sched }).eq('id', userId);
    if (e2) throw e2;
    return sched;
  },

  removeScheduledPrayer: async (userId: string, scheduleItemId: string) => {
    assertConfigured();
    const { data: p, error: e1 } = await supabase.from('profiles').select('schedule').eq('id', userId).single();
    if (e1) throw e1;
    const sched = ((p as { schedule: PrayerSchedule[] }).schedule || []).filter((s) => s.id !== scheduleItemId);
    const { error: e2 } = await supabase.from('profiles').update({ schedule: sched }).eq('id', userId);
    if (e2) throw e2;
    return sched;
  },

  toggleScheduledPrayer: async (userId: string, scheduleItemId: string) => {
    assertConfigured();
    const { data: p, error: e1 } = await supabase.from('profiles').select('schedule, history').eq('id', userId).single();
    if (e1) throw e1;
    const row = p as { schedule: PrayerSchedule[]; history: Record<string, DayCompletion> };
    const sched = (row.schedule || []).map((s) =>
      s.id === scheduleItemId ? { ...s, completed: !s.completed } : s,
    );
    const item = sched.find((s) => s.id === scheduleItemId);
    let history = { ...(row.history || {}) };
    if (item) {
      const today = new Date().toISOString().split('T')[0];
      if (!history[today]) history[today] = { morning: false, afternoon: false, night: false };
      const parseHour = (t: string) => {
        const [h] = String(t || '').split(':').map(Number);
        return isNaN(h) ? 0 : h;
      };
      const inMorning = (h: number) => h >= 5 && h < 12;
      const inAfternoon = (h: number) => h >= 12 && h < 18;
      const inNight = (h: number) => h >= 18 || h < 5;
      const completedToday = sched.filter((s) => s.completed);
      history[today].morning = completedToday.some((s) => inMorning(parseHour(s.time)));
      history[today].afternoon = completedToday.some((s) => inAfternoon(parseHour(s.time)));
      history[today].night = completedToday.some((s) => inNight(parseHour(s.time)));
    }
    const streak = calculateCurrentStreak(history);
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ schedule: sched, history, streak })
      .eq('id', userId);
    if (e2) throw e2;
    return sched;
  },

  updateUserGraces: async (userId: string, amount: number) => {
    assertConfigured();
    const { data: p, error: e1 } = await supabase
      .from('profiles')
      .select('graces, total_prayers, level, history, streak')
      .eq('id', userId)
      .single();
    if (e1) throw e1;
    const row = p as {
      graces: number;
      total_prayers: number;
      level: string;
      history: Record<string, DayCompletion>;
      streak: number;
    };
    const today = new Date().toISOString().split('T')[0];
    let history = { ...(row.history || {}) };
    if (!history[today]) history[today] = { morning: false, afternoon: false, night: false };
    const graces = row.graces + amount;
    const totalPrayers = row.total_prayers + 1;
    const streak = calculateCurrentStreak(history);
    let level = row.level as SpiritualLevel;
    for (const lev of Object.keys(SPIRITUAL_LEVELS) as SpiritualLevel[]) {
      if (graces >= SPIRITUAL_LEVELS[lev].min) level = lev;
    }
    const { error: e2 } = await supabase
      .from('profiles')
      .update({ graces, total_prayers, streak, level, history })
      .eq('id', userId);
    if (e2) throw e2;
    return { graces, level, totalPrayers, streak };
  },

  addPrayer: async (prayerData: Partial<Prayer>, author: User): Promise<Prayer> => {
    assertConfigured();
    const insert = {
      title: prayerData.title || 'Sem Título',
      text: prayerData.text || '',
      content: prayerData.content ?? null,
      latin_text: prayerData.latinText ?? null,
      category: prayerData.category!,
      tags: prayerData.tags || [],
      image_url: prayerData.imageUrl ?? null,
      author_id: author.id,
      author_name: author.name,
      is_devotion: !!prayerData.isDevotion,
      parent_prayer_id: prayerData.parentPrayerId ?? null,
    };
    const { data, error } = await supabase.from('prayers').insert(insert).select().single();
    if (error) throw error;
    return rowToPrayer(data as Record<string, unknown>);
  },

  addPost: async (circuloId: string, text: string, author: User): Promise<Post> => {
    assertConfigured();
    const { data, error } = await supabase
      .from('posts')
      .insert({
        circulo_id: circuloId,
        author_id: author.id,
        author_name: author.name,
        author_avatar_url: author.avatarUrl,
        text,
      })
      .select()
      .single();
    if (error) throw error;
    const row = data as Record<string, unknown>;
    return dbPostToPost(row, [], []);
  },

  toggleCirculoMembership: async (userId: string, circuloId: string) => {
    assertConfigured();
    const { data: c } = await supabase.from('circulos').select('member_count').eq('id', circuloId).single();
    const { data: existing } = await supabase
      .from('circulo_members')
      .select('user_id')
      .eq('circulo_id', circuloId)
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from('circulo_members').delete().eq('circulo_id', circuloId).eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('circulo_members').insert({ circulo_id: circuloId, user_id: userId });
      if (error) throw error;
    }
    const joined = await loadJoinedCirculoIds(userId);
    const { data: c2 } = await supabase.from('circulos').select('member_count').eq('id', circuloId).single();
    return { joinedCirculoIds: joined, memberCount: (c2 as { member_count: number })?.member_count ?? (c as { member_count: number })?.member_count ?? 0 };
  },

  updatePrayer: async (prayerId: string, prayerData: Partial<Prayer>, user: User): Promise<Prayer | null> => {
    assertConfigured();
    if (user.role !== UserRole.Editor) return null;
    const patch = proposedToPrayerUpdate(prayerData);
    if (Object.keys(patch).length === 0) return null;
    const { data, error } = await supabase.from('prayers').update(patch).eq('id', prayerId).select().single();
    if (error) {
      console.error(error);
      return null;
    }
    return data ? rowToPrayer(data as Record<string, unknown>) : null;
  },

  addCirculo: async (data: { name: string; description: string }, user: User): Promise<Circulo> => {
    assertConfigured();
    const { data: row, error } = await supabase
      .from('circulos')
      .insert({
        name: data.name,
        description: data.description,
        leader_id: user.id,
        moderator_ids: [user.id],
        member_count: 0,
        image_url: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/200/200`,
        cover_image_url: `https://picsum.photos/seed/${encodeURIComponent(data.name)}_cover/800/200`,
        external_links: [],
      })
      .select()
      .single();
    if (error) throw error;
    const cid = (row as { id: string }).id;
    await supabase.from('circulo_members').insert({ circulo_id: cid, user_id: user.id });
    const full = await fetchCirculoById(cid);
    if (!full) throw new Error('Erro ao carregar círculo criado.');
    return full;
  },

  addReply: async (cid: string, pid: string, text: string, user: User) => {
    assertConfigured();
    const { error } = await supabase.from('posts').insert({
      circulo_id: cid,
      parent_post_id: pid,
      author_id: user.id,
      author_name: user.name,
      author_avatar_url: user.avatarUrl,
      text,
    });
    if (error) throw error;
    return fetchCirculoById(cid);
  },

  deletePost: async (cid: string, pid: string, uid: string) => {
    assertConfigured();
    const { error } = await supabase.from('posts').delete().eq('id', pid).eq('circulo_id', cid);
    if (error) throw error;
    return fetchCirculoById(cid);
  },

  pinPost: async (cid: string, pid: string, uid: string) => {
    assertConfigured();
    const { data: post } = await supabase.from('posts').select('is_pinned').eq('id', pid).eq('circulo_id', cid).single();
    if (!post) return fetchCirculoById(cid);
    await supabase
      .from('posts')
      .update({ is_pinned: !(post as { is_pinned: boolean }).is_pinned })
      .eq('id', pid);
    return fetchCirculoById(cid);
  },

  updateMemberRole: async (cid: string, mid: string, isModerator: boolean, uid: string) => {
    assertConfigured();
    const { data: c } = await supabase.from('circulos').select('moderator_ids, leader_id').eq('id', cid).single();
    if (!c) return fetchCirculoById(cid);
    let mods = ([...(c as { moderator_ids: string[] }).moderator_ids] as string[]) || [];
    const leader = (c as { leader_id: string }).leader_id;
    if (isModerator) {
      if (!mods.includes(mid)) mods.push(mid);
    } else {
      mods = mods.filter((id) => id !== mid);
      if (!mods.includes(leader)) mods.push(leader);
    }
    await supabase.from('circulos').update({ moderator_ids: mods }).eq('id', cid);
    return fetchCirculoById(cid);
  },

  removeMember: async (cid: string, mid: string, uid: string) => {
    assertConfigured();
    await supabase.from('circulo_members').delete().eq('circulo_id', cid).eq('user_id', mid);
    const { data: c } = await supabase.from('circulos').select('moderator_ids').eq('id', cid).single();
    if (c) {
      const mods = ((c as { moderator_ids: string[] }).moderator_ids || []).filter((id) => id !== mid);
      await supabase.from('circulos').update({ moderator_ids: mods }).eq('id', cid);
    }
    return fetchCirculoById(cid);
  },

  addScheduleItem: async (cid: string, item: Omit<CirculoScheduleItem, 'id'>, uid: string) => {
    assertConfigured();
    await supabase.from('circulo_schedule_items').insert({
      circulo_id: cid,
      title: item.title,
      time: item.time,
      prayer_id: item.prayerId,
    });
    return fetchCirculoById(cid);
  },

  updateScheduleItem: async (cid: string, itemId: string, item: Omit<CirculoScheduleItem, 'id'>, uid: string) => {
    assertConfigured();
    await supabase
      .from('circulo_schedule_items')
      .update({ title: item.title, time: item.time, prayer_id: item.prayerId })
      .eq('id', itemId)
      .eq('circulo_id', cid);
    return fetchCirculoById(cid);
  },

  deleteScheduleItem: async (cid: string, itemId: string, uid: string) => {
    assertConfigured();
    await supabase.from('circulo_schedule_items').delete().eq('id', itemId).eq('circulo_id', cid);
    return fetchCirculoById(cid);
  },

  updateCirculo: async (cid: string, data: Partial<Circulo>, uid: string) => {
    assertConfigured();
    const row: Record<string, unknown> = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.description !== undefined) row.description = data.description;
    if (data.imageUrl !== undefined) row.image_url = data.imageUrl;
    if (data.coverImageUrl !== undefined) row.cover_image_url = data.coverImageUrl;
    if (data.externalLinks !== undefined) row.external_links = data.externalLinks;
    if (data.devocionary !== undefined) row.devocionary = data.devocionary;
    if (Object.keys(row).length > 0) await supabase.from('circulos').update(row).eq('id', cid);
    return fetchCirculoById(cid);
  },

  updateCirculoDevocionary: async (cid: string, devocionary: CirculoDevocionary, uid: string) => {
    assertConfigured();
    const { error } = await supabase.from('circulos').update({ devocionary }).eq('id', cid);
    if (error) throw new Error('Sem permissão para editar o devocionário.');
    const c = await fetchCirculoById(cid);
    if (!c) throw new Error('Círculo não encontrado.');
    return c;
  },

  getCirculoMembers: async (id: string) => {
    assertConfigured();
    const { data, error } = await supabase.from('circulo_members').select('user_id').eq('circulo_id', id);
    if (error) throw error;
    const userIds = (data || []).map((x) => x.user_id as string);
    if (userIds.length === 0) return [];
    const { data: profiles, error: e2 } = await supabase.from('profiles').select('*').in('id', userIds);
    if (e2) throw e2;
    return (profiles || []).map((p) => {
      const pr = p as Record<string, unknown>;
      return profileRowToUser(pr, (pr.email as string) || '', []);
    });
  },

  handlePostReaction: async (cid: string, pid: string, uid: string, emoji: string) => {
    assertConfigured();
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', pid)
      .eq('user_id', uid)
      .maybeSingle();
    if (existing) {
      const ex = existing as { emoji: string };
      if (ex.emoji === emoji) {
        await supabase.from('post_reactions').delete().eq('post_id', pid).eq('user_id', uid);
      } else {
        await supabase.from('post_reactions').update({ emoji }).eq('post_id', pid).eq('user_id', uid);
      }
    } else {
      await supabase.from('post_reactions').insert({ post_id: pid, user_id: uid, emoji });
    }
    return fetchCirculoById(cid);
  },
};
