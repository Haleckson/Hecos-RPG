import React, { useState, useEffect } from 'react';
import { HecosEntity, PCAttributes } from '../types';
import { EntityIcon } from './EntityIcon';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { Tooltip } from './Tooltip';
import { HecosStorage } from '../services/storage';
import { getCardVisibilityClasses } from '../utils/cardVisibility';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Users,
  Shield,
  Heart,
  Eye,
  Award,
  Sparkles,
  Edit3,
  Trash2,
  Lock,
  User,
  ArrowRight,
  Folder,
  Zap,
  Swords,
  Compass
} from 'lucide-react';

interface PCCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGmMode?: boolean;
  isGm?: boolean;
}

interface PCIndexBlockItem {
  key: string;
  label: string;
  value: string;
  bgBorderClass: string;
  labelColorClass: string;
  isWide?: boolean;
}

function SmartPCCardIndexBlocks({
  pc,
  entity,
}: {
  pc?: Partial<PCAttributes>;
  entity: HecosEntity;
}) {
  const items: PCIndexBlockItem[] = [];

  const maxHp = pc?.maxHp ?? pc?.hp ?? entity.statblock?.hp;
  const currentHp = pc?.hp;
  const ac = pc?.ac ?? entity.statblock?.ac;
  const heroPoints = pc?.heroPoints ?? 0;
  const perception = pc?.perception ?? entity.statblock?.perception;
  const speed = pc?.speed ?? entity.statblock?.speed;
  const ancestry = pc?.ancestry;
  const heritage = pc?.heritage;
  const playerName = pc?.playerName;

  // 1. Povo / Linhagem
  if (ancestry && ancestry.trim()) {
    const ancestryStr = heritage ? `${ancestry} (${heritage})` : ancestry;
    items.push({
      key: 'ancestry',
      label: 'Povo',
      value: ancestryStr.trim(),
      bgBorderClass: 'bg-indigo-950/40 border-indigo-800/60 hover:border-indigo-500/60',
      labelColorClass: 'text-indigo-300',
      isWide: ancestryStr.length > 18,
    });
  }

  // 2. PV (Pontos de Vida)
  if (maxHp !== undefined && maxHp !== null) {
    const hpStr = (currentHp !== undefined && pc?.maxHp !== undefined && currentHp !== maxHp)
      ? `${currentHp}/${maxHp} PV`
      : `${maxHp} PV`;
    items.push({
      key: 'hp',
      label: 'PV',
      value: hpStr,
      bgBorderClass: 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/60',
      labelColorClass: 'text-emerald-400',
    });
  }

  // 3. CA (Classe de Armadura)
  if (ac !== undefined && ac !== null) {
    items.push({
      key: 'ac',
      label: 'CA',
      value: `${ac}`,
      bgBorderClass: 'bg-sky-950/40 border-sky-800/60 hover:border-sky-500/60',
      labelColorClass: 'text-sky-400',
    });
  }

  // 4. Percepção
  if (perception !== undefined && perception !== null) {
    items.push({
      key: 'perception',
      label: 'Percep.',
      value: `+${perception}`,
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-400',
    });
  }

  // 5. Pontos Heroicos
  if (heroPoints > 0) {
    items.push({
      key: 'heroPoints',
      label: 'Pontos H.',
      value: `${heroPoints} PH`,
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
    });
  }

  // 6. Deslocamento
  if (speed) {
    items.push({
      key: 'speed',
      label: 'Desloc.',
      value: typeof speed === 'number' ? `${speed}m` : String(speed),
      bgBorderClass: 'bg-blue-950/40 border-blue-800/60 hover:border-blue-500/60',
      labelColorClass: 'text-blue-400',
    });
  }

  // 7. Jogador
  if (playerName && playerName.trim()) {
    items.push({
      key: 'player',
      label: 'Jogador',
      value: playerName.trim(),
      bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
      labelColorClass: 'text-purple-300',
      isWide: true,
    });
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

export const PCCard: React.FC<PCCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGmMode,
  isGm = false,
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

  const pc: Partial<PCAttributes> = currentEntity.pcData || {};
  const visStyle = getCardVisibilityClasses(currentEntity.visibility, currentEntity.isSecret);

  const level = pc.level ?? currentEntity.statblock?.level ?? 1;
  const charClass = pc.characterClass || currentEntity.subtitle || 'Aventureiro';
  const playerName = pc.playerName;

  // Portrait and Token Images
  const coverImage = currentEntity.coverImage || pc.portraitImage;
  const tokenImage = pc.tokenImage || currentEntity.icon;

  // Traits
  const rawTraits = (pc.traits && pc.traits.length > 0)
    ? pc.traits
    : (currentEntity.traits && currentEntity.traits.length > 0)
    ? currentEntity.traits
    : (currentEntity.tags || []);
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity: 'Comum' });

  // Subcategories / Folders
  const subcategories = currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);

  // Summarized description
  const summaryText = currentEntity.summary || currentEntity.content?.slice(0, 140) || '';

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
      id={`pc-card-${currentEntity.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#080d16] hover:bg-[#0c1422] border ${visStyle.border} ${visStyle.shadow} transition-all duration-200 overflow-hidden h-full min-h-[460px] shadow-lg`}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* COVER BANNER / PORTRAIT                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-40 sm:h-44 bg-[#0a121e] overflow-hidden border-b border-zinc-800/60 select-none shrink-0">
        {coverImage ? (
          <AdjustableImage
            src={coverImage}
            alt={currentEntity.title || 'PC'}
            imageKey={`pc-cover-${currentEntity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#080d16]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0c233c] via-[#091526] to-[#040810] flex items-center justify-center p-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400/60 group-hover:text-sky-300 group-hover:scale-105 transition-all overflow-hidden">
              <Users className="w-7 h-7" />
            </div>
          </div>
        )}

        {/* Gradiente de Fusão Inferior */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#080d16] to-transparent pointer-events-none" />

        {/* Top Badges & GM Controls */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
            <Tooltip content={`${charClass} • Nível ${level}`}>
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md flex items-center gap-1 shadow-md bg-sky-950/90 text-sky-300 border-sky-700/60 cursor-help">
                <Swords className="w-2.5 h-2.5 shrink-0 text-sky-400" />
                <span>{charClass}</span>
              </span>
            </Tooltip>

            <Tooltip content={`Nível do Personagem: ${level}`}>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/85 text-sky-300 border border-sky-800/60 backdrop-blur-md shadow-md cursor-help">
                Nv {level}
              </span>
            </Tooltip>

            {playerName && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg border border-purple-800/60 bg-purple-950/80 text-purple-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
                <User className="w-2.5 h-2.5" />
                <span className="truncate max-w-[80px]">{playerName}</span>
              </span>
            )}
          </div>

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
                <Tooltip content="Editar Personagem">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(currentEntity.id);
                    }}
                    className="p-1 rounded-lg hover:bg-sky-950 text-zinc-400 hover:text-sky-300 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              )}

              {onDelete && (
                <Tooltip content="Excluir Personagem">
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
      {/* CARD BODY                                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* TOKEN + NOME + SUBTÍTULO */}
          <div className="flex items-start gap-2.5">
            <div
              className="w-10 h-10 rounded-xl bg-[#091526] border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0 shadow-md mt-0.5 group-hover:border-sky-400 group-hover:scale-105 transition-all overflow-hidden"
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
                  category="pc"
                  className="w-5 h-5"
                  imageClassName="w-full h-full object-cover rounded-xl"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={handleOpenInDrawer}
                className="text-left w-full group/title focus:outline-none cursor-pointer block transition-all"
                title={`Abrir ${currentEntity.title}`}
              >
                <h3 className="text-base sm:text-lg font-black text-zinc-100 group-hover/title:text-sky-300 font-serif group-hover/title:drop-shadow-[0_0_15px_rgba(56,189,248,0.9)] flex items-center gap-1.5 leading-snug break-words transition-all">
                  <span className="group-hover/title:underline decoration-sky-500 decoration-2 underline-offset-2">
                    {currentEntity.title || 'Sem Nome'}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/title:opacity-100 text-sky-400 group-hover/title:translate-x-0.5 transition-all shrink-0 ml-auto" />
                </h3>
              </button>

              {currentEntity.subtitle && (
                <p className="text-[11px] text-[#93c5fd] font-medium mt-0.5 break-words">
                  {currentEntity.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* TRAITS */}
          {orderedTraits.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {orderedTraits.slice(0, 5).map((t) => (
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

          {/* BLOCOS DE ÍNDICE INTELIGENTES */}
          <SmartPCCardIndexBlocks pc={pc} entity={currentEntity} />

          {/* RESUMO / TEXTO */}
          {summaryText.trim() && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
              {summaryText}
            </p>
          )}
        </div>

        {/* PASTAS / SUBCATEGORIAS */}
        {subcategories.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            {subcategories.map((sub) => (
              <Tooltip key={sub} content={`Pasta: ${sub}`}>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-950/40 text-sky-300 border border-sky-900/40 flex items-center gap-1 cursor-help">
                  <Folder className="w-2.5 h-2.5 text-sky-400" />
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
