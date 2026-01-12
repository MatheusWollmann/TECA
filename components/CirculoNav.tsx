
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

  if (joinedCirculos.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full flex justify-center px-4">
      <nav className="pointer-events-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-2 rounded-full shadow-2xl flex items-center gap-1 ring-1 ring-black/5 max-w-[95vw] md:max-w-fit">
        
        {/* Botão de Ver Todos */}
        <button
          onClick={onBackToList}
          className="group relative flex-shrink-0 flex justify-center items-center h-12 w-12 rounded-full bg-gray-200/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-gold-subtle hover:text-white transition-all active:scale-95"
        >
          <UsersIcon className="h-6 w-6" />
          <span className="absolute whitespace-nowrap bottom-full mb-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl scale-0 group-hover:scale-100 transition-transform origin-bottom shadow-xl">
            Comunidade
          </span>
        </button>

        <div className="flex-shrink-0 w-px h-8 bg-gray-300/50 dark:bg-gray-700/50 mx-1"></div>

        {/* Lista de Círculos (Dock Items) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 flex-nowrap scroll-smooth">
            {joinedCirculos.map(circulo => (
              <button
                  key={circulo.id}
                  onClick={() => onSelectCirculo(circulo.id)}
                  className="group relative flex-shrink-0"
              >
                  <img 
                    src={circulo.imageUrl} 
                    alt={circulo.name} 
                    className="h-12 w-12 rounded-full object-cover transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border-2 border-transparent group-hover:border-gold-subtle flex-shrink-0" 
                  />
                  <span className="absolute whitespace-nowrap bottom-full mb-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl scale-0 group-hover:scale-100 transition-transform origin-bottom shadow-xl z-50">
                      {circulo.name}
                  </span>
                  {/* Indicador de "App aberto" estilo macOS */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-subtle rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
        </div>
      </nav>
    </div>
  );
};

export default CirculoNav;
