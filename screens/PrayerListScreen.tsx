
import React, { useState } from 'react';
import { Prayer, PrayerCategory, User } from '../types';
import { PRAYER_CATEGORIES } from '../constants';
import { BookmarkIcon, PlusCircleIcon, HeartIcon } from '../components/Icons';
import Modal from '../components/Modal';
import PrayerForm from '../components/PrayerForm';

interface PrayerListScreenProps {
  user: User;
  prayers: Prayer[];
  favoritePrayerIds: string[];
  toggleFavorite: (prayerId: string) => void;
  addPrayer: (prayerData: Partial<Prayer>) => void;
  onSelectPrayer: (prayerId: string) => void;
  isDevotionList?: boolean;
}

const PrayerCard: React.FC<{
    prayer: Prayer;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onSelect: () => void;
}> = ({ prayer, isFavorite, onToggleFavorite, onSelect }) => {
    return (
        <div onClick={onSelect} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            {prayer.imageUrl && <img className="h-40 w-full object-cover" src={prayer.imageUrl} alt={prayer.title} />}
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="uppercase tracking-wide text-sm text-gold-subtle font-semibold">{prayer.category}</div>
                        <p className="block mt-1 text-lg leading-tight font-medium text-black dark:text-white">{prayer.title}</p>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite();
                        }} 
                        className="p-1 z-10 relative"
                        aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                        <BookmarkIcon className={`w-6 h-6 transition-colors ${isFavorite ? 'fill-gold-subtle text-gold-subtle' : 'text-gray-400'}`} />
                    </button>
                </div>
                <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm truncate-3-lines">{prayer.text.replace(/<[^>]+>|\[prayer:[^\]]+\]/g, '')}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                        <HeartIcon className="w-4 h-4 mr-1 text-red-500"/>
                        {prayer.prayerCount.toLocaleString()} pessoas rezaram
                    </div>
                    <span className="font-semibold">{prayer.authorName}</span>
                </div>
            </div>
        </div>
    );
};

const PrayerListScreen: React.FC<PrayerListScreenProps> = ({ user, prayers, favoritePrayerIds, toggleFavorite, addPrayer, onSelectPrayer, isDevotionList = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PrayerCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPrayers = prayers.filter(prayer => {
    const matchesSearch = prayer.title.toLowerCase().includes(searchTerm.toLowerCase()) || prayer.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || prayer.category === selectedCategory;
    const matchesType = isDevotionList ? prayer.isDevotion : !prayer.isDevotion;
    return matchesSearch && matchesCategory && matchesType;
  });

  const handleAddPrayer = (prayerData: Partial<Prayer>) => {
    addPrayer(prayerData);
    setIsModalOpen(false);
  }

  const title = isDevotionList ? 'Catálogo de Devoções' : 'Catálogo de Orações';
  const subtitle = isDevotionList ? 'Aprofunde sua fé com orações guiadas.' : 'Encontre, reze e compartilhe sua fé.';
  const addButtonText = isDevotionList ? 'Adicionar Devoção' : 'Adicionar Oração';

  return (
    <div className="space-y-6">
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={addButtonText}>
            <PrayerForm 
                user={user}
                prayers={prayers}
                onSubmit={handleAddPrayer} 
                onClose={() => setIsModalOpen(false)}
                isDevotionForm={isDevotionList}
            />
        </Modal>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
            </div>
             <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 w-full md:w-auto bg-gold-subtle text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300">
                <PlusCircleIcon className="w-5 h-5" />
                {addButtonText}
            </button>
        </div>
      
      <div className="sticky top-16 bg-background-light dark:bg-background-dark py-4 z-10">
        <input
          type="text"
          placeholder="Buscar por título ou #tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle focus:outline-none"
        />
        <div className="flex space-x-2 overflow-x-auto mt-4 pb-2">
            <button onClick={() => setSelectedCategory('All')} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === 'All' ? 'bg-gold-subtle text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>Todas</button>
            {PRAYER_CATEGORIES.map(cat => (
                 <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-gold-subtle text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>{cat}</button>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrayers.map(prayer => (
          <PrayerCard 
            key={prayer.id} 
            prayer={prayer} 
            isFavorite={favoritePrayerIds.includes(prayer.id)} 
            onToggleFavorite={() => toggleFavorite(prayer.id)}
            onSelect={() => onSelectPrayer(prayer.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PrayerListScreen;