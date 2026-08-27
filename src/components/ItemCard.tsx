import React from 'react';
import {
  HecosEntity,
  PF2eItemAttributes,
  ItemCategoryType,
} from '../types';
import { parseItemFromContent } from '../utils/itemSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { Tooltip } from './Tooltip';
import { RichContentRenderer } from './RichContentRenderer';
import { renderContentWithMentions } from './MentionBadge';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Package,
  Coins,
  Weight,
  Shield,
  Swords,
  Sparkles,
  Hammer,
  Scroll,
  Lock,
  Edit,
  Trash2,
  Folder,
  FolderPlus,
  ArrowRight,
  ExternalLink,
  Zap,
} from 'lucide-react';

export interface ItemCardProps {
  entity?: HecosEntity;
  itemData?: PF2eItemAttributes;
  id?: string;
  title?: string;
  subtitle?: string;
  onSelectEntity?: (id: string) => void;
  onEditEntity?: (id: string) => void;
  onDeleteEntity?: (id: string) => void;
  onOpenFolderAssign?: (entity: HecosEntity) => void;
  onSelectSubcategory?: (subcat: string) => void;
  isGmMode?: boolean;
}

const getActionGlyphProp = (actionStr?: string): { type: ActionGlyphType; show: boolean } => {
  if (!actionStr) return { type: '1-action', show: false };
  const norm = actionStr.toLowerCase();
  if (norm.includes('1') || norm.includes('única') || norm.includes('unica') || norm.includes('uma')) {
    return { type: '1-action', show: true };
  }
  if (norm.includes('2') || norm.includes('duas')) {
    return { type: '2-actions', show: true };
  }
  if (norm.includes('3') || norm.includes('três') || norm.includes('tres')) {
    return { type: '3-actions', show: true };
  }
  if (norm.includes('livre') || norm.includes('free')) {
    return { type: 'free-action', show: true };
  }
  if (norm.includes('reação') || norm.includes('reacao') || norm.includes('reaction')) {
    return { type: 'reaction', show: true };
  }
  return { type: '1-action', show: true };
};

/**
 * Pixel-perfect Item Popover Content for Tooltip Hover showing full PF2e stats
 */
export function ItemTooltipCard({
  item,
  onSelectEntity,
}: {
  item: HecosEntity;
  onSelectEntity?: (id: string) => void;
}) {
  const data = parseItemFromContent(item.content || '', item.itemData);
  const orderedTraits = sortTraitsHierarchically(data.traits || [], { rarity: data.rarity || 'Comum' });
  const hasCombat = data.damage || data.weaponGroup || data.weaponRange || data.reload;
  const hasArmor = data.armorBonus !== undefined || data.dexCap !== undefined || data.checkPenalty !== undefined;
  const hasActivation = data.activation || data.activationAction || data.activationEffect;

  return (
    <div className="p-4 space-y-3 w-[340px] sm:w-[420px] max-w-[calc(100vw-32px)] max-h-[75vh] overflow-y-auto text-left bg-[#100c1c] border border-amber-500/40 rounded-xl shadow-2xl scrollbar-thin scrollbar-thumb-amber-700/40 scrollbar-track-zinc-950/40">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Item {data.level ?? 0}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
            {data.rarity || 'Comum'}
          </span>
        </div>
        <h4 className="text-base font-bold text-amber-200 flex items-center gap-2 flex-wrap leading-snug">
          <Package className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{item.title}</span>
        </h4>
        {item.subtitle && (
          <p className="text-xs text-zinc-400 italic mt-0.5">{item.subtitle}</p>
        )}
      </div>

      {/* Traits */}
      {orderedTraits.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {orderedTraits.map((t) => (
            <TraitBadge
              key={t}
              trait={t}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } }));
              }}
            />
          ))}
        </div>
      )}

      {/* Core details: Price, Bulk, Usage */}
      <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-300 pt-1 border-t border-zinc-800/60">
        {data.price && (
          <div><strong className="text-amber-400">Preço:</strong> {data.price}</div>
        )}
        {data.bulk && (
          <div><strong className="text-zinc-400">Volume:</strong> {data.bulk}</div>
        )}
        {data.usage && (
          <div className="col-span-2"><strong className="text-purple-300">Uso:</strong> {data.usage}</div>
        )}
      </div>

      {/* Combat or Armor */}
      {hasCombat && (
        <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] space-y-1">
          <strong className="text-amber-300 uppercase font-mono text-[10px] block">Combate</strong>
          {data.damage && <div><strong>Dano:</strong> {data.damage} {data.damageType ? `(${data.damageType})` : ''}</div>}
          {data.weaponGroup && <div><strong>Grupo:</strong> {data.weaponGroup}</div>}
          {data.weaponRange && <div><strong>Alcance:</strong> {data.weaponRange}</div>}
        </div>
      )}

      {hasArmor && (
        <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] space-y-1">
          <strong className="text-cyan-300 uppercase font-mono text-[10px] block">Armadura</strong>
          {data.armorBonus !== undefined && <div><strong>CA:</strong> +{data.armorBonus}</div>}
          {data.dexCap !== undefined && <div><strong>Limite Des:</strong> +{data.dexCap}</div>}
          {data.checkPenalty !== undefined && <div><strong>Penalidade:</strong> {data.checkPenalty}</div>}
        </div>
      )}

      {/* Activation */}
      {hasActivation && (
        <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-800/40 text-[11px] space-y-1">
          <div className="font-bold text-purple-300 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-purple-400" />
            <span>Ativação {data.activationAction ? `[${data.activationAction}]` : ''}</span>
          </div>
          {data.activation && <div className="text-zinc-300">{data.activation}</div>}
          {data.activationEffect && <div className="text-zinc-400 pt-1 leading-relaxed">{data.activationEffect}</div>}
        </div>
      )}

      {/* Description */}
      <div className="text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/80 pt-2 line-clamp-4">
        {data.description || item.summary || 'Sem descrição.'}
      </div>

      {/* Special Properties */}
      {data.specialProperties && (
        <div className="text-[11px] text-amber-200/90 pt-1 border-t border-zinc-800/60">
          <strong className="text-amber-400">Efeitos:</strong> {data.specialProperties}
        </div>
      )}

      {/* Craft requirements */}
      {data.craftRequirements && (
        <div className="text-[11px] text-cyan-200/90 pt-1">
          <strong className="text-cyan-400">Manufatura:</strong> {data.craftRequirements}
        </div>
      )}
    </div>
  );
}

export const ItemCard: React.FC<ItemCardProps> = ({
  entity,
  itemData: propItemData,
  id: propId,
  title: propTitle,
  subtitle: propSubtitle,
  onSelectEntity,
  onEditEntity,
  onDeleteEntity,
  onOpenFolderAssign,
  onSelectSubcategory,
  isGmMode = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = isGmMode || currentUser?.role === 'gm';

  // Extract or parse item data
  const data: PF2eItemAttributes = propItemData
    ? propItemData
    : entity
    ? parseItemFromContent(entity.content || '', entity.itemData)
    : {
        level: 1,
        itemType: 'gear',
        subcategories: [],
        price: '1 po',
        bulk: 'L',
        rarity: 'Comum',
        usage: 'empunhado em 1 mão',
        activation: '',
        traits: ['Equipamento'],
        description: '',
      };

  const itemId = entity?.id || propId || 'item-card';
  const itemTitle = entity?.title || propTitle || 'Item Sem Nome';
  const perm = entity ? HecosStorage.getEntityPermission(entity.id) : { visibility: 'all' as const, allowedUserIds: [] as string[] };
  const orderedTraits = sortTraitsHierarchically(data.traits || [], { rarity: data.rarity || 'Comum' });

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'incomum':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      case 'raro':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
      case 'único':
      case 'unico':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
      case 'comum':
      default:
        return 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60';
    }
  };

  const handleCardClick = () => {
    if (onSelectEntity) {
      onSelectEntity(itemId);
    } else {
      window.dispatchEvent(
        new CustomEvent('hecos:open-item-drawer', { detail: { itemId } })
      );
    }
  };

  return (
    <div className="bg-[#0b0816] rounded-2xl border border-zinc-800/80 p-5 hover:border-amber-500/50 transition-all hover:shadow-[0_0_24px_rgba(245,158,11,0.12)] flex flex-col justify-between group relative">
      <div>
        {/* Top Bar: Title, Level, Rarity, and Visibility */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Item {data.level ?? 0}
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getRarityBadgeStyle(data.rarity || 'Comum')}`}>
                {data.rarity || 'Comum'}
              </span>
            </div>

            {entity ? (
              <Tooltip
                content={<ItemTooltipCard item={entity} onSelectEntity={onSelectEntity} />}
                placement="top"
              >
                <button
                  type="button"
                  onClick={handleCardClick}
                  className="text-left group/title focus:outline-none cursor-pointer block"
                  title={`Abrir item ${itemTitle}`}
                >
                  <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-amber-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(245,158,11,0.85)]">
                    <span className="group-hover/title:underline decoration-amber-400/80 decoration-2 underline-offset-2">
                      {itemTitle}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-amber-400 group-hover/title:translate-x-0.5 transition-all shrink-0" />
                  </h3>
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={handleCardClick}
                className="text-left group/title focus:outline-none cursor-pointer block"
              >
                <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-amber-300 transition-all">
                  {itemTitle}
                </h3>
              </button>
            )}

            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 font-mono flex-wrap">
              {data.price && (
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-400 inline" /> {data.price}
                </span>
              )}
              {data.bulk && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 flex items-center gap-0.5">
                    <Weight className="w-3 h-3 text-zinc-500 inline" /> Vol: {data.bulk}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visibility badge menu for GM */}
          {isActualGm && entity && (
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <VisibilityBadgeMenu
                visibility={perm.visibility}
                allowedUserIds={perm.allowedUserIds}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityPermission(entity.id, newVis, newAllowed);
                }}
              />
            </div>
          )}
        </div>

        {/* Traits & Rarity Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-3">
          {orderedTraits.map((t) => (
            <TraitBadge
              key={t}
              trait={t}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } }));
              }}
            />
          ))}
        </div>

        {/* Usage & Activation Summary */}
        <div className="grid grid-cols-1 gap-1 mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400">
          {data.usage && (
            <div className="break-words">
              <strong className="text-zinc-300">Uso:</strong> {data.usage}
            </div>
          )}
          {data.activation && (
            <div className="break-words">
              <strong className="text-purple-300">Ativação:</strong> {data.activation}
            </div>
          )}
          {data.damage && (
            <div className="break-words">
              <strong className="text-amber-400">Dano:</strong> {data.damage} {data.damageType ? `(${data.damageType})` : ''}
            </div>
          )}
          {data.armorBonus !== undefined && (
            <div className="break-words">
              <strong className="text-cyan-400">CA:</strong> +{data.armorBonus}
            </div>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-zinc-400 mt-3 leading-relaxed break-words whitespace-pre-wrap line-clamp-3">
          {data.description || entity?.summary || 'Sem descrição fornecida.'}
        </p>
      </div>

      {/* Bottom Footer: Folder Tags & Edit/Delete Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
        {/* Folders assigned to this item */}
        <div className="flex items-center gap-1 flex-wrap flex-1 max-w-[70%]">
          {data.subcategories && data.subcategories.length > 0 ? (
            data.subcategories.map((sub) => (
              <span
                key={sub}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSubcategory?.(sub);
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
              className="p-1 rounded text-zinc-500 hover:text-amber-300 hover:bg-zinc-900 transition-colors"
              title="Organizar nas Pastas"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Edit & Delete Buttons */}
        {isActualGm && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onEditEntity && (
              <Tooltip title="Editar Item" description="Modificar estatísticas, preço, volume e descrição">
                <button
                  type="button"
                  onClick={() => onEditEntity(itemId)}
                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
            {onDeleteEntity && (
              <Tooltip title="Mover para a Lixeira" description="Mover item com segurança para a lixeira">
                <button
                  type="button"
                  onClick={() => onDeleteEntity(itemId)}
                  className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-600/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
