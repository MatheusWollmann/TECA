import React from 'react';
import { Circulo, User } from '../types';
import { UsersIcon } from './Icons';

interface CirculoNavProps {
  user: User;
  circulos: Circulo[];
  onSelectCirculo: (circuloId: string) => void;
  onBackToList: () => void;
}

const CirculoNav: React.FC<CirculoNavProps> = ({ user, circulos, onSelectCirculo, onBackToList }) => {
  const joinedCirculos = circulos.filter(c => user.joinedCirculoIds.includes(c.id));

  return (
    <nav className="fixed hidden md:flex flex-col items-center top-16 left-20 h-[calc(100vh-4rem)] w-24 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-r border-gray-200 dark:border-gray-700 z-30 p-2 space-y-2">
        <button
          onClick={onBackToList}
          className="group relative flex justify-center items-center h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gold-subtle hover:text-white transition-colors"
        >
          <UsersIcon className="h-7 w-7" />
          <span className="absolute whitespace-nowrap left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md scale-0 group-hover:scale-100 transition-transform origin-left z-50">
            Todos Círculos
          </span>
        </button>
        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        <div className="flex-1 overflow-y-auto space-y-2 w-full flex flex-col items-center">
            {joinedCirculos.map(circulo => (
            <button
                key={circulo.id}
                onClick={() => onSelectCirculo(circulo.id)}
                className="group relative"
            >
                <img src={circulo.imageUrl} alt={circulo.name} className="h-14 w-14 rounded-full object-cover transition-all duration-200 group-hover:ring-2 group-hover:ring-gold-subtle" />
                 <span className="absolute whitespace-nowrap left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md scale-0 group-hover:scale-100 transition-transform origin-left z-50">
                    {circulo.name}
                </span>
            </button>
            ))}
        </div>
    </nav>
  );
};

export default CirculoNav;
