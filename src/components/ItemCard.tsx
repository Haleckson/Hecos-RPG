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

// Intelligent, Compact Index Blocks for Item Cards with Zero Wasted Space
interface ItemIndexBlockItem {
  key: string;
  label: string;
  value: string;
  bgBorderClass: string;
  labelColorClass: string;
  isWide?: boolean;
}

export function SmartItemCardIndexBlocks({ data }: { data: PF2eItemAttributes }) {
  const items: ItemIndexBlockItem[] = [];

  if (data.price && data.price.trim()) {
    items.push({
      key: 'price',
      label: 'Preço',
      value: data.price.trim(),
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
    });
  }

  if (data.bulk && data.bulk.trim()) {
    items.push({
      key: 'bulk',
      label: 'Volume',
      value: data.bulk.trim(),
      bgBorderClass: 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-500/60',
      labelColorClass: 'text-zinc-400',
    });
  }

  if (data.usage && data.usage.trim()) {
    items.push({
      key: 'usage',
      label: 'Uso',
      value: data.usage.trim(),
      bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
      labelColorClass: 'text-purple-300',
      isWide: data.usage.trim().length > 20,
    });
  }

  if (data.damage && data.damage.trim()) {
    const dmgVal = `${data.damage.trim()}${data.damageType ? ` (${data.damageType.trim()})` : ''}`;
    items.push({
      key: 'damage',
      label: 'Dano',
      value: dmgVal,
      bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
      labelColorClass: 'text-rose-400',
    });
  }

  if (data.weaponGroup && data.weaponGroup.trim()) {
    items.push({
      key: 'weaponGroup',
      label: 'Grupo',
      value: data.weaponGroup.trim(),
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-300',
    });
  }

  if (data.weaponRange && data.weaponRange.trim()) {
    items.push({
      key: 'weaponRange',
      label: 'Alcance',
      value: data.weaponRange.trim(),
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-400',
    });
  }

  if (data.reload && data.reload.trim()) {
    items.push({
      key: 'reload',
      label: 'Recarga',
      value: data.reload.trim(),
      bgBorderClass: 'bg-blue-950/40 border-blue-800/60 hover:border-blue-500/60',
      labelColorClass: 'text-blue-400',
    });
  }

  if (data.armorBonus !== undefined && data.armorBonus !== null) {
    items.push({
      key: 'armorBonus',
      label: 'Bônus CA',
      value: `+${data.armorBonus}`,
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-400',
    });
  }

  if (data.dexCap !== undefined && data.dexCap !== null) {
    items.push({
      key: 'dexCap',
      label: 'Limite Des',
      value: `+${data.dexCap}`,
      bgBorderClass: 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/60',
      labelColorClass: 'text-emerald-400',
    });
  }

  if (data.checkPenalty !== undefined && data.checkPenalty !== null) {
    items.push({
      key: 'checkPenalty',
      label: 'Penalidade',
      value: `${data.checkPenalty}`,
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
    });
  }

  if (data.speedPenalty !== undefined && data.speedPenalty !== null) {
    items.push({
      key: 'speedPenalty',
      label: 'Desloc.',
      value: `${data.speedPenalty}`,
      bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
      labelColorClass: 'text-rose-400',
    });
  }

  if (data.strengthReq !== undefined && data.strengthReq !== null) {
    items.push({
      key: 'strengthReq',
      label: 'Força Req.',
      value: `${data.strengthReq}`,
      bgBorderClass: 'bg-zinc-900/60 border-zinc-700/60 hover:border-zinc-500/60',
      labelColorClass: 'text-zinc-300',
    });
  }

  if (data.activation || data.activationAction) {
    const actVal = `${data.activationAction ? `[${data.activationAction}] ` : ''}${data.activation || ''}`.trim();
    if (actVal) {
      items.push({
        key: 'activation',
        label: 'Ativação',
        value: actVal,
        bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
        labelColorClass: 'text-purple-300',
        isWide: true,
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-zinc-800/80 text-[11px] auto-rows-min">
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

/**
 * Crisp, pixel-perfect, zero-scroll Item Popover Content fitting viewport and available space
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

  return (
    <div
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
      }}
      className="w-96 sm:w-[440px] max-w-[calc(100vw-32px)] p-4 space-y-3 text-xs text-left bg-[#0d0a17] border border-amber-500/60 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.95)] ring-1 ring-white/10 antialiased select-text"
    >
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-extrabold text-amber-200 font-serif tracking-wide flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{item.title}</span>
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono font-bold text-amber-300 uppercase px-2 py-0.5 rounded bg-amber-950/90 border border-amber-800">
              Item {data.level ?? 0}
            </span>
            <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
              {data.rarity || 'Comum'}
            </span>
          </div>
        </div>

        {item.subtitle && (
          <p className="text-xs text-zinc-400 italic mt-1 font-sans">{item.subtitle}</p>
        )}

        {/* Traits */}
        {orderedTraits.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            {orderedTraits.map((t) => (
              <TraitBadge
                key={`tt-item-trait-${t}`}
                trait={t}
                compact
                size="xs"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } }));
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Smart Metadata Index Grid Blocks */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-zinc-200 font-sans">
        {data.price && (
          <div>
            <strong className="text-amber-400 font-mono uppercase text-[10px]">Preço:</strong> {data.price}
          </div>
        )}
        {data.bulk && (
          <div>
            <strong className="text-zinc-400 font-mono uppercase text-[10px]">Volume:</strong> {data.bulk}
          </div>
        )}
        {data.usage && (
          <div className="col-span-2">
            <strong className="text-purple-300 font-mono uppercase text-[10px]">Uso:</strong> {data.usage}
          </div>
        )}
        {data.damage && (
          <div>
            <strong className="text-rose-400 font-mono uppercase text-[10px]">Dano:</strong> {data.damage} {data.damageType ? `(${data.damageType})` : ''}
          </div>
        )}
        {data.weaponGroup && (
          <div>
            <strong className="text-amber-300 font-mono uppercase text-[10px]">Grupo:</strong> {data.weaponGroup}
          </div>
        )}
        {data.weaponRange && (
          <div>
            <strong className="text-cyan-400 font-mono uppercase text-[10px]">Alcance:</strong> {data.weaponRange}
          </div>
        )}
        {data.reload && (
          <div>
            <strong className="text-blue-400 font-mono uppercase text-[10px]">Recarga:</strong> {data.reload}
          </div>
        )}
        {data.armorBonus !== undefined && (
          <div>
            <strong className="text-cyan-400 font-mono uppercase text-[10px]">CA:</strong> +{data.armorBonus}
          </div>
        )}
        {data.dexCap !== undefined && (
          <div>
            <strong className="text-emerald-400 font-mono uppercase text-[10px]">Limite Des:</strong> +{data.dexCap}
          </div>
        )}
        {data.checkPenalty !== undefined && (
          <div>
            <strong className="text-amber-400 font-mono uppercase text-[10px]">Penalidade:</strong> {data.checkPenalty}
          </div>
        )}
        {data.strengthReq !== undefined && (
          <div>
            <strong className="text-zinc-300 font-mono uppercase text-[10px]">Força:</strong> {data.strengthReq}
          </div>
        )}
      </div>

      {/* Activation Block if present */}
      {(data.activation || data.activationAction || data.activationEffect) && (
        <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/60 text-xs space-y-1">
          <div className="font-bold text-purple-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Ativação {data.activationAction ? `[${data.activationAction}]` : ''}</span>
          </div>
          {data.activation && <div className="text-zinc-300">{data.activation}</div>}
          {data.activationEffect && <div className="text-zinc-400 pt-0.5 leading-relaxed">{data.activationEffect}</div>}
        </div>
      )}

      {/* Full Description with No Scrolling */}
      <div className="pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-200 leading-relaxed">
        <RichContentRenderer
          content={data.description || item.summary || 'Sem descrição.'}
          onNavigate={onSelectEntity}
        />
      </div>

      {/* Special Properties / Craft Requirements */}
      {(data.specialProperties || data.craftRequirements) && (
        <div className="pt-2 border-t border-zinc-800/60 text-[11px] space-y-1 text-zinc-300">
          {data.specialProperties && (
            <div>
              <strong className="text-amber-400">Efeitos:</strong> {data.specialProperties}
            </div>
          )}
          {data.craftRequirements && (
            <div>
              <strong className="text-cyan-400">Manufatura:</strong> {data.craftRequirements}
            </div>
          )}
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
  const isActualGm = HecosStorage.isUserGm(currentUser) && (isGmMode !== false);

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
                side="right"
                delay={180}
                noScroll={true}
                className="w-full"
                content={<ItemTooltipCard item={entity} onSelectEntity={onSelectEntity} />}
              >
                <button
                  type="button"
                  onClick={handleCardClick}
                  className="text-left group/title focus:outline-none cursor-pointer block w-full"
                  title={`Abrir item ${itemTitle}`}
                >
                  <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-amber-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(245,158,11,0.85)]">
                    <span className="group-hover/title:underline decoration-amber-400/80 decoration-2 underline-offset-2">
                      {itemTitle}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-amber-400 group-hover/title:translate-x-0.5 transition-all shrink-0 ml-auto" />
                  </h3>
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={handleCardClick}
                className="text-left group/title focus:outline-none cursor-pointer block w-full"
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

        {/* Smart, Compact and Auto-Fitting Item Index Metadata Blocks */}
        <SmartItemCardIndexBlocks data={data} />

        {/* Description snippet */}
        <div className="text-xs text-zinc-400 mt-3 leading-relaxed break-words line-clamp-3">
          <RichContentRenderer
            content={data.description || entity?.summary || 'Sem descrição fornecida.'}
            onNavigate={onSelectEntity}
          />
        </div>
      </div>

      {/* Bottom Footer: Folder Tags (GM only) & Edit/Delete Actions */}
      {isActualGm && (
        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
          {/* Folders assigned to this item (GM Only) */}
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
                  title={`Pasta: ${sub} (Exclusivo GM)`}
                >
                  <Folder className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{sub}</span>
                </span>
              ))
            ) : (
              <span className="text-[10px] text-zinc-600 italic">Sem pasta</span>
            )}

            {/* Manage Folders Trigger Button */}
            {entity && onOpenFolderAssign && (
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
        </div>
      )}
    </div>
  );
};
