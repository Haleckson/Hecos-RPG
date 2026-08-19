import React from 'react';

export type ActionGlyphType =
  | '1-action'
  | '2-actions'
  | '3-actions'
  | '1-to-2-actions'
  | '1-to-3-actions'
  | '2-to-3-actions'
  | 'free-action'
  | 'reaction'
  | 'passive';

interface PF2eActionGlyphProps {
  type?: ActionGlyphType | string | number;
  action?: ActionGlyphType | string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

export const PF2eActionGlyph: React.FC<PF2eActionGlyphProps> = ({
  type,
  action,
  size = 'md',
  className = '',
  showTooltip = true,
}) => {
  const normalized = normalizeActionType(type ?? action);
  const safeSize: 'sm' | 'md' | 'lg' = size === 'sm' || size === 'lg' ? size : 'md';

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base',
  }[size];

  const getDetails = () => {
    switch (normalized) {
      case '1-action':
        return {
          label: '1 Ação (Single Action)',
          symbol: '◆',
          color: '#4FEFEF',
          bgColor: 'rgba(79, 239, 239, 0.15)',
          borderColor: '#4FEFEF',
        };
      case '2-actions':
        return {
          label: '2 Ações (Two Actions)',
          symbol: '◆◆',
          color: '#4FEFEF',
          bgColor: 'rgba(79, 239, 239, 0.2)',
          borderColor: '#4FEFEF',
        };
      case '3-actions':
        return {
          label: '3 Ações (Three Actions)',
          symbol: '◆◆◆',
          color: '#4FEFEF',
          bgColor: 'rgba(79, 239, 239, 0.25)',
          borderColor: '#4FEFEF',
        };
      case '1-to-2-actions':
        return {
          label: '1 ou 2 Ações (Variable Actions)',
          symbol: '◆ / ◆◆',
          color: '#D39FE0',
          bgColor: 'rgba(211, 159, 224, 0.2)',
          borderColor: '#D39FE0',
        };
      case '1-to-3-actions':
        return {
          label: '1 a 3 Ações (Variable Actions)',
          symbol: '◆ a ◆◆◆',
          color: '#D39FE0',
          bgColor: 'rgba(211, 159, 224, 0.2)',
          borderColor: '#D39FE0',
        };
      case '2-to-3-actions':
        return {
          label: '2 a 3 Ações (Variable Actions)',
          symbol: '◆◆ a ◆◆◆',
          color: '#D39FE0',
          bgColor: 'rgba(211, 159, 224, 0.2)',
          borderColor: '#D39FE0',
        };
      case 'free-action':
        return {
          label: 'Ação Livre (Free Action)',
          symbol: '◇',
          color: '#00f0ff',
          bgColor: 'rgba(0, 240, 255, 0.1)',
          borderColor: '#00f0ff',
        };
      case 'reaction':
        return {
          label: 'Reação (Reaction)',
          symbol: '↺',
          color: '#be123c',
          bgColor: 'rgba(190, 18, 60, 0.2)',
          borderColor: '#f43f5e',
        };
      case 'passive':
        return {
          label: 'Passiva / Efeito Contínuo',
          symbol: '—',
          color: '#94a3b8',
          bgColor: 'rgba(148, 163, 184, 0.15)',
          borderColor: '#64748b',
        };
      default:
        return {
          label: '1 Ação',
          symbol: '◆',
          color: '#4FEFEF',
          bgColor: 'rgba(79, 239, 239, 0.15)',
          borderColor: '#4FEFEF',
        };
    }
  };

  const info = getDetails();

  return (
    <span
      className={`inline-flex items-center justify-center align-middle select-none transition-transform hover:scale-110 font-bold ${className}`}
      title={showTooltip ? info.label : undefined}
      style={{
        display: 'inline-flex',
        verticalAlign: 'middle',
      }}
    >
      {renderSvgGlyph(normalized, safeSize, info)}
    </span>
  );
};

function normalizeActionType(type?: any): ActionGlyphType {
  const t = String(type ?? '').toLowerCase().trim().replace(/_/g, '-');
  if (t === '1' || t === '1-action' || t === 'one-action' || t === 'action' || t === 'uma-acao') {
    return '1-action';
  }
  if (t === '2' || t === '2-actions' || t === 'two-actions' || t === 'duas-acoes') {
    return '2-actions';
  }
  if (t === '3' || t === '3-actions' || t === 'three-actions' || t === 'tres-acoes') {
    return '3-actions';
  }
  if (
    t === '1-to-2' ||
    t === '1-to-2-actions' ||
    t === 'one-to-two-actions' ||
    t === 'one-or-two-actions' ||
    t === '1-ou-2-acoes'
  ) {
    return '1-to-2-actions';
  }
  if (
    t === '1-to-3' ||
    t === '1-to-3-actions' ||
    t === 'one-to-three-actions' ||
    t === '1-a-3-acoes'
  ) {
    return '1-to-3-actions';
  }
  if (
    t === '2-to-3' ||
    t === '2-to-3-actions' ||
    t === 'two-to-three-actions' ||
    t === '2-a-3-acoes' ||
    t === '2-ou-3-acoes'
  ) {
    return '2-to-3-actions';
  }
  if (t === 'free' || t === 'free-action' || t === 'acao-livre' || t === 'livre') {
    return 'free-action';
  }
  if (t === 'reaction' || t === 'reacao' || t === 'react') {
    return 'reaction';
  }
  if (t === 'passive' || t === 'passiva' || t === 'constante' || t === 'continuo' || t === 'passivo') {
    return 'passive';
  }
  return '1-action';
}

function renderSvgGlyph(
  type: ActionGlyphType,
  size: 'sm' | 'md' | 'lg',
  info: { label: string; color: string; bgColor: string; borderColor: string }
) {
  const pixelSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  switch (type) {
    case '1-action':
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          className="inline-block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L21 12L12 22L3 12L12 2Z"
            fill={info.color}
            stroke="#111"
            strokeWidth="1.5"
          />
          <path
            d="M12 5.5L18.5 12L12 18.5L5.5 12L12 5.5Z"
            fill="#110e19"
            opacity="0.35"
          />
        </svg>
      );

    case '2-actions':
      return (
        <svg
          width={pixelSize * 1.55}
          height={pixelSize}
          viewBox="0 0 38 24"
          className="inline-block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diamond 1 */}
          <path
            d="M11 2L20 12L11 22L2 12L11 2Z"
            fill={info.color}
            stroke="#111"
            strokeWidth="1.5"
          />
          {/* Diamond 2 */}
          <path
            d="M27 2L36 12L27 22L18 12L27 2Z"
            fill={info.color}
            stroke="#111"
            strokeWidth="1.5"
          />
        </svg>
      );

    case '3-actions':
      return (
        <svg
          width={pixelSize * 2.1}
          height={pixelSize}
          viewBox="0 0 54 24"
          className="inline-block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diamond 1 */}
          <path
            d="M10 2L19 12L10 22L1 12L10 2Z"
            fill={info.color}
            stroke="#111"
            strokeWidth="1.5"
          />
          {/* Diamond 2 */}
          <path
            d="M27 2L36 12L27 22L18 12L27 2Z"
            fill={info.color}
            stroke="#111"
            strokeWidth="1.5"
          />
          {/* Diamond 3 */}
          <path
            d="M44 2L53 12L44 22L35 12L44 2Z"
            fill={info.color}
            stroke="#111"
            strokeWidth="1.5"
          />
        </svg>
      );

    case '1-to-2-actions':
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded border border-purple-500/50 bg-purple-950/40 text-purple-300 font-mono text-[11px] leading-none"
          style={{ verticalAlign: 'middle' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L21 12L12 22L3 12L12 2Z" fill="#D39FE0" stroke="#111" />
          </svg>
          <span className="text-[10px] text-purple-400 font-sans font-bold">ou</span>
          <svg width="19" height="12" viewBox="0 0 38 24" fill="none">
            <path d="M11 2L20 12L11 22L2 12L11 2Z" fill="#D39FE0" stroke="#111" />
            <path d="M27 2L36 12L27 22L18 12L27 2Z" fill="#D39FE0" stroke="#111" />
          </svg>
        </span>
      );

    case '1-to-3-actions':
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded border border-purple-500/50 bg-purple-950/40 text-purple-300 font-mono text-[11px] leading-none"
          style={{ verticalAlign: 'middle' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L21 12L12 22L3 12L12 2Z" fill="#D39FE0" stroke="#111" />
          </svg>
          <span className="text-[10px] text-purple-400 font-sans font-bold">a</span>
          <svg width="27" height="12" viewBox="0 0 54 24" fill="none">
            <path d="M10 2L19 12L10 22L1 12L10 2Z" fill="#D39FE0" stroke="#111" />
            <path d="M27 2L36 12L27 22L18 12L27 2Z" fill="#D39FE0" stroke="#111" />
            <path d="M44 2L53 12L44 22L35 12L44 2Z" fill="#D39FE0" stroke="#111" />
          </svg>
        </span>
      );

    case '2-to-3-actions':
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded border border-purple-500/50 bg-purple-950/40 text-purple-300 font-mono text-[11px] leading-none"
          style={{ verticalAlign: 'middle' }}
        >
          <svg width="19" height="12" viewBox="0 0 38 24" fill="none">
            <path d="M11 2L20 12L11 22L2 12L11 2Z" fill="#D39FE0" stroke="#111" />
            <path d="M27 2L36 12L27 22L18 12L27 2Z" fill="#D39FE0" stroke="#111" />
          </svg>
          <span className="text-[10px] text-purple-400 font-sans font-bold">a</span>
          <svg width="27" height="12" viewBox="0 0 54 24" fill="none">
            <path d="M10 2L19 12L10 22L1 12L10 2Z" fill="#D39FE0" stroke="#111" />
            <path d="M27 2L36 12L27 22L18 12L27 2Z" fill="#D39FE0" stroke="#111" />
            <path d="M44 2L53 12L44 22L35 12L44 2Z" fill="#D39FE0" stroke="#111" />
          </svg>
        </span>
      );

    case 'free-action':
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          className="inline-block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2.5L21.5 12L12 21.5L2.5 12L12 2.5Z"
            stroke="#00f0ff"
            strokeWidth="2.5"
            fill="rgba(0,240,255,0.08)"
          />
          <path
            d="M12 7L17 12L12 17L7 12L12 7Z"
            stroke="#00f0ff"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>
      );

    case 'reaction':
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          className="inline-block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Diamond outline */}
          <path
            d="M12 2L21 12L12 22L3 12L12 2Z"
            fill="rgba(190, 18, 60, 0.3)"
            stroke="#f43f5e"
            strokeWidth="1.5"
          />
          {/* Curved Reaction Arrow */}
          <path
            d="M16 8.5C14.8 7.5 13 7 11 7.5C8 8.2 6.5 10.8 6.5 13.5C6.5 16 8.5 18 11.5 18C13.8 18 15.5 16.8 16.2 15M16.5 6V9.5H13"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'passive':
      return (
        <span
          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/80 text-zinc-300 font-mono text-[10px] uppercase font-bold"
          style={{ verticalAlign: 'middle' }}
        >
          Passiva
        </span>
      );
  }
}
