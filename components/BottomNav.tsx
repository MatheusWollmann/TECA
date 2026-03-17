
import React from 'react';
import { Page } from '../types';
import { HomeIcon, BookOpenIcon, UsersIcon, UserIcon, CrossIcon } from './Icons';

interface BottomNavProps {
  currentPage: Page;
  setPage: (page: Page) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full py-2 transition-all duration-200 ${
        isActive
          ? 'text-gold-subtle'
          : 'text-gray-500 dark:text-gray-400 hover:text-gold-subtle'
      }`}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${
          isActive
            ? 'bg-gold-subtle/10 shadow-md shadow-gold-subtle/20'
            : 'bg-transparent'
        }`}
      >
        {icon}
      </div>
      <span className="text-[11px] mt-1 font-semibold">{label}</span>
      {isActive && (
        <span className="absolute -top-1 md:-right-1 w-1.5 h-1.5 rounded-full bg-gold-subtle" />
      )}
    </button>
  );
};


const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPage }) => {
  const navItems = [
    { page: Page.Home, label: 'Início', icon: <HomeIcon className="w-5 h-5" /> },
    { page: Page.Prayers, label: 'Orações', icon: <BookOpenIcon className="w-5 h-5" /> },
    { page: Page.Devotions, label: 'Devoções', icon: <CrossIcon className="w-5 h-5" /> },
    { page: Page.Circulos, label: 'Círculos', icon: <UsersIcon className="w-5 h-5" /> },
    { page: Page.Profile, label: 'Perfil', icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100/80 dark:border-gray-800/80 shadow-[0_-6px_30px_rgba(15,23,42,0.35)] z-40 md:top-1/2 md:left-6 md:right-auto md:bottom-auto md:h-auto md:w-20 md:-translate-y-1/2 md:rounded-3xl md:flex md:flex-col md:justify-center md:py-4 md:px-1.5 md:border md:border-gray-100/80 dark:md:border-gray-800/80">
      <div className="flex justify-around items-center h-full md:flex-col md:space-y-4 md:h-auto">
        {navItems.map(item => (
          <NavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            isActive={currentPage === item.page}
            onClick={() => setPage(item.page)}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;