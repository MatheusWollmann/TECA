
import React, { useState } from 'react';
import { Prayer, User } from '../types';
import { ArrowLeftIcon, BookmarkIcon, ShareIcon, EditIcon, SunIcon } from '../components/Icons';
import Modal from '../components/Modal';
import PrayerForm from '../components/PrayerForm';

interface PrayerDetailScreenProps {
  prayer: Prayer;
  prayers: Prayer[];
  user: User;
  onBack: () => void;
  onPray: (prayerId: string) => void;
  onToggleFavorite: (prayerId: string) => void;
  onUpdatePrayer: (prayerId: string, prayerData: Partial<Prayer>) => void;
  praySuccessMessage: string;
  onSelectPrayer: (prayerId:string) => void;
}

const PrayerDetailScreen: React.FC<PrayerDetailScreenProps> = ({ 
    prayer, prayers, user, onBack, onPray, onToggleFavorite, onUpdatePrayer, praySuccessMessage, onSelectPrayer
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const isFavorite = user.favoritePrayerIds.includes(prayer.id);
  const parentPrayer = prayer.parentPrayerId ? prayers.find(p => p.id === prayer.parentPrayerId) : null;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Teca: ${prayer.title}`,
          text: `Reze comigo: "${prayer.text.substring(0, 150).replace(/<[^>]+>/g, '')}..."`,
        });
      } catch (e) {}
    } else alert('Link copiado!');
  };

  return (
    <div className={`animate-fade-in ${focusMode ? 'max-w-2xl mx-auto' : ''}`}>
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Oração: ${prayer.title}`}>
            <PrayerForm user={user} prayers={prayers} initialData={prayer} onSubmit={(d) => { onUpdatePrayer(prayer.id, d); setIsEditModalOpen(false); }} onClose={() => setIsEditModalOpen(false)} />
        </Modal>

      {!focusMode && (
        <div className="flex items-center mb-4">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-gray-100 truncate">{prayer.title}</h1>
        </div>
      )}

      <div className={`${focusMode ? 'mt-10' : ''} bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-500`}>
        {!focusMode && prayer.imageUrl && <img className="h-56 w-full object-cover" src={prayer.imageUrl} alt={prayer.title} />}
        <div className="p-6 md:p-10 space-y-6">
          <div className="flex justify-between items-center">
            {!focusMode && <span className="text-sm font-semibold text-gold-subtle">{prayer.category}</span>}
            <button onClick={() => setFocusMode(!focusMode)} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gold-subtle flex items-center gap-1">
                <SunIcon className="w-4 h-4" /> {focusMode ? 'Sair do Foco' : 'Modo Foco'}
            </button>
          </div>

          <div className="text-center md:text-left">
            <h2 className={`font-bold text-gray-900 dark:text-white mb-6 ${focusMode ? 'text-4xl' : 'text-3xl'}`}>{prayer.title}</h2>
            {parentPrayer && !focusMode && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Parte de: <button onClick={() => onSelectPrayer(parentPrayer.id)} className="font-semibold text-gold-subtle hover:underline">{parentPrayer.title}</button>
              </p>
            )}
            <div
                className={`prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed ${focusMode ? 'text-xl' : ''}`}
                dangerouslySetInnerHTML={{ __html: prayer.text.replace(/\n/g, '<br/>') }}
            />
          </div>

          {prayer.latinText && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">Em Latim</h3>
                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 italic" dangerouslySetInnerHTML={{ __html: prayer.latinText.replace(/\n/g, '<br/>') }} />
            </div>
          )}

          {!focusMode && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6 text-sm text-gray-500 dark:text-gray-400">
                <p>Enviada por: <span className="font-semibold">{prayer.authorName}</span></p>
                <div className="flex flex-wrap gap-2 mt-2">
                {prayer.tags.map(tag => (
                    <span key={tag} className="bg-blue-light dark:bg-gray-700 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200">{tag}</span>
                ))}
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {praySuccessMessage && <div className="p-3 text-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg font-semibold animate-bounce">{praySuccessMessage}</div>}
      </div>

      <div className="sticky bottom-4 mt-8 flex gap-3 z-20 items-center justify-center flex-wrap">
        <button onClick={() => onPray(prayer.id)} className="flex-grow bg-gold-subtle text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-lg">Rezei esta Oração</button>
        <div className="flex gap-2">
            {!focusMode && (
              <>
                <button onClick={() => setIsEditModalOpen(true)} className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-lg"><EditIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /></button>
                <button onClick={handleShare} className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-lg"><ShareIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /></button>
                <button onClick={() => onToggleFavorite(prayer.id)} className="bg-white dark:bg-gray-700 p-4 rounded-2xl shadow-lg">
                    <BookmarkIcon className={`w-6 h-6 transition-colors ${isFavorite ? 'fill-gold-subtle text-gold-subtle' : 'text-gray-400 dark:text-gray-300'}`} />
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};
export default PrayerDetailScreen;
