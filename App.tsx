
import React, { useState, useEffect, useMemo } from 'react';
import { User, Prayer, Page, Circulo, UserRole, PrayerCategory, PrayerEditSuggestion } from './types';
import { api } from './api';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import PrayerListScreen from './screens/PrayerListScreen';
import CirculoListScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';
import PrayerDetailScreen from './screens/PrayerDetailScreen';
import DevotionDetailScreen from './screens/DevotionDetailScreen';
import EditPrayerScreen from './screens/EditPrayerScreen';
import EditorReviewScreen from './screens/EditorReviewScreen';
import CirculoDetailScreen from './screens/CommunityDetailScreen';
import CirculoNav from './components/CirculoNav';
import { LoaderIcon, BookOpenIcon, UsersIcon, CalendarIcon, HeartIcon, CrossIcon, XIcon, ArrowLeftIcon } from './components/Icons';
import { PRAYER_CATEGORIES } from './constants';
import Modal from './components/Modal';

// ─── Página pública do acervo completo ───
const PublicCatalogPage: React.FC<{
  initialTab: 'all' | 'devotions';
  prayers: Prayer[];
  onBack: () => void;
  onSelectPrayer: (p: Prayer) => void;
  selectedPrayer: Prayer | null;
  onCloseModal: () => void;
  onLogin: () => void;
}> = ({ initialTab, prayers, onBack, onSelectPrayer, selectedPrayer, onCloseModal, onLogin }) => {
  const [tab, setTab] = useState<'all' | 'devotions'>(initialTab);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PrayerCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alpha'>('popular');

  const filtered = useMemo(() => {
    let items = tab === 'devotions'
      ? prayers.filter(p => p.isDevotion)
      : prayers.filter(p => !p.isDevotion);

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.authorName.toLowerCase().includes(q)
      );
    }

    if (category !== 'all') {
      items = items.filter(p => p.category === category);
    }

    if (sortBy === 'popular') items.sort((a, b) => b.prayerCount - a.prayerCount);
    else if (sortBy === 'alpha') items.sort((a, b) => a.title.localeCompare(b.title));

    return items;
  }, [prayers, tab, search, category, sortBy]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">

      {/* Prayer read modal */}
      {selectedPrayer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-start justify-center pt-16 sm:pt-20 p-4 overflow-y-auto" onClick={onCloseModal}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-up" onClick={e => e.stopPropagation()}>
            {selectedPrayer.imageUrl && (
              <div className="h-48 sm:h-64 overflow-hidden rounded-t-3xl relative">
                <img src={selectedPrayer.imageUrl} alt={selectedPrayer.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            )}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">
                    {selectedPrayer.isDevotion ? 'Devoção' : selectedPrayer.category}
                  </p>
                  <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">{selectedPrayer.title}</h2>
                </div>
                <button onClick={onCloseModal} className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <XIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {selectedPrayer.latinText && (
                <details className="group">
                  <summary className="text-xs font-bold text-gold-subtle cursor-pointer hover:underline">Ver em latim</summary>
                  <p className="mt-2 text-sm font-serif italic text-gray-500 dark:text-gray-400 leading-relaxed">{selectedPrayer.latinText}</p>
                </details>
              )}
              <div className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-lg" dangerouslySetInnerHTML={{ __html: selectedPrayer.text.replace(/\[prayer:([^\]]+)\]/g, (_match: string, id: string) => {
                const linked = prayers.find(p => p.id === id);
                return linked ? `<em class="text-gold-subtle font-semibold not-italic">${linked.title}</em>` : '[Oração não encontrada]';
              }) }} />
              <div className="flex flex-wrap gap-2">
                {selectedPrayer.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">{tag}</span>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <span>Por <span className="font-semibold text-gray-600 dark:text-gray-300">{selectedPrayer.authorName}</span></span>
                  <span className="mx-2">&middot;</span>
                  <span>{selectedPrayer.createdAt}</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <HeartIcon className="w-3.5 h-3.5 text-red-400" />
                  {selectedPrayer.prayerCount.toLocaleString()}
                </span>
              </div>
              <button
                onClick={onLogin}
                className="w-full py-4 rounded-2xl bg-gold-subtle text-white font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-gold-subtle/20"
              >
                Entrar para rezar e salvar nos favoritos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-light dark:glass border-b border-white/20 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <span className="text-xl font-serif font-bold tracking-tight text-gold-subtle">Teca</span>
          </div>
          <button
            onClick={onLogin}
            className="text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full bg-gold-subtle text-white hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-gold-subtle/20"
          >
            Entrar
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

        {/* Title + Tabs */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">Acervo de Orações</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Todas as orações e devoções da comunidade, abertas para leitura.</p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => { setTab('all'); setCategory('all'); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'all' ? 'bg-gold-subtle text-white shadow-lg shadow-gold-subtle/20' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gold-subtle/30'}`}
            >
              Orações
            </button>
            <button
              onClick={() => { setTab('devotions'); setCategory('all'); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'devotions' ? 'bg-gold-subtle text-white shadow-lg shadow-gold-subtle/20' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-gold-subtle/30'}`}
            >
              Devoções
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="sticky top-16 z-40 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 glass-light dark:glass border-b border-gray-100/50 dark:border-gray-800/50 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Buscar por título, #tag ou autor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gold-subtle focus:border-transparent outline-none text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'popular' | 'recent' | 'alpha')}
              className="px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-gold-subtle"
            >
              <option value="popular">Mais rezadas</option>
              <option value="alpha">A — Z</option>
              <option value="recent">Recentes</option>
            </select>
          </div>
          {tab === 'all' && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setCategory('all')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${category === 'all' ? 'bg-gold-subtle text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gold-subtle'}`}
              >
                Todas
              </button>
              {PRAYER_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${category === cat ? 'bg-gold-subtle text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gold-subtle'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          {search && <span> para "{search}"</span>}
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map(prayer => (
              <article
                key={prayer.id}
                onClick={() => onSelectPrayer(prayer)}
                className="group cursor-pointer bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-gold-subtle/20 hover:-translate-y-1 transition-all duration-500"
              >
                {prayer.imageUrl && (
                  <div className="h-40 overflow-hidden relative">
                    <img src={prayer.imageUrl} alt={prayer.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {!prayer.imageUrl && prayer.isDevotion && (
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <BookOpenIcon className="w-12 h-12 text-gold-subtle/30" />
                  </div>
                )}
                <div className="p-6">
                  <p className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">
                    {prayer.isDevotion ? 'Devoção' : prayer.category}
                  </p>
                  <h4 className="mt-2 text-lg font-serif font-bold text-gray-900 dark:text-white group-hover:text-gold-subtle transition-colors">{prayer.title}</h4>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                    {prayer.text.replace(/<[^>]+>|\[prayer:[^\]]+\]/g, '')}
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">{prayer.authorName}</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <HeartIcon className="w-3.5 h-3.5 text-red-400" />
                      {prayer.prayerCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpenIcon className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-lg">Nenhuma oração encontrada.</p>
            <p className="text-gray-400 text-sm mt-1">Tente outro termo ou limpe os filtros.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [circulos, setCirculos] = useState<Circulo[]>([]);
  const [editSuggestions, setEditSuggestions] = useState<PrayerEditSuggestion[]>([]);

  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [selectedCirculoId, setSelectedCirculoId] = useState<string | null>(null);
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);

  const [praySuccessMessage, setPraySuccessMessage] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [publicSelectedPrayer, setPublicSelectedPrayer] = useState<Prayer | null>(null);
  const [showPublicCatalog, setShowPublicCatalog] = useState<'all' | 'devotions' | null>(null);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionUser = await api.restoreSession();
        if (cancelled) return;
        if (sessionUser) {
          const data = await api.getData(sessionUser.id);
          if (cancelled) return;
          setUser(data.user);
          setPrayers(data.prayers);
          setCirculos(data.circulos);
          setEditSuggestions(data.editSuggestions);
        } else {
          const [p, c] = await Promise.all([
            api.fetchPublicPrayers().catch(() => []),
            api.fetchPublicCirculos().catch(() => []),
          ]);
          if (!cancelled) {
            setPrayers(p);
            setCirculos(c);
          }
        }
      } catch (e) {
        console.error('Bootstrap Error', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshData = async () => {
    try {
      const sessionUser = await api.restoreSession();
      if (sessionUser) {
        const { user: userData, prayers: prayerData, circulos: circuloData, editSuggestions: suggestionData } =
          await api.getData(sessionUser.id);
        setUser(userData);
        setPrayers(prayerData);
        setCirculos(circuloData);
        setEditSuggestions(suggestionData || []);
      }
    } catch (e) {
      console.error('Auth/Data Error', e);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await api.login(email, password);
      await refreshData();
      setCurrentPage(Page.Home);
      setShowAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setEditSuggestions([]);
    try {
      const [p, c] = await Promise.all([api.fetchPublicPrayers(), api.fetchPublicCirculos()]);
      setPrayers(p);
      setCirculos(c);
    } catch {
      setPrayers([]);
      setCirculos([]);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const clearSelection = () => {
    setSelectedPrayerId(null);
    setSelectedCirculoId(null);
    setEditingPrayerId(null);
    setPraySuccessMessage('');
  }

  const handleSetPage = (page: Page) => {
    clearSelection();
    setCurrentPage(page);
  }

  const toggleFavorite = async (prayerId: string) => {
    if (!user) return;
    const newFavoriteIds = await api.toggleFavorite(user.id, prayerId);
    setUser(curr => curr ? { ...curr, favoritePrayerIds: newFavoriteIds } : null);
  };

  const handleAddPrayer = async (prayerData: Partial<Prayer>) => {
    if(!user) return;
    const newPrayer = await api.addPrayer(prayerData, user);
    setPrayers([newPrayer, ...prayers]);
  };

  const handleUpdatePrayer = async (prayerId: string, prayerData: Partial<Prayer>) => {
    if (!user) return;
    const updated = await api.updatePrayer(prayerId, prayerData, user);
    if (updated) {
        setPrayers(curr => curr.map(p => p.id === prayerId ? updated : p));
        setSelectedPrayerId(null);
        setTimeout(() => setSelectedPrayerId(updated.id), 0);
    } else alert("Apenas Editors podem salvar direto. Envie uma sugestão de edição.");
  };

  const handleSuggestPrayerEdit = async (prayerId: string, proposed: Partial<Prayer>, reason?: string) => {
    if (!user) return;
    const suggestion = await api.submitPrayerEditSuggestion(prayerId, proposed, user, reason);
    setEditSuggestions((curr) => [suggestion, ...curr]);
    alert('Sugestão enviada! Um Editor vai revisar em breve.');
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    if (!user) return;
    const result = await api.approveSuggestion(suggestionId, user);
    if (!result) return;
    setEditSuggestions((curr) => curr.map((s) => (s.id === suggestionId ? result.suggestion : s)));
    if (result.prayer) {
      setPrayers((curr) => curr.map((p) => (p.id === result.prayer!.id ? result.prayer! : p)));
    }
  };

  const handleRejectSuggestion = async (suggestionId: string, note?: string) => {
    if (!user) return;
    const updated = await api.rejectSuggestion(suggestionId, user, note);
    if (!updated) return;
    setEditSuggestions((curr) => curr.map((s) => (s.id === suggestionId ? updated : s)));
  };

  const handleSelectPrayer = (prayerId: string) => {
    clearSelection();
    setSelectedPrayerId(prayerId);
    window.scrollTo(0, 0);
  };

  const handlePray = async (prayerId: string) => {
    if (!user) return;
    const newCount = await api.incrementPrayerCount(prayerId);
    setPrayers(curr => curr.map(p => p.id === prayerId ? { ...p, prayerCount: newCount } : p));
    const GRACES = 5;
    const { graces, level, totalPrayers, streak } = await api.updateUserGraces(user.id, GRACES);
    setUser(curr => curr ? { ...curr, graces, level, totalPrayers, streak } : null);
    setPraySuccessMessage(`+${GRACES} Graças! Que sua oração suba aos céus.`);
    setTimeout(() => setPraySuccessMessage(''), 3000);
  };

  const handleAddScheduledPrayer = async (time: string, prayerId: string, label?: string) => {
    if (!user) return;
    const newSched = await api.addScheduledPrayer(user.id, time, prayerId, label);
    setUser(curr => curr ? { ...curr, schedule: newSched } : null);
  };

  const handleRemoveScheduledPrayer = async (scheduleItemId: string) => {
    if (!user) return;
    const newSched = await api.removeScheduledPrayer(user.id, scheduleItemId);
    setUser(curr => curr ? { ...curr, schedule: newSched } : null);
  };

  const handleToggleScheduledPrayer = async (scheduleItemId: string) => {
    if (!user) return;
    const newSched = await api.toggleScheduledPrayer(user.id, scheduleItemId);
    setUser(curr => curr ? { ...curr, schedule: newSched } : null);
  };

  const handleSelectCirculo = (id: string) => {
    clearSelection();
    setSelectedCirculoId(id);
    window.scrollTo(0, 0);
  };

  const toggleCirculoMembership = async (id: string) => {
    if (!user) return;
    const { joinedCirculoIds, memberCount } = await api.toggleCirculoMembership(user.id, id);
    const refreshed = await api.fetchCirculoById(id);
    setUser((curr) => (curr ? { ...curr, joinedCirculoIds } : null));
    setCirculos((curr) =>
      curr.map((c) => (c.id === id ? refreshed ?? { ...c, memberCount } : c)),
    );
  };

  const addPost = async (id: string, text: string) => {
    if (!user) return;
    const post = await api.addPost(id, text, user);
    setCirculos(curr => curr.map(c => c.id === id ? { ...c, posts: [post, ...c.posts] } : c));
  };

  const handlePostReaction = async (cid: string, pid: string, e: string) => {
    if (!user) return;
    const updated = await api.handlePostReaction(cid, pid, user.id, e);
    if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
  };

  const renderContent = () => {
    if (!user) return null;
    if (currentPage === Page.EditPrayer && editingPrayerId) {
      const p = prayers.find((x) => x.id === editingPrayerId);
      if (!p) return null;
      return (
        <EditPrayerScreen
          user={user}
          prayer={p}
          prayers={prayers}
          onBack={() => {
            setCurrentPage(Page.Home);
            setSelectedPrayerId(p.id);
          }}
          onSave={async (id, data) => {
            await handleUpdatePrayer(id, data);
          }}
          onSuggest={async (id, proposed, reason) => {
            await handleSuggestPrayerEdit(id, proposed, reason);
          }}
        />
      );
    }
    if (currentPage === Page.EditorReview) {
      const pending = editSuggestions.filter((s) => s.status === 'PENDING');
      return (
        <EditorReviewScreen
          user={user}
          prayers={prayers}
          suggestions={pending}
          onBack={() => setCurrentPage(Page.Home)}
          onApprove={handleApproveSuggestion}
          onReject={handleRejectSuggestion}
        />
      );
    }
    if (selectedPrayerId) {
        const p = prayers.find(x => x.id === selectedPrayerId);
        if (p) {
            const DetailScreen = p.isDevotion ? DevotionDetailScreen : PrayerDetailScreen;
            return <DetailScreen 
                prayer={p} prayers={prayers} user={user} onBack={clearSelection}
                onPray={handlePray} onToggleFavorite={toggleFavorite} onUpdatePrayer={(id, data) => handleUpdatePrayer(id, data)}
                praySuccessMessage={praySuccessMessage} onSelectPrayer={handleSelectPrayer}
                onEdit={() => { setEditingPrayerId(p.id); setCurrentPage(Page.EditPrayer); }}
            />
        }
    }
    if (selectedCirculoId) {
        const c = circulos.find(x => x.id === selectedCirculoId);
        if (c) return <CirculoDetailScreen
            circulo={c} user={user} prayers={prayers} onBack={clearSelection}
            onToggleMembership={toggleCirculoMembership} onAddPost={addPost}
            onSelectPrayer={handleSelectPrayer}
            onPostReaction={handlePostReaction}
            onAddReply={async (cid, pid, t) => {
                const updated = await api.addReply(cid, pid, t, user);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onUpdateCirculo={async (cid, d) => {
                const updated = await api.updateCirculo(cid, d, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onDeletePost={async (cid, pid) => {
                const updated = await api.deletePost(cid, pid, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onPinPost={async (cid, pid) => {
                const updated = await api.pinPost(cid, pid, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onUpdateMemberRole={async (cid, mid, isM) => {
                const updated = await api.updateMemberRole(cid, mid, isM, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onRemoveMember={async (cid, mid) => {
                const updated = await api.removeMember(cid, mid, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onAddScheduleItem={async (cid, i) => {
                const updated = await api.addScheduleItem(cid, i, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onUpdateScheduleItem={async (cid, iid, i) => {
                const updated = await api.updateScheduleItem(cid, iid, i, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onDeleteScheduleItem={async (cid, iid) => {
                const updated = await api.deleteScheduleItem(cid, iid, user.id);
                if (updated) setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
        />
    }

    switch (currentPage) {
      case Page.Home: return <HomeScreen user={user} dailyPrayer={prayers[1] || prayers[0]} circulos={circulos} prayers={prayers} onSelectPrayer={handleSelectPrayer} onSelectCirculo={handleSelectCirculo} onAddScheduledPrayer={handleAddScheduledPrayer} onRemoveScheduledPrayer={handleRemoveScheduledPrayer} onToggleScheduledPrayer={handleToggleScheduledPrayer} onPostReaction={handlePostReaction} />;
      case Page.Prayers: return <PrayerListScreen user={user} prayers={prayers} favoritePrayerIds={user.favoritePrayerIds} toggleFavorite={toggleFavorite} addPrayer={handleAddPrayer} onSelectPrayer={handleSelectPrayer} />;
      case Page.Devotions: return <PrayerListScreen user={user} prayers={prayers} favoritePrayerIds={user.favoritePrayerIds} toggleFavorite={toggleFavorite} addPrayer={handleAddPrayer} onSelectPrayer={handleSelectPrayer} isDevotionList />;
      case Page.Circulos: return <CirculoListScreen circulos={circulos} user={user} joinedCirculoIds={user.joinedCirculoIds} onSelectCirculo={handleSelectCirculo} onToggleMembership={toggleCirculoMembership} onRefreshData={refreshData} />;
      case Page.Profile: return <ProfileScreen user={user} prayers={prayers} onSelectPrayer={handleSelectPrayer} onAddScheduledPrayer={handleAddScheduledPrayer} />;
      default: return <HomeScreen user={user} dailyPrayer={prayers[0]} circulos={circulos} prayers={prayers} onSelectPrayer={handleSelectPrayer} onSelectCirculo={handleSelectCirculo} onAddScheduledPrayer={handleAddScheduledPrayer} onRemoveScheduledPrayer={handleRemoveScheduledPrayer} onToggleScheduledPrayer={handleToggleScheduledPrayer} onPostReaction={handlePostReaction} />;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><LoaderIcon className="w-12 h-12 text-gold-subtle" /></div>;
  if (!user) {
    if (showAuth) {
      return <AuthScreen onLogin={handleLogin} />;
    }

    const publicDevotions = prayers.filter(p => p.isDevotion);
    const publicPrayers = prayers.filter(p => !p.isDevotion);
    const totalPrayerCount = prayers.reduce((sum, p) => sum + p.prayerCount, 0);
    const featuredPrayer = publicPrayers[0];
    const marqueeItems = prayers.length > 0 ? [...prayers, ...prayers] : [];

    if (showPublicCatalog) {
      return <PublicCatalogPage
        initialTab={showPublicCatalog}
        prayers={prayers}
        onBack={() => setShowPublicCatalog(null)}
        onSelectPrayer={setPublicSelectedPrayer}
        selectedPrayer={publicSelectedPrayer}
        onCloseModal={() => setPublicSelectedPrayer(null)}
        onLogin={() => { setPublicSelectedPrayer(null); setShowAuth(true); }}
      />;
    }

    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark transition-colors duration-300 overflow-x-hidden">

        {/* ── MODAL LEITURA PÚBLICA ── */}
        {publicSelectedPrayer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-start justify-center pt-16 sm:pt-20 p-4 overflow-y-auto" onClick={() => setPublicSelectedPrayer(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-up" onClick={e => e.stopPropagation()}>
              {publicSelectedPrayer.imageUrl && (
                <div className="h-48 sm:h-64 overflow-hidden rounded-t-3xl relative">
                  <img src={publicSelectedPrayer.imageUrl} alt={publicSelectedPrayer.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">
                      {publicSelectedPrayer.isDevotion ? 'Devoção' : publicSelectedPrayer.category}
                    </p>
                    <h2 className="mt-1 text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">{publicSelectedPrayer.title}</h2>
                  </div>
                  <button onClick={() => setPublicSelectedPrayer(null)} className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {publicSelectedPrayer.latinText && (
                  <details className="group">
                    <summary className="text-xs font-bold text-gold-subtle cursor-pointer hover:underline">Ver em latim</summary>
                    <p className="mt-2 text-sm font-serif italic text-gray-500 dark:text-gray-400 leading-relaxed">{publicSelectedPrayer.latinText}</p>
                  </details>
                )}

                <div className="prose prose-base dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-serif text-lg" dangerouslySetInnerHTML={{ __html: publicSelectedPrayer.text.replace(/\[prayer:([^\]]+)\]/g, (_match: string, id: string) => {
                  const linked = prayers.find(p => p.id === id);
                  return linked ? `<em class="text-gold-subtle font-semibold not-italic">${linked.title}</em>` : '[Oração não encontrada]';
                }) }} />

                <div className="flex flex-wrap gap-2">
                  {publicSelectedPrayer.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">{tag}</span>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    <span>Por <span className="font-semibold text-gray-600 dark:text-gray-300">{publicSelectedPrayer.authorName}</span></span>
                    <span className="mx-2">&middot;</span>
                    <span>{publicSelectedPrayer.createdAt}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <HeartIcon className="w-3.5 h-3.5 text-red-400" />
                    {publicSelectedPrayer.prayerCount.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => { setPublicSelectedPrayer(null); setShowAuth(true); }}
                  className="w-full py-4 rounded-2xl bg-gold-subtle text-white font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-gold-subtle/20"
                >
                  Entrar para rezar e salvar nos favoritos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NAV ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-light dark:glass border-b border-white/20 dark:border-gray-800/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <span className="text-xl font-serif font-bold tracking-tight text-gold-subtle">Teca</span>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="#oracoes" className="hidden md:block text-[11px] font-bold text-gray-500 hover:text-gold-subtle transition-colors uppercase tracking-widest">Orações</a>
              <a href="#devocoes" className="hidden md:block text-[11px] font-bold text-gray-500 hover:text-gold-subtle transition-colors uppercase tracking-widest">Devoções</a>
              <a href="#circulos" className="hidden md:block text-[11px] font-bold text-gray-500 hover:text-gold-subtle transition-colors uppercase tracking-widest">Círculos</a>
              <button
                onClick={() => setShowAuth(true)}
                className="text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full bg-gold-subtle text-white hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-gold-subtle/20 animate-pulse-glow"
              >
                Entrar
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background-light via-blue-light/20 to-beige-light/40 dark:from-background-dark dark:via-gray-900 dark:to-gray-800 animate-gradient" />
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          {/* Floating crosses */}
          <CrossIcon className="absolute top-28 right-[12%] w-80 h-80 text-gold-subtle/[0.05] animate-float" style={{ '--r': '15deg' } as React.CSSProperties} />
          <CrossIcon className="absolute bottom-28 left-[8%] w-56 h-56 text-gold-subtle/[0.04] animate-float-slow" style={{ '--r': '-10deg' } as React.CSSProperties} />
          <CrossIcon className="absolute top-[60%] right-[3%] w-32 h-32 text-gold-subtle/[0.03] animate-float" style={{ '--r': '25deg' } as React.CSSProperties} />
          {/* Radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-subtle/[0.06] blur-[120px]" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-8">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 dark:bg-white/10 text-gold-subtle text-[11px] font-black uppercase tracking-widest border border-gold-subtle/20 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gold-subtle animate-pulse" />
                Acervo colaborativo de orações
              </span>
            </div>
            <h1 className="animate-fade-up delay-100 text-5xl sm:text-7xl lg:text-8xl font-serif font-bold text-gray-900 dark:text-white leading-[1.05] tracking-tight">
              Reze, organize e<br/>
              <span className="text-gradient">caminhe em comunidade.</span>
            </h1>
            <p className="animate-fade-up delay-200 text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Um espaço onde qualquer pessoa pode contribuir com orações, montar seu cronograma diário e encontrar irmãos na fé.
            </p>
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowAuth(true)}
                className="group px-10 py-5 rounded-2xl bg-gold-subtle text-white font-black text-base shadow-xl shadow-gold-subtle/25 hover:scale-105 active:scale-95 transition-all relative overflow-hidden"
              >
                <span className="relative z-10">Comece a rezar</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-gold-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <a
                href="#oracoes"
                className="px-10 py-5 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur text-gray-700 dark:text-gray-200 font-bold text-base shadow-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-gold-subtle/40 hover:shadow-lg transition-all"
              >
                Explorar orações
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-scroll-hint">
            <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 rounded-full bg-gold-subtle" />
            </div>
          </div>
        </section>

        {/* ── MARQUEE TICKER ── */}
        <div className="py-5 border-y border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {marqueeItems.map((p, i) => (
              <span key={`${p.id}-${i}`} className="inline-flex items-center gap-3 mx-6 text-sm">
                <span className="text-gold-subtle font-serif font-bold">{p.title}</span>
                <span className="text-[10px] text-gray-300 dark:text-gray-600">&#9679;</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── NUMBERS ── */}
        <section className="py-20 bg-white dark:bg-gray-900/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <p className="text-4xl sm:text-6xl font-serif font-bold text-gray-900 dark:text-white">{prayers.length}</p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Orações no acervo</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl sm:text-6xl font-serif font-bold text-gold-subtle">{totalPrayerCount.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Vezes rezadas</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl sm:text-6xl font-serif font-bold text-gray-900 dark:text-white">{circulos.length}</p>
                <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">Círculos ativos</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-28 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-subtle/[0.04] rounded-full blur-[100px]" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <span className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">Pilares</span>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-2">Como funciona</h2>
              <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-lg">Três caminhos para viver sua fé no dia a dia.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <BookOpenIcon className="w-8 h-8" />, title: 'Acervo aberto', desc: 'Qualquer pessoa pode ler, adicionar e editar orações. Um acervo vivo, construído pela comunidade, como uma Wikipedia da fé.', badge: 'Leitura livre' },
                { icon: <CalendarIcon className="w-8 h-8" />, title: 'Cronograma pessoal', desc: 'Organize quais orações rezar de manhã, à tarde e à noite. Acompanhe seu streak diário e acumule graças.', badge: 'Manhã · Tarde · Noite' },
                { icon: <UsersIcon className="w-8 h-8" />, title: 'Círculos de oração', desc: 'Reúna seu grupo, crie um devocionário próprio, compartilhe intenções de oração e reze junto com seus irmãos.', badge: 'Comunidade' },
              ].map((f, i) => (
                <div key={i} className={`animate-stagger delay-${(i+1)*100} group relative bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700 hover:border-gold-subtle/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[2rem] bg-gradient-to-r from-gold-subtle/0 via-gold-subtle/60 to-gold-subtle/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="inline-block px-3 py-1 rounded-full bg-gold-subtle/10 text-gold-subtle text-[9px] font-black uppercase tracking-widest mb-5">{f.badge}</span>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-subtle/15 to-gold-subtle/5 text-gold-subtle flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-gold-subtle/10 transition-all duration-500">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED PRAYER (Spotlight) ── */}
        {featuredPrayer && (
          <section className="py-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="absolute top-20 left-10 w-72 h-72 bg-gold-subtle/10 rounded-full blur-[80px]" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-gold-subtle text-[10px] font-black uppercase tracking-widest border border-white/10">Oração em destaque</span>
                  <h2 className="text-4xl sm:text-5xl font-serif font-bold leading-tight">{featuredPrayer.title}</h2>
                  <p className="text-gray-400 text-lg leading-relaxed font-serif italic line-clamp-4">
                    {featuredPrayer.text.replace(/<[^>]+>/g, '')}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <HeartIcon className="w-4 h-4 text-red-400" />
                      {featuredPrayer.prayerCount.toLocaleString()} vezes rezada
                    </span>
                    <span>{featuredPrayer.authorName}</span>
                  </div>
                  <button
                    onClick={() => setPublicSelectedPrayer(featuredPrayer)}
                    className="inline-flex px-8 py-4 rounded-2xl bg-gold-subtle text-white font-black text-sm hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-gold-subtle/25"
                  >
                    Ler oração completa
                  </button>
                </div>
                {featuredPrayer.imageUrl && (
                  <div className="relative hidden lg:block">
                    <div className="absolute -inset-4 bg-gold-subtle/20 rounded-[2rem] blur-2xl" />
                    <img src={featuredPrayer.imageUrl} alt={featuredPrayer.title} className="relative rounded-[2rem] w-full h-80 object-cover shadow-2xl border border-white/10" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── ACERVO DE ORAÇÕES ── */}
        <section id="oracoes" className="py-28 scroll-mt-20 relative">
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-light/30 rounded-full blur-[100px] dark:opacity-10" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14">
              <div>
                <span className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">Acervo</span>
                <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-2">Orações</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">Navegue livremente. Crie sua conta para contribuir.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PRAYER_CATEGORIES.slice(0, 4).map(cat => (
                  <span key={cat} className="px-4 py-1.5 rounded-full bg-white dark:bg-gray-800 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider shadow-sm border border-gray-100 dark:border-gray-700">{cat}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicPrayers.map((prayer, i) => (
                <article
                  key={prayer.id}
                  onClick={() => setPublicSelectedPrayer(prayer)}
                  className={`animate-stagger delay-${Math.min(i+1, 5)*100} group cursor-pointer bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:border-gold-subtle/20 hover:-translate-y-1 transition-all duration-500`}
                >
                  {prayer.imageUrl && (
                    <div className="h-44 overflow-hidden relative">
                      <img src={prayer.imageUrl} alt={prayer.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <div className="p-7">
                    <p className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">{prayer.category}</p>
                    <h4 className="mt-2 text-xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-gold-subtle transition-colors">{prayer.title}</h4>
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {prayer.text.replace(/<[^>]+>|\[prayer:[^\]]+\]/g, '')}
                    </p>
                    <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">{prayer.authorName}</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <HeartIcon className="w-3.5 h-3.5 text-red-400" />
                        {prayer.prayerCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button
                onClick={() => { setShowPublicCatalog('all'); window.scrollTo(0, 0); }}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gold-subtle/40 hover:shadow-lg transition-all"
              >
                Ver todas as orações
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </section>

        {/* ── DEVOÇÕES ── */}
        {publicDevotions.length > 0 && (
          <section id="devocoes" className="py-28 bg-gray-900 text-white scroll-mt-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-subtle/[0.06] rounded-full blur-[120px]" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-2xl mb-16">
                <span className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">Caminhos guiados</span>
                <h2 className="text-4xl sm:text-5xl font-serif font-bold mt-2 tracking-tight">Devoções</h2>
                <p className="text-gray-400 mt-4 text-lg leading-relaxed">
                  Orações complexas compostas de várias partes, como o Santo Rosário.
                  Cada devoção é um roteiro completo que liga múltiplas orações menores.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {publicDevotions.map(prayer => (
                  <article
                    key={prayer.id}
                    onClick={() => setPublicSelectedPrayer(prayer)}
                    className="group cursor-pointer relative glass rounded-[2rem] p-8 border border-white/10 hover:border-gold-subtle/40 transition-all duration-500 hover:shadow-2xl hover:shadow-gold-subtle/10"
                  >
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-subtle/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-subtle/30 to-gold-subtle/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <BookOpenIcon className="w-10 h-10 text-gold-subtle" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-2xl font-serif font-bold group-hover:text-gold-subtle transition-colors">{prayer.title}</h4>
                        <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-4">
                          {prayer.text.replace(/<[^>]+>|\[prayer:[^\]]+\]/g, '')}
                        </p>
                        <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <HeartIcon className="w-3.5 h-3.5 text-red-400" />
                            {prayer.prayerCount.toLocaleString()} vezes rezada
                          </span>
                          <span className="flex gap-1">
                            {prayer.tags.slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px]">{tag}</span>)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-12 text-center">
                <button
                  onClick={() => { setShowPublicCatalog('devotions'); window.scrollTo(0, 0); }}
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/10 text-white font-bold text-sm border border-white/20 hover:border-gold-subtle/40 hover:bg-white/15 transition-all"
                >
                  Ver todas as devoções
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── CÍRCULOS PREVIEW ── */}
        <section id="circulos" className="py-28 scroll-mt-20 relative">
          <div className="absolute top-20 right-20 w-72 h-72 bg-gold-subtle/[0.04] rounded-full blur-[80px]" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <span className="text-[10px] font-black text-gold-subtle uppercase tracking-widest">Comunidade</span>
              <h2 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 dark:text-white tracking-tight mt-2">Círculos de oração</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-lg mx-auto text-lg">
                Grupos que rezam juntos, com devocionário e agenda próprios.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {circulos.map((c, i) => (
                <div key={c.id} className={`animate-stagger delay-${(i+1)*100} group bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500`}>
                  <div className="h-32 overflow-hidden relative">
                    <img src={c.coverImageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
                  </div>
                  <div className="p-6 text-center -mt-12 relative">
                    <img src={c.imageUrl} alt={c.name} className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 mx-auto shadow-xl object-cover group-hover:scale-105 transition-transform" />
                    <h4 className="mt-4 text-lg font-serif font-bold text-gray-900 dark:text-white">{c.name}</h4>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{c.description}</p>
                    <div className="mt-5 flex items-center justify-center gap-2">
                      <UsersIcon className="w-3.5 h-3.5 text-gold-subtle" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.memberCount} membros</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-br from-gold-subtle via-yellow-500 to-gold-subtle rounded-[3rem] p-14 sm:p-20 text-white text-center shadow-2xl shadow-gold-subtle/30 overflow-hidden animate-gradient">
              <CrossIcon className="absolute -top-12 -right-12 w-64 h-64 text-white/[0.08] animate-float" style={{ '--r': '15deg' } as React.CSSProperties} />
              <CrossIcon className="absolute -bottom-10 -left-10 w-48 h-48 text-white/[0.06] animate-float-slow" style={{ '--r': '-10deg' } as React.CSSProperties} />
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div className="relative z-10 space-y-6">
                <h2 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight leading-tight">Pronto para<br/>rezar?</h2>
                <p className="text-white/80 text-lg max-w-md mx-auto leading-relaxed">
                  Crie sua conta gratuitamente, monte seu cronograma diário e junte-se a círculos de oração.
                </p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="mt-4 px-12 py-5 rounded-2xl bg-white text-gold-subtle font-black text-base hover:scale-105 active:scale-95 transition-transform shadow-xl"
                >
                  Criar minha conta
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-gray-100 dark:border-gray-800 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-lg font-serif font-bold text-gold-subtle">Teca</span>
              <p className="text-xs text-gray-400 mt-1">Onde a oração encontra a comunidade.</p>
            </div>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 font-medium">Feito com fé.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-text-light dark:text-text-dark transition-colors duration-300">
      <Header user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} setPage={handleSetPage} />
      
      {/* Dock Inferior de Círculos */}
      {user && (currentPage === Page.Circulos || selectedCirculoId !== null) && (
        <CirculoNav user={user} circulos={circulos} onSelectCirculo={handleSelectCirculo} onBackToList={() => handleSetPage(Page.Circulos)} />
      )}
      
      {/* Layout principal com padding lateral consistente para o menu principal */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pl-24 transition-all duration-300">
        {renderContent()}
      </main>
      
      <BottomNav currentPage={currentPage} setPage={handleSetPage} />
    </div>
  );
};

export default App;
