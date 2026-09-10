import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichTextEditor } from './PrayerForm';

// Contrato da spec 0002 (Grupo D): `onPrayerLink` do `RichTextEditor` passa a ser
// opcional. Renderizar sem essa prop não pode lançar.

describe('RichTextEditor', () => {
  it('renderiza sem onPrayerLink, mostrando o label e o textarea', () => {
    expect(() =>
      render(<RichTextEditor label="Texto" value="" onChange={vi.fn()} />),
    ).not.toThrow();

    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('propaga o valor digitado via onChange', () => {
    const onChange = vi.fn();
    render(<RichTextEditor label="Oração" value="Pai Nosso" onChange={onChange} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Pai Nosso');
  });
});
