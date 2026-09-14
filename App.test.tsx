import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { supabaseMock } from './test/setup';

// Contrato: TEC-7 / docs/specs/0003-login-erro-visivel-e-recuperar-senha.md (item 3),
// achado do code-reviewer no PR #10 — o bootstrap do App.tsx (dispatch entre o fluxo
// de recovery e o fluxo normal a partir de window.location.hash) é o trecho mais
// sensível da task e não tinha nenhum teste cobrindo os 3 casos abaixo. Só o
// supabase é mockado (mesmo padrão do AuthScreen.test.tsx/ResetPasswordScreen.test.tsx):
// App.tsx chama `api` direto, que por sua vez chama `supabase`.

const captureError = vi.fn();
vi.mock('./lib/observability', () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

beforeEach(() => {
  captureError.mockClear();
  supabaseMock.auth.setSession.mockReset();
  supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  supabaseMock.auth.signOut.mockClear();
});

afterEach(() => {
  window.location.hash = '';
});

describe('App — dispatch do bootstrap a partir do hash da URL', () => {
  it('hash #type=recovery com tokens válidos -> renderiza ResetPasswordScreen (status "valid") e limpa o hash', async () => {
    window.location.hash = '#access_token=abc&refresh_token=xyz&type=recovery';
    supabaseMock.auth.setSession.mockResolvedValueOnce({ error: null });

    render(<App />);

    expect(await screen.findByText('Defina uma nova senha')).toBeInTheDocument();
    expect(supabaseMock.auth.setSession).toHaveBeenCalledWith({
      access_token: 'abc',
      refresh_token: 'xyz',
    });
    expect(window.location.hash).toBe('');
  });

  it('hash #error=... (link expirado/inválido, qualquer fluxo) -> renderiza ResetPasswordScreen (status "invalid") sem chamar setSession', async () => {
    window.location.hash = '#error=access_denied&error_code=otp_expired';

    render(<App />);

    expect(await screen.findByText('Este link está inválido ou expirado.')).toBeInTheDocument();
    expect(supabaseMock.auth.setSession).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalled();
  });

  it('sem hash de recovery -> fluxo normal intacto, ResetPasswordScreen não é renderizado', async () => {
    window.location.hash = '';

    render(<App />);

    expect(await screen.findByText('Acervo colaborativo de orações')).toBeInTheDocument();
    expect(screen.queryByText('Este link está inválido ou expirado.')).not.toBeInTheDocument();
    expect(screen.queryByText('Defina uma nova senha')).not.toBeInTheDocument();
    expect(supabaseMock.auth.setSession).not.toHaveBeenCalled();
  });

  // Achado do code-reviewer no PR #10: em dev, React.StrictMode roda este efeito
  // duas vezes de forma síncrona (setup -> cleanup -> setup) antes do 1º await
  // resolver. Sem o guard em recoveryDispatchRef, a 1ª execução já limparia o hash
  // real da URL antes da 2ª conseguir lê-lo, e as duas disparariam setSession em
  // paralelo. Reproduz isso de propósito envolvendo o render em StrictMode.
  it('sob React.StrictMode (duplo-disparo do efeito em dev), o hash de recovery ainda é processado e setSession roda só uma vez', async () => {
    window.location.hash = '#access_token=abc&refresh_token=xyz&type=recovery';
    supabaseMock.auth.setSession.mockResolvedValueOnce({ error: null });

    render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    expect(await screen.findByText('Defina uma nova senha')).toBeInTheDocument();
    expect(supabaseMock.auth.setSession).toHaveBeenCalledTimes(1);
  });
});

describe('App — abandonar o fluxo de recovery desloga a sessão pendurada', () => {
  it('"Pedir novo link" (link inválido) chama api.logout antes de voltar pra AuthScreen', async () => {
    window.location.hash = '#error=access_denied&error_code=otp_expired';
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Este link está inválido ou expirado.');

    await user.click(screen.getByRole('button', { name: 'Pedir novo link de redefinição' }));

    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(await screen.findByPlaceholderText('exemplo@email.com')).toBeInTheDocument();
  });

  it('"Voltar para o login" (após establishRecoverySession bem-sucedido) chama api.logout antes de voltar pra AuthScreen', async () => {
    window.location.hash = '#access_token=abc&refresh_token=xyz&type=recovery';
    supabaseMock.auth.setSession.mockResolvedValueOnce({ error: null });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Defina uma nova senha');

    await user.click(screen.getByRole('button', { name: 'Voltar para o login' }));

    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
    expect(await screen.findByPlaceholderText('exemplo@email.com')).toBeInTheDocument();
  });
});
