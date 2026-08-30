import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  FaunaAttributes,
  FaunaHarvestPart,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyFaunaData,
  serializeFaunaToHTML,
} from '../utils/entitySerializers';
import {
  TreePine,
  ShieldAlert,
  Compass,
  Heart,
  Plus,
  Trash2,
  Lock,
  FileText,
  Folder,
  FolderPlus,
  X,
  Check,
  Sparkles,
  Scissors,
} from 'lucide-react';

interface FaunaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'biology' | 'harvest' | 'secrets' | 'lore';

const DIETS = ['Carnívoro', 'Herbívoro', 'Onívoro', 'Mágico / Cristalino', 'Necrófago', 'Outro'];
const TEMPERAMENTS = ['Dócil', 'Arisco', 'Territorial', 'Predador Agressivo', 'Treinável'];
const DANGERS = ['Inofensivo', 'Baixo', 'Médio', 'Perigoso', 'Mortal'];
const RARITIES = ['Comum', 'Incomum', 'Raro', 'Único'];
const SIZES = ['Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso'];

export const FaunaCreateModal: React.FC<FaunaCreateModalProps> = ({
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
  const [traits, setTraits] = useState<string[]>(['Animal']);
  const [isSecret, setIsSecret] = useState(false);
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [portraitImage, setPortraitImage] = useState('');
  const [tokenImage, setTokenImage] = useState('');

  // Folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Structured Fauna Data
  const [faunaData, setFaunaData] = useState<FaunaAttributes>(getEmptyFaunaData());

  // Harvest Part Input
  const [newPartName, setNewPartName] = useState('');
  const [newPartUtil, setNewPartUtil] = useState('');
  const [newPartDc, setNewPartDc] = useState('');
  const [newPartVal, setNewPartVal] = useState('');

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('fauna');
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
      if (e.category === 'fauna' || e.faunaData) {
        (e.faunaData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
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
      setTraits(initEntity.traits || initEntity.faunaData?.traits || ['Animal']);
      setIsSecret(Boolean(initEntity.isSecret));
      setVisibility(initEntity.visibility || 'all');
      setAllowedUserIds(initEntity.allowedUserIds || []);
      setContent(initEntity.content || '');
      setPortraitImage(initEntity.coverImage || initEntity.faunaData?.portraitImage || '');
      setTokenImage(initEntity.faunaData?.tokenImage || '');

      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      setFaunaData(initEntity.faunaData ? { ...initEntity.faunaData } : getEmptyFaunaData());
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('fauna, animal, hecos');
      setTraits(['Animal']);
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setPortraitImage('');
      setTokenImage('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      setFaunaData(getEmptyFaunaData());
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
    HecosStorage.addScopeSubcategory('fauna', 'all', trimmed);
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

  const handleAddHarvestPart = () => {
    if (!newPartName.trim()) return;
    const newPart: FaunaHarvestPart = {
      id: 'part-' + Date.now(),
      name: newPartName.trim(),
      utility: newPartUtil.trim() || 'Alquimia / Artesanato',
      dcOrDifficulty: newPartDc.trim() || 'Sobrevivência CD 15',
      value: newPartVal.trim() || '10 PO',
    };
    setFaunaData((prev) => ({
      ...prev,
      harvestableParts: [...(prev.harvestableParts || []), newPart],
    }));
    setNewPartName('');
    setNewPartUtil('');
    setNewPartDc('');
    setNewPartVal('');
  };

  const handleRemoveHarvestPart = (id: string) => {
    setFaunaData((prev) => ({
      ...prev,
      harvestableParts: (prev.harvestableParts || []).filter((p) => p.id !== id),
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome do animal ou espécime.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullFaunaData: FaunaAttributes = {
      ...faunaData,
      portraitImage,
      tokenImage,
      traits,
      subcategories: selectedSubcategories,
    };

    const finalHTML = serializeFaunaToHTML(title, fullFaunaData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug: initEntity?.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'fauna-' + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'fauna',
      subcategory: selectedSubcategories[0] || '',
      subcategories: selectedSubcategories,
      tags: cleanTags.length > 0 ? cleanTags : ['fauna', 'animal'],
      traits,
      summary: subtitle.trim(),
      content: finalHTML,
      coverImage: portraitImage || undefined,
      faunaData: fullFaunaData,
      isSecret,
      visibility,
      allowedUserIds,
      createdAt: initEntity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    HecosStorage.saveEntity(savedEntity);
    onSave(savedEntity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#09100c] border border-emerald-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1813] border-b border-emerald-900/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif flex items-center gap-2">
                <span>{initEntity ? 'Editar Fauna Selvagem' : 'Nova Fauna Selvagem'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                  {faunaData.dangerLevel || 'Fauna'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Cadastre espécies animais, predadores, montarias e partes coletáveis de Hecos.
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
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#0a140f] border-b border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Identidade & Espécie', icon: TreePine },
            { id: 'biology', label: 'Biologia & Hábitos', icon: Heart },
            { id: 'harvest', label: 'Espólios & Colheita', icon: Scissors },
            { id: 'secrets', label: 'Segredos do GM', icon: Lock },
            { id: 'lore', label: 'Ecologia & Crônica', icon: FileText },
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
                    ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300'
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
                    Nome da Espécie / Animal *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Lobo de Obsidiana, Urso-das-Brumas, Falcão Solar"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Subtítulo / Descritor
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Predador ápice das florestas de ferro"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Diet, Temperament, Danger, Size, Rarity */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Dieta
                  </label>
                  <select
                    value={faunaData.diet || 'Onívoro'}
                    onChange={(e) => setFaunaData({ ...faunaData, diet: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-emerald-300 focus:outline-none focus:border-emerald-400"
                  >
                    {DIETS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Temperamento
                  </label>
                  <select
                    value={faunaData.temperament || 'Arisco'}
                    onChange={(e) => setFaunaData({ ...faunaData, temperament: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-emerald-400"
                  >
                    {TEMPERAMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Perigo
                  </label>
                  <select
                    value={faunaData.dangerLevel || 'Baixo'}
                    onChange={(e) => setFaunaData({ ...faunaData, dangerLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-rose-300 focus:outline-none focus:border-emerald-400"
                  >
                    {DANGERS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tamanho
                  </label>
                  <select
                    value={faunaData.size || 'Médio'}
                    onChange={(e) => setFaunaData({ ...faunaData, size: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-emerald-400"
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Raridade
                  </label>
                  <select
                    value={faunaData.rarity || 'Comum'}
                    onChange={(e) => setFaunaData({ ...faunaData, rarity: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-purple-300 focus:outline-none focus:border-emerald-400"
                  >
                    {RARITIES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Habitat */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Habitat & Distribuição Geográfica
                </label>
                <input
                  type="text"
                  value={faunaData.habitat || ''}
                  onChange={(e) => setFaunaData({ ...faunaData, habitat: e.target.value })}
                  placeholder="Ex: Bosques Temperados, Cavernas Subterrâneas, Pântanos Ácidos"
                  className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Arte Conceitual / Retrato
                  </label>
                  <ImageUploadInput
                    value={portraitImage}
                    onChange={(url) => setPortraitImage(url)}
                    placeholder="URL ou upload do retrato do espécime..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Token Circular de Batalha (Opcional)
                  </label>
                  <ImageUploadInput
                    value={tokenImage}
                    onChange={(url) => setTokenImage(url)}
                    placeholder="URL ou upload de token circular..."
                  />
                </div>
              </div>

              {/* Traits */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Traços de Sistema (Tags de Criatura)
                </label>
                <TraitInputCombobox
                  value={traits}
                  onChange={(newTraits) => setTraits(newTraits)}
                />
              </div>

              {/* Folders */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-emerald-400" />
                    Pastas & Biomas de Fauna
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFolderManagerOpen(true)}
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
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
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
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
                    placeholder="Nova pasta de bioma..."
                    className="px-2.5 py-1 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddFolder}
                    className="px-2.5 py-1 text-xs rounded-lg bg-emerald-900/60 text-emerald-200 border border-emerald-700"
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
                  placeholder="fauna, fera, predador, montaria"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BIOLOGY */}
          {activeTab === 'biology' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Comportamento em Combate & Vida Selvagem
                </label>
                <textarea
                  rows={4}
                  value={faunaData.behavior || ''}
                  onChange={(e) => setFaunaData({ ...faunaData, behavior: e.target.value })}
                  placeholder="Ex: Caça em matilhas coordenadas durante tempestades; foge de fogo arcano..."
                  className="w-full p-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Adestramento & Domesticação / Montaria
                </label>
                <textarea
                  rows={3}
                  value={faunaData.domestication || ''}
                  onChange={(e) => setFaunaData({ ...faunaData, domestication: e.target.value })}
                  placeholder="Ex: Pode ser domesticado se criado desde filhote (CD 18 Adestramento); serve como montaria robusta..."
                  className="w-full p-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: HARVEST */}
          {activeTab === 'harvest' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Adicionar Parte Coletável / Espólio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Parte (Ex: Glândula de Veneno, Couro Cristalino)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={newPartUtil}
                    onChange={(e) => setNewPartUtil(e.target.value)}
                    placeholder="Utilidade (Ex: Alquimia, Armaduras Leves)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <input
                    type="text"
                    value={newPartDc}
                    onChange={(e) => setNewPartDc(e.target.value)}
                    placeholder="CD Extração (Ex: Sobrevivência CD 17)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={newPartVal}
                    onChange={(e) => setNewPartVal(e.target.value)}
                    placeholder="Valor de Mercado (Ex: 15 PO)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddHarvestPart}
                    className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-bold"
                  >
                    Adicionar Espólio
                  </button>
                </div>
              </div>

              {/* Harvest list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Espólios Cadastrados ({(faunaData.harvestableParts || []).length})
                </h4>
                {(faunaData.harvestableParts || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum espólio ou recurso cadastrado ainda.</p>
                ) : (
                  (faunaData.harvestableParts || []).map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-zinc-200">{part.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                          {part.utility}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {part.dcOrDifficulty}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-mono">
                          {part.value}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHarvestPart(part.id)}
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

          {/* TAB 4: SECRETS (GM) */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Segredos do GM & Fraquezas Ocultas</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Fraquezas não catalogadas, mutações mágicas raras, origens criadas em laboratório.
                </p>
                <textarea
                  rows={6}
                  value={faunaData.gmNotes || ''}
                  onChange={(e) => setFaunaData({ ...faunaData, gmNotes: e.target.value })}
                  placeholder="Escreva aqui detalhes confidenciais sobre este espécime..."
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
                  <span>Ocultar artigo inteiro dos Jogadores</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: LORE */}
          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Descrição Completa, Ecologia & Lendas Populares
                </label>
                <RichTextBar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
                <textarea
                  ref={contentTextareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva a aparência física, mitos locais contados por caçadores, padrões migratórios..."
                  className="w-full p-3.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0d1813] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-zinc-950 text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Fauna</span>
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
          scope="fauna"
          categories={[{ id: 'all', name: 'Toda a Fauna', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="emerald"
          onRefresh={refreshFolders}
        />
      )}
    </div>
  );
};
