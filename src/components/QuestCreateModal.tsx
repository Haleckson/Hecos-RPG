import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  QuestAttributes,
  QuestObjective,
  QuestStatus,
  QuestDifficulty,
  QuestType,
  QuestPriority,
  QuestRewardCurrency,
  QuestRewardItem,
  QuestOrganizationReputation,
  QuestAttachment,
  ItemVisibility,
  PF2eItemAttributes,
} from '../types';
import { HecosStorage } from '../services/storage';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyQuestData,
  serializeQuestToHTML,
} from '../utils/entitySerializers';
import { IntelligentEntityPicker } from './IntelligentEntityPicker';
import { IntelligentMultiEntityPicker } from './IntelligentMultiEntityPicker';
import { ItemPickerModal } from './ItemPickerModal';
import { ItemDrawer } from './ItemDrawer';
import { QuestAttachmentModal } from './QuestAttachmentModal';
import { MultiImageAlbumUploader } from './MultiImageAlbumUploader';
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
  Minus,
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
  Package,
  ExternalLink,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  Video,
  Music,
  Edit2,
  Film,
  Disc,
} from 'lucide-react';

interface QuestCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'objectives' | 'rewards' | 'attachments' | 'secrets' | 'briefing';

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

  // Attachments State
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<QuestAttachment | null>(null);
  const [isMultiImageModalOpen, setIsMultiImageModalOpen] = useState(false);

  // Objectives State
  const [newObjText, setNewObjText] = useState('');
  const [newObjSecret, setNewObjSecret] = useState(false);

  // Rewards State - Compendium Item Picker & Drawer
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);

  // Rewards State - Manual Item Input
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemQuantity, setManualItemQuantity] = useState<number | string>(1);

  // Rewards State - Currency (Loot style: pp, gp, sp, cp, custom)
  const [rewardCurrency, setRewardCurrency] = useState<QuestRewardCurrency>({
    pp: '',
    gp: '',
    sp: '',
    cp: '',
    custom: '',
  });

  // Rewards State - Organization Reputation Form
  const [repOrgId, setRepOrgId] = useState<string | undefined>(undefined);
  const [repOrgName, setRepOrgName] = useState<string>('');
  const [repChange, setRepChange] = useState<string>('+10');
  const [repNotes, setRepNotes] = useState<string>('');

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
      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      const qd = initEntity.questData ? { ...initEntity.questData } : getEmptyQuestData();
      setQuestData(qd);

      const briefingText = initEntity.questData?.briefing || initEntity.questData?.narrativeLore || initEntity.content || '';
      setContent(briefingText);

      // Populate Currency
      if (qd.rewards?.currency) {
        setRewardCurrency({
          pp: qd.rewards.currency.pp ?? '',
          gp: qd.rewards.currency.gp ?? qd.rewards.gold ?? '',
          sp: qd.rewards.currency.sp ?? '',
          cp: qd.rewards.currency.cp ?? '',
          custom: qd.rewards.currency.custom ?? '',
        });
      } else if (qd.rewards?.gold) {
        setRewardCurrency({
          pp: '',
          gp: qd.rewards.gold,
          sp: '',
          cp: '',
          custom: '',
        });
      } else {
        setRewardCurrency({ pp: '', gp: '', sp: '', cp: '', custom: '' });
      }
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('missao, quest, hecos');
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      const empty = getEmptyQuestData();
      setQuestData(empty);
      setRewardCurrency({ pp: '', gp: '50', sp: '', cp: '', custom: '' });
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

  // ─── OBJECTIVES HANDLERS ───
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

  // ─── REWARDS - ITEMS HANDLERS ───
  // Handle items selected from ItemPickerModal
  const handleSelectCompendiumItems = (
    selectedItems: {
      entity: HecosEntity;
      parsedItem: PF2eItemAttributes;
      quantity: number | string;
      notes?: string;
    }[]
  ) => {
    const existing = questData.rewards?.structuredItems || [];
    const newItems: QuestRewardItem[] = selectedItems.map((item) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: item.entity.title,
      itemEntityId: item.entity.id,
      itemId: item.entity.id,
      quantity: item.quantity || 1,
      category: item.parsedItem?.itemType,
      rarity: item.parsedItem?.rarity || 'Comum',
      price: item.parsedItem?.price,
      level: item.parsedItem?.level,
      traits: item.parsedItem?.traits || [],
      notes: item.notes,
    }));

    // Avoid duplicates by itemEntityId
    const existingIds = new Set(existing.map((it) => it.itemEntityId || it.name));
    const filteredNew = newItems.filter((it) => !existingIds.has(it.itemEntityId || it.name));

    const updated = [...existing, ...filteredNew];

    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        structuredItems: updated,
        items: updated.map((i) => (Number(i.quantity) > 1 ? `${i.quantity}x ${i.name}` : i.name)),
      },
    }));
    setIsItemPickerOpen(false);
  };

  const handleAddManualItem = () => {
    const trimmed = manualItemName.trim();
    if (!trimmed) return;
    const newItem: QuestRewardItem = {
      id: `item-${Date.now()}`,
      name: trimmed,
      quantity: manualItemQuantity || 1,
      rarity: 'Comum',
    };

    const updated = [...(questData.rewards?.structuredItems || []), newItem];
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        structuredItems: updated,
        items: updated.map((i) => (Number(i.quantity) > 1 ? `${i.quantity}x ${i.name}` : i.name)),
      },
    }));
    setManualItemName('');
    setManualItemQuantity(1);
  };

  const handleUpdateItemQuantity = (id: string, newQty: number | string) => {
    const updated = (questData.rewards?.structuredItems || []).map((item) =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        structuredItems: updated,
        items: updated.map((i) => (Number(i.quantity) > 1 ? `${i.quantity}x ${i.name}` : i.name)),
      },
    }));
  };

  const handleRemoveRewardItem = (id: string) => {
    const updated = (questData.rewards?.structuredItems || []).filter((item) => item.id !== id);
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        structuredItems: updated,
        items: updated.map((i) => (Number(i.quantity) > 1 ? `${i.quantity}x ${i.name}` : i.name)),
      },
    }));
  };

  // ─── REWARDS - ORGANIZATION REPUTATION HANDLERS ───
  const handleAddOrgReputation = () => {
    if (!repOrgName.trim()) return;
    const newRep: QuestOrganizationReputation = {
      id: `rep-${Date.now()}`,
      organizationEntityId: repOrgId,
      organizationName: repOrgName.trim(),
      reputationChange: repChange.trim() || '+10',
      notes: repNotes.trim() || undefined,
    };

    const updatedList = [...(questData.rewards?.organizationReputations || []), newRep];
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        organizationReputations: updatedList,
      },
    }));
    setRepOrgId(undefined);
    setRepOrgName('');
    setRepChange('+10');
    setRepNotes('');
  };

  const handleRemoveOrgReputation = (id: string) => {
    const updatedList = (questData.rewards?.organizationReputations || []).filter((r) => r.id !== id);
    setQuestData((prev) => ({
      ...prev,
      rewards: {
        ...(prev.rewards || {}),
        organizationReputations: updatedList,
      },
    }));
  };

  // ─── ATTACHMENT HANDLERS ───
  const handleSaveAttachment = (att: QuestAttachment) => {
    const existing = questData.attachments || [];
    const index = existing.findIndex((a) => a.id === att.id);
    let updated: QuestAttachment[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = att;
    } else {
      updated = [...existing, att];
    }
    setQuestData((prev) => ({
      ...prev,
      attachments: updated,
    }));
    setEditingAttachment(null);
  };

  const handleDeleteAttachment = (id: string) => {
    const updated = (questData.attachments || []).filter((a) => a.id !== id);
    setQuestData((prev) => ({
      ...prev,
      attachments: updated,
    }));
  };

  const handleImagesUploaded = (images: { url: string; caption?: string }[]) => {
    const newAttachments: QuestAttachment[] = images.map((img, idx) => ({
      id: `att-album-${Date.now()}-${idx}`,
      title: img.caption?.trim() || `Imagem ${(questData.attachments?.length || 0) + idx + 1}`,
      url: img.url,
      caption: img.caption?.trim() || undefined,
      type: 'image',
      createdAt: Date.now(),
    }));
    setQuestData((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...newAttachments],
    }));
    setIsMultiImageModalOpen(false);
  };

  // ─── SAVE HANDLER ───
  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o título da missão.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Synchronize rewards
    const fullRewards = {
      ...(questData.rewards || {}),
      xp: questData.rewards?.xp ?? 80,
      gold: rewardCurrency.gp ? `${rewardCurrency.gp} po` : questData.rewards?.gold || '',
      currency: rewardCurrency,
      structuredItems: questData.rewards?.structuredItems || [],
      items: (questData.rewards?.structuredItems || []).map((i) =>
        Number(i.quantity) > 1 ? `${i.quantity}x ${i.name}` : i.name
      ),
      organizationReputations: questData.rewards?.organizationReputations || [],
      reputation: questData.rewards?.reputation || '',
    };

    const fullQuestData: QuestAttributes = {
      ...questData,
      briefing: content.trim(),
      narrativeLore: content.trim(),
      rewards: fullRewards,
      subcategories: selectedSubcategories,
      // Mirror organization & faction
      organization: questData.organization || questData.faction,
      organizationEntityId: questData.organizationEntityId || questData.factionEntityId,
      faction: questData.faction || questData.organization,
      factionEntityId: questData.factionEntityId || questData.organizationEntityId,
      involvedOrgIds: questData.involvedOrgIds || questData.linkedOrganizationIds || [],
      linkedOrganizationIds: questData.linkedOrganizationIds || questData.involvedOrgIds || [],
    };

    const finalHTML = serializeQuestToHTML(title, fullQuestData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug:
        initEntity?.slug ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') ||
        'quest-' + Date.now(),
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
                Gerencie objetivos, contratantes, organizações e recompensas com moedas e itens do Compêndio.
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
            { id: 'objectives', label: 'Objetivos', icon: Sparkles, count: questData.objectives?.length },
            { id: 'rewards', label: 'Recompensas & Loot', icon: Award },
            { id: 'attachments', label: 'Anexos & Mídia', icon: Paperclip, count: (questData.attachments || []).length },
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
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                    active ? 'bg-cyan-900 text-cyan-200' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
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
                    label="Organização Patrocinadora"
                    category="organization"
                    valueId={questData.organizationEntityId || questData.factionEntityId}
                    valueName={questData.organization || questData.faction}
                    placeholder="Buscar organização ou facção..."
                    onChange={(id, title) => {
                      setQuestData({
                        ...questData,
                        organization: title || '',
                        organizationEntityId: id,
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

              {/* Multi-links: NPCs, Locations & Organizations involved */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    selectedIds={questData.relatedLocationIds || questData.involvedLocationIds || []}
                    badgeTheme="cyan"
                    placeholder="Buscar e vincular locais a esta quest..."
                    onChange={(ids) => {
                      setQuestData({
                        ...questData,
                        relatedLocationIds: ids,
                        involvedLocationIds: ids,
                      });
                    }}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-purple-900/40 space-y-2">
                  <IntelligentMultiEntityPicker
                    label="Organizações & Facções Vinculadas"
                    category="organization"
                    selectedIds={questData.involvedOrgIds || questData.linkedOrganizationIds || []}
                    badgeTheme="purple"
                    placeholder="Buscar e vincular organizações..."
                    onChange={(ids) => {
                      setQuestData({
                        ...questData,
                        involvedOrgIds: ids,
                        linkedOrganizationIds: ids,
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
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                    className="px-2.5 py-1 text-xs rounded-lg bg-cyan-900/60 text-cyan-200 border border-cyan-700 cursor-pointer"
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
                    className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
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
                        className="p-1 rounded hover:bg-rose-950 text-zinc-500 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REWARDS & LOOT */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              {/* SECTION A: EXP & REPUTAÇÃO GERAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      Experiência (XP)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Recomendado: 80 XP (Moderada)</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={questData.rewards?.xp ?? 80}
                    onChange={(e) =>
                      setQuestData({
                        ...questData,
                        rewards: { ...(questData.rewards || {}), xp: parseInt(e.target.value) || 0 },
                      })
                    }
                    placeholder="80"
                    className="w-full px-3.5 py-2 bg-black/60 border border-amber-900/50 rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-cyan-900/40 space-y-2">
                  <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Reputação Geral / Favores
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
                    placeholder="Ex: Título de 'Herói de Zephyr', Acesso aos Arquivos Reais"
                    className="w-full px-3.5 py-2 bg-black/60 border border-cyan-900/50 rounded-xl text-sm text-cyan-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* SECTION B: RECOMPENSAS EM MOEDAS (ESTILO LOOT DE PERIGO) */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-900/40 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                      Recompensa Financeira & Moedas (Loot)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Peças de ouro, platina, prata, cobre ou riquezas customizadas que o grupo receberá ao concluir a missão.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Cobre */}
                  <div className="bg-black/50 border border-amber-900/40 rounded-xl p-2.5 space-y-1 focus-within:border-amber-600 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-600">
                      <span>Cobre</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-500 border border-amber-800/40 font-mono">cp</span>
                    </div>
                    <input
                      type="text"
                      value={rewardCurrency.cp ?? ''}
                      onChange={(e) => setRewardCurrency({ ...rewardCurrency, cp: e.target.value })}
                      placeholder="0"
                      className="w-full text-sm font-semibold bg-transparent text-amber-500 placeholder-zinc-700 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Prata */}
                  <div className="bg-black/50 border border-slate-600/40 rounded-xl p-2.5 space-y-1 focus-within:border-slate-400 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Prata</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">sp</span>
                    </div>
                    <input
                      type="text"
                      value={rewardCurrency.sp ?? ''}
                      onChange={(e) => setRewardCurrency({ ...rewardCurrency, sp: e.target.value })}
                      placeholder="0"
                      className="w-full text-sm font-semibold bg-transparent text-slate-200 placeholder-zinc-700 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Ouro */}
                  <div className="bg-black/50 border border-amber-500/50 rounded-xl p-2.5 space-y-1 focus-within:border-amber-400 transition-colors shadow-sm shadow-amber-950/20">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>Ouro</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-600/40 font-mono">gp / po</span>
                    </div>
                    <input
                      type="text"
                      value={rewardCurrency.gp ?? ''}
                      onChange={(e) => setRewardCurrency({ ...rewardCurrency, gp: e.target.value })}
                      placeholder="50"
                      className="w-full text-sm font-semibold bg-transparent text-amber-300 placeholder-zinc-700 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Platina */}
                  <div className="bg-black/50 border border-cyan-500/40 rounded-xl p-2.5 space-y-1 focus-within:border-cyan-400 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                      <span>Platina</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 font-mono">pp</span>
                    </div>
                    <input
                      type="text"
                      value={rewardCurrency.pp ?? ''}
                      onChange={(e) => setRewardCurrency({ ...rewardCurrency, pp: e.target.value })}
                      placeholder="0"
                      className="w-full text-sm font-semibold bg-transparent text-cyan-200 placeholder-zinc-700 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Custom Gemas & Joias */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Gemas, Joias & Riquezas Adicionais
                  </label>
                  <input
                    type="text"
                    value={rewardCurrency.custom ?? ''}
                    onChange={(e) => setRewardCurrency({ ...rewardCurrency, custom: e.target.value })}
                    placeholder="Ex: 1x Safira Estelar lapidada (100 po), 2x Lingotes de Prata Lunar"
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SECTION C: ITENS IMPORTADOS DO COMPÊNDIO DE ITENS */}
              <div className="p-4 rounded-2xl bg-black/40 border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                        Itens e Equipamentos de Recompensa
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Importe itens da categoria Itens ou adicione equipamentos manuais.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsItemPickerOpen(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Coins className="w-3.5 h-3.5 text-zinc-950" />
                      Importar Itens da Categoria Itens
                    </button>
                  </div>
                </div>

                {/* Manual Item Quick Add */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <input
                    type="text"
                    value={manualItemName}
                    onChange={(e) => setManualItemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManualItem())}
                    placeholder="Adicionar item customizado manualmente..."
                    className="flex-1 px-3 py-1.5 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex items-center gap-1 bg-black/60 border border-zinc-700 rounded-lg px-2 py-1">
                    <span className="text-[11px] text-zinc-400">Qtd:</span>
                    <input
                      type="number"
                      min={1}
                      value={manualItemQuantity}
                      onChange={(e) => setManualItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-12 text-xs font-bold text-zinc-200 bg-transparent text-center focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Structured Items List */}
                {(!questData.rewards?.structuredItems || questData.rewards.structuredItems.length === 0) ? (
                  <div className="p-6 border border-dashed border-zinc-800 rounded-xl text-center space-y-2 bg-black/20">
                    <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400 font-medium">Nenhum item associado como recompensa desta missão.</p>
                    <p className="text-[11px] text-zinc-600">
                      Clique em &quot;Importar Itens da Categoria Itens&quot; para puxar armas, poções, armaduras e relíquias do sistema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questData.rewards.structuredItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-black/50 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-center text-amber-400 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-zinc-100 truncate">{item.name}</span>
                              {item.level !== undefined && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  Nível {item.level}
                                </span>
                              )}
                              {item.rarity && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/40 text-amber-400 border border-amber-800/40">
                                  {item.rarity}
                                </span>
                              )}
                              {item.price && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-amber-300 border border-zinc-800">
                                  {item.price}
                                </span>
                              )}
                              {item.itemEntityId && (
                                <button
                                  type="button"
                                  onClick={() => setDrawerItemId(item.itemEntityId!)}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/60 flex items-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Ver Detalhes
                                </button>
                              )}
                            </div>
                            {item.traits && item.traits.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.traits.map((t, idx) => (
                                  <span key={idx} className="text-[9px] px-1 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const current = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity), 10) || 1;
                                if (current > 1) {
                                  handleUpdateItemQuantity(item.id, current - 1);
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <input
                              type="text"
                              value={item.quantity ?? 1}
                              onChange={(e) => handleUpdateItemQuantity(item.id, e.target.value)}
                              className="w-7 text-center text-xs font-bold text-zinc-200 bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity), 10) || 1;
                                handleUpdateItemQuantity(item.id, current + 1);
                              }}
                              className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveRewardItem(item.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Remover item da recompensa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION D: GANHOS DE REPUTAÇÃO COM ORGANIZAÇÕES */}
              <div className="p-4 rounded-2xl bg-black/40 border border-purple-900/40 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                      Reputação e Influência com Organizações
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Defina ganhos ou perdas de prestígio, respeito ou favores com facções e guildas ao concluir a missão.
                    </p>
                  </div>
                </div>

                {/* Form to Add Org Rep */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                  <div className="sm:col-span-5">
                    <IntelligentEntityPicker
                      label="Organização / Facção"
                      category="organization"
                      valueId={repOrgId}
                      valueName={repOrgName}
                      placeholder="Selecionar organização..."
                      onChange={(id, orgTitle) => {
                        setRepOrgId(id);
                        setRepOrgName(orgTitle || '');
                      }}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Mudança de Reputação
                    </label>
                    <input
                      type="text"
                      value={repChange}
                      onChange={(e) => setRepChange(e.target.value)}
                      placeholder="Ex: +10 Pontos, +1 Grau, -5"
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-purple-200 font-bold focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Observação / Consequência
                    </label>
                    <input
                      type="text"
                      value={repNotes}
                      onChange={(e) => setRepNotes(e.target.value)}
                      placeholder="Ex: Acesso à biblioteca da ordem"
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddOrgReputation}
                      className="w-full py-2 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-200 rounded-xl text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
                      title="Adicionar ganho de reputação"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Organization Reputation List */}
                {(!questData.rewards?.organizationReputations || questData.rewards.organizationReputations.length === 0) ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum vínculo de reputação de organização cadastrado nesta missão.</p>
                ) : (
                  <div className="space-y-2">
                    {questData.rewards.organizationReputations.map((rep) => (
                      <div
                        key={rep.id}
                        className="bg-black/50 border border-purple-900/50 rounded-xl p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                          <span className="font-bold text-xs text-purple-200">{rep.organizationName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-700">
                            {rep.reputationChange}
                          </span>
                          {rep.notes && (
                            <span className="text-[11px] text-zinc-400 italic truncate">— {rep.notes}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrgReputation(rep.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ATTACHMENTS & MULTIMEDIA */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-900/60 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-cyan-400" />
                    Anexos & Recursos Multimídia ({(questData.attachments || []).length})
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Imagens (ImgBB), Vídeos do YouTube, Músicas (Google Drive) e Documentos vinculados.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMultiImageModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Álbum de Imagens
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAttachment(null);
                      setIsAttachmentModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-zinc-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Mídia / Música
                  </button>
                </div>
              </div>

              {/* Attachments List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(questData.attachments || []).map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-2xl bg-black/60 border border-zinc-800 hover:border-cyan-800 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {att.type === 'video' ? (
                            <Film className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : att.type === 'audio' ? (
                            <Disc className="w-4 h-4 text-purple-400 shrink-0" />
                          ) : att.type === 'map' ? (
                            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : att.type === 'handout' ? (
                            <Scroll className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-zinc-100 truncate">{att.title}</span>
                        </div>

                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 shrink-0">
                          {att.type}
                        </span>
                      </div>

                      {att.type === 'image' && att.url && (
                        <div className="h-28 rounded-xl overflow-hidden bg-black border border-zinc-800">
                          <img
                            src={att.url}
                            alt={att.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {att.type === 'video' && att.videoId && (
                        <div className="h-28 rounded-xl overflow-hidden bg-black border border-rose-900/60 relative">
                          <img
                            src={`https://img.youtube.com/vi/${att.videoId}/hqdefault.jpg`}
                            alt={att.title}
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="p-2 rounded-full bg-rose-600/90 text-white shadow-lg">
                              <Film className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      )}

                      {att.type === 'audio' && (
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-900/60 flex items-center gap-2.5">
                          <Disc className="w-6 h-6 text-purple-400 shrink-0 animate-spin-slow" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-purple-200 block truncate">
                              {att.isDriveAudio ? 'Google Drive Áudio' : 'Arquivo de Áudio'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono truncate block">{att.url}</span>
                          </div>
                        </div>
                      )}

                      {att.caption && (
                        <p className="text-[11px] text-zinc-400 italic line-clamp-2">{att.caption}</p>
                      )}

                      {att.isSecret && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                          <Lock className="w-2.5 h-2.5" /> Confidencial GM
                        </span>
                      )}
                    </div>

                    <div className="pt-2.5 mt-2.5 border-t border-zinc-900 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAttachment(att);
                          setIsAttachmentModalOpen(true);
                        }}
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {(questData.attachments || []).length === 0 && (
                  <div className="col-span-full p-8 text-center rounded-2xl bg-black/20 border border-dashed border-zinc-800 text-zinc-500 text-xs">
                    Nenhum anexo ou mídia adicionado. Clique no botão acima para adicionar imagens, vídeos do YouTube ou músicas do Google Drive.
                  </div>
                )}
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

      {/* Item Picker Modal (Compendium Item category import) */}
      {isItemPickerOpen && (
        <ItemPickerModal
          isOpen={isItemPickerOpen}
          onClose={() => setIsItemPickerOpen(false)}
          onSelectItems={handleSelectCompendiumItems}
          title="Importar Itens da Categoria Itens para a Recompensa"
        />
      )}

      {/* Item Drawer for previewing items */}
      {drawerItemId && (
        <ItemDrawer
          itemId={drawerItemId}
          entities={HecosStorage.getEntities()}
          isOpen={Boolean(drawerItemId)}
          onClose={() => setDrawerItemId(null)}
          onNavigateFullPage={(entityId) => {
            setDrawerItemId(null);
            // Close drawer and navigate if needed
            window.location.hash = `#entity-${entityId}`;
          }}
        />
      )}
      {/* Quest Attachment Modal */}
      {isAttachmentModalOpen && (
        <QuestAttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={() => {
            setIsAttachmentModalOpen(false);
            setEditingAttachment(null);
          }}
          onSaveAttachment={handleSaveAttachment}
          editAttachment={editingAttachment}
          questTitle={title || 'Nova Missão'}
        />
      )}

      {/* Multi-Image Album Uploader */}
      {isMultiImageModalOpen && (
        <MultiImageAlbumUploader
          onImagesUploaded={handleImagesUploaded}
          onCancel={() => setIsMultiImageModalOpen(false)}
          title={`Álbum de Imagens: ${title || 'Missão'}`}
          description="Envie múltiplas imagens de uma vez para anexar à missão via ImgBB."
          category="quest"
          entityName={title || 'Missão'}
        />
      )}
    </div>
  );
};
