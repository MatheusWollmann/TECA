
import React, { useState } from 'react';
import { User, Prayer, SpiritualLevel, DayCompletion } from '../types';
import { SPIRITUAL_LEVELS } from '../constants';
import { HeartIcon, CrossIcon, CalendarIcon, Trash2Icon, PlusCircleIcon } from '../components/Icons';
import Modal from '../components/Modal';

interface ProfileScreenProps {
  user: User;
  prayers: Prayer[];
  onSelectPrayer: (prayerId: string) => void;
  onAddScheduledPrayer: (time: string, prayerId: string, label?: string) => void;
}

const CalendarDay: React.FC<{ date: Date; completion?: DayCompletion }> = ({ date, completion }) => {
    const isToday = new Date().toDateString() === date.toDateString();
    const isFuture = date > new Date();
    
    let score = 0;
    if (completion?.morning) score++;
    if (completion?.afternoon) score++;
    if (completion?.night) score++;

    return (
        <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-[11px] font-black relative transition-all ${
                isToday ? 'ring-2 ring-gold-subtle ring-offset-2 dark:ring-offset-gray-900' : ''
            } ${
                isFuture ? 'opacity-20' : ''
            } ${
                score === 3 ? 'bg-gold-subtle text-white shadow-lg shadow-gold-subtle/30' : 
                score > 0 ? 'bg-gold-subtle/20 text-gold-subtle border border-gold-subtle/30' :
                'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
                {date.getDate()}
                {score > 0 && !isFuture && (
                    <div className="absolute -bottom-1 flex gap-0.5">
                        <div className={`w-1 h-1 rounded-full ${completion?.morning ? (score === 3 ? 'bg-white' : 'bg-gold-subtle') : 'bg-transparent border border-current opacity-20'}`}></div>
                        <div className={`w-1 h-1 rounded-full ${completion?.afternoon ? (score === 3 ? 'bg-white' : 'bg-gold-subtle') : 'bg-transparent border border-current opacity-20'}`}></div>
                        <div className={`w-1 h-1 rounded-full ${completion?.night ? (score === 3 ? 'bg-white' : 'bg-gold-subtle') : 'bg-transparent border border-current opacity-20'}`}></div>
                    </div>
                )}
            </div>
        </div>
    );
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, prayers, onSelectPrayer, onAddScheduledPrayer }) => {
    const favoritePrayers = prayers.filter(p => user.favoritePrayerIds.includes(p.id));
    
    const levelInfo = SPIRITUAL_LEVELS[user.level];
    const nextLevelEntries = Object.entries(SPIRITUAL_LEVELS);
    const currentLevelIndex = nextLevelEntries.findIndex(([level]) => level === user.level);
    const nextLevelInfo = currentLevelIndex < nextLevelEntries.length - 1 ? nextLevelEntries[currentLevelIndex + 1][1] : null;
    
    const progressPercentage = nextLevelInfo ? Math.round(((user.graces - levelInfo.min) / (nextLevelInfo.min - levelInfo.min)) * 100) : 100;

    const getDaysInMonth = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = [];
        const lastDay = new Date(year, month + 1, 0);
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const days = getDaysInMonth();
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleTime, setScheduleTime] = useState<string>('');
    const [scheduleLabel, setScheduleLabel] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPrayers = prayers.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSelectPrayerForSchedule = (prayerId: string) => {
        const time = scheduleTime || '08:00';
        onAddScheduledPrayer(time, prayerId, scheduleLabel || undefined);
        setIsScheduleModalOpen(false);
        setScheduleTime('');
        setScheduleLabel('');
        setSearchTerm('');
    };

    return (
        <div className="space-y-8 pb-10">
            <Modal
              isOpen={isScheduleModalOpen}
              onClose={() => setIsScheduleModalOpen(false)}
              title="Adicionar horário de oração"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Rótulo (opcional)
                    </label>
                    <input
                      type="text"
                      value={scheduleLabel}
                      onChange={(e) => setScheduleLabel(e.target.value)}
                      placeholder="Ex.: Depois do trabalho"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none text-sm"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Buscar oração..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-gold-subtle outline-none"
                />
                <div className="max-h-80 overflow-y-auto pr-2 space-y-1">
                  {filteredPrayers.map(prayer => (
                    <button 
                      key={prayer.id}
                      onClick={() => handleSelectPrayerForSchedule(prayer.id)}
                      className="w-full text-left p-4 rounded-xl hover:bg-gold-subtle/10 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{prayer.title}</p>
                        <p className="text-xs text-gray-500">{prayer.category}</p>
                      </div>
                      <PlusCircleIcon className="w-5 h-5 text-gray-300 group-hover:text-gold-subtle" />
                    </button>
                  ))}
                </div>
              </div>
            </Modal>
            <div className="flex flex-col items-center pt-4">
                <div className="relative group">
                    <img src={user.avatarUrl} alt={user.name} className="w-28 h-28 rounded-full border-4 border-gold-subtle shadow-2xl group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-xl">🔥</span>
                    </div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-5 tracking-tight">{user.name}</h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full mt-1">{user.city}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-3">
                        <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{user.streak}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Dia de Ofensiva</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-3">
                        <span className="text-2xl">🙏</span>
                    </div>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{user.totalPrayers || 0}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Total de Orações</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Caminho da Santidade</p>
                        <h2 className="text-3xl font-black text-gold-subtle">{user.level}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{user.graces}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Graças</p>
                    </div>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden p-1">
                    <div className="bg-gradient-to-r from-gold-subtle to-yellow-500 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                {nextLevelInfo && (
                    <p className="text-[10px] font-black text-gray-400 mt-4 text-center uppercase tracking-widest">
                        Faltam {nextLevelInfo.min - user.graces} para se tornar {nextLevelEntries[currentLevelIndex + 1][0]}
                    </p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-gold-subtle" /> Fidelidade: {monthName}
                    </h2>
                </div>
                <div className="grid grid-cols-7 gap-y-5 gap-x-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-[11px] font-black text-gray-300 text-center uppercase">{d}</div>
                    ))}
                    {days.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        return <CalendarDay key={dateStr} date={date} completion={user.history?.[dateStr]} />;
                    })}
                </div>
                <div className="mt-10 pt-8 border-t border-gray-50 dark:border-gray-700/50 flex justify-around text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-lg bg-gold-subtle"></div> Fiel</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-lg bg-gold-subtle/20 border border-gold-subtle/30"></div> Em jornada</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-lg bg-gray-100 dark:bg-gray-800"></div> Vazio</div>
                </div>
            </div>

            {/* Gerenciamento de horários de oração */}
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                            Cronograma pessoal
                        </p>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">
                            Horários de oração
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-subtle text-white text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-colors"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>
                <div className="space-y-2">
                    {user.schedule && user.schedule.length > 0 ? (
                        [...user.schedule]
                            .slice()
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map(item => {
                                const p = prayers.find(x => x.id === item.prayerId);
                                if (!p) return null;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                {p.title}
                                            </span>
                                            {item.label && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    {item.label}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-mono text-gray-400">
                                            {item.time || '—'}
                                        </span>
                                    </div>
                                );
                            })
                    ) : (
                        <div className="py-4 text-[11px] font-medium text-gray-400 italic text-center">
                            Nenhum horário configurado ainda. Use o botão &quot;Adicionar&quot; para criar o seu primeiro.
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-4">Orações Favoritas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {favoritePrayers.length > 0 ? (
                        favoritePrayers.map(prayer => (
                            <div key={prayer.id} onClick={() => onSelectPrayer(prayer.id)} className="bg-white dark:bg-gray-800 rounded-2xl p-5 flex justify-between items-center shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-gold-subtle/30 hover:shadow-md transition-all group">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-gold-subtle transition-colors line-clamp-1">{prayer.title}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{prayer.category}</p>
                                </div>
                                <div className="bg-gold-subtle/10 p-2.5 rounded-xl ml-4">
                                    <CrossIcon className="w-5 h-5 text-gold-subtle" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Suas orações favoritas aparecerão aqui</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;
