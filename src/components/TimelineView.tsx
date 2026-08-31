import React, { useState, useEffect, useMemo } from 'react';
import { HecosEntity, TimelineEra, TimelineYear } from '../types';
import { HecosStorage } from '../services/storage';
import { TimelineEraModal } from './TimelineEraModal';
import { TimelineDateModal } from './TimelineDateModal';
import { TimelineEntryModal } from './TimelineEntryModal';
import { EntityDrawer } from './EntityDrawer';
import { TraitBadge } from './TraitBadge';
import {
  History,
  Plus,
  Calendar,
  Sparkles,
  Search,
  ArrowUpDown,
  Edit,
  Trash2,
  Tag as TagIcon,
  Flame,
  Globe,
  Clock,
  Layers,
  ChevronRight,
  Filter,
  Lock,
  Unlock,
  BookOpen,
  ArrowDown,
  ArrowUp,
  X,
  Compass,
  FileText
} from 'lucide-react';

interface TimelineViewProps {
  onNavigateEntity: (id: string) => void;
  onNewEntity?: (category: string) => void;
  onEditEntity?: (id: string) => void;
  onDeleteEntity?: (id: string) => void;
  isGmMode?: boolean;
}

const IMPORTANCE_CONFIG = {
  cosmic: {
    label: 'Cósmico / Divino',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/80',
    dotColor: '#f43f5e',
    icon: Flame,
  },
  major: {
    label: 'Marco Maior',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/80',
    dotColor: '#a855f7',
    icon: Globe,
  },
  minor: {
    label: 'Evento Local',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80',
    dotColor: '#06b6d4',
    icon: Clock,
  },
  session: {
    label: 'Sessão de Jogo',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/80',
    dotColor: '#f59e0b',
    icon: Sparkles,
  },
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  onNavigateEntity,
  onNewEntity,
  onEditEntity,
  onDeleteEntity,
  isGmMode = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = HecosStorage.isUserGm(currentUser) && isGmMode !== false;

  // Real-time state
  const [eras, setEras] = useState<TimelineEra[]>(() => HecosStorage.getTimelineEras());
  const [years, setYears] = useState<TimelineYear[]>(() => HecosStorage.getTimelineYears());
  const [allEntities, setAllEntities] = useState<HecosEntity[]>(() => HecosStorage.getEntities());

  // Modals state
  const [isEraModalOpen, setIsEraModalOpen] = useState(false);
  const [editingEra, setEditingEra] = useState<TimelineEra | null>(null);

  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<TimelineYear | null>(null);
  const [presetEraIdForYear, setPresetEraIdForYear] = useState<string | undefined>(undefined);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [presetYearIdForEntry, setPresetYearIdForEntry] = useState<string | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<HecosEntity | null>(null);

  // Lateral Drawer for Article Reading
  const [selectedDrawerEntityId, setSelectedDrawerEntityId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEraFilter, setSelectedEraFilter] = useState<string>('all');
  const [selectedImportanceFilter, setSelectedImportanceFilter] = useState<string>('all');
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubEras = HecosStorage.subscribeTimelineEras((newEras) => {
      setEras(newEras);
    });
    const unsubYears = HecosStorage.subscribeTimelineYears((newYears) => {
      setYears(newYears);
    });
    const unsubEntities = HecosStorage.subscribeEntities((newEntities) => {
      setAllEntities(newEntities);
    });

    return () => {
      unsubEras();
      unsubYears();
      unsubEntities();
    };
  }, []);

  // Filter timeline entities
  const timelineEntities = useMemo(() => {
    return allEntities.filter((e) => {
      if (e.category !== 'timeline') return false;
      // Filter out secrets for non-GMs
      if (!isActualGm && e.isSecret) return false;
      return true;
    });
  }, [allEntities, isActualGm]);

  // Group years by Era and attach entries
  const structuredTimeline = useMemo(() => {
    // Sort eras
    const sortedEras = [...eras].sort((a, b) => {
      return sortAscending ? (a.order ?? 0) - (b.order ?? 0) : (b.order ?? 0) - (a.order ?? 0);
    });

    return sortedEras.map((era) => {
      // Find years belonging to this era
      const eraYears = years
        .filter((y) => y.eraId === era.id)
        .sort((a, b) => {
          return sortAscending
            ? (a.numericOrder ?? 0) - (b.numericOrder ?? 0)
            : (b.numericOrder ?? 0) - (a.numericOrder ?? 0);
        });

      // Map entries to years
      const yearsWithEntries = eraYears.map((year) => {
        const entries = timelineEntities.filter((ent) => {
          const tData = ent.timelineData;
          if (!tData) return false;

          // Check if matches year
          const matchesYear =
            tData.yearId === year.id ||
            tData.dateId === year.id ||
            (tData.year && tData.year.trim().toLowerCase() === year.title.trim().toLowerCase());

          if (!matchesYear) return false;

          // Apply search query
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchTitle = ent.title.toLowerCase().includes(q);
            const matchSummary = ent.summary?.toLowerCase().includes(q) ?? false;
            const matchContent = ent.content?.toLowerCase().includes(q) ?? false;
            const matchTags = ent.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
            const matchDay = tData.dayMonth?.toLowerCase().includes(q) ?? false;
            if (!matchTitle && !matchSummary && !matchContent && !matchTags && !matchDay) {
              return false;
            }
          }

          // Apply importance filter
          if (selectedImportanceFilter !== 'all' && tData.importance !== selectedImportanceFilter) {
            return false;
          }

          return true;
        });

        // Sort entries within year (by dayMonth or order or creation)
        const sortedEntries = [...entries].sort((a, b) => {
          const ordA = a.timelineData?.order ?? 0;
          const ordB = b.timelineData?.order ?? 0;
          if (ordA !== ordB) return ordA - ordB;
          return (a.timelineData?.dayMonth || '').localeCompare(b.timelineData?.dayMonth || '');
        });

        return {
          year,
          entries: sortedEntries,
        };
      });

      // Filter by era filter
      const matchesEraFilter = selectedEraFilter === 'all' || selectedEraFilter === era.id;

      return {
        era,
        years: yearsWithEntries,
        isVisible: matchesEraFilter,
      };
    });
  }, [eras, years, timelineEntities, sortAscending, searchQuery, selectedImportanceFilter, selectedEraFilter]);

  // Overall counts
  const totalEntriesCount = useMemo(() => {
    let count = 0;
    structuredTimeline.forEach((group) => {
      if (group.isVisible) {
        group.years.forEach((y) => {
          count += y.entries.length;
        });
      }
    });
    return count;
  }, [structuredTimeline]);

  // Handle Era operations
  const handleOpenNewEraModal = () => {
    setEditingEra(null);
    setIsEraModalOpen(true);
  };

  const handleEditEra = (era: TimelineEra) => {
    setEditingEra(era);
    setIsEraModalOpen(true);
  };

  const handleSaveEra = (era: TimelineEra) => {
    HecosStorage.saveTimelineEra(era);
  };

  const handleDeleteEra = (eraId: string) => {
    HecosStorage.deleteTimelineEra(eraId);
  };

  // Handle Year operations
  const handleOpenNewYearModal = (presetEraId?: string) => {
    setEditingYear(null);
    setPresetEraIdForYear(presetEraId || (eras[0]?.id ?? ''));
    setIsYearModalOpen(true);
  };

  const handleEditYear = (year: TimelineYear) => {
    setEditingYear(year);
    setPresetEraIdForYear(year.eraId);
    setIsYearModalOpen(true);
  };

  const handleSaveYear = (year: TimelineYear) => {
    HecosStorage.saveTimelineYear(year);
  };

  const handleDeleteYear = (yearId: string) => {
    HecosStorage.deleteTimelineYear(yearId);
  };

  // Handle Entry operations
  const handleOpenNewEntryModal = (presetYearId?: string) => {
    setEditingEntry(null);
    setPresetYearIdForEntry(presetYearId || (years[0]?.id ?? ''));
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry: HecosEntity) => {
    setEditingEntry(entry);
    setPresetYearIdForEntry(entry.timelineData?.yearId || entry.timelineData?.dateId);
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (entry: HecosEntity) => {
    HecosStorage.saveEntity(entry);
  };

  const handleDeleteEntry = (entryId: string) => {
    HecosStorage.deleteEntity(entryId);
  };

  const handleOpenDrawer = (entityId: string) => {
    setSelectedDrawerEntityId(entityId);
    setIsDrawerOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#07050d] text-zinc-100 flex flex-col">
      {/* Top Banner / Header */}
      <div className="border-b border-zinc-800/80 bg-[#0c0917]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Title and stats */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-900/60 via-purple-950/40 to-cyan-950/40 border border-purple-700/60 shadow-[0_0_25px_rgba(168,85,247,0.25)]">
              <History className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Linha do Tempo de Hecos
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
                  {totalEntriesCount} {totalEntriesCount === 1 ? 'acontecimento' : 'acontecimentos'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Estrutura cronológica oficial: Eras horizontais ➔ Anos à esquerda ➔ Entradas à direita da linha do tempo.
              </p>
            </div>
          </div>

          {/* Quick Actions (Create Era, Create Year, Create Entry) */}
          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
            {isActualGm && (
              <>
                <button
                  onClick={handleOpenNewEraModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-700/70 rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/50 transition-all hover:scale-105 active:scale-95"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  + Nova Era
                </button>

                <button
                  onClick={() => handleOpenNewYearModal()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700/70 rounded-xl text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all hover:scale-105 active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  + Novo Ano
                </button>
              </>
            )}

            <button
              onClick={() => handleOpenNewEntryModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/40 transition-all hover:scale-105 active:scale-95 ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              + Nova Entrada
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="max-w-6xl mx-auto mt-4 pt-3 border-t border-zinc-800/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar acontecimento por título, dia, ano, resumo ou @entidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-zinc-900/80 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Filter by Era */}
            <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={selectedEraFilter}
                onChange={(e) => setSelectedEraFilter(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">Todas as Eras</option>
                {eras.map((era) => (
                  <option key={era.id} value={era.id} className="bg-zinc-900">
                    {era.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Importance */}
            <div className="flex items-center gap-1 bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={selectedImportanceFilter}
                onChange={(e) => setSelectedImportanceFilter(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none text-xs cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">Toda Importância</option>
                <option value="cosmic" className="bg-zinc-900">Cósmico / Divino</option>
                <option value="major" className="bg-zinc-900">Marco Maior</option>
                <option value="minor" className="bg-zinc-900">Evento Local</option>
                <option value="session" className="bg-zinc-900">Sessão de Jogo</option>
              </select>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortAscending(!sortAscending)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-700/80 text-zinc-300 rounded-xl transition-colors font-medium"
              title={sortAscending ? 'Mais antigos primeiro' : 'Mais recentes primeiro'}
            >
              {sortAscending ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Antigos ➔ Recentes</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recentes ➔ Antigos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {structuredTimeline.filter((g) => g.isVisible).length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
            <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300 mb-1">Nenhum marco temporal encontrado</h3>
            <p className="text-xs text-zinc-500 mb-4 max-w-sm mx-auto">
              Tente redefinir os filtros ou criar uma nova Era para começar a mapear a história de Hecos.
            </p>
            {isActualGm && (
              <button
                onClick={handleOpenNewEraModal}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
              >
                + Criar Primeira Era
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {structuredTimeline.map((group) => {
              if (!group.isVisible) return null;
              const { era, years: eraYears } = group;
              const eraColor = era.color || '#a855f7';

              return (
                <div key={era.id} className="relative">
                  {/* ============================================================ */}
                  {/* HORIZONTAL ERA DIVIDER (Breaks the vertical timeline line)   */}
                  {/* ============================================================ */}
                  <div className="relative flex items-center justify-center my-8 group">
                    {/* Horizontal dividing decorative lines */}
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div
                        className="w-full border-t-2"
                        style={{
                          borderColor: `${eraColor}70`,
                          boxShadow: `0 0 15px ${eraColor}40`,
                        }}
                      />
                    </div>

                    {/* Central Era Badge & Header */}
                    <div
                      className="relative z-10 flex flex-col items-center px-6 sm:px-10 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all hover:scale-[1.01]"
                      style={{
                        backgroundColor: '#0c0a18',
                        borderColor: `${eraColor}90`,
                        boxShadow: `0 0 35px ${eraColor}35`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full animate-pulse shadow-md"
                          style={{ backgroundColor: eraColor, boxShadow: `0 0 10px ${eraColor}` }}
                        />
                        <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-widest text-white drop-shadow-md">
                          {era.title}
                        </h2>
                        <div
                          className="w-3 h-3 rounded-full animate-pulse shadow-md"
                          style={{ backgroundColor: eraColor, boxShadow: `0 0 10px ${eraColor}` }}
                        />

                        {/* GM actions for the Era */}
                        {isActualGm && (
                          <div className="flex items-center gap-1 ml-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditEra(era)}
                              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors"
                              title="Editar Era"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEra(era.id)}
                              className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Excluir Era"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenNewYearModal(era.id)}
                              className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600/70 rounded-md text-[10px] font-semibold transition-colors ml-1"
                              title="Adicionar Ano nesta Era"
                            >
                              <Plus className="w-3 h-3 text-cyan-400" />
                              Ano
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Era summary/lore description if available */}
                      {era.description && (
                        <p className="text-xs text-zinc-400 text-center max-w-xl mt-1 leading-relaxed italic">
                          "{era.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* VERTICAL TIMELINE CONTAINER FOR THIS ERA                    */}
                  {/* Lado Esquerdo = ANOS | Lado Direito = ENTRADAS               */}
                  {/* ============================================================ */}
                  <div className="relative pl-4 sm:pl-0">
                    {/* The continuous vertical timeline line | */}
                    <div
                      className="absolute left-28 sm:left-44 top-0 bottom-0 w-0.5"
                      style={{
                        background: `linear-gradient(to bottom, ${eraColor}cc, #3f3f46 20%, #3f3f46 80%, ${eraColor}cc)`,
                        boxShadow: `0 0 10px ${eraColor}30`,
                      }}
                    />

                    {eraYears.length === 0 ? (
                      <div className="my-6 ml-32 sm:ml-48 p-4 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500 flex items-center justify-between">
                        <span>Nenhum ano cadastrado nesta Era.</span>
                        {isActualGm && (
                          <button
                            onClick={() => handleOpenNewYearModal(era.id)}
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar Ano
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-8 my-6">
                        {eraYears.map(({ year, entries }) => {
                          const yearColor = year.color || eraColor;

                          return (
                            <div key={year.id} className="relative flex items-start group">
                              {/* ------------------------------------------------ */}
                              {/* LADO ESQUERDO DA LINHA | (O ANO / DATA)          */}
                              {/* ------------------------------------------------ */}
                              <div className="w-24 sm:w-40 pr-3 sm:pr-4 pt-0.5 text-right flex flex-col items-end shrink-0">
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  <span
                                    className="text-xs sm:text-sm font-extrabold tracking-wide text-zinc-100"
                                    style={{ color: yearColor }}
                                  >
                                    {year.title}
                                  </span>

                                  {/* Quick edit / delete for the Year */}
                                  {isActualGm && (
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleEditYear(year)}
                                        className="p-0.5 text-zinc-500 hover:text-zinc-300"
                                        title="Editar Ano"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteYear(year.id)}
                                        className="p-0.5 text-zinc-500 hover:text-rose-400"
                                        title="Excluir Ano"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {year.description && (
                                  <p className="text-[10px] text-zinc-500 line-clamp-2 max-w-[130px] sm:max-w-[150px] mt-0.5 leading-tight">
                                    {year.description}
                                  </p>
                                )}

                                {/* Button to add entry in this year */}
                                <button
                                  onClick={() => handleOpenNewEntryModal(year.id)}
                                  className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-cyan-300 transition-colors opacity-70 group-hover:opacity-100"
                                  title={`Adicionar entrada em ${year.title}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Entrada</span>
                                </button>
                              </div>

                              {/* ------------------------------------------------ */}
                              {/* NÓ CENTRAL NA LINHA VERTICAL |                   */}
                              {/* ------------------------------------------------ */}
                              <div className="relative flex items-center justify-center shrink-0 z-10 pt-1">
                                <div
                                  className="w-4 h-4 rounded-full border-2 border-[#07050d] shadow-[0_0_12px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform group-hover:scale-125"
                                  style={{
                                    backgroundColor: yearColor,
                                    boxShadow: `0 0 14px ${yearColor}80`,
                                  }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#07050d]" />
                                </div>
                              </div>

                              {/* ------------------------------------------------ */}
                              {/* LADO DIREITO DA LINHA | (AS ENTRADAS DO ANO)    */}
                              {/* ------------------------------------------------ */}
                              <div className="flex-1 pl-4 sm:pl-6 space-y-3 pt-0">
                                {entries.length === 0 ? (
                                  <div className="p-3 bg-zinc-900/30 border border-dashed border-zinc-800/80 rounded-xl flex items-center justify-between text-xs text-zinc-500">
                                    <span>Nenhuma entrada cadastrada para este ano.</span>
                                    <button
                                      onClick={() => handleOpenNewEntryModal(year.id)}
                                      className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-medium transition-colors"
                                    >
                                      + Adicionar Primeira
                                    </button>
                                  </div>
                                ) : (
                                  entries.map((entry) => {
                                    const importance = entry.timelineData?.importance || 'major';
                                    const impConfig = IMPORTANCE_CONFIG[importance];
                                    const ImpIcon = impConfig.icon;
                                    const dayString = entry.timelineData?.dayMonth || 'dia --/--';

                                    return (
                                      <div
                                        key={entry.id}
                                        onClick={() => handleOpenDrawer(entry.id)}
                                        className="relative p-3.5 sm:p-4 rounded-xl bg-[#0e0c1a]/90 hover:bg-[#151226] border border-zinc-800/90 hover:border-purple-600/70 shadow-lg hover:shadow-purple-950/30 transition-all duration-200 cursor-pointer group/entry flex flex-col gap-2"
                                      >
                                        {/* Entry Header: Date tag + Title + Importance Badge */}
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {/* Day Badge */}
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-800/90 text-cyan-300 border border-zinc-700/80 shadow-sm">
                                              <Clock className="w-3 h-3 text-cyan-400" />
                                              {dayString}
                                            </span>

                                            <span className="text-zinc-600 font-bold">-</span>

                                            {/* Entry Title */}
                                            <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover/entry:text-white group-hover/entry:translate-x-0.5 transition-all">
                                              {entry.title}
                                            </h3>

                                            {/* Secret Badge for GM */}
                                            {entry.isSecret && (
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[10px] font-semibold">
                                                <Lock className="w-2.5 h-2.5" />
                                                Secreto GM
                                              </span>
                                            )}
                                          </div>

                                          {/* Right side: Importance badge & Quick Actions */}
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${impConfig.badgeClass}`}
                                            >
                                              <ImpIcon className="w-3 h-3" />
                                              {impConfig.label}
                                            </span>

                                            {isActualGm && (
                                              <div
                                                className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <button
                                                  onClick={() => handleEditEntry(entry)}
                                                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                  title="Editar Entrada"
                                                >
                                                  <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteEntry(entry.id)}
                                                  className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                                                  title="Excluir Entrada"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Entry Summary */}
                                        {entry.summary && (
                                          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                                            {entry.summary}
                                          </p>
                                        )}

                                        {/* Entry Tags and Read Drawer prompt */}
                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 flex-wrap">
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {entry.tags?.slice(0, 4).map((tag) => (
                                              <span
                                                key={tag}
                                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400"
                                              >
                                                <TagIcon className="w-2.5 h-2.5 text-zinc-500" />
                                                {tag}
                                              </span>
                                            ))}
                                          </div>

                                          <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 group-hover/entry:text-purple-300 group-hover/entry:translate-x-1 transition-all ml-auto">
                                            <BookOpen className="w-3 h-3" />
                                            <span>Abrir Artigo</span>
                                            <ChevronRight className="w-3 h-3" />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODALS: ERAS, YEARS, ENTRIES                                 */}
      {/* ============================================================ */}
      <TimelineEraModal
        isOpen={isEraModalOpen}
        onClose={() => setIsEraModalOpen(false)}
        onSave={handleSaveEra}
        onDelete={handleDeleteEra}
        editingEra={editingEra}
      />

      <TimelineDateModal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        onSave={handleSaveYear}
        onDelete={handleDeleteYear}
        editingDate={editingYear}
        allEras={eras}
        presetEraId={presetEraIdForYear}
      />

      <TimelineEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        presetYearId={presetYearIdForEntry}
        allYears={years}
        allEras={eras}
        editingEntry={editingEntry}
      />

      {/* ============================================================ */}
      {/* LATERAL ARTICLE DRAWER (Markdown, @mentions, entity link)     */}
      {/* ============================================================ */}
      <EntityDrawer
        entityId={selectedDrawerEntityId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDrawerEntityId(null);
        }}
        onNavigateToPage={(id) => {
          setIsDrawerOpen(false);
          onNavigateEntity(id);
        }}
        onEditEntity={(id) => {
          setIsDrawerOpen(false);
          const ent = HecosStorage.getEntityById(id);
          if (ent) {
            handleEditEntry(ent);
          }
        }}
        isGmMode={isActualGm}
      />
    </div>
  );
};
