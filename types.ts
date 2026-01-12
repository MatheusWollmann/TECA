
export enum UserRole {
  User = 'USER',
  Editor = 'EDITOR',
}

export interface DayCompletion {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  avatarUrl: string;
  graces: number;
  totalPrayers: number;
  streak: number;
  level: SpiritualLevel;
  favoritePrayerIds: string[];
  joinedCirculoIds: string[];
  role: UserRole;
  schedule: PrayerSchedule[];
  history: Record<string, DayCompletion>; // Key: "YYYY-MM-DD"
}

export interface Prayer {
  id: string;
  title: string;
  text: string;
  latinText?: string;
  category: PrayerCategory;
  tags: string[];
  imageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  prayerCount: number;
  parentPrayerId?: string;
  isDevotion?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
  createdAt: string;
  mentionedPrayerIds?: string[];
  mentionedUserIds?: string[];
  reactions: { userId: string; emoji: string }[];
  replies: Post[];
  isPinned?: boolean;
}

export interface CirculoScheduleItem {
  id: string;
  title: string;
  time: string;
  prayerId: string;
}

export interface Circulo {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  moderatorIds: string[];
  memberCount: number;
  imageUrl: string;
  coverImageUrl: string;
  externalLinks: { title: string; url: string }[];
  posts: Post[];
  schedule: CirculoScheduleItem[];
}

export interface PrayerSchedule {
  id: string;
  time: 'Manhã' | 'Tarde' | 'Noite';
  prayerId: string;
  completed: boolean;
}

export enum Page {
  Home = 'HOME',
  Prayers = 'PRAYERS',
  Devotions = 'DEVOTIONS',
  Circulos = 'CIRCULOS',
  Profile = 'PROFILE'
}

export enum SpiritualLevel {
  Peregrino = 'Peregrino',
  Devoto = 'Devoto',
  Servo = 'Servo',
  Apóstolo = 'Apóstolo'
}

export enum PrayerCategory {
    Diarias = 'Diárias',
    Marianas = 'Marianas',
    Santos = 'Santos',
    MomentosDaVida = 'Momentos da Vida',
    IntencaoEspecial = 'Intenção Especial',
}
