import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  OrganizationAttributes,
  OrganizationType,
  OrganizationScope,
  OrganizationRank,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyOrganizationData,
  serializeOrganizationToHTML,
} from '../utils/entitySerializers';
import { IntelligentEntityPicker } from './IntelligentEntityPicker';
import { IntelligentMultiEntityPicker } from './IntelligentMultiEntityPicker';
import { MutualLinkService } from '../services/mutualLinkService';
import {
  Building2,
  Crown,
  Shield,
  MapPin,
  Users,
  Swords,
  Plus,
  Trash2,
  Lock,
  FileText,
  Folder,
  FolderPlus,
  X,
  Check,
  Sparkles,
  Award,
  Scroll,
  User,
} from 'lucide-react';

interface OrganizationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'hierarchy' | 'diplomacy' | 'secrets' | 'lore';

const ORG_TYPES: OrganizationType[] = [
  'Guilda',
  'Ordem de Cavalaria',
  'Culto Religioso',
  'Império / Reino',
  'Sindicato do Crime',
  'Círculo Arcano',
  'Companhia Mercenária',
  'Academia / Eruditos',
  'Facção Política',
  'Outro',
];

const ORG_SCOPES: OrganizationScope[] = ['Local', 'Regional', 'Nacional', 'Continental', 'Planar'];

export const OrganizationCreateModal: React.FC<OrganizationCreateModalProps> = ({
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
  const [coverImage, setCoverImage] = useState('');

  // Folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Structured Org Data
  const [orgData, setOrgData] = useState<OrganizationAttributes>(getEmptyOrganizationData());

  // Rank input
  const [newRankName, setNewRankName] = useState('');
  const [newRankReq, setNewRankReq] = useState('');
  const [newRankDesc, setNewRankDesc] = useState('');

  // Ally / Rival inputs
  const [newAllyInput, setNewAllyInput] = useState('');
  const [newRivalInput, setNewRivalInput] = useState('');

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('organization');
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
      if (e.category === 'organization' || e.organizationData) {
        (e.organizationData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
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
      setCoverImage(initEntity.coverImage || initEntity.organizationData?.symbolImage || '');

      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      setOrgData(initEntity.organizationData ? { ...initEntity.organizationData } : getEmptyOrganizationData());
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('faccao, guilda, hecos');
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setCoverImage('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      setOrgData(getEmptyOrganizationData());
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
    HecosStorage.addScopeSubcategory('organization', 'all', trimmed);
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

  const handleAddRank = () => {
    if (!newRankName.trim()) return;
    const newRank: OrganizationRank = {
      id: 'rank-' + Date.now(),
      rankName: newRankName.trim(),
      requirements: newRankReq.trim(),
      description: newRankDesc.trim(),
    };
    setOrgData((prev) => ({
      ...prev,
      ranks: [...(prev.ranks || []), newRank],
    }));
    setNewRankName('');
    setNewRankReq('');
    setNewRankDesc('');
  };

  const handleRemoveRank = (id: string) => {
    setOrgData((prev) => ({
      ...prev,
      ranks: (prev.ranks || []).filter((r) => r.id !== id),
    }));
  };

  const handleAddAlly = () => {
    const trimmed = newAllyInput.trim();
    if (!trimmed) return;
    if (!(orgData.allies || []).includes(trimmed)) {
      setOrgData((prev) => ({
        ...prev,
        allies: [...(prev.allies || []), trimmed],
      }));
    }
    setNewAllyInput('');
  };

  const handleRemoveAlly = (name: string) => {
    setOrgData((prev) => ({
      ...prev,
      allies: (prev.allies || []).filter((a) => a !== name),
    }));
  };

  const handleAddRival = () => {
    const trimmed = newRivalInput.trim();
    if (!trimmed) return;
    if (!(orgData.rivals || []).includes(trimmed)) {
      setOrgData((prev) => ({
        ...prev,
        rivals: [...(prev.rivals || []), trimmed],
      }));
    }
    setNewRivalInput('');
  };

  const handleRemoveRival = (name: string) => {
    setOrgData((prev) => ({
      ...prev,
      rivals: (prev.rivals || []).filter((r) => r !== name),
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome da organização.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullOrgData: OrganizationAttributes = {
      ...orgData,
      symbolImage: coverImage,
      subcategories: selectedSubcategories,
    };

    const finalHTML = serializeOrganizationToHTML(title, fullOrgData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug: initEntity?.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'org-' + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'organization',
      subcategory: selectedSubcategories[0] || '',
      subcategories: selectedSubcategories,
      tags: cleanTags.length > 0 ? cleanTags : ['faccao', 'organizacao'],
      summary: subtitle.trim(),
      content: finalHTML,
      coverImage: coverImage || undefined,
      organizationData: fullOrgData,
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
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#0e0712] border border-rose-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 bg-[#180b1e] border-b border-rose-900/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif flex items-center gap-2">
                <span>{initEntity ? 'Editar Facção / Organização' : 'Nova Facção / Organização'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono">
                  {orgData.type || 'Facção'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Guildas, sindicatos criminosos, ordens de cavalaria e impérios de Hecos.
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
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#120816] border-b border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Identidade & Tipo', icon: Building2 },
            { id: 'hierarchy', label: 'Líder & Postos / Ranks', icon: Crown },
            { id: 'diplomacy', label: 'Aliados & Rivais', icon: Swords },
            { id: 'secrets', label: 'Segredos do GM', icon: Lock },
            { id: 'lore', label: 'Manifesto & História', icon: FileText },
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
                    ? 'border-rose-400 bg-rose-950/40 text-rose-300'
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
                    Nome da Organização / Facção *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: A Fraternidade Carmesim, Companhia do Grifo de Aço"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Lema / Mote da Facção
                  </label>
                  <input
                    type="text"
                    value={orgData.motto || ''}
                    onChange={(e) => setOrgData({ ...orgData, motto: e.target.value })}
                    placeholder="Ex: 'Nas Cinzas, Nós Renascemos.'"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Type, Scope, Alignment, Influence */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tipo de Facção
                  </label>
                  <select
                    value={orgData.type || 'Guilda'}
                    onChange={(e) => setOrgData({ ...orgData, type: e.target.value as OrganizationType })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-rose-300 focus:outline-none focus:border-rose-400"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Escala de Alcance
                  </label>
                  <select
                    value={orgData.scope || 'Regional'}
                    onChange={(e) => setOrgData({ ...orgData, scope: e.target.value as OrganizationScope })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-rose-400"
                  >
                    {ORG_SCOPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Alinhamento
                  </label>
                  <input
                    type="text"
                    value={orgData.alignment || ''}
                    onChange={(e) => setOrgData({ ...orgData, alignment: e.target.value })}
                    placeholder="Ex: Leal e Neutro, Caótico e Bom"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nível de Influência
                  </label>
                  <select
                    value={orgData.influence || 'Média'}
                    onChange={(e) => setOrgData({ ...orgData, influence: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-rose-400"
                  >
                    <option value="Baixa">Baixa (Discreta / Nova)</option>
                    <option value="Média">Média (Reconhecida)</option>
                    <option value="Alta">Alta (Poderosa na Região)</option>
                    <option value="Dominante">Dominante (Monopólio / Hegemonia)</option>
                  </select>
                </div>
              </div>

              {/* Sede e Recursos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <IntelligentEntityPicker
                    label="Sede / Base Principal (Local)"
                    category="location"
                    valueId={orgData.headquartersLocationId}
                    valueName={orgData.headquarters}
                    placeholder="Buscar local ou digitar..."
                    onChange={(id, title) => {
                      setOrgData({
                        ...orgData,
                        headquarters: title || '',
                        headquartersLocationId: id,
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Recursos Principais
                  </label>
                  <input
                    type="text"
                    value={orgData.resources || ''}
                    onChange={(e) => setOrgData({ ...orgData, resources: e.target.value })}
                    placeholder="Ex: Mercenários de elite, Cofres ilimitados, Espiões"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Symbol / Insignia Image */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Brasão, Estandarte ou Arte do Símbolo
                </label>
                <ImageUploadInput
                  value={coverImage}
                  onChange={(url) => setCoverImage(url)}
                  placeholder="URL da insígnia ou faça upload de imagem..."
                />
              </div>

              {/* Folders */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-rose-400" />
                    Pastas & Categorias de Facção
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFolderManagerOpen(true)}
                    className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
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
                            ? 'bg-rose-950 border-rose-600 text-rose-200'
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
                    placeholder="Nova pasta..."
                    className="px-2.5 py-1 text-xs bg-black/60 border border-zinc-700 rounded-lg text-zinc-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddFolder}
                    className="px-2.5 py-1 text-xs rounded-lg bg-rose-900/60 text-rose-200 border border-rose-700"
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
                  placeholder="faccao, guilda, politica, crime"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: HIERARCHY & MEMBERS */}
          {activeTab === 'hierarchy' && (
            <div className="space-y-5">
              <div>
                <IntelligentEntityPicker
                  label="Líder Supremo / Diretor (NPC)"
                  category="npc"
                  valueId={orgData.leaderEntityId}
                  valueName={orgData.leader}
                  placeholder="Buscar líder ou digitar..."
                  onChange={(id, title) => {
                    setOrgData({
                      ...orgData,
                      leader: title || '',
                      leaderEntityId: id,
                    });
                  }}
                />
              </div>

              {/* Members / NPCs */}
              <div className="p-4 rounded-xl bg-black/40 border border-rose-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Membros Notáveis, Agentes & Oficiais (NPCs)"
                  category="npc"
                  selectedIds={orgData.memberNpcIds || []}
                  badgeTheme="emerald"
                  placeholder="Buscar e vincular NPCs membros desta organização..."
                  onChange={(ids) => {
                    setOrgData({
                      ...orgData,
                      memberNpcIds: ids,
                    });
                  }}
                />
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Adicionar Posto / Rank Hierárquico
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newRankName}
                    onChange={(e) => setNewRankName(e.target.value)}
                    placeholder="Nome do Rank (Ex: Recruta, Cavaleiro, Grão-Inquisidor)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={newRankReq}
                    onChange={(e) => setNewRankReq(e.target.value)}
                    placeholder="Requisitos (Ex: Completar 3 contratos de ouro)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRankDesc}
                    onChange={(e) => setNewRankDesc(e.target.value)}
                    placeholder="Privilégios e deveres deste posto..."
                    className="flex-1 px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddRank}
                    className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-bold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Ranks list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Hierarquia Cadastrada ({(orgData.ranks || []).length})
                </h4>
                {(orgData.ranks || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum rank ou cargo cadastrado ainda.</p>
                ) : (
                  (orgData.ranks || []).map((rank) => (
                    <div
                      key={rank.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{rank.rankName}</span>
                          {rank.requirements && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-rose-300 font-mono">
                              Requisito: {rank.requirements}
                            </span>
                          )}
                        </div>
                        {rank.description && (
                          <p className="text-zinc-400 mt-1">{rank.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRank(rank.id)}
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

          {/* TAB 3: DIPLOMACY & QUESTS */}
          {activeTab === 'diplomacy' && (
            <div className="space-y-5">
              {/* Allies */}
              <div className="p-4 rounded-xl bg-black/40 border border-emerald-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Facções Aliadas & Patronos"
                  category="organization"
                  selectedIds={orgData.allyEntityIds || []}
                  badgeTheme="emerald"
                  placeholder="Buscar e vincular facções aliadas..."
                  onChange={(ids, entities) => {
                    setOrgData({
                      ...orgData,
                      allyEntityIds: ids,
                      allies: entities.map((e) => e.title),
                    });
                  }}
                />
              </div>

              {/* Rivals */}
              <div className="p-4 rounded-xl bg-black/40 border border-rose-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Facções Rivais & Inimigos Declarados"
                  category="organization"
                  selectedIds={orgData.rivalEntityIds || []}
                  badgeTheme="rose"
                  placeholder="Buscar e vincular facções inimigas ou concorrentes..."
                  onChange={(ids, entities) => {
                    setOrgData({
                      ...orgData,
                      rivalEntityIds: ids,
                      rivals: entities.map((e) => e.title),
                    });
                  }}
                />
              </div>

              {/* Quests */}
              <div className="p-4 rounded-xl bg-black/40 border border-amber-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Contratos & Missões Emitidas / Relacionadas (Quests)"
                  category="quest"
                  selectedIds={orgData.questIds || []}
                  badgeTheme="amber"
                  placeholder="Buscar e vincular Quests patrocinadas por esta organização..."
                  onChange={(ids) => {
                    setOrgData({
                      ...orgData,
                      questIds: ids,
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 4: SECRETS (GM) */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Agendas Secretas & Conspirações (Apenas GM)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Planos ocultos dos líderes, traidores infiltrados, acordos escusos e alianças secretas.
                </p>
                <textarea
                  rows={6}
                  value={orgData.gmSecrets || ''}
                  onChange={(e) => setOrgData({ ...orgData, gmSecrets: e.target.value })}
                  placeholder="Escreva aqui os segredos que os jogadores ainda não descobriram..."
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
                  <span>Ocultar facção inteira dos Jogadores</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: LORE & MANIFESTO */}
          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Manifesto, História de Fundação & Rituais
                </label>
                <RichTextBar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
                <textarea
                  ref={contentTextareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva as origens da facção, crenças internas, juramentos de sangue..."
                  className="w-full p-3.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#180b1e] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
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
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 text-zinc-950 text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Facção</span>
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
          scope="organization"
          categories={[{ id: 'all', name: 'Todas as Organizações', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="rose"
          onRefresh={refreshFolders}
        />
      )}
    </div>
  );
};
