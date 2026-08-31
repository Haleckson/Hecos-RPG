import React, { useState } from 'react';
import { HecosEntity, QuestStatus, QuestRewardItem, QuestOrganizationReputation, QuestDifficulty } from '../types';
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
  GripVertical,
  Building2,
  Package,
  X,
  ExternalLink,
  Paperclip,
  Music,
  CheckCircle2,
  XCircle,
  HelpCircle,
  PlayCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';

interface QuestCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: QuestStatus) => void;
  onUnlink?: (id: string) => void;
  isGm?: boolean;
  draggable?: boolean;
  showRoleBadge?: string;
  compact?: boolean;
}

const STATUS_THEMES: Record<
  QuestStatus,
  { label: string; badgeCls: string; borderCls: string; dotCls: string; bgCls: string }
> = {
  not_started: {
    label: 'Disponível',
    badgeCls: 'bg-amber-950/70 border-amber-800/80 text-amber-300',
    borderCls: 'border-zinc-800 hover:border-amber-700/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    dotCls: 'bg-amber-400',
    bgCls: 'bg-[#0b0a16]',
  },
  in_progress: {
    label: 'Em Andamento',
    badgeCls: 'bg-cyan-950/80 border-cyan-700 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    borderCls: 'border-cyan-800/60 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.22)]',
    dotCls: 'bg-cyan-400 animate-pulse',
    bgCls: 'bg-[#080d1a]',
  },
  completed: {
    label: 'Concluída',
    badgeCls: 'bg-emerald-950/80 border-emerald-700 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    borderCls: 'border-emerald-800/50 hover:border-emerald-500/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.18)]',
    dotCls: 'bg-emerald-400',
    bgCls: 'bg-[#081410]',
  },
  failed: {
    label: 'Falha',
    badgeCls: 'bg-rose-950/80 border-rose-700 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    borderCls: 'border-rose-900/50 hover:border-rose-600 hover:shadow-[0_0_20px_rgba(244,63,94,0.18)]',
    dotCls: 'bg-rose-400',
    bgCls: 'bg-[#14080c]',
  },
  abandoned: {
    label: 'Abandonada',
    badgeCls: 'bg-zinc-900 border-zinc-700 text-zinc-400',
    borderCls: 'border-zinc-800/80 hover:border-zinc-700 opacity-80',
    dotCls: 'bg-zinc-500',
    bgCls: 'bg-[#0c0c12]',
  },
};

const DIFFICULTY_THEMES: Record<string, string> = {
  Trivial: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  Baixa: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  Moderada: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
  Severa: 'bg-orange-950/60 border-orange-800/80 text-orange-300',
  Extrema: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
  Lendária: 'bg-purple-950/60 border-purple-800/80 text-purple-300',
};

export const QuestCard: React.FC<QuestCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onUnlink,
  isGm = false,
  draggable = true,
  showRoleBadge,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || currentUser?.role === 'gm' || HecosStorage.getGmMode();
  const quest = entity.questData;

  const status: QuestStatus = quest?.status || 'not_started';
  const difficulty = quest?.difficulty || 'Moderada';
  const level = quest?.recommendedLevel;
  const questType = quest?.questType || 'Secundária';
  const priority = quest?.priority || 'Normal';
  const objectives = quest?.objectives || [];
  const completedObjs = objectives.filter((o) => o.completed).length;
  const totalObjs = objectives.length;
  const progressPercent = totalObjs > 0 ? Math.round((completedObjs / totalObjs) * 100) : 0;
  const attachmentsCount = (quest?.attachments || []).length;

  const statusTheme = STATUS_THEMES[status] || STATUS_THEMES.not_started;
  const diffBadgeCls = DIFFICULTY_THEMES[difficulty] || 'bg-zinc-900 border-zinc-700 text-zinc-300';

  // Formatar recompensas de moedas
  const currencyParts: string[] = [];
  const curr = quest?.rewards?.currency;
  if (curr) {
    if (curr.pp && Number(curr.pp) > 0) currencyParts.push(`${curr.pp} PP`);
    if (curr.gp && Number(curr.gp) > 0) currencyParts.push(`${curr.gp} PO`);
    if (curr.sp && Number(curr.sp) > 0) currencyParts.push(`${curr.sp} PP`);
    if (curr.cp && Number(curr.cp) > 0) currencyParts.push(`${curr.cp} PC`);
    if (curr.custom) currencyParts.push(curr.custom);
  } else if (quest?.rewards?.gold) {
    currencyParts.push(quest.rewards.gold);
  }

  // Contar itens
  const rawItems = quest?.rewards?.items || [];
  const structuredItems = quest?.rewards?.structuredItems || [];
  const totalItemCount = Math.max(rawItems.length, structuredItems.length);
  const orgReputations: QuestOrganizationReputation[] = quest?.rewards?.organizationReputations || [];

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', entity.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ id: entity.id, status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect(entity.id)}
      className={`group relative flex flex-col ${statusTheme.bgCls} border rounded-2xl p-4 shadow-xl transition-all duration-200 cursor-pointer ${
        draggable ? 'active:cursor-grabbing' : ''
      } ${
        isDragging
          ? 'opacity-40 scale-95 border-dashed border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
          : statusTheme.borderCls
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {draggable && (
            <span
              className="text-zinc-600 group-hover:text-cyan-400 transition-colors cursor-grab active:cursor-grabbing mr-0.5"
              title="Arraste para mover entre categorias"
            >
              <GripVertical className="w-4 h-4" />
            </span>
          )}

          {/* Status Badge with Dot Indicator */}
          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${statusTheme.badgeCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.dotCls}`} />
            {statusTheme.label}
          </span>

          {showRoleBadge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300">
              {showRoleBadge}
            </span>
          )}

          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${diffBadgeCls}`}>
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

        {/* Actions for GM & Unlink */}
        <div
          className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-zinc-800/80"
          onClick={(e) => e.stopPropagation()}
        >
          {effectiveIsGm && (
            <VisibilityBadgeMenu
              visibility={entity.visibility}
              allowedUserIds={entity.allowedUserIds}
              isSecret={entity.isSecret}
              onChange={(newVis, newAllowed) => {
                HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
              }}
            />
          )}

          {effectiveIsGm && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entity.id)}
              className="p-1 rounded bg-zinc-800/80 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Editar Missão"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {effectiveIsGm && onUnlink && (
            <button
              type="button"
              onClick={() => onUnlink(entity.id)}
              className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Desvincular Missão deste Artigo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {effectiveIsGm && onDelete && (
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
      </div>

      {/* Quest Title & Briefing */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-cyan-300 transition-all leading-snug flex items-center gap-1.5 group-hover:drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            <span className="group-hover:underline decoration-cyan-400 decoration-2 underline-offset-2">
              {entity.title}
            </span>
            {entity.isSecret && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                GM
              </span>
            )}
          </h3>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        {entity.subtitle && (
          <p className="text-xs text-zinc-400 italic line-clamp-2 leading-relaxed">
            {entity.subtitle}
          </p>
        )}
      </div>

      {/* Objectives Progress Bar */}
      {totalObjs > 0 && !compact && (
        <div className="space-y-1 mb-3 p-2.5 rounded-xl bg-black/40 border border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1 font-medium">
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

      {/* Meta: Giver, Location & Organization */}
      {(quest?.questGiver || quest?.location || quest?.organization || quest?.faction) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-zinc-400 mb-3">
          {quest.questGiver && (
            <span className="flex items-center gap-1 text-purple-300 bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-900/40">
              <User className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="truncate max-w-[120px]">{quest.questGiver}</span>
            </span>
          )}
          {quest.location && (
            <span className="flex items-center gap-1 text-cyan-300 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/40">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[120px]">{quest.location}</span>
            </span>
          )}
          {(quest.organization || quest.faction) && (
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/40">
              <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[120px]">{quest.organization || quest.faction}</span>
            </span>
          )}
        </div>
      )}

      {/* Rewards & Actions Footer Strip */}
      <div className="mt-auto pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {quest?.rewards?.xp !== undefined && quest.rewards.xp > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono font-bold">
              +{quest.rewards.xp} XP
            </span>
          )}
          {currencyParts.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-950/60 border border-yellow-800/60 text-yellow-300 font-mono font-bold">
              <Coins className="w-2.5 h-2.5" />
              {currencyParts.slice(0, 2).join(', ')}
            </span>
          )}
          {totalItemCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
              <Package className="w-2.5 h-2.5 text-cyan-400" />
              {totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'}
            </span>
          )}
          {attachmentsCount > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300" title={`${attachmentsCount} anexos/músicas vinculados`}>
              <Paperclip className="w-2.5 h-2.5 text-purple-400" />
              {attachmentsCount}
            </span>
          )}
          {orgReputations.length > 0 && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 font-semibold">
              <Award className="w-2.5 h-2.5 text-indigo-400" />
              {orgReputations[0].organizationName}
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
              <option value="abandoned">Abandonada</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};


