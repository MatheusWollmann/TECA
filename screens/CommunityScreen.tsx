
import React, { useState } from 'react';
import { Circulo, User } from '../types';
import { PlusCircleIcon, UsersIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { api } from '../api';

interface CirculoListScreenProps {
  circulos: Circulo[];
  user: User;
  joinedCirculoIds: string[];
  onSelectCirculo: (circuloId: string) => void;
  onToggleMembership: (circuloId: string) => void;
  onRefreshData: () => void;
}

const CirculoCard: React.FC<{ 
    circulo: Circulo, 
    isMember: boolean;
    onSelect: () => void;
    onToggleMembership: () => void;
}> = ({ circulo, isMember, onSelect, onToggleMembership }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm flex flex-col transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="p-6 flex flex-col text-center items-center flex-grow cursor-pointer" onClick={onSelect}>
                <div className="relative mb-6">
                   <img src={circulo.imageUrl} alt={circulo.name} className="w-24 h-24 rounded-full object-cover border-4 border-gold-subtle/20 shadow-lg" />
                   {isMember && <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800"></div>}
                </div>
                <h3 className="font-black text-xl text-gray-900 dark:text-white line-clamp-1">{circulo.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm my-3 flex-grow line-clamp-3 leading-relaxed">{circulo.description}</p>
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                   <UsersIcon className="w-4 h-4" />
                   {circulo.memberCount.toLocaleString()} MEMBROS
                </div>
            </div>
            <div className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-b-3xl">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMembership();
                    }}
                    className={`w-full font-black py-3 px-4 rounded-2xl transition-all text-sm uppercase tracking-widest ${
                        isMember 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20' 
                        : 'bg-gold-subtle text-white shadow-lg shadow-gold-subtle/20 hover:opacity-90'
                    }`}
                >
                    {isMember ? 'Membro' : 'Participar'}
                </button>
            </div>
        </div>
    );
}

const CirculoListScreen: React.FC<CirculoListScreenProps> = ({ circulos, user, joinedCirculoIds, onSelectCirculo, onToggleMembership, onRefreshData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCirculo, setNewCirculo] = useState({ name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        await api.addCirculo(newCirculo, user);
        setIsModalOpen(false);
        setNewCirculo({ name: '', description: '' });
        onRefreshData();
    } catch (e) {
        alert("Erro ao criar círculo");
    } finally {
        setIsCreating(false);
    }
  };

  return (
    <div className="space-y-10">
       <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Círculo">
            <form onSubmit={handleCreate} className="space-y-6">
                <div>
                    <label className="block text-sm font-black text-gray-400 uppercase mb-2">Nome do Círculo</label>
                    <input 
                        type="text" required value={newCirculo.name} 
                        onChange={e => setNewCirculo({...newCirculo, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-gold-subtle outline-none"
                        placeholder="Ex: Grupo de Jovens São João"
                    />
                </div>
                <div>
                    <label className="block text-sm font-black text-gray-400 uppercase mb-2">Descrição e Propósito</label>
                    <textarea 
                        required value={newCirculo.description} 
                        onChange={e => setNewCirculo({...newCirculo, description: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-gold-subtle outline-none"
                        placeholder="Qual o objetivo deste grupo de oração?"
                    />
                </div>
                <button 
                    disabled={isCreating}
                    className="w-full bg-gold-subtle text-white font-black py-4 rounded-2xl shadow-xl shadow-gold-subtle/20 hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                    {isCreating ? 'Criando...' : 'LANÇAR CÍRCULO'}
                </button>
            </form>
       </Modal>

       <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
                <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Círculos</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg mt-2">Encontre sua comunidade de fé e intercessão.</p>
            </div>
             <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-3 bg-gold-subtle text-white font-black py-4 px-8 rounded-3xl hover:shadow-xl hover:shadow-gold-subtle/30 transition-all uppercase tracking-widest text-sm">
                <PlusCircleIcon className="w-5 h-5" />
                Novo Círculo
            </button>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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

      {circulos.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-4 border-dashed border-gray-100 dark:border-gray-700">
              <p className="text-gray-400 font-bold">Nenhum círculo encontrado. Que tal criar o primeiro?</p>
          </div>
      )}
    </div>
  );
};

export default CirculoListScreen;
