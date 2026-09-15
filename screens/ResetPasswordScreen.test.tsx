import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordScreen from './ResetPasswordScreen';
import { supabaseMock } from '../test/setup';

// Contrato: TEC-7 / docs/specs/0003-login-erro-visivel-e-recuperar-senha.md (item 3).
// status="invalid": link inválido/expirado (mensagem genérica, já que o mesmo hash de
// erro do Supabase cobre recovery, confirmação de cadastro etc. — review do PR #10)
// + botão "Pedir novo link de redefinição" + "Voltar para o login".
// status="valid": form de nova senha (validação client-side) -> api.completePasswordReset
// -> track('auth_password_reset_completed') -> onSuccess(). ResetPasswordScreen chama
// `api` direto (sem prop), então só o supabase é mockado, via test/setup.ts — mesmo
// padrão do AuthScreen.test.tsx.

const track = vi.fn();
vi.mock('../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

const captureError = vi.fn();
vi.mock('../lib/observability', () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

beforeEach(() => {
  track.mockClear();
  captureError.mockClear();
  supabaseMock.auth.updateUser.mockReset();
});

async function preencherSenhas(novaSenha: string, confirmar: string) {
  const user = userEvent.setup();
  const [campoNovaSenha, campoConfirmar] = screen.getAllByPlaceholderText('********');
  await user.type(campoNovaSenha, novaSenha);
  await user.type(campoConfirmar, confirmar);
  await user.click(screen.getByRole('button', { name: 'Salvar e entrar' }));
  return user;
}

describe('ResetPasswordScreen — link inválido/expirado', () => {
  it('mostra "Este link está inválido ou expirado."', () => {
    render(
      <ResetPasswordScreen
        status="invalid"
        onSuccess={vi.fn()}
        onRequestNewLink={vi.fn()}
        onBackToLogin={vi.fn()}
      />,
    );

    expect(screen.getByText('Este link está inválido ou expirado.')).toBeInTheDocument();
  });

  it('chama onRequestNewLink ao clicar em "Pedir novo link de redefinição"', async () => {
    const onRequestNewLink = vi.fn();
    const user = userEvent.setup();
    render(
      <ResetPasswordScreen
        status="invalid"
        onSuccess={vi.fn()}
        onRequestNewLink={onRequestNewLink}
        onBackToLogin={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pedir novo link de redefinição' }));

    expect(onRequestNewLink).toHaveBeenCalled();
  });

  it('chama onBackToLogin ao clicar em "Voltar para o login"', async () => {
    const onBackToLogin = vi.fn();
    const user = userEvent.setup();
    render(
      <ResetPasswordScreen
        status="invalid"
        onSuccess={vi.fn()}
        onRequestNewLink={vi.fn()}
        onBackToLogin={onBackToLogin}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Voltar para o login' }));

    expect(onBackToLogin).toHaveBeenCalled();
  });
});

describe('ResetPasswordScreen — definir nova senha (status="valid")', () => {
  it('mostra "A senha precisa ter pelo menos 8 caracteres." e não chama a API quando a senha tem menos de 8 caracteres', async () => {
    render(<ResetPasswordScreen status="valid" onSuccess={vi.fn()} onRequestNewLink={vi.fn()} onBackToLogin={vi.fn()} />);

    await preencherSenhas('1234567', '1234567');

    expect(
      await screen.findByText('A senha precisa ter pelo menos 8 caracteres.'),
    ).toBeInTheDocument();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
  });

  it('mostra "As senhas não coincidem." e não chama a API quando as senhas são diferentes', async () => {
    render(<ResetPasswordScreen status="valid" onSuccess={vi.fn()} onRequestNewLink={vi.fn()} onBackToLogin={vi.fn()} />);

    await preencherSenhas('MinhaSenhaNova1', 'MinhaSenhaNova2');

    expect(await screen.findByText('As senhas não coincidem.')).toBeInTheDocument();
    expect(supabaseMock.auth.updateUser).not.toHaveBeenCalled();
  });

  it('salva a nova senha, registra auth_password_reset_completed e chama onSuccess quando a API dá certo', async () => {
    supabaseMock.auth.updateUser.mockResolvedValueOnce({ error: null });
    const onSuccess = vi.fn();
    render(<ResetPasswordScreen status="valid" onSuccess={onSuccess} onRequestNewLink={vi.fn()} onBackToLogin={vi.fn()} />);

    await preencherSenhas('MinhaSenhaNova1', 'MinhaSenhaNova1');

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: 'MinhaSenhaNova1' });
    expect(track).toHaveBeenCalledWith('auth_password_reset_completed');
  });

  it('mostra "Não foi possível salvar a nova senha. Tente de novo." e não chama onSuccess quando a API falha — mas registra no Sentry', async () => {
    const erroReal = new Error('boom');
    supabaseMock.auth.updateUser.mockResolvedValueOnce({ error: erroReal });
    const onSuccess = vi.fn();
    render(<ResetPasswordScreen status="valid" onSuccess={onSuccess} onRequestNewLink={vi.fn()} onBackToLogin={vi.fn()} />);

    await preencherSenhas('MinhaSenhaNova1', 'MinhaSenhaNova1');

    expect(
      await screen.findByText('Não foi possível salvar a nova senha. Tente de novo.'),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(captureError).toHaveBeenCalledWith(erroReal, { flow: 'complete_password_reset' });
  });

  it('não deixa o usuário num beco sem saída quando a API falha — "Voltar para o login" continua disponível', async () => {
    supabaseMock.auth.updateUser.mockResolvedValueOnce({ error: new Error('rate limit') });
    const onBackToLogin = vi.fn();
    const user = userEvent.setup();
    render(<ResetPasswordScreen status="valid" onSuccess={vi.fn()} onRequestNewLink={vi.fn()} onBackToLogin={onBackToLogin} />);

    await preencherSenhas('MinhaSenhaNova1', 'MinhaSenhaNova1');
    await screen.findByText('Não foi possível salvar a nova senha. Tente de novo.');

    await user.click(screen.getByRole('button', { name: 'Voltar para o login' }));

    expect(onBackToLogin).toHaveBeenCalled();
  });

  it('anuncia o erro para leitores de tela (role="alert" com aria-live="polite")', async () => {
    render(<ResetPasswordScreen status="valid" onSuccess={vi.fn()} onRequestNewLink={vi.fn()} onBackToLogin={vi.fn()} />);

    await preencherSenhas('1234567', '1234567');
    await screen.findByText('A senha precisa ter pelo menos 8 caracteres.');

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });
});
