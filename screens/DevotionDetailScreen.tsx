

import React, { useState, useMemo } from 'react';
import { Prayer, User } from '../types';
import { ArrowLeftIcon, BookmarkIcon, HeartIcon, PlayCircleIcon, PauseCircleIcon, LoaderIcon, ShareIcon, EditIcon, XIcon } from '../components/Icons';
import Modal from '../components/Modal';
import PrayerForm from '../components/PrayerForm';

interface DevotionDetailScreenProps {
  prayer: Prayer;
  prayers: Prayer[];
  user: User;
  onBack: () => void;
  onPray: (prayerId: string) => void;
  onToggleFavorite: (prayerId: string) => void;
  onUpdatePrayer: (prayerId: string, prayerData: Partial<Prayer>) => void;
  praySuccessMessage: string;
  onPlayAudio: (prayerId: string) => void;
  onStopAudio: () => void;
  isGeneratingAudio: boolean;
  isPlayingAudio: boolean;
  audioError: string;
  onSelectPrayer: (prayerId:string) => void;
}

const DevotionRenderer: React.FC<{
    text: string;
    prayers: Prayer[];
}> = ({ text, prayers }) => {
    const [expandedPrayers, setExpandedPrayers] = useState<Record<string, boolean>>({});

    const togglePrayer = (key: string) => {
        setExpandedPrayers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const parts = useMemo(() => text.split(/(\[prayer:p[\w-]+\])/g), [text]);
    
    return (
        <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {parts.map((part, index) => {
                const match = part.match(/\[prayer:(p[\w-]+)\]/);
                if (match) {
                    const prayerId = match[1];
                    const linkedPrayer = prayers.find(p => p.id === prayerId);
                    const key = `${index}-${prayerId}`;
                    const isExpanded = expandedPrayers[key];

                    if (!linkedPrayer) {
                        return <span key={key} className="text-red-500">[Oração não encontrada]</span>;
                    }

                    return (
                        <React.Fragment key={key}>
                            <button 
                                onClick={() => togglePrayer(key)} 
                                className="font-semibold text-gold-subtle hover:underline focus:outline-none"
                            >
                                {linkedPrayer.title}
                            </button>
                            {isExpanded && (
                                <div className="my-2 p-4 border-l-4 border-gold-subtle bg-blue-light/20 dark:bg-gray-700/50 rounded-r-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold">{linkedPrayer.title}</h4>
                                        <button onClick={() => togglePrayer(key)} className="p-1 rounded-full hover:bg-gray-400/20"><XIcon className="w-4 h-4"/></button>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: linkedPrayer.text }} />
                                </div>
                            )}
                        </React.Fragment>
                    );
                }
                // Use dangerouslySetInnerHTML for parts that might contain HTML from the editor
                return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
            })}
        </div>
    );
};


const DevotionDetailScreen: React.FC<DevotionDetailScreenProps> = ({ 
    prayer, prayers, user, onBack, onPray, onToggleFavorite, onUpdatePrayer, praySuccessMessage,
    onPlayAudio, onStopAudio, isGeneratingAudio, isPlayingAudio, audioError, onSelectPrayer
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isFavorite = user.favoritePrayerIds.includes(prayer.id);
  const parentPrayer = prayer.parentPrayerId ? prayers.find(p => p.id === prayer.parentPrayerId) : null;

  const handleAudioButtonClick = () => {
    if (isPlayingAudio) {
      onStopAudio();
    } else {
      onPlayAudio(prayer.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `OraComigo: ${prayer.title}`,
          text: `Reze comigo esta devoção: "${prayer.title}"\n\nVeja a devoção completa no app OraComigo.`,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
        } else {
            console.error('Erro ao compartilhar:', error);
        }
      }
    } else {
      alert('A função de compartilhamento não é suportada neste navegador.');
    }
  };

  const handleUpdatePrayer = (prayerData: Partial<Prayer>) => {
    onUpdatePrayer(prayer.id, prayerData);
    setIsEditModalOpen(false);
  };

  return (
    <div className="animate-fade-in">
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Devoção: ${prayer.title}`}>
            <PrayerForm
                user={user}
                prayers={prayers}
                initialData={prayer}
                onSubmit={handleUpdatePrayer}
                onClose={() => setIsEditModalOpen(false)}
                isDevotionForm={true}
            />
        </Modal>
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Voltar">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-gray-100 truncate">{prayer.title}</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {prayer.imageUrl && <img className="h-56 w-full object-cover" src={prayer.imageUrl} alt={prayer.title} />}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gold-subtle">{prayer.category}</span>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <HeartIcon className="w-4 h-4 mr-1.5 text-red-500" />
              <span>{prayer.prayerCount.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{prayer.title}</h2>
            {parentPrayer && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Parte de: <button onClick={() => onSelectPrayer(parentPrayer.id)} className="font-semibold text-gold-subtle hover:underline">{parentPrayer.title}</button>
              </p>
            )}
            <DevotionRenderer text={prayer.text} prayers={prayers} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Enviada por: <span className="font-semibold">{prayer.authorName}</span></p>
            <div className="flex flex-wrap gap-2 mt-2">
              {prayer.tags.map(tag => (
                <span key={tag} className="bg-blue-light dark:bg-gray-700 px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {praySuccessMessage && (
            <div className="p-3 text-center bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg font-semibold transition-opacity duration-300">
            {praySuccessMessage}
            </div>
        )}
        {audioError && (
            <div className="p-3 text-center bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg font-semibold">
            {audioError}
            </div>
        )}
      </div>

      <div className="sticky bottom-4 mt-6 flex gap-2 sm:gap-3 z-20 items-center justify-center flex-wrap">
        <button
          onClick={() => onPray(prayer.id)}
          className="flex-grow bg-gold-subtle text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity duration-300 text-base"
        >
          Rezei esta Devoção
        </button>
        <div className="flex gap-2 sm:gap-3">
            <button
                onClick={handleAudioButtonClick}
                disabled={isGeneratingAudio}
                className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-lg text-gold-subtle disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isPlayingAudio ? 'Parar áudio' : 'Ouvir devoção'}
            >
                {isGeneratingAudio ? (
                    <LoaderIcon className="w-7 h-7" />
                ) : isPlayingAudio ? (
                    <PauseCircleIcon className="w-7 h-7" />
                ) : (
                    <PlayCircleIcon className="w-7 h-7" />
                )}
            </button>

            <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-lg"
                aria-label="Editar Devoção"
                >
                <EditIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            </button>

            <button
                onClick={handleShare}
                className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-lg"
                aria-label="Compartilhar devoção"
            >
                <ShareIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            </button>

            <button
                onClick={() => onToggleFavorite(prayer.id)}
                className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-lg"
                aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
                <BookmarkIcon className={`w-6 h-6 transition-colors ${isFavorite ? 'fill-gold-subtle text-gold-subtle' : 'text-gray-400 dark:text-gray-300'}`} />
            </button>
        </div>
      </div>
    </div>
  );
};
export default DevotionDetailScreen;