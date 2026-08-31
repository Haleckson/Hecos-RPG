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
  User,
  Users,
  Shield,
  Heart,
  Eye,
  Award,
  Sparkles,
  Edit3,
  Trash2,
  Lock,
  ArrowRight,
  Folder,
  Zap,
  Swords,
  Compass,
  Quote,
  Coins,
  Smile,
  Tag
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
  isGm = false,
}: {
  pc: Partial<PCAttributes>;
  entity: HecosEntity;
  isGm?: boolean;
}) {
  const items: PCIndexBlockItem[] = [];
  const fieldVis = pc.fieldVisibility || {};

  const isVisible = (fieldKey: string, defaultVis = 'all') => {
    if (isGm) return true;
    const val = fieldVis[fieldKey];
    if (val === undefined || val === null) return defaultVis === 'all';
    if (typeof val === 'boolean') return val;
    return val !== 'gm';
  };

  const playerName = pc.playerName;
  const ancestry = pc.ancestry;
  const heritage = pc.heritage;
  const location = pc.location;
  const organization = pc.organization || pc.faction;
  const occupation = pc.occupation || pc.role;
  const perception = pc.perception ?? entity.statblock?.perception;
  const ac = pc.ac ?? entity.statblock?.ac;
  const hp = pc.hp ?? entity.statblock?.hp;
  const maxHp = pc.maxHp ?? pc.hp ?? entity.statblock?.hp;
  const speed = pc.speed ?? entity.statblock?.speed;
  const heroPoints = pc.heroPoints ?? 0;
  const wealth = pc.wealth;

  // 1. Jogador Responsável
  if (playerName && playerName.trim() && isVisible('playerOwner')) {
    items.push({
      key: 'player',
      label: 'Jogador',
      value: playerName.trim(),
      bgBorderClass: 'bg-sky-950/40 border-sky-800/60 hover:border-sky-500/60',
      labelColorClass: 'text-sky-300',
    });
  }

  // 2. Povo / Ancestralidade
  if (ancestry && ancestry.trim() && isVisible('ancestry')) {
    const ancestryStr = heritage ? `${ancestry} (${heritage})` : ancestry;
    items.push({
      key: 'ancestry',
      label: 'Povo',
      value: ancestryStr.trim(),
      bgBorderClass: 'bg-indigo-950/40 border-indigo-800/60 hover:border-indigo-500/60',
      labelColorClass: 'text-indigo-300',
    });
  }

  // 3. Ofício / Ocupação / Título
  if (occupation && occupation.trim() && isVisible('occupation')) {
    items.push({
      key: 'occupation',
      label: 'Ofício',
      value: occupation.trim(),
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-300',
    });
  }

  // 4. Residência / Local
  if (location && location.trim() && isVisible('location')) {
    items.push({
      key: 'location',
      label: 'Local',
      value: location.trim(),
      bgBorderClass: 'bg-blue-950/40 border-blue-800/60 hover:border-blue-500/60',
      labelColorClass: 'text-blue-300',
    });
  }

  // 5. Facção / Guilda
  if (organization && organization.trim() && isVisible('faction')) {
    items.push({
      key: 'faction',
      label: 'Facção',
      value: organization.trim(),
      bgBorderClass: 'bg-teal-950/40 border-teal-800/60 hover:border-teal-500/60',
      labelColorClass: 'text-teal-300',
    });
  }

  // 6. Percepção
  if (perception !== undefined && perception !== null && isVisible('perceptionAndSenses')) {
    items.push({
      key: 'perception',
      label: 'Percep.',
      value: `+${perception}`,
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-400',
    });
  }

  // 7. Combate / PV & CA
  if (isVisible('combatStats')) {
    const combatParts: string[] = [];
    if (ac !== undefined && isVisible('acAndDefenses')) combatParts.push(`CA ${ac}`);
    if (maxHp !== undefined && isVisible('hpAndHealth')) {
      const hpText = hp !== undefined && hp !== maxHp ? `${hp}/${maxHp} PV` : `${maxHp} PV`;
      combatParts.push(hpText);
    }
    if (speed && isVisible('speed')) combatParts.push(`${typeof speed === 'number' ? `${speed}m` : speed}`);
    if (combatParts.length > 0) {
      items.push({
        key: 'combat',
        label: 'Combate',
        value: combatParts.join(' • '),
        bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
        labelColorClass: 'text-rose-400',
      });
    }
  }

  // 8. Pontos Heroicos
  if (heroPoints > 0 && isVisible('heroPoints')) {
    items.push({
      key: 'heroPoints',
      label: 'Pontos H.',
      value: `${heroPoints} PH`,
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
    });
  }

  // 9. Riqueza
  if (wealth && wealth.trim() && items.length < 6 && isVisible('wealth')) {
    items.push({
      key: 'wealth',
      label: 'Riqueza',
      value: wealth.trim(),
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-800/80 text-[11px] auto-rows-min">
      {items.map((item) => (
        <Tooltip key={item.key} title={item.label} description={item.value} badge="PC">
          <div
            className={`p-1.5 px-2.5 rounded-lg border transition-all flex items-baseline gap-1.5 overflow-hidden shadow-xs ${item.bgBorderClass} cursor-help`}
          >
            <strong className={`font-bold uppercase text-[10px] font-mono tracking-wider shrink-0 ${item.labelColorClass}`}>
              {item.label}:
            </strong>
            <span className="text-zinc-200 break-words font-medium truncate">
              {item.value}
            </span>
          </div>
        </Tooltip>
      ))}
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
  const charClass = pc.characterClass || pc.class || currentEntity.subtitle || 'Aventureiro';
  const size = pc.size || currentEntity.statblock?.size || 'Médio';
  const playerName = pc.playerName;

  // Portrait and Token Images
  const coverImage = currentEntity.coverImage || pc.portraitImage;
  const tokenImage = pc.tokenImage || currentEntity.icon;

  // Field visibility mapping
  const fieldVis = pc.fieldVisibility || {};
  const isFieldVisible = (fieldKey: string, defaultVis = 'all') => {
    if (effectiveIsGm) return true;
    const val = fieldVis[fieldKey];
    if (val === undefined || val === null) return defaultVis === 'all';
    if (typeof val === 'boolean') return val;
    return val !== 'gm';
  };

  // Traits
  const rawTraits = (pc.traits && pc.traits.length > 0)
    ? pc.traits
    : (currentEntity.traits && currentEntity.traits.length > 0)
    ? currentEntity.traits
    : [];
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity: pc.rarity || 'Comum', size });

  const visibleTraits = effectiveIsGm
    ? orderedTraits
    : isFieldVisible('traits')
    ? orderedTraits.filter(t => isFieldVisible(`tag_${t}`))
    : [];

  // Discrete search tags
  const discreteTags = (currentEntity.tags || []).filter(
    (t) => !rawTraits.some((tr) => tr.toLowerCase() === t.toLowerCase())
  );

  // Subcategories / Folders (strictly GM only)
  const subcategories = pc.subcategories || currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);

  // Summarized description
  const summaryText = currentEntity.summary || pc.concept || currentEntity.content?.slice(0, 140) || '';

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
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#080d16] hover:bg-[#0c1422] border ${visStyle.border} ${visStyle.shadow} transition-all duration-200 overflow-hidden h-full shadow-lg`}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* COVER BANNER / PORTRAIT                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-36 sm:h-40 bg-[#0a121e] overflow-hidden border-b border-zinc-800/60 select-none shrink-0">
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
            <Tooltip
              title="Personagem do Jogador"
              description={`${charClass} • Nível ${level}`}
              badge="PC"
            >
              <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md flex items-center gap-1 shadow-md bg-sky-950/90 text-sky-300 border-sky-700/60 cursor-help">
                <Swords className="w-2.5 h-2.5 shrink-0 text-sky-400" />
                <span>{charClass}</span>
              </span>
            </Tooltip>

            {level !== undefined && level !== null && (
              <Tooltip
                title="Nível do Personagem"
                description={`Nível ${level} — Define as estatísticas de combate, magias e graduações.`}
                badge={`Nv ${level}`}
              >
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/85 text-sky-300 border border-sky-800/60 backdrop-blur-md shadow-md cursor-help">
                  Nv {level}
                </span>
              </Tooltip>
            )}

            {playerName && isFieldVisible('playerOwner') && (
              <Tooltip title="Jogador" description={`Controlado por ${playerName}`}>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg border border-sky-800/60 bg-sky-950/80 text-sky-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
                  <User className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[80px]">{playerName}</span>
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
      <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* TOKEN + NOME + SUBTÍTULO */}
          <div className="flex items-start gap-2.5">
            <div
              className="w-11 h-11 rounded-xl bg-[#091526] border border-sky-500/40 flex items-center justify-center text-sky-300 shrink-0 shadow-md mt-0.5 group-hover:border-sky-400 group-hover:scale-105 transition-all overflow-hidden"
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
                <p className="text-[11px] sm:text-xs text-[#93c5fd] font-medium mt-0.5 break-words">
                  {currentEntity.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* TRAÇOS & TAGS DISCRETAS */}
          {(visibleTraits.length > 0 || discreteTags.length > 0) && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {visibleTraits.slice(0, 7).map((t) => (
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
              {visibleTraits.length > 7 && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  +{visibleTraits.length - 7}
                </span>
              )}

              {/* Tags Discretas */}
              {discreteTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900/60 text-zinc-400 border border-zinc-800"
                  title={`Tag: #${tag}`}
                >
                  #{tag}
                </span>
              ))}
              {discreteTags.length > 3 && (
                <span className="text-[9px] font-mono text-zinc-500">
                  +{discreteTags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* BLOCOS DE ÍNDICE INTELIGENTES */}
          <SmartPCCardIndexBlocks pc={pc} entity={currentEntity} isGm={effectiveIsGm} />

          {/* CITAÇÃO / CONCEITO OU RESUMO */}
          {pc.concept && isFieldVisible('concept') ? (
            <div className="p-2.5 rounded-xl bg-sky-950/25 border border-sky-900/40 text-xs text-sky-200/90 italic flex items-start gap-1.5 mt-1">
              <Quote className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5 opacity-80" />
              <p className="line-clamp-2 leading-relaxed">&ldquo;{pc.concept}&rdquo;</p>
            </div>
          ) : summaryText.trim() && isFieldVisible('narrativeLore') ? (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
              {summaryText}
            </p>
          ) : null}
        </div>

        {/* PASTAS / SUBCATEGORIAS (EXCLUSIVO GM) */}
        {effectiveIsGm && subcategories.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            {subcategories.map((sub) => (
              <Tooltip key={sub} content={`Pasta: ${sub} (Exclusivo GM)`}>
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

