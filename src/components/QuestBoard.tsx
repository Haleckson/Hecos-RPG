import React, { useState, useEffect } from 'react';
import {
  HecosEntity,
  QuestStatus,
  QuestDifficulty,
  QuestType,
  QuestPriority,
} from '../types';
import { HecosStorage } from '../services/storage';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  PlayCircle,
  HelpCircle,
  SlidersHorizontal,
  Flame,
  Layers,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { QuestCard } from './QuestCard';

interface QuestBoardProps {
  onNavigateEntity: (id: string) => void;
  onEditEntity?: (entity: HecosEntity) => void;
  onCreateQuest?: () => void;
  onDeleteEntity?: (id: string) => void;
  isGmMode?: boolean;
}

const COLUMNS: {
  id: QuestStatus;
  label: string;
  color: string;
  badgeColor: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'not_started',
    label: 'Disponíveis / Rumores',
    color: 'border-zinc-700 bg-zinc-900/40',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    icon: <HelpCircle className="w-4 h-4 text-zinc-400" />,
  },
  {
    id: 'in_progress',
    label: 'Em Andamento',
    color: 'border-cyan-800/80 bg-cyan-950/20',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    icon: <PlayCircle className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'completed',
    label: 'Concluídas',
    color: 'border-emerald-800/80 bg-emerald-950/20',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'failed',
    label: 'Falhas / Canceladas',
    color: 'border-rose-900/80 bg-rose-950/20',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-900',
    icon: <XCircle className="w-4 h-4 text-rose-400" />,
  },
];

type SortOption =
  | 'recent'
  | 'level_asc'
  | 'level_desc'
  | 'alpha_asc'
  | 'alpha_desc'
  | 'priority';

export const QuestBoard: React.FC<QuestBoardProps> = ({
  onNavigateEntity,
  onEditEntity,
  onCreateQuest,
  onDeleteEntity,
  isGmMode,
}) => {
  const [entities, setEntities] = useState<HecosEntity[]>(() => HecosStorage.getEntities());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [dragOverCol, setDragOverCol] = useState<QuestStatus | null>(null);

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = Boolean(isGmMode || currentUser?.role === 'gm');

  // Keep entities in sync with storage & real-time events
  useEffect(() => {
    const unsub = HecosStorage.subscribeEntities((list) => {
      setEntities(list);
    });
    return () => unsub();
  }, []);

  // Filter for quests accessible by the user
  const questEntities = entities
    .filter((e) => e.category === 'quest' || Boolean(e.questData))
    .filter((e) => HecosStorage.canUserAccessItem(e, currentUser));

  // Multi-criteria filtering
  const filteredQuests = questEntities.filter((q) => {
    const matchesSearch =
      !searchQuery.trim() ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subtitle && q.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.questData?.questGiver && q.questData.questGiver.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.questData?.location && q.questData.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.summary && q.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.tags && q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesDifficulty =
      selectedDifficulty === 'all' || q.questData?.difficulty === selectedDifficulty;

    const matchesType =
      selectedType === 'all' || q.questData?.questType === selectedType;

    const matchesPriority =
      selectedPriority === 'all' || q.questData?.priority === selectedPriority;

    return matchesSearch && matchesDifficulty && matchesType && matchesPriority;
  });

  // Sorting
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    switch (sortBy) {
      case 'level_asc': {
        const lvlA = a.questData?.recommendedLevel ?? 999;
        const lvlB = b.questData?.recommendedLevel ?? 999;
        return lvlA - lvlB;
      }
      case 'level_desc': {
        const lvlA = a.questData?.recommendedLevel ?? -1;
        const lvlB = b.questData?.recommendedLevel ?? -1;
        return lvlB - lvlA;
      }
      case 'alpha_asc':
        return a.title.localeCompare(b.title, 'pt-BR');
      case 'alpha_desc':
        return b.title.localeCompare(a.title, 'pt-BR');
      case 'priority': {
        const prioRank: Record<QuestPriority, number> = {
          Urgente: 4,
          Alta: 3,
          Normal: 2,
          Baixa: 1,
        };
        const rankA = a.questData?.priority ? prioRank[a.questData.priority] : 2;
        const rankB = b.questData?.priority ? prioRank[b.questData.priority] : 2;
        return rankB - rankA;
      }
      case 'recent':
      default: {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      }
    }
  });

  const handleStatusChange = (id: string, newStatus: QuestStatus) => {
    const ent = HecosStorage.getEntityById(id);
    if (!ent) return;

    const defaultQuestData = {
      status: newStatus,
      difficulty: 'Moderada' as QuestDifficulty,
      objectives: [],
    };

    const updated: HecosEntity = {
      ...ent,
      questData: {
        ...(ent.questData || defaultQuestData),
        status: newStatus,
      },
      updatedAt: new Date().toISOString(),
    };
    HecosStorage.saveEntity(updated);
    setEntities(HecosStorage.getEntities());
  };

  const questFolderPerm = HecosStorage.getFolderPermission('quests');

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[#0b0914] rounded-2xl border border-zinc-800/90 shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 flex items-center gap-3 font-serif">
                <CheckSquare className="w-7 h-7 text-cyan-400" />
                <span>Quadro de Missões & Quests</span>
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                {sortedQuests.length} {sortedQuests.length === 1 ? 'missão' : 'missões'}
              </span>
              {isActualGm && (
                <VisibilityBadgeMenu
                  visibility={questFolderPerm.visibility}
                  allowedUserIds={questFolderPerm.allowedUserIds}
                  onChange={(newVis, newAllowed) => {
                    HecosStorage.setFolderPermission('quests', newVis, newAllowed);
                  }}
                />
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Gerencie contratos, rumores, missões principais e secundárias dos heróis de Hecos em formato Kanban interativo com filtros e ordenação.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onCreateQuest && (
              <button
                type="button"
                onClick={onCreateQuest}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nova Missão</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar missões por título, contratante, local, resumo..."
              className="w-full pl-10 pr-4 py-2 bg-black/60 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          {/* Dificuldade */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-zinc-800/80 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              Dificuldade:
            </span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-transparent border-0 text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="Trivial">Trivial</option>
              <option value="Baixa">Baixa</option>
              <option value="Moderada">Moderada</option>
              <option value="Severa">Severa</option>
              <option value="Extrema">Extrema</option>
              <option value="Lendária">Lendária</option>
            </select>
          </div>

          {/* Tipo de Quest */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-zinc-800/80 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              Tipo:
            </span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent border-0 text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Tipos</option>
              <option value="Principal">Principal</option>
              <option value="Secundária">Secundária</option>
              <option value="Contrato de Caça">Contrato de Caça</option>
              <option value="Pessoal">Pessoal</option>
              <option value="Rumor">Rumor</option>
              <option value="Facção">Facção</option>
            </select>
          </div>

          {/* Prioridade */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-zinc-800/80 px-2.5 py-1.5 rounded-xl text-xs">
            <span className="text-zinc-400 font-semibold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Prioridade:
            </span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent border-0 text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Normal">Normal</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>

          {/* Ordenação (Icon-Only) */}
          <div className="relative shrink-0 flex items-center">
            <div
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                sortBy !== 'recent'
                  ? 'bg-cyan-950/60 border-cyan-500/70 text-cyan-300 shadow-sm'
                  : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
              title={`Ordenar Missões (Ativo: ${
                sortBy === 'recent'
                  ? 'Mais Recentes'
                  : sortBy === 'level_asc'
                  ? 'Nível (Menor → Maior)'
                  : sortBy === 'level_desc'
                  ? 'Nível (Maior → Menor)'
                  : sortBy === 'alpha_asc'
                  ? 'Alfabética (A → Z)'
                  : sortBy === 'alpha_desc'
                  ? 'Alfabética (Z → A)'
                  : 'Prioridade (Urgente 1º)'
              })`}
            >
              <ArrowUpDown className="w-4 h-4 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                title="Alterar ordenação de missões"
              >
                <option value="recent" className="bg-[#0f0d1a] text-zinc-200">Mais Recentes</option>
                <option value="level_asc" className="bg-[#0f0d1a] text-zinc-200">Nível (Menor → Maior)</option>
                <option value="level_desc" className="bg-[#0f0d1a] text-zinc-200">Nível (Maior → Menor)</option>
                <option value="alpha_asc" className="bg-[#0f0d1a] text-zinc-200">Alfabética (A → Z)</option>
                <option value="alpha_desc" className="bg-[#0f0d1a] text-zinc-200">Alfabética (Z → A)</option>
                <option value="priority" className="bg-[#0f0d1a] text-zinc-200">Prioridade (Urgente 1º)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid with Drag and Drop */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((column) => {
          const colQuests = sortedQuests.filter(
            (q) => (q.questData?.status || 'not_started') === column.id
          );
          const isCurrentDragTarget = dragOverCol === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverCol !== column.id) {
                  setDragOverCol(column.id);
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverCol(column.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverCol((prev) => (prev === column.id ? null : prev));
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverCol(null);
                const questId = e.dataTransfer.getData('text/plain');
                if (questId) {
                  handleStatusChange(questId, column.id);
                }
              }}
              className={`flex flex-col rounded-2xl border ${column.color} p-4 min-h-[520px] shadow-xl backdrop-blur-sm transition-all duration-200 ${
                isCurrentDragTarget
                  ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-[0_0_25px_rgba(6,182,212,0.25)]'
                  : ''
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className="text-sm font-bold text-zinc-200">{column.label}</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold border ${column.badgeColor}`}
                >
                  {colQuests.length}
                </span>
              </div>

              {/* Drag Over Indicator Slot on Top */}
              {isCurrentDragTarget && (
                <div className="mb-3 p-3 border-2 border-dashed border-cyan-400/80 rounded-xl bg-cyan-950/40 text-cyan-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-pulse">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>Solte aqui para mover para "{column.label}"</span>
                </div>
              )}

              {/* Quest Cards in Column */}
              <div className="space-y-3 flex-1">
                {colQuests.length === 0 && !isCurrentDragTarget ? (
                  <div className="p-8 text-center border border-dashed border-zinc-800/80 rounded-xl text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
                    <span>Nenhuma missão nesta coluna.</span>
                    <span className="text-[11px] text-zinc-600">Arraste um card para cá</span>
                  </div>
                ) : (
                  colQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      entity={quest}
                      onSelect={onNavigateEntity}
                      onEdit={() => onEditEntity?.(quest)}
                      onDelete={onDeleteEntity}
                      onStatusChange={handleStatusChange}
                      isGm={isActualGm}
                      draggable={true}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
