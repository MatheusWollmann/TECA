
import React, { useRef, useState } from 'react';
import { LoaderIcon } from '../components/Icons';
import { api } from '../api';
import { toAuthErrorInfo } from '../lib/authErrors';
import { track } from '../lib/analytics';
import { captureError } from '../lib/observability';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // Estado próprio do fluxo de recuperação: independente de isLoggingIn (login/signup)
  // para não haver corrida entre as duas chamadas assíncronas — ver review do PR #8.
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  // Incrementado sempre que o usuário entra/sai do modo forgot; invalida o `finally`
  // de uma chamada de requestPasswordReset que ainda estava em voo quando isso
  // aconteceu, evitando que uma resposta atrasada "conclua" uma tentativa que o
  // usuário já abandonou — ver review do PR #8.
  const forgotRequestId = useRef(0);

  const handleAuth = async () => {
    setIsLoggingIn(true);
    setError('');
    try {
      if (mode === 'signup') {
        await api.signup(formData.name, formData.email, formData.password);
        alert(
          'Conta criada. Se o projeto exigir confirmação por e-mail, verifique sua caixa de entrada antes de entrar.',
        );
        setMode('login');
      } else {
        await onLogin(formData.email, formData.password);
      }
    } catch (err: any) {
      if (mode === 'login') {
        const info = toAuthErrorInfo(err);
        setError(info.message);
        // TODO analytics: initAnalytics() ainda não é chamado no index.tsx (fora do escopo TEC-5) — track() é no-op até lá.
        track('auth_login_failed', { reason: info.reason });
        passwordRef.current?.focus();
      } else {
        setError(err.message || "Erro ao autenticar. Verifique seus dados.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotSubmit = async () => {
    const requestId = ++forgotRequestId.current;
    setIsRequestingReset(true);
    try {
      await api.requestPasswordReset(forgotEmail);
    } catch (err) {
      // A UI nunca revela o erro real (evita enumeração de conta — sempre cai no
      // mesmo estado neutro abaixo), mas registramos no Sentry pra não mascarar uma
      // falha de verdade (ex.: Supabase mal configurado, rede fora) — sem isso o
      // funil de recuperação de senha falharia 100% silenciosamente.
      captureError(err, { flow: 'request_password_reset' });
    } finally {
      // Só mexe em isRequestingReset/track/forgotSubmitted se esta ainda for a
      // tentativa "atual" (forgotRequestId não mudou desde o início da chamada).
      // Se o usuário saiu do modo forgot e voltou, ou reenviou, openForgotMode/
      // backToLogin já zeraram isRequestingReset na hora — uma resposta atrasada
      // daqui não pode nem reabrir o botão de uma tentativa nova que já está em
      // voo, nem "concluir" com sucesso uma tentativa que o usuário abandonou.
      if (forgotRequestId.current === requestId) {
        setIsRequestingReset(false);
        track('auth_password_reset_requested');
        setForgotSubmitted(true);
      }
    }
  };

  const openForgotMode = () => {
    forgotRequestId.current++;
    setIsRequestingReset(false);
    setForgotEmail('');
    setForgotSubmitted(false);
    setError('');
    setMode('forgot');
  };

  const backToLogin = () => {
    forgotRequestId.current++;
    setIsRequestingReset(false);
    setForgotEmail('');
    setForgotSubmitted(false);
    setError('');
    setMode('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-light dark:bg-gray-800 p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 space-y-6 border border-gray-100 dark:border-gray-700">
        <div className="text-center">
            <h1 className="text-5xl font-extrabold text-gold-subtle tracking-tight">Teca</h1>
            {mode === 'forgot' ? (
                <h2 className="text-gray-500 dark:text-gray-400 mt-3 text-lg italic">Recuperar acesso</h2>
            ) : (
                <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg italic">"Onde a oração encontra a comunidade"</p>
            )}
        </div>

        {mode !== 'forgot' && (
            <div aria-live="polite" role="alert">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm text-center font-medium">
                        {error}
                    </div>
                )}
            </div>
        )}

        {mode === 'forgot' ? (
            forgotSubmitted ? (
                <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-3 rounded-xl text-sm text-center font-medium">
                        Se existe uma conta com esse e-mail, enviamos um link para redefinir a senha.
                    </div>
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={backToLogin}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                        >
                            ← Voltar para o login
                        </button>
                    </div>
                </div>
            ) : (
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleForgotSubmit(); }}>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                        <input
                            type="email"
                            className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-transparent focus:border-gold-subtle focus:bg-white dark:focus:bg-gray-900 rounded-2xl shadow-sm outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="exemplo@email.com"
                            value={forgotEmail}
                            onChange={e => setForgotEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isRequestingReset}
                        className="w-full bg-gold-subtle text-white font-bold py-4 px-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gold-subtle/20 transition-all flex items-center justify-center disabled:opacity-70"
                    >
                        {isRequestingReset ? <LoaderIcon className="w-6 h-6 mr-2" /> : 'Enviar link de recuperação'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={backToLogin}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                        >
                            ← Voltar para o login
                        </button>
                    </div>
                </form>
            )
        ) : (
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
                        ref={passwordRef}
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

                {mode === 'login' && (
                    <div className="text-right">
                        <button
                            type="button"
                            onClick={openForgotMode}
                            className="text-sm font-bold text-gold-subtle hover:underline decoration-2 underline-offset-4"
                        >
                            Esqueci minha senha
                        </button>
                    </div>
                )}
            </form>
        )}

        {mode !== 'forgot' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {mode === 'login' ? 'Novo por aqui?' : 'Já tem uma conta?'} {' '}
                <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="font-bold text-gold-subtle hover:underline decoration-2 underline-offset-4"
                >
                    {mode === 'login' ? 'Cadastre-se' : 'Faça Login'}
                </button>
            </p>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
