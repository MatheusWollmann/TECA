
import React, { useEffect, useMemo, useState } from 'react';
import { User, Prayer, Circulo, Post } from '../types';
import { HeartIcon, CrossIcon, UsersIcon, CalendarIcon, Trash2Icon, MessageSquareIcon } from '../components/Icons';

interface HomeScreenProps {
  user: User;
  dailyPrayer: Prayer;
  circulos: Circulo[];
  prayers: Prayer[];
  onSelectPrayer: (prayerId: string) => void;
  onSelectCirculo: (circuloId: string) => void;
  onAddScheduledPrayer: (time: string, prayerId: string, label?: string) => void;
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
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-5 shadow-md shadow-slate-900/5 border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={post.authorAvatarUrl}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gold-subtle/40 shadow-sm"
                      />
                      {userReaction?.emoji === '🙏' && (
                        <span className="absolute -bottom-1 -right-1 text-xs">🙏</span>
                      )}
                    </div>
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

            {post.replies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800/70">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.16em] mb-2">
                  {post.replies.length} {post.replies.length === 1 ? 'resposta' : 'respostas'}
                </p>
                <div className="flex gap-3">
                  <img
                    src={post.replies[0].authorAvatarUrl}
                    alt={post.replies[0].authorName}
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {post.replies[0].authorName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                      {post.replies[0].text}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-gray-50 dark:border-gray-800/70 mt-3">
                <button 
                    onClick={() => onReaction('🙏')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                        userReaction?.emoji === '🙏'
                          ? 'bg-gold-subtle/10 text-gold-subtle'
                          : 'text-gray-400 hover:text-gold-subtle hover:bg-gold-subtle/5'
                    }`}
                >
                    <span className="text-base">🙏</span> 
                    {post.reactions.length > 0 ? post.reactions.length : 'Interceder'}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCirculo(circuloId)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <MessageSquareIcon className="w-4 h-4" />
                  {post.replies.length > 0 ? `${post.replies.length} respostas` : 'Seja o primeiro a responder'}
                </button>
            </div>
        </div>
    );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ 
    user, dailyPrayer, circulos, prayers, 
    onSelectPrayer, onSelectCirculo, onAddScheduledPrayer, onRemoveScheduledPrayer, onToggleScheduledPrayer, onPostReaction
}) => {
  // Home agora é apenas visualizadora do cronograma; criação/edição de horários acontece no Perfil.
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [showDayCelebration, setShowDayCelebration] = useState(false);

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

  const totalSchedule = user.schedule?.length || 0;
  const completedSchedule = user.schedule?.filter(s => s.completed).length || 0;
  const dayProgressPct = totalSchedule > 0 ? Math.round((completedSchedule / totalSchedule) * 100) : 0;

  useEffect(() => {
    if (totalSchedule > 0 && dayProgressPct === 100) {
      setShowDayCelebration(true);
      const t = setTimeout(() => setShowDayCelebration(false), 2200);
      return () => clearTimeout(t);
    }
  }, [dayProgressPct, totalSchedule]);

  const openScheduleModal = () => {
    setScheduleTime('');
    setScheduleLabel('');
    setSearchTerm('');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-10 relative">
      {showDayCelebration && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="relative z-10 flex flex-col items-center gap-3 animate-fade-up">
            <div className="text-5xl">🚀</div>
            <p className="text-xs font-black text-yellow-200 uppercase tracking-[0.3em]">
              Dia completo
            </p>
            <p className="text-lg font-bold text-white text-center max-w-xs">
              Todas as orações de hoje concluídas. Deo gratias!
            </p>
          </div>
        </div>
      )}
      {/* Greeting Header + stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.25em]">Bem-vindo de volta</p>
          <h1 className="text-4xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">
            Salve, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Sua comunidade de fé está unida em oração.
          </p>
        </div>
        <div className="flex bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-3 py-2 rounded-2xl shadow-lg shadow-slate-900/5 border border-gray-100 dark:border-gray-800 gap-4">
           <div className="px-4 py-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.18em]">Streak</p>
              <p className="font-black text-gold-subtle text-lg">🔥 {user.streak}</p>
           </div>
           <div className="h-10 w-px bg-gray-100 dark:bg-gray-800"></div>
           <div className="px-4 py-1 text-center">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.18em]">Graças</p>
              <p className="font-black text-gray-800 dark:text-white text-lg">{user.graces}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Highlight */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gold-subtle to-yellow-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-gold-subtle/25">
            <div className="relative z-10">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Misterium Fidei</span>
              <h2 className="text-3xl font-black mt-4 mb-2">{dailyPrayer.title}</h2>
              <div className="text-white/90 text-lg leading-relaxed line-clamp-2 mb-6" dangerouslySetInnerHTML={{ __html: dailyPrayer.text }}></div>
              <button
                onClick={() => onSelectPrayer(dailyPrayer.id)}
                className="bg-white text-gold-subtle font-black px-8 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                REZAR AGORA
              </button>
            </div>
            <CrossIcon className="absolute -bottom-10 -right-10 w-64 h-64 text-white/10 rotate-12" />
          </div>

          {/* Social Timeline */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter ml-1">
              Feed
            </h2>
            
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
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-10 text-center border border-dashed border-gray-100 dark:border-gray-800 shadow-sm">
                <UsersIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-sm">
                  Entre em círculos para ver as partilhas dos seus irmãos na fé.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8 sticky top-24">
          
          {/* Spiritual Checklist */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-lg shadow-slate-900/5 border border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-black text-gray-800 dark:text-white mb-3 flex items-center gap-3 uppercase tracking-widest">
              <CalendarIcon className="w-5 h-5 text-gold-subtle" /> Cronograma diário
            </h2>
            {/* Barra de progresso do dia */}
            {totalSchedule > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>{completedSchedule}/{totalSchedule} concluídas hoje</span>
                  <span>{dayProgressPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-subtle to-yellow-500 transition-all duration-500"
                    style={{ width: `${dayProgressPct}%` }}
                  />
                </div>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.18em]">
                  Hoje
                </span>
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
                        <div key={item.id} className="relative flex items-center group gap-2">
                          <button 
                            onClick={() => {
                              if (!item.completed) {
                                setCelebratingId(item.id);
                                setTimeout(() => setCelebratingId(current => current === item.id ? null : current), 1200);
                              }
                              onToggleScheduledPrayer(item.id);
                            }}
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
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className={`text-xs font-bold ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {p.title}
                                </p>
                                {item.label && (
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {item.label}
                                  </p>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-gray-400">
                                {item.time || '—'}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => onRemoveScheduledPrayer(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                          {celebratingId === item.id && (
                            <div className="pointer-events-none absolute -top-4 right-6 text-lg animate-bounce">
                              🎉
                            </div>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="py-2 text-[11px] font-medium text-gray-400 italic">
                    Nenhum horário de oração para hoje. Comece adicionando um acima.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Circle List */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-lg shadow-slate-900/5 border border-gray-100 dark:border-gray-800">
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
