
import React, { useState } from 'react';
import { LoaderIcon } from '../components/Icons';
import { api } from '../api';

interface AuthScreenProps {
  onLogin: () => Promise<void>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({ name: '', email: 'fiel@teca.com', password: '' });
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setIsLoggingIn(true);
    setError('');
    try {
      if (mode === 'signup') {
        await api.signup(formData.name, formData.email);
        alert("Conta criada com sucesso no seu navegador! Agora você pode entrar.");
        setMode('login');
      } else {
        await onLogin();
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar. Verifique seus dados.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-light dark:bg-gray-800 p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100 dark:border-gray-700">
        <div className="text-center">
            <h1 className="text-5xl font-extrabold text-gold-subtle tracking-tight">Teca</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg italic">"Onde a oração encontra a comunidade"</p>
        </div>
        
        {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center font-medium">
                {error}
            </div>
        )}

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
            {mode === 'signup' && (
                <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Nome</label>
                    <input 
                        type="text" 
                        className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-gold-subtle focus:bg-white dark:focus:bg-gray-900 rounded-2xl shadow-sm outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                        placeholder="Como quer ser chamado?"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>
            )}
            <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                <input 
                    type="email" 
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-gold-subtle focus:bg-white dark:focus:bg-gray-900 rounded-2xl shadow-sm outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                    placeholder="exemplo@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Senha</label>
                <input 
                    type="password" 
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-gold-subtle focus:bg-white dark:focus:bg-gray-900 rounded-2xl shadow-sm outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                    placeholder="********"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                />
            </div>

            <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gold-subtle text-white font-bold py-4 px-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold-subtle/20 transition-all flex items-center justify-center disabled:opacity-70"
            >
                {isLoggingIn ? <LoaderIcon className="w-6 h-6 mr-2" /> : mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? 'Novo por aqui?' : 'Já tem uma conta?'} {' '}
            <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="font-bold text-gold-subtle hover:underline decoration-2 underline-offset-4"
            >
                {mode === 'login' ? 'Cadastre-se' : 'Faça Login'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
