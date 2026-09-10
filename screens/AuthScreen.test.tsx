import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from './AuthScreen';

// Contrato: TEC-5 / docs/specs/0003-login-erro-visivel-e-recuperar-senha.md (item 1).
// Falha no login (modo "login") tem que mostrar a mensagem PT na caixa de erro,
// registrar `auth_login_failed` no PostHog e NÃO desmontar a tela.

const track = vi.fn();
vi.mock('../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

async function preencherEEntrar(email = 'joana@teca.app.br', senha = 'senha-errada') {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('exemplo@email.com'), email);
  await user.type(screen.getByPlaceholderText('********'), senha);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => {
  track.mockClear();
});

describe('AuthScreen — erro de login visível', () => {
  it('mostra "E-mail ou senha incorretos." quando a senha está errada', async () => {
    const onLogin = vi.fn().mockRejectedValue({ code: 'invalid_credentials' });
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar();

    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
  });

  it('mantém a tela montada após a falha (o campo de e-mail continua no DOM)', async () => {
    const onLogin = vi.fn().mockRejectedValue({ code: 'invalid_credentials' });
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar();

    await screen.findByText('E-mail ou senha incorretos.');
    expect(screen.getByPlaceholderText('exemplo@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('registra auth_login_failed no PostHog com o motivo traduzido', async () => {
    const onLogin = vi.fn().mockRejectedValue({ code: 'invalid_credentials' });
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar();

    await screen.findByText('E-mail ou senha incorretos.');
    expect(track).toHaveBeenCalledWith('auth_login_failed', { reason: 'invalid_credentials' });
  });

  it('mostra "Confirme seu e-mail antes de entrar." quando o e-mail não foi confirmado', async () => {
    const onLogin = vi.fn().mockRejectedValue({ code: 'email_not_confirmed' });
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar('novo@teca.app.br', 'MinhaSenha123');

    expect(await screen.findByText('Confirme seu e-mail antes de entrar.')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('auth_login_failed', { reason: 'email_not_confirmed' });
  });

  it('mostra a mensagem genérica para um erro inesperado', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('kaboom'));
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar('joana@teca.app.br', 'QualquerCoisa');

    expect(await screen.findByText('Não foi possível entrar. Tente de novo.')).toBeInTheDocument();
  });

  it('não mostra nenhuma mensagem de erro quando o login dá certo', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar('joana@teca.app.br', 'SenhaCerta123');

    await vi.waitFor(() => expect(onLogin).toHaveBeenCalled());
    expect(screen.queryByText('E-mail ou senha incorretos.')).not.toBeInTheDocument();
    expect(screen.queryByText('Não foi possível entrar. Tente de novo.')).not.toBeInTheDocument();
    expect(track).not.toHaveBeenCalledWith('auth_login_failed', expect.anything());
  });

  it('anuncia o erro para leitores de tela (aria-live="polite" no container)', async () => {
    const onLogin = vi.fn().mockRejectedValue({ code: 'invalid_credentials' });
    render(<AuthScreen onLogin={onLogin} />);

    await preencherEEntrar();
    await screen.findByText('E-mail ou senha incorretos.');

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });
});
