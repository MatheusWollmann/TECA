import React from 'react';
import { User, Prayer, SpiritualLevel } from '../types';
import { SPIRITUAL_LEVELS } from '../constants';

interface ProfileScreenProps {
  user: User;
  prayers: Prayer[];
  onSelectPrayer: (prayerId: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, prayers, onSelectPrayer }) => {
    const favoritePrayers = prayers.filter(p => user.favoritePrayerIds.includes(p.id));
    
    const levelInfo = SPIRITUAL_LEVELS[user.level];
    const nextLevelEntries = Object.entries(SPIRITUAL_LEVELS);
    const currentLevelIndex = nextLevelEntries.findIndex(([level]) => level === user.level);
    const nextLevelInfo = currentLevelIndex < nextLevelEntries.length - 1 ? nextLevelEntries[currentLevelIndex + 1][1] : null;
    
    const progressPercentage = nextLevelInfo ? Math.round(((user.graces - levelInfo.min) / (nextLevelInfo.min - levelInfo.min)) * 100) : 100;

    return (
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center space-y-4">
                <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full border-4 border-gold-subtle shadow-lg" />
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{user.city}</p>
                </div>
            </div>

            {/* Gamification Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Progresso Espiritual</h2>
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="font-bold text-lg text-gold-subtle">{user.level}</span>
                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">{user.graces.toLocaleString()} <span className="text-sm font-normal text-gray-500">graças</span></span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-gold-subtle h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    {nextLevelInfo && <p className="text-right text-sm text-gray-500 dark:text-gray-400">
                        {nextLevelInfo.min - user.graces} graças para o próximo nível
                    </p>}
                </div>
            </div>

            {/* Favorite Prayers */}
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Orações Favoritas</h2>
                <div className="space-y-3">
                    {favoritePrayers.length > 0 ? (
                        favoritePrayers.map(prayer => (
                            <div key={prayer.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-sm">
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{prayer.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{prayer.category}</p>
                                </div>
                                <button onClick={() => onSelectPrayer(prayer.id)} className="text-sm text-gold-subtle font-semibold hover:underline">Rezar</button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-6 rounded-lg">Você ainda não marcou nenhuma oração como favorita.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileScreen;