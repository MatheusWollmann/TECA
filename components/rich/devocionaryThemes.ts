export type DevocionaryThemeId =
  | 'MISSAL_ANTIGO'
  | 'MONASTICO_ESPERANCA'
  | 'AZUL_CALMO'
  | 'ROXO_NOITE'
  | 'BRANCO_DOURADO';

export interface DevocionaryTheme {
  id: DevocionaryThemeId;
  name: string;
  // Classes aplicadas no documento (editor/renderer)
  docClassName: string;
  // Classes aplicadas no card de PrayerRef
  prayerRefCardClassName: string;
  prayerRefHeaderClassName: string;
  prayerRefCardTitleClassName: string;
  prayerRefHeaderLabelClassName: string;
  prayerRefTagPillClassName: string;
}

export const devocionaryThemes: Record<DevocionaryThemeId, DevocionaryTheme> = {
  BRANCO_DOURADO: {
    id: 'BRANCO_DOURADO',
    name: 'Branco & Dourado',
    docClassName:
      'font-sans bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
    prayerRefCardClassName:
      'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
    prayerRefHeaderClassName:
      'bg-white dark:bg-gray-900/60 border-b border-gold-subtle/30',
    prayerRefCardTitleClassName:
      'font-semibold text-gold-subtle dark:text-gold-subtle',
    prayerRefHeaderLabelClassName: 'text-gold-subtle dark:text-gold-subtle',
    prayerRefTagPillClassName:
      'px-2 py-0.5 rounded-full bg-gold-subtle/10 text-[10px] font-semibold text-gold-subtle dark:text-gold-subtle',
  },
  MISSAL_ANTIGO: {
    id: 'MISSAL_ANTIGO',
    name: 'Missal Antigo',
    docClassName:
      'font-serif bg-amber-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100',
    prayerRefCardClassName:
      'bg-amber-50/50 border-amber-200 dark:border-amber-900/60',
    prayerRefHeaderClassName: 'bg-amber-100/60 dark:bg-amber-900/20',
    prayerRefCardTitleClassName:
      'font-semibold text-amber-800 dark:text-amber-200',
    prayerRefHeaderLabelClassName:
      'text-amber-700 dark:text-amber-300',
    prayerRefTagPillClassName:
      'px-2 py-0.5 rounded-full bg-amber-100/60 text-[10px] font-semibold text-amber-800 dark:text-amber-200',
  },
  MONASTICO_ESPERANCA: {
    id: 'MONASTICO_ESPERANCA',
    name: 'Monástico',
    docClassName:
      'font-mono bg-emerald-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100',
    prayerRefCardClassName:
      'bg-emerald-50/40 border-emerald-200 dark:border-emerald-900/60',
    prayerRefHeaderClassName: 'bg-emerald-100/60 dark:bg-emerald-900/20',
    prayerRefCardTitleClassName:
      'font-semibold text-emerald-700 dark:text-emerald-200',
    prayerRefHeaderLabelClassName:
      'text-emerald-700 dark:text-emerald-200',
    prayerRefTagPillClassName:
      'px-2 py-0.5 rounded-full bg-emerald-100/60 text-[10px] font-semibold text-emerald-700 dark:text-emerald-200',
  },
  AZUL_CALMO: {
    id: 'AZUL_CALMO',
    name: 'Azul Calmo',
    docClassName:
      'font-[Georgia] bg-sky-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100',
    prayerRefCardClassName:
      'bg-sky-50/40 border-sky-200 dark:border-sky-900/60',
    prayerRefHeaderClassName: 'bg-sky-100/60 dark:bg-sky-900/20',
    prayerRefCardTitleClassName:
      'font-semibold text-sky-700 dark:text-sky-200',
    prayerRefHeaderLabelClassName:
      'text-sky-700 dark:text-sky-200',
    prayerRefTagPillClassName:
      'px-2 py-0.5 rounded-full bg-sky-100/60 text-[10px] font-semibold text-sky-700 dark:text-sky-200',
  },
  ROXO_NOITE: {
    id: 'ROXO_NOITE',
    name: 'Roxo & Noite',
    docClassName:
      'font-[Times_New_Roman] bg-purple-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100',
    prayerRefCardClassName:
      'bg-purple-50/40 border-purple-200 dark:border-purple-900/60',
    prayerRefHeaderClassName: 'bg-purple-100/60 dark:bg-purple-900/20',
    prayerRefCardTitleClassName:
      'font-semibold text-purple-800 dark:text-purple-200',
    prayerRefHeaderLabelClassName:
      'text-purple-700 dark:text-purple-200',
    prayerRefTagPillClassName:
      'px-2 py-0.5 rounded-full bg-purple-100/60 text-[10px] font-semibold text-purple-800 dark:text-purple-200',
  },
};

