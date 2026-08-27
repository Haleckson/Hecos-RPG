import React, { useState } from 'react';
import { HecosEntity, PF2eItemAttributes } from '../types';
import { parseItemFromContent } from '../utils/itemSerializer';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { RichContentRenderer } from './RichContentRenderer';
import { renderContentWithMentions } from './MentionBadge';
import { TraitBadge } from './TraitBadge';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { Tooltip } from './Tooltip';
import {
  Copy,
  Check,
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
  ArrowUpRight,
  ExternalLink,
  Activity,
  Zap
} from 'lucide-react';

interface ItemViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

export const ItemView: React.FC<ItemViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [copied, setCopied] = useState(false);
  const isActualGm = HecosStorage.isUserGm();

  const itemData: PF2eItemAttributes = parseItemFromContent(
    entity.content || '',
    entity.itemData
  );

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

  const hasCombatStats = itemData.damage || itemData.weaponGroup || itemData.weaponRange || itemData.reload;
  const hasArmorStats = itemData.armorBonus !== undefined || itemData.dexCap !== undefined || itemData.checkPenalty !== undefined || itemData.speedPenalty || itemData.strengthReq !== undefined;
  const hasDurability = itemData.hardness !== undefined || itemData.hp !== undefined || itemData.brokenThreshold !== undefined;
  const hasActivation = itemData.activation || itemData.activationAction || itemData.activationTrigger || itemData.activationRequirement || itemData.activationFrequency || itemData.activationEffect;

  const handleCopyStatblock = () => {
    const lines = [
      `${entity.title.toUpperCase()} [ITEM ${itemData.level || 0}]`,
      `Raridade: ${itemData.rarity || 'Comum'} | Preço: ${itemData.price || '—'} | Volume: ${itemData.bulk || '—'}`,
      itemData.traits && itemData.traits.length > 0 ? `Traços: ${itemData.traits.join(', ')}` : '',
      itemData.usage ? `Uso: ${itemData.usage}` : '',
      itemData.activation ? `Ativação: ${itemData.activation}` : '',
      hasCombatStats ? `Combate: Dano ${itemData.damage || '—'} | Grupo: ${itemData.weaponGroup || '—'} | Alcance: ${itemData.weaponRange || '—'}` : '',
      hasArmorStats ? `Defesa: CA +${itemData.armorBonus ?? 0} | Limite Des +${itemData.dexCap ?? '—'} | Penalidade: ${itemData.checkPenalty ?? '0'}` : '',
      itemData.description ? `\n${itemData.description}` : '',
      itemData.specialProperties ? `\nPropriedades Especiais: ${itemData.specialProperties}` : '',
      itemData.craftRequirements ? `\nRequisitos de Manufatura: ${itemData.craftRequirements}` : '',
      itemData.hecosLore ? `\nHistória em Hecos: ${itemData.hecosLore}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allEntities = HecosStorage.getEntities();
  const backlinks = allEntities.filter((other) => {
    if (other.id === entity.id) return false;
    const cleanSlug = entity.slug || entity.id;
    return (
      other.content.includes(`@${cleanSlug}`) ||
      other.content.includes(`@${entity.id}`) ||
      other.content.includes(`[[${entity.title}]]`)
    );
  });

  const perm = HecosStorage.getEntityPermission(entity.id);

  return (
    <div className="bg-[#09080e] text-zinc-100 rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden">
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-[#151024] via-[#0e0a1a] to-[#09080e] border-b border-zinc-800/80 relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-[280px]">
            {/* Badges Bar: Level, Rarity, Subcategories */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                Item {itemData.level ?? 0}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border shadow-xs ${getRarityBadgeStyle(itemData.rarity || 'Comum')}`}>
                {itemData.rarity || 'Comum'}
              </span>
              {itemData.subcategories && itemData.subcategories.map((sub) => (
                <span
                  key={sub}
                  onClick={() => onTagClick?.(sub)}
                  className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/40 hover:border-amber-500 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Folder className="w-3 h-3" />
                  <span>{sub}</span>
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-tight flex items-center gap-3">
              <Package className="w-7 h-7 text-amber-400 shrink-0" />
              <span>{entity.title}</span>
            </h1>

            {entity.subtitle && (
              <p className="text-sm text-zinc-400 italic">{entity.subtitle}</p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {isActualGm && (
              <VisibilityBadgeMenu
                visibility={perm.visibility}
                allowedUserIds={perm.allowedUserIds}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityPermission(entity.id, newVis, newAllowed);
                }}
              />
            )}

            <Tooltip title="Copiar Ficha" description="Copiar bloco de estatísticas para a área de transferência">
              <button
                type="button"
                onClick={handleCopyStatblock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </Tooltip>

            {isActualGm && onEdit && (
              <Tooltip title="Editar Item" description="Abrir formulário completo de edição">
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 text-amber-300 text-xs font-bold transition-all shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              </Tooltip>
            )}

            {isActualGm && onDelete && (
              <Tooltip title="Mover para a Lixeira" description="Excluir este item com segurança">
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-2 rounded-xl bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-600/50 text-zinc-400 hover:text-rose-300 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Hierarchical Trait Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mt-4 pt-3 border-t border-zinc-800/60">
          {sortTraitsHierarchically(
            itemData.traits || [],
            { rarity: itemData.rarity || 'Comum' }
          ).map((t) => (
            <TraitBadge
              key={t}
              trait={t}
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } })
                );
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Core Metadata Bar: Price, Bulk, Usage, Hands */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#100d1c] border border-zinc-800/90 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/50 text-amber-400">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-zinc-400">Preço</div>
              <div className="text-sm font-bold text-amber-200">{itemData.price || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700/60 text-zinc-300">
              <Weight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-zinc-400">Volume (Bulk)</div>
              <div className="text-sm font-bold text-zinc-200">{itemData.bulk || '—'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-800/50 text-purple-300">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-zinc-400">Uso & Mãos</div>
              <div className="text-sm font-bold text-zinc-200 truncate">
                {itemData.usage || itemData.hands || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Activation Panel (if applicable) */}
        {hasActivation && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-[#130f24] to-[#100d1c] border border-purple-800/40 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap text-sm font-bold text-purple-300">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Ativação</span>
              {itemData.activationAction && (
                <div className="inline-flex items-center gap-1 ml-1">
                  <PF2eActionGlyph
                    type={getActionGlyphProp(itemData.activationAction).type}
                    size="sm"
                  />
                  <span className="text-xs text-purple-200">[{itemData.activationAction}]</span>
                </div>
              )}
              {itemData.activation && (
                <span className="text-xs text-zinc-300">— {itemData.activation}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
              {itemData.activationFrequency && (
                <div>
                  <strong className="text-purple-400">Frequência:</strong> {itemData.activationFrequency}
                </div>
              )}
              {itemData.activationTrigger && (
                <div>
                  <strong className="text-purple-400">Gatilho:</strong> {itemData.activationTrigger}
                </div>
              )}
              {itemData.activationRequirement && (
                <div className="sm:col-span-2">
                  <strong className="text-purple-400">Requisitos:</strong> {itemData.activationRequirement}
                </div>
              )}
            </div>

            {itemData.activationEffect && (
              <div className="pt-2 border-t border-purple-900/40 text-xs text-zinc-200 leading-relaxed">
                <strong className="text-purple-300">Efeito:</strong> {renderContentWithMentions(itemData.activationEffect, onNavigate)}
              </div>
            )}
          </div>
        )}

        {/* Combat / Weapon Stats (if applicable) */}
        {hasCombatStats && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Estatísticas de Combate</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {itemData.damage && (
                <div className="p-2 rounded-lg bg-black/40 border border-amber-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Dano</span>
                  <span className="font-bold text-amber-300">{itemData.damage} {itemData.damageType ? `(${itemData.damageType})` : ''}</span>
                </div>
              )}
              {itemData.weaponGroup && (
                <div className="p-2 rounded-lg bg-black/40 border border-amber-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Grupo</span>
                  <span className="font-bold text-zinc-200">{itemData.weaponGroup}</span>
                </div>
              )}
              {itemData.weaponRange && (
                <div className="p-2 rounded-lg bg-black/40 border border-amber-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Alcance</span>
                  <span className="font-bold text-zinc-200">{itemData.weaponRange}</span>
                </div>
              )}
              {itemData.reload && (
                <div className="p-2 rounded-lg bg-black/40 border border-amber-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Recarga</span>
                  <span className="font-bold text-zinc-200">{itemData.reload}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Armor & Shield Stats (if applicable) */}
        {hasArmorStats && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Estatísticas de Armadura & Defesa</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {itemData.armorBonus !== undefined && (
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Bônus CA</span>
                  <span className="font-bold text-cyan-300">+{itemData.armorBonus}</span>
                </div>
              )}
              {itemData.dexCap !== undefined && (
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Limite Des</span>
                  <span className="font-bold text-zinc-200">+{itemData.dexCap}</span>
                </div>
              )}
              {itemData.checkPenalty !== undefined && (
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Penalidade Teste</span>
                  <span className="font-bold text-zinc-200">{itemData.checkPenalty}</span>
                </div>
              )}
              {itemData.speedPenalty && (
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Velocidade</span>
                  <span className="font-bold text-zinc-200">{itemData.speedPenalty}</span>
                </div>
              )}
              {itemData.strengthReq !== undefined && (
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-900/30">
                  <span className="text-zinc-400 text-[10px] uppercase block">Força Mín.</span>
                  <span className="font-bold text-zinc-200">{itemData.strengthReq}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Durability Stats (if applicable) */}
        {hasDurability && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex-wrap">
            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Estrutura & Dureza:</span>
            {itemData.hardness !== undefined && (
              <span className="text-zinc-300"><strong className="text-zinc-100">Dureza:</strong> {itemData.hardness}</span>
            )}
            {itemData.hp !== undefined && (
              <span className="text-zinc-300"><strong className="text-zinc-100">PV:</strong> {itemData.hp}</span>
            )}
            {itemData.brokenThreshold !== undefined && (
              <span className="text-zinc-300"><strong className="text-zinc-100">Limiar de Quebra (LD):</strong> {itemData.brokenThreshold}</span>
            )}
          </div>
        )}

        {/* Description */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-mono font-bold text-zinc-400 tracking-wider">
            Descrição do Item
          </h3>
          <div className="text-sm text-zinc-200 leading-relaxed bg-[#0c0915] p-5 rounded-xl border border-zinc-800/80">
            {itemData.description ? (
              <RichContentRenderer
                content={itemData.description}
                onNavigate={onNavigate}
              />
            ) : (
              <p className="text-zinc-500 italic">Sem descrição detalhada para este item.</p>
            )}
          </div>
        </div>

        {/* Special Properties & Runes */}
        {itemData.specialProperties && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Propriedades Especiais & Efeitos</span>
            </h4>
            <div className="text-xs text-zinc-200 leading-relaxed">
              {renderContentWithMentions(itemData.specialProperties, onNavigate)}
            </div>
          </div>
        )}

        {/* Crafting Requirements & Formulas */}
        {(itemData.craftRequirements || itemData.craftFormula) && (
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center gap-1.5">
              <Hammer className="w-3.5 h-3.5" />
              <span>Manufatura & Requisitos de Forja</span>
            </h4>
            {itemData.craftFormula && (
              <div className="text-xs text-zinc-300">
                <strong className="text-cyan-300">Fórmula:</strong> {itemData.craftFormula}
              </div>
            )}
            {itemData.craftRequirements && (
              <div className="text-xs text-zinc-300">
                <strong className="text-cyan-300">Requisitos:</strong> {itemData.craftRequirements}
              </div>
            )}
          </div>
        )}

        {/* Hecos Lore & Origins */}
        {itemData.hecosLore && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-2">
            <h4 className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-1.5">
              <Scroll className="w-3.5 h-3.5" />
              <span>História & Lore de Hecos</span>
            </h4>
            <div className="text-xs text-zinc-300 leading-relaxed">
              {renderContentWithMentions(itemData.hecosLore, onNavigate)}
            </div>
          </div>
        )}

        {/* GM Secret Notes */}
        {isActualGm && itemData.gmNotes && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-2">
            <h4 className="text-xs font-bold text-rose-400 uppercase font-mono flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Segredo do Mestre (GM)</span>
            </h4>
            <div className="text-xs text-rose-200 leading-relaxed">
              {renderContentWithMentions(itemData.gmNotes, onNavigate)}
            </div>
          </div>
        )}

        {/* Backlinks */}
        {backlinks.length > 0 && (
          <div className="pt-4 border-t border-zinc-800/80 space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Mencionado em ({backlinks.length})</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {backlinks.map((bl) => (
                <button
                  key={bl.id}
                  type="button"
                  onClick={() => onNavigate(bl.id)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-xs text-zinc-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{bl.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
