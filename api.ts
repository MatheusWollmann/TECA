
import {
  MOCK_USER,
  MOCK_PRAYERS,
  MOCK_CIRCULOS,
  SPIRITUAL_LEVELS,
} from './constants';
import { User, Prayer, Circulo, Post, SpiritualLevel, UserRole, CirculoScheduleItem, PrayerSchedule, DayCompletion } from './types';

const DB_KEY = 'teca_db_beta';

const getInitialDB = () => {
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Erro ao carregar banco local", e);
    }
  }
  return {
    users: [JSON.parse(JSON.stringify(MOCK_USER))],
    prayers: JSON.parse(JSON.stringify(MOCK_PRAYERS)),
    circulos: JSON.parse(JSON.stringify(MOCK_CIRCULOS)),
  };
};

let db = getInitialDB();

const saveDB = () => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

const SIMULATED_DELAY = 400;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função auxiliar para calcular o streak real baseado no histórico
const calculateCurrentStreak = (history: Record<string, DayCompletion>): number => {
  const dates = Object.keys(history).sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verifica se a última entrada foi hoje ou ontem
  const lastDate = new Date(dates[0] + 'T00:00:00');
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

  if (diffDays > 1) return 0; // Quebrou o streak

  for (let i = 0; i < dates.length; i++) {
    const current = new Date(dates[i] + 'T00:00:00');
    const prev = i === 0 ? today : new Date(dates[i-1] + 'T00:00:00');
    
    // Simplificação para o beta: se houver entrada no dia, conta pro streak
    streak++;
    
    // Se a diferença entre esse dia e o próximo no histórico for maior que 1 dia, para
    if (i < dates.length - 1) {
        const nextDate = new Date(dates[i+1] + 'T00:00:00');
        const gap = Math.floor((current.getTime() - nextDate.getTime()) / (1000 * 3600 * 24));
        if (gap > 1) break;
    }
  }
  return streak;
};

export const api = {
  login: async (email?: string): Promise<User> => {
    await delay(SIMULATED_DELAY);
    const targetEmail = email || 'fiel@teca.com';
    const user = db.users.find((u: User) => u.email === targetEmail);
    if (!user) throw new Error("Usuário não encontrado.");
    
    // Ao logar, atualizamos o streak
    if (user) {
        user.streak = calculateCurrentStreak(user.history || {});
        saveDB();
    }
    return { ...user };
  },

  signup: async (name: string, email: string): Promise<User> => {
    await delay(SIMULATED_DELAY);
    const newUser: User = {
      id: `u${Date.now()}`,
      name, email, city: 'Nova Comunidade',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      graces: 0,
      totalPrayers: 0,
      streak: 1,
      level: SpiritualLevel.Peregrino,
      favoritePrayerIds: [],
      joinedCirculoIds: [],
      role: UserRole.User,
      schedule: [],
      history: {}
    };
    db.users.push(newUser);
    saveDB();
    return { ...newUser };
  },

  getData: async (userId: string) => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find((u: any) => u.id === userId);
    return {
      user: user ? { ...user } : null,
      prayers: [...db.prayers],
      circulos: [...db.circulos],
    };
  },

  incrementPrayerCount: async (prayerId: string) => {
    const prayer = db.prayers.find((p: any) => p.id === prayerId);
    if (prayer) {
        prayer.prayerCount += 1;
        saveDB();
        return prayer.prayerCount;
    }
    return 0;
  },

  toggleFavorite: async (userId: string, prayerId: string) => {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return [];
    const idx = user.favoritePrayerIds.indexOf(prayerId);
    if (idx > -1) user.favoritePrayerIds.splice(idx, 1);
    else user.favoritePrayerIds.push(prayerId);
    saveDB();
    return [...user.favoritePrayerIds];
  },

  // --- CRONOGRAMA & HISTÓRICO ---
  addScheduledPrayer: async (userId: string, period: 'Manhã' | 'Tarde' | 'Noite', prayerId: string) => {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return [];
    user.schedule.push({ id: `s${Date.now()}`, time: period, prayerId, completed: false });
    saveDB();
    return [...user.schedule];
  },

  removeScheduledPrayer: async (userId: string, scheduleItemId: string) => {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return [];
    user.schedule = (user.schedule || []).filter((s: any) => s.id !== scheduleItemId);
    saveDB();
    return [...user.schedule];
  },

  toggleScheduledPrayer: async (userId: string, scheduleItemId: string) => {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return [];
    const item = (user.schedule || []).find((s: any) => s.id === scheduleItemId);
    if (item) {
        item.completed = !item.completed;
        
        // Atualiza Histórico do dia
        const today = new Date().toISOString().split('T')[0];
        if (!user.history) user.history = {};
        if (!user.history[today]) user.history[today] = { morning: false, afternoon: false, night: false };
        
        const checkPeriod = (p: 'Manhã' | 'Tarde' | 'Noite') => {
            const periodPrayers = user.schedule.filter((s:any) => s.time === p);
            return periodPrayers.length > 0 && periodPrayers.every((s:any) => s.completed);
        }

        user.history[today].morning = checkPeriod('Manhã');
        user.history[today].afternoon = checkPeriod('Tarde');
        user.history[today].night = checkPeriod('Noite');
        
        user.streak = calculateCurrentStreak(user.history);
        saveDB();
    }
    return [...user.schedule];
  },

  // --- GAMIFICATION ---
  updateUserGraces: async (userId: string, amount: number) => {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return { graces: 0, level: SpiritualLevel.Peregrino };
    
    const today = new Date().toISOString().split('T')[0];
    user.graces += amount;
    user.totalPrayers += 1;
    
    // Garantir que o dia existe no histórico para não quebrar o streak
    if (!user.history) user.history = {};
    if (!user.history[today]) {
        user.history[today] = { morning: false, afternoon: false, night: false };
    }
    
    user.streak = calculateCurrentStreak(user.history);

    for (const level in SPIRITUAL_LEVELS) {
        if (user.graces >= SPIRITUAL_LEVELS[level as SpiritualLevel].min) {
            user.level = level as SpiritualLevel;
        }
    }
    saveDB();
    return { graces: user.graces, level: user.level, totalPrayers: user.totalPrayers, streak: user.streak };
  },

  // --- OUTROS MÉTODOS ---
  addPrayer: async (prayerData: Partial<Prayer>, author: User): Promise<Prayer> => {
    const newPrayer: Prayer = {
        id: `p${Date.now()}`,
        title: prayerData.title || 'Sem Título',
        text: prayerData.text || '',
        category: prayerData.category!,
        tags: prayerData.tags || [],
        latinText: prayerData.latinText,
        authorId: author.id,
        authorName: author.name,
        createdAt: 'Agora mesmo',
        prayerCount: 0,
        isDevotion: !!prayerData.isDevotion,
    };
    db.prayers.unshift(newPrayer);
    saveDB();
    return { ...newPrayer };
  },

  addPost: async (circuloId: string, text: string, author: User): Promise<Post> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo) throw new Error("Círculo não encontrado");
    const newPost: Post = {
        id: `post${Date.now()}`,
        authorId: author.id, authorName: author.name, authorAvatarUrl: author.avatarUrl,
        text, createdAt: 'Agora', reactions: [], replies: [],
    };
    circulo.posts.unshift(newPost);
    saveDB();
    return { ...newPost };
  },

  toggleCirculoMembership: async (userId: string, circuloId: string) => {
    const user = db.users.find((u: any) => u.id === userId);
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!user || !circulo) return { joinedCirculoIds: [], memberCount: 0 };
    const isMember = user.joinedCirculoIds.includes(circuloId);
    if (isMember) {
      user.joinedCirculoIds = user.joinedCirculoIds.filter((id: string) => id !== circuloId);
      circulo.memberCount -= 1;
    } else {
      user.joinedCirculoIds.push(circuloId);
      circulo.memberCount += 1;
    }
    saveDB();
    return { joinedCirculoIds: [...user.joinedCirculoIds], memberCount: circulo.memberCount };
  },

  logout: async () => await delay(100),
  
  // FIX: Added addCirculo and fixed signatures for updatePrayer and all circle management methods
  updatePrayer: async (prayerId: string, prayerData: Partial<Prayer>, user: User): Promise<Prayer | null> => {
    const prayer = db.prayers.find((p: any) => p.id === prayerId);
    if (prayer) {
      Object.assign(prayer, prayerData);
      saveDB();
      return { ...prayer };
    }
    return null;
  },

  addCirculo: async (data: { name: string; description: string }, user: User): Promise<Circulo> => {
    const newCirculo: Circulo = {
      id: `c${Date.now()}`,
      name: data.name,
      description: data.description,
      leaderId: user.id,
      moderatorIds: [user.id],
      memberCount: 1,
      imageUrl: `https://picsum.photos/seed/${data.name}/200/200`,
      coverImageUrl: `https://picsum.photos/seed/${data.name}_cover/800/200`,
      externalLinks: [],
      posts: [],
      schedule: []
    };
    db.circulos.push(newCirculo);
    user.joinedCirculoIds.push(newCirculo.id);
    saveDB();
    return { ...newCirculo };
  },

  addReply: async (cid: string, pid: string, text: string, user: User) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (!circulo) return null;
    const post = circulo.posts.find((p: any) => p.id === pid);
    if (post) {
      const reply: Post = {
        id: `rep${Date.now()}`,
        authorId: user.id, authorName: user.name, authorAvatarUrl: user.avatarUrl,
        text, createdAt: 'Agora', reactions: [], replies: [],
      };
      post.replies.push(reply);
      saveDB();
    }
    return { ...circulo };
  },

  deletePost: async (cid: string, pid: string, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && circulo.moderatorIds.includes(uid)) {
      circulo.posts = circulo.posts.filter((p: any) => p.id !== pid);
      saveDB();
    }
    return { ...circulo };
  },

  pinPost: async (cid: string, pid: string, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && circulo.moderatorIds.includes(uid)) {
      const post = circulo.posts.find((p: any) => p.id === pid);
      if (post) {
        post.isPinned = !post.isPinned;
        saveDB();
      }
    }
    return { ...circulo };
  },

  updateMemberRole: async (cid: string, mid: string, isModerator: boolean, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && (circulo.leaderId === uid || circulo.moderatorIds.includes(uid))) {
      if (isModerator && !circulo.moderatorIds.includes(mid)) {
        circulo.moderatorIds.push(mid);
      } else if (!isModerator) {
        circulo.moderatorIds = circulo.moderatorIds.filter((id: string) => id !== mid);
      }
      saveDB();
    }
    return { ...circulo };
  },

  removeMember: async (cid: string, mid: string, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    const userToRemove = db.users.find((u: any) => u.id === mid);
    if (circulo && circulo.moderatorIds.includes(uid) && userToRemove) {
      userToRemove.joinedCirculoIds = userToRemove.joinedCirculoIds.filter((id: string) => id !== cid);
      circulo.memberCount -= 1;
      circulo.moderatorIds = circulo.moderatorIds.filter((id: string) => id !== mid);
      saveDB();
    }
    return { ...circulo };
  },

  addScheduleItem: async (cid: string, item: Omit<CirculoScheduleItem, 'id'>, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && circulo.moderatorIds.includes(uid)) {
      circulo.schedule.push({ ...item, id: `cs${Date.now()}` });
      saveDB();
    }
    return { ...circulo };
  },

  updateScheduleItem: async (cid: string, itemId: string, item: Omit<CirculoScheduleItem, 'id'>, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && circulo.moderatorIds.includes(uid)) {
      const existing = circulo.schedule.find((i: any) => i.id === itemId);
      if (existing) {
        Object.assign(existing, item);
        saveDB();
      }
    }
    return { ...circulo };
  },

  deleteScheduleItem: async (cid: string, itemId: string, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && circulo.moderatorIds.includes(uid)) {
      circulo.schedule = circulo.schedule.filter((i: any) => i.id !== itemId);
      saveDB();
    }
    return { ...circulo };
  },

  updateCirculo: async (cid: string, data: Partial<Circulo>, uid: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (circulo && circulo.moderatorIds.includes(uid)) {
      Object.assign(circulo, data);
      saveDB();
    }
    return { ...circulo };
  },

  getCirculoMembers: async (id: string) => db.users.filter((u: any) => u.joinedCirculoIds.includes(id)),
  
  handlePostReaction: async (cid: string, pid: string, uid: string, emoji: string) => {
    const circulo = db.circulos.find((c: any) => c.id === cid);
    if (!circulo) return null;
    const post = circulo.posts.find((p: any) => p.id === pid);
    if (post) {
      const existing = post.reactions.find((r: any) => r.userId === uid);
      if (existing) {
        if (existing.emoji === emoji) {
          post.reactions = post.reactions.filter((r: any) => r.userId !== uid);
        } else {
          existing.emoji = emoji;
        }
      } else {
        post.reactions.push({ userId: uid, emoji });
      }
      saveDB();
    }
    return { ...circulo };
  }
};
