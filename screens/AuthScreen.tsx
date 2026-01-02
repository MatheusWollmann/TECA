
import React, { useState } from 'react';
import { LoaderIcon } from '../components/Icons';

interface AuthScreenProps {
  onLogin: () => Promise<void>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    try {
      await onLogin();
    } catch (error) {
      console.error("Login failed:", error);
      // In a real app, show an error message to the user here.
      setIsLoggingIn(false);
    }
    // On success, the component will unmount, so no need to reset state.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-light dark:bg-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-gold-subtle">OraComigo</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Reze, compartilhe e viva a fé em comunidade.</p>
        </div>
        
        <form className="space-y-4">
            <div>
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" id="email" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-gold-subtle focus:border-gold-subtle" placeholder="seu@email.com" defaultValue="fiel@oracomigo.com" />
            </div>
            <div>
                <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                <input type="password" id="password" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-gold-subtle focus:border-gold-subtle" placeholder="********" defaultValue="123456" />
            </div>
        </form>

        <button 
          onClick={handleLoginClick} 
          disabled={isLoggingIn}
          className="w-full bg-gold-subtle text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <>
              <LoaderIcon className="w-5 h-5 mr-2" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Ou continue com</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Google
            </button>
            <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                Apple
            </button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Não tem uma conta? <a href="#" className="font-medium text-gold-subtle hover:underline">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
