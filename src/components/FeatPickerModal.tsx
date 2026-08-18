import React, { useState, useMemo } from 'react';
import { HecosEntity, AncestryFeat } from '../types';
import { HecosStorage } from '../services/storage';
import { parseFeatFromContent, getFeatTypeLabel, getActionSymbol } from '../utils/featSerializer';
import { PF2eActionGlyph } from './PF2eActionGlyph';
import { RichContentRenderer } from './RichContentRenderer';
import {
  Search,
  CheckSquare,
  Square,
  Check,
  X,
  Zap,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Link as LinkIcon,
  Shield,
  Layers
} from 'lucide-react';

interface FeatPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeats: (
    selected: {
      entity: HecosEntity;
      parsedFeat: ReturnType<typeof parseFeatFromContent>;
      targetRank: 1 | 5 | 9 | 13 | 17;
    }[]
  ) => void;
  alreadyAddedFeatEntityIds?: string[];
  alreadyAddedFeatNames?: string[];
  defaultRank?: 1 | 5 | 9 | 13 | 17;
  ancestryName?: string;
  onNavigate?: (id: string) => void;
}

export const FeatPickerModal: React.FC<FeatPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFeats,
  alreadyAddedFeatEntityIds = [],
  alreadyAddedFeatNames = [],
  defaultRank = 1,
  ancestryName = '',
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRankFilter, setSelectedRankFilter] = useState<'all' | 1 | 5 | 9 | 13 | 17>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedFeatId, setExpandedFeatId] = useState<string | null>(null);

  // Map of selected entity ID to target rank
  const [selectedFeatsMap, setSelectedFeatsMap] = useState<Record<string, 1 | 5 | 9 | 13 | 17>>({});

  // Fetch all feats from the system
  const allFeatEntities = useMemo(() => {
    const entities = HecosStorage.getEntities();
    return entities.filter((e) => e.category === 'feat');
  }, [isOpen]);

  // Pre-parse feats with their attributes
  const parsedFeats = useMemo(() => {
    return allFeatEntities.map((entity) => {
      const parsed = parseFeatFromContent(entity.title, entity.content || '', entity.featData);
      
      // Calculate recommended PF2e ancestry feat rank based on level
      let recommendedRank: 1 | 5 | 9 | 13 | 17 = 1;
      const lvl = parsed.level || 1;
      if (lvl >= 17) recommendedRank = 17;
      else if (lvl >= 13) recommendedRank = 13;
      else if (lvl >= 9) recommendedRank = 9;
      else if (lvl >= 5) recommendedRank = 5;
      else recommendedRank = 1;

      return {
        entity,
        parsed,
        recommendedRank,
      };
    });
  }, [allFeatEntities]);

  // Filtered feats list
  const filteredFeats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return parsedFeats.filter(({ entity, parsed, recommendedRank }) => {
      // 1. Search Query
      if (q) {
        const matchTitle = (entity?.title || '').toLowerCase().includes(q);
        const matchDesc = (parsed?.description || '').toLowerCase().includes(q);
        const matchTraits = (parsed?.traits || []).some((t) => (t || '').toLowerCase().includes(q));
        const matchPrereq = (parsed?.prerequisites || '').toLowerCase().includes(q);
        const matchType = (getFeatTypeLabel(parsed?.featType) || '').toLowerCase().includes(q);
        const matchSub = (entity?.subtitle || '').toLowerCase().includes(q);

        if (!matchTitle && !matchDesc && !matchTraits && !matchPrereq && !matchType && !matchSub) {
          return false;
        }
      }

      // 2. Rank Filter
      if (selectedRankFilter !== 'all') {
        if (recommendedRank !== selectedRankFilter) {
          return false;
        }
      }

      // 3. Type Filter
      if (selectedTypeFilter !== 'all') {
        if (parsed?.featType !== selectedTypeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [parsedFeats, searchQuery, selectedRankFilter, selectedTypeFilter]);

  if (!isOpen) return null;

  const isAlreadyAdded = (id: string, name?: string) => {
    const target = (name || '').trim().toLowerCase();
    return (
      alreadyAddedFeatEntityIds.includes(id) ||
      (target.length > 0 && alreadyAddedFeatNames.some((n) => (n || '').trim().toLowerCase() === target))
    );
  };

  const toggleSelectFeat = (entityId: string, defaultTargetRank: 1 | 5 | 9 | 13 | 17) => {
    setSelectedFeatsMap((prev) => {
      const copy = { ...prev };
      if (copy[entityId]) {
        delete copy[entityId];
      } else {
        copy[entityId] = defaultTargetRank;
      }
      return copy;
    });
  };

  const changeTargetRank = (entityId: string, rank: 1 | 5 | 9 | 13 | 17) => {
    setSelectedFeatsMap((prev) => ({
      ...prev,
      [entityId]: rank,
    }));
  };

  const handleSelectAllVisible = () => {
    const newMap: Record<string, 1 | 5 | 9 | 13 | 17> = { ...selectedFeatsMap };
    filteredFeats.forEach(({ entity, recommendedRank }) => {
      if (!isAlreadyAdded(entity.id, entity.title)) {
        newMap[entity.id] = selectedRankFilter !== 'all' ? selectedRankFilter : (defaultRank || recommendedRank);
      }
    });
    setSelectedFeatsMap(newMap);
  };

  const handleDeselectAll = () => {
    setSelectedFeatsMap({});
  };

  const handleConfirm = () => {
    const selectedList: {
      entity: HecosEntity;
      parsedFeat: ReturnType<typeof parseFeatFromContent>;
      targetRank: 1 | 5 | 9 | 13 | 17;
    }[] = [];

    parsedFeats.forEach((item) => {
      const targetRank = selectedFeatsMap[item.entity.id];
      if (targetRank) {
        selectedList.push({
          entity: item.entity,
          parsedFeat: item.parsed,
          targetRank,
        });
      }
    });

    onSelectFeats(selectedList);
    setSelectedFeatsMap({});
    onClose();
  };

  const selectedCount = Object.keys(selectedFeatsMap).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0d0b16] border border-[#2e4f5a] shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-[#131022] border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#74b6c2] flex items-center gap-2">
                <span>Buscar & Incluir Talentos do Sistema</span>
                {ancestryName && (
                  <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1b2a32] text-[#88c5d0] border border-[#2e4f5a]/70">
                    para {ancestryName}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Selecione talentos existentes no Codex de Talentos para vincular diretamente à ancestralidade.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors border border-zinc-800 cursor-pointer"
            title="Fechar busca"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS & SEARCH BAR */}
        <div className="p-3.5 sm:p-4 bg-[#0a0812] border-b border-zinc-800/80 space-y-3">
          {/* Main search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#74b6c2] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquise por nome do talento, traços (ex: Mágico, Ocultismo), nível, requisitos..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141220] border border-zinc-700/80 focus:border-[#74b6c2] text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
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

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Rank quick filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-zinc-500 font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-[#74b6c2]" />
                <span>Rank:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedRankFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedRankFilter === 'all'
                    ? 'bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                Todos ({parsedFeats.length})
              </button>
              {([1, 5, 9, 13, 17] as const).map((r) => {
                const count = parsedFeats.filter((f) => f.recommendedRank === r).length;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRankFilter(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedRankFilter === r
                        ? 'bg-[#241e33] text-[#b19ecc] border border-[#493b61]'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span>Rank {r}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-semibold">Tipo:</span>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#141220] border border-zinc-700/80 text-xs text-zinc-200 outline-none cursor-pointer font-medium"
              >
                <option value="all">Todos os Tipos</option>
                <option value="ancestry">Ancestralidade</option>
                <option value="class">Classe</option>
                <option value="general">Geral</option>
                <option value="skill">Perícia</option>
                <option value="archetype">Arquétipo</option>
                <option value="hecos">Hecos Específico</option>
              </select>
            </div>
          </div>

          {/* Quick selection actions */}
          <div className="flex items-center justify-between gap-3 text-xs pt-1 border-t border-zinc-800/60">
            <div className="text-zinc-400">
              Mostrando <strong className="text-zinc-200">{filteredFeats.length}</strong> talentos disponíveis
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#74b6c2] border border-zinc-800 font-semibold transition-colors flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Marcar Todos Visíveis</span>
              </button>

              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-300 border border-zinc-800 font-semibold transition-colors flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Desmarcar ({selectedCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FEATS LIST SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll bg-[#0b0914]">
          {filteredFeats.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-300">Nenhum talento encontrado</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                {allFeatEntities.length === 0
                  ? 'Você ainda não possui artigos na categoria "Talentos" (Feats). Crie novos talentos pelo menu lateral para selecioná-los aqui!'
                  : 'Nenhum talento corresponde aos filtros de pesquisa atuais. Tente limpar os termos ou mudar o rank.'}
              </p>
            </div>
          ) : (
            filteredFeats.map(({ entity, parsed, recommendedRank }) => {
              const isSelected = !!selectedFeatsMap[entity.id];
              const currentRank = selectedFeatsMap[entity.id] || defaultRank || recommendedRank;
              const alreadyInAncestry = isAlreadyAdded(entity.id, entity.title);
              const isExpanded = expandedFeatId === entity.id;

              return (
                <div
                  key={entity.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#14232b] border-[#74b6c2] shadow-md ring-1 ring-[#74b6c2]/40'
                      : alreadyInAncestry
                      ? 'bg-[#100e1a]/70 border-zinc-800/80 opacity-80'
                      : 'bg-[#100e1c] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Checkbox and Title */}
                    <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                      <button
                        type="button"
                        onClick={() => toggleSelectFeat(entity.id, defaultRank || recommendedRank)}
                        className={`mt-0.5 p-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#74b6c2] text-black border-[#74b6c2]'
                            : 'bg-[#1a1727] text-transparent hover:text-zinc-400 border-zinc-700'
                        }`}
                        title={isSelected ? 'Desmarcar talento' : 'Marcar talento para inclusão'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            onClick={() => toggleSelectFeat(entity.id, defaultRank || recommendedRank)}
                            className="font-bold text-zinc-100 hover:text-[#74b6c2] cursor-pointer text-sm sm:text-base flex items-center gap-1.5 transition-colors"
                          >
                            <span>{entity.title}</span>
                          </h4>

                          {/* Action Glyph */}
                          {parsed.actionCost && (
                            <PF2eActionGlyph
                              action={
                                parsed.actionCost === 'passive'
                                  ? 'passive'
                                  : parsed.actionCost === 'free'
                                  ? 'free'
                                  : parsed.actionCost === 'reaction'
                                  ? 'reaction'
                                  : (parseInt(parsed.actionCost as string, 10) as 1 | 2 | 3) || 'passive'
                              }
                            />
                          )}

                          {/* Level / Rank Badge */}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1e172a] text-[#b19ecc] border border-[#493b61]">
                            Talento {parsed.level || 1} (Rank {recommendedRank})
                          </span>

                          {/* Type */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700 uppercase">
                            {getFeatTypeLabel(parsed.featType)}
                          </span>

                          {/* Already in ancestry badge */}
                          {alreadyInAncestry && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ✓ Já Incluído
                            </span>
                          )}
                        </div>

                        {/* Traits & Prereq preview */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                          {parsed.traits && parsed.traits.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {parsed.traits.map((t, ti) => (
                                <span
                                  key={ti}
                                  className="text-[10px] px-1.5 py-0.2 rounded bg-[#151c20] text-[#74b6c2] border border-[#2d3a42] font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {parsed.prerequisites && (
                            <span className="text-zinc-400 text-xs">
                              <strong className="text-zinc-300">Pré-req:</strong> {parsed.prerequisites}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rank Assignment Selector (if selected) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <div className="flex items-center gap-1.5 bg-[#0a1216] px-2.5 py-1 rounded-xl border border-[#2e4f5a]">
                          <span className="text-[11px] font-bold text-[#74b6c2]">Destino:</span>
                          <select
                            value={currentRank}
                            onChange={(e) =>
                              changeTargetRank(
                                entity.id,
                                parseInt(e.target.value, 10) as 1 | 5 | 9 | 13 | 17
                              )
                            }
                            className="bg-[#14232b] text-xs font-extrabold text-[#74b6c2] border border-[#2e4f5a] rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                          >
                            <option value={1}>Rank 1</option>
                            <option value={5}>Rank 5</option>
                            <option value={9}>Rank 9</option>
                            <option value={13}>Rank 13</option>
                            <option value={17}>Rank 17</option>
                          </select>
                        </div>
                      )}

                      {/* Expand / Collapse Details Button */}
                      <button
                        type="button"
                        onClick={() => setExpandedFeatId(isExpanded ? null : entity.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
                        title={isExpanded ? 'Recolher detalhes' : 'Ver efeito completo'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded description & details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs sm:text-sm text-zinc-300 space-y-2 bg-[#090810] p-3 rounded-lg">
                      {parsed.requirements && (
                        <div className="text-zinc-400">
                          <strong className="text-zinc-200">Requisitos:</strong> {parsed.requirements}
                        </div>
                      )}
                      {parsed.trigger && (
                        <div className="text-rose-300">
                          <strong className="text-rose-200">Gatilho:</strong> {parsed.trigger}
                        </div>
                      )}
                      <div className="leading-relaxed">
                        <RichContentRenderer
                          content={parsed.description || 'Sem descrição.'}
                          onNavigate={onNavigate}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-4 bg-[#131022] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {selectedCount > 0 ? (
              <span className="text-[#74b6c2] font-bold">
                ✓ {selectedCount} talento{selectedCount > 1 ? 's' : ''} pronto{selectedCount > 1 ? 's' : ''} para inclusão
              </span>
            ) : (
              <span>Nenhum talento marcado ainda. Marque os talentos que deseja adicionar.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedCount === 0}
              className={`px-5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                selectedCount > 0
                  ? 'bg-gradient-to-r from-[#74b6c2] to-[#5da3af] text-black hover:brightness-110 active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Incluir {selectedCount > 0 ? `(${selectedCount}) ` : ''}Talentos Selecionados</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
