

import React, { useState, useEffect, useRef } from 'react';
import { User, Prayer, Page, Circulo, Post, UserRole, CirculoScheduleItem, PrayerSchedule } from './types';
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
import CirculoDetailScreen from './screens/CommunityDetailScreen';
import CirculoNav from './components/CirculoNav';
import { GoogleGenAI, Modality } from "@google/genai";
import { LoaderIcon } from './components/Icons';

// --- Audio Helper Functions ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

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

  // --- Audio State ---
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  // FIX: Changed BufferSourceNode to AudioBufferSourceNode which is the correct type.
  const audioSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Helper function to prepare text for Text-to-Speech, especially for devotions
  const getPrayerTextForAudio = (prayer: Prayer): string => {
    if (!prayer.isDevotion) {
        // For regular prayers, just strip HTML tags
        return prayer.text.replace(/<[^>]+>/g, '');
    }

    // For devotions, replace prayer links like [prayer:p1] with the actual prayer title
    const audioText = prayer.text.replace(/\[prayer:(p[\w-]+)\]/g, (_match, prayerId) => {
        const linkedPrayer = prayers.find(p => p.id === prayerId);
        return linkedPrayer ? linkedPrayer.title : ''; // Replace with title or empty string if not found
    });
    
    // Finally, strip any HTML tags from the resulting text
    return audioText.replace(/<[^>]+>/g, '');
  };


  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    // In a real app, you'd check a token here. For now, we start logged out.
    setIsLoading(false);
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
    const loggedInUser = await api.login();
    const { user: userData, prayers: prayerData, circulos: circuloData } = await api.getData(loggedInUser.id);
    setUser(userData);
    setPrayers(prayerData);
    setCirculos(circuloData);
    setCurrentPage(Page.Home);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setPrayers([]);
    setCirculos([]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const handleStopAudio = () => {
    if (audioSourceNodeRef.current) {
        audioSourceNodeRef.current.stop();
        audioSourceNodeRef.current.disconnect();
        audioSourceNodeRef.current = null;
    }
    setIsPlayingAudio(false);
    setIsGeneratingAudio(false);
  };

  const clearSelection = () => {
    handleStopAudio();
    setSelectedPrayerId(null);
    setSelectedCirculoId(null);
    setPraySuccessMessage('');
    setAudioError('');
  }

  const handleSetPage = (page: Page) => {
    clearSelection();
    setCurrentPage(page);
  }

  // --- Prayer Logic ---
  const toggleFavorite = async (prayerId: string) => {
    if (!user) return;
    const newFavoriteIds = await api.toggleFavorite(user.id, prayerId);
    setUser(currentUser => currentUser ? { ...currentUser, favoritePrayerIds: newFavoriteIds } : null);
  };

  const handleAddPrayer = async (prayerData: Partial<Prayer>) => {
    if(!user) return;
    const newPrayer = await api.addPrayer(prayerData, user);
    if (newPrayer) {
      setPrayers([newPrayer, ...prayers]);
    } else {
      alert("Sua contribuição foi enviada para revisão por um editor. Obrigado!");
    }
  };

  const handleUpdatePrayer = async (prayerId: string, prayerData: Partial<Prayer>) => {
    if (!user) return;
    const updatedPrayer = await api.updatePrayer(prayerId, prayerData, user);
    if (updatedPrayer) {
        setPrayers(currentPrayers => currentPrayers.map(p => p.id === prayerId ? updatedPrayer : p));
        // Force a re-render of the detail view by clearing and setting the ID again, ensuring it picks up the new data
        setSelectedPrayerId(null);
        setTimeout(() => setSelectedPrayerId(updatedPrayer.id), 0);
    } else {
        alert("Sua sugestão de edição foi enviada para revisão. Obrigado!");
    }
  };


  const handleSelectPrayer = (prayerId: string) => {
    clearSelection();
    setSelectedPrayerId(prayerId);
    window.scrollTo(0, 0);
  };

  const handlePray = async (prayerId: string) => {
    if (!user) return;

    const newPrayerCount = await api.incrementPrayerCount(prayerId);
    setPrayers(currentPrayers => 
        currentPrayers.map(p => 
            p.id === prayerId ? { ...p, prayerCount: newPrayerCount } : p
        )
    );

    const GRACES_PER_PRAYER = 5;
    const { graces, level } = await api.updateUserGraces(user.id, GRACES_PER_PRAYER);
    setUser(currentUser => currentUser ? { ...currentUser, graces, level } : null);

    setPraySuccessMessage(`+${GRACES_PER_PRAYER} Graças! Sua oração foi elevada.`);
    setTimeout(() => setPraySuccessMessage(''), 3000);
  };

  // --- Schedule Logic ---
  const handleSetScheduledPrayer = async (period: 'Manhã' | 'Tarde' | 'Noite', prayerId: string) => {
    if (!user) return;
    const newSchedule = await api.setScheduledPrayer(user.id, period, prayerId);
    setUser(currentUser => currentUser ? { ...currentUser, schedule: newSchedule } : null);
  };

  const handleRemoveScheduledPrayer = async (period: 'Manhã' | 'Tarde' | 'Noite') => {
    if (!user) return;
    const newSchedule = await api.removeScheduledPrayer(user.id, period);
    setUser(currentUser => currentUser ? { ...currentUser, schedule: newSchedule } : null);
  };

  // --- Audio Logic ---
  const handlePlayPrayerAudio = async (prayerId: string) => {
    if (isGeneratingAudio || isPlayingAudio) return;

    const prayer = prayers.find(p => p.id === prayerId);
    if (!prayer) {
        setAudioError("Oração não encontrada.");
        return;
    }

    const textForAudio = getPrayerTextForAudio(prayer);

    setIsGeneratingAudio(true);
    setAudioError('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Diga com uma voz serena e calma: ${textForAudio}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
          },
      });

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data received.");
      
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
      source.onended = () => { setIsPlayingAudio(false); audioSourceNodeRef.current = null; };
      audioSourceNodeRef.current = source;
      setIsPlayingAudio(true);

    } catch (error) {
      console.error("Error generating audio:", error);
      setAudioError("Não foi possível gerar o áudio. Tente novamente.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };
  
  // --- Circulo Logic ---
  const handleSelectCirculo = (circuloId: string) => {
    clearSelection();
    setSelectedCirculoId(circuloId);
    window.scrollTo(0, 0);
  };

  const toggleCirculoMembership = async (circuloId: string) => {
    if (!user) return;
    const { joinedCirculoIds, memberCount } = await api.toggleCirculoMembership(user.id, circuloId);

    setUser(currentUser => currentUser ? { ...currentUser, joinedCirculoIds } : null);
    setCirculos(currentCirculos => 
      currentCirculos.map(c => c.id === circuloId ? { ...c, memberCount } : c)
    );
  };

  const addPost = async (circuloId: string, text: string) => {
    if (!user) return;
    const newPost = await api.addPost(circuloId, text, user);
    setCirculos(currentCirculos =>
        currentCirculos.map(c =>
            c.id === circuloId ? { ...c, posts: [newPost, ...c.posts] } : c
        )
    );
  };

  const handleAddReply = async (circuloId: string, postId: string, text: string) => {
    if (!user) return;
    const updatedCirculo = await api.addReply(circuloId, postId, text, user);
    setCirculos(currentCirculos =>
        currentCirculos.map(c => (c.id === circuloId ? updatedCirculo : c))
    );
  };

  const handlePostReaction = async (circuloId: string, postId: string, emoji: string) => {
    if (!user) return;
    const updatedCirculo = await api.handlePostReaction(circuloId, postId, user.id, emoji);
    setCirculos(currentCirculos =>
        currentCirculos.map(c => (c.id === circuloId ? updatedCirculo : c))
    );
  };

  const handleUpdateCirculo = async (circuloId: string, data: Partial<Circulo>) => {
    if(!user) return;
    const updatedCirculo = await api.updateCirculo(circuloId, data, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };

  const handleDeletePost = async (circuloId: string, postId: string) => {
    if(!user) return;
    const updatedCirculo = await api.deletePost(circuloId, postId, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };

  const handlePinPost = async (circuloId: string, postId: string) => {
    if(!user) return;
    const updatedCirculo = await api.pinPost(circuloId, postId, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };

  const handleUpdateMemberRole = async (circuloId: string, memberId: string, isModerator: boolean) => {
    if(!user) return;
    const updatedCirculo = await api.updateMemberRole(circuloId, memberId, isModerator, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };
  
  const handleRemoveMember = async (circuloId: string, memberId: string) => {
    if(!user) return;
    const updatedCirculo = await api.removeMember(circuloId, memberId, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };
  
  const handleAddScheduleItem = async (circuloId: string, item: Omit<CirculoScheduleItem, 'id'>) => {
    if(!user) return;
    const updatedCirculo = await api.addScheduleItem(circuloId, item, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };
  
  const handleUpdateScheduleItem = async (circuloId: string, itemId: string, item: Omit<CirculoScheduleItem, 'id'>) => {
    if(!user) return;
    const updatedCirculo = await api.updateScheduleItem(circuloId, itemId, item, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };
  
  const handleDeleteScheduleItem = async (circuloId: string, itemId: string) => {
    if(!user) return;
    const updatedCirculo = await api.deleteScheduleItem(circuloId, itemId, user.id);
    setCirculos(currentCirculos => currentCirculos.map(c => c.id === circuloId ? updatedCirculo : c));
  };

  const renderContent = () => {
    if (!user) return null; // Should be handled by the main return block
    
    if (selectedPrayerId) {
        const selectedPrayer = prayers.find(p => p.id === selectedPrayerId);
        if (selectedPrayer) {
            if (selectedPrayer.isDevotion) {
                 return <DevotionDetailScreen 
                    prayer={selectedPrayer} prayers={prayers} user={user} onBack={clearSelection}
                    onPray={handlePray} onToggleFavorite={toggleFavorite} onUpdatePrayer={handleUpdatePrayer}
                    praySuccessMessage={praySuccessMessage} onPlayAudio={handlePlayPrayerAudio}
                    onStopAudio={handleStopAudio} isGeneratingAudio={isGeneratingAudio}
                    isPlayingAudio={isPlayingAudio} audioError={audioError} onSelectPrayer={handleSelectPrayer}
                />
            }
            return <PrayerDetailScreen 
                prayer={selectedPrayer} prayers={prayers} user={user} onBack={clearSelection}
                onPray={handlePray} onToggleFavorite={toggleFavorite} onUpdatePrayer={handleUpdatePrayer}
                praySuccessMessage={praySuccessMessage} onPlayAudio={handlePlayPrayerAudio}
                onStopAudio={handleStopAudio} isGeneratingAudio={isGeneratingAudio}
                isPlayingAudio={isPlayingAudio} audioError={audioError} onSelectPrayer={handleSelectPrayer}
            />
        }
    }
    
    if (selectedCirculoId) {
        const selectedCirculo = circulos.find(c => c.id === selectedCirculoId);
        if (selectedCirculo) {
            return <CirculoDetailScreen
                circulo={selectedCirculo} user={user} prayers={prayers} onBack={clearSelection}
                onToggleMembership={toggleCirculoMembership} onAddPost={addPost}
                onPostReaction={handlePostReaction} onAddReply={handleAddReply}
                onUpdateCirculo={handleUpdateCirculo}
                onDeletePost={handleDeletePost}
                onPinPost={handlePinPost}
                onUpdateMemberRole={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
                onAddScheduleItem={handleAddScheduleItem}
                onUpdateScheduleItem={handleUpdateScheduleItem}
                onDeleteScheduleItem={handleDeleteScheduleItem}
            />
        }
    }

    switch (currentPage) {
      case Page.Home:
        return <HomeScreen user={user} dailyPrayer={prayers[1]} circulos={circulos} prayers={prayers} onSelectPrayer={handleSelectPrayer} onSetScheduledPrayer={handleSetScheduledPrayer} onRemoveScheduledPrayer={handleRemoveScheduledPrayer} />;
      case Page.Prayers:
        return <PrayerListScreen user={user} prayers={prayers} favoritePrayerIds={user.favoritePrayerIds} toggleFavorite={toggleFavorite} addPrayer={handleAddPrayer} onSelectPrayer={handleSelectPrayer} />;
      case Page.Devotions:
        return <PrayerListScreen user={user} prayers={prayers} favoritePrayerIds={user.favoritePrayerIds} toggleFavorite={toggleFavorite} addPrayer={handleAddPrayer} onSelectPrayer={handleSelectPrayer} isDevotionList />;
      case Page.Circulos:
        return <CirculoListScreen circulos={circulos} joinedCirculoIds={user.joinedCirculoIds} onSelectCirculo={handleSelectCirculo} onToggleMembership={toggleCirculoMembership} />;
      case Page.Profile:
        return <ProfileScreen user={user} prayers={prayers} onSelectPrayer={handleSelectPrayer} />;
      default:
        return <HomeScreen user={user} dailyPrayer={prayers[1]} circulos={circulos} prayers={prayers} onSelectPrayer={handleSelectPrayer} onSetScheduledPrayer={handleSetScheduledPrayer} onRemoveScheduledPrayer={handleRemoveScheduledPrayer} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <LoaderIcon className="w-12 h-12 text-gold-subtle" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const showNav = true; // Always show nav for logged-in users
  const showCirculoNav = user && (currentPage === Page.Circulos || selectedCirculoId !== null);

  return (
    <div className="min-h-screen text-text-light dark:text-text-dark transition-colors duration-300">
      <Header
        user={user} onLogout={handleLogout} darkMode={darkMode}
        toggleDarkMode={toggleDarkMode} currentPage={currentPage}
        setPage={handleSetPage}
      />
      {showCirculoNav && (
        <CirculoNav
          user={user}
          circulos={circulos}
          onSelectCirculo={handleSelectCirculo}
          onBackToList={() => handleSetPage(Page.Circulos)}
        />
      )}
      <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 transition-all duration-300 ${ showNav ? (showCirculoNav ? 'md:pl-48' : 'md:pl-24') : ''}`}>
        {renderContent()}
      </main>
      {showNav && <BottomNav currentPage={currentPage} setPage={handleSetPage} />}
    </div>
  );
};

export default App;