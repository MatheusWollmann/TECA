
import React, { useState } from 'react';
import { User, Page } from '../types';
import { SunIcon, MoonIcon, UserIcon, LogOutIcon } from './Icons';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  currentPage: Page;
  setPage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, darkMode, toggleDarkMode, currentPage, setPage }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gold-subtle cursor-pointer" onClick={() => setPage(Page.Home)}>OraComigo</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {/* Desktop navigation will be in the bottom bar */}
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {darkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-700" />}
            </button>
            {user && (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2">
                  <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full border-2 border-gold-subtle" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    <button onClick={() => { setPage(Page.Profile); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <UserIcon className="w-4 h-4 mr-2"/>
                        Perfil
                    </button>
                    <button onClick={() => { onLogout(); setDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <LogOutIcon className="w-4 h-4 mr-2"/>
                        Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
