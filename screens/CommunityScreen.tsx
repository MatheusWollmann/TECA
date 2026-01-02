import React from 'react';
import { Circulo } from '../types';
import { PlusCircleIcon } from '../components/Icons';

interface CirculoListScreenProps {
  circulos: Circulo[];
  joinedCirculoIds: string[];
  onSelectCirculo: (circuloId: string) => void;
  onToggleMembership: (circuloId: string) => void;
}

const CirculoCard: React.FC<{ 
    circulo: Circulo, 
    isMember: boolean;
    onSelect: () => void;
    onToggleMembership: () => void;
}> = ({ circulo, isMember, onSelect, onToggleMembership }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
            <div className="p-5 flex flex-col text-center items-center flex-grow cursor-pointer" onClick={onSelect}>
                <img src={circulo.imageUrl} alt={circulo.name} className="w-24 h-24 rounded-full mb-4 border-4 border-blue-light dark:border-gray-700" />
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{circulo.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm my-2 flex-grow">{circulo.description.substring(0, 100)}...</p>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4">{circulo.memberCount.toLocaleString()} membros</p>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700/50">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMembership();
                    }}
                    className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors text-sm ${
                        isMember 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600' 
                        : 'bg-gold-subtle text-white hover:opacity-90'
                    }`}
                >
                    {isMember ? 'Sair' : 'Entrar'}
                </button>
            </div>
        </div>
    );
}

const CirculoListScreen: React.FC<CirculoListScreenProps> = ({ circulos, joinedCirculoIds, onSelectCirculo, onToggleMembership }) => {
  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Círculos de Oração</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Participe, reze e compartilhe a fé.</p>
            </div>
             <button className="flex items-center justify-center gap-2 w-full md:w-auto bg-gold-subtle text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300">
                <PlusCircleIcon className="w-5 h-5" />
                Criar Círculo
            </button>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {circulos.map(circulo => (
          <CirculoCard 
            key={circulo.id} 
            circulo={circulo} 
            isMember={joinedCirculoIds.includes(circulo.id)}
            onSelect={() => onSelectCirculo(circulo.id)}
            onToggleMembership={() => onToggleMembership(circulo.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CirculoListScreen;