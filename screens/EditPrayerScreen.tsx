import React, { useState, useMemo } from 'react';
import { Prayer, PrayerCategory, User } from '../types';
import { ArrowLeftIcon, BookOpenIcon } from '../components/Icons';
import PrayerDetailScreen from './PrayerDetailScreen';
import DevotionDetailScreen from './DevotionDetailScreen';
import { RichTextEditor } from '../components/PrayerForm';

interface EditPrayerScreenProps {
  user: User;
  prayer: Prayer;
  prayers: Prayer[];
  onBack: () => void;
  onSave: (prayerId: string, data: Partial<Prayer>) => Promise<void> | void;
}

const EditPrayerScreen: React.FC<EditPrayerScreenProps> = ({
  user,
  prayer,
  prayers,
  onBack,
  onSave,
}) => {
  const [title, setTitle] = useState(prayer.title);
  const [category, setCategory] = useState<PrayerCategory>(prayer.category);
  const [text, setText] = useState(prayer.text);
  const [latinText, setLatinText] = useState(prayer.latinText || '');
  const [tags, setTags] = useState(prayer.tags.join(', '));
  const [searchLink, setSearchLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canEditDirect = user.role === 'EDITOR';

  const linkedPrayers = useMemo(
    () =>
      prayers.filter(
        (p) =>
          !p.isDevotion &&
          p.id !== prayer.id &&
          p.title.toLowerCase().includes(searchLink.toLowerCase()),
      ),
    [prayers, prayer.id, searchLink],
  );

  const handleInsertLink = (id: string) => {
    setText((prev) => `${prev}\n[prayer:${id}]`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(prayer.id, {
      title,
      category,
      text,
      latinText: latinText || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setIsSaving(false);
    onBack();
  };

  const DraftDetail = prayer.isDevotion ? DevotionDetailScreen : PrayerDetailScreen;

  const draftPrayer: Prayer = {
    ...prayer,
    title,
    category,
    text,
    latinText: latinText || undefined,
    tags: tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gold-subtle"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar para oração
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              {canEditDirect ? 'Edição direta' : 'Sugestão de edição'}
            </span>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gold-subtle text-white text-xs font-bold uppercase tracking-[0.18em] shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {isSaving
                ? 'Salvando...'
                : canEditDirect
                ? 'Salvar alterações'
                : 'Enviar sugestão'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor column */}
        <section className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PrayerCategory)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm"
              >
                {Object.values(PrayerCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#fé, #família"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <RichTextEditor
              label="Texto principal"
              value={text}
              onChange={setText}
              rows={10}
            />
          </div>

          <div className="space-y-2">
            <RichTextEditor
              label="Texto em latim (opcional)"
              value={latinText}
              onChange={setLatinText}
              rows={4}
            />
          </div>

          {/* Link prayer helper – apenas para devoções */}
          {prayer.isDevotion && (
            <div className="mt-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <BookOpenIcon className="w-4 h-4 text-gold-subtle" />
                Linkar outra oração na devoção
              </div>
              <input
                type="text"
                placeholder="Buscar oração para linkar..."
                value={searchLink}
                onChange={(e) => setSearchLink(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-xs"
              />
              <div className="max-h-40 overflow-y-auto space-y-1">
                {linkedPrayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleInsertLink(p.id)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-gold-subtle/10 text-xs flex items-center justify-between"
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      [prayer:{p.id}]
                    </span>
                  </button>
                ))}
                {linkedPrayers.length === 0 && (
                  <p className="text-[11px] text-gray-400 italic">
                    Nenhuma oração encontrada para esse termo.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Preview column */}
        <section className="hidden lg:block">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.18em] mb-2">
            Pré-visualização
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden max-h-[80vh] overflow-y-auto p-4">
            <DraftDetail
              prayer={draftPrayer}
              prayers={prayers}
              user={user}
              onBack={() => {}}
              onPray={() => {}}
              onToggleFavorite={() => {}}
              onUpdatePrayer={() => {}}
              praySuccessMessage=""
              onSelectPrayer={() => {}}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default EditPrayerScreen;

