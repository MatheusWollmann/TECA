import React, { useState } from 'react';
import { User, Prayer, Circulo } from '../types';
import { HeartIcon } from '../components/Icons';
import Modal from '../components/Modal';

interface HomeScreenProps {
  user: User;
  dailyPrayer: Prayer;
  circulos: Circulo[];
  prayers: Prayer[];
  onSelectPrayer: (prayerId: string) => void;
  onSetScheduledPrayer: (period: 'Manhã' | 'Tarde' | 'Noite', prayerId: string) => void;
  onRemoveScheduledPrayer: (period: 'Manhã' | 'Tarde' | 'Noite') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, dailyPrayer, circulos, prayers, onSelectPrayer, onSetScheduledPrayer, onRemoveScheduledPrayer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedulingPeriod, setSchedulingPeriod] = useState<'Manhã' | 'Tarde' | 'Noite' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const openScheduleModal = (period: 'Manhã' | 'Tarde' | 'Noite') => {
    setSchedulingPeriod(period);
    setSearchTerm('');
    setIsModalOpen(true);
  };

  const handleSelectPrayerForSchedule = (prayerId: string) => {
    if (schedulingPeriod) {
      onSetScheduledPrayer(schedulingPeriod, prayerId);
    }
    setIsModalOpen(false);
    setSchedulingPeriod(null);
  };

  const filteredPrayers = prayers.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      {/* Modal for selecting prayer */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={schedulingPeriod ? `Selecione uma oração para a ${schedulingPeriod.toLowerCase()}` : 'Selecione uma oração'}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Buscar oração pelo título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle focus:outline-none"
          />
          <div className="max-h-80 overflow-y-auto pr-2">
            <ul className="space-y-1">
              {filteredPrayers.length > 0 ? filteredPrayers.map(prayer => (
                <li key={prayer.id}>
                  <button 
                    onClick={() => handleSelectPrayerForSchedule(prayer.id)} 
                    className="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{prayer.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{prayer.category}</p>
                  </button>
                </li>
              )) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhuma oração encontrada.</p>
              )}
            </ul>
          </div>
        </div>
      </Modal>

      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Bem-vindo, {user.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Que a paz do Senhor esteja com você.</p>
      </div>

      {/* Oração do Dia */}
      <div className="bg-blue-light dark:bg-gray-800/50 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Oração do Dia</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-bold text-lg text-gold-subtle">{dailyPrayer.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed truncate-3-lines" dangerouslySetInnerHTML={{ __html: dailyPrayer.text }}></p>
             <button onClick={() => onSelectPrayer(dailyPrayer.id)} className="text-sm text-gold-subtle font-semibold mt-3 hover:underline">Ler completa</button>
        </div>
      </div>

      {/* Cronograma de Oração */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Seu Cronograma</h2>
        <div className="space-y-4">
          {(['Manhã', 'Tarde', 'Noite'] as const).map(period => {
            const scheduled = user.schedule?.find(s => s.time === period);
            const scheduledPrayer = scheduled ? prayers.find(p => p.id === scheduled.prayerId) : null;
            return (
              <div key={period} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{period}</span>
                    {scheduledPrayer && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:underline" onClick={() => onSelectPrayer(scheduledPrayer.id)}>
                        {scheduledPrayer.title}
                      </p>
                    )}
                  </div>
                  {scheduledPrayer ? (
                    <div className="flex items-center space-x-3">
                      <button onClick={() => openScheduleModal(period)} className="text-sm text-gold-subtle font-semibold hover:underline">Trocar</button>
                      <button onClick={() => onRemoveScheduledPrayer(period)} className="text-sm text-red-500 font-semibold hover:underline">Remover</button>
                    </div>
                  ) : (
                    <button onClick={() => openScheduleModal(period)} className="text-sm text-gold-subtle font-semibold hover:underline">Adicionar Oração</button>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Círculos */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Seus Círculos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {circulos.slice(0, 3).map(circulo => (
                <div key={circulo.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-4 shadow-sm">
                    <img src={circulo.imageUrl} alt={circulo.name} className="w-14 h-14 rounded-full"/>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{circulo.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{circulo.memberCount} membros</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
const SvgCross = () => (
    <svg className="w-20 h-20 absolute -top-4 -right-4 text-gold-subtle opacity-10" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
    </svg>
  );
  
// Helper to truncate text
const truncateText = (text: string, lines: number) => {
    return text;
}
export default HomeScreen;