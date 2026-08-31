import React from 'react';
import { HecosEntity, PerilAttributes, PerilKind, PerilFieldVisibility } from '../types';
import { TraitBadge } from './TraitBadge';
import { RichContentRenderer } from './RichContentRenderer';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import { HecosStorage } from '../services/storage';
import {
  Skull,
  AlertTriangle,
  Flame,
  Ghost,
  Shield,
  Heart,
  Eye,
  Zap,
  Swords,
  Compass,
  ExternalLink
} from 'lucide-react';

interface PerilTooltipCardProps {
  peril: HecosEntity;
  onSelectEntity?: (id: string) => void;
}

const KIND_BADGE_MAP: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  monster: { label: 'Monstro', icon: Skull, bg: 'bg-rose-950/90 text-rose-300 border-rose-700/60' },
  hazard_simple: { label: 'Perigo Simples', icon: AlertTriangle, bg: 'bg-amber-950/90 text-amber-300 border-amber-700/60' },
  hazard_complex: { label: 'Perigo Complexo', icon: Zap, bg: 'bg-orange-950/90 text-orange-300 border-orange-700/60' },
  haunt: { label: 'Assombração', icon: Ghost, bg: 'bg-purple-950/90 text-purple-300 border-purple-700/60' },
  environmental: { label: 'Ambiental', icon: Flame, bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60' },
};

function getKindBadge(kind: string) {
  return KIND_BADGE_MAP[kind] || { label: 'Perigo', icon: AlertTriangle, bg: 'bg-rose-950/90 text-rose-300 border-rose-700/60' };
}

export const PerilTooltipCard: React.FC<PerilTooltipCardProps> = ({
  peril,
  onSelectEntity,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = currentUser?.role === 'gm' || HecosStorage.isUserGm();

  const perilData: Partial<PerilAttributes> = peril.perilData || {};
  const fieldVis = perilData.fieldVisibility;

  const isFieldVisible = (fieldKey: keyof PerilFieldVisibility): boolean => {
    if (effectiveIsGm) return true;
    if (!fieldVis) return true;
    const vis = fieldVis[fieldKey];
    if (!vis) {
      if (['name', 'level', 'typeAndTraits', 'description'].includes(fieldKey)) return true;
      return false;
    }
    if (vis === 'all') return true;
    if (vis === 'custom' && currentUser) {
      const allowed = fieldVis.allowedUsers?.[fieldKey] || [];
      return allowed.includes(currentUser.id);
    }
    return false;
  };

  const canViewLevel = isFieldVisible('level');
  const canViewTraits = isFieldVisible('typeAndTraits');
  const canViewDescription = isFieldVisible('description');
  const canViewHp = isFieldVisible('hpAndHealth') || isFieldVisible('hardnessAndBT');
  const canViewAc = isFieldVisible('acAndDefenses');
  const canViewPerception = isFieldVisible('sensesAndPerception');
  const canViewSaves = isFieldVisible('acAndDefenses');
  const canViewSpeed = isFieldVisible('actionsAndAbilities') || isFieldVisible('acAndDefenses');
  const canViewDefenses = isFieldVisible('weaknessesAndResistances') || isFieldVisible('immunities');
  const canViewAttacks = isFieldVisible('attacksAndDamage');
  const canViewMechanics = isFieldVisible('disableAndReset') || isFieldVisible('routine');

  const kind: PerilKind = perilData.perilKind || (peril.category === 'creature' ? 'monster' : 'hazard_simple');
  const isMonster = kind === 'monster';
  const level = perilData.level ?? peril.statblock?.level ?? 1;
  const rarity = perilData.rarity || peril.statblock?.rarity || 'Comum';
  const size = isMonster ? (perilData.size || peril.statblock?.size || 'Médio') : (perilData.size || undefined);

  const isHazard = kind === 'hazard_simple' || kind === 'hazard_complex';

  // Stats
  const hp = perilData.hp ?? peril.statblock?.hp;
  const ac = perilData.ac ?? peril.statblock?.ac;
  const fort = perilData.fort;
  const ref = perilData.ref;
  const will = perilData.will;
  const perception = perilData.perception;
  const stealth = perilData.stealthCheck;
  const hardness = perilData.hardness;
  const speed = perilData.speed ?? peril.statblock?.speed;

  // Images
  const coverImage = (canViewDescription || effectiveIsGm) ? (peril.coverImage || perilData.portraitImage) : undefined;
  const tokenImage = peril.icon || perilData.tokenImage;

  // Traits - strictly show Rarity, Size (when monster/specified), and chosen custom traits
  const rawTraits = (perilData.traits && perilData.traits.length > 0)
    ? perilData.traits
    : (peril.statblock?.traits && peril.statblock.traits.length > 0)
    ? peril.statblock.traits
    : [];
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity, size });

  // Kind helper
  const kindBadge = getKindBadge(kind);
  const KindIcon = kindBadge.icon;

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('hecos:open-entity-drawer', {
        detail: { entityId: peril.id, slug: peril.slug }
      })
    );
    if (onSelectEntity) {
      onSelectEntity(peril.id);
    }
  };

  // Compile defense tags (Immunities, Weaknesses, Resistances) in one compact string or array
  const hasDefenses = canViewDefenses && Boolean(
    (perilData.immunities && perilData.immunities.length > 0) ||
    (perilData.weaknesses && perilData.weaknesses.length > 0) ||
    (perilData.resistances && perilData.resistances.length > 0)
  );

  return (
    <div className="p-3.5 space-y-2.5 w-[330px] sm:w-[380px] max-w-full text-left bg-[#0e0a17] border border-rose-500/40 rounded-2xl shadow-2xl select-none">
      {/* Top Header */}
      <div className="border-b border-zinc-800/90 pb-2.5 flex items-start gap-2.5">
        {/* Token/Portrait Thumbnail */}
        <div className="w-11 h-11 rounded-xl bg-[#1a0f28] border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0 overflow-hidden shadow-md">
          {tokenImage || coverImage ? (
            <img
              src={tokenImage || coverImage}
              alt={peril.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <KindIcon className="w-5 h-5 text-rose-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {(canViewTraits || effectiveIsGm) && (
              <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 shadow-sm ${kindBadge.bg}`}>
                <KindIcon className="w-2.5 h-2.5" />
                <span>{kindBadge.label}</span>
              </span>
            )}
            {(canViewLevel || effectiveIsGm) && (
              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold uppercase bg-black/70 text-rose-300 border border-rose-800/60">
                Nível {level}
              </span>
            )}
          </div>

          <h4 className="text-sm sm:text-base font-bold text-zinc-100 font-serif leading-tight truncate">
            {peril.title || 'Sem Título'}
          </h4>
          {(canViewDescription || canViewTraits || effectiveIsGm) && peril.subtitle && (
            <p className="text-[11px] text-[#cca1b8] font-medium truncate mt-0.5">
              {peril.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Traits */}
      {(canViewTraits || effectiveIsGm) && orderedTraits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {orderedTraits.slice(0, 6).map((t) => (
            <TraitBadge
              key={t}
              trait={t}
              compact
              size="xs"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } })
                );
              }}
            />
          ))}
        </div>
      )}

      {/* Primary Stats Matrix (4-Grid compact) */}
      {(canViewHp || canViewAc || canViewPerception || canViewSpeed) && (
        <div className="grid grid-cols-4 gap-1 bg-[#140d1e] p-1.5 rounded-xl border border-zinc-800/90 shadow-inner text-center text-xs">
          {canViewHp && (
            <div className="p-1 rounded-lg bg-[#190f24]/90 border border-rose-900/40">
              <span className="text-[8px] uppercase font-bold tracking-wider text-rose-300/90 font-mono block">
                {hardness !== undefined && !hp ? 'Dureza' : 'PV'}
              </span>
              <span className="font-black text-rose-100 text-xs sm:text-sm">
                {hp !== undefined ? `${hp} PV` : hardness !== undefined ? `${hardness}` : '—'}
              </span>
            </div>
          )}

          {canViewAc && (
            <div className="p-1 rounded-lg bg-[#190f24]/90 border border-rose-900/40">
              <span className="text-[8px] uppercase font-bold tracking-wider text-rose-300/90 font-mono block">
                CA
              </span>
              <span className="font-black text-rose-100 text-xs sm:text-sm">
                {ac !== undefined ? ac : '—'}
              </span>
            </div>
          )}

          {canViewPerception && (
            <div className="p-1 rounded-lg bg-[#120a1c]/90 border border-zinc-800/80">
              <span className="text-[8px] uppercase font-bold tracking-wider text-cyan-300/90 font-mono block">
                {stealth ? 'Furt.' : 'Percep.'}
              </span>
              <span className="font-bold text-zinc-200 text-xs truncate block">
                {perception !== undefined ? `+${perception}` : stealth ? stealth.slice(0, 8) : '—'}
              </span>
            </div>
          )}

          {canViewSpeed && (
            <div className="p-1 rounded-lg bg-[#120a1c]/90 border border-zinc-800/80">
              <span className="text-[8px] uppercase font-bold tracking-wider text-amber-300/90 font-mono block">
                {isHazard ? 'Reação' : 'Desloc.'}
              </span>
              <span className="font-bold text-zinc-200 text-xs truncate block">
                {isHazard ? (perilData.disable ? 'Desat.' : 'Auto') : speed ? speed.split(',')[0].trim() : '9m'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Saving Throws (Monsters/Creatures) */}
      {canViewSaves && isMonster && (fort !== undefined || ref !== undefined || will !== undefined) && (
        <div className="flex items-center justify-around p-1 rounded-lg bg-black/40 border border-zinc-800/80 text-[10px] font-mono">
          <span className="text-zinc-400">
            Fort <strong className="text-zinc-200">{fort !== undefined ? `+${fort}` : '—'}</strong>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">
            Ref <strong className="text-zinc-200">{ref !== undefined ? `+${ref}` : '—'}</strong>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">
            Vont <strong className="text-zinc-200">{will !== undefined ? `+${will}` : '—'}</strong>
          </span>
        </div>
      )}

      {/* Compact Resistances / Weaknesses / Immunities */}
      {hasDefenses && (
        <div className="p-1.5 rounded-lg bg-[#120a1c] border border-zinc-800/60 text-[10px] space-y-0.5 text-zinc-300">
          {perilData.immunities && perilData.immunities.length > 0 && (
            <div className="truncate">
              <strong className="text-zinc-100">Imunidades:</strong> {perilData.immunities.join(', ')}
            </div>
          )}
          {perilData.weaknesses && perilData.weaknesses.length > 0 && (
            <div className="truncate">
              <strong className="text-rose-400">Fraquezas:</strong>{' '}
              <span className="text-rose-300 font-semibold">{perilData.weaknesses.join(', ')}</span>
            </div>
          )}
          {perilData.resistances && perilData.resistances.length > 0 && (
            <div className="truncate">
              <strong className="text-cyan-400">Resistências:</strong>{' '}
              <span className="text-cyan-300 font-semibold">{perilData.resistances.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Primary Attack (1 item max for zero scroll) */}
      {canViewAttacks && perilData.attacks && perilData.attacks.length > 0 && (
        <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/60 text-[10px] flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <Swords className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-bold text-zinc-200 truncate">
              {perilData.attacks[0].name}
            </span>
            <span className="text-rose-300 font-semibold truncate">
              ({perilData.attacks[0].damage})
            </span>
          </div>
          <span className="font-mono text-cyan-300 font-bold shrink-0">
            +{perilData.attacks[0].bonus}
          </span>
        </div>
      )}

      {/* Hazard Mechanics (Disable / Routine snippet) */}
      {canViewMechanics && (perilData.disable || perilData.routine) && (
        <div className="p-1.5 rounded-lg bg-[#181124] border border-amber-900/40 text-[10px] text-zinc-300 break-words">
          <strong className="text-amber-300">
            {perilData.disable ? 'Desativação:' : 'Rotina:'}
          </strong>{' '}
          <span>{perilData.disable || perilData.routine}</span>
        </div>
      )}

      {/* Description / Summary */}
      {(canViewDescription || effectiveIsGm) && (peril.summary || perilData.description || peril.content) && (
        <p className="text-[11px] text-zinc-300 leading-relaxed break-words">
          {peril.summary || perilData.description || peril.content}
        </p>
      )}

      {/* Quick Action to open article in drawer */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full py-1.5 px-3 text-xs font-bold text-center rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/80 hover:border-rose-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
      >
        <span>Abrir Ficha no Painel Lateral</span>
        <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
      </button>
    </div>
  );
};

