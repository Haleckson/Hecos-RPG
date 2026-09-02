import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  NPCAttributes,
  NPCDisposition,
  NPCRarity,
  NPCSize,
  NPCRumor,
  NPCSessionMemory,
  NPCLootItem,
  NPCRelationship,
  NPCQuestLink,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import { ItemPickerModal } from './ItemPickerModal';
import { ItemDrawer } from './ItemDrawer';
import { ItemCreateModal } from './ItemCreateModal';
import { RichTextBar } from './RichTextBar';
import { RichContentRenderer } from './RichContentRenderer';
import { TraitBadge } from './TraitBadge';
import {
  canonicalizeSizeName,
  canonicalizeRarityName,
  CANONICAL_SIZES,
  CANONICAL_RARITIES,
} from '../utils/traitUtils';
import {
  getEmptyNPCData,
  getDefaultNPCData,
  DISPOSITION_CONFIG,
  serializeNPCToHTML,
} from '../utils/npcSerializer';
import { parseItemFromContent } from '../utils/itemSerializer';
import { IntelligentEntityPicker } from './IntelligentEntityPicker';
import { IntelligentMultiEntityPicker } from './IntelligentMultiEntityPicker';
import { MutualLinkService } from '../services/mutualLinkService';
import {
  User,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Lock,
  Users,
  Check,
  X,
  FileText,
  BookOpen,
  Folder,
  FolderPlus,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Swords,
  History,
  Briefcase,
  MapPin,
  Flame,
  Volume2,
  Smile,
  Compass,
  Zap,
  Quote,
  Coins,
  Package,
  Scroll,
  HeartHandshake,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Maximize2,
  FlaskConical,
  Layers,
  Wand2,
  Edit3,
} from 'lucide-react';

interface NPCCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'identity' | 'roleplay' | 'relationships' | 'quests' | 'loot' | 'mechanics' | 'gm' | 'bio';

export const NPCCreateModal: React.FC<NPCCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initEntity,
  presetSubcategory,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isGm = currentUser?.role === 'gm';

  // Available folders for NPCs
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [isItemPickerOpen, setIsItemPickerOpen] = useState(false);
  const [isItemCreateOpen, setIsItemCreateOpen] = useState(false);
  const [activeDrawerItemId, setActiveDrawerItemId] = useState<string | null>(null);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [allEntities, setAllEntities] = useState<HecosEntity[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('identity');

  // Base Entity Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [gmNotes, setGmNotes] = useState('');
  const [content, setContent] = useState('');

  // Selected Folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');

  // NPC Structured Attributes State
  const [npcData, setNpcData] = useState<NPCAttributes>(getEmptyNPCData());

  // Input states for dynamic lists
  const [newTraitInput, setNewTraitInput] = useState('');
  const [newRumorText, setNewRumorText] = useState('');
  const [newRumorSource, setNewRumorSource] = useState('');
  const [newRumorIsTrue, setNewRumorIsTrue] = useState<boolean | undefined>(undefined);

  // New Custom Loot item state
  const [newLootName, setNewLootName] = useState('');
  const [newLootQty, setNewLootQty] = useState<number | string>(1);
  const [newLootValue, setNewLootValue] = useState('');
  const [newLootDesc, setNewLootDesc] = useState('');
  const [newLootEquipped, setNewLootEquipped] = useState(false);
  const [newLootSecret, setNewLootSecret] = useState(false);

  // New Relationship state
  const [newRelTargetName, setNewRelTargetName] = useState('');
  const [newRelTargetEntityId, setNewRelTargetEntityId] = useState<string | undefined>(undefined);
  const [newRelType, setNewRelType] = useState('');
  const [newRelAttitude, setNewRelAttitude] = useState<NPCDisposition>('indifferent');
  const [newRelNotes, setNewRelNotes] = useState('');
  const [newRelSecret, setNewRelSecret] = useState(false);

  // New Quest state
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestEntityId, setNewQuestEntityId] = useState<string | undefined>(undefined);
  const [newQuestRole, setNewQuestRole] = useState('Doador da Missão');
  const [newQuestDesc, setNewQuestDesc] = useState('');
  const [newQuestSecret, setNewQuestSecret] = useState(false);

  // New Session Log state
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDate, setNewLogDate] = useState('');
  const [newLogNote, setNewLogNote] = useState('');

  // Markdown Bio View Mode (Split or Edit)
  const [bioViewMode, setBioViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Textarea refs for rich formatting
  const conceptRef = useRef<HTMLTextAreaElement>(null);
  const voiceRef = useRef<HTMLTextAreaElement>(null);
  const mannerismsRef = useRef<HTMLTextAreaElement>(null);
  const impressionRef = useRef<HTMLTextAreaElement>(null);
  const motivationsRef = useRef<HTMLTextAreaElement>(null);
  const triggersRef = useRef<HTMLTextAreaElement>(null);
  const canOfferRef = useRef<HTMLTextAreaElement>(null);
  const secretsRef = useRef<HTMLTextAreaElement>(null);
  const gmSecretRef = useRef<HTMLTextAreaElement>(null);
  const gmPlotHookRef = useRef<HTMLTextAreaElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  // All entities for picking relationships
  const [allCharacters, setAllCharacters] = useState<HecosEntity[]>([]);

  // Load existing subcategories / folders
  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('npc');
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
      if (e.category === 'npc' || e.npcData) {
        (e.npcData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
          if (s) set.add(s.trim());
        });
      }
    });

    setExistingFolders(Array.from(set).sort());
    setAllEntities(ents);
    setAllCharacters(ents.filter(e => e.category === 'npc' || e.category === 'pc' || e.npcData));
  };

  useEffect(() => {
    if (isOpen) {
      refreshFolders();

      if (initEntity) {
        setTitle(initEntity.title || '');
        setSubtitle(initEntity.subtitle || '');
        setTagsInput((initEntity.tags || []).join(', '));
        setIsSecret(Boolean(initEntity.isSecret));
        setVisibility(initEntity.visibility || 'all');
        setAllowedUserIds(initEntity.allowedUserIds || []);
        setGmNotes(initEntity.gmNotes || '');
        setContent(initEntity.content || '');

        const subs = initEntity.npcData?.subcategories || initEntity.subcategories || (initEntity.subcategory ? [initEntity.subcategory] : []);
        setSelectedSubcategories(subs);

        const loadedNpcData = initEntity.npcData ? { ...initEntity.npcData } : getEmptyNPCData();
        // Ensure arrays exist and traits are cleanly initialized
        if (loadedNpcData.traits === undefined) {
          loadedNpcData.traits = Array.isArray(initEntity.traits) ? [...initEntity.traits] : [];
        } else {
          loadedNpcData.traits = Array.isArray(loadedNpcData.traits) ? [...loadedNpcData.traits] : [];
        }
        loadedNpcData.loot = loadedNpcData.loot || [];
        loadedNpcData.relationships = loadedNpcData.relationships || [];
        loadedNpcData.quests = loadedNpcData.quests || [];
        loadedNpcData.rumors = loadedNpcData.rumors || [];
        loadedNpcData.sessionLog = loadedNpcData.sessionLog || [];
        loadedNpcData.currency = loadedNpcData.currency || { po: '', pp: '', pc: '', custom: '' };
        setNpcData(loadedNpcData);
      } else {
        // Clean blank slate for fresh NPC
        setTitle('');
        setSubtitle('');
        setTagsInput('');
        setIsSecret(false);
        setVisibility('all');
        setAllowedUserIds([]);
        setGmNotes('');
        setContent('');
        setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
        setNpcData(getEmptyNPCData());
      }
      setActiveTab('identity');
    }
  }, [isOpen, initEntity, presetSubcategory]);

  if (!isOpen) return null;

  // Folder toggling
  const toggleSubcategory = (folder: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(folder) ? prev.filter((f) => f !== folder) : [...prev, folder]
    );
  };

  const handleAddNewFolder = () => {
    if (!newFolderInput.trim()) return;
    const folder = newFolderInput.trim();
    HecosStorage.addScopeSubcategory('npc', 'all', folder);
    if (!selectedSubcategories.includes(folder)) {
      setSelectedSubcategories((prev) => [...prev, folder]);
    }
    setNewFolderInput('');
    refreshFolders();
  };

  // Trait handling
  const handleAddTrait = (trait: string) => {
    const trimmed = trait.trim();
    if (!trimmed) return;
    if (!(npcData.traits || []).includes(trimmed)) {
      setNpcData((prev) => ({
        ...prev,
        traits: [...(prev.traits || []), trimmed],
      }));
    }
    setNewTraitInput('');
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    setNpcData((prev) => ({
      ...prev,
      traits: (prev.traits || []).filter((t) => t !== traitToRemove),
    }));
  };

  // Rumor handling
  const handleAddRumor = () => {
    if (!newRumorText.trim()) return;
    const rumor: NPCRumor = {
      id: `rumor-${Date.now()}`,
      text: newRumorText.trim(),
      source: newRumorSource.trim() || undefined,
      isTrue: newRumorIsTrue,
    };
    setNpcData((prev) => ({
      ...prev,
      rumors: [...(prev.rumors || []), rumor],
    }));
    setNewRumorText('');
    setNewRumorSource('');
    setNewRumorIsTrue(undefined);
  };

  const handleRemoveRumor = (id: string) => {
    setNpcData((prev) => ({
      ...prev,
      rumors: (prev.rumors || []).filter((r) => r.id !== id),
    }));
  };

  // Loot handling
  const handleOpenItemDrawer = (itemEntityIdOrId?: string, itemName?: string) => {
    if (itemEntityIdOrId) {
      const exists = allEntities.find((e) => e.id === itemEntityIdOrId);
      if (exists) {
        setActiveDrawerItemId(exists.id);
        setIsItemDrawerOpen(true);
        return;
      }
    }
    if (itemName) {
      const match = allEntities.find(
        (e) =>
          e.title.toLowerCase() === itemName.toLowerCase() ||
          (e.category === 'item' && e.title.toLowerCase().includes(itemName.toLowerCase()))
      );
      if (match) {
        setActiveDrawerItemId(match.id);
        setIsItemDrawerOpen(true);
        return;
      }
    }
    if (itemEntityIdOrId) {
      setActiveDrawerItemId(itemEntityIdOrId);
      setIsItemDrawerOpen(true);
    }
  };

  const handleItemCreated = (newEntity: HecosEntity) => {
    const parsed = parseItemFromContent(newEntity.content || '', newEntity.itemData);
    const newLoot: NPCLootItem = {
      id: `loot-created-${newEntity.id}-${Date.now()}`,
      name: newEntity.title,
      itemEntityId: newEntity.id,
      itemId: newEntity.id,
      slug: newEntity.slug,
      quantity: 1,
      category: parsed.itemType || 'gear',
      priceOrValue: parsed.price || (parsed.level !== undefined ? `Nível ${parsed.level}` : undefined),
      description: parsed.description || newEntity.summary || (parsed.traits?.join(', ') || undefined),
      isEquipped: false,
      isSecret: false,
    };
    setNpcData((prev) => ({
      ...prev,
      loot: [...(prev.loot || []), newLoot],
    }));
    refreshFolders();
    setIsItemCreateOpen(false);
  };

  const handleAddCustomLoot = () => {
    if (!newLootName.trim()) return;
    const newItem: NPCLootItem = {
      id: `loot-${Date.now()}`,
      name: newLootName.trim(),
      quantity: typeof newLootQty === 'string' ? (parseInt(newLootQty, 10) || 1) : newLootQty,
      priceOrValue: newLootValue.trim() || undefined,
      description: newLootDesc.trim() || undefined,
      isEquipped: newLootEquipped,
      isSecret: newLootSecret,
    };
    setNpcData((prev) => ({
      ...prev,
      loot: [...(prev.loot || []), newItem],
    }));
    setNewLootName('');
    setNewLootQty(1);
    setNewLootValue('');
    setNewLootDesc('');
    setNewLootEquipped(false);
    setNewLootSecret(false);
  };

  const handleSelectCompendiumItems = (
    selected: { entity: HecosEntity; parsedItem: any; quantity: number | string; notes?: string }[]
  ) => {
    const newItems: NPCLootItem[] = selected.map((s) => ({
      id: `loot-comp-${s.entity.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: s.entity.title,
      itemEntityId: s.entity.id,
      itemId: s.entity.id,
      slug: s.entity.slug,
      quantity: s.quantity || 1,
      category: s.parsedItem.itemType || 'gear',
      priceOrValue: s.parsedItem.price || (s.parsedItem.level !== undefined ? `Nível ${s.parsedItem.level}` : undefined),
      description: s.notes || s.entity.summary || s.parsedItem.traits?.join(', '),
      isEquipped: false,
      isSecret: false,
    }));

    setNpcData((prev) => ({
      ...prev,
      loot: [...(prev.loot || []), ...newItems],
    }));
    setIsItemPickerOpen(false);
  };

  const handleUpdateLootQuantity = (id: string, delta: number) => {
    setNpcData((prev) => ({
      ...prev,
      loot: (prev.loot || []).map((item) => {
        if (item.id !== id) return item;
        const currentQty = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity || 1), 10) || 1;
        const newQty = Math.max(1, currentQty + delta);
        return { ...item, quantity: newQty };
      }),
    }));
  };

  const handleSetLootQuantityDirect = (id: string, val: string | number) => {
    const parsed = typeof val === 'number' ? val : parseInt(val, 10);
    setNpcData((prev) => ({
      ...prev,
      loot: (prev.loot || []).map((item) => {
        if (item.id !== id) return item;
        return { ...item, quantity: isNaN(parsed) ? 1 : Math.max(1, parsed) };
      }),
    }));
  };

  const handleRemoveLoot = (id: string) => {
    setNpcData((prev) => ({
      ...prev,
      loot: (prev.loot || []).filter((l) => l.id !== id),
    }));
  };

  const toggleLootEquipped = (id: string) => {
    setNpcData((prev) => ({
      ...prev,
      loot: (prev.loot || []).map((l) => (l.id === id ? { ...l, isEquipped: !l.isEquipped } : l)),
    }));
  };

  const toggleLootSecret = (id: string) => {
    setNpcData((prev) => ({
      ...prev,
      loot: (prev.loot || []).map((l) => (l.id === id ? { ...l, isSecret: !l.isSecret } : l)),
    }));
  };

  // Relationship handling
  const handleAddRelationship = () => {
    if (!newRelTargetName.trim()) return;
    const newRel: NPCRelationship = {
      id: `rel-${Date.now()}`,
      targetEntityId: newRelTargetEntityId,
      targetName: newRelTargetName.trim(),
      targetCategory: 'npc',
      relationshipType: newRelType.trim() || 'Conhecido',
      attitude: newRelAttitude,
      notes: newRelNotes.trim() || undefined,
      isSecret: newRelSecret,
    };
    setNpcData((prev) => ({
      ...prev,
      relationships: [...(prev.relationships || []), newRel],
    }));
    setNewRelTargetName('');
    setNewRelTargetEntityId(undefined);
    setNewRelType('');
    setNewRelAttitude('indifferent');
    setNewRelNotes('');
    setNewRelSecret(false);
  };

  const handleRemoveRelationship = (id: string) => {
    setNpcData((prev) => ({
      ...prev,
      relationships: (prev.relationships || []).filter((r) => r.id !== id),
    }));
  };

  // Quest handling
  const handleAddQuest = () => {
    if (!newQuestTitle.trim()) return;
    const newQ: NPCQuestLink = {
      id: `quest-${Date.now()}`,
      questEntityId: newQuestEntityId,
      title: newQuestTitle.trim(),
      roleInQuest: newQuestRole.trim() || 'Doador da Missão',
      description: newQuestDesc.trim() || undefined,
      isSecret: newQuestSecret,
    };
    setNpcData((prev) => ({
      ...prev,
      quests: [...(prev.quests || []), newQ],
    }));
    setNewQuestTitle('');
    setNewQuestEntityId(undefined);
    setNewQuestRole('Doador da Missão');
    setNewQuestDesc('');
    setNewQuestSecret(false);
  };

  const handleRemoveQuest = (idOrQuestEntityId: string) => {
    const targetQ = (npcData.quests || []).find(
      (q) => q.id === idOrQuestEntityId || q.questEntityId === idOrQuestEntityId
    );
    const questEntityIdToRemove = targetQ?.questEntityId || idOrQuestEntityId;

    setNpcData((prev) => ({
      ...prev,
      quests: (prev.quests || []).filter(
        (q) => q.id !== idOrQuestEntityId && q.questEntityId !== idOrQuestEntityId
      ),
      questIds: (prev.questIds || []).filter(
        (qId) => qId !== idOrQuestEntityId && qId !== questEntityIdToRemove
      ),
    }));
  };

  // Session memory handling
  const handleAddSessionMemory = () => {
    if (!newLogNote.trim()) return;
    const memory: NPCSessionMemory = {
      id: `session-${Date.now()}`,
      sessionTitleOrNumber: newLogTitle.trim() || undefined,
      date: newLogDate || new Date().toISOString().split('T')[0],
      note: newLogNote.trim(),
    };
    setNpcData((prev) => ({
      ...prev,
      sessionLog: [...(prev.sessionLog || []), memory],
    }));
    setNewLogTitle('');
    setNewLogDate('');
    setNewLogNote('');
  };

  const handleRemoveSessionMemory = (id: string) => {
    setNpcData((prev) => ({
      ...prev,
      sessionLog: (prev.sessionLog || []).filter((s) => s.id !== id),
    }));
  };

  // Populate with Demo data for testing / reference
  const handleFillDemoData = () => {
    const demo = getDefaultNPCData('Malthus, O Vidreiro da Obsidiana');
    setTitle('Malthus, O Vidreiro da Obsidiana');
    setSubtitle('Mestre Alquimista de Prismas e Vidros Vulcânicos');
    setTagsInput('npc, hecos, alquimia, comerciante, distrito-quartzo');
    setNpcData(demo);
    setSelectedSubcategories(['Comerciantes', 'Distrito de Quartzo']);
    setContent(serializeNPCToHTML('Malthus, O Vidreiro da Obsidiana', demo));
  };

  // Clear all fields
  const handleClearAll = () => {
    setTitle('');
    setSubtitle('');
    setTagsInput('');
    setGmNotes('');
    setContent('');
    setSelectedSubcategories([]);
    setNpcData(getEmptyNPCData());
  };

  // Save Entity
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, insira o nome do NPC.');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Sync subcategories into npcData
    const finalNpcData: NPCAttributes = {
      ...npcData,
      subcategories: selectedSubcategories,
    };

    // Serialize Markdown content if empty
    const finalContent = content.trim() ? content : serializeNPCToHTML(title, finalNpcData);

    const updatedEntity: HecosEntity = {
      id: initEntity ? initEntity.id : `npc-${Date.now()}`,
      slug: initEntity ? initEntity.slug : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      category: 'npc',
      subcategory: selectedSubcategories[0] || 'Geral',
      subcategories: selectedSubcategories,
      tags: tagsArray,
      traits: finalNpcData.traits || [],
      statblock: initEntity?.statblock
        ? { ...initEntity.statblock, traits: finalNpcData.traits || [] }
        : undefined,
      summary: finalNpcData.concept || subtitle || undefined,
      content: finalContent,
      coverImage: finalNpcData.portraitImage || undefined,
      isSecret,
      visibility,
      allowedUserIds: visibility === 'custom' ? allowedUserIds : [],
      gmNotes: gmNotes.trim() || undefined,
      npcData: finalNpcData,
      createdAt: initEntity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    HecosStorage.saveEntity(updatedEntity);
    MutualLinkService.syncMutualLinksOnSave(updatedEntity);
    onSave(updatedEntity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* 95% Screen Space Container */}
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#0c0915] border border-purple-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        
        {/* HEADER BAR */}
        <div className="px-5 py-3.5 bg-[#120c22] border-b border-purple-900/50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-600 p-0.5 shadow-lg shadow-purple-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-[#0c0915] rounded-[10px] flex items-center justify-center">
                <User className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif tracking-wide text-zinc-100">
                  {initEntity ? 'Editar Artigo de NPC' : 'Criar Novo Artigo de NPC'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-purple-950/90 text-purple-300 border border-purple-800">
                  Hecos PF2e
                </span>
                {initEntity && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
                    ID: {initEntity.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Modelo estruturado para personagens, aliados, comerciantes, nêmesis e figuras do cenário de Hecos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!initEntity && (
              <>
                <button
                  type="button"
                  onClick={handleFillDemoData}
                  className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Preencher com exemplo de NPC alquimista"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exemplo Demo</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all"
                  title="Limpar todos os campos"
                >
                  Limpar
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="px-4 py-2 bg-[#0e0a1a] border-b border-purple-900/30 flex items-center justify-between gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('identity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'identity'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Identidade & Visual</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roleplay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'roleplay'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>2. Interpretação & Psique</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relationships')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'relationships'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>3. Relacionamentos ({npcData.relationships?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quests')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'quests'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>4. Rumores & Quests ({(npcData.rumors?.length || 0) + (npcData.quests?.length || 0)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('loot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'loot'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>5. Loot & Moedas ({npcData.loot?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mechanics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'mechanics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>6. Combate & Ficha</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'gm'
                  ? 'bg-rose-700 text-white shadow-md shadow-rose-700/30'
                  : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>7. Confidencial Mestre</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'bio'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-950/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>8. Biografia & Artigo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFolderManagerOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Gerenciar Pastas</span>
            </button>
          </div>
        </div>

        {/* MODAL MAIN CONTENT AREA (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: IDENTIDADE & VISUAL */}
          {activeTab === 'identity' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* 3-Column Balanced Layout for Widescreen (95% Screen Space) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Column 1: Identidade & Atuação (lg:col-span-4) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                      <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>Identidade & Papel Social</span>
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">
                        Nome Completo do NPC <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Malthus, O Vidreiro da Obsidiana"
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/60 focus:border-purple-500 focus:outline-none text-zinc-100 font-serif text-sm placeholder:text-zinc-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Nível de Desafio
                        </label>
                        <input
                          type="number"
                          value={npcData.level !== undefined ? npcData.level : ''}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              level: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                            }))
                          }
                          placeholder="Ex: 4"
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 focus:border-purple-500 focus:outline-none text-zinc-100 text-xs font-mono placeholder:text-zinc-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Alinhamento
                        </label>
                        <input
                          type="text"
                          value={npcData.alignment || ''}
                          onChange={(e) => setNpcData((prev) => ({ ...prev, alignment: e.target.value }))}
                          placeholder="Ex: Neutro e Bom"
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Subtítulo / Epíteto / Função Rápida
                      </label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Ex: Mestre Alquimista & Forjador de Prismas"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-purple-900/60 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs placeholder:text-zinc-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Ocupação / Profissão Principal
                      </label>
                      <input
                        type="text"
                        value={npcData.occupation || ''}
                        onChange={(e) => setNpcData((prev) => ({ ...prev, occupation: e.target.value }))}
                        placeholder="Ex: Artesão Vidreiro e Avaliador Mágico"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <IntelligentMultiEntityPicker
                        label="Organizações / Facções Vinculadas (Múltipla Escolha)"
                        category="organization"
                        selectedIds={
                          Array.from(
                            new Set(
                              [
                                ...(npcData.linkedOrganizationIds || []),
                                ...(npcData.organizationIds || []),
                                npcData.organizationEntityId,
                                npcData.factionEntityId,
                              ].filter(Boolean) as string[]
                            )
                          )
                        }
                        placeholder="Buscar e vincular organizações ou facções..."
                        badgeTheme="purple"
                        onChange={(ids, entities) => {
                          const primaryName = entities[0]?.title || '';
                          const primaryId = ids[0] || undefined;
                          setNpcData((prev) => ({
                            ...prev,
                            organization: primaryName,
                            faction: primaryName,
                            organizationEntityId: primaryId,
                            factionEntityId: primaryId,
                            linkedOrganizationIds: ids,
                            organizationIds: ids,
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <IntelligentMultiEntityPicker
                        label="Locais / Residências Habitual (Múltipla Escolha)"
                        category="location"
                        selectedIds={
                          Array.from(
                            new Set(
                              [
                                ...(npcData.linkedLocationIds || []),
                                ...(npcData.locationIds || []),
                                npcData.locationEntityId,
                              ].filter(Boolean) as string[]
                            )
                          )
                        }
                        placeholder="Buscar e vincular locais de residência, trabalho..."
                        badgeTheme="cyan"
                        onChange={(ids, entities) => {
                          const primaryName = entities[0]?.title || '';
                          const primaryId = ids[0] || undefined;
                          setNpcData((prev) => ({
                            ...prev,
                            location: primaryName,
                            locationEntityId: primaryId,
                            linkedLocationIds: ids,
                            locationIds: ids,
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Demografia & Traços PF2e (lg:col-span-4) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Demografia & Traços Canônicos PF2e</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Ascendência / Raça</label>
                        <input
                          type="text"
                          value={npcData.ancestry || ''}
                          onChange={(e) => setNpcData((prev) => ({ ...prev, ancestry: e.target.value }))}
                          placeholder="Ex: Humano, Elfo..."
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Herança / Linhagem</label>
                        <input
                          type="text"
                          value={npcData.heritage || ''}
                          onChange={(e) => setNpcData((prev) => ({ ...prev, heritage: e.target.value }))}
                          placeholder="Ex: Humano Versátil"
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Pronomes</label>
                        <input
                          type="text"
                          value={npcData.pronouns || ''}
                          onChange={(e) => setNpcData((prev) => ({ ...prev, pronouns: e.target.value }))}
                          placeholder="Ex: Ele/Dele"
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Idade Aparente</label>
                        <input
                          type="text"
                          value={npcData.age || ''}
                          onChange={(e) => setNpcData((prev) => ({ ...prev, age: e.target.value }))}
                          placeholder="Ex: 48 anos"
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Rarity */}
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Raridade</label>
                        <select
                          value={npcData.rarity || 'Comum'}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              rarity: canonicalizeRarityName(e.target.value) as NPCRarity,
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-purple-500"
                        >
                          {CANONICAL_RARITIES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size */}
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Tamanho</label>
                        <select
                          value={npcData.size || 'Médio'}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              size: canonicalizeSizeName(e.target.value) as NPCSize,
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-purple-500"
                        >
                          {CANONICAL_SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Disposition */}
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Disposição</label>
                        <select
                          value={npcData.disposition || 'indifferent'}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              disposition: e.target.value as NPCDisposition,
                            }))
                          }
                          className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="helpful">Prestativo</option>
                          <option value="friendly">Amigável</option>
                          <option value="indifferent">Indiferente</option>
                          <option value="unfriendly">Inamistoso</option>
                          <option value="hostile">Hostil</option>
                          <option value="unknown">Variável</option>
                        </select>
                      </div>
                    </div>

                    {/* Trait Input Combobox */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                        Traits Adicionais (ex: Humanoide, Humano, Feérico, Mágico, Alquimia)
                      </label>
                      <TraitInputCombobox
                        selectedTraits={npcData.traits || []}
                        onChange={(traits) => setNpcData((prev) => ({ ...prev, traits }))}
                        placeholder="Buscar ou adicionar traços..."
                        badgeTheme="purple"
                      />

                      {/* Rarity & Size preview */}
                      {(npcData.rarity || npcData.size) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-purple-900/20">
                          <span className="text-[10px] text-zinc-500 font-mono">Traços Ativos:</span>
                          {npcData.rarity && <TraitBadge trait={npcData.rarity} size="sm" />}
                          {npcData.size && <TraitBadge trait={npcData.size} size="sm" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Mídia Visual & Organização (lg:col-span-4) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Visual Artwork (Portrait & Token) */}
                  <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                      <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Retrato & Token Virtual</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Portrait Image */}
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Retrato do Artigo
                        </label>
                        <ImageUploadInput
                          value={npcData.portraitImage || ''}
                          onChange={(url) => setNpcData((prev) => ({ ...prev, portraitImage: url }))}
                          label="Retrato"
                          placeholder="https://..."
                        />
                      </div>

                      {/* Token Image */}
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                          Token Redondo (VTT)
                        </label>
                        <ImageUploadInput
                          value={npcData.tokenImage || ''}
                          onChange={(url) => setNpcData((prev) => ({ ...prev, tokenImage: url }))}
                          label="Token"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    {/* Previews if uploaded */}
                    {(npcData.portraitImage || npcData.tokenImage) && (
                      <div className="pt-2 flex items-center justify-center gap-4 bg-zinc-950/60 p-2.5 rounded-lg border border-purple-900/20">
                        {npcData.portraitImage && (
                          <div className="text-center">
                            <div className="w-14 h-16 rounded-lg overflow-hidden border border-purple-500/50 shadow-md mx-auto bg-zinc-900">
                              <img
                                src={npcData.portraitImage}
                                alt="Portrait"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[9px] text-zinc-400 mt-0.5 block">Retrato</span>
                          </div>
                        )}
                        {npcData.tokenImage && (
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md mx-auto bg-zinc-900">
                              <img
                                src={npcData.tokenImage}
                                alt="Token"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[9px] text-zinc-400 mt-0.5 block">Token VTT</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FOLDERS & SUBCATEGORIES MANAGEMENT */}
                  <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-purple-400" />
                        <span>Pastas & Subcategorias</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsFolderManagerOpen(true)}
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                      >
                        Gerenciador Universal
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {existingFolders.map((folder) => {
                        const isSelected = selectedSubcategories.includes(folder);
                        return (
                          <button
                            key={folder}
                            type="button"
                            onClick={() => toggleSubcategory(folder)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40 border border-purple-400'
                                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <Folder className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-zinc-500'}`} />
                            <span>{folder}</span>
                            {isSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline Add Folder */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newFolderInput}
                        onChange={(e) => setNewFolderInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewFolder();
                          }
                        }}
                        placeholder="Criar nova pasta rápida..."
                        className="flex-1 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewFolder}
                        className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Criar</span>
                      </button>
                    </div>

                    {/* General Codex Tags */}
                    <div className="pt-2 border-t border-purple-900/30">
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Tags Globais do Codex
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="Ex: npc, hecos, alquimia"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-purple-900/60 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: INTERPRETAÇÃO & PSIQUE */}
          {activeTab === 'roleplay' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Concept / Pitch */}
              <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Conceito Central / Tagline de Uma Linha</span>
                  </label>
                </div>
                <RichTextBar
                  textareaRef={conceptRef}
                  value={npcData.concept || ''}
                  onChange={(val) => setNpcData((prev) => ({ ...prev, concept: val }))}
                />
                <textarea
                  ref={conceptRef}
                  rows={2}
                  value={npcData.concept || ''}
                  onChange={(e) => setNpcData((prev) => ({ ...prev, concept: e.target.value }))}
                  placeholder="Ex: Um artesão metódico e enigmático fascinado por fragmentos de memórias retidas em vidros vulcânicos."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-sm font-serif italic"
                />
              </div>

              {/* 2-Column Grid: Roleplay Voice and Mannerisms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Voz & Padrão de Fala</span>
                  </label>
                  <RichTextBar
                    textareaRef={voiceRef}
                    value={npcData.voiceAndSpeech || ''}
                    onChange={(val) => setNpcData((prev) => ({ ...prev, voiceAndSpeech: val }))}
                    compact
                  />
                  <textarea
                    ref={voiceRef}
                    rows={3}
                    value={npcData.voiceAndSpeech || ''}
                    onChange={(e) => setNpcData((prev) => ({ ...prev, voiceAndSpeech: e.target.value }))}
                    placeholder="Ex: Grave e cadenciada, sussurra ao falar de segredos e faz pausas longas enquanto examina lentes..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-purple-400" />
                    <span>Gestos, Maneirismos & Tiques</span>
                  </label>
                  <RichTextBar
                    textareaRef={mannerismsRef}
                    value={npcData.mannerisms || ''}
                    onChange={(val) => setNpcData((prev) => ({ ...prev, mannerisms: val }))}
                    compact
                  />
                  <textarea
                    ref={mannerismsRef}
                    rows={3}
                    value={npcData.mannerisms || ''}
                    onChange={(e) => setNpcData((prev) => ({ ...prev, mannerisms: e.target.value }))}
                    placeholder="Ex: Ajusta constantemente monóculos de graus variados e limpa as mãos com panos impregnados de óleo..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                  />
                </div>
              </div>

              {/* First Impression & Sensory Atmosphere */}
              <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Primeira Impressão Sensorial (Visão, Olfato, Som)</span>
                </label>
                <RichTextBar
                  textareaRef={impressionRef}
                  value={npcData.firstImpression || ''}
                  onChange={(val) => setNpcData((prev) => ({ ...prev, firstImpression: val }))}
                />
                <textarea
                  ref={impressionRef}
                  rows={2}
                  value={npcData.firstImpression || ''}
                  onChange={(e) => setNpcData((prev) => ({ ...prev, firstImpression: e.target.value }))}
                  placeholder="Ex: Um cheiro penetrante de enxofre e resina vegetal o precede antes mesmo de emergir da fumaça do ateliê..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                />
              </div>

              {/* Motivations, Triggers, Offers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span>O que Busca / Motivações</span>
                  </label>
                  <RichTextBar
                    textareaRef={motivationsRef}
                    value={npcData.motivations || ''}
                    onChange={(val) => setNpcData((prev) => ({ ...prev, motivations: val }))}
                    compact
                  />
                  <textarea
                    ref={motivationsRef}
                    rows={4}
                    value={npcData.motivations || ''}
                    onChange={(e) => setNpcData((prev) => ({ ...prev, motivations: e.target.value }))}
                    placeholder="Ex: Encontrar um prisma perfeito capaz de aprisionar a luz do Eclipse..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                  <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Gatilhos Emocionais & Tabus</span>
                  </label>
                  <RichTextBar
                    textareaRef={triggersRef}
                    value={npcData.triggers || ''}
                    onChange={(val) => setNpcData((prev) => ({ ...prev, triggers: val }))}
                    compact
                  />
                  <textarea
                    ref={triggersRef}
                    rows={4}
                    value={npcData.triggers || ''}
                    onChange={(e) => setNpcData((prev) => ({ ...prev, triggers: e.target.value }))}
                    placeholder="Ex: Fica enfurecido com quem quebra vidros descuidadamente ou debocha de sua arte..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pode Oferecer ao Grupo</span>
                  </label>
                  <RichTextBar
                    textareaRef={canOfferRef}
                    value={npcData.canOffer || ''}
                    onChange={(val) => setNpcData((prev) => ({ ...prev, canOffer: val }))}
                    compact
                  />
                  <textarea
                    ref={canOfferRef}
                    rows={4}
                    value={npcData.canOffer || ''}
                    onChange={(e) => setNpcData((prev) => ({ ...prev, canOffer: e.target.value }))}
                    placeholder="Ex: Poções de cura refinadas, identificação de minerais, rotas para as catacumbas..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RELACIONAMENTOS & VÍNCULOS */}
          {activeTab === 'relationships' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Add New Relationship Form */}
              <div className="p-5 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-4">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-purple-400" />
                  <span>Adicionar Vínculo com Personagem (NPC ou PC)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Target Name + Quick Suggestions */}
                  <div className="sm:col-span-4 space-y-1">
                    <IntelligentEntityPicker
                      label="Nome do Personagem (NPC ou PC) *"
                      category={['npc', 'pc']}
                      valueId={newRelTargetEntityId}
                      valueName={newRelTargetName}
                      placeholder="Buscar NPC/PC ou digitar nome..."
                      onChange={(id, title) => {
                        setNewRelTargetName(title || '');
                        setNewRelTargetEntityId(id);
                      }}
                    />
                  </div>

                  {/* Relationship Type */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-semibold text-zinc-300">
                      Tipo de Vínculo
                    </label>
                    <input
                      type="text"
                      value={newRelType}
                      onChange={(e) => setNewRelType(e.target.value)}
                      placeholder="Ex: Irmão, Cliente, Rival, Credor, Mentor..."
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Specific Attitude */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-semibold text-zinc-300">
                      Atitude Específica
                    </label>
                    <select
                      value={newRelAttitude}
                      onChange={(e) => setNewRelAttitude(e.target.value as NPCDisposition)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="helpful">Prestativo / Devoção</option>
                      <option value="friendly">Amigável / Aliado</option>
                      <option value="indifferent">Indiferente / Profissional</option>
                      <option value="unfriendly">Desconfiado / Frio</option>
                      <option value="hostile">Hostil / Inimigo Jurado</option>
                    </select>
                  </div>

                  {/* Secret toggle + Add Button */}
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRelSecret(!newRelSecret)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                        newRelSecret
                          ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                      title={newRelSecret ? 'Vínculo Secreto (Apenas Mestre)' : 'Vínculo Público'}
                    >
                      <Lock className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleAddRelationship}
                      className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Vincular</span>
                    </button>
                  </div>
                </div>

                {/* Additional notes for the relationship */}
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Detalhes do Relacionamento / Histórico Compartilhado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newRelNotes}
                    onChange={(e) => setNewRelNotes(e.target.value)}
                    placeholder="Ex: Envia minérios raros do alto do penhasco em troca de elixires de preservação toda lua nova..."
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-purple-900/40 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* List of Relationships */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Vínculos Estabelecidos ({npcData.relationships?.length || 0})</span>
                </h3>

                {(!npcData.relationships || npcData.relationships.length === 0) ? (
                  <div className="p-8 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum relacionamento vinculado ainda. Adicione aliados, rivais, familiares ou credores deste NPC acima.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {npcData.relationships.map((rel) => {
                      const attitudeConfig = DISPOSITION_CONFIG[rel.attitude || 'indifferent'];
                      return (
                        <div
                          key={rel.id}
                          className="p-3.5 rounded-xl bg-[#110d1e] border border-purple-900/40 hover:border-purple-700/60 transition-all flex flex-col justify-between gap-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-zinc-100 font-serif">{rel.targetName}</h4>
                                {rel.isSecret && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-mono flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> GM
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-purple-300 font-medium">{rel.relationshipType}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveRelationship(rel.id)}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              title="Remover relacionamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {rel.notes && (
                            <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-2 rounded-lg border border-purple-900/20">
                              "{rel.notes}"
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-purple-900/20 text-[11px]">
                            <span className="text-zinc-500">Atitude:</span>
                            <span className={`font-semibold ${attitudeConfig.text}`}>
                              {attitudeConfig.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RUMORES & QUESTS */}
          {activeTab === 'quests' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* SECTION 1: QUESTS & PLOT HOOKS */}
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Scroll className="w-4 h-4 text-cyan-400" />
                      <span>Missões & Ganchos de Aventura Vinculados (Quests)</span>
                    </span>
                  </div>

                  {/* Multi-Picker for Quests */}
                  <div>
                    <IntelligentMultiEntityPicker
                      label="Vincular Múltiplas Missões / Quests Rapidamente"
                      category="quest"
                      selectedIds={
                        Array.from(
                          new Set(
                            [
                              ...(npcData.questIds || []),
                              ...(npcData.quests || []).map((q) => q.questEntityId).filter(Boolean),
                            ].filter(Boolean) as string[]
                          )
                        )
                      }
                      placeholder="Buscar e vincular missões a este NPC..."
                      badgeTheme="cyan"
                      onChange={(ids, entities) => {
                        const selectedIdsSet = new Set(ids);
                        // Filter out any quest whose questEntityId is not in the selected ids (if it had a questEntityId)
                        const filteredQuests = (npcData.quests || []).filter((q) => {
                          if (!q.questEntityId) return true; // custom text-only quest
                          return selectedIdsSet.has(q.questEntityId);
                        });

                        const existingEntityIds = new Set(filteredQuests.map((q) => q.questEntityId).filter(Boolean));

                        entities.forEach((ent) => {
                          if (!existingEntityIds.has(ent.id)) {
                            filteredQuests.push({
                              id: `quest-${Date.now()}-${ent.id}`,
                              questEntityId: ent.id,
                              title: ent.title,
                              roleInQuest: 'Envolvido na Missão',
                              description: ent.subtitle || '',
                              isSecret: ent.isSecret,
                            });
                          }
                        });

                        setNpcData((prev) => ({
                          ...prev,
                          questIds: ids,
                          quests: filteredQuests,
                        }));
                      }}
                    />
                  </div>

                  <div className="pt-2 border-t border-purple-900/30">
                    <p className="text-[11px] text-zinc-400 mb-2">Ou adicione um gancho detalhado personalizado com papel e descrição específicos:</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5 space-y-1">
                      <IntelligentEntityPicker
                        label="Título da Missão / Gancho *"
                        category="quest"
                        valueId={newQuestEntityId}
                        valueName={newQuestTitle}
                        placeholder="Buscar quest existente ou digitar..."
                        onChange={(id, title, entity) => {
                          setNewQuestTitle(title || '');
                          setNewQuestEntityId(id);
                          if (entity?.subtitle && !newQuestDesc) {
                            setNewQuestDesc(entity.subtitle);
                          }
                        }}
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-semibold text-zinc-300">
                        Papel do NPC na Missão
                      </label>
                      <select
                        value={newQuestRole}
                        onChange={(e) => setNewQuestRole(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="Doador da Missão">Doador da Missão (Quest Giver)</option>
                        <option value="Alvo / Procurado">Alvo / Procurado (Target)</option>
                        <option value="Guia / Especialista">Guia / Especialista (Guide)</option>
                        <option value="Recompensador">Recompensador / Financiador</option>
                        <option value="Obstáculo / Rival">Obstáculo / Rival</option>
                        <option value="Vítima / Resgate">Vítima / A ser Resgatado</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewQuestSecret(!newQuestSecret)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                          newQuestSecret
                            ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                        title={newQuestSecret ? 'Missão Secreta (Apenas Mestre)' : 'Missão Conhecida'}
                      >
                        <Lock className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleAddQuest}
                        className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Quest</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Descrição do Gancho / Objetivo / Recompensa Prometida
                    </label>
                    <input
                      type="text"
                      value={newQuestDesc}
                      onChange={(e) => setNewQuestDesc(e.target.value)}
                      placeholder="Ex: Contrata os aventureiros para resgatar uma carga de areia de quartzo roubada nas catacumbas..."
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-purple-900/40 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Quests List */}
                <div className="space-y-3">
                  {(!npcData.quests || npcData.quests.length === 0) ? (
                    <div className="p-6 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhuma missão associada a este NPC ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {npcData.quests.map((q) => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-[#110d1e] border border-cyan-900/40 hover:border-cyan-700/60 transition-all flex flex-col justify-between gap-2 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-cyan-200 font-serif">{q.title}</h4>
                                {q.isSecret && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-mono flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> GM
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-cyan-300/80 font-medium">{q.roleInQuest}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuest(q.questEntityId || q.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                              title="Remover / Desvincular missão"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {q.description && (
                            <p className="text-xs text-zinc-300 bg-zinc-950/60 p-2 rounded-lg border border-purple-900/20">
                              {q.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: RUMORES & HISTÓRIAS POPULARES */}
              <div className="space-y-4 pt-4 border-t border-purple-900/30">
                <div className="p-5 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-amber-400" />
                      <span>Rumores & Histórias Ouvidas nas Tavernas</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-semibold text-zinc-300">
                        Texto do Rumor <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newRumorText}
                        onChange={(e) => setNewRumorText(e.target.value)}
                        placeholder="Ex: Dizem que seus espelhos mostram a morte de quem os contempla..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-semibold text-zinc-300">
                        Fonte / Onde foi ouvido
                      </label>
                      <input
                        type="text"
                        value={newRumorSource}
                        onChange={(e) => setNewRumorSource(e.target.value)}
                        placeholder="Ex: Taverna do Corvo, Guarda..."
                        className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                      <select
                        value={newRumorIsTrue === undefined ? '' : newRumorIsTrue ? 'true' : 'false'}
                        onChange={(e) => {
                          if (e.target.value === '') setNewRumorIsTrue(undefined);
                          else setNewRumorIsTrue(e.target.value === 'true');
                        }}
                        className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="">Status Incerto</option>
                        <option value="true">Verdadeiro (Fato)</option>
                        <option value="false">Falso (Boato)</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleAddRumor}
                        className="py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-md transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rumors List */}
                <div className="space-y-3">
                  {(!npcData.rumors || npcData.rumors.length === 0) ? (
                    <div className="p-6 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum rumor registrado para este NPC ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {npcData.rumors.map((rumor) => (
                        <div
                          key={rumor.id}
                          className="p-3.5 rounded-xl bg-[#110d1e] border border-purple-900/40 flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs text-zinc-200 italic font-serif">"{rumor.text}"</p>
                            <div className="flex items-center gap-2 text-[10px]">
                              {rumor.source && <span className="text-zinc-500">Fonte: {rumor.source}</span>}
                              {rumor.isTrue !== undefined && (
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold ${
                                    rumor.isTrue
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                                  }`}
                                >
                                  {rumor.isTrue ? 'Verdadeiro' : 'Falso'}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRumor(rumor.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOOT & MOEDAS */}
          {activeTab === 'loot' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Currency & Wealth Manager */}
              <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-3">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Moedas, Gemas & Riquezas em Posse</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-400 mb-1">
                      Peças de Ouro (PO)
                    </label>
                    <input
                      type="number"
                      value={npcData.currency?.po !== undefined ? npcData.currency.po : ''}
                      onChange={(e) =>
                        setNpcData((prev) => ({
                          ...prev,
                          currency: { ...prev.currency, po: e.target.value === '' ? '' : parseInt(e.target.value, 10) },
                        }))
                      }
                      placeholder="Ex: 42"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-amber-900/50 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Peças de Prata (PP)
                    </label>
                    <input
                      type="number"
                      value={npcData.currency?.pp !== undefined ? npcData.currency.pp : ''}
                      onChange={(e) =>
                        setNpcData((prev) => ({
                          ...prev,
                          currency: { ...prev.currency, pp: e.target.value === '' ? '' : parseInt(e.target.value, 10) },
                        }))
                      }
                      placeholder="Ex: 15"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                      Peças de Cobre (PC)
                    </label>
                    <input
                      type="number"
                      value={npcData.currency?.pc !== undefined ? npcData.currency.pc : ''}
                      onChange={(e) =>
                        setNpcData((prev) => ({
                          ...prev,
                          currency: { ...prev.currency, pc: e.target.value === '' ? '' : parseInt(e.target.value, 10) },
                        }))
                      }
                      placeholder="Ex: 8"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-amber-900/30 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-cyan-400 mb-1">
                      Gemas & Riquezas Especiais
                    </label>
                    <input
                      type="text"
                      value={npcData.currency?.custom || ''}
                      onChange={(e) =>
                        setNpcData((prev) => ({
                          ...prev,
                          currency: { ...prev.currency, custom: e.target.value },
                        }))
                      }
                      placeholder="Ex: 3 Fragmentos de Obsidiana Lapidada"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-cyan-900/50 text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add Loot Form & Compendium Picker */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-purple-400" />
                      <span>Inventário & Equipamentos do NPC</span>
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Importe itens do compêndio, crie novos itens sob demanda ou adicione itens rápidos.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsItemPickerOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Puxar do Compêndio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsItemCreateOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" />
                      <span>Criar Novo Item</span>
                    </button>
                  </div>
                </div>

                {/* Quick Custom Item Form (Collapsible/Inline) */}
                <div className="p-3.5 rounded-lg bg-zinc-950/50 border border-purple-900/30 space-y-3">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-purple-400" />
                    <span>Adição Rápida de Item Customizado / Bugiganga</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5 space-y-1">
                      <label className="block text-[10px] font-semibold text-zinc-400">
                        Nome do Item <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newLootName}
                        onChange={(e) => setNewLootName(e.target.value)}
                        placeholder="Ex: Monóculo de Quartzo Prismático, Poção de Cura..."
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-semibold text-zinc-400">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        value={newLootQty}
                        onChange={(e) => setNewLootQty(e.target.value)}
                        placeholder="1"
                        min="1"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[10px] font-semibold text-zinc-400">
                        Valor / Preço Estimado
                      </label>
                      <input
                        type="text"
                        value={newLootValue}
                        onChange={(e) => setNewLootValue(e.target.value)}
                        placeholder="Ex: 35 PO, Inestimável..."
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewLootEquipped(!newLootEquipped)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors ${
                          newLootEquipped
                            ? 'bg-purple-950/90 border-purple-600 text-purple-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                        title={newLootEquipped ? 'Item Equipado' : 'No Inventário'}
                      >
                        <Shield className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleAddCustomLoot}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="text"
                      value={newLootDesc}
                      onChange={(e) => setNewLootDesc(e.target.value)}
                      placeholder="Descrição rápida ou propriedades mágicas (opcional)..."
                      className="w-full px-3 py-1 rounded-lg bg-zinc-900/80 border border-purple-900/40 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Loot Items List (Widescreen List View) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span>Itens no Inventário</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono">
                      {npcData.loot?.length || 0} {npcData.loot?.length === 1 ? 'item' : 'itens'}
                    </span>
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Clique em qualquer item ou no ícone de olho para abrir a gaveta lateral com ficha completa.
                  </span>
                </div>

                {(!npcData.loot || npcData.loot.length === 0) ? (
                  <div className="p-10 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic space-y-2">
                    <Package className="w-8 h-8 text-zinc-700 mx-auto" />
                    <p>Nenhum item adicionado ao inventário do NPC ainda.</p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsItemPickerOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Puxar do Compêndio</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {npcData.loot.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                          item.isEquipped
                            ? 'bg-[#150f24] border-purple-500/50 hover:border-purple-400'
                            : 'bg-[#100c1c] border-purple-900/40 hover:border-purple-700/60'
                        }`}
                      >
                        {/* Left Info: Icon, Name, Value, Description */}
                        <div
                          className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer group"
                          onClick={() => handleOpenItemDrawer(item.id, item.name)}
                          title="Clique para abrir ficha completa do item"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            item.isEquipped
                              ? 'bg-purple-950/80 border-purple-500/60 text-purple-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-purple-300'
                          }`}>
                            <Package className="w-4 h-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-zinc-100 font-serif group-hover:text-purple-300 transition-colors">
                                {item.name}
                              </h4>

                              {item.isEquipped && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                                  Equipado
                                </span>
                              )}

                              {item.isSecret && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>Oculto (GM)</span>
                                </span>
                              )}

                              {item.priceOrValue && (
                                <span className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-900/60 text-amber-300 text-[10px] font-mono">
                                  {item.priceOrValue}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Controls: Quantity Stepper, Equipped toggle, Secret toggle, Open Drawer, Delete */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-900/30">
                          {/* Quantity Stepper */}
                          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateLootQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded text-xs font-bold transition-colors"
                              title="Diminuir quantidade"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => handleSetLootQuantityDirect(item.id, parseInt(e.target.value, 10) || 1)}
                              className="w-10 text-center bg-transparent text-xs font-mono font-bold text-zinc-200 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateLootQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded text-xs font-bold transition-colors"
                              title="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>

                          {/* Equipped Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleLootEquipped(item.id)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                              item.isEquipped
                                ? 'bg-purple-950 border-purple-600 text-purple-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title={item.isEquipped ? 'Item Equipado (clique para desequipar)' : 'Equipar item'}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* Secret Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleLootSecret(item.id)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                              item.isSecret
                                ? 'bg-rose-950 border-rose-600 text-rose-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title={item.isSecret ? 'Oculto dos jogadores (clique para tornar visível)' : 'Tornar secreto para o GM'}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>

                          {/* View Drawer Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenItemDrawer(item.id, item.name)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-purple-950/80 border border-zinc-800 hover:border-purple-700 text-zinc-400 hover:text-purple-300 transition-colors"
                            title="Ver Ficha Completa na Gaveta Lateral"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveLoot(item.id)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-700 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Remover do inventário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: COMBATE & FICHA */}
          {activeTab === 'mechanics' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Combat Stats Toggle */}
              <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-rose-400" />
                    <span>Habilitar Bloco de Estatísticas de Combate</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Permite definir CA, Pontos de Vida, Salvamentos e Perícias para NPCs capazes de lutar.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(npcData.hasCombatStats)}
                    onChange={(e) => setNpcData((prev) => ({ ...prev, hasCombatStats: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Combat Stats Form */}
              {npcData.hasCombatStats && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Primary Combat Defenses */}
                  <div className="p-5 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-4">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>Defesas Principais & Movimento</span>
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Classe de Armadura (CA)</label>
                        <input
                          type="number"
                          value={npcData.ac !== undefined ? npcData.ac : ''}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              ac: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                            }))
                          }
                          placeholder="Ex: 20"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Pontos de Vida (PV / HP)</label>
                        <input
                          type="number"
                          value={npcData.hp !== undefined ? npcData.hp : ''}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              hp: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                            }))
                          }
                          placeholder="Ex: 55"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Percepção</label>
                        <input
                          type="number"
                          value={npcData.perception !== undefined ? npcData.perception : ''}
                          onChange={(e) =>
                            setNpcData((prev) => ({
                              ...prev,
                              perception: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                            }))
                          }
                          placeholder="Ex: 11"
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Deslocamento (Speed)</label>
                        <input
                          type="text"
                          value={npcData.speed || ''}
                          onChange={(e) => setNpcData((prev) => ({ ...prev, speed: e.target.value }))}
                          placeholder="Ex: 9m, Voo 12m..."
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/50 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Saving Throws */}
                    <div className="pt-2 border-t border-purple-900/20">
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-2">Salvamentos (Saves)</label>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Fortitude</label>
                          <input
                            type="number"
                            value={npcData.saves?.fortitude !== undefined ? npcData.saves.fortitude : ''}
                            onChange={(e) =>
                              setNpcData((prev) => ({
                                ...prev,
                                saves: {
                                  ...prev.saves,
                                  fortitude: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                                },
                              }))
                            }
                            placeholder="+12"
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/40 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Reflexos</label>
                          <input
                            type="number"
                            value={npcData.saves?.reflex !== undefined ? npcData.saves.reflex : ''}
                            onChange={(e) =>
                              setNpcData((prev) => ({
                                ...prev,
                                saves: {
                                  ...prev.saves,
                                  reflex: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                                },
                              }))
                            }
                            placeholder="+9"
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/40 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-zinc-500 mb-1">Vontade</label>
                          <input
                            type="number"
                            value={npcData.saves?.will !== undefined ? npcData.saves.will : ''}
                            onChange={(e) =>
                              setNpcData((prev) => ({
                                ...prev,
                                saves: {
                                  ...prev.saves,
                                  will: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                                },
                              }))
                            }
                            placeholder="+13"
                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-purple-900/40 text-xs font-mono text-zinc-100 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Actions */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Perícias Chave & Bônus</span>
                      </label>
                      <input
                        type="text"
                        value={npcData.keySkills || ''}
                        onChange={(e) => setNpcData((prev) => ({ ...prev, keySkills: e.target.value }))}
                        placeholder="Ex: Manufatura +16, Arcanismo +14, Percepção +11, Diplomacia +10..."
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-2">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        <span>Ações de Combate, Feitiços & Habilidades Especiais</span>
                      </label>
                      <textarea
                        rows={3}
                        value={npcData.specialAbilities || ''}
                        onChange={(e) => setNpcData((prev) => ({ ...prev, specialAbilities: e.target.value }))}
                        placeholder="Ex: Vidro Explosivo [2-actions]: Arremessa um frasco de estilhaços causando 3d6 de dano perfurante (Reflexos CD 20)..."
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-200 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: CONFIDENCIAL DO MESTRE & DIÁRIO DE SESSÕES */}
          {activeTab === 'gm' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* GM Master Secrets & Plot Hooks */}
              <div className="p-5 rounded-xl bg-[#180918] border border-rose-900/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Segredos Ocultos & Revelações do Mestre (GM Only)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    Oculto dos Jogadores
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-200 mb-1">
                      Segredo Oculto / Verdadeira Identidade / Conspiração
                    </label>
                    <RichTextBar
                      textareaRef={gmSecretRef}
                      value={npcData.gmSecret || ''}
                      onChange={(val) => setNpcData((prev) => ({ ...prev, gmSecret: val }))}
                    />
                    <textarea
                      ref={gmSecretRef}
                      rows={3}
                      value={npcData.gmSecret || ''}
                      onChange={(e) => setNpcData((prev) => ({ ...prev, gmSecret: e.target.value }))}
                      placeholder="Ex: Ele está secretamente sintetizando um antídoto contra a praga cósmica a pedido de uma seita proibida..."
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-rose-900/50 focus:border-rose-500 focus:outline-none text-zinc-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-200 mb-1">
                      Gancho Principal de Trama / Dilema Moral
                    </label>
                    <RichTextBar
                      textareaRef={gmPlotHookRef}
                      value={npcData.gmPlotHook || ''}
                      onChange={(val) => setNpcData((prev) => ({ ...prev, gmPlotHook: val }))}
                    />
                    <textarea
                      ref={gmPlotHookRef}
                      rows={3}
                      value={npcData.gmPlotHook || ''}
                      onChange={(e) => setNpcData((prev) => ({ ...prev, gmPlotHook: e.target.value }))}
                      placeholder="Ex: Se os jogadores descobrirem sua oficina secreta, ele oferecerá aliança antes de tentar fugir..."
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-rose-900/50 focus:border-rose-500 focus:outline-none text-zinc-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Session Log / Memories with the Party */}
              <div className="p-5 rounded-xl bg-[#110d1e] border border-purple-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-purple-400" />
                    <span>Diário de Sessões & Interações Passadas com os Jogadores</span>
                  </span>
                </div>

                {/* Add Session Log Form */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-[11px] font-semibold text-zinc-300">
                      Sessão / Título
                    </label>
                    <input
                      type="text"
                      value={newLogTitle}
                      onChange={(e) => setNewLogTitle(e.target.value)}
                      placeholder="Ex: Sessão 03, Noite do Eclipse..."
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-semibold text-zinc-300">
                      Data da Sessão
                    </label>
                    <input
                      type="date"
                      value={newLogDate}
                      onChange={(e) => setNewLogDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="sm:col-span-5 flex items-center gap-2">
                    <input
                      type="text"
                      value={newLogNote}
                      onChange={(e) => setNewLogNote(e.target.value)}
                      placeholder="O que aconteceu nesta sessão..."
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-purple-900/60 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                    />

                    <button
                      type="button"
                      onClick={handleAddSessionMemory}
                      className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-md transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar</span>
                    </button>
                  </div>
                </div>

                {/* Session Memories List */}
                <div className="space-y-2 pt-2">
                  {(!npcData.sessionLog || npcData.sessionLog.length === 0) ? (
                    <div className="p-6 text-center rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum registro de sessão gravado ainda.
                    </div>
                  ) : (
                    npcData.sessionLog.map((mem) => (
                      <div
                        key={mem.id}
                        className="p-3 rounded-xl bg-[#0e0a1a] border border-purple-900/40 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-300 font-serif">
                              {mem.sessionTitleOrNumber || 'Sessão'}
                            </span>
                            {mem.date && <span className="text-zinc-500 font-mono text-[10px]">{mem.date}</span>}
                          </div>
                          <p className="text-zinc-300">{mem.note}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSessionMemory(mem.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BIOGRAFIA & EDITOR MARKDOWN RICO */}
          {activeTab === 'bio' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Header with View Mode Controls and Sync Helper */}
              <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Artigo Completo em Markdown Enriquecido
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContent(serializeNPCToHTML(title || 'Sem Nome', npcData, ''));
                    }}
                    className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-medium transition-colors"
                    title="Regenerar Markdown combinando os dados preenchidos nas outras abas"
                  >
                    Sincronizar com Abas
                  </button>

                  <div className="flex items-center bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setBioViewMode('split')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        bioViewMode === 'split' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Lado a Lado
                    </button>
                    <button
                      type="button"
                      onClick={() => setBioViewMode('edit')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        bioViewMode === 'edit' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Apenas Código
                    </button>
                    <button
                      type="button"
                      onClick={() => setBioViewMode('preview')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        bioViewMode === 'preview' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Prévia Ao Vivo
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Text Toolbar */}
              <RichTextBar
                textareaRef={bioRef}
                value={content}
                onChange={setContent}
              />

              {/* Editor + Live Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[420px]">
                {/* Editor Column */}
                {(bioViewMode === 'split' || bioViewMode === 'edit') && (
                  <div className={bioViewMode === 'split' ? 'lg:col-span-6 flex flex-col' : 'lg:col-span-12 flex flex-col'}>
                    <textarea
                      ref={bioRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Escreva a biografia, lendas, conexões, eventos históricos e notas detalhadas deste NPC..."
                      className="w-full flex-1 min-h-[380px] p-4 rounded-xl bg-zinc-950 border border-purple-900/50 focus:border-purple-500 focus:outline-none text-zinc-100 font-mono text-xs leading-relaxed"
                    />
                  </div>
                )}

                {/* Preview Column */}
                {(bioViewMode === 'split' || bioViewMode === 'preview') && (
                  <div className={bioViewMode === 'split' ? 'lg:col-span-6 flex flex-col' : 'lg:col-span-12 flex flex-col'}>
                    <div className="w-full flex-1 min-h-[380px] p-5 rounded-xl bg-[#090710] border border-purple-900/30 overflow-y-auto max-h-[500px]">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-800">
                        Pré-visualização do Artigo
                      </h3>
                      <RichContentRenderer
                        content={content || serializeNPCToHTML(title || 'Prévia', npcData)}
                        isGmMode={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTION BAR */}
        <div className="px-6 py-3.5 bg-[#120c22] border-t border-purple-900/50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-rose-600 focus:ring-0"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Ocultar artigo inteiro dos jogadores (Artigo Confidencial)</span>
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-zinc-950 font-bold text-xs tracking-wide shadow-lg shadow-purple-950/60 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
              <span>{initEntity ? 'Salvar Alterações do NPC' : 'Criar Artigo do NPC'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* UNIVERSAL FOLDER MANAGER MODAL */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          onClose={() => setIsFolderManagerOpen(false)}
          scope="npc"
          categories={[{ id: 'all', name: 'Todos os NPCs', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="purple"
          onRefresh={() => {
            refreshFolders();
          }}
        />
      )}

      {/* COMPENDIUM ITEM PICKER MODAL */}
      {isItemPickerOpen && (
        <ItemPickerModal
          isOpen={isItemPickerOpen}
          onClose={() => setIsItemPickerOpen(false)}
          title="Selecionar Itens do Compêndio para o NPC"
          onSelectItems={handleSelectCompendiumItems}
          alreadyAddedItemNames={(npcData.loot || []).map((l) => l.name)}
          onCreateNewItem={() => {
            setIsItemPickerOpen(false);
            setIsItemCreateOpen(true);
          }}
        />
      )}

      {/* CREATE NEW ITEM MODAL (ON-DEMAND) */}
      {isItemCreateOpen && (
        <ItemCreateModal
          isOpen={isItemCreateOpen}
          onClose={() => setIsItemCreateOpen(false)}
          onSaveItem={handleItemCreated}
        />
      )}

      {/* ITEM DETAILS DRAWER */}
      {isItemDrawerOpen && (
        <ItemDrawer
          isOpen={isItemDrawerOpen}
          itemId={activeDrawerItemId}
          entities={allEntities}
          onClose={() => {
            setIsItemDrawerOpen(false);
            setActiveDrawerItemId(null);
          }}
          onNavigateFullPage={(entityId) => {
            window.open(`/?article=${entityId}`, '_blank');
          }}
          isGmMode={isGm}
        />
      )}
    </div>
  );
};
