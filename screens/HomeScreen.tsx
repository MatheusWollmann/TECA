
import React, { useState, useMemo } from 'react';
import { User, Prayer, Circulo, Post } from '../types';
import { HeartIcon, CrossIcon, UsersIcon, CalendarIcon, PlusCircleIcon, Trash2Icon, MessageSquareIcon, SmileIcon } from '../components/Icons';
import Modal from '../components/Modal';

interface HomeScreenProps {
  user: User;
  dailyPrayer: Prayer;
  circulos: Circulo[];
  prayers: Prayer[];
  onSelectPrayer: (prayerId: string) => void;
  onSelectCirculo: (circuloId: string) => void;
  onAddScheduledPrayer: (period: 'Manhã' | 'Tarde' | 'Noite', prayerId: string) => void;
  onRemoveScheduledPrayer: (scheduleItemId: string) => void;
  onToggleScheduledPrayer: (scheduleItemId: string) => void;
  onPostReaction: (circuloId: string, postId: string, emoji: string) => void;
}

const SocialPostCard: React.FC<{ 
    post: Post; 
    circuloName: string; 
    circuloId: string;
    onSelectCirculo: (id: string) => void;
    onReaction: (emoji: string) => void;
    currentUserId: string;
}> = ({ post, circuloName, circuloId, onSelectCirculo, onReaction, currentUserId }) => {
    const userReaction = post.reactions.find(r => r.userId === currentUserId);
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <img src={post.authorAvatarUrl} alt={post.authorName} className="w-10 h-10 rounded-full object-cover border-2 border-gold-subtle/20" />
                    <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{post.authorName}</p>
                        <button 
                            onClick={() => onSelectCirculo(circuloId)}
                            className="text-[10px] font-black text-gold-subtle uppercase tracking-tighter hover:underline"
                        >
                            Círculo: {circuloName}
                        </button>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400">{post.createdAt}</span>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                {post.text}
            </p>

            <div className="flex items-center gap-4 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                <button 
                    onClick={() => onReaction(userReaction?.emoji === '🙏' ? '' : '🙏')}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${userReaction?.emoji === '🙏' ? 'text-gold-subtle' : 'text-gray-400 hover:text-gold-subtle'}`}
                >
                    <span className="text-base">🙏</span> 
                    {post.reactions.length > 0 ? post.reactions.length : 'Interceder'}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <MessageSquareIcon className="w-4 h-4" />
                    {post.replies.length > 0 ? `${post.replies.length} Respostas` : 'Responder'}
                </button>
            </div>
        </div>
    );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ 
    user, dailyPrayer, circulos, prayers, 
    onSelectPrayer, onSelectCirculo, onAddScheduledPrayer, onRemoveScheduledPrayer, onToggleScheduledPrayer, onPostReaction
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedulingPeriod, setSchedulingPeriod] = useState<'Manhã' | 'Tarde' | 'Noite' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica para compilar o feed social apenas dos círculos que o usuário participa
  const socialFeed = useMemo(() => {
    const joinedCirculos = circulos.filter(c => user.joinedCirculoIds.includes(c.id));
    const allPosts: {post: Post, circulo: Circulo}[] = [];
    
    joinedCirculos.forEach(c => {
        c.posts.forEach(p => {
            allPosts.push({ post: p, circulo: c });
        });
    });

    // Ordenação simulada por "recentes" (no mock usamos string, em prod seria timestamp)
    return allPosts.sort((a, b) => b.post.id.localeCompare(a.post.id));
  }, [circulos, user.joinedCirculoIds]);

  const openScheduleModal = (period: 'Manhã' | 'Tarde' | 'Noite') => {
    setSchedulingPeriod(period);
    setSearchTerm('');
    setIsModalOpen(true);
  };

  const handleSelectPrayerForSchedule = (prayerId: string) => {
    if (schedulingPeriod) {
      onAddScheduledPrayer(schedulingPeriod, prayerId);
    }
    setIsModalOpen(false);
    setSchedulingPeriod(null);
  };

  const filteredPrayers = prayers.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-10">
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={schedulingPeriod ? `Agendar para a ${schedulingPeriod.toLowerCase()}` : 'Selecionar Oração'}
      >
        <div className="space-y-4">
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

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Salve, {user.name.split(' ')[0]}!</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Sua comunidade de fé está unida em oração.</p>
        </div>
        <div className="flex bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm items-center gap-3">
           <div className="px-4 py-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400">Streak</p>
              <p className="font-black text-gold-subtle text-lg">🔥 {user.streak}</p>
           </div>
           <div className="h-8 w-px bg-gray-100 dark:bg-gray-700"></div>
           <div className="px-4 py-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400">Graças</p>
              <p className="font-black text-gray-800 dark:text-white text-lg">{user.graces}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Highlight */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gold-subtle to-yellow-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-gold-subtle/20">
            <div className="relative z-10">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Misterium Fidei</span>
              <h2 className="text-3xl font-black mt-4 mb-2">{dailyPrayer.title}</h2>
              <div className="text-white/90 text-lg leading-relaxed line-clamp-2 mb-6" dangerouslySetInnerHTML={{ __html: dailyPrayer.text }}></div>
              <button onClick={() => onSelectPrayer(dailyPrayer.id)} className="bg-white text-gold-subtle font-black px-8 py-3 rounded-2xl hover:scale-105 transition-transform shadow-lg">REZAR AGORA</button>
            </div>
            <CrossIcon className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
          </div>

          {/* Social Timeline */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter ml-2">Partilhas Recentes</h2>
            
            {socialFeed.length > 0 ? (
                <div className="space-y-4">
                    {socialFeed.map(({post, circulo}) => (
                        <SocialPostCard 
                            key={post.id} 
                            post={post} 
                            circuloName={circulo.name} 
                            circuloId={circulo.id}
                            onSelectCirculo={onSelectCirculo}
                            currentUserId={user.id}
                            onReaction={(emoji) => onPostReaction(circulo.id, post.id, emoji)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
                    <UsersIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-sm">Entre em círculos para ver as partilhas dos seus irmãos na fé.</p>
                </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8 sticky top-24">
          
          {/* Spiritual Checklist */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
              <CalendarIcon className="w-5 h-5 text-gold-subtle" /> Cronograma
            </h2>
            <div className="space-y-6">
              {(['Manhã', 'Tarde', 'Noite'] as const).map(period => {
                const periodItems = (user.schedule || []).filter(s => s.time === period);
                
                return (
                  <div key={period} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{period}</span>
                      <button 
                        onClick={() => openScheduleModal(period)} 
                        className="text-[10px] font-black text-gold-subtle hover:underline"
                      >
                        + ADD
                      </button>
                    </div>
                    <div className="space-y-2">
                        {periodItems.length > 0 ? periodItems.map(item => {
                            const p = prayers.find(x => x.id === item.prayerId);
                            if (!p) return null;
                            return (
                                <div key={item.id} className="flex items-center group gap-2">
                                    <button 
                                        onClick={() => onToggleScheduledPrayer(item.id)}
                                        className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            item.completed 
                                            ? 'bg-gold-subtle border-gold-subtle text-white' 
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gold-subtle'
                                        }`}
                                    >
                                        {item.completed && <CheckIcon className="w-4 h-4 stroke-[3]" />}
                                    </button>
                                    <div 
                                        onClick={() => onSelectPrayer(p.id)}
                                        className={`flex-grow p-3 rounded-xl cursor-pointer border transition-all ${
                                            item.completed 
                                            ? 'bg-gray-50 dark:bg-gray-700/30 border-transparent opacity-60' 
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gold-subtle/20'
                                        }`}
                                    >
                                        <p className={`text-xs font-bold ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {p.title}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => onRemoveScheduledPrayer(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                                    >
                                        <Trash2Icon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="py-2 text-[10px] font-bold text-gray-300 italic">Livre.</div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Circle List */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-black text-gray-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
              <UsersIcon className="w-5 h-5 text-gold-subtle" /> Seus Círculos
            </h2>
            <div className="space-y-4">
              {circulos.filter(c => user.joinedCirculoIds.includes(c.id)).slice(0, 3).map(c => (
                <div key={c.id} onClick={() => onSelectCirculo(c.id)} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-colors cursor-pointer group">
                  <img src={c.imageUrl} className="w-12 h-12 rounded-full object-cover shadow-sm group-hover:ring-2 group-hover:ring-gold-subtle transition-all" />
                  <div>
                    <p className="text-xs font-black text-gray-800 dark:text-white line-clamp-1">{c.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{c.memberCount} IRMÃOS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

export default HomeScreen;
