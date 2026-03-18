
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
  /** Conteúdo rico (editor profissional). Usado principalmente em devoções e devocionários. */
  content?: RichContent;
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

export type RichContent = {
  type: 'tiptap';
  version: 1;
  /** JSON do documento (TipTap/ProseMirror). */
  doc: unknown;
};

export type DevocionaryThemeId =
  | 'MISSAL_ANTIGO'
  | 'MONASTICO_ESPERANCA'
  | 'AZUL_CALMO'
  | 'ROXO_NOITE'
  | 'BRANCO_DOURADO';

export type PrayerEditSuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PrayerEditSuggestion {
  id: string;
  prayerId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status: PrayerEditSuggestionStatus;
  proposed: Partial<Prayer>;
  reason?: string;
  reviewerId?: string;
  reviewedAt?: string;
  reviewerNote?: string;
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
  devocionary?: CirculoDevocionary;
}

export interface CirculoDevocionary {
  title: string;
  updatedAt: string;
  updatedBy: { id: string; name: string };
  themeId?: DevocionaryThemeId;
  content?: RichContent;
  /**
   * Campos legados (antes do “documento único”).
   * Mantemos para migração suave de devocionários antigos.
   */
  sections?: CirculoDevocionarySection[];
}

export interface CirculoDevocionarySection {
  id: string;
  title: string;
  subtitle?: string;
  /** Texto corrido rico (editor profissional) */
  content?: RichContent;
  items: CirculoDevocionaryItem[];
}

export type CirculoDevocionaryItemKind = 'PRAYER' | 'DEVOTION' | 'TEXT';

export interface CirculoDevocionaryItem {
  id: string;
  kind: CirculoDevocionaryItemKind;
  refPrayerId?: string;
  text?: string;
}

export interface PrayerSchedule {
  id: string;
  /** Horário no formato HH:mm */
  time: string;
  prayerId: string;
  /** Rótulo opcional definido pelo usuário (ex.: "Antes do trabalho") */
  label?: string;
  completed: boolean;
}

export enum Page {
  Home = 'HOME',
  Prayers = 'PRAYERS',
  Devotions = 'DEVOTIONS',
  Circulos = 'CIRCULOS',
  Profile = 'PROFILE',
  EditPrayer = 'EDIT_PRAYER',
  EditorReview = 'EDITOR_REVIEW'
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
