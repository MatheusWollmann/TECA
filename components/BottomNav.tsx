
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
    const activeClass = isActive ? 'text-gold-subtle' : 'text-gray-500 dark:text-gray-400';
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${activeClass} hover:text-gold-subtle dark:hover:text-gold-subtle`}
        >
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );
};


const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPage }) => {
  const navItems = [
    { page: Page.Home, label: 'Início', icon: <HomeIcon className="w-6 h-6" /> },
    { page: Page.Prayers, label: 'Orações', icon: <BookOpenIcon className="w-6 h-6" /> },
    { page: Page.Devotions, label: 'Devoções', icon: <CrossIcon className="w-6 h-6" /> },
    { page: Page.Circulos, label: 'Círculos', icon: <UsersIcon className="w-6 h-6" /> },
    { page: Page.Profile, label: 'Perfil', icon: <UserIcon className="w-6 h-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-[0_-2px_5px_rgba(0,0,0,0.05)] z-40 md:top-16 md:left-0 md:h-full md:w-20 md:flex md:flex-col md:justify-start md:pt-8 md:shadow-none md:border-r md:border-gray-200 dark:md:border-gray-700">
      <div className="flex justify-around items-center h-full md:flex-col md:space-y-8 md:h-auto">
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