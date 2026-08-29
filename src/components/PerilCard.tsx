import React, { useState, useEffect } from 'react';
import { HecosEntity, PerilAttributes } from '../types';
import { EntityIcon } from './EntityIcon';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { Tooltip } from './Tooltip';
import { PerilTooltipCard } from './PerilTooltipCard';
import { HecosStorage } from '../services/storage';
import { getCardVisibilityClasses } from '../utils/cardVisibility';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Skull,
  AlertTriangle,
  Flame,
  Ghost,
  Shield,
  Heart,
  Eye,
  Zap,
  Trash2,
  Edit3,
  ArrowRight,
  Folder
} from 'lucide-react';

interface PerilCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGmMode?: boolean;
  isGm?: boolean;
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

// ═══════════════════════════════════════════════════════════════════════════
// Intelligent, Adaptive Index Blocks for Peril Cards with Zero Wasted Space
// Dynamically tailored to perilKind: Monster, Simple, Complex, Environmental, Haunt
// ═══════════════════════════════════════════════════════════════════════════
interface PerilIndexBlockItem {
  key: string;
  label: string;
  value: string;
  bgBorderClass: string;
  labelColorClass: string;
  isWide?: boolean;
}

function SmartPerilCardIndexBlocks({
  peril,
  data,
  canViewHp,
  canViewAc,
  canViewPerception,
  canViewSaves,
  canViewSpeed,
  canViewDisable,
  canViewHardness,
  canViewWeaknesses,
  canViewActions
}: {
  peril: HecosEntity;
  data: Partial<PerilAttributes>;
  canViewHp: boolean;
  canViewAc: boolean;
  canViewPerception: boolean;
  canViewSaves: boolean;
  canViewSpeed: boolean;
  canViewDisable: boolean;
  canViewHardness: boolean;
  canViewWeaknesses: boolean;
  canViewActions: boolean;
}) {
  const items: PerilIndexBlockItem[] = [];
  const kind = data.perilKind || (peril.category === 'creature' ? 'monster' : 'hazard_simple');

  if (kind === 'monster') {
    // ────────────── MONSTER / CREATURE INDEX ──────────────
    // 1. HP / PV
    if (canViewHp) {
      const hp = data.hp ?? peril.statblock?.hp;
      if (hp !== undefined && hp !== null) {
        items.push({
          key: 'hp',
          label: 'PV',
          value: `${hp} PV`,
          bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
          labelColorClass: 'text-rose-400',
        });
      }
    }

    // 2. CA
    if (canViewAc) {
      const ac = data.ac ?? peril.statblock?.ac;
      if (ac !== undefined && ac !== null) {
        items.push({
          key: 'ac',
          label: 'CA',
          value: `${ac}`,
          bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
          labelColorClass: 'text-rose-400',
        });
      }
    }

    // 3. Percepção
    if (canViewPerception) {
      const perception = data.perception;
      if (perception !== undefined && perception !== null) {
        items.push({
          key: 'perception',
          label: 'Percep.',
          value: `+${perception}${data.senses ? ` (${data.senses})` : ''}`,
          bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
          labelColorClass: 'text-cyan-400',
          isWide: Boolean(data.senses && data.senses.length > 12),
        });
      }
    }

    // 4. Saves
    if (canViewSaves) {
      const fort = data.fort;
      const ref = data.ref;
      const will = data.will;
      if (fort !== undefined || ref !== undefined || will !== undefined) {
        const savesText = [
          fort !== undefined ? `Fort +${fort}` : null,
          ref !== undefined ? `Ref +${ref}` : null,
          will !== undefined ? `Vont +${will}` : null,
        ].filter(Boolean).join(' • ');

        items.push({
          key: 'saves',
          label: 'Saves',
          value: savesText,
          bgBorderClass: 'bg-indigo-950/40 border-indigo-800/60 hover:border-indigo-500/60',
          labelColorClass: 'text-indigo-400',
          isWide: true,
        });
      }
    }

    // 5. Deslocamento
    if (canViewSpeed) {
      const speed = data.speed ?? peril.statblock?.speed;
      if (speed && speed.trim()) {
        items.push({
          key: 'speed',
          label: 'Desloc.',
          value: speed.trim(),
          bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
          labelColorClass: 'text-amber-400',
          isWide: speed.length > 16,
        });
      }
    }
  } else if (kind === 'hazard_simple') {
    // ────────────── SIMPLE HAZARD INDEX ──────────────
    // 1. Furtividade / Detecção
    if (canViewPerception) {
      const stealth = data.stealthCheck;
      const perception = data.perception;
      if (stealth && stealth.trim()) {
        items.push({
          key: 'stealth',
          label: 'Furtividade',
          value: stealth.trim(),
          bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
          labelColorClass: 'text-cyan-400',
          isWide: stealth.length > 16,
        });
      } else if (perception !== undefined && perception !== null) {
        items.push({
          key: 'stealth',
          label: 'Detecção',
          value: `CD ${perception + 10} (+${perception})`,
          bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
          labelColorClass: 'text-cyan-400',
        });
      }
    }

    // 2. Desativação
    if (canViewDisable) {
      const disable = data.disable;
      if (disable && disable.trim()) {
        items.push({
          key: 'disable',
          label: 'Desativação',
          value: disable.trim(),
          bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
          labelColorClass: 'text-amber-400',
          isWide: true,
        });
      }
    }

    // 3. Dureza / Defesa
    if (canViewHardness || canViewHp) {
      const hardness = data.hardness;
      const hp = data.hp;
      const ac = data.ac;
      const defParts: string[] = [];
      if (hardness !== undefined && hardness !== null) {
        defParts.push(`Dureza ${hardness}${data.brokenThreshold ? ` (LT ${data.brokenThreshold})` : ''}`);
      }
      if (hp !== undefined && hp !== null) {
        defParts.push(`${hp} PV`);
      }
      if (ac !== undefined && ac !== null) {
        defParts.push(`CA ${ac}`);
      }
      if (defParts.length > 0) {
        items.push({
          key: 'defenses',
          label: 'Defesa',
          value: defParts.join(' • '),
          bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
          labelColorClass: 'text-rose-400',
          isWide: defParts.join(' • ').length > 18,
        });
      }
    }

    // 4. Gatilho / Reação
    if (canViewActions) {
      const trigger = data.actions?.find((a) => a.cost === 'reaction' || a.trigger)?.trigger || data.actions?.[0]?.name;
      if (trigger && trigger.trim()) {
        items.push({
          key: 'trigger',
          label: 'Gatilho',
          value: trigger.trim(),
          bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
          labelColorClass: 'text-purple-300',
          isWide: true,
        });
      }
    }

    // 5. Reset
    if (canViewDisable && data.reset && data.reset.trim()) {
      items.push({
        key: 'reset',
        label: 'Reset',
        value: data.reset.trim(),
        bgBorderClass: 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-500/60',
        labelColorClass: 'text-zinc-400',
      });
    }
  } else if (kind === 'hazard_complex') {
    // ────────────── COMPLEX HAZARD INDEX ──────────────
    // 1. Iniciativa / Furtividade
    if (canViewPerception) {
      const stealth = data.stealthCheck;
      if (stealth && stealth.trim()) {
        items.push({
          key: 'stealth',
          label: 'Iniciativa',
          value: stealth.trim(),
          bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
          labelColorClass: 'text-cyan-400',
        });
      }
    }

    // 2. Desativação
    if (canViewDisable) {
      const disable = data.disable;
      if (disable && disable.trim()) {
        items.push({
          key: 'disable',
          label: 'Desativação',
          value: disable.trim(),
          bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
          labelColorClass: 'text-amber-400',
          isWide: true,
        });
      }
    }

    // 3. Defesas Estruturais
    if (canViewAc || canViewHardness || canViewHp) {
      const defParts: string[] = [];
      if (data.ac !== undefined && data.ac !== null) defParts.push(`CA ${data.ac}`);
      if (data.hardness !== undefined && data.hardness !== null) defParts.push(`Dureza ${data.hardness}`);
      if (data.hp !== undefined && data.hp !== null) defParts.push(`${data.hp} PV`);
      if (defParts.length > 0) {
        items.push({
          key: 'defenses',
          label: 'Defesas',
          value: defParts.join(' • '),
          bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
          labelColorClass: 'text-rose-400',
          isWide: defParts.join(' • ').length > 18,
        });
      }
    }

    // 4. Rotina
    if (canViewActions) {
      const routine = data.routine || (data.actions?.[0]?.name ? `${data.actions[0].name}` : '');
      if (routine && routine.trim()) {
        items.push({
          key: 'routine',
          label: 'Rotina',
          value: routine.trim(),
          bgBorderClass: 'bg-orange-950/40 border-orange-800/60 hover:border-orange-500/60',
          labelColorClass: 'text-orange-400',
          isWide: true,
        });
      }
    }

    // 5. Saves (se houver)
    if (canViewSaves && (data.fort !== undefined || data.ref !== undefined)) {
      const saves = [
        data.fort !== undefined ? `Fort +${data.fort}` : null,
        data.ref !== undefined ? `Ref +${data.ref}` : null,
      ].filter(Boolean).join(' • ');
      if (saves) {
        items.push({
          key: 'saves',
          label: 'Saves',
          value: saves,
          bgBorderClass: 'bg-indigo-950/40 border-indigo-800/60 hover:border-indigo-500/60',
          labelColorClass: 'text-indigo-400',
        });
      }
    }

    // 6. Reset
    if (canViewDisable && data.reset && data.reset.trim()) {
      items.push({
        key: 'reset',
        label: 'Reset',
        value: data.reset.trim(),
        bgBorderClass: 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-500/60',
        labelColorClass: 'text-zinc-400',
      });
    }
  } else if (kind === 'environmental') {
    // ────────────── ENVIRONMENTAL HAZARD INDEX ──────────────
    // 1. Detecção
    if (canViewPerception) {
      const stealth = data.stealthCheck;
      if (stealth && stealth.trim()) {
        items.push({
          key: 'stealth',
          label: 'Detecção',
          value: stealth.trim(),
          bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
          labelColorClass: 'text-cyan-400',
        });
      }
    }

    // 2. Superação
    if (canViewDisable) {
      const disable = data.disable;
      if (disable && disable.trim()) {
        items.push({
          key: 'disable',
          label: 'Superação',
          value: disable.trim(),
          bgBorderClass: 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/60',
          labelColorClass: 'text-emerald-400',
          isWide: true,
        });
      }
    }

    // 3. Efeito / Gatilho
    if (canViewActions) {
      const effect = data.actions?.[0]?.effect || data.attacks?.[0]?.damage;
      if (effect && effect.trim()) {
        items.push({
          key: 'effect',
          label: 'Efeito',
          value: effect.trim(),
          bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
          labelColorClass: 'text-amber-400',
          isWide: true,
        });
      }
    }

    // 4. Resistências / Dureza
    if ((canViewHardness || canViewWeaknesses) && (data.resistances?.length || data.hardness !== undefined)) {
      const resVal = data.resistances?.length ? data.resistances.join(', ') : `Dureza ${data.hardness}`;
      items.push({
        key: 'res',
        label: 'Resist.',
        value: resVal,
        bgBorderClass: 'bg-teal-950/40 border-teal-800/60 hover:border-teal-500/60',
        labelColorClass: 'text-teal-400',
      });
    }

    // 5. Ciclo / Duração
    if (canViewDisable && data.reset && data.reset.trim()) {
      items.push({
        key: 'reset',
        label: 'Ciclo',
        value: data.reset.trim(),
        bgBorderClass: 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-500/60',
        labelColorClass: 'text-zinc-400',
      });
    }
  } else if (kind === 'haunt') {
    // ────────────── HAUNT / ASSOMBRAÇÃO INDEX ──────────────
    // 1. Furtividade
    if (canViewPerception) {
      const stealth = data.stealthCheck;
      if (stealth && stealth.trim()) {
        items.push({
          key: 'stealth',
          label: 'Furtividade',
          value: stealth.trim(),
          bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
          labelColorClass: 'text-purple-300',
        });
      }
    }

    // 2. Exorcismo / Desativação
    if (canViewDisable) {
      const disable = data.disable;
      if (disable && disable.trim()) {
        items.push({
          key: 'disable',
          label: 'Exorcismo',
          value: disable.trim(),
          bgBorderClass: 'bg-indigo-950/40 border-indigo-800/60 hover:border-indigo-500/60',
          labelColorClass: 'text-indigo-300',
          isWide: true,
        });
      }
    }

    // 3. Fraquezas
    if (canViewWeaknesses && data.weaknesses && data.weaknesses.length > 0) {
      items.push({
        key: 'weaknesses',
        label: 'Fraquezas',
        value: data.weaknesses.join(', '),
        bgBorderClass: 'bg-fuchsia-950/40 border-fuchsia-800/60 hover:border-fuchsia-500/60',
        labelColorClass: 'text-fuchsia-300',
        isWide: true,
      });
    }

    // 4. Manifestação / Defesas
    if (canViewHp || canViewHardness) {
      const parts: string[] = [];
      if (data.hp !== undefined && data.hp !== null) parts.push(`${data.hp} PV`);
      if (data.hardness !== undefined && data.hardness !== null) parts.push(`Dureza ${data.hardness}`);
      if (data.ac !== undefined && data.ac !== null) parts.push(`CA ${data.ac}`);
      if (parts.length > 0) {
        items.push({
          key: 'spirit',
          label: 'Espírito',
          value: parts.join(' • '),
          bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
          labelColorClass: 'text-rose-400',
        });
      }
    }

    // 5. Gatilho
    if (canViewActions) {
      const trigger = data.actions?.find((a) => a.cost === 'reaction' || a.trigger)?.trigger || data.actions?.[0]?.name;
      if (trigger && trigger.trim()) {
        items.push({
          key: 'trigger',
          label: 'Gatilho',
          value: trigger.trim(),
          bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
          labelColorClass: 'text-amber-400',
          isWide: true,
        });
      }
    }

    // 6. Reset
    if (canViewDisable && data.reset && data.reset.trim()) {
      items.push({
        key: 'reset',
        label: 'Retorno',
        value: data.reset.trim(),
        bgBorderClass: 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-500/60',
        labelColorClass: 'text-zinc-400',
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800/80 text-[11px] auto-rows-min">
      {items.map((item, idx) => {
        const isLastOdd = items.length % 2 === 1 && idx === items.length - 1;
        const colSpanClass = items.length === 1 || item.isWide || isLastOdd ? 'col-span-1 sm:col-span-2' : 'col-span-1';

        return (
          <div
            key={item.key}
            className={`p-1.5 px-2.5 rounded-lg border transition-all flex items-baseline gap-1.5 overflow-hidden shadow-xs ${item.bgBorderClass} ${colSpanClass}`}
          >
            <strong className={`font-bold uppercase text-[10px] font-mono tracking-wider shrink-0 ${item.labelColorClass}`}>
              {item.label}:
            </strong>
            <span className="text-zinc-200 break-words font-medium truncate sm:whitespace-normal" title={item.value}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const PerilCard: React.FC<PerilCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGmMode,
  isGm
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Subscribe to reactive entity updates
  useEffect(() => {
    const unsub = HecosStorage.subscribeEntities((entities) => {
      const updated = entities.find((e) => e.id === entity.id);
      if (updated) {
        setCurrentEntity(updated);
      }
    });
    return unsub;
  }, [entity.id]);

  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || isGmMode || currentUser?.role === 'gm' || HecosStorage.isUserGm();

  const perilData: Partial<PerilAttributes> = currentEntity.perilData || {};
  const fieldVis = perilData.fieldVisibility;

  // Helper to check granular field visibility
  const isFieldVisible = (fieldKey: keyof import('../types').PerilFieldVisibility): boolean => {
    if (effectiveIsGm) return true;
    if (!fieldVis) {
      // Legacy entities without fieldVisibility default to public if entity is accessible
      return true;
    }
    const vis = fieldVis[fieldKey];
    if (!vis) {
      // If field not specified in visibility matrix:
      if (['name', 'level', 'typeAndTraits', 'description'].includes(fieldKey)) {
        return true;
      }
      return false;
    }
    if (vis === 'all') return true;
    if (vis === 'custom' && currentUser) {
      const allowed = fieldVis.allowedUsers?.[fieldKey] || [];
      return allowed.includes(currentUser.id);
    }
    return false;
  };

  // Card Revelation Condition:
  // Must have base entity access AND the name must be revealed.
  // If not even the name is revealed, the card does NOT appear.
  const hasEntityAccess = effectiveIsGm || HecosStorage.canUserAccess(currentEntity.visibility, currentEntity.allowedUserIds, currentUser);
  const isNameRevealed = effectiveIsGm || (hasEntityAccess && isFieldVisible('name'));

  if (!isNameRevealed) {
    return null;
  }

  // Permissions for individual components
  const canViewLevel = isFieldVisible('level');
  const canViewTraits = isFieldVisible('typeAndTraits');
  const canViewDescription = isFieldVisible('description');
  const canViewHp = isFieldVisible('hpAndHealth') || isFieldVisible('hardnessAndBT');
  const canViewAc = isFieldVisible('acAndDefenses');
  const canViewPerception = isFieldVisible('sensesAndPerception');
  const canViewSaves = isFieldVisible('acAndDefenses');
  const canViewSpeed = isFieldVisible('actionsAndAbilities') || isFieldVisible('acAndDefenses');
  const canViewDisable = isFieldVisible('disableAndReset');
  const canViewHardness = isFieldVisible('hardnessAndBT');
  const canViewWeaknesses = isFieldVisible('weaknessesAndResistances');
  const canViewActions = isFieldVisible('actionsAndAbilities');

  const kind = perilData.perilKind || (currentEntity.category === 'creature' ? 'monster' : 'hazard_simple');
  const isMonster = kind === 'monster';
  const level = perilData.level ?? currentEntity.statblock?.level ?? 1;
  const rarity = perilData.rarity || currentEntity.statblock?.rarity || 'Comum';
  const size = isMonster ? (perilData.size || currentEntity.statblock?.size || 'Médio') : (perilData.size || undefined);

  // Portrait and Token Images (masked if description/visuals are private)
  const coverImage = (canViewDescription || effectiveIsGm) ? (currentEntity.coverImage || perilData.portraitImage) : undefined;
  const tokenImage = currentEntity.icon || perilData.tokenImage;

  // Visibility classes
  const visStyle = getCardVisibilityClasses(currentEntity.visibility, currentEntity.isSecret);

  // Traits - strictly show Rarity, Size (when monster/specified), and genuine custom traits chosen
  const rawTraits = (perilData.traits && perilData.traits.length > 0)
    ? perilData.traits
    : (currentEntity.statblock?.traits && currentEntity.statblock.traits.length > 0)
    ? currentEntity.statblock.traits
    : [];
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity, size });

  // Folders
  const subcategories = perilData.subcategories || currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);

  // Summarized description text
  const summaryText = currentEntity.summary || perilData.description || '';

  const kindBadge = getKindBadge(kind);
  const KindIcon = kindBadge.icon;

  // Open in Lateral Drawer first as requested
  const handleOpenInDrawer = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    window.dispatchEvent(
      new CustomEvent('hecos:open-entity-drawer', {
        detail: { entityId: currentEntity.id, slug: currentEntity.slug }
      })
    );
  };

  return (
    <div
      id={`peril-card-${currentEntity.id}`}
      onClick={handleOpenInDrawer}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#0e0a17] hover:bg-[#140e22] border ${visStyle.border} ${visStyle.shadow} transition-all duration-200 overflow-hidden h-full min-h-[460px] shadow-lg cursor-pointer`}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* RETRATO COMO COVER DO CARD (Igual aos cards de Ancestralidade)               */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-40 sm:h-44 bg-[#18112b] overflow-hidden border-b border-zinc-800/60 select-none shrink-0">
        {coverImage ? (
          <AdjustableImage
            src={coverImage}
            alt={currentEntity.title || 'Perigo'}
            imageKey={`peril-card-${currentEntity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#0c0915]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#200e1f] via-[#120a1c] to-[#0a0714] flex items-center justify-center p-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/30 border border-rose-800/30 flex items-center justify-center text-rose-400/50 group-hover:text-rose-300 group-hover:scale-105 transition-all overflow-hidden">
              <KindIcon className="w-7 h-7" />
            </div>
          </div>
        )}

        {/* Gradiente de Fusão Inferior */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0e0a17] to-transparent pointer-events-none" />

        {/* Top Badges & GM Controls */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {(canViewTraits || effectiveIsGm) && (
              <Tooltip content={`${kindBadge.label} • Nível ${level}`}>
                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md flex items-center gap-1 shadow-md ${kindBadge.bg} cursor-help`}>
                  <KindIcon className="w-2.5 h-2.5 shrink-0" />
                  <span>{kindBadge.label}</span>
                </span>
              </Tooltip>
            )}
            {(canViewLevel || effectiveIsGm) && (
              <Tooltip content={`Nível de Ameaça: ${level}`}>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/85 text-rose-300 border border-rose-800/60 backdrop-blur-md shadow-md cursor-help">
                  Nv {level}
                </span>
              </Tooltip>
            )}
          </div>

          {/* GM Action Buttons on Hover */}
          {effectiveIsGm && (
            <div
              className="flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-xl border border-zinc-700/80 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <VisibilityBadgeMenu
                visibility={currentEntity.visibility}
                allowedUserIds={currentEntity.allowedUserIds}
                isSecret={currentEntity.isSecret}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityVisibility(currentEntity.id, newVis, newAllowed);
                }}
              />

              {onEdit && (
                <Tooltip content="Editar Perigo">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(currentEntity.id);
                    }}
                    className="p-1 rounded-lg hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}

              {onDelete && (
                <Tooltip content="Excluir Perigo">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(currentEntity.id);
                    }}
                    className="p-1 rounded-lg hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO DO CARD (Token como Ícone, Título, Traços e Blocos Inteligentes)     */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* TOKEN + NOME + SUBTÍTULO COM TOOLTIP FLUTUANTE ZERO SCROLL */}
          <div className="flex items-start gap-2.5">
            <Tooltip
              content={<PerilTooltipCard peril={currentEntity} onSelectEntity={() => handleOpenInDrawer()} />}
              delay={200}
              placement="right"
            >
              <div
                onClick={handleOpenInDrawer}
                className="w-10 h-10 rounded-xl bg-[#1b1228] border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0 shadow-md mt-0.5 group-hover:border-rose-400 group-hover:scale-105 transition-all overflow-hidden cursor-pointer"
              >
                {tokenImage && (tokenImage.startsWith('http') || tokenImage.startsWith('data:')) ? (
                  <img
                    src={tokenImage}
                    alt={currentEntity.title || 'Token'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <EntityIcon
                    icon={tokenImage || currentEntity.icon}
                    category="peril"
                    className="w-5 h-5"
                    imageClassName="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>
            </Tooltip>

            <div className="min-w-0 flex-1">
              <Tooltip
                content={<PerilTooltipCard peril={currentEntity} onSelectEntity={() => handleOpenInDrawer()} />}
                delay={200}
                side="right"
                className="w-full"
              >
                <div className="text-left w-full group/title focus:outline-none cursor-pointer block transition-all">
                  <h3 className="text-base sm:text-lg font-black text-zinc-100 group-hover/title:text-rose-300 font-serif group-hover/title:drop-shadow-[0_0_15px_rgba(244,63,94,0.9)] flex items-center gap-1.5 leading-snug break-words transition-all">
                    <span className="group-hover/title:underline decoration-rose-500 decoration-2 underline-offset-2">
                      {currentEntity.title || 'Sem Título'}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover/title:opacity-100 text-rose-400 group-hover/title:translate-x-0.5 transition-all shrink-0 ml-auto" />
                  </h3>
                </div>
              </Tooltip>

              {(canViewDescription || canViewTraits || effectiveIsGm) && currentEntity.subtitle && (
                <p className="text-[11px] text-[#cca1b8] font-medium mt-0.5 break-words">
                  {currentEntity.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* TRAÇOS (Hierárquicos: Raridade -> Tradição -> Tamanho -> Outros) */}
          {(canViewTraits || effectiveIsGm) && orderedTraits.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
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

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* BLOCOS DE ÍNDICE INTELIGENTES E ADAPTATIVOS POR CATEGORIA DE PERIGO    */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <SmartPerilCardIndexBlocks
            peril={currentEntity}
            data={perilData}
            canViewHp={canViewHp}
            canViewAc={canViewAc}
            canViewPerception={canViewPerception}
            canViewSaves={canViewSaves}
            canViewSpeed={canViewSpeed}
            canViewDisable={canViewDisable}
            canViewHardness={canViewHardness}
            canViewWeaknesses={canViewWeaknesses}
            canViewActions={canViewActions}
          />

          {/* RESUMO / TEXTO RESUMIDO DA DESCRIÇÃO DO PERIGO */}
          {(canViewDescription || effectiveIsGm) && summaryText.trim() && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
              {summaryText}
            </p>
          )}
        </div>

        {/* PASTAS / SUBCATEGORIAS */}
        {(canViewTraits || effectiveIsGm) && subcategories.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            {subcategories.map((sub) => (
              <Tooltip key={sub} content={`Pasta: ${sub}`}>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-300 border border-rose-900/40 flex items-center gap-1 cursor-help">
                  <Folder className="w-2.5 h-2.5 text-rose-400" />
                  <span>{sub}</span>
                </span>
              </Tooltip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
