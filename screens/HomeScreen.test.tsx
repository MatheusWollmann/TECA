import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeScreen from './HomeScreen';
import { UserRole, SpiritualLevel } from '../types';
import type { User } from '../types';

// Contrato da spec 0002 (Grupo C): `openScheduleModal` e o estado morto
// (`setScheduleTime`, `setScheduleLabel`, `setSearchTerm`, `setIsModalOpen`) foram
// REMOVIDOS. A Home é apenas visualizadora do cronograma — precisa renderizar sem lançar.

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Matheus Wollmann',
    email: 'matheus@example.com',
    city: 'Curitiba',
    avatarUrl: 'https://example.com/avatar.png',
    graces: 42,
    totalPrayers: 12,
    streak: 7,
    level: SpiritualLevel.Peregrino,
    favoritePrayerIds: [],
    joinedCirculoIds: [],
    role: UserRole.User,
    schedule: [],
    history: {},
    ...overrides,
  };
}

function makeProps() {
  return {
    user: makeUser(),
    dailyPrayer: null,
    circulos: [],
    prayers: [],
    onSelectPrayer: vi.fn(),
    onSelectCirculo: vi.fn(),
    onRemoveScheduledPrayer: vi.fn(),
    onToggleScheduledPrayer: vi.fn(),
    onPostReaction: vi.fn(),
  };
}

describe('HomeScreen', () => {
  it('renderiza sem lançar e saúda o usuário pelo primeiro nome', () => {
    render(<HomeScreen {...makeProps()} />);

    expect(screen.getByRole('heading', { name: 'Salve, Matheus!' })).toBeInTheDocument();
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
  });

  it('mostra o bloco do cronograma diário mesmo sem horários cadastrados', () => {
    render(<HomeScreen {...makeProps()} />);

    expect(screen.getByText(/Cronograma diário/)).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum horário de oração para hoje. Monte seu cronograma no Perfil.'),
    ).toBeInTheDocument();
  });
});
