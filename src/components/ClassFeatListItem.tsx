import React, { useMemo } from 'react';
import { HecosEntity, FeatCategoryType, FeatRarity, FeatActionCost } from '../types';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph } from './PF2eActionGlyph';
import { TraitBadge } from './TraitBadge';
import { Tooltip } from './Tooltip';
import { FeatTooltipCard, getActionGlyphProp } from './FeatCard';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Search,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';

export interface ClassFeatItemData {
  id?: string;
  level: number;
  name?: string;
  title?: string;
  description?: string;
  actionCost?: string;
  traits?: string[];
  prerequisites?: string;
  benefitsSummary?: string;
  featEntityId?: string;
}

export interface ClassFeatListItemProps {
  feat: ClassFeatItemData;
  theme?: 'blue' | 'purple' | 'teal';
  mode?: 'edit' | 'view';
  onPickFeat?: () => void;
  onRemove?: () => void;
  onToggleManualEdit?: () => void;
  isManuallyEditing?: boolean;
  onNavigate?: (id: string) => void;
  className?: string;
}

export const ClassFeatListItem: React.FC<ClassFeatListItemProps> = ({
  feat,
  theme = 'blue',
  mode = 'view',
  onPickFeat,
  onRemove,
  onToggleManualEdit,
  isManuallyEditing = false,
  onNavigate,
  className = '',
}) => {
  const featTitle = feat.name || feat.title || '';
  const allEntities = useMemo(() => HecosStorage.getEntities() || [], []);

  // Resolve target entity for the rich tooltip card
  const resolvedEntity = useMemo<HecosEntity>(() => {
    // 1. By direct entity ID
    if (feat.featEntityId) {
      const found = allEntities.find((e) => e.id === feat.featEntityId);
      if (found) return found;
    }

    // 2. By title matching in compendium feats/archetypes
    if (featTitle) {
      const cleanTitle = featTitle.trim().toLowerCase();
      const found = allEntities.find(
        (e) =>
          (e.category === 'feat' || e.category === 'archetype') &&
          e.title.trim().toLowerCase() === cleanTitle
      );
      if (found) return found;
    }

    // 3. Fallback: synthesize valid HecosEntity so FeatTooltipCard renders identical layout
    return {
      id: feat.featEntityId || feat.id || `feat-${feat.level}-${Date.now()}`,
      slug: (featTitle || 'talento').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: featTitle || 'Talento',
      category: 'feat',
      summary: feat.prerequisites ? `Pré-requisitos: ${feat.prerequisites}` : feat.benefitsSummary || '',
      content: feat.description || '',
      traits: feat.traits || [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featData: {
        level: feat.level || 1,
        featType: (theme === 'teal' ? 'vocation' : theme === 'purple' ? 'archetype' : 'class') as FeatCategoryType,
        rarity: 'Comum' as FeatRarity,
        actionCost: (feat.actionCost || 'passive') as FeatActionCost,
        traits: feat.traits || [],
        prerequisites: feat.prerequisites || '',
        description: feat.description || '',
        frequency: feat.benefitsSummary || '',
      },
    };
  }, [feat.featEntityId, featTitle, feat.id, feat.level, feat.prerequisites, feat.benefitsSummary, feat.description, feat.traits, feat.actionCost, theme, allEntities]);

  const isCompendiumLinked = Boolean(
    feat.featEntityId ||
    (featTitle && allEntities.some((e) => (e.category === 'feat' || e.category === 'archetype') && e.title.toLowerCase() === featTitle.toLowerCase()))
  );

  const action = getActionGlyphProp(feat.actionCost);
  const orderedTraits = useMemo(() => {
    return sortTraitsHierarchically(feat.traits || resolvedEntity.traits || resolvedEntity.featData?.traits || []);
  }, [feat.traits, resolvedEntity]);

  const handleOpenDrawer = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetId = feat.featEntityId || resolvedEntity.id;
    if (targetId && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('hecos:open-feat-drawer', {
          detail: {
            featId: targetId,
            feat: resolvedEntity,
            title: featTitle,
          },
        })
      );
    }
    if (onNavigate && targetId) {
      onNavigate(targetId);
    }
  };

  // Theme styling definitions
  const themeStyles = {
    blue: {
      card: 'bg-[#081220]/90 border-blue-900/60 hover:border-blue-500/70 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      badge: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
      tag: 'text-blue-300/90 bg-blue-950/40 border-blue-900/40',
      hoverTitle: 'group-hover/title:text-blue-300',
    },
    purple: {
      card: 'bg-[#120a22]/90 border-purple-900/60 hover:border-purple-500/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
      tag: 'text-purple-300/90 bg-purple-950/40 border-purple-900/40',
      hoverTitle: 'group-hover/title:text-purple-300',
    },
    teal: {
      card: 'bg-[#061617]/90 border-teal-900/60 hover:border-teal-500/70 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
      badge: 'bg-teal-950/80 text-teal-300 border-teal-800/80',
      tag: 'text-teal-300/90 bg-teal-950/40 border-teal-900/40',
      hoverTitle: 'group-hover/title:text-teal-300',
    },
  }[theme];

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-3.5 transition-all relative ${themeStyles.card} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left Side: Tooltip Trigger & Meta */}
        <div className="flex-1 min-w-0">
          <Tooltip
            side="top"
            delay={120}
            content={
              <FeatTooltipCard
                feat={resolvedEntity}
                onSelectEntity={(targetId) => {
                  if (onNavigate && targetId) onNavigate(targetId);
                }}
              />
            }
            className="w-full"
          >
            <div
              onClick={handleOpenDrawer}
              className="group/title cursor-pointer text-left focus:outline-none"
              title="Passe o mouse para ver detalhes do talento ou clique para abrir"
            >
              {/* Title & Action Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Level Badge */}
                <span
                  className={`px-2 py-0.5 rounded-lg border font-mono font-black text-[11px] uppercase tracking-wider shrink-0 shadow-sm ${themeStyles.badge}`}
                >
                  Talento {feat.level}
                </span>

                {/* Feat Name */}
                <h4
                  className={`font-bold text-sm text-zinc-100 transition-colors flex items-center gap-1.5 ${themeStyles.hoverTitle}`}
                >
                  <span className="group-hover/title:underline decoration-amber-400/80 underline-offset-2">
                    {featTitle || 'Talento Não Definido'}
                  </span>

                  {action.show && <PF2eActionGlyph type={action.type} size="sm" />}

                  {feat.actionCost === 'passive' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900/90 text-zinc-400 border border-zinc-800 shrink-0">
                      Passivo
                    </span>
                  )}

                  {feat.actionCost === 'activity' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Atividade
                    </span>
                  )}
                </h4>

                {/* Compendium Linked indicator */}
                {isCompendiumLinked && (
                  <span
                    className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-mono flex items-center gap-0.5 shrink-0"
                    title="Importado do Compêndio Oficial"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Compêndio</span>
                  </span>
                )}
              </div>

              {/* Traits & Summary Row */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {orderedTraits.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {orderedTraits.slice(0, 4).map((t) => (
                      <TraitBadge key={t} trait={t} size="xs" compact />
                    ))}
                  </div>
                )}

                {feat.prerequisites && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border truncate max-w-xs ${themeStyles.tag}`}
                    title={feat.prerequisites}
                  >
                    <strong>Pré-req:</strong> {feat.prerequisites}
                  </span>
                )}

                {feat.benefitsSummary && !feat.prerequisites && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border truncate max-w-xs ${themeStyles.tag}`}
                    title={feat.benefitsSummary}
                  >
                    {feat.benefitsSummary}
                  </span>
                )}
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Right Side: Action Buttons */}
        {mode === 'edit' && (
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {onPickFeat && (
              <button
                type="button"
                onClick={onPickFeat}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Trocar ou selecionar talento do compêndio"
              >
                <Search className="w-3 h-3 text-zinc-400" />
                <span>Alterar</span>
              </button>
            )}

            {onToggleManualEdit && (
              <button
                type="button"
                onClick={onToggleManualEdit}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  isManuallyEditing
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
                title={isManuallyEditing ? 'Ocultar campos manuais' : 'Editar texto e campos manualmente'}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 cursor-pointer transition-colors"
                title="Remover talento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {mode === 'view' && (
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Abrir painel detalhado do talento"
            >
              <span>Detalhes</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
