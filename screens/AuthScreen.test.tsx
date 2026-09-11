import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthScreen from './AuthScreen';
import { supabaseMock } from '../test/setup';

// Contrato: TEC-5 / docs/specs/0003-login-erro-visivel-e-recuperar-senha.md (item 1).
// Falha no login (modo "login") tem que mostrar a mensagem PT na caixa de erro,
// registrar `auth_login_failed` no PostHog e NÃO desmontar a tela.
//
// Contrato: TEC-6 (item 2 da spec) — modo "forgot": link "Esqueci minha senha" no
// login → form de e-mail → api.requestPasswordReset (só supabase é mockado, via
// test/setup.ts; AuthScreen chama `api` direto, sem prop) → SEMPRE a mensagem
// neutra (sucesso ou erro do mock dão o mesmo resultado) + track de
// `auth_password_reset_requested` + "← Voltar para o login".

const track = vi.fn();
vi.mock('../lib/analytics', () => ({
  track: (...args: unknown[]) => track(...args),
}));

const captureError = vi.fn();
vi.mock('../lib/observability', () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}));

async function preencherEEntrar(email = 'joana@teca.app.br', senha = 'senha-errada') {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('exemplo@email.com'), email);
  await user.type(screen.getByPlaceholderText('********'), senha);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => {
  track.mockClear();
  captureError.mockClear();
  supabaseMock.auth.resetPasswordForEmail.mockReset();
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

const MENSAGEM_NEUTRA =
  'Se existe uma conta com esse e-mail, enviamos um link para redefinir a senha.';

async function irParaEsqueciSenha() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Esqueci minha senha' }));
  return user;
}

describe('AuthScreen — modo forgot (recuperar senha)', () => {
  it('mostra o campo de e-mail e o botão de enviar ao clicar em "Esqueci minha senha"', async () => {
    render(<AuthScreen onLogin={vi.fn()} />);

    await irParaEsqueciSenha();

    expect(screen.getByPlaceholderText('exemplo@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('********')).not.toBeInTheDocument();
  });

  it('mostra a mensagem neutra e registra auth_password_reset_requested quando o pedido dá certo', async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'marta@teca.app.br');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));

    expect(await screen.findByText(MENSAGEM_NEUTRA)).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('auth_password_reset_requested');
  });

  it('mostra a MESMA mensagem neutra quando o pedido falha, sem travar em loading nem revelar o erro — mas registra no Sentry', async () => {
    const erroReal = new Error('E-mail não encontrado');
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: erroReal });
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'inexistente@teca.app.br');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));

    expect(await screen.findByText(MENSAGEM_NEUTRA)).toBeInTheDocument();
    expect(screen.queryByText('E-mail não encontrado')).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('auth_password_reset_requested');
    // A UI não revela o erro, mas ele não pode desaparecer silenciosamente do observability.
    expect(captureError).toHaveBeenCalledWith(erroReal, { flow: 'request_password_reset' });
  });

  it('reabrir "Esqueci minha senha" depois de voltar mostra o form vazio, não o sucesso da tentativa anterior', async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'marta@teca.app.br');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    await screen.findByText(MENSAGEM_NEUTRA);

    await user.click(screen.getByRole('button', { name: '← Voltar para o login' }));
    await irParaEsqueciSenha();

    expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toBeInTheDocument();
    expect(screen.queryByText(MENSAGEM_NEUTRA)).not.toBeInTheDocument();
  });

  it('ignora uma resposta atrasada se o usuário já saiu do modo forgot antes dela resolver', async () => {
    let resolveReset!: (value: { error: null }) => void;
    supabaseMock.auth.resetPasswordForEmail.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveReset = resolve;
      }),
    );
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'marta@teca.app.br');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));

    // Ainda em voo: volta pro login e reabre o forgot antes da promise resolver.
    await user.click(screen.getByRole('button', { name: '← Voltar para o login' }));
    await irParaEsqueciSenha();
    expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toBeInTheDocument();

    // A chamada atrasada resolve agora — não pode "vazar" pro estado atual.
    resolveReset({ error: null });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByRole('button', { name: 'Enviar link de recuperação' })).toBeInTheDocument();
    expect(screen.queryByText(MENSAGEM_NEUTRA)).not.toBeInTheDocument();
  });

  it('não apaga o loading de uma tentativa nova quando uma tentativa antiga e abandonada resolve depois', async () => {
    let resolveA!: (value: { error: null }) => void;
    let resolveB!: (value: { error: null }) => void;
    supabaseMock.auth.resetPasswordForEmail
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveA = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveB = resolve;
        }),
      );
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    // Tentativa A: envia e sai antes de resolver.
    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'marta@teca.app.br');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    await user.click(screen.getByRole('button', { name: '← Voltar para o login' }));

    // Tentativa B: reabre e envia de novo — ainda em voo.
    await irParaEsqueciSenha();
    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'marta@teca.app.br');
    const botaoEnviarB = screen.getByRole('button', { name: 'Enviar link de recuperação' });
    await user.click(botaoEnviarB);

    // A (abandonada) resolve agora — não pode desabilitar o loading de B, que segue em voo.
    resolveA({ error: null });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(botaoEnviarB).toBeDisabled();
    expect(screen.queryByText(MENSAGEM_NEUTRA)).not.toBeInTheDocument();

    // B resolve de verdade — agora sim mostra o sucesso.
    resolveB({ error: null });
    expect(await screen.findByText(MENSAGEM_NEUTRA)).toBeInTheDocument();
  });

  it('volta para o form de login normal ao clicar "← Voltar para o login" no form de recuperação', async () => {
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    await user.click(screen.getByRole('button', { name: '← Voltar para o login' }));

    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('volta para o form de login normal ao clicar "← Voltar para o login" depois do sucesso', async () => {
    supabaseMock.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    render(<AuthScreen onLogin={vi.fn()} />);
    const user = await irParaEsqueciSenha();

    await user.type(screen.getByPlaceholderText('exemplo@email.com'), 'marta@teca.app.br');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    await screen.findByText(MENSAGEM_NEUTRA);

    await user.click(screen.getByRole('button', { name: '← Voltar para o login' }));

    expect(screen.getByPlaceholderText('********')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByText(MENSAGEM_NEUTRA)).not.toBeInTheDocument();
  });
});
