
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
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-100/80 dark:border-gray-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => setPage(Page.Home)}
            className="flex items-center gap-2 group"
          >
            <span className="text-xl font-serif font-bold tracking-tight text-gold-subtle group-hover:opacity-90 transition-opacity">
              Teca
            </span>
            <span className="hidden sm:inline text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Onde a oração encontra a comunidade
            </span>
          </button>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-700/70 px-2 py-1 hover:border-gold-subtle/60 transition-colors shadow-sm"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gold-subtle/60"
                  />
                  <span className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight line-clamp-1">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {user.city}
                    </span>
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl py-2 border border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => { setPage(Page.Profile); setDropdownOpen(false); }}
                      className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Perfil
                    </button>
                    <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <button
                      onClick={() => { onLogout(); setDropdownOpen(false); }}
                      className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOutIcon className="w-4 h-4 mr-2" />
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
