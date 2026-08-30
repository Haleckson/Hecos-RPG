import React, { useState, useEffect, useRef } from 'react';
import {
  HecosEntity,
  FloraAttributes,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import { RichTextBar } from './RichTextBar';
import {
  getEmptyFloraData,
  serializeFloraToHTML,
} from '../utils/entitySerializers';
import {
  Flower2,
  Sparkles,
  FlaskConical,
  AlertTriangle,
  Clock,
  HeartPulse,
  Lock,
  FileText,
  Folder,
  FolderPlus,
  X,
  Check,
} from 'lucide-react';

interface FloraCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initEntity?: HecosEntity | null;
  presetSubcategory?: string;
}

type TabType = 'overview' | 'alchemy' | 'secrets' | 'lore';

const FLORA_PROPERTIES = [
  'Medicinal',
  'Venenosa',
  'Reagente Alquímico',
  'Alucinógena',
  'Nutritiva',
  'Mágica',
];

const RARITIES = ['Comum', 'Incomum', 'Raro', 'Único'];

export const FloraCreateModal: React.FC<FloraCreateModalProps> = ({
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
  const [traits, setTraits] = useState<string[]>(['Planta']);
  const [isSecret, setIsSecret] = useState(false);
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [portraitImage, setPortraitImage] = useState('');
  const [tokenImage, setTokenImage] = useState('');

  // Folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');

  // Structured Flora Data
  const [floraData, setFloraData] = useState<FloraAttributes>(getEmptyFloraData());

  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshFolders = () => {
    const config = HecosStorage.getScopeSubcategoriesConfig('flora');
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
      if (e.category === 'flora' || e.floraData) {
        (e.floraData?.subcategories || e.subcategories || (e.subcategory ? [e.subcategory] : [])).forEach((s) => {
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
      setTraits(initEntity.traits || initEntity.floraData?.traits || ['Planta']);
      setIsSecret(Boolean(initEntity.isSecret));
      setVisibility(initEntity.visibility || 'all');
      setAllowedUserIds(initEntity.allowedUserIds || []);
      setContent(initEntity.content || '');
      setPortraitImage(initEntity.coverImage || initEntity.floraData?.portraitImage || '');
      setTokenImage(initEntity.floraData?.tokenImage || '');

      const subList = initEntity.subcategories && initEntity.subcategories.length > 0
        ? initEntity.subcategories
        : initEntity.subcategory ? [initEntity.subcategory] : [];
      setSelectedSubcategories(subList);

      setFloraData(initEntity.floraData ? { ...initEntity.floraData } : getEmptyFloraData());
    } else {
      setTitle('');
      setSubtitle('');
      setTagsInput('flora, alquimia, planta, hecos');
      setTraits(['Planta']);
      setIsSecret(false);
      setVisibility('all');
      setAllowedUserIds([]);
      setContent('');
      setPortraitImage('');
      setTokenImage('');
      setSelectedSubcategories(presetSubcategory ? [presetSubcategory] : []);
      setFloraData(getEmptyFloraData());
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
    HecosStorage.addScopeSubcategory('flora', 'all', trimmed);
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

  const handleToggleProperty = (prop: string) => {
    const current = floraData.properties || [];
    if (current.includes(prop)) {
      setFloraData({ ...floraData, properties: current.filter((p) => p !== prop) });
    } else {
      setFloraData({ ...floraData, properties: [...current, prop] });
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome da planta ou erva.');
      return;
    }

    const cleanTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullFloraData: FloraAttributes = {
      ...floraData,
      portraitImage,
      tokenImage,
      traits,
      subcategories: selectedSubcategories,
    };

    const finalHTML = serializeFloraToHTML(title, fullFloraData, subtitle, content);

    const savedEntity: HecosEntity = {
      id: initEntity?.id || 'entity-' + Date.now(),
      slug: initEntity?.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'flora-' + Date.now(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: 'flora',
      subcategory: selectedSubcategories[0] || '',
      subcategories: selectedSubcategories,
      tags: cleanTags.length > 0 ? cleanTags : ['flora', 'alquimia'],
      traits,
      summary: subtitle.trim(),
      content: finalHTML,
      coverImage: portraitImage || undefined,
      floraData: fullFloraData,
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
      <div className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#08110b] border border-emerald-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1c13] border-b border-emerald-900/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif flex items-center gap-2">
                <span>{initEntity ? 'Editar Flora & Alquimia' : 'Nova Flora & Alquimia'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                  {floraData.rarity || 'Planta'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ervas medicinais, cogumelos luminosos, venenos mortais e reagentes de poções de Hecos.
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
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#0a160f] border-b border-zinc-800/80 overflow-x-auto">
          {[
            { id: 'overview', label: 'Identidade & Espécime', icon: Flower2 },
            { id: 'alchemy', label: 'Alquimia & Propriedades', icon: FlaskConical },
            { id: 'secrets', label: 'Segredos do GM', icon: Lock },
            { id: 'lore', label: 'Botânica & Crônica', icon: FileText },
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
                    Nome da Planta / Erva / Fungo *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Lótus de Sangue, Musgo Lunar, Raiz de Ferro"
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
                    placeholder="Ex: Rara flor que desabrocha apenas sob eclipses solares"
                    className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Rarity & Season & Preservation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Raridade
                  </label>
                  <select
                    value={floraData.rarity || 'Comum'}
                    onChange={(e) => setFloraData({ ...floraData, rarity: e.target.value })}
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-purple-300 focus:outline-none focus:border-emerald-400"
                  >
                    {RARITIES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Época de Colheita / Floração
                  </label>
                  <input
                    type="text"
                    value={floraData.harvestSeason || ''}
                    onChange={(e) => setFloraData({ ...floraData, harvestSeason: e.target.value })}
                    placeholder="Ex: Noites de Verão, Lua Nova"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Tempo de Conservação
                  </label>
                  <input
                    type="text"
                    value={floraData.preservationTime || ''}
                    onChange={(e) => setFloraData({ ...floraData, preservationTime: e.target.value })}
                    placeholder="Ex: 3 dias fresca, 1 ano desidratada"
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Habitat */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Habitat Natural & Condições de Crescimento
                </label>
                <input
                  type="text"
                  value={floraData.habitat || ''}
                  onChange={(e) => setFloraData({ ...floraData, habitat: e.target.value })}
                  placeholder="Ex: Encostas vulcânicas úmidas, troncos de árvores milenares"
                  className="w-full px-3.5 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Properties selection pills */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Propriedades de Uso (Selecione todas que se aplicam)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {FLORA_PROPERTIES.map((prop) => {
                    const isSel = (floraData.properties || []).includes(prop);
                    return (
                      <button
                        key={prop}
                        type="button"
                        onClick={() => handleToggleProperty(prop)}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {prop}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Arte Conceitual / Ilustração Botânica
                  </label>
                  <ImageUploadInput
                    value={portraitImage}
                    onChange={(url) => setPortraitImage(url)}
                    placeholder="URL ou upload da ilustração da planta..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Token Circular (Opcional)
                  </label>
                  <ImageUploadInput
                    value={tokenImage}
                    onChange={(url) => setTokenImage(url)}
                    placeholder="URL ou upload de token..."
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
                    <Folder className="w-4 h-4 text-emerald-400" />
                    Pastas & Famílias Botânicas
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
                    placeholder="Nova pasta de flora..."
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
                  placeholder="flora, erva, pocao, cura, veneno"
                  className="w-full px-3 py-2 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ALCHEMY */}
          {activeTab === 'alchemy' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Modo de Preparo & Efeitos Mecânicos
                </label>
                <textarea
                  rows={5}
                  value={floraData.preparationAndEffects || ''}
                  onChange={(e) => setFloraData({ ...floraData, preparationAndEffects: e.target.value })}
                  placeholder="Ex: Ferva as pétalas em água destilada por 10 minutos (Ofício Alquimia CD 15). Consumir restaura 2d8 PV e remove a condição Fatigado..."
                  className="w-full p-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Toxicidade & Perigo de Manuseio
                </label>
                <textarea
                  rows={3}
                  value={floraData.dangerOrToxicity || ''}
                  onChange={(e) => setFloraData({ ...floraData, dangerOrToxicity: e.target.value })}
                  placeholder="Ex: Tocar a seiva crua exige Fortitude CD 16 para não sofrer 1d6 de dano de veneno por 3 rodadas..."
                  className="w-full p-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SECRETS (GM) */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Segredos Alquímicos do GM</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Propriedades secretas desconhecidas pela ciência comum, mutações por magia proibida, contra-indicações.
                </p>
                <textarea
                  rows={6}
                  value={floraData.gmNotes || ''}
                  onChange={(e) => setFloraData({ ...floraData, gmNotes: e.target.value })}
                  placeholder="Escreva aqui segredos da planta que apenas o Mestre deve ver..."
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

          {/* TAB 4: LORE */}
          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Tratado Botânico, Folclore & História
                </label>
                <RichTextBar textareaRef={contentTextareaRef} value={content} onChange={setContent} />
                <textarea
                  ref={contentTextareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva lendas sobre o surgimento da planta, uso em rituais druídicos ou superstições populares..."
                  className="w-full p-3.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0d1c13] border-t border-zinc-800 flex items-center justify-between gap-3 shrink-0">
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
            <span>Salvar Flora</span>
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
          scope="flora"
          categories={[{ id: 'all', name: 'Toda a Flora', englishName: 'all' }]}
          entities={HecosStorage.getEntities()}
          themeColor="emerald"
          onRefresh={refreshFolders}
        />
      )}
    </div>
  );
};
