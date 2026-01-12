
import {
  MOCK_USER,
  MOCK_PRAYERS,
  MOCK_CIRCULOS,
  SPIRITUAL_LEVELS,
} from './constants';
import { User, Prayer, Circulo, Post, SpiritualLevel, UserRole, CirculoScheduleItem, PrayerSchedule } from './types';

// Persistence Keys
const DB_KEY = 'oracomigo_db_v1';

const getInitialDB = () => {
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved DB", e);
    }
  }
  return {
    users: [
      JSON.parse(JSON.stringify(MOCK_USER)),
      { id: 'user2', name: 'Carlos', email: 'carlos@email.com', city: 'Piracicaba', avatarUrl: 'https://picsum.photos/seed/carlos/100/100', graces: 300, level: SpiritualLevel.Servo, favoritePrayerIds: ['p2'], joinedCirculoIds: ['c1'], role: UserRole.User, schedule: [] },
      { id: 'user3', name: 'João', email: 'joao@email.com', city: 'São Paulo', avatarUrl: 'https://picsum.photos/seed/joao/100/100', graces: 80, level: SpiritualLevel.Devoto, favoritePrayerIds: [], joinedCirculoIds: ['c1', 'c2'], role: UserRole.User, schedule: [] },
      { id: 'user4', name: 'Mariana', email: 'mariana@email.com', city: 'São Paulo', avatarUrl: 'https://picsum.photos/seed/mariana/100/100', graces: 450, level: SpiritualLevel.Servo, favoritePrayerIds: ['p2','p4'], joinedCirculoIds: ['c2'], role: UserRole.User, schedule: [] },
      { id: 'user5', name: 'Ana Clara', email: 'ana@email.com', city: 'Campinas', avatarUrl: 'https://picsum.photos/seed/anaclara/100/100', graces: 150, level: SpiritualLevel.Devoto, favoritePrayerIds: ['p3'], joinedCirculoIds: ['c3', 'c1'], role: UserRole.User, schedule: [] },
    ],
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

export const api = {
  login: async (): Promise<User> => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find((u: any) => u.id === 'user1');
    if (!user) throw new Error("User not found");
    return { ...user };
  },

  logout: async (): Promise<void> => {
    await delay(200);
    return;
  },

  getData: async (userId: string): Promise<{ user: User; prayers: Prayer[]; circulos: Circulo[] }> => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) throw new Error("User not found");
    return {
      user: { ...user },
      prayers: [...db.prayers],
      circulos: [...db.circulos],
    };
  },

  toggleFavorite: async (userId: string, prayerId: string): Promise<string[]> => {
    await delay(100);
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) throw new Error("User not found");

    const isFavorite = user.favoritePrayerIds.includes(prayerId);
    if (isFavorite) {
      user.favoritePrayerIds = user.favoritePrayerIds.filter((id: string) => id !== prayerId);
    } else {
      user.favoritePrayerIds.push(prayerId);
    }
    saveDB();
    return [...user.favoritePrayerIds];
  },
  
  addPrayer: async (prayerData: Partial<Prayer>, author: User): Promise<Prayer | null> => {
    await delay(SIMULATED_DELAY);
    if (author.role !== UserRole.Editor) return null;
    
    const newPrayer: Prayer = {
        id: `p${Date.now()}`,
        title: prayerData.title || 'Sem Título',
        text: prayerData.text || '',
        category: prayerData.category!,
        tags: prayerData.tags || [],
        latinText: prayerData.latinText,
        parentPrayerId: prayerData.parentPrayerId,
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

  updatePrayer: async (prayerId: string, prayerData: Partial<Prayer>, user: User): Promise<Prayer | null> => {
    await delay(SIMULATED_DELAY);
    const prayer = db.prayers.find((p: any) => p.id === prayerId);
    if (!prayer) throw new Error("Prayer not found");
    if(user.role !== UserRole.Editor) return null;
    Object.assign(prayer, prayerData);
    saveDB();
    return JSON.parse(JSON.stringify(prayer));
  },

  incrementPrayerCount: async (prayerId: string): Promise<number> => {
    const prayer = db.prayers.find((p: any) => p.id === prayerId);
    if (!prayer) throw new Error("Prayer not found");
    prayer.prayerCount += 1;
    saveDB();
    return prayer.prayerCount;
  },

  updateUserGraces: async (userId: string, graceAmount: number): Promise<{graces: number, level: SpiritualLevel}> => {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.graces += graceAmount;

    let newLevel = user.level;
    for (const level in SPIRITUAL_LEVELS) {
        if (user.graces >= SPIRITUAL_LEVELS[level as SpiritualLevel].min) {
            newLevel = level as SpiritualLevel;
        }
    }
    user.level = newLevel;
    saveDB();
    return { graces: user.graces, level: user.level };
  },

  setScheduledPrayer: async (userId: string, period: 'Manhã' | 'Tarde' | 'Noite', prayerId: string): Promise<PrayerSchedule[]> => {
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) throw new Error("User not found");
    if (!user.schedule) user.schedule = [];
    const idx = user.schedule.findIndex((s: any) => s.time === period);
    if (idx > -1) {
      user.schedule[idx].prayerId = prayerId;
    } else {
      user.schedule.push({ id: `sched-${Date.now()}`, time: period, prayerId });
    }
    saveDB();
    return JSON.parse(JSON.stringify(user.schedule));
  },

  removeScheduledPrayer: async (userId: string, period: 'Manhã' | 'Tarde' | 'Noite'): Promise<PrayerSchedule[]> => {
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.schedule = (user.schedule || []).filter((s: any) => s.time !== period);
    saveDB();
    return JSON.parse(JSON.stringify(user.schedule));
  },

  toggleCirculoMembership: async (userId: string, circuloId: string): Promise<{ joinedCirculoIds: string[], memberCount: number }> => {
    const user = db.users.find((u: any) => u.id === userId);
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!user || !circulo) throw new Error("User or Circulo not found");

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
  
  addPost: async (circuloId: string, text: string, author: User): Promise<Post> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    const newPost: Post = {
        id: `post${Date.now()}`,
        authorId: author.id, authorName: author.name, authorAvatarUrl: author.avatarUrl,
        text, createdAt: 'Agora', reactions: [], replies: [],
    };
    circulo.posts.unshift(newPost);
    saveDB();
    return { ...newPost };
  },

  addReply: async (circuloId: string, parentPostId: string, text: string, author: User): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    const newReply: Post = {
        id: `reply${Date.now()}`,
        authorId: author.id, authorName: author.name, authorAvatarUrl: author.avatarUrl,
        text, createdAt: 'Agora', reactions: [], replies: [],
    };
    const add = (posts: Post[]): boolean => {
        for (const post of posts) {
            if (post.id === parentPostId) { post.replies.push(newReply); return true; }
            if (post.replies && add(post.replies)) return true;
        }
        return false;
    };
    add(circulo.posts);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  handlePostReaction: async (circuloId: string, postId: string, userId: string, emoji: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    const react = (posts: Post[]): boolean => {
      for (const post of posts) {
        if (post.id === postId) {
          const idx = post.reactions.findIndex(r => r.userId === userId);
          if (idx > -1) {
            if (post.reactions[idx].emoji === emoji) post.reactions.splice(idx, 1);
            else post.reactions[idx].emoji = emoji;
          } else post.reactions.push({ userId, emoji });
          return true; 
        }
        if (post.replies && react(post.replies)) return true;
      }
      return false;
    };
    react(circulo.posts);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  getCirculoMembers: async (circuloId: string): Promise<User[]> => {
    return JSON.parse(JSON.stringify(db.users.filter((u: any) => u.joinedCirculoIds.includes(circuloId))));
  },

  updateCirculo: async (circuloId: string, data: Partial<Circulo>, updaterId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(updaterId)) throw new Error("Denied");
    Object.assign(circulo, data);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  deletePost: async (circuloId: string, postId: string, deleterId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(deleterId)) throw new Error("Denied");
    const del = (posts: Post[]): boolean => {
        const idx = posts.findIndex(p => p.id === postId);
        if (idx !== -1) { posts.splice(idx, 1); return true; }
        for (const post of posts) if (post.replies && del(post.replies)) return true;
        return false;
    };
    del(circulo.posts);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  pinPost: async (circuloId: string, postId: string, pinnerId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(pinnerId)) throw new Error("Denied");
    const post = circulo.posts.find((p: any) => p.id === postId);
    if (post) {
        const wasPinned = post.isPinned;
        circulo.posts.forEach((p: any) => p.isPinned = false);
        post.isPinned = !wasPinned;
    }
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  updateMemberRole: async (circuloId: string, memberId: string, isMod: boolean, updaterId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(updaterId)) throw new Error("Denied");
    if (isMod) { if (!circulo.moderatorIds.includes(memberId)) circulo.moderatorIds.push(memberId); }
    else circulo.moderatorIds = circulo.moderatorIds.filter((id: string) => id !== memberId);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  removeMember: async (circuloId: string, memberId: string, removerId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    const member = db.users.find((u: any) => u.id === memberId);
    if (!circulo || !member || !circulo.moderatorIds.includes(removerId)) throw new Error("Denied");
    member.joinedCirculoIds = member.joinedCirculoIds.filter((id: string) => id !== circuloId);
    circulo.memberCount = db.users.filter((u: any) => u.joinedCirculoIds.includes(circuloId)).length;
    circulo.moderatorIds = circulo.moderatorIds.filter((id: string) => id !== memberId);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  addScheduleItem: async (circuloId: string, item: Omit<CirculoScheduleItem, 'id'>, adderId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(adderId)) throw new Error("Denied");
    circulo.schedule.push({ ...item, id: `s${Date.now()}` });
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  updateScheduleItem: async (circuloId: string, itemId: string, item: Omit<CirculoScheduleItem, 'id'>, updaterId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(updaterId)) throw new Error("Denied");
    const idx = circulo.schedule.findIndex((s: any) => s.id === itemId);
    if (idx > -1) circulo.schedule[idx] = { ...item, id: itemId };
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },

  deleteScheduleItem: async (circuloId: string, itemId: string, deleterId: string): Promise<Circulo> => {
    const circulo = db.circulos.find((c: any) => c.id === circuloId);
    if (!circulo || !circulo.moderatorIds.includes(deleterId)) throw new Error("Denied");
    circulo.schedule = circulo.schedule.filter((s: any) => s.id !== itemId);
    saveDB();
    return JSON.parse(JSON.stringify(circulo));
  },
};
