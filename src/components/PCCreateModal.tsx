import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  PCAttributes,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyPCData,
  serializePCToHTML,
} from '../utils/entitySerializers';
import {
  Users,
  Shield,
  Heart,
  Eye,
  Zap,
  Sparkles,
  Award,
  Crown,
  FileText,
  Folder,
  FolderPlus,
  X,
  Check,
  Swords,
  Footprints,
} from 'lucide-react';

interface PCCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'stats' | 'attributes' | 'backstory';

export const PCCreateModal: React.FC<PCCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initEntity,
  presetSubcategory,
}) => {
  const currentUser = HecosStorage.getCurrentUser();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);

  // Base Entity Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [traits, setTraits] = useState<string[]>(['Humanoide']);
  const [isSecret, setIsSecret] = useState(false);
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [portraitImage, setPortraitImage] = useState('');
  const [tokenImage, setTokenImage] = useState('');

  // Folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Structured PC Data
  const [pcData, setPcData] = useState<PCAttributes>(getEmptyPCData());

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('pc');
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
      if (e.category === 'pc' || e.pcData) {
        (e.pcData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
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
      setTraits(initEntity.traits || initEntity.pcData?.traits || ['Humanoide']);
      setIsSecret(Boolean(initEntity.isSecret));
      setVisibility(initEntity.visibility || 'all');
      setAllowedUserIds(initEntity.allowedUserIds || []);
      setContent(initEntity.content || '');
      setPortraitImage(initEntity.coverImage || initEntity.pcData?.portraitImage || '');
      setTokenImage(initEntity.pcData?.tokenImage || '');

      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      setPcData(initEntity.pcData ? { ...initEntity.pcData } : getEmptyPCData());
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('pc, jogador, heroi, hecos');
      setTraits(['Humanoide']);
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setPortraitImage('');
      setTokenImage('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      setPcData(getEmptyPCData());
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
    HecosStorage.addScopeSubcategory('pc', 'all', trimmed);
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

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome do personagem.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullPCData: PCAttributes = {
      ...pcData,
      portraitImage,
      tokenImage,
      traits,
      subcategories: selectedSubcategories,
    };

    const finalHTML = serializePCToHTML(title, fullPCData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug: initEntity?.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'pc-' + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'pc',
      subcategory: selectedSubcategories[0] || '',
      subcategories: selectedSubcategories,
      tags: cleanTags.length > 0 ? cleanTags : ['pc', 'jogador'],
      traits,
      summary: subtitle.trim(),
      content: finalHTML,
      coverImage: portraitImage || undefined,
      pcData: fullPCData,
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
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#080d16] border border-cyan-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1624] border-b border-cyan-900/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif flex items-center gap-2">
                <span>{initEntity ? 'Editar Personagem Jogador' : 'Novo Personagem Jogador'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  {pcData.characterClass ? `${pcData.characterClass} Nv ${pcData.level ?? 1}` : 'PC'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ficha resumida do herói, dados do jogador, valores de CA, PV e histórico de campanha.
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
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#0a101b] border-b border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Identidade & Classe', icon: Users },
            { id: 'stats', label: 'Defesas & Combate', icon: Shield },
            { id: 'attributes', label: 'Atributos Base', icon: Zap },
            { id: 'backstory', label: 'História & Conceito', icon: FileText },
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
                    Nome do Personagem *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Kaelen Solferino, Lyra Sombrasussurro"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nome do Jogador / Jogadora
                  </label>
                  <input
                    type="text"
                    value={pcData.playerName || ''}
                    onChange={(e) => setPcData({ ...pcData, playerName: e.target.value })}
                    placeholder="Ex: Carlos, Marina, Gabriel..."
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-cyan-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Class, Subclass, Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Classe
                  </label>
                  <input
                    type="text"
                    value={pcData.characterClass || ''}
                    onChange={(e) => setPcData({ ...pcData, characterClass: e.target.value })}
                    placeholder="Ex: Ladino, Mago, Campeão, Monge"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Subclasse / Trilha / Votação
                  </label>
                  <input
                    type="text"
                    value={pcData.subclass || ''}
                    onChange={(e) => setPcData({ ...pcData, subclass: e.target.value })}
                    placeholder="Ex: Trapaceiro Mágico, Escola de Evocação"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nível de Personagem
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={pcData.level ?? 1}
                    onChange={(e) => setPcData({ ...pcData, level: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Ancestry & Heritage & Background */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Ancestralidade & Herança
                  </label>
                  <input
                    type="text"
                    value={pcData.ancestry || ''}
                    onChange={(e) => setPcData({ ...pcData, ancestry: e.target.value })}
                    placeholder="Ex: Humano Versátil, Elfo Silvestre"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Histórico / Background
                  </label>
                  <input
                    type="text"
                    value={pcData.background || ''}
                    onChange={(e) => setPcData({ ...pcData, background: e.target.value })}
                    placeholder="Ex: Criminoso, Erudito, Soldado"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Divindade / Patrono
                  </label>
                  <input
                    type="text"
                    value={pcData.deity || ''}
                    onChange={(e) => setPcData({ ...pcData, deity: e.target.value })}
                    placeholder="Ex: Iomedae, Nethys, Ateu"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Concept / Epíteto */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Conceito do Personagem / Frase Marcante
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: 'Um espião relutante em busca de redenção para seu clã caído'"
                  className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Retrato do Personagem (Arte)
                  </label>
                  <ImageUploadInput
                    value={portraitImage}
                    onChange={(url) => setPortraitImage(url)}
                    placeholder="URL ou upload do retrato..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Token Circular de Batalha (VTT)
                  </label>
                  <ImageUploadInput
                    value={tokenImage}
                    onChange={(url) => setTokenImage(url)}
                    placeholder="URL ou upload do token circular..."
                  />
                </div>
              </div>

              {/* Traits */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Traços de Sistema
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
                    <Folder className="w-4 h-4 text-cyan-400" />
                    Pastas / Grupos de Aventureiros
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
                    placeholder="Novo grupo ou grupo de campanha..."
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
                  placeholder="pc, jogador, grupo-principal, heroi"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1 text-center">
                  <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Classe de Armadura (CA)
                  </label>
                  <input
                    type="number"
                    value={pcData.ac ?? 15}
                    onChange={(e) => setPcData({ ...pcData, ac: parseInt(e.target.value) || 10 })}
                    className="w-20 mx-auto text-center py-1.5 bg-black/70 border border-zinc-700 rounded-lg text-lg font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1 text-center">
                  <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Pontos de Vida Máximos
                  </label>
                  <input
                    type="number"
                    value={pcData.maxHp ?? 18}
                    onChange={(e) => setPcData({ ...pcData, maxHp: parseInt(e.target.value) || 1 })}
                    className="w-20 mx-auto text-center py-1.5 bg-black/70 border border-zinc-700 rounded-lg text-lg font-bold text-emerald-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1 text-center">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Percepção
                  </label>
                  <input
                    type="number"
                    value={pcData.perception ?? 4}
                    onChange={(e) => setPcData({ ...pcData, perception: parseInt(e.target.value) || 0 })}
                    className="w-20 mx-auto text-center py-1.5 bg-black/70 border border-zinc-700 rounded-lg text-lg font-bold text-amber-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1 text-center">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Pontos de Heroísmo
                  </label>
                  <select
                    value={pcData.heroPoints ?? 1}
                    onChange={(e) => setPcData({ ...pcData, heroPoints: parseInt(e.target.value) || 0 })}
                    className="w-20 mx-auto text-center py-1.5 bg-black/70 border border-zinc-700 rounded-lg text-base font-bold text-purple-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value={0}>0</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Deslocamento / Velocidade
                </label>
                <input
                  type="text"
                  value={pcData.speed || '9m (25 ft)'}
                  onChange={(e) => setPcData({ ...pcData, speed: e.target.value })}
                  placeholder="Ex: 9m (30 pés), Voo 6m"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ATTRIBUTES */}
          {activeTab === 'attributes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {[
                  { key: 'str', label: 'FOR', name: 'Força' },
                  { key: 'dex', label: 'DES', name: 'Destreza' },
                  { key: 'con', label: 'CON', name: 'Constituição' },
                  { key: 'int', label: 'INT', name: 'Inteligência' },
                  { key: 'wis', label: 'SAB', name: 'Sabedoria' },
                  { key: 'cha', label: 'CAR', name: 'Carisma' },
                ].map((attr) => {
                  const val = pcData.attributes?.[attr.key as keyof typeof pcData.attributes] ?? 10;
                  const mod = Math.floor((val - 10) / 2);
                  return (
                    <div
                      key={attr.key}
                      className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-center space-y-1.5"
                    >
                      <span className="block text-xs font-bold text-cyan-300 font-mono">
                        {attr.label}
                      </span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) =>
                          setPcData({
                            ...pcData,
                            attributes: {
                              ...(pcData.attributes || {}),
                              [attr.key]: parseInt(e.target.value) || 10,
                            },
                          })
                        }
                        className="w-14 mx-auto text-center py-1 bg-black/80 border border-zinc-700 rounded-lg text-sm font-bold text-zinc-100"
                      />
                      <span className="block text-[11px] text-zinc-400 font-mono">
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: BACKSTORY */}
          {activeTab === 'backstory' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Resumo do Histórico & Motivações
                </label>
                <textarea
                  rows={4}
                  value={pcData.backstory || ''}
                  onChange={(e) => setPcData({ ...pcData, backstory: e.target.value })}
                  placeholder="De onde veio o personagem, quais seus traumas, ambições e laços com o grupo..."
                  className="w-full p-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Crônica Detalhada, Diário de Aventura & Anotações
                </label>
                <RichTextBar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
                <textarea
                  ref={contentTextareaRef}
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva anotações pessoais, inventário de relíquias, contatos pessoais..."
                  className="w-full p-3.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0d1624] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
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
            <span>Salvar Personagem</span>
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
          scope="pc"
          categories={[{ id: 'all', name: 'Todos os Personagens Jogadores', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="cyan"
          onRefresh={refreshFolders}
        />
      )}
    </div>
  );
};
