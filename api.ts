
import {
  MOCK_USER,
  MOCK_PRAYERS,
  MOCK_CIRCULOS,
  SPIRITUAL_LEVELS,
} from './constants';
import { User, Prayer, Circulo, Post, SpiritualLevel, UserRole, CirculoScheduleItem, PrayerSchedule } from './types';

const MOCK_USERS: User[] = [
    JSON.parse(JSON.stringify(MOCK_USER)),
    { id: 'user2', name: 'Carlos', email: 'carlos@email.com', city: 'Piracicaba', avatarUrl: 'https://picsum.photos/seed/carlos/100/100', graces: 300, level: SpiritualLevel.Servo, favoritePrayerIds: ['p2'], joinedCirculoIds: ['c1'], role: UserRole.User, schedule: [] },
    { id: 'user3', name: 'João', email: 'joao@email.com', city: 'São Paulo', avatarUrl: 'https://picsum.photos/seed/joao/100/100', graces: 80, level: SpiritualLevel.Devoto, favoritePrayerIds: [], joinedCirculoIds: ['c1', 'c2'], role: UserRole.User, schedule: [] },
    { id: 'user4', name: 'Mariana', email: 'mariana@email.com', city: 'São Paulo', avatarUrl: 'https://picsum.photos/seed/mariana/100/100', graces: 450, level: SpiritualLevel.Servo, favoritePrayerIds: ['p2','p4'], joinedCirculoIds: ['c2'], role: UserRole.User, schedule: [] },
    { id: 'user5', name: 'Ana Clara', email: 'ana@email.com', city: 'Campinas', avatarUrl: 'https://picsum.photos/seed/anaclara/100/100', graces: 150, level: SpiritualLevel.Devoto, favoritePrayerIds: ['p3'], joinedCirculoIds: ['c3', 'c1'], role: UserRole.User, schedule: [] },
];


// Simulate a database with our mock data, allowing mutations
let db = {
  users: JSON.parse(JSON.stringify(MOCK_USERS)),
  prayers: JSON.parse(JSON.stringify(MOCK_PRAYERS)),
  circulos: JSON.parse(JSON.stringify(MOCK_CIRCULOS)),
};

const SIMULATED_DELAY = 500;

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Functions ---

export const api = {
  // AUTH
  login: async (email?: string, password?: string): Promise<User> => {
    await delay(SIMULATED_DELAY * 2);
    // In a real app, you'd validate email/password
    const user = db.users.find(u => u.id === 'user1');
    if (!user) throw new Error("User not found");
    return { ...user }; // Return a copy
  },

  logout: async (): Promise<void> => {
    await delay(SIMULATED_DELAY);
    return;
  },

  // DATA FETCHING
  getData: async (userId: string): Promise<{ user: User; prayers: Prayer[]; circulos: Circulo[] }> => {
    await delay(SIMULATED_DELAY * 3);
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    return {
      user: { ...user },
      prayers: [...db.prayers],
      circulos: [...db.circulos],
    };
  },

  // PRAYERS
  toggleFavorite: async (userId: string, prayerId: string): Promise<string[]> => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");

    const isFavorite = user.favoritePrayerIds.includes(prayerId);
    if (isFavorite) {
      user.favoritePrayerIds = user.favoritePrayerIds.filter(id => id !== prayerId);
    } else {
      user.favoritePrayerIds.push(prayerId);
    }
    return [...user.favoritePrayerIds];
  },
  
  addPrayer: async (prayerData: Partial<Prayer>, author: User): Promise<Prayer | null> => {
    await delay(SIMULATED_DELAY);
    
    if (author.role !== UserRole.Editor) {
      console.log("SUBMISSION PENDING REVIEW (from non-editor):", prayerData);
      return null;
    }
    
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
    return { ...newPrayer };
  },

  updatePrayer: async (prayerId: string, prayerData: Partial<Prayer>, user: User): Promise<Prayer | null> => {
    await delay(SIMULATED_DELAY);
    const prayer = db.prayers.find(p => p.id === prayerId);
    if (!prayer) throw new Error("Prayer not found");

    if(user.role !== UserRole.Editor) {
        console.log(`EDIT SUBMISSION PENDING REVIEW for prayer ${prayerId} (from non-editor):`, prayerData);
        return null;
    }
    
    Object.assign(prayer, prayerData);
    return JSON.parse(JSON.stringify(prayer));
  },

  incrementPrayerCount: async (prayerId: string): Promise<number> => {
    await delay(SIMULATED_DELAY / 2);
    const prayer = db.prayers.find(p => p.id === prayerId);
    if (!prayer) throw new Error("Prayer not found");
    prayer.prayerCount += 1;
    return prayer.prayerCount;
  },

  // USER
  updateUserGraces: async (userId: string, graceAmount: number): Promise<{graces: number, level: SpiritualLevel}> => {
    await delay(SIMULATED_DELAY / 2);
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    user.graces += graceAmount;

    // Update level
    let newLevel = user.level;
    for (const level in SPIRITUAL_LEVELS) {
        if (user.graces >= SPIRITUAL_LEVELS[level as SpiritualLevel].min) {
            newLevel = level as SpiritualLevel;
        }
    }
    user.level = newLevel;

    return { graces: user.graces, level: user.level };
  },

  // SCHEDULE
  setScheduledPrayer: async (userId: string, period: 'Manhã' | 'Tarde' | 'Noite', prayerId: string): Promise<PrayerSchedule[]> => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) throw new Error("User not found");
    
    if (!user.schedule) user.schedule = [];
    const existingScheduleIndex = user.schedule.findIndex(s => s.time === period);
    if (existingScheduleIndex > -1) {
      user.schedule[existingScheduleIndex].prayerId = prayerId;
    } else {
      user.schedule.push({ id: `sched-${Date.now()}`, time: period, prayerId });
    }

    return JSON.parse(JSON.stringify(user.schedule));
  },

  removeScheduledPrayer: async (userId: string, period: 'Manhã' | 'Tarde' | 'Noite'): Promise<PrayerSchedule[]> => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) throw new Error("User not found");
    
    if (!user.schedule) user.schedule = [];
    user.schedule = user.schedule.filter(s => s.time !== period);
    return JSON.parse(JSON.stringify(user.schedule));
  },

  // CIRCULOS
  toggleCirculoMembership: async (userId: string, circuloId: string): Promise<{ joinedCirculoIds: string[], memberCount: number }> => {
    await delay(SIMULATED_DELAY);
    const user = db.users.find(u => u.id === userId);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!user || !circulo) throw new Error("User or Circulo not found");

    const isMember = user.joinedCirculoIds.includes(circuloId);
    if (isMember) {
      user.joinedCirculoIds = user.joinedCirculoIds.filter(id => id !== circuloId);
      circulo.memberCount -= 1;
    } else {
      user.joinedCirculoIds.push(circuloId);
      circulo.memberCount += 1;
    }
    return { joinedCirculoIds: [...user.joinedCirculoIds], memberCount: circulo.memberCount };
  },
  
  addPost: async (circuloId: string, text: string, author: User): Promise<Post> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");

    const newPost: Post = {
        id: `post${Date.now()}`,
        authorId: author.id,
        authorName: author.name,
        authorAvatarUrl: author.avatarUrl,
        text,
        createdAt: 'Agora mesmo',
        reactions: [],
        replies: [],
    };
    circulo.posts.unshift(newPost);
    return { ...newPost };
  },

  addReply: async (circuloId: string, parentPostId: string, text: string, author: User): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    
    const newReply: Post = {
        id: `reply${Date.now()}`,
        authorId: author.id,
        authorName: author.name,
        authorAvatarUrl: author.avatarUrl,
        text,
        createdAt: 'Agora mesmo',
        reactions: [],
        replies: [],
    };

    const findAndAddReply = (posts: Post[]): boolean => {
        for (const post of posts) {
            if (post.id === parentPostId) {
                post.replies.push(newReply);
                return true;
            }
            if (post.replies && post.replies.length > 0) {
                if (findAndAddReply(post.replies)) {
                    return true;
                }
            }
        }
        return false;
    };

    findAndAddReply(circulo.posts);

    return JSON.parse(JSON.stringify(circulo));
  },

  handlePostReaction: async (circuloId: string, postId: string, userId: string, emoji: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY / 2);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");

    const findAndReact = (posts: Post[]): boolean => {
      for (const post of posts) {
        if (post.id === postId) {
          const existingReactionIndex = post.reactions.findIndex(r => r.userId === userId);
          if (existingReactionIndex > -1) {
            if (post.reactions[existingReactionIndex].emoji === emoji) {
              post.reactions.splice(existingReactionIndex, 1);
            } else {
              post.reactions[existingReactionIndex].emoji = emoji;
            }
          } else {
            post.reactions.push({ userId, emoji });
          }
          return true; 
        }
        if (post.replies && post.replies.length > 0) {
          if (findAndReact(post.replies)) {
            return true;
          }
        }
      }
      return false;
    };

    findAndReact(circulo.posts);
    return JSON.parse(JSON.stringify(circulo));
  },

  // MODERATOR ACTIONS
  getCirculoMembers: async (circuloId: string): Promise<User[]> => {
    await delay(SIMULATED_DELAY);
    return JSON.parse(JSON.stringify(db.users.filter(u => u.joinedCirculoIds.includes(circuloId))));
  },

  updateCirculo: async (circuloId: string, data: Partial<Circulo>, updaterId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(updaterId)) throw new Error("Permission denied");
    
    Object.assign(circulo, data);
    return JSON.parse(JSON.stringify(circulo));
  },

  deletePost: async (circuloId: string, postId: string, deleterId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(deleterId)) throw new Error("Permission denied");

    const findAndDelete = (posts: Post[]): boolean => {
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
            posts.splice(postIndex, 1);
            return true;
        }
        for (const post of posts) {
            if (post.replies && findAndDelete(post.replies)) {
                return true;
            }
        }
        return false;
    };

    findAndDelete(circulo.posts);
    return JSON.parse(JSON.stringify(circulo));
  },

  pinPost: async (circuloId: string, postId: string, pinnerId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(pinnerId)) throw new Error("Permission denied");

    let targetPost: Post | undefined;
    for (const post of circulo.posts) {
        if(post.id === postId) targetPost = post;
    }
    
    if (targetPost) {
        const isCurrentlyPinned = targetPost.isPinned;
        // Unpin all posts first
        circulo.posts.forEach(p => p.isPinned = false);
        // If the post was not already pinned, pin it
        if (!isCurrentlyPinned) {
            targetPost.isPinned = true;
        }
    }
    
    return JSON.parse(JSON.stringify(circulo));
  },

  updateMemberRole: async (circuloId: string, memberId: string, isModerator: boolean, updaterId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(updaterId)) throw new Error("Permission denied");

    if (isModerator) {
        if (!circulo.moderatorIds.includes(memberId)) {
            circulo.moderatorIds.push(memberId);
        }
    } else {
        circulo.moderatorIds = circulo.moderatorIds.filter(id => id !== memberId);
    }
    return JSON.parse(JSON.stringify(circulo));
  },

  removeMember: async (circuloId: string, memberId: string, removerId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    const member = db.users.find(u => u.id === memberId);
    if (!circulo || !member) throw new Error("Circulo or Member not found");
    if (!circulo.moderatorIds.includes(removerId)) throw new Error("Permission denied");
    
    member.joinedCirculoIds = member.joinedCirculoIds.filter(id => id !== circuloId);
    circulo.memberCount = db.users.filter(u => u.joinedCirculoIds.includes(circuloId)).length;
    circulo.moderatorIds = circulo.moderatorIds.filter(id => id !== memberId);

    return JSON.parse(JSON.stringify(circulo));
  },

  addScheduleItem: async (circuloId: string, item: Omit<CirculoScheduleItem, 'id'>, adderId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(adderId)) throw new Error("Permission denied");

    const newItem: CirculoScheduleItem = { ...item, id: `s${Date.now()}` };
    circulo.schedule.push(newItem);
    return JSON.parse(JSON.stringify(circulo));
  },

  updateScheduleItem: async (circuloId: string, itemId: string, item: Omit<CirculoScheduleItem, 'id'>, updaterId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(updaterId)) throw new Error("Permission denied");
    
    const itemIndex = circulo.schedule.findIndex(s => s.id === itemId);
    if (itemIndex > -1) {
        circulo.schedule[itemIndex] = { ...item, id: itemId };
    }
    return JSON.parse(JSON.stringify(circulo));
  },

  deleteScheduleItem: async (circuloId: string, itemId: string, deleterId: string): Promise<Circulo> => {
    await delay(SIMULATED_DELAY);
    const circulo = db.circulos.find(c => c.id === circuloId);
    if (!circulo) throw new Error("Circulo not found");
    if (!circulo.moderatorIds.includes(deleterId)) throw new Error("Permission denied");

    circulo.schedule = circulo.schedule.filter(s => s.id !== itemId);
    return JSON.parse(JSON.stringify(circulo));
  },

};