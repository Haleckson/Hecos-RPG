import React from 'react';
import {
  HecosEntity,
  PF2eFeatAttributes,
  FeatCategoryType,
  FeatActionCost,
  FeatRarity,
} from '../types';
import { parseFeatFromContent, getFeatTypeLabel } from '../utils/featSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { Tooltip } from './Tooltip';
import { RichContentRenderer } from './RichContentRenderer';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Folder,
  FolderPlus,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';

export interface FeatCardProps {
  entity?: HecosEntity;
  featData?: PF2eFeatAttributes;
  // Fallbacks for standalone / imported feats (like Ancestry feats)
  id?: string;
  title?: string;
  subtitle?: string;
  level?: number;
  featType?: FeatCategoryType;
  subcategories?: string[];
  rarity?: FeatRarity | string;
  traits?: string[];
  actionCost?: FeatActionCost | string;
  prerequisites?: string;
  requirements?: string;
  trigger?: string;
  frequency?: string;
  description?: string;
  criticalSuccess?: string;
  success?: string;
  failure?: string;
  criticalFailure?: string;
  special?: string;
  visibility?: any;
  allowedUserIds?: string[];
  isSecret?: boolean;
  // Callbacks
  onSelectEntity?: (id: string) => void;
  onEditEntity?: (id: string) => void;
  onDeleteEntity?: (id: string) => void;
  onOpenFolderAssign?: (entity: HecosEntity) => void;
  onSelectSubcategory?: (subcat: string) => void;
  isGmMode?: boolean;
  className?: string;
}

export const getActionGlyphProp = (cost?: string): { type: ActionGlyphType; show: boolean } => {
  switch (cost) {
    case '1':
      return { type: '1-action', show: true };
    case '2':
      return { type: '2-actions', show: true };
    case '3':
      return { type: '3-actions', show: true };
    case 'free':
      return { type: 'free-action', show: true };
    case 'reaction':
      return { type: 'reaction', show: true };
    case '1-to-2':
      return { type: '1-to-2-actions', show: true };
    case '1-to-3':
      return { type: '1-to-3-actions', show: true };
    default:
      return { type: '1-action', show: false };
  }
};

// Intelligent, Compact Index Blocks for Feat Cards with Zero Wasted Space
export interface FeatIndexBlockItem {
  key: string;
  label: string;
  value: string;
  bgBorderClass: string;
  labelColorClass: string;
  isWide?: boolean;
}

export function SmartFeatCardIndexBlocks({
  prerequisites,
  requirements,
  trigger,
  frequency,
  cost,
  access,
}: {
  prerequisites?: string;
  requirements?: string;
  trigger?: string;
  frequency?: string;
  cost?: string;
  access?: string;
}) {
  const items: FeatIndexBlockItem[] = [];

  if (prerequisites && prerequisites.trim()) {
    const val = prerequisites.trim();
    items.push({
      key: 'prerequisites',
      label: 'Pré-req',
      value: val,
      bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
      labelColorClass: 'text-purple-400',
      isWide: val.length > 24,
    });
  }

  if (requirements && requirements.trim()) {
    const val = requirements.trim();
    items.push({
      key: 'requirements',
      label: 'Requisitos',
      value: val,
      bgBorderClass: 'bg-blue-950/40 border-blue-800/60 hover:border-blue-500/60',
      labelColorClass: 'text-blue-400',
      isWide: val.length > 24,
    });
  }

  if (trigger && trigger.trim()) {
    const val = trigger.trim();
    items.push({
      key: 'trigger',
      label: 'Gatilho',
      value: val,
      bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
      labelColorClass: 'text-rose-400',
      isWide: true,
    });
  }

  if (frequency && frequency.trim()) {
    const val = frequency.trim();
    items.push({
      key: 'frequency',
      label: 'Frequência',
      value: val,
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
      isWide: val.length > 24,
    });
  }

  if (cost && cost.trim()) {
    const val = cost.trim();
    items.push({
      key: 'cost',
      label: 'Custo',
      value: val,
      bgBorderClass: 'bg-teal-950/40 border-teal-800/60 hover:border-teal-500/60',
      labelColorClass: 'text-teal-400',
    });
  }

  if (access && access.trim()) {
    const val = access.trim();
    items.push({
      key: 'access',
      label: 'Acesso',
      value: val,
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-400',
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800/80 text-[11px] auto-rows-min">
      {items.map((item, idx) => {
        const isLastOdd = items.length % 2 === 1 && idx === items.length - 1;
        const colSpanClass =
          items.length === 1 || item.isWide || isLastOdd
            ? 'col-span-1 sm:col-span-2'
            : 'col-span-1';

        return (
          <div
            key={item.key}
            className={`p-1.5 px-2.5 rounded-lg border transition-all flex items-baseline gap-1.5 overflow-hidden shadow-xs ${item.bgBorderClass} ${colSpanClass}`}
          >
            <strong
              className={`font-bold uppercase text-[10px] font-mono tracking-wider shrink-0 ${item.labelColorClass}`}
            >
              {item.label}:
            </strong>
            <span
              className="text-zinc-200 break-words font-medium truncate sm:whitespace-normal"
              title={item.value}
            >
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Crisp, pixel-perfect Feat Popover Content for Tooltip Hover showing full content adapted to screen
export function FeatTooltipCard({
  feat,
  onSelectEntity,
}: {
  feat: HecosEntity;
  onSelectEntity?: (id: string) => void;
}) {
  const data = parseFeatFromContent(feat.title, feat.content || '', feat.featData);
  const action = getActionGlyphProp(data.actionCost);
  const orderedTraits = sortTraitsHierarchically(data.traits || [], { rarity: data.rarity || 'Comum' });

  return (
    <div className="p-4 space-y-3 w-[340px] sm:w-[440px] md:w-[500px] max-w-[calc(100vw-32px)] max-h-[75vh] overflow-y-auto text-left bg-[#100c1c] border border-amber-500/40 rounded-xl shadow-2xl scrollbar-thin scrollbar-thumb-amber-700/40 scrollbar-track-zinc-950/40">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Nível {data.level}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/60 text-purple-300 border border-purple-800/40">
            {getFeatTypeLabel(data.featType)}
          </span>
        </div>
        <h4 className="text-base font-bold text-amber-200 flex items-center gap-2 flex-wrap leading-snug">
          <span>{feat.title}</span>
          {action.show && <PF2eActionGlyph type={action.type} size="sm" />}
        </h4>
        {feat.subtitle && (
          <p className="text-xs text-zinc-400 italic mt-0.5">{feat.subtitle}</p>
        )}
      </div>

      {/* Traits in tooltip strictly sorted: [Raridade] + [Tradição] + [Tamanho] + [Outros Traits em Ordem Alfabética] */}
      {orderedTraits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {orderedTraits.map((t) => (
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

      {/* Smart blocks in tooltip */}
      <SmartFeatCardIndexBlocks
        prerequisites={data.prerequisites}
        requirements={data.requirements}
        trigger={data.trigger}
        frequency={data.frequency}
        cost={data.cost}
        access={data.access}
      />

      {/* Full Description without truncation */}
      {(data.description || feat.content || feat.summary) && (
        <div className="text-xs text-zinc-200 leading-relaxed space-y-2 pt-1 border-t border-zinc-800/50">
          <RichContentRenderer
            content={data.description || feat.content || feat.summary || ''}
            onNavigate={(id) => {
              if (onSelectEntity) onSelectEntity(id);
              else window.dispatchEvent(new CustomEvent('hecos:open-feat-drawer', { detail: { featId: id } }));
            }}
          />
        </div>
      )}

      {/* Outcomes (Critical Success, Success, Failure, Critical Failure) */}
      {(data.criticalSuccess || data.success || data.failure || data.criticalFailure) && (
        <div className="space-y-1.5 pt-2 border-t border-zinc-800/70 text-xs">
          {data.criticalSuccess && (
            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-200">
              <span className="font-bold text-emerald-400">Sucesso Crítico: </span>
              <RichContentRenderer content={data.criticalSuccess} />
            </div>
          )}
          {data.success && (
            <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/50 text-cyan-200">
              <span className="font-bold text-cyan-400">Sucesso: </span>
              <RichContentRenderer content={data.success} />
            </div>
          )}
          {data.failure && (
            <div className="p-2 rounded bg-amber-950/40 border border-amber-800/50 text-amber-200">
              <span className="font-bold text-amber-400">Falha: </span>
              <RichContentRenderer content={data.failure} />
            </div>
          )}
          {data.criticalFailure && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-800/50 text-rose-200">
              <span className="font-bold text-rose-400">Falha Crítica: </span>
              <RichContentRenderer content={data.criticalFailure} />
            </div>
          )}
        </div>
      )}

      {/* Special notes */}
      {data.special && (
        <div className="p-2 rounded bg-purple-950/40 border border-purple-800/50 text-purple-200 text-xs">
          <span className="font-bold text-purple-300">Especial: </span>
          <RichContentRenderer content={data.special} />
        </div>
      )}

      {/* Footer shortcut */}
      <div className="pt-2 border-t border-zinc-800 text-[10px] text-amber-400 font-bold flex items-center justify-between">
        <span className="text-zinc-500 font-normal">Visualização rápida de talento</span>
        <span className="flex items-center gap-1 hover:underline">
          <span>Abrir painel completo</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export const FeatCard: React.FC<FeatCardProps> = ({
  entity,
  featData: providedFeatData,
  id: directId,
  title: directTitle,
  subtitle: directSubtitle,
  level: directLevel,
  featType: directFeatType,
  subcategories: directSubcategories,
  rarity: directRarity,
  traits: directTraits,
  actionCost: directActionCost,
  prerequisites: directPrerequisites,
  requirements: directRequirements,
  trigger: directTrigger,
  frequency: directFrequency,
  description: directDescription,
  criticalSuccess: directCriticalSuccess,
  success: directSuccess,
  failure: directFailure,
  criticalFailure: directCriticalFailure,
  special: directSpecial,
  visibility: directVisibility,
  allowedUserIds: directAllowedUserIds,
  isSecret: directIsSecret,
  onSelectEntity,
  onEditEntity,
  onDeleteEntity,
  onOpenFolderAssign,
  onSelectSubcategory,
  isGmMode,
  className = '',
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = isGmMode ?? HecosStorage.isUserGm(currentUser);

  // If entity is provided, parse it; otherwise resolve from explicit props
  const parsedFeat = entity
    ? parseFeatFromContent(entity.title, entity.content || '', entity.featData)
    : providedFeatData || null;

  const title = entity?.title || directTitle || 'Talento Sem Nome';
  const subtitle = entity?.subtitle || directSubtitle;
  const level = parsedFeat?.level ?? directLevel ?? 1;
  const featType = parsedFeat?.featType || directFeatType || 'ancestry';
  const rarity = (parsedFeat?.rarity || directRarity || 'Comum') as FeatRarity;
  const actionCost = (parsedFeat?.actionCost || directActionCost || '1') as string;
  const prerequisites = parsedFeat?.prerequisites || directPrerequisites;
  const requirements = parsedFeat?.requirements || directRequirements;
  const trigger = parsedFeat?.trigger || directTrigger;
  const frequency = parsedFeat?.frequency || directFrequency;
  const description =
    parsedFeat?.description ||
    directDescription ||
    entity?.summary ||
    entity?.content?.replace(/<[^>]+>/g, '') ||
    '';
  const criticalSuccess = parsedFeat?.criticalSuccess || directCriticalSuccess;
  const success = parsedFeat?.success || directSuccess;
  const failure = parsedFeat?.failure || directFailure;
  const criticalFailure = parsedFeat?.criticalFailure || directCriticalFailure;
  const special = parsedFeat?.special || directSpecial;

  // Subcategories / Folders list
  const subcats: string[] = Array.from(
    new Set(
      [
        ...(parsedFeat?.subcategories || []),
        ...(entity?.subcategories || []),
        ...(directSubcategories || []),
        entity?.subcategory,
      ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    )
  );

  // Traits list (avoid duplicating rarity if present in traits)
  const traits = (parsedFeat?.traits || directTraits || entity?.traits || []).filter(
    (t) => typeof t === 'string' && t.trim().length > 0
  );

  const action = getActionGlyphProp(actionCost);
  const targetEntityId = entity?.id || directId;

  const handleOpenInDrawer = () => {
    if (targetEntityId) {
      if (onSelectEntity) {
        onSelectEntity(targetEntityId);
      } else {
        window.dispatchEvent(
          new CustomEvent('hecos:open-feat-drawer', { detail: { featId: targetEntityId } })
        );
      }
    }
  };

  const titleNode = (
    <button
      type="button"
      onClick={handleOpenInDrawer}
      disabled={!targetEntityId}
      className="text-left group/title focus:outline-none cursor-pointer block w-full"
      title={`Abrir talento ${title}`}
    >
      <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover/title:text-amber-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(245,158,11,0.85)]">
        <span className="group-hover/title:underline decoration-amber-400/80 decoration-2 underline-offset-2 truncate">
          {title}
        </span>
        {action.show && <PF2eActionGlyph type={action.type} size="sm" />}
        {actionCost === 'passive' && (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
            Passivo
          </span>
        )}
        {actionCost === 'activity' && (
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60 flex items-center gap-0.5 shrink-0">
            <Clock className="w-2.5 h-2.5" />
            <span>Ativ.</span>
          </span>
        )}
        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-amber-400 group-hover/title:translate-x-0.5 transition-all shrink-0 ml-auto" />
      </h3>
      {subtitle && (
        <p className="text-[11px] text-zinc-400 mt-0.5 italic break-words">{subtitle}</p>
      )}
    </button>
  );

  return (
    <div
      className={`group/card rounded-2xl bg-[#0e0c15] hover:bg-[#140f21] border border-zinc-800/80 hover:border-amber-500/50 p-5 transition-all shadow-md hover:shadow-[0_0_24px_rgba(245,158,11,0.15)] flex flex-col justify-between relative ${className}`}
    >
      <div>
        {/* Top Bar: Title, Action Glyph, Level & Visibility */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {entity ? (
              <Tooltip
                side="right"
                delay={200}
                className="w-full"
                content={<FeatTooltipCard feat={entity} onSelectEntity={handleOpenInDrawer} />}
              >
                {titleNode}
              </Tooltip>
            ) : (
              titleNode
            )}

            {/* Feat Type & Level Tag below Title */}
            <div className="mt-1 text-xs font-serif italic text-amber-300/90 tracking-wide flex items-center gap-1.5 flex-wrap">
              <span className="not-italic font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Nível {level}
              </span>
              <span className="not-italic font-mono uppercase text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-bold">
                {getFeatTypeLabel(featType)}
              </span>
            </div>
          </div>

          {/* Visibility Badge Menu for GM */}
          {isActualGm && entity && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <VisibilityBadgeMenu
                visibility={entity.visibility}
                allowedUserIds={entity.allowedUserIds}
                isSecret={entity.isSecret}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
                }}
              />
            </div>
          )}
        </div>

        {/* Traits Area: [Raridade] + [Tradição] + [Tamanho] + [Outros Traits em Ordem Alfabética] */}
        {(() => {
          const orderedCardTraits = sortTraitsHierarchically(traits, { rarity: rarity || 'Comum' });
          if (orderedCardTraits.length === 0) return null;
          return (
            <div className="flex items-center gap-1 flex-wrap mt-2.5">
              {orderedCardTraits.map((trait, tIdx) => (
                <TraitBadge
                  compact
                  size="xs"
                  key={`feat-trait-${trait}-${tIdx}`}
                  trait={trait}
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('hecos:open-trait-drawer', { detail: { trait } })
                    );
                  }}
                />
              ))}
            </div>
          );
        })()}

        {/* Smart, Compact and Auto-Fitting Index Metadata Blocks */}
        <SmartFeatCardIndexBlocks
          prerequisites={prerequisites}
          requirements={requirements}
          trigger={trigger}
          frequency={frequency}
        />

        {/* Quick Formatted Summary displayed on card */}
        {description && (
          <div className="text-xs text-zinc-300 mt-3 leading-relaxed break-words line-clamp-4">
            <RichContentRenderer
              content={description}
              onNavigate={onSelectEntity || handleOpenInDrawer}
            />
          </div>
        )}
      </div>

      {/* Bottom Footer: Folder Tags & Edit/Delete Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        {/* Folders assigned to this feat */}
        <div className="flex items-center gap-1 flex-wrap flex-1 max-w-[70%]">
          {subcats.length > 0 ? (
            subcats.map((sub, sIdx) => (
              <span
                key={`sub-${sub}-${sIdx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSubcategory && onSelectSubcategory(sub);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:border-amber-400 truncate transition-colors cursor-pointer flex items-center gap-1"
              >
                <Folder className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{sub}</span>
              </span>
            ))
          ) : (
            <span className="text-[10px] text-zinc-600 italic">Sem pasta</span>
          )}

          {/* Manage Folders Trigger Button */}
          {isActualGm && entity && onOpenFolderAssign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolderAssign(entity);
              }}
              className="p-1 rounded text-zinc-500 hover:text-amber-300 hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Organizar nas Pastas"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Edit & Delete Buttons for GM or View Details link */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isActualGm && targetEntityId && onEditEntity && (
            <Tooltip title="Editar Talento" description="Modificar estatísticas, requisitos e descrição">
              <button
                type="button"
                onClick={() => onEditEntity(targetEntityId)}
                className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
          {isActualGm && targetEntityId && onDeleteEntity && (
            <Tooltip title="Excluir Talento" description="Excluir talento com segurança">
              <button
                type="button"
                onClick={() => onDeleteEntity(targetEntityId)}
                className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-600/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}

          {/* View Details Link if not GM */}
          {!isActualGm && targetEntityId && (
            <button
              type="button"
              onClick={handleOpenInDrawer}
              className="text-[10px] text-zinc-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver Detalhes</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
