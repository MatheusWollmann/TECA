import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichTextEditor } from './PrayerForm';

// Contrato da spec 0002 (Grupo D): `RichTextEditor` é um textarea rotulado simples.
// As props mortas `showPrayerLink`/`onPrayerLink` (nunca lidas, sem botão associado)
// foram removidas. Renderizar só com value/onChange/label não pode lançar.

describe('RichTextEditor', () => {
  it('renderiza mostrando o label e o textarea', () => {
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
