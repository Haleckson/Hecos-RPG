import React from 'react';
import { HecosEntity, QuestStatus } from '../types';
import { HecosStorage } from '../services/storage';
import {
  CheckSquare,
  Clock,
  Coins,
  MapPin,
  User,
  Shield,
  AlertTriangle,
  Flame,
  Award,
  Edit2,
  Trash2,
  Lock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';

interface QuestCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: QuestStatus) => void;
  isGm?: boolean;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  isGm = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || currentUser?.role === 'gm';
  const quest = entity.questData;

  const status = quest?.status || 'not_started';
  const difficulty = quest?.difficulty || 'Moderada';
  const level = quest?.recommendedLevel;
  const questType = quest?.questType || 'Secundária';
  const priority = quest?.priority || 'Normal';
  const objectives = quest?.objectives || [];
  const completedObjs = objectives.filter((o) => o.completed).length;
  const totalObjs = objectives.length;
  const progressPercent = totalObjs > 0 ? Math.round((completedObjs / totalObjs) * 100) : 0;

  const getStatusBadge = (st: QuestStatus) => {
    switch (st) {
      case 'not_started':
        return {
          label: 'Disponível',
          cls: 'bg-zinc-800/80 border-zinc-700 text-zinc-300',
        };
      case 'in_progress':
        return {
          label: 'Em Andamento',
          cls: 'bg-cyan-950/80 border-cyan-700 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
        };
      case 'completed':
        return {
          label: 'Concluída',
          cls: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
        };
      case 'failed':
        return {
          label: 'Falha',
          cls: 'bg-rose-950/80 border-rose-700 text-rose-300',
        };
      default:
        return {
          label: 'Missão',
          cls: 'bg-zinc-800 border-zinc-700 text-zinc-300',
        };
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Trivial':
      case 'Baixa':
        return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
      case 'Moderada':
        return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
      case 'Severa':
        return 'bg-orange-950/60 border-orange-800/80 text-orange-300';
      case 'Extrema':
      case 'Lendária':
        return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
      default:
        return 'bg-zinc-900 border-zinc-700 text-zinc-300';
    }
  };

  const stBadge = getStatusBadge(status);

  return (
    <div
      className={`group relative flex flex-col bg-[#0a0c16] border rounded-2xl p-4 shadow-lg transition-all duration-200 ${
        status === 'in_progress'
          ? 'border-cyan-700/60 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.18)]'
          : status === 'completed'
          ? 'border-emerald-800/40 hover:border-emerald-500/70 opacity-90'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border ${stBadge.cls}`}>
            {stBadge.label}
          </span>

          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getDifficultyBadge(difficulty)}`}>
            {difficulty}
          </span>

          {level !== undefined && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-300">
              Nv {level}
            </span>
          )}

          {priority === 'Urgente' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 border border-rose-700 text-rose-300 flex items-center gap-1 animate-pulse">
              <Flame className="w-2.5 h-2.5" />
              Urgente
            </span>
          )}
        </div>

        {/* Actions for GM */}
        {effectiveIsGm && (
          <div
            className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-zinc-800/80"
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
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(entity.id)}
                className="p-1 rounded bg-zinc-800/80 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Editar Missão"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(entity.id)}
                className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                title="Excluir Missão"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quest Title & Brief */}
      <div className="space-y-1 mb-3">
        <button
          type="button"
          onClick={() => onSelect(entity.id)}
          className="text-left w-full group/title focus:outline-none cursor-pointer block transition-all"
          title={`Abrir ${entity.title}`}
        >
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover/title:text-cyan-300 transition-all leading-snug flex items-center gap-1.5 group-hover/title:drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]">
            <span className="group-hover/title:underline decoration-cyan-400 decoration-2 underline-offset-2">
              {entity.title}
            </span>
            {entity.isSecret && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                GM
              </span>
            )}
          </h3>
        </button>

        {entity.subtitle && (
          <p className="text-xs text-zinc-400 italic line-clamp-2">
            {entity.subtitle}
          </p>
        )}
      </div>

      {/* Objectives Progress */}
      {totalObjs > 0 && (
        <div className="space-y-1 mb-3 p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-cyan-400" />
              Objetivos
            </span>
            <span className="font-mono text-cyan-300 font-bold">
              {completedObjs}/{totalObjs} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta: Giver & Location */}
      {(quest?.questGiver || quest?.location) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 mb-3">
          {quest.questGiver && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-purple-400" />
              <span className="truncate max-w-[130px]">{quest.questGiver}</span>
            </span>
          )}
          {quest.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span className="truncate max-w-[130px]">{quest.location}</span>
            </span>
          )}
        </div>
      )}

      {/* Rewards Strip */}
      <div className="mt-auto pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2 flex-wrap">
          {quest?.rewards?.xp !== undefined && quest.rewards.xp > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono font-bold">
              +{quest.rewards.xp} XP
            </span>
          )}
          {quest?.rewards?.gold && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-950/60 border border-yellow-800/60 text-yellow-300 font-mono font-bold">
              <Coins className="w-2.5 h-2.5" />
              {quest.rewards.gold}
            </span>
          )}
          {quest?.rewards?.items && quest.rewards.items.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
              {quest.rewards.items.length} {quest.rewards.items.length === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>

        {/* Quick status change dropdown for GM */}
        {effectiveIsGm && onStatusChange && (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={status}
              onChange={(e) => onStatusChange(entity.id, e.target.value as QuestStatus)}
              className="bg-black/80 border border-zinc-700 text-[10px] text-zinc-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="not_started">Disponível</option>
              <option value="in_progress">Andamento</option>
              <option value="completed">Concluída</option>
              <option value="failed">Falha</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
