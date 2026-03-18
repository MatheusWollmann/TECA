import React, { useMemo, useState } from 'react';
import { Prayer, PrayerCategory, RichContent, User } from '../types';
import { ArrowLeftIcon } from '../components/Icons';
import PrayerDetailScreen from './PrayerDetailScreen';
import DevotionDetailScreen from './DevotionDetailScreen';
import { RichTextEditor } from '../components/PrayerForm';
import { RichEditor } from '../components/rich/RichEditor';

interface EditPrayerScreenProps {
  user: User;
  prayer: Prayer;
  prayers: Prayer[];
  onBack: () => void;
  onSave: (prayerId: string, data: Partial<Prayer>) => Promise<void> | void;
  onSuggest: (
    prayerId: string,
    proposed: Partial<Prayer>,
    reason?: string,
  ) => Promise<void> | void;
}

const EditPrayerScreen: React.FC<EditPrayerScreenProps> = ({
  user,
  prayer,
  prayers,
  onBack,
  onSave,
  onSuggest,
}) => {
  const [title, setTitle] = useState(prayer.title);
  const [category, setCategory] = useState<PrayerCategory>(prayer.category);
  const [text, setText] = useState(prayer.text);
  const [content, setContent] = useState<RichContent | null>(() => {
    if (!prayer.isDevotion) return null;
    if (prayer.content?.type === 'tiptap') return prayer.content;
    // Compatibilidade: inicia o editor novo com o texto legado (sem converter automaticamente no DB).
    return {
      type: 'tiptap',
      version: 1,
      doc: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: (prayer.text || '').replace(/<[^>]+>/g, '') }],
          },
        ],
      },
    };
  });
  const [latinText, setLatinText] = useState(prayer.latinText || '');
  const [tags, setTags] = useState(prayer.tags.join(', '));
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canEditDirect = user.role === 'EDITOR';

  const handleSave = async () => {
    setIsSaving(true);
    const payload: Partial<Prayer> = {
      title,
      category,
      text,
      ...(prayer.isDevotion ? { content: content || undefined } : {}),
      latinText: latinText || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (canEditDirect) {
      await onSave(prayer.id, payload);
    } else {
      await onSuggest(prayer.id, payload, reason);
    }
    setIsSaving(false);
    onBack();
  };

  const DraftDetail = prayer.isDevotion ? DevotionDetailScreen : PrayerDetailScreen;

  const draftPrayer: Prayer = {
    ...prayer,
    title,
    category,
    text,
    content: prayer.isDevotion ? (content || undefined) : undefined,
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

          {!canEditDirect && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Motivo/Contexto (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Ex.: ajustar uma palavra, corrigir uma referência, melhorar a clareza..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm resize-y"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Sua sugestão vai para uma fila de revisão e só entra no acervo após aprovação de um Editor.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {prayer.isDevotion ? (
              <div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Conteúdo da devoção
                </div>
                <RichEditor
                  value={content}
                  onChange={setContent}
                  prayers={prayers}
                  placeholder="Escreva a devoção… e arraste orações do acervo para inserir referências."
                  onOpenPrayer={() => {}}
                />
              </div>
            ) : (
              <RichTextEditor
                label="Texto principal"
                value={text}
                onChange={setText}
                rows={10}
              />
            )}
          </div>

          <div className="space-y-2">
            <RichTextEditor
              label="Texto em latim (opcional)"
              value={latinText}
              onChange={setLatinText}
              rows={4}
            />
          </div>

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

