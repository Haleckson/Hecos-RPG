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
import { renderContentWithMentions } from './MentionBadge';
import {
  Folder,
  FolderPlus,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
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

  // Action Glyph mapping
  const getActionGlyphProp = (cost: string): { type: ActionGlyphType; show: boolean } => {
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

  const action = getActionGlyphProp(actionCost);
  const targetEntityId = entity?.id || directId;

  const handleTitleClick = () => {
    if (targetEntityId && onSelectEntity) {
      onSelectEntity(targetEntityId);
    }
  };

  return (
    <div
      className={`rounded-xl bg-[#0e0b17] hover:bg-[#130f20] border border-zinc-800/90 hover:border-amber-500/40 p-3.5 transition-all flex flex-col justify-between group shadow-md space-y-3 ${className}`}
    >
      <div className="space-y-2.5">
        {/* Top Bar: Pastas / Subcategorias, Categoria e Ações de GM */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {/* Indicador de Pastas logo antes da Categoria */}
            {subcats.map((subcat) => (
              <button
                key={subcat}
                type="button"
                onClick={() => onSelectSubcategory && onSelectSubcategory(subcat)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-600/40 transition-colors"
                title={`Filtrar pela pasta ${subcat}`}
              >
                <Folder className="w-2.5 h-2.5 text-amber-400" />
                <span>{subcat}</span>
              </button>
            ))}

            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/60 text-purple-300 border border-purple-800/40">
              {getFeatTypeLabel(featType)}
            </span>
          </div>

          {isActualGm && (
            <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              {entity && (
                <div onClick={(e) => e.stopPropagation()}>
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

              {entity && onOpenFolderAssign && (
                <button
                  type="button"
                  onClick={() => onOpenFolderAssign(entity)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 transition-colors"
                  title="Organizar Pastas / Subcategorias deste talento"
                >
                  <Folder className="w-3.5 h-3.5" />
                </button>
              )}

              {targetEntityId && onEditEntity && (
                <button
                  type="button"
                  onClick={() => onEditEntity(targetEntityId)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 transition-colors"
                  title="Editar Talento"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}

              {targetEntityId && onDeleteEntity && (
                <button
                  type="button"
                  onClick={() => onDeleteEntity(targetEntityId)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                  title="Excluir Talento"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Título & Ação na Esquerda, Nível do Talento na Direita Oposta */}
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={handleTitleClick}
            disabled={!targetEntityId || !onSelectEntity}
            className={`text-left flex-1 min-w-0 group/title focus:outline-none ${
              targetEntityId && onSelectEntity ? 'cursor-pointer' : 'cursor-default'
            }`}
            title={targetEntityId ? `Abrir talento ${title}` : title}
          >
            <h3 className="text-sm font-bold text-amber-200 group-hover/title:text-amber-300 group-hover/title:drop-shadow-[0_0_10px_rgba(245,158,11,0.85)] flex flex-wrap items-center gap-1.5 leading-snug transition-all">
              <span className="group-hover/title:underline decoration-amber-400/80 decoration-2 underline-offset-2 break-words">
                {title}
              </span>
              {action.show && <PF2eActionGlyph type={action.type} size="sm" />}
              {actionCost === 'passive' && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 shrink-0">
                  Passivo
                </span>
              )}
              {actionCost === 'activity' && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60 flex items-center gap-0.5 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Ativ.</span>
                </span>
              )}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-zinc-400 mt-0.5 italic break-words">{subtitle}</p>
            )}
          </button>

          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 ml-1">
            Nível {level}
          </span>
        </div>

        {/* Traços PF2e: Raridade no Início como Primeiro Traço */}
        <div className="flex flex-wrap gap-1">
          <TraitBadge
            trait={rarity || 'Comum'}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('hecos:open-trait-drawer', {
                  detail: { trait: rarity || 'Comum' },
                })
              );
            }}
          />
          {traits
            .filter((t) => t.toLowerCase() !== (rarity || 'Comum').toLowerCase())
            .map((trait) => (
              <TraitBadge
                key={trait}
                trait={trait}
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('hecos:open-trait-drawer', { detail: { trait } })
                  );
                }}
              />
            ))}
        </div>

        {/* Pré-requisitos */}
        {prerequisites && (
          <div className="text-[11px] text-zinc-400 break-words">
            <strong className="text-zinc-500 font-bold uppercase text-[9px] mr-1">Pré-req:</strong>
            <span>{renderContentWithMentions(prerequisites, onSelectEntity)}</span>
          </div>
        )}

        {/* Requisitos */}
        {requirements && (
          <div className="text-[11px] text-zinc-400 break-words">
            <strong className="text-zinc-500 font-bold uppercase text-[9px] mr-1">Requisitos:</strong>
            <span>{renderContentWithMentions(requirements, onSelectEntity)}</span>
          </div>
        )}

        {/* Gatilho */}
        {trigger && (
          <div className="text-[11px] text-rose-300 break-words">
            <strong className="text-rose-400 font-bold uppercase text-[9px] mr-1">Gatilho:</strong>
            <span>{renderContentWithMentions(trigger, onSelectEntity)}</span>
          </div>
        )}

        {/* Frequência */}
        {frequency && (
          <div className="text-[11px] text-zinc-300 break-words">
            <strong className="text-zinc-500 font-bold uppercase text-[9px] mr-1">Frequência:</strong>
            <span>{frequency}</span>
          </div>
        )}

        {/* Descrição Integral */}
        {description && (
          <div className="text-xs text-zinc-300/90 leading-relaxed break-words">
            {renderContentWithMentions(description, onSelectEntity)}
          </div>
        )}

        {/* Graus de Sucesso */}
        {(criticalSuccess || success || failure || criticalFailure) && (
          <div className="text-[11px] space-y-1 pt-1.5 border-t border-zinc-800/60 text-zinc-300">
            {criticalSuccess && (
              <div>
                <strong className="text-emerald-400 font-bold">Sucesso Crítico: </strong>
                <span>{renderContentWithMentions(criticalSuccess, onSelectEntity)}</span>
              </div>
            )}
            {success && (
              <div>
                <strong className="text-cyan-400 font-bold">Sucesso: </strong>
                <span>{renderContentWithMentions(success, onSelectEntity)}</span>
              </div>
            )}
            {failure && (
              <div>
                <strong className="text-amber-400 font-bold">Falha: </strong>
                <span>{renderContentWithMentions(failure, onSelectEntity)}</span>
              </div>
            )}
            {criticalFailure && (
              <div>
                <strong className="text-rose-400 font-bold">Falha Crítica: </strong>
                <span>{renderContentWithMentions(criticalFailure, onSelectEntity)}</span>
              </div>
            )}
          </div>
        )}

        {/* Especial */}
        {special && (
          <div className="text-[11px] pt-1 text-zinc-400 break-words">
            <strong className="text-zinc-300 font-bold">Especial: </strong>
            <span>{renderContentWithMentions(special, onSelectEntity)}</span>
          </div>
        )}
      </div>

      {/* Rodapé: Pastas e Ações Rápidas */}
      <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
        {entity && onOpenFolderAssign ? (
          <button
            type="button"
            onClick={() => onOpenFolderAssign(entity)}
            className="text-[10px] text-zinc-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
          >
            <FolderPlus className="w-3 h-3 text-amber-400" />
            <span>Pastas</span>
          </button>
        ) : (
          <div />
        )}

        {targetEntityId && onSelectEntity && (
          <button
            type="button"
            onClick={() => onSelectEntity(targetEntityId)}
            className="text-[10px] text-zinc-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors ml-auto cursor-pointer"
          >
            <span>Ver Detalhes</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
};
