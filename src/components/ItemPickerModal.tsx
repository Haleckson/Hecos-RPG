import React, { useState, useMemo } from 'react';
import { HecosEntity, ItemCategoryType, PerilLootItem, PF2eItemAttributes } from '../types';
import { HecosStorage } from '../services/storage';
import { parseItemFromContent } from '../utils/itemSerializer';
import { TraitBadge } from './TraitBadge';
import {
  Search,
  CheckSquare,
  Square,
  Check,
  X,
  Package,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Coins,
  Shield,
  Swords,
  Weight,
  FlaskConical,
  Scroll,
  Hammer,
  Layers,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';

interface ItemPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onSelectItems: (
    selected: {
      entity: HecosEntity;
      parsedItem: PF2eItemAttributes;
      quantity: number | string;
      notes?: string;
    }[]
  ) => void;
  alreadyAddedItemIds?: string[];
  alreadyAddedItemNames?: string[];
  perilName?: string;
  onNavigate?: (id: string) => void;
}

const ITEM_CATEGORY_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  all: { label: 'Todos os Itens', icon: Layers },
  weapons: { label: 'Armas', icon: Swords },
  armor: { label: 'Armaduras', icon: Shield },
  shields: { label: 'Escudos', icon: Shield },
  consumables: { label: 'Consumíveis', icon: Scroll },
  alchemical: { label: 'Alquímicos', icon: FlaskConical },
  magical: { label: 'Mágicos & Varinhas', icon: Sparkles },
  artifacts: { label: 'Artefatos & Relíquias', icon: Hammer },
  gear: { label: 'Equipamento Geral', icon: Package },
  extras: { label: 'Extras & Outros', icon: Package },
};

export const ItemPickerModal: React.FC<ItemPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectItems,
  alreadyAddedItemIds = [],
  alreadyAddedItemNames = [],
  perilName = '',
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Map of selected entity ID to { quantity, notes }
  const [selectedItemsMap, setSelectedItemsMap] = useState<
    Record<string, { quantity: number; notes: string }>
  >({});

  // Fetch all items from the system
  const allItemEntities = useMemo(() => {
    if (!isOpen) return [];
    const entities = HecosStorage.getEntities();
    return entities.filter((e) => e.category === 'item' || Boolean(e.itemData));
  }, [isOpen]);

  // Pre-parse items with structured attributes
  const parsedItems = useMemo(() => {
    return allItemEntities.map((entity) => {
      const parsed = parseItemFromContent(entity.content || '', entity.itemData);
      return {
        entity,
        parsed,
      };
    });
  }, [allItemEntities]);

  // Filtered items list
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return parsedItems.filter(({ entity, parsed }) => {
      // 1. Search Query
      if (q) {
        const matchTitle = (entity.title || '').toLowerCase().includes(q);
        const matchDesc = (parsed.description || '').toLowerCase().includes(q);
        const matchTraits = (parsed.traits || []).some((t) => (t || '').toLowerCase().includes(q));
        const matchPrice = (parsed.price || '').toLowerCase().includes(q);
        const matchSub = (entity.subtitle || '').toLowerCase().includes(q);
        const matchSpecial = (parsed.specialProperties || '').toLowerCase().includes(q);

        if (!matchTitle && !matchDesc && !matchTraits && !matchPrice && !matchSub && !matchSpecial) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategoryFilter !== 'all') {
        const itemType = parsed.itemType || 'gear';
        if (itemType !== selectedCategoryFilter) {
          return false;
        }
      }

      // 3. Rarity Filter
      if (selectedRarityFilter !== 'all') {
        const r = (parsed.rarity || 'Comum').toLowerCase();
        if (r !== selectedRarityFilter.toLowerCase()) {
          return false;
        }
      }

      // 4. Level Filter
      if (selectedLevelFilter !== 'all') {
        const lvl = parsed.level ?? 1;
        if (selectedLevelFilter === '0-4' && (lvl < 0 || lvl > 4)) return false;
        if (selectedLevelFilter === '5-8' && (lvl < 5 || lvl > 8)) return false;
        if (selectedLevelFilter === '9-12' && (lvl < 9 || lvl > 12)) return false;
        if (selectedLevelFilter === '13-16' && (lvl < 13 || lvl > 16)) return false;
        if (selectedLevelFilter === '17+' && lvl < 17) return false;
      }

      return true;
    });
  }, [parsedItems, searchQuery, selectedCategoryFilter, selectedRarityFilter, selectedLevelFilter]);

  if (!isOpen) return null;

  const isAlreadyAdded = (id: string, name?: string) => {
    const target = (name || '').trim().toLowerCase();
    return (
      alreadyAddedItemIds.includes(id) ||
      (target.length > 0 && alreadyAddedItemNames.some((n) => (n || '').trim().toLowerCase() === target))
    );
  };

  const toggleSelectItem = (entityId: string) => {
    setSelectedItemsMap((prev) => {
      const copy = { ...prev };
      if (copy[entityId]) {
        delete copy[entityId];
      } else {
        copy[entityId] = { quantity: 1, notes: '' };
      }
      return copy;
    });
  };

  const updateItemQuantity = (entityId: string, delta: number) => {
    setSelectedItemsMap((prev) => {
      const current = prev[entityId] || { quantity: 1, notes: '' };
      const newQty = Math.max(1, current.quantity + delta);
      return {
        ...prev,
        [entityId]: { ...current, quantity: newQty },
      };
    });
  };

  const setItemQuantity = (entityId: string, qty: number) => {
    setSelectedItemsMap((prev) => {
      const current = prev[entityId] || { quantity: 1, notes: '' };
      return {
        ...prev,
        [entityId]: { ...current, quantity: Math.max(1, qty) },
      };
    });
  };

  const updateItemNotes = (entityId: string, notes: string) => {
    setSelectedItemsMap((prev) => {
      const current = prev[entityId] || { quantity: 1, notes: '' };
      return {
        ...prev,
        [entityId]: { ...current, notes },
      };
    });
  };

  const handleSelectAllVisible = () => {
    const newMap = { ...selectedItemsMap };
    filteredItems.forEach(({ entity }) => {
      if (!isAlreadyAdded(entity.id, entity.title) && !newMap[entity.id]) {
        newMap[entity.id] = { quantity: 1, notes: '' };
      }
    });
    setSelectedItemsMap(newMap);
  };

  const handleDeselectAll = () => {
    setSelectedItemsMap({});
  };

  const handleConfirm = () => {
    const selectedList: {
      entity: HecosEntity;
      parsedItem: PF2eItemAttributes;
      quantity: number | string;
      notes?: string;
    }[] = [];

    parsedItems.forEach((item) => {
      const entry = selectedItemsMap[item.entity.id];
      if (entry) {
        selectedList.push({
          entity: item.entity,
          parsedItem: item.parsed,
          quantity: entry.quantity,
          notes: entry.notes.trim() || undefined,
        });
      }
    });

    onSelectItems(selectedList);
    setSelectedItemsMap({});
    onClose();
  };

  const selectedCount = Object.keys(selectedItemsMap).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0d0b16] border border-amber-900/60 shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-[#141022] border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300 flex items-center gap-2">
                <span>Buscar & Incluir Itens ao Loot</span>
                {perilName && (
                  <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-200 border border-amber-800/70 font-mono">
                    para {perilName}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Selecione itens existentes no Compêndio de Itens para vincular diretamente ao tesouro e pilhagem do perigo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800 cursor-pointer"
            title="Fechar busca de itens"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS & SEARCH BAR */}
        <div className="p-3.5 sm:p-4 bg-[#0a0812] border-b border-zinc-800/80 space-y-3">
          {/* Main search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise por nome do item, traços (ex: Mágico, Ágil), preço, propriedades ou descrição..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141220] border border-zinc-700/80 focus:border-amber-500 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {Object.entries(ITEM_CATEGORY_LABELS).map(([catKey, catInfo]) => {
              const CatIcon = catInfo.icon;
              const isSelected = selectedCategoryFilter === catKey;
              const count =
                catKey === 'all'
                  ? parsedItems.length
                  : parsedItems.filter((i) => (i.parsed.itemType || 'gear') === catKey).length;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(catKey)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700 shadow-sm'
                      : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{catInfo.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters: Rarity and Level */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs border-t border-zinc-800/60">
            <div className="flex flex-wrap items-center gap-3">
              {/* Rarity filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-semibold">Raridade:</span>
                <select
                  value={selectedRarityFilter}
                  onChange={(e) => setSelectedRarityFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#141220] border border-zinc-700/80 text-xs text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="all">Todas as Raridades</option>
                  <option value="comum">Comum</option>
                  <option value="incomum">Incomum</option>
                  <option value="raro">Raro</option>
                  <option value="único">Único</option>
                </select>
              </div>

              {/* Level Range filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-semibold">Nível:</span>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-[#141220] border border-zinc-700/80 text-xs text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="all">Todos os Níveis</option>
                  <option value="0-4">Nível 0 – 4 (Iniciante)</option>
                  <option value="5-8">Nível 5 – 8 (Heroico)</option>
                  <option value="9-12">Nível 9 – 12 (Mestre)</option>
                  <option value="13-16">Nível 13 – 16 (Lendário)</option>
                  <option value="17+">Nível 17+ (Mítico)</option>
                </select>
              </div>
            </div>

            {/* Quick Bulk Selection Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
              >
                Marcar visíveis
              </button>
              {selectedCount > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-300 hover:underline cursor-pointer"
                  >
                    Desmarcar todos ({selectedCount})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS LIST BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar bg-[#090710]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Package className="w-10 h-10 mx-auto text-zinc-600 opacity-50" />
              <p className="text-sm font-medium">Nenhum item encontrado para os filtros aplicados.</p>
              <p className="text-xs text-zinc-600">
                Tente ajustar a busca por texto ou os seletores de categoria/nível acima.
              </p>
            </div>
          ) : (
            filteredItems.map(({ entity, parsed }) => {
              const isSelected = Boolean(selectedItemsMap[entity.id]);
              const alreadyAdded = isAlreadyAdded(entity.id, entity.title);
              const isExpanded = expandedItemId === entity.id;
              const selectionData = selectedItemsMap[entity.id] || { quantity: 1, notes: '' };

              const rarity = parsed.rarity || 'Comum';
              const rarityColorClass =
                rarity.toLowerCase() === 'incomum'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                  : rarity.toLowerCase() === 'raro'
                  ? 'bg-blue-950/80 text-blue-300 border-blue-700'
                  : rarity.toLowerCase() === 'único' || rarity.toLowerCase() === 'unico'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-700'
                  : 'bg-zinc-800/80 text-zinc-300 border-zinc-700';

              return (
                <div
                  key={entity.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#181326] border-amber-600/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : alreadyAdded
                      ? 'bg-[#100e18]/60 border-zinc-800/60 opacity-80'
                      : 'bg-[#110e1c] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(entity.id)}
                      className="mt-1 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>

                    {/* Item Info Main Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            onClick={() => toggleSelectItem(entity.id)}
                            className={`text-sm sm:text-base font-extrabold cursor-pointer hover:underline ${
                              isSelected ? 'text-amber-300' : 'text-zinc-100'
                            }`}
                          >
                            {entity.title}
                          </h4>

                          {/* Level badge */}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800">
                            Nível {parsed.level ?? 1}
                          </span>

                          {/* Rarity badge */}
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${rarityColorClass}`}>
                            {rarity}
                          </span>

                          {/* Already Added Badge */}
                          {alreadyAdded && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Já no Loot</span>
                            </span>
                          )}
                        </div>

                        {/* Price & Bulk Details */}
                        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                          {parsed.price && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/50 text-amber-300 border border-amber-800/60 font-bold">
                              <Coins className="w-3 h-3 text-amber-400" />
                              <span>{parsed.price}</span>
                            </span>
                          )}
                          {parsed.bulk && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 text-[11px]">
                              <Weight className="w-3 h-3 text-zinc-400" />
                              <span>Vol. {parsed.bulk}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Traits Chips */}
                      {parsed.traits && parsed.traits.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {parsed.traits.map((t, idx) => (
                            <span
                              key={`${entity.id}-t-${idx}`}
                              className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Short Description */}
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                        {parsed.description || entity.subtitle || 'Sem descrição detalhada.'}
                      </p>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-300 animate-in fade-in duration-150">
                          {parsed.specialProperties && (
                            <div className="p-2 rounded-xl bg-black/40 border border-amber-900/40 text-amber-200">
                              <strong className="text-amber-400">Propriedades & Runas:</strong> {parsed.specialProperties}
                            </div>
                          )}
                          {parsed.usage && (
                            <div>
                              <strong className="text-zinc-200">Uso / Mãos:</strong> {parsed.usage} {parsed.hands ? `(${parsed.hands})` : ''}
                            </div>
                          )}
                          {parsed.damage && (
                            <div>
                              <strong className="text-rose-300">Dano da Arma:</strong> {parsed.damage} {parsed.damageType ? `(${parsed.damageType})` : ''}
                            </div>
                          )}
                          {parsed.armorBonus !== undefined && (
                            <div>
                              <strong className="text-cyan-300">Bônus de Armadura:</strong> +{parsed.armorBonus} (Des Max +{parsed.dexCap ?? '—'})
                            </div>
                          )}
                          {parsed.activation && (
                            <div className="text-purple-300">
                              <strong>Ativação:</strong> {parsed.activation}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Inline Selection Controls when checked */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-amber-900/40 flex flex-wrap items-center justify-between gap-3 bg-amber-950/20 p-2.5 rounded-xl">
                          {/* Quantity control */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-300 font-mono">Quantidade:</span>
                            <div className="flex items-center bg-black/60 border border-zinc-700 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(entity.id, -1)}
                                className="p-1 hover:bg-zinc-800 text-zinc-300 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={selectionData.quantity}
                                onChange={(e) => setItemQuantity(entity.id, parseInt(e.target.value, 10) || 1)}
                                className="w-12 text-center text-xs font-mono font-bold bg-transparent text-amber-300 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(entity.id, 1)}
                                className="p-1 hover:bg-zinc-800 text-zinc-300 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick note / location input */}
                          <div className="flex-1 min-w-[200px]">
                            <input
                              type="text"
                              value={selectionData.notes}
                              onChange={(e) => updateItemNotes(entity.id, e.target.value)}
                              placeholder="Onde está localizado? (ex: Na bolsa, Empunhado, No baú)"
                              className="w-full px-2.5 py-1 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:border-amber-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse details toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedItemId(isExpanded ? null : entity.id)}
                      className="p-1 text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 mt-0.5"
                      title={isExpanded ? 'Recolher detalhes' : 'Ver mais detalhes'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 bg-[#141022] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 font-mono">
            {selectedCount > 0 ? (
              <span className="text-amber-300 font-bold">
                {selectedCount} {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            ) : (
              <span>Selecione itens clicando na caixa de seleção</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors border border-zinc-800 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                selectedCount > 0
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {selectedCount > 0
                  ? `Adicionar ${selectedCount} ${selectedCount === 1 ? 'Item' : 'Itens'} ao Loot`
                  : 'Nenhum Item Selecionado'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
