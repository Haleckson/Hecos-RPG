import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  QuestAttributes,
  QuestObjective,
  QuestStatus,
  QuestDifficulty,
  QuestType,
  QuestPriority,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyQuestData,
  serializeQuestToHTML,
} from '../utils/entitySerializers';
import { IntelligentEntityPicker } from './IntelligentEntityPicker';
import { IntelligentMultiEntityPicker } from './IntelligentMultiEntityPicker';
import { MutualLinkService } from '../services/mutualLinkService';
import {
  CheckSquare,
  Clock,
  Coins,
  MapPin,
  User,
  Shield,
  AlertTriangle,
  Plus,
  Trash2,
  Lock,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  X,
  Check,
  Award,
  Sparkles,
  Flame,
  Building2,
  Scroll,
} from 'lucide-react';

interface QuestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'objectives' | 'rewards' | 'secrets' | 'briefing';

const DIFFICULTIES: QuestDifficulty[] = ['Trivial', 'Baixa', 'Moderada', 'Severa', 'Extrema', 'Lendária'];
const QUEST_TYPES: QuestType[] = ['Principal', 'Secundária', 'Contrato de Caça', 'Pessoal', 'Rumor', 'Facção'];
const PRIORITIES: QuestPriority[] = ['Baixa', 'Normal', 'Alta', 'Urgente'];

export const QuestCreateModal: React.FC<QuestCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initEntity,
  presetSubcategory,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isGm = currentUser?.role === 'gm';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);

  // Base Entity Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [content, setContent] = useState('');

  // Folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Structured Quest Data
  const [questData, setQuestData] = useState<QuestAttributes>(getEmptyQuestData());

  // New Objective Input
  const [newObjText, setNewObjText] = useState('');
  const [newObjSecret, setNewObjSecret] = useState(false);

  // New Item Reward Input
  const [newItemReward, setNewItemReward] = useState('');

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('quest');
    const set = new Set<string>();
    Object.values(config).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((f) => {
          if (f && typeof f === 'string') set.add(f.trim());
        });
      }
    });
    const ents = HecosStorage.getEntities();
    ents.forEach((e) => {
      if (e.category === 'quest' || e.questData) {
        (e.questData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
          if (s) set.add(s.trim());
        });
      }
    });
    setExistingFolders(Array.from(set).sort());
  };

  useEffect(() => {
    refreshFolders();
  }, [isOpen]);

  useEffect(() => {
    if (initEntity) {
      setTitle(initEntity.title || '');
      setSubtitle(initEntity.subtitle || '');
      setTagsInput((initEntity.tags || []).join(', '));
      setIsSecret(Boolean(initEntity.isSecret));
      setVisibility(initEntity.visibility || 'all');
      setAllowedUserIds(initEntity.allowedUserIds || []);
      setContent(initEntity.content || '');

      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      setQuestData(initEntity.questData ? { ...initEntity.questData } : getEmptyQuestData());
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('missao, quest, hecos');
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      setQuestData(getEmptyQuestData());
    }
    setActiveTab('overview');
  }, [initEntity, isOpen, presetSubcategory]);

  if (!isOpen) return null;

  const handleAddFolder = () => {
    const trimmed = newFolderInput.trim();
    if (!trimmed) return;
    if (!selectedSubcategories.includes(trimmed)) {
      setSelectedSubcategories([...selectedSubcategories, trimmed]);
    }
    HecosStorage.addScopeSubcategory('quest', 'all', trimmed);
    refreshFolders();
    setNewFolderInput('');
  };

  const handleToggleFolder = (f: string) => {
    if (selectedSubcategories.includes(f)) {
      setSelectedSubcategories(selectedSubcategories.filter((x) => x !== f));
    } else {
      setSelectedSubcategories([...selectedSubcategories, f]);
    }
  };

  const handleAddObjective = () => {
    if (!newObjText.trim()) return;
    const newObj: QuestObjective = {
      id: 'obj-' + Date.now(),
      text: newObjText.trim(),
      completed: false,
      isSecret: newObjSecret,
    };
    setQuestData((prev) => ({
      ...prev,
      objectives: [...(prev.objectives || []), newObj],
    }));
    setNewObjText('');
    setNewObjSecret(false);
  };

  const handleToggleObjective = (id: string) => {
    setQuestData((prev) => ({
      ...prev,
      objectives: (prev.objectives || []).map((o) =>
        o.id === id ? { ...o, completed: !o.completed } : o
      ),
    }));
  };

  const handleRemoveObjective = (id: string) => {
    setQuestData((prev) => ({
      ...prev,
      objectives: (prev.objectives || []).filter((o) => o.id !== id),
    }));
  };

  const handleAddItemReward = () => {
    const trimmed = newItemReward.trim();
    if (!trimmed) return;
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        items: [...(prev.rewards?.items || []), trimmed],
      },
    }));
    setNewItemReward('');
  };

  const handleRemoveItemReward = (idx: number) => {
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        items: (prev.rewards?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o título da missão.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullQuestData: QuestAttributes = {
      ...questData,
      subcategories: selectedSubcategories,
    };

    const finalHTML = serializeQuestToHTML(title, fullQuestData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug: initEntity?.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'quest-' + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'quest',
      subcategory: selectedSubcategories[0] || '',
      subcategories: selectedSubcategories,
      tags: cleanTags.length > 0 ? cleanTags : ['quest', 'missao'],
      summary: subtitle.trim(),
      content: finalHTML,
      questData: fullQuestData,
      isSecret,
      visibility,
      allowedUserIds,
      createdAt: initEntity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    HecosStorage.saveEntity(savedEntity);
    MutualLinkService.syncMutualLinksOnSave(savedEntity);
    onSave(savedEntity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#090a14] border border-cyan-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1021] border-b border-cyan-900/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif flex items-center gap-2">
                <span>{initEntity ? 'Editar Missão / Quest' : 'Nova Missão / Quest'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  {questData.questType || 'Missão'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie objetivos, contratantes, recompensas em XP e ouro para o Quadro de Missões.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#0a0c1a] border-b border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Dados & Status', icon: CheckSquare },
            { id: 'objectives', label: 'Objetivos', icon: Sparkles },
            { id: 'rewards', label: 'Recompensas', icon: Award },
            { id: 'secrets', label: 'Segredos do GM', icon: Lock },
            { id: 'briefing', label: 'Briefing & Descrição', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  active
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Título da Missão *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: O Coração Mecânico de Zephyr, Caçada nas Fendas"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Subtítulo / Resumo Rápido
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Resgatar o protótipo arcano antes do crepúsculo"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Status & Priority & Type & Level */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Coluna Kanban
                  </label>
                  <select
                    value={questData.status}
                    onChange={(e) => setQuestData({ ...questData, status: e.target.value as QuestStatus })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="not_started">Disponível / Rumor</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluída</option>
                    <option value="failed">Falha / Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tipo de Missão
                  </label>
                  <select
                    value={questData.questType || 'Secundária'}
                    onChange={(e) => setQuestData({ ...questData, questType: e.target.value as QuestType })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-purple-300 focus:outline-none focus:border-cyan-400"
                  >
                    {QUEST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Dificuldade
                  </label>
                  <select
                    value={questData.difficulty || 'Moderada'}
                    onChange={(e) => setQuestData({ ...questData, difficulty: e.target.value as QuestDifficulty })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-cyan-400"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nível Recomendado
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={questData.recommendedLevel ?? 1}
                    onChange={(e) => setQuestData({ ...questData, recommendedLevel: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Contractor, Location, Faction & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <IntelligentEntityPicker
                    label="Contratante / Doador (NPC)"
                    category="npc"
                    valueId={questData.questGiverEntityId}
                    valueName={questData.questGiver}
                    placeholder="Buscar NPC ou digitar..."
                    onChange={(id, title) => {
                      setQuestData({
                        ...questData,
                        questGiver: title || '',
                        questGiverEntityId: id,
                      });
                    }}
                  />
                </div>

                <div>
                  <IntelligentEntityPicker
                    label="Local de Realização (Local)"
                    category="location"
                    valueId={questData.locationEntityId}
                    valueName={questData.location}
                    placeholder="Buscar local ou digitar..."
                    onChange={(id, title) => {
                      setQuestData({
                        ...questData,
                        location: title || '',
                        locationEntityId: id,
                      });
                    }}
                  />
                </div>

                <div>
                  <IntelligentEntityPicker
                    label="Facção Patrocinadora"
                    category="organization"
                    valueId={questData.factionEntityId}
                    valueName={questData.faction}
                    placeholder="Buscar facção ou digitar..."
                    onChange={(id, title) => {
                      setQuestData({
                        ...questData,
                        faction: title || '',
                        factionEntityId: id,
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Prazo / Limite Temporal
                  </label>
                  <input
                    type="text"
                    value={questData.deadline || ''}
                    onChange={(e) => setQuestData({ ...questData, deadline: e.target.value })}
                    placeholder="Ex: 3 dias antes da Lua Cheia"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Multi-links: NPCs & Locations involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-900/40 space-y-2">
                  <IntelligentMultiEntityPicker
                    label="NPCs Envolvidos / Alvos / Vítimas"
                    category="npc"
                    selectedIds={questData.involvedNpcIds || []}
                    badgeTheme="emerald"
                    placeholder="Buscar e vincular NPCs a esta quest..."
                    onChange={(ids) => {
                      setQuestData({
                        ...questData,
                        involvedNpcIds: ids,
                      });
                    }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-cyan-900/40 space-y-2">
                  <IntelligentMultiEntityPicker
                    label="Locais & Regiões Relacionadas"
                    category="location"
                    selectedIds={questData.relatedLocationIds || []}
                    badgeTheme="cyan"
                    placeholder="Buscar e vincular locais a esta quest..."
                    onChange={(ids) => {
                      setQuestData({
                        ...questData,
                        relatedLocationIds: ids,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Folders & Subcategories */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-cyan-400" />
                    Pastas da Campanha (Atos / Capítulos)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFolderManagerOpen(true)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    Gerenciar Pastas
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {existingFolders.map((folder) => {
                    const isSel = selectedSubcategories.includes(folder);
                    return (
                      <button
                        key={folder}
                        type="button"
                        onClick={() => handleToggleFolder(folder)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-cyan-950 border-cyan-600 text-cyan-200'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {folder}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFolder())}
                    placeholder="Novo Ato ou Capítulo..."
                    className="px-2.5 py-1 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddFolder}
                    className="px-2.5 py-1 text-xs rounded-lg bg-cyan-900/60 text-cyan-200 border border-cyan-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="missao, principal, ato-1, recompensa"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: OBJECTIVES */}
          {activeTab === 'objectives' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Adicionar Objetivo
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={newObjText}
                    onChange={(e) => setNewObjText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                    placeholder="Ex: Derrotar o capitão dos saqueadores nas docas"
                    className="flex-1 min-w-[240px] px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newObjSecret}
                      onChange={(e) => setNewObjSecret(e.target.checked)}
                      className="rounded border-zinc-700"
                    />
                    <span>Objetivo Secreto (GM)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddObjective}
                    className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-bold transition-all"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Objectives List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Objetivos da Missão ({(questData.objectives || []).length})
                </h4>
                {(questData.objectives || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum objetivo cadastrado ainda.</p>
                ) : (
                  (questData.objectives || []).map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={obj.completed}
                          onChange={() => handleToggleObjective(obj.id)}
                          className="rounded border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
                        />
                        <span
                          className={`font-medium truncate ${
                            obj.completed ? 'line-through text-zinc-500' : 'text-zinc-200'
                          }`}
                        >
                          {obj.text}
                        </span>
                        {obj.isSecret && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono shrink-0">
                            GM Secreto
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(obj.id)}
                        className="p-1 rounded hover:bg-rose-950 text-zinc-500 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REWARDS */}
          {activeTab === 'rewards' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    XP Concedido
                  </label>
                  <input
                    type="number"
                    value={questData.rewards?.xp ?? 80}
                    onChange={(e) =>
                      setQuestData({
                        ...questData,
                        rewards: { ...(questData.rewards || {}), xp: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Moedas / Ouro
                  </label>
                  <input
                    type="text"
                    value={questData.rewards?.gold || ''}
                    onChange={(e) =>
                      setQuestData({
                        ...questData,
                        rewards: { ...(questData.rewards || {}), gold: e.target.value },
                      })
                    }
                    placeholder="Ex: 50 PO + 20 PP"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Reputação / Favores
                  </label>
                  <input
                    type="text"
                    value={questData.rewards?.reputation || ''}
                    onChange={(e) =>
                      setQuestData({
                        ...questData,
                        rewards: { ...(questData.rewards || {}), reputation: e.target.value },
                      })
                    }
                    placeholder="Ex: +1 Favor com a Guarda Imperial"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Items & Relics */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Itens e Equipamentos de Recompensa
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newItemReward}
                    onChange={(e) => setNewItemReward(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItemReward())}
                    placeholder="Nome do item ou artefato..."
                    className="flex-1 px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemReward}
                    className="px-3.5 py-2 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-200 text-xs font-bold"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(questData.rewards?.items || []).map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-200"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemReward(idx)}
                        className="hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECRETS (GM) */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Segredos Confidenciais da Missão (Apenas GM)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Verdadeiro mandante, armadilhas planejadas, consequências ocultas de sucesso ou falha.
                </p>
                <textarea
                  rows={6}
                  value={questData.gmNotes || ''}
                  onChange={(e) => setQuestData({ ...questData, gmNotes: e.target.value })}
                  placeholder="Escreva aqui revelações secretas e reviravoltas para o Mestre..."
                  className="w-full p-3 bg-black/70 border border-rose-900/50 rounded-xl text-xs text-rose-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    className="rounded border-zinc-700"
                  />
                  <span>Ocultar missão inteira do quadro dos Jogadores</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: BRIEFING & DESCRIPTION */}
          {activeTab === 'briefing' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Briefing Completo, Rumores & Diálogos
                </label>
                <RichTextBar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
                <textarea
                  ref={contentTextareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva a narrativa da missão, falas do contratante, pistas deixadas pelo cenário..."
                  className="w-full p-3.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0d1021] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Missão</span>
          </button>
        </div>
      </div>

      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          onClose={() => {
            setIsFolderManagerOpen(false);
            refreshFolders();
          }}
          scope="quest"
          categories={[{ id: 'all', name: 'Todas as Missões', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="cyan"
          onRefresh={refreshFolders}
        />
      )}
    </div>
  );
};
