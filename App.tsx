
import React, { useState, useEffect, useRef } from 'react';
import { User, Prayer, Page, Circulo, Post, UserRole, CirculoScheduleItem, PrayerSchedule } from './types';
import { api } from './api';
import { MOCK_PRAYERS } from './constants';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import PrayerListScreen from './screens/PrayerListScreen';
import CirculoListScreen from './screens/CommunityScreen';
import ProfileScreen from './screens/ProfileScreen';
import PrayerDetailScreen from './screens/PrayerDetailScreen';
import DevotionDetailScreen from './screens/DevotionDetailScreen';
import CirculoDetailScreen from './screens/CommunityDetailScreen';
import CirculoNav from './components/CirculoNav';
import { LoaderIcon } from './components/Icons';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [circulos, setCirculos] = useState<Circulo[]>([]);

  const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
  const [selectedCirculoId, setSelectedCirculoId] = useState<string | null>(null);

  const [praySuccessMessage, setPraySuccessMessage] = useState('');

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    
    // Auto-login if we have a saved user
    api.login().then(userData => {
        if (userData) handleLogin();
        else setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
        const loggedInUser = await api.login();
        const { user: userData, prayers: prayerData, circulos: circuloData } = await api.getData(loggedInUser.id);
        setUser(userData);
        setPrayers(prayerData);
        setCirculos(circuloData);
        setCurrentPage(Page.Home);
    } catch (e) {
        console.error("Login Error", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setPrayers([]);
    setCirculos([]);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const clearSelection = () => {
    setSelectedPrayerId(null);
    setSelectedCirculoId(null);
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
    if (newPrayer) setPrayers([newPrayer, ...prayers]);
    else alert("Sua contribuição foi enviada para revisão.");
  };

  const handleUpdatePrayer = async (prayerId: string, prayerData: Partial<Prayer>) => {
    if (!user) return;
    const updated = await api.updatePrayer(prayerId, prayerData, user);
    if (updated) {
        setPrayers(curr => curr.map(p => p.id === prayerId ? updated : p));
        setSelectedPrayerId(null);
        setTimeout(() => setSelectedPrayerId(updated.id), 0);
    } else alert("Sugestão de edição enviada!");
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
    const { graces, level } = await api.updateUserGraces(user.id, GRACES);
    setUser(curr => curr ? { ...curr, graces, level } : null);
    setPraySuccessMessage(`+${GRACES} Graças! Que sua oração suba aos céus.`);
    setTimeout(() => setPraySuccessMessage(''), 3000);
  };

  const handleSetScheduledPrayer = async (period: any, prayerId: string) => {
    if (!user) return;
    const newSched = await api.setScheduledPrayer(user.id, period, prayerId);
    setUser(curr => curr ? { ...curr, schedule: newSched } : null);
  };

  const handleRemoveScheduledPrayer = async (period: any) => {
    if (!user) return;
    const newSched = await api.removeScheduledPrayer(user.id, period);
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
    setUser(curr => curr ? { ...curr, joinedCirculoIds } : null);
    setCirculos(curr => curr.map(c => c.id === id ? { ...c, memberCount } : c));
  };

  const addPost = async (id: string, text: string) => {
    if (!user) return;
    const post = await api.addPost(id, text, user);
    setCirculos(curr => curr.map(c => c.id === id ? { ...c, posts: [post, ...c.posts] } : c));
  };

  const renderContent = () => {
    if (!user) return null;
    if (selectedPrayerId) {
        const p = prayers.find(x => x.id === selectedPrayerId);
        if (p) {
            const DetailScreen = p.isDevotion ? DevotionDetailScreen : PrayerDetailScreen;
            return <DetailScreen 
                prayer={p} prayers={prayers} user={user} onBack={clearSelection}
                onPray={handlePray} onToggleFavorite={toggleFavorite} onUpdatePrayer={handleUpdatePrayer}
                praySuccessMessage={praySuccessMessage} onSelectPrayer={handleSelectPrayer}
            />
        }
    }
    if (selectedCirculoId) {
        const c = circulos.find(x => x.id === selectedCirculoId);
        if (c) return <CirculoDetailScreen
            circulo={c} user={user} prayers={prayers} onBack={clearSelection}
            onToggleMembership={toggleCirculoMembership} onAddPost={addPost}
            onPostReaction={async (cid, pid, e) => {
                const updated = await api.handlePostReaction(cid, pid, user.id, e);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onAddReply={async (cid, pid, t) => {
                const updated = await api.addReply(cid, pid, t, user);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onUpdateCirculo={async (cid, d) => {
                const updated = await api.updateCirculo(cid, d, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onDeletePost={async (cid, pid) => {
                const updated = await api.deletePost(cid, pid, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onPinPost={async (cid, pid) => {
                const updated = await api.pinPost(cid, pid, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onUpdateMemberRole={async (cid, mid, isM) => {
                const updated = await api.updateMemberRole(cid, mid, isM, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onRemoveMember={async (cid, mid) => {
                const updated = await api.removeMember(cid, mid, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onAddScheduleItem={async (cid, i) => {
                const updated = await api.addScheduleItem(cid, i, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onUpdateScheduleItem={async (cid, iid, i) => {
                const updated = await api.updateScheduleItem(cid, iid, i, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
            onDeleteScheduleItem={async (cid, iid) => {
                const updated = await api.deleteScheduleItem(cid, iid, user.id);
                setCirculos(curr => curr.map(x => x.id === cid ? updated : x));
            }}
        />
    }

    switch (currentPage) {
      case Page.Home: return <HomeScreen user={user} dailyPrayer={prayers[1] || MOCK_PRAYERS[0]} circulos={circulos} prayers={prayers} onSelectPrayer={handleSelectPrayer} onSetScheduledPrayer={handleSetScheduledPrayer} onRemoveScheduledPrayer={handleRemoveScheduledPrayer} />;
      case Page.Prayers: return <PrayerListScreen user={user} prayers={prayers} favoritePrayerIds={user.favoritePrayerIds} toggleFavorite={toggleFavorite} addPrayer={handleAddPrayer} onSelectPrayer={handleSelectPrayer} />;
      case Page.Devotions: return <PrayerListScreen user={user} prayers={prayers} favoritePrayerIds={user.favoritePrayerIds} toggleFavorite={toggleFavorite} addPrayer={handleAddPrayer} onSelectPrayer={handleSelectPrayer} isDevotionList />;
      case Page.Circulos: return <CirculoListScreen circulos={circulos} joinedCirculoIds={user.joinedCirculoIds} onSelectCirculo={handleSelectCirculo} onToggleMembership={toggleCirculoMembership} />;
      case Page.Profile: return <ProfileScreen user={user} prayers={prayers} onSelectPrayer={handleSelectPrayer} />;
      default: return <HomeScreen user={user} dailyPrayer={prayers[0]} circulos={circulos} prayers={prayers} onSelectPrayer={handleSelectPrayer} onSetScheduledPrayer={handleSetScheduledPrayer} onRemoveScheduledPrayer={handleRemoveScheduledPrayer} />;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark"><LoaderIcon className="w-12 h-12 text-gold-subtle" /></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen text-text-light dark:text-text-dark transition-colors duration-300">
      <Header user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} setPage={handleSetPage} />
      {user && (currentPage === Page.Circulos || selectedCirculoId !== null) && (
        <CirculoNav user={user} circulos={circulos} onSelectCirculo={handleSelectCirculo} onBackToList={() => handleSetPage(Page.Circulos)} />
      )}
      <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 transition-all duration-300 ${ (currentPage === Page.Circulos || selectedCirculoId !== null) ? 'md:pl-48' : 'md:pl-24'}`}>
        {renderContent()}
      </main>
      <BottomNav currentPage={currentPage} setPage={handleSetPage} />
    </div>
  );
};

export default App;
