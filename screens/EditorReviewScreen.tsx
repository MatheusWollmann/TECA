import React, { useMemo, useState } from 'react';
import { Prayer, PrayerEditSuggestion, User, UserRole } from '../types';
import { ArrowLeftIcon, CheckIcon, XIcon } from '../components/Icons';

interface EditorReviewScreenProps {
  user: User;
  prayers: Prayer[];
  suggestions: PrayerEditSuggestion[];
  onBack: () => void;
  onApprove: (suggestionId: string) => Promise<void> | void;
  onReject: (suggestionId: string, note?: string) => Promise<void> | void;
}

const FieldDiff: React.FC<{ label: string; before?: string; after?: string }> = ({
  label,
  before,
  after,
}) => {
  const changed = (before || '') !== (after || '');
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
          {label}
        </div>
        <span
          className={`text-[10px] font-black uppercase tracking-[0.18em] ${
            changed ? 'text-gold-subtle' : 'text-gray-400'
          }`}
        >
          {changed ? 'Mudou' : 'Igual'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-2">
            Antes
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {before?.trim() || <span className="text-gray-400 italic">—</span>}
          </div>
        </div>
        <div className="p-4">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.18em] mb-2">
            Depois
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
            {after?.trim() || <span className="text-gray-400 italic">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const EditorReviewScreen: React.FC<EditorReviewScreenProps> = ({
  user,
  prayers,
  suggestions,
  onBack,
  onApprove,
  onReject,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(suggestions[0]?.id || null);
  const [rejectNote, setRejectNote] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const selected = useMemo(
    () => suggestions.find((s) => s.id === selectedId) || null,
    [suggestions, selectedId],
  );
  const basePrayer = useMemo(
    () => (selected ? prayers.find((p) => p.id === selected.prayerId) || null : null),
    [prayers, selected],
  );

  const proposedPrayer: Prayer | null = useMemo(() => {
    if (!selected || !basePrayer) return null;
    return { ...basePrayer, ...(selected.proposed as any) };
  }, [selected, basePrayer]);

  if (user.role !== UserRole.Editor) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Apenas usuários com role <span className="font-semibold">Editor</span> podem revisar sugestões.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold hover:opacity-90"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gold-subtle"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar
          </button>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Revisão de sugestões
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <aside className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-[0.18em]">
              Pendentes ({suggestions.length})
            </div>
          </div>
          <div className="max-h-[72vh] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {suggestions.length === 0 ? (
              <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
                Nada pendente agora.
              </div>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
                    selectedId === s.id ? 'bg-gold-subtle/10' : ''
                  }`}
                >
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">
                    {s.authorName} • {s.createdAt}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {prayers.find((p) => p.id === s.prayerId)?.title || 'Oração não encontrada'}
                  </div>
                  {s.reason && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      “{s.reason}”
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="space-y-4">
          {!selected || !basePrayer || !proposedPrayer ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 text-sm text-gray-500 dark:text-gray-400">
              Selecione uma sugestão para revisar.
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-subtle">
                      {basePrayer.isDevotion ? 'Devoção' : 'Oração'}
                    </div>
                    <div className="mt-1 text-2xl font-serif font-bold text-gray-900 dark:text-white">
                      {basePrayer.title}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Sugestão de <span className="font-semibold">{selected.authorName}</span>
                      {selected.reason ? (
                        <>
                          <span className="mx-2">•</span>
                          <span className="italic">“{selected.reason}”</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isWorking}
                      onClick={async () => {
                        setIsWorking(true);
                        await onApprove(selected.id);
                        setIsWorking(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-gold-subtle text-white text-xs font-black uppercase tracking-[0.18em] hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      disabled={isWorking}
                      onClick={async () => {
                        setIsWorking(true);
                        await onReject(selected.id, rejectNote);
                        setRejectNote('');
                        setIsWorking(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-black uppercase tracking-[0.18em] hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      <XIcon className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Nota do Editor (opcional ao rejeitar)
                  </label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    rows={2}
                    placeholder="Ex.: já corrigimos em outra sugestão; falta referência; etc."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm resize-y"
                  />
                </div>
              </div>

              <FieldDiff label="Título" before={basePrayer.title} after={proposedPrayer.title} />
              <FieldDiff label="Categoria" before={basePrayer.category} after={proposedPrayer.category} />
              <FieldDiff
                label="Tags"
                before={(basePrayer.tags || []).join(', ')}
                after={(proposedPrayer.tags || []).join(', ')}
              />
              <FieldDiff label="Texto principal" before={basePrayer.text} after={proposedPrayer.text} />
              <FieldDiff label="Texto em latim" before={basePrayer.latinText} after={proposedPrayer.latinText} />
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default EditorReviewScreen;

