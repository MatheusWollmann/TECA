
import React, { useState } from 'react';
import { LoaderIcon } from '../components/Icons';
import { api } from '../api';
import { track } from '../lib/analytics';
import { captureError } from '../lib/observability';

interface ResetPasswordScreenProps {
  status: 'valid' | 'invalid';
  onSuccess: () => void;
  onRequestNewLink: () => void;
  onBackToLogin: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  status,
  onSuccess,
  onRequestNewLink,
  onBackToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (newPassword.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsSaving(true);
    try {
      await api.completePasswordReset(newPassword);
      track('auth_password_reset_completed');
      onSuccess();
    } catch (err) {
      // A UI mostra só a mensagem genérica; o erro real (ex.: sessão de recovery
      // expirada no meio do fluxo, Supabase fora) vai pro Sentry pra não desaparecer
      // sem rastro — mesmo padrão adotado no forgot da AuthScreen (review do PR #8).
      captureError(err, { flow: 'complete_password_reset' });
      setError('Não foi possível salvar a nova senha. Tente de novo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-light dark:bg-gray-800 p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gold-subtle tracking-tight">Teca</h1>
          {status === 'valid' && (
            <h2 className="text-gray-500 dark:text-gray-400 mt-3 text-lg italic">Defina uma nova senha</h2>
          )}
        </div>

        <div aria-live="polite" role="alert">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}
        </div>

        {status === 'invalid' ? (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center font-medium">
              Este link está inválido ou expirado.
            </div>
            <button
              type="button"
              onClick={onRequestNewLink}
              className="w-full bg-gold-subtle text-white font-bold py-4 px-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold-subtle/20 transition-all flex items-center justify-center disabled:opacity-70"
            >
              Pedir novo link de redefinição
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full text-gray-500 dark:text-gray-400 font-semibold py-2 text-sm hover:text-gold-subtle transition-colors"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Nova senha</label>
              <input
                type="password"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-gold-subtle focus:bg-white dark:focus:bg-gray-900 rounded-2xl shadow-sm outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="********"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Confirmar senha</label>
              <input
                type="password"
                className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-gold-subtle focus:bg-white dark:focus:bg-gray-900 rounded-2xl shadow-sm outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="********"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gold-subtle text-white font-bold py-4 px-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold-subtle/20 transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isSaving ? <LoaderIcon className="w-6 h-6 mr-2" /> : 'Salvar e entrar'}
            </button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full text-gray-500 dark:text-gray-400 font-semibold py-2 text-sm hover:text-gold-subtle transition-colors"
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
