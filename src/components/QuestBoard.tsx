import React, { useState } from 'react';
import { HecosEntity, QuestAttributes, QuestStatus, QuestDifficulty } from '../types';
import { HecosStorage } from '../services/storage';
import {
  CheckSquare,
  Plus,
  Clock,
  Coins,
  MapPin,
  User,
  AlertTriangle,
  ChevronRight,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { sortTraitsHierarchically } from '../utils/traitUtils';

interface QuestBoardProps {
  onNavigateEntity: (id: string) => void;
  onEditEntity?: (entity: HecosEntity) => void;
  onCreateQuest?: () => void;
  isGmMode?: boolean;
}

const COLUMNS: { id: QuestStatus; label: string; color: string; badgeColor: string; icon: React.ReactNode }[] = [
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

const DIFFICULTY_MAP: Record<QuestDifficulty, { label: string; color: string }> = {
  Trivial: { label: 'Trivial', color: 'text-emerald-400 border-emerald-800/80 bg-emerald-950/50' },
  Baixa: { label: 'Baixa', color: 'text-sky-400 border-sky-800/80 bg-sky-950/50' },
  Moderada: { label: 'Moderada', color: 'text-amber-400 border-amber-800/80 bg-amber-950/50' },
  Severa: { label: 'Severa', color: 'text-orange-400 border-orange-800/80 bg-orange-950/50' },
  Extrema: { label: 'Extrema', color: 'text-rose-400 border-rose-800/80 bg-rose-950/50' },
  Lendária: { label: 'Lendária', color: 'text-purple-400 border-purple-800/80 bg-purple-950/50' },
};

export const QuestBoard: React.FC<QuestBoardProps> = ({
  onNavigateEntity,
  onEditEntity,
  onCreateQuest,
  isGmMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = Boolean(isGmMode || currentUser?.role === 'gm');

  const allEntities = HecosStorage.getEntities();
  // Filter for quests accessible by the user
  const questEntities = allEntities
    .filter((e) => e.category === 'quest')
    .filter((e) => HecosStorage.canUserAccessItem(e, currentUser));

  const filteredQuests = questEntities.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.subtitle && q.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.questData?.questGiver && q.questData.questGiver.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.questData?.location && q.questData.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === 'all' || q.questData?.difficulty === selectedDifficulty;

    return matchesSearch && matchesDifficulty;
  });

  const handleStatusChange = (entity: HecosEntity, newStatus: QuestStatus) => {
    const defaultQuestData: QuestAttributes = {
      status: newStatus,
      difficulty: 'Moderada',
      objectives: [],
    };

    const updated: HecosEntity = {
      ...entity,
      questData: {
        ...(entity.questData || defaultQuestData),
        status: newStatus,
      },
      updatedAt: new Date().toISOString(),
    };
    HecosStorage.saveEntity(updated);
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
              Gerencie contratos, rumores, missões principais e secundárias dos heróis de Hecos em formato Kanban.
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar missões por título, contratante, local..."
              className="w-full pl-10 pr-4 py-2 bg-black/60 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              Dificuldade:
            </span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 bg-black/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Todas as Dificuldades</option>
              <option value="Trivial">Trivial</option>
              <option value="Baixa">Baixa</option>
              <option value="Moderada">Moderada</option>
              <option value="Severa">Severa</option>
              <option value="Extrema">Extrema</option>
              <option value="Lendária">Lendária</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((column) => {
          const colQuests = filteredQuests.filter(
            (q) => (q.questData?.status || 'not_started') === column.id
          );

          return (
            <div
              key={column.id}
              className={`flex flex-col rounded-2xl border ${column.color} p-4 min-h-[500px] shadow-xl backdrop-blur-sm transition-all`}
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

              {/* Quest Cards in Column */}
              <div className="space-y-3 flex-1">
                {colQuests.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                    Nenhuma missão nesta coluna.
                  </div>
                ) : (
                  colQuests.map((quest) => {
                    const qData: QuestAttributes = quest.questData || {
                      status: 'not_started',
                      difficulty: 'Moderada',
                      objectives: [],
                    };
                    const diffInfo = DIFFICULTY_MAP[qData.difficulty || 'Moderada'] || DIFFICULTY_MAP.Moderada;

                    return (
                      <div
                        key={quest.id}
                        onClick={() => onNavigateEntity(quest.id)}
                        className="group relative flex flex-col p-4 rounded-xl bg-[#120f1c] hover:bg-[#181326] border border-zinc-800 hover:border-cyan-500/60 shadow-lg transition-all cursor-pointer space-y-2.5"
                      >
                        {/* Top Meta: Category & Difficulty */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 font-mono">
                            {quest.subtitle || 'Missão'}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${diffInfo.color}`}
                          >
                            {diffInfo.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors break-words">
                          {quest.title}
                        </h4>

                        {/* Summary / Snippet */}
                        {quest.summary && (
                          <p className="text-xs text-zinc-400 leading-relaxed break-words">
                            {quest.summary}
                          </p>
                        )}

                        {/* Quick Attributes */}
                        <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-1 gap-1 text-[11px] text-zinc-400">
                          {qData.questGiver && (
                            <div className="flex items-center gap-1.5 break-words">
                              <User className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="text-zinc-500">Contratante:</span>
                              <span className="text-zinc-300 font-medium break-words">
                                {qData.questGiver}
                              </span>
                            </div>
                          )}
                          {qData.location && (
                            <div className="flex items-center gap-1.5 break-words">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="text-zinc-500">Local:</span>
                              <span className="text-zinc-300 font-medium break-words">
                                {qData.location}
                              </span>
                            </div>
                          )}
                          {(qData.rewards?.gold || qData.rewards?.xp) && (
                            <div className="flex items-center gap-1.5 break-words">
                              <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="text-zinc-500">Recompensa:</span>
                              <span className="text-amber-300 font-medium break-words">
                                {qData.rewards?.gold || `${qData.rewards?.xp} XP`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Traits and Tags */}
                        {((quest.traits && quest.traits.length > 0) ||
                          (quest.tags && quest.tags.length > 0)) && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {sortTraitsHierarchically(quest.traits || []).map((tr) => (
                              <TraitBadge key={tr} trait={tr} className="text-[9px] py-0 px-1.5" />
                            ))}
                            {(quest.tags || []).map((tg) => (
                              <span
                                key={tg}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono"
                              >
                                #{tg}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status Quick Selector (For quick Kanban state transitions) */}
                        <div
                          className="pt-2 flex items-center justify-between gap-1 border-t border-zinc-800/80 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] text-zinc-500">Mover para:</span>
                          <select
                            value={qData.status || 'not_started'}
                            onChange={(e) =>
                              handleStatusChange(quest, e.target.value as QuestStatus)
                            }
                            className="text-[10px] bg-black/80 border border-zinc-700/80 rounded px-1.5 py-0.5 text-cyan-300 focus:outline-none focus:border-cyan-400 font-semibold"
                          >
                            <option value="not_started">Disponível</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluída</option>
                            <option value="failed">Falha/Cancelada</option>
                          </select>
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
    </div>
  );
};
