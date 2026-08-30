import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  LocationAttributes,
  LocationPointOfInterest,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyLocationData,
  serializeLocationToHTML,
} from '../utils/entitySerializers';
import { IntelligentEntityPicker } from './IntelligentEntityPicker';
import { IntelligentMultiEntityPicker } from './IntelligentMultiEntityPicker';
import { MutualLinkService } from '../services/mutualLinkService';
import {
  MapPin,
  Compass,
  Building,
  Building2,
  Users,
  ShieldAlert,
  Globe,
  CloudRain,
  Crown,
  Plus,
  Trash2,
  Lock,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  X,
  Check,
  Map,
  Sparkles,
  Scroll,
  User,
} from 'lucide-react';

interface LocationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'geography' | 'pois' | 'factions' | 'secrets' | 'bio';

const SETTLEMENT_TYPES = [
  'Metrópole',
  'Cidade',
  'Vila / Assentamento',
  'Posto Avançado',
  'Fortaleza / Castelo',
  'Ruínas Antigas',
  'Masmorra / Caverna',
  'Ponto de Interesse',
  'Região Selvagem / Ermos',
  'Templo / Santuário',
  'Plano / Dimensão',
  'Outro',
];

const DANGER_LEVELS = ['Seguro', 'Baixo', 'Moderado', 'Perigoso', 'Extremo', 'Mortal'];

export const LocationCreateModal: React.FC<LocationCreateModalProps> = ({
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

  // Structured Location Data
  const [locationData, setLocationData] = useState<LocationAttributes>(getEmptyLocationData());

  // Point of Interest inputs
  const [newPoiName, setNewPoiName] = useState('');
  const [newPoiType, setNewPoiType] = useState('Ponto de Interesse');
  const [newPoiDesc, setNewPoiDesc] = useState('');
  const [newPoiSecret, setNewPoiSecret] = useState(false);

  // Faction input
  const [newFactionInput, setNewFactionInput] = useState('');

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('location');
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
      if (e.category === 'location' || e.locationData) {
        (e.locationData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
          if (s) set.add(s.trim());
        });
      }
    });
    setExistingFolders(Array.from(set).sort());
  };

  // Sync folders
  useEffect(() => {
    refreshFolders();
  }, [isOpen]);

  // Load initEntity or reset
  useEffect(() => {
    if (initEntity) {
      setTitle(initEntity.title || '');
      setSubtitle(initEntity.subtitle || '');
      setTagsInput((initEntity.tags || []).join(', '));
      setIsSecret(Boolean(initEntity.isSecret));
      setVisibility(initEntity.visibility || 'all');
      setAllowedUserIds(initEntity.allowedUserIds || []);
      setContent(initEntity.content || '');
      setCoverImage(initEntity.coverImage || initEntity.locationData?.mapImage || '');

      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      setLocationData(initEntity.locationData ? { ...initEntity.locationData } : getEmptyLocationData());
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('local, hecos');
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setCoverImage('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      setLocationData(getEmptyLocationData());
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
    HecosStorage.addScopeSubcategory('location', 'all', trimmed);
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

  const handleAddPoi = () => {
    if (!newPoiName.trim()) return;
    const newPoi: LocationPointOfInterest = {
      id: 'poi-' + Date.now(),
      name: newPoiName.trim(),
      type: newPoiType,
      description: newPoiDesc.trim(),
      isSecret: newPoiSecret,
    };
    setLocationData((prev) => ({
      ...prev,
      pointsOfInterest: [...(prev.pointsOfInterest || []), newPoi],
    }));
    setNewPoiName('');
    setNewPoiDesc('');
    setNewPoiSecret(false);
  };

  const handleRemovePoi = (id: string) => {
    setLocationData((prev) => ({
      ...prev,
      pointsOfInterest: (prev.pointsOfInterest || []).filter((p) => p.id !== id),
    }));
  };

  const handleAddFaction = () => {
    const trimmed = newFactionInput.trim();
    if (!trimmed) return;
    if (!(locationData.factionsPresent || []).includes(trimmed)) {
      setLocationData((prev) => ({
        ...prev,
        factionsPresent: [...(prev.factionsPresent || []), trimmed],
      }));
    }
    setNewFactionInput('');
  };

  const handleRemoveFaction = (name: string) => {
    setLocationData((prev) => ({
      ...prev,
      factionsPresent: (prev.factionsPresent || []).filter((f) => f !== name),
    }));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome do local.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullLocationData: LocationAttributes = {
      ...locationData,
      mapImage: coverImage,
      subcategories: selectedSubcategories,
    };

    const finalHTML = serializeLocationToHTML(title, fullLocationData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug: initEntity?.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'local-' + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'location',
      subcategory: selectedSubcategories[0] || '',
      subcategories: selectedSubcategories,
      tags: cleanTags.length > 0 ? cleanTags : ['local'],
      summary: subtitle.trim(),
      content: finalHTML,
      coverImage: coverImage || undefined,
      locationData: fullLocationData,
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
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#0a0812] border border-cyan-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#100c1e] border-b border-cyan-900/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif flex items-center gap-2">
                <span>{initEntity ? 'Editar Local / Região' : 'Novo Local / Região'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  {locationData.settlementType || 'Local'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Configure cidades, ruínas, santuários e biomas geográficos do cenário Hecos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#0d0918] border-b border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral & Tipo', icon: Compass },
            { id: 'geography', label: 'Geografia & Clima', icon: Globe },
            { id: 'pois', label: 'Pontos de Interesse', icon: MapPin },
            { id: 'factions', label: 'Governo & Facções', icon: Crown },
            { id: 'secrets', label: 'Segredos do GM', icon: Lock },
            { id: 'bio', label: 'Descrição & Crônica', icon: FileText },
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nome do Local *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Porto do Vazio, Cidadela das Brumas, Floresta de Obsidiana"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Subtítulo / Epíteto
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: A Capital Flutuante dos Forjados em Éter"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tipo de Assentamento / Escala
                  </label>
                  <select
                    value={locationData.settlementType}
                    onChange={(e) => setLocationData({ ...locationData, settlementType: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  >
                    {SETTLEMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nível de Perigo
                  </label>
                  <select
                    value={locationData.dangerLevel}
                    onChange={(e) => setLocationData({ ...locationData, dangerLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-cyan-400"
                  >
                    {DANGER_LEVELS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    População Estimada
                  </label>
                  <input
                    type="text"
                    value={locationData.population || ''}
                    onChange={(e) => setLocationData({ ...locationData, population: e.target.value })}
                    placeholder="Ex: ~45.000 habitantes, Abandonado"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Cover / Map Image */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Mapa ou Arte Conceitual do Local
                </label>
                <ImageUploadInput
                  value={coverImage}
                  onChange={(url) => setCoverImage(url)}
                  placeholder="URL do mapa ou faça upload de imagem..."
                />
              </div>

              {/* Folders / Subcategories */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-cyan-400" />
                    Pastas & Regiões
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
                    placeholder="Nova pasta..."
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
                  placeholder="local, capital, porto, subterraneo"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GEOGRAPHY & CLIMATE */}
          {activeTab === 'geography' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Região Maior / Continente / Plano
                  </label>
                  <input
                    type="text"
                    value={locationData.planeOrRegion || ''}
                    onChange={(e) => setLocationData({ ...locationData, planeOrRegion: e.target.value })}
                    placeholder="Ex: Terras Ermas do Sul, Plano Astral, Império Solar"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Clima & Ambiente
                  </label>
                  <input
                    type="text"
                    value={locationData.climate || ''}
                    onChange={(e) => setLocationData({ ...locationData, climate: e.target.value })}
                    placeholder="Ex: Árido com tempestades de cinzas, Frio polar constante"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Distritos & Bairros Principais
                </label>
                <textarea
                  rows={3}
                  value={(locationData.districts || []).join('\n')}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      districts: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  placeholder="Digite um distrito por linha. Ex:&#10;Distrito dos Ferreiros&#10;Colina dos Nobres&#10;Docas Baixas"
                  className="w-full p-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: POINTS OF INTEREST */}
          {activeTab === 'pois' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Adicionar Ponto de Interesse / Sublocal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newPoiName}
                    onChange={(e) => setNewPoiName(e.target.value)}
                    placeholder="Nome do local (Ex: Taverna do Corvo)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={newPoiType}
                    onChange={(e) => setNewPoiType(e.target.value)}
                    placeholder="Tipo (Taverna, Templo, Ruína)"
                    className="px-3 py-2 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-100"
                  />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPoiSecret}
                        onChange={(e) => setNewPoiSecret(e.target.checked)}
                        className="rounded border-zinc-700"
                      />
                      <span>Secreto (GM)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddPoi}
                      className="px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-bold transition-all ml-auto"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={newPoiDesc}
                  onChange={(e) => setNewPoiDesc(e.target.value)}
                  placeholder="Breve descrição ou personagens presentes neste local..."
                  className="w-full p-2.5 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-200"
                />
              </div>

              {/* List of POIs */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Pontos Cadastrados ({(locationData.pointsOfInterest || []).length})
                </h4>
                {(locationData.pointsOfInterest || []).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum ponto de interesse cadastrado ainda.</p>
                ) : (
                  (locationData.pointsOfInterest || []).map((poi) => (
                    <div
                      key={poi.id}
                      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200">{poi.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono">
                            {poi.type || 'Ponto'}
                          </span>
                          {poi.isSecret && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono">
                              GM Secreto
                            </span>
                          )}
                        </div>
                        {poi.description && (
                          <p className="text-zinc-400 mt-1">{poi.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePoi(poi.id)}
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

          {/* TAB 4: GOVERNMENT, NPCS, FACTIONS & QUESTS */}
          {activeTab === 'factions' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <IntelligentEntityPicker
                    label="Governante / Líder (NPC)"
                    category="npc"
                    valueId={locationData.rulerEntityId}
                    valueName={locationData.ruler}
                    placeholder="Buscar governante ou digitar..."
                    onChange={(id, title) => {
                      setLocationData({
                        ...locationData,
                        ruler: title || '',
                        rulerEntityId: id,
                      });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Forma de Governo
                  </label>
                  <input
                    type="text"
                    value={locationData.government || ''}
                    onChange={(e) => setLocationData({ ...locationData, government: e.target.value })}
                    placeholder="Ex: Oligarquia Mercantil, Feudalismo Militar, Teocracia"
                    className="w-full px-3.5 py-2 bg-zinc-900/90 border border-purple-900/60 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Inhabitant NPCs */}
              <div className="p-4 rounded-xl bg-black/40 border border-purple-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Residentes & Figuras Notáveis (NPCs)"
                  category="npc"
                  selectedIds={locationData.inhabitantNpcIds || []}
                  badgeTheme="emerald"
                  placeholder="Buscar e vincular NPCs residentes neste local..."
                  onChange={(ids) => {
                    setLocationData({
                      ...locationData,
                      inhabitantNpcIds: ids,
                    });
                  }}
                />
              </div>

              {/* Factions / Organizations Present */}
              <div className="p-4 rounded-xl bg-black/40 border border-purple-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Organizações & Facções com Presença Ativa"
                  category="organization"
                  selectedIds={locationData.factionEntityIds || []}
                  badgeTheme="purple"
                  placeholder="Buscar e vincular Organizações presentes neste local..."
                  onChange={(ids, entities) => {
                    setLocationData({
                      ...locationData,
                      factionEntityIds: ids,
                      factionsPresent: entities.map((e) => e.title),
                    });
                  }}
                />
              </div>

              {/* Quests Linked */}
              <div className="p-4 rounded-xl bg-black/40 border border-purple-900/40 space-y-2">
                <IntelligentMultiEntityPicker
                  label="Missões & Acontecimentos no Local (Quests)"
                  category="quest"
                  selectedIds={locationData.questIds || []}
                  badgeTheme="amber"
                  placeholder="Buscar e vincular Missões que acontecem neste local..."
                  onChange={(ids) => {
                    setLocationData({
                      ...locationData,
                      questIds: ids,
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 5: SECRETS (GM) */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Segredos Confidenciais do Local (Apenas GM)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Mistérios antigos, cultos escondidos nos esgotos, passagens secretas e ganchos de aventura.
                </p>
                <textarea
                  rows={6}
                  value={locationData.gmSecrets || ''}
                  onChange={(e) => setLocationData({ ...locationData, gmSecrets: e.target.value })}
                  placeholder="Escreva aqui segredos e reviravoltas que apenas o Mestre deve ver..."
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
                  <span>Ocultar artigo inteiro dos Jogadores (Artigo Secreto)</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 6: BIO & DESCRIPTION */}
          {activeTab === 'bio' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Descrição Completa, História & Arquitetura
                </label>
                <RichTextBar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
                <textarea
                  ref={contentTextareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva a crônica, costumes locais, clima das ruas, descrições vívidas para narrar aos jogadores..."
                  className="w-full p-3.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-6 py-4 bg-[#100c1e] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
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
            <span>Salvar Local</span>
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
          scope="location"
          categories={[{ id: 'all', name: 'Todos os Locais', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="cyan"
          onRefresh={refreshFolders}
        />
      )}
    </div>
  );
};
