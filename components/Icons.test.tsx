import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CrossIcon, HeartIcon } from './Icons';

// Contrato da spec 0002 (Grupo A): `IconProps` ganha `style?: React.CSSProperties`,
// repassado no <svg> de cada ícone. `App.tsx` passa `style={{ '--r': ... }}` para girar
// o ícone de fundo — hoje o TS reclama porque a prop não existe.

describe('Icons — repasse de style e className', () => {
  it('repassa custom properties de style para o <svg> do CrossIcon', () => {
    const { container } = render(
      <CrossIcon style={{ '--r': '15deg' } as React.CSSProperties} className="foo" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.style.getPropertyValue('--r')).toBe('15deg');
  });

  it('mantém o className aplicado no CrossIcon mesmo com style presente', () => {
    const { container } = render(
      <CrossIcon style={{ '--r': '15deg' } as React.CSSProperties} className="foo" />,
    );
    const svg = container.querySelector('svg');
    expect(svg!.getAttribute('class')).toContain('foo');
  });

  it('repassa style e className no HeartIcon', () => {
    const { container } = render(
      <HeartIcon style={{ opacity: 0.1 } as React.CSSProperties} className="text-white/10" />,
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('style') ?? '').toContain('opacity');
    expect(svg!.getAttribute('class')).toContain('text-white/10');
  });
});
