import React from 'react';
import { HecosEntity } from '../types';
import { getCategoryMeta } from '../utils/categories';
import { EntityIcon } from './EntityIcon';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { renderContentWithMentions } from './MentionBadge';
import { HecosStorage } from '../services/storage';
import { getCardVisibilityClasses } from '../utils/cardVisibility';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Sparkles,
  ArrowRight,
  Trash2,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface EntityCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onTagClick?: (tag: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  isGm?: boolean;
  isGmMode?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  onSelect,
  onTagClick,
  onDelete,
  onEdit,
  isGm = false,
  isGmMode = false
}) => {
  const meta = getCategoryMeta(entity.category);
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || isGmMode || currentUser?.role === 'gm';

  const isCiano = meta.accentColor === 'ciano';
  const isMalva = meta.accentColor === 'malva';

  const accentColorClass = isCiano
    ? 'text-cyan-300 border-cyan-800 bg-cyan-950/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
    : isMalva
    ? 'text-purple-300 border-purple-800 bg-purple-950/80 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    : 'text-rose-300 border-rose-800 bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.2)]';

  const visStyle = getCardVisibilityClasses(entity.visibility, entity.isSecret);
  const coverImage = entity.coverImage;

  return (
    <div
      id={`entity-card-${entity.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#0e0a17] hover:bg-[#130e20] border ${visStyle.border} ${visStyle.shadow} transition-all duration-200 shadow-lg overflow-hidden`}
    >
      {/* Top Banner / Cover Area (Allows direct drag-adjustment without triggering accidental card opening) */}
      <div className="relative w-full h-36 bg-[#18112b] overflow-hidden border-b border-zinc-800/60">
        {coverImage ? (
          <AdjustableImage
            src={coverImage}
            alt={entity.title}
            imageKey={`entity-card-${entity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#0c0915]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1b1236] via-[#100b21] to-[#0a0714] flex items-center justify-center p-4">
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-zinc-800/80 flex items-center justify-center text-zinc-500 group-hover:text-cyan-300 group-hover:scale-110 transition-all">
              <EntityIcon
                icon={entity.icon}
                category={entity.category}
                className="w-7 h-7"
              />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a17] via-[#0e0a17]/40 to-transparent pointer-events-none" />

        {/* Floating Category Pill & Actions */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <span
            className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border backdrop-blur-md flex items-center gap-1.5 ${accentColorClass}`}
          >
            <EntityIcon icon={entity.icon} category={entity.category} className="w-3 h-3" />
            <span>{meta.name}</span>
            {entity.statblock && <span>• Nv {entity.statblock.level}</span>}
          </span>

          {effectiveIsGm && (
            <div
              className="flex items-center gap-1.5 bg-black/65 backdrop-blur-md p-1 rounded-lg border border-zinc-800/80 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <VisibilityBadgeMenu
                visibility={entity.visibility}
                allowedUserIds={entity.allowedUserIds}
                isSecret={entity.isSecret}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
                }}
              />
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entity.id)}
                  className="p-1 rounded hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Excluir Artigo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Title as Primary Interactive Trigger (With glow hover & clear clickability) */}
          <div>
            <button
              type="button"
              onClick={() => onSelect(entity.id)}
              className="text-left w-full group/title flex items-start gap-2.5 cursor-pointer focus:outline-none transition-all"
              title={`Abrir artigo ${entity.title}`}
            >
              <div className="w-7 h-7 rounded-lg bg-[#18112b] border border-zinc-700/80 group-hover/title:border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5 shadow-sm transition-all group-hover/title:scale-105">
                <EntityIcon
                  icon={entity.icon}
                  category={entity.category}
                  className="w-3.5 h-3.5"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-cyan-300 transition-all font-serif group-hover/title:drop-shadow-[0_0_12px_rgba(6,182,212,0.85)] flex items-center gap-1.5 break-words">
                  <span className="group-hover/title:underline decoration-cyan-400/80 decoration-2 underline-offset-2">
                    {entity.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-cyan-400 group-hover/title:translate-x-0.5 transition-all shrink-0" />
                </h3>
                {entity.subtitle && (
                  <p className="text-xs text-zinc-400 font-medium mt-0.5 break-words">
                    {entity.subtitle}
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Summary */}
          <div className="text-xs text-zinc-300/90 leading-relaxed break-words">
            {renderContentWithMentions(entity.summary || 'Sem resumo cadastrado.', onSelect)}
          </div>

          {/* Mechanical Traits */}
          {entity.traits && entity.traits.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-1">
              {sortTraitsHierarchically(entity.traits, {
                rarity: entity.statblock?.rarity,
                size: entity.statblock?.size,
              }).map((tr) => (
                <TraitBadge key={tr} trait={tr} />
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Narrative Tags & Action Button */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-1 items-center">
            {entity.tags && entity.tags.length > 0 ? (
              entity.tags.map((t, tIdx) => (
                <button
                  key={`${entity.id}-crdtag-${t}-${tIdx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) onTagClick(t);
                  }}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800 transition-colors cursor-pointer"
                >
                  #{t}
                </button>
              ))
            ) : (
              <span className="text-[10px] text-zinc-600 font-mono">Sem tags</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(entity.id)}
            className="text-[11px] font-semibold text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver Artigo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
