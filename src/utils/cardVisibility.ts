/**
 * Card Visibility Styling Helper
 *
 * Rules:
 * - GM only (visibility === 'gm' or (isSecret && visibility !== 'all')):
 *   Gold border with gold glow on hover
 * - All users (visibility === 'all' or default):
 *   Gray border with subtle neutral glow on hover
 * - Custom / Specific users (visibility === 'custom' or 'player'):
 *   Cyan border with bluish glow on hover
 */

export function getCardVisibilityClasses(visibility?: string, isSecret?: boolean) {
  const isGmOnly = visibility === 'gm' || (isSecret && visibility !== 'all');
  const isCustom = visibility === 'custom' || visibility === 'player';

  if (isGmOnly) {
    return {
      border: 'border-amber-600/70 hover:border-amber-400',
      shadow: 'shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      glowBadge: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      badgeDot: 'bg-amber-400',
      label: 'Apenas GM',
      type: 'gm' as const
    };
  }

  if (isCustom) {
    return {
      border: 'border-cyan-700/80 hover:border-cyan-400',
      shadow: 'shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]',
      glowBadge: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60',
      badgeDot: 'bg-cyan-400',
      label: 'Jogadores Específicos',
      type: 'custom' as const
    };
  }

  // All / Público para todos
  return {
    border: 'border-zinc-800/80 hover:border-zinc-500/70',
    shadow: 'shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]',
    glowBadge: 'bg-zinc-900/90 text-zinc-300 border-zinc-700/60',
    badgeDot: 'bg-zinc-400',
    label: 'Todos os Jogadores',
    type: 'all' as const
  };
}
