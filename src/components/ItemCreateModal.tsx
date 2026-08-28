import React, { useState, useMemo, useEffect } from 'react';
import {
  HecosEntity,
  PF2eItemAttributes,
  ItemCategoryType,
  ItemVisibility,
} from '../types';
import { getEmptyItemData, serializeItemToHTML, parseItemFromContent } from '../utils/itemSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import {
  Package,
  X,
  Check,
  Plus,
  Layers,
  Sword,
  Shield,
  FlaskConical,
  Wand2,
  Gem,
  Backpack,
  Sparkles,
  Folder,
  FolderPlus,
  FolderTree,
  Eye,
  Coins,
  Weight,
  Hammer,
  FileText,
  SlidersHorizontal,
  Zap,
  Crosshair,
  Activity,
  Scroll,
  Lock,
  Flame,
  Info,
  Settings2,
} from 'lucide-react';

interface ItemCreateModalProps {
  isOpen: boolean;
  initialCategory?: ItemCategoryType;
  presetCategory?: ItemCategoryType;
  initialSubcategory?: string;
  presetSubcategory?: string;
  entityToEdit?: HecosEntity | null;
  itemToEdit?: HecosEntity | null;
  onClose: () => void;
  onSaveItem?: (newEntity: HecosEntity) => void;
  onSave?: (newEntity: HecosEntity) => void;
}

const COMMON_ITEM_TRAITS = [
  'Mágico',
  'Alquímico',
  'Consumível',
  'Investido',
  'Ágil',
  'Acuidade',
  'Versátil P',
  'Versátil C',
  'Letal d8',
  'Letal d10',
  'Desarmar',
  'Derrubar',
  'Empurrar',
  'Alcance',
  'Recarga 0',
  'Recarga 1',
  'Confortável',
  'Flexível',
  'Vidro Estelar',
  'Obsidiana',
  'Adamante',
  'Prata',
  'Frio-Ferro',
  'Poção',
  'Elixir',
  'Talismã',
  'Pergaminho',
  'Varinha',
  'Cajado',
  'Rúnico',
  'Armadura Leve',
  'Armadura Média',
  'Armadura Pesada',
  'Escudo',
];

const WEAPON_DAMAGE_TYPES = [
  'Cortante',
  'Perfurante',
  'Impacto',
  'Fogo',
  'Frio',
  'Eletricidade',
  'Ácido',
  'Sônico',
  'Força',
  'Mental',
  'Necrótico / Vazio',
  'Radiante / Sagrado',
];

const WEAPON_GROUPS = [
  'Espada',
  'Machado',
  'Adaga',
  'Arco',
  'Besta',
  'Lança',
  'Haste',
  'Maça',
  'Mangual',
  'Martelo',
  'Faca',
  'Arma de Fogo',
  'Desarmado',
  'Escudo (Golpe)',
  'Outro',
];

const ITEM_CATEGORY_OPTIONS: {
  id: ItemCategoryType;
  name: string;
  englishName: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}[] = [
  {
    id: 'weapons',
    name: 'Armas',
    englishName: 'Weapons',
    icon: Sword,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'armor',
    name: 'Armaduras & Escudos',
    englishName: 'Armor & Shields',
    icon: Shield,
    color: 'text-cyan-400',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'consumables',
    name: 'Consumíveis & Poções',
    englishName: 'Consumables',
    icon: FlaskConical,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
  },
  {
    id: 'alchemical',
    name: 'Itens Alquímicos',
    englishName: 'Alchemical',
    icon: Sparkles,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-600/40',
  },
  {
    id: 'magical',
    name: 'Varinhas & Itens Mágicos',
    englishName: 'Magical & Wands',
    icon: Wand2,
    color: 'text-purple-400',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
  {
    id: 'artifacts',
    name: 'Artefatos & Relíquias',
    englishName: 'Artifacts',
    icon: Gem,
    color: 'text-amber-300',
    badgeBg: 'bg-amber-950/50',
    badgeBorder: 'border-amber-500/50',
  },
  {
    id: 'gear',
    name: 'Equipamento Geral',
    englishName: 'Adventuring Gear',
    icon: Backpack,
    color: 'text-zinc-300',
    badgeBg: 'bg-zinc-900/60',
    badgeBorder: 'border-zinc-700/50',
  },
  {
    id: 'extras',
    name: 'Outros & Materiais',
    englishName: 'Other Items',
    icon: Layers,
    color: 'text-rose-300',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
];

export const ItemCreateModal: React.FC<ItemCreateModalProps> = ({
  isOpen,
  initialCategory,
  presetCategory,
  initialSubcategory,
  presetSubcategory,
  entityToEdit,
  itemToEdit,
  onClose,
  onSaveItem,
  onSave,
}) => {
  const targetEditEntity = entityToEdit || itemToEdit;
  const isEditing = Boolean(targetEditEntity);

  const effectiveCategory = presetCategory || initialCategory;
  const effectiveSubcategory = presetSubcategory || initialSubcategory;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'combat' | 'activation' | 'lore' | 'preview'>('details');

  // Item attributes state
  const [itemData, setItemData] = useState<PF2eItemAttributes>(() => {
    const empty = getEmptyItemData();
    if (effectiveCategory && effectiveCategory !== 'all') {
      empty.itemType = effectiveCategory;
    }
    if (effectiveSubcategory) {
      empty.subcategories = [effectiveSubcategory];
    }
    return empty;
  });

  // Selected subcategories / folders
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    effectiveSubcategory ? [effectiveSubcategory] : []
  );
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Visibility state
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);

  // Traits management
  const [traitInput, setTraitInput] = useState('');

  // Reset or Populate fields on Open / entityToEdit change
  React.useEffect(() => {
    if (!isOpen) return;

    if (targetEditEntity) {
      const parsedData = parseItemFromContent(
        targetEditEntity.content || '',
        targetEditEntity.itemData
      );
      setTitle(targetEditEntity.title || '');
      setSummary(targetEditEntity.summary || '');
      setItemData(parsedData);
      setSelectedSubcategories(
        targetEditEntity.subcategories && targetEditEntity.subcategories.length > 0
          ? targetEditEntity.subcategories
          : parsedData.subcategories || []
      );
      const perm = HecosStorage.getEntityPermission(targetEditEntity.id);
      setVisibility((perm.visibility as ItemVisibility) || targetEditEntity.visibility || 'all');
      setAllowedUserIds(perm.allowedUserIds || targetEditEntity.allowedUserIds || []);
    } else {
      const empty = getEmptyItemData();
      if (effectiveCategory && effectiveCategory !== 'all') {
        empty.itemType = effectiveCategory;
      }
      if (effectiveSubcategory) {
        empty.subcategories = [effectiveSubcategory];
      }
      setTitle('');
      setSummary('');
      setItemData(empty);
      setSelectedSubcategories(effectiveSubcategory ? [effectiveSubcategory] : []);
      setVisibility('all');
      setAllowedUserIds([]);
    }
  }, [isOpen, targetEditEntity, effectiveCategory, effectiveSubcategory]);

  // Available item folders from storage with real-time subscription
  const [itemConfig, setItemConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllItemSubcategoriesConfig()
  );
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);

  useEffect(() => {
    const unsub = HecosStorage.subscribeItemCategories((newCfg) => {
      setItemConfig(newCfg);
    });
    return () => unsub();
  }, []);

  const allExistingFolders = useMemo(() => {
    const set = new Set<string>();
    (Object.values(itemConfig) as string[][]).forEach((list) => {
      (list || []).forEach((sub) => set.add(sub));
    });
    return Array.from(set).sort();
  }, [itemConfig]);

  if (!isOpen) return null;

  const handleAddTrait = (traitToAdd: string) => {
    const clean = traitToAdd.trim();
    if (!clean) return;
    if (!itemData.traits.includes(clean)) {
      setItemData({
        ...itemData,
        traits: [...itemData.traits, clean],
      });
    }
    setTraitInput('');
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    setItemData({
      ...itemData,
      traits: itemData.traits.filter((t) => t !== traitToRemove),
    });
  };

  const handleAddSubcategory = () => {
    const clean = newSubcategoryInput.trim();
    if (!clean) return;
    if (!selectedSubcategories.includes(clean)) {
      setSelectedSubcategories([...selectedSubcategories, clean]);
    }
    // Also save to global category subcategories in storage
    const cat = itemData.itemType || 'gear';
    HecosStorage.addItemSubcategory(cat, clean);
    setNewSubcategoryInput('');
  };

  const handleRemoveSubcategory = (subcatToRemove: string) => {
    setSelectedSubcategories(selectedSubcategories.filter((s) => s !== subcatToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome do item.');
      return;
    }

    const finalItemData: PF2eItemAttributes = {
      ...itemData,
      subcategories: selectedSubcategories,
    };

    const htmlContent = serializeItemToHTML(title, finalItemData);

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let savedEntity: HecosEntity;

    if (targetEditEntity) {
      savedEntity = {
        ...targetEditEntity,
        title: title.trim(),
        slug: targetEditEntity.slug || slug || `item-${Date.now()}`,
        category: 'item',
        subcategory: (selectedSubcategories && selectedSubcategories[0]) || 'Geral',
        subcategories: selectedSubcategories || [],
        tags: [...finalItemData.traits, finalItemData.rarity || 'Comum', `Nível ${finalItemData.level}`],
        summary: summary.trim() || `${finalItemData.rarity || 'Comum'} Item ${finalItemData.level}`,
        content: htmlContent,
        itemData: finalItemData,
        visibility,
        allowedUserIds: visibility === 'custom' ? allowedUserIds : undefined,
        updatedAt: new Date().toISOString(),
      };
    } else {
      savedEntity = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        slug: slug || `item-${Date.now()}`,
        title: title.trim(),
        category: 'item',
        subcategory: (selectedSubcategories && selectedSubcategories[0]) || 'Geral',
        subcategories: selectedSubcategories,
        tags: [...finalItemData.traits, finalItemData.rarity || 'Comum', `Nível ${finalItemData.level}`],
        summary: summary.trim() || `${finalItemData.rarity || 'Comum'} Item ${finalItemData.level}`,
        content: htmlContent,
        itemData: finalItemData,
        visibility,
        allowedUserIds: visibility === 'custom' ? allowedUserIds : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    HecosStorage.saveEntity(savedEntity);
    HecosStorage.setEntityPermission(savedEntity.id, visibility, allowedUserIds);

    if (onSave) {
      onSave(savedEntity);
    } else if (onSaveItem) {
      onSaveItem(savedEntity);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in">
      <div className="bg-[#0b0816] border border-zinc-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#0e0a1b] border-b border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                <span>{isEditing ? `Editar Item: ${targetEditEntity?.title}` : 'Criar Novo Item & Equipamento PF2e'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono uppercase">
                  Arsenal de Hecos
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditing
                  ? 'Modifique estatísticas de combate, bônus de armadura, custos de ativação e lore deste item.'
                  : 'Configure estatísticas de combate, bônus de armadura, custos de ativação, fórmulas de manufatura e segredos.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VisibilityBadgeMenu
              visibility={visibility}
              allowedUserIds={allowedUserIds}
              isGmMode={true}
              onVisibilityChange={(newVis, newAllowed) => {
                setVisibility(newVis);
                setAllowedUserIds(newAllowed);
              }}
            />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 pt-2.5 bg-[#0e0a1b] border-b border-zinc-800/80 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-amber-400 text-amber-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>1. Dados Gerais</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('combat')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'combat'
                ? 'border-amber-400 text-amber-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sword className="w-3.5 h-3.5" />
            <span>2. Combate & Defesa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activation')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'activation'
                ? 'border-amber-400 text-amber-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>3. Ativação & Runas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lore')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lore'
                ? 'border-amber-400 text-amber-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>4. Manufatura & Lore</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-amber-400 text-amber-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>5. Prévia (PF2e Statblock)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-5">
          {/* TAB 1: DADOS GERAIS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Row 1: Name and Level */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    Nome do Item <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Lâmina de Vidro Estelar, Elixir de Vida Menor, Manto da Penumbra..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400 shadow-inner font-semibold"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Nível do Item (Level)</label>
                  <select
                    value={itemData.level}
                    onChange={(e) =>
                      setItemData({ ...itemData, level: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 outline-none focus:border-amber-400 font-bold"
                  >
                    {[...Array(26)].map((_, idx) => (
                      <option key={idx} value={idx}>
                        Item Nível {idx} {idx === 0 ? '(Básico / Truque)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">
                  Categoria Principal do Item:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ITEM_CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = itemData.itemType === cat.id;
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setItemData({ ...itemData, itemType: cat.id })}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{cat.name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate">
                            {cat.englishName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Price, Bulk, Usage, Hands, Rarity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preço (Price)</span>
                  </label>
                  <input
                    type="text"
                    value={itemData.price || ''}
                    onChange={(e) => setItemData({ ...itemData, price: e.target.value })}
                    placeholder="Ex: 15 po, 250 po, 5 pp..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5 text-amber-400" />
                    <span>Volume (Bulk)</span>
                  </label>
                  <select
                    value={itemData.bulk || 'L'}
                    onChange={(e) => setItemData({ ...itemData, bulk: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400"
                  >
                    <option value="—">— (Sem volume)</option>
                    <option value="Negligível">Negligível</option>
                    <option value="L">L (Leve / Light)</option>
                    <option value="1">1 Volume</option>
                    <option value="2">2 Volumes</option>
                    <option value="3">3 Volumes</option>
                    <option value="4">4 Volumes</option>
                    <option value="5+">5+ Volumes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Mãos (Hands)</label>
                  <select
                    value={itemData.hands || '1 mão'}
                    onChange={(e) => setItemData({ ...itemData, hands: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400"
                  >
                    <option value="1 mão">1 mão</option>
                    <option value="2 mãos">2 mãos</option>
                    <option value="1+ mãos">1+ mãos (Versátil)</option>
                    <option value="Livre">Mãos Livres</option>
                    <option value="—">— (Não aplicável)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Uso (Usage)</label>
                  <input
                    type="text"
                    value={itemData.usage || ''}
                    onChange={(e) => setItemData({ ...itemData, usage: e.target.value })}
                    placeholder="Ex: empunhado, vestido, aplicado..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Raridade PF2e</label>
                  <select
                    value={itemData.rarity || 'Comum'}
                    onChange={(e) =>
                      setItemData({ ...itemData, rarity: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400 font-bold"
                  >
                    <option value="Comum">Comum</option>
                    <option value="Incomum">Incomum</option>
                    <option value="Raro">Raro</option>
                    <option value="Único">Único</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Traits Management */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Descritores & Traços do Item (Traits):</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {(itemData.traits || []).length} selecionados
                  </span>
                </label>

                <TraitInputCombobox
                  selectedTraits={itemData.traits || []}
                  onChange={(newTraits) => setItemData({ ...itemData, traits: newTraits })}
                  placeholder="Buscar traço de item ou criar novo (ex: Mágico, Investido, Ágil, Vidro Estelar)..."
                  defaultCategory="Itens e Equipamento"
                  quickSuggestions={COMMON_ITEM_TRAITS}
                />
              </div>

              {/* Row 5: Subcategories / Folders */}
              <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/90 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pastas do Item (Organização):</span>
                    {selectedSubcategories.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {selectedSubcategories.length}
                      </span>
                    )}
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsFolderManagerOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-700/80 hover:border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    title="Abrir gerenciador avançado de pastas e subcategorias de itens"
                  >
                    <Settings2 className="w-3 h-3 text-amber-400" />
                    <span>Gerenciar Pastas</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap min-h-[28px]">
                  {selectedSubcategories.length === 0 ? (
                    <span className="text-[11px] text-zinc-500 italic">
                      Nenhuma pasta atribuída. Selecione ou crie uma pasta abaixo.
                    </span>
                  ) : (
                    selectedSubcategories.map((subcat) => (
                      <span
                        key={subcat}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-700/50 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Folder className="w-3 h-3 text-amber-400" />
                        <span>{subcat}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcategory(subcat)}
                          className="hover:text-rose-400 text-amber-400/70 cursor-pointer"
                          title={`Remover pasta ${subcat}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !selectedSubcategories.includes(e.target.value)) {
                        setSelectedSubcategories([...selectedSubcategories, e.target.value]);
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="" disabled>
                      + Selecionar Pasta Existente...
                    </option>
                    {Object.entries(itemConfig).map(([catKey, subList]) => {
                      const list = (subList as string[]) || [];
                      const unselectedInCat = list.filter((s) => !selectedSubcategories.includes(s));
                      if (unselectedInCat.length === 0) return null;
                      const catName =
                        catKey === 'weapons'
                          ? 'Armas'
                          : catKey === 'armor'
                          ? 'Armaduras & Escudos'
                          : catKey === 'consumables'
                          ? 'Consumíveis'
                          : catKey === 'alchemical'
                          ? 'Alquimia & Venenos'
                          : catKey === 'magical'
                          ? 'Itens Mágicos'
                          : catKey === 'artifacts'
                          ? 'Artefatos & Relíquias'
                          : catKey === 'gear'
                          ? 'Equipamento de Aventura'
                          : catKey === 'extras'
                          ? 'Especiais & Homebrew'
                          : 'Gerais';
                      return (
                        <optgroup key={catKey} label={catName}>
                          {unselectedInCat.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>

                  <div className="flex-1 flex items-center gap-1.5 w-full">
                    <input
                      type="text"
                      value={newSubcategoryInput}
                      onChange={(e) => setNewSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcategory();
                        }
                      }}
                      placeholder="Ou digitar nova pasta (Enter para adicionar)..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                    />

                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      disabled={!newSubcategoryInput.trim()}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMBATE & DEFESA */}
          {activeTab === 'combat' && (
            <div className="space-y-4">
              {/* Weapons Combat Block */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sword className="w-4 h-4 text-amber-400" />
                  <span>Estatísticas de Arma / Ataque (Weapons)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Dano (Damage Dice)</label>
                    <input
                      type="text"
                      value={itemData.damage || ''}
                      onChange={(e) => setItemData({ ...itemData, damage: e.target.value })}
                      placeholder="Ex: 1d6, 1d8, 1d12, 2d6..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Tipo de Dano</label>
                    <select
                      value={itemData.damageType || ''}
                      onChange={(e) => setItemData({ ...itemData, damageType: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400"
                    >
                      <option value="">Nenhum / Especial</option>
                      {WEAPON_DAMAGE_TYPES.map((dt) => (
                        <option key={dt} value={dt}>
                          {dt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Grupo de Arma</label>
                    <select
                      value={itemData.weaponGroup || ''}
                      onChange={(e) => setItemData({ ...itemData, weaponGroup: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400"
                    >
                      <option value="">Nenhum / Especial</option>
                      {WEAPON_GROUPS.map((wg) => (
                        <option key={wg} value={wg}>
                          {wg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Alcance / Recarga</label>
                    <input
                      type="text"
                      value={itemData.weaponRange || itemData.reload || ''}
                      onChange={(e) => setItemData({ ...itemData, weaponRange: e.target.value })}
                      placeholder="Ex: Alcance 9m, Recarga 0..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Armor & Shield Defense Block */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Estatísticas de Armadura & Escudo (Armor & Defense)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Bônus na CA</label>
                    <input
                      type="number"
                      value={itemData.armorBonus !== undefined ? itemData.armorBonus : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          armorBonus: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: 2, 4, 6..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Limite Destreza (Dex Cap)</label>
                    <input
                      type="number"
                      value={itemData.dexCap !== undefined ? itemData.dexCap : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          dexCap: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: +1, +3..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Penalidade Teste</label>
                    <input
                      type="number"
                      value={itemData.checkPenalty !== undefined ? itemData.checkPenalty : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          checkPenalty: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: -1, -2..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Penalidade Velocidade</label>
                    <input
                      type="text"
                      value={itemData.speedPenalty || ''}
                      onChange={(e) => setItemData({ ...itemData, speedPenalty: e.target.value })}
                      placeholder="Ex: -1.5m, -3m..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Força Requerida</label>
                    <input
                      type="number"
                      value={itemData.strengthReq !== undefined ? itemData.strengthReq : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          strengthReq: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: 14, 16, 18..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Durability & Material Hardness */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Dureza, PV e Limiar de Quebra (Crafting / Durability)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Dureza (Hardness)</label>
                    <input
                      type="number"
                      value={itemData.hardness !== undefined ? itemData.hardness : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          hardness: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: 5, 8, 12..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Pontos de Vida (HP)</label>
                    <input
                      type="number"
                      value={itemData.hp !== undefined ? itemData.hp : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          hp: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: 20, 48, 64..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Limiar de Quebra (BT / LD)</label>
                    <input
                      type="number"
                      value={itemData.brokenThreshold !== undefined ? itemData.brokenThreshold : ''}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          brokenThreshold: e.target.value ? parseInt(e.target.value, 10) : undefined,
                        })
                      }
                      placeholder="Ex: 10, 24, 32..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATIVAÇÃO & RUNAS */}
          {activeTab === 'activation' && (
            <div className="space-y-4">
              {/* Activation Action Glyphs */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Custo de Ação para Ativação do Item:</span>
                  </h4>
                  <span className="text-[11px] font-mono text-purple-300">
                    {itemData.activationAction ? `Selecionado: ${itemData.activationAction}` : 'Sem ativação'}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: '1 ação', glyph: '1-action', label: '1 Ação' },
                    { id: '2 ações', glyph: '2-actions', label: '2 Ações' },
                    { id: '3 ações', glyph: '3-actions', label: '3 Ações' },
                    { id: 'Reação', glyph: 'reaction', label: 'Reação' },
                    { id: 'Ação Livre', glyph: 'free-action', label: 'Ação Livre' },
                    { id: 'Passiva', glyph: 'passive', label: 'Passiva' },
                  ].map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() =>
                        setItemData({
                          ...itemData,
                          activationAction: itemData.activationAction === act.id ? undefined : act.id,
                        })
                      }
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                        itemData.activationAction === act.id
                          ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <PF2eActionGlyph action={act.glyph as ActionGlyphType} size="sm" />
                      <span className="text-[10px] font-bold mt-0.5 truncate">{act.label}</span>
                    </button>
                  ))}
                </div>

                {/* Activation Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Nome / Tipo da Ativação</label>
                    <input
                      type="text"
                      value={itemData.activation || ''}
                      onChange={(e) => setItemData({ ...itemData, activation: e.target.value })}
                      placeholder="Ex: Interagir, Comando rúnico, Concentração..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Frequência</label>
                    <input
                      type="text"
                      value={itemData.activationFrequency || ''}
                      onChange={(e) => setItemData({ ...itemData, activationFrequency: e.target.value })}
                      placeholder="Ex: 1 vez por dia, 1 vez por hora, À vontade..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Gatilho (Trigger)</label>
                    <input
                      type="text"
                      value={itemData.activationTrigger || ''}
                      onChange={(e) => setItemData({ ...itemData, activationTrigger: e.target.value })}
                      placeholder="Ex: Você acerta um golpe crítico com a arma..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-zinc-300">Efeito Completo da Ativação</label>
                  <textarea
                    rows={3}
                    value={itemData.activationEffect || ''}
                    onChange={(e) => setItemData({ ...itemData, activationEffect: e.target.value })}
                    placeholder="Descreva o que acontece quando o item é ativado (dano, cura, ilusão, condições)..."
                    className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-400 leading-relaxed"
                  />
                </div>
              </div>

              {/* Special Properties & Runes */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Propriedades Especiais & Runas Gravadas:</span>
                </label>
                <textarea
                  rows={3}
                  value={itemData.specialProperties || ''}
                  onChange={(e) =>
                    setItemData({ ...itemData, specialProperties: e.target.value })
                  }
                  placeholder="Ex: Runa Fundamental: +1 Ataque e Dano. Runa de Propriedade: Flamejante (+1d6 dano de fogo e dano persistente no crítico)."
                  className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 4: MANUFATURA & LORE */}
          {activeTab === 'lore' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Resumo Rápido</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Breve resumo de 1 linha para listagens e cartões..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">
                  Descrição Completa do Item <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  value={itemData.description || ''}
                  onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
                  placeholder="Descreva a aparência física, peso na mão, efeitos sensoriais e regras detalhadas..."
                  className="w-full p-3 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Crafting Requirements */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Hammer className="w-4 h-4 text-cyan-400" />
                  <span>Requisitos de Manufatura & Fórmula de Criação (Crafting)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Fórmula de Manufatura</label>
                    <input
                      type="text"
                      value={itemData.craftFormula || ''}
                      onChange={(e) => setItemData({ ...itemData, craftFormula: e.target.value })}
                      placeholder="Ex: Livro de Fórmulas do Lago de Vidro, Pergaminho Rúnico..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-300">Requisitos Especiais & Ingredientes</label>
                    <input
                      type="text"
                      value={itemData.craftRequirements || ''}
                      onChange={(e) =>
                        setItemData({ ...itemData, craftRequirements: e.target.value })
                      }
                      placeholder="Ex: Artesão Especialista, 48 po em pó de meteoro de Hecos..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Hecos Lore & GM Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>História / Lore de Hecos</span>
                  </label>
                  <textarea
                    rows={3}
                    value={itemData.hecosLore || ''}
                    onChange={(e) => setItemData({ ...itemData, hecosLore: e.target.value })}
                    placeholder="Contexto no cenário, forjas lendárias e mestres artífices de Hecos..."
                    className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-rose-400 leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Notas do Mestre (Segredo do GM)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={itemData.gmNotes || ''}
                    onChange={(e) => setItemData({ ...itemData, gmNotes: e.target.value })}
                    placeholder="Informações confidenciais que apenas o mestre poderá ler..."
                    className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PREVIEW (PF2E STATBLOCK) */}
          {activeTab === 'preview' && (
            <div className="p-5 rounded-2xl bg-[#090710] border border-amber-500/40 space-y-4 shadow-2xl">
              {/* Header */}
              <div className="border-b-2 border-zinc-800 pb-3.5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-amber-300 flex items-center gap-2">
                    <span>{title || '[Nome do Item]'}</span>
                  </h3>
                  <div className="text-xs text-purple-300 font-mono mt-0.5">
                    Item {itemData.level || 0} ({itemData.itemType || 'Equipamento'})
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <TraitBadge trait={itemData.rarity || 'Comum'} />
                  {(itemData.traits || []).map((tr) => (
                    <span
                      key={tr}
                      className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800"
                    >
                      {tr}
                    </span>
                  ))}
                </div>
              </div>

              {/* Item Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-zinc-300 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                {itemData.price && (
                  <div>
                    <strong className="text-amber-400">Preço:</strong> {itemData.price}
                  </div>
                )}
                {(itemData.usage || itemData.hands) && (
                  <div>
                    <strong className="text-amber-400">Uso / Mãos:</strong> {itemData.usage || itemData.hands} {itemData.hands && itemData.usage ? `(${itemData.hands})` : ''}
                  </div>
                )}
                {itemData.bulk && (
                  <div>
                    <strong className="text-amber-400">Volume:</strong> {itemData.bulk}
                  </div>
                )}
                {itemData.activationAction && (
                  <div className="flex items-center gap-1">
                    <strong className="text-amber-400">Ativação:</strong>
                    <PF2eActionGlyph action={itemData.activationAction} size="sm" />
                    <span>{itemData.activation || ''}</span>
                  </div>
                )}
              </div>

              {/* Combat Weapons Stats */}
              {(itemData.damage || itemData.weaponGroup || itemData.weaponRange) && (
                <div className="p-3 rounded-xl bg-amber-950/20 border-l-4 border-amber-500 text-xs text-amber-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {itemData.damage && (
                    <div>
                      <strong>Dano:</strong> {itemData.damage} {itemData.damageType ? `(${itemData.damageType})` : ''}
                    </div>
                  )}
                  {itemData.weaponGroup && (
                    <div>
                      <strong>Grupo:</strong> {itemData.weaponGroup}
                    </div>
                  )}
                  {itemData.weaponRange && (
                    <div>
                      <strong>Alcance:</strong> {itemData.weaponRange}
                    </div>
                  )}
                  {itemData.reload && (
                    <div>
                      <strong>Recarga:</strong> {itemData.reload}
                    </div>
                  )}
                </div>
              )}

              {/* Armor Stats */}
              {(itemData.armorBonus !== undefined || itemData.dexCap !== undefined || itemData.checkPenalty !== undefined) && (
                <div className="p-3 rounded-xl bg-cyan-950/20 border-l-4 border-cyan-500 text-xs text-cyan-200 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {itemData.armorBonus !== undefined && (
                    <div>
                      <strong>Bônus CA:</strong> +{itemData.armorBonus}
                    </div>
                  )}
                  {itemData.dexCap !== undefined && (
                    <div>
                      <strong>Limite Des:</strong> +{itemData.dexCap}
                    </div>
                  )}
                  {itemData.checkPenalty !== undefined && (
                    <div>
                      <strong>Penalidade:</strong> {itemData.checkPenalty}
                    </div>
                  )}
                  {itemData.speedPenalty && (
                    <div>
                      <strong>Velocidade:</strong> {itemData.speedPenalty}
                    </div>
                  )}
                  {itemData.strengthReq !== undefined && (
                    <div>
                      <strong>Força:</strong> {itemData.strengthReq}
                    </div>
                  )}
                </div>
              )}

              {/* Durability */}
              {(itemData.hardness !== undefined || itemData.hp !== undefined) && (
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-4 flex-wrap">
                  {itemData.hardness !== undefined && (
                    <div>
                      <strong className="text-zinc-400">Dureza:</strong> {itemData.hardness}
                    </div>
                  )}
                  {itemData.hp !== undefined && (
                    <div>
                      <strong className="text-zinc-400">Pontos de Vida (PV):</strong> {itemData.hp}
                    </div>
                  )}
                  {itemData.brokenThreshold !== undefined && (
                    <div>
                      <strong className="text-zinc-400">Limiar de Quebra:</strong> {itemData.brokenThreshold}
                    </div>
                  )}
                </div>
              )}

              {/* Activation Breakdown */}
              {(itemData.activation || itemData.activationEffect) && (
                <div className="p-3.5 rounded-xl bg-purple-950/20 border-l-4 border-purple-500 text-xs text-purple-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ativação {itemData.activationAction ? `[${itemData.activationAction}]` : ''} {itemData.activation ? `— ${itemData.activation}` : ''}</span>
                  </div>
                  {itemData.activationFrequency && (
                    <div><strong>Frequência:</strong> {itemData.activationFrequency}</div>
                  )}
                  {itemData.activationTrigger && (
                    <div><strong>Gatilho:</strong> {itemData.activationTrigger}</div>
                  )}
                  {itemData.activationEffect && (
                    <div className="mt-1 leading-relaxed whitespace-pre-line text-zinc-200">
                      <strong>Efeito:</strong> {itemData.activationEffect}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="text-xs leading-relaxed text-zinc-200 border-t border-zinc-800 pt-3 whitespace-pre-line">
                {itemData.description || (
                  <span className="text-zinc-600 italic">Nenhuma descrição informada ainda.</span>
                )}
              </div>

              {/* Special Properties */}
              {itemData.specialProperties && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 space-y-1">
                  <strong className="text-amber-300">Propriedades & Runas:</strong>
                  <div className="whitespace-pre-line">{itemData.specialProperties}</div>
                </div>
              )}

              {/* Crafting */}
              {(itemData.craftRequirements || itemData.craftFormula) && (
                <div className="text-xs pt-2 border-t border-zinc-800/60 text-zinc-400 space-y-1">
                  {itemData.craftFormula && (
                    <div><strong className="text-cyan-300">Fórmula:</strong> {itemData.craftFormula}</div>
                  )}
                  {itemData.craftRequirements && (
                    <div><strong className="text-cyan-300">Requisitos de Manufatura:</strong> {itemData.craftRequirements}</div>
                  )}
                </div>
              )}

              {/* Hecos Lore */}
              {itemData.hecosLore && (
                <div className="text-xs p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-200">
                  <strong className="text-rose-300">História em Hecos:</strong> {itemData.hecosLore}
                </div>
              )}

              {/* GM Notes */}
              {itemData.gmNotes && (
                <div className="text-xs p-3 rounded-xl bg-purple-950/30 border border-purple-800/50 text-purple-200">
                  <strong className="text-purple-300">🔒 Segredo do Mestre:</strong> {itemData.gmNotes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#090710] border-t border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {activeTab !== 'preview' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: ('details' | 'combat' | 'activation' | 'lore' | 'preview')[] = [
                    'details',
                    'combat',
                    'activation',
                    'lore',
                    'preview',
                  ];
                  const currentIdx = tabs.indexOf(activeTab);
                  if (currentIdx < tabs.length - 1) {
                    setActiveTab(tabs[currentIdx + 1]);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              >
                Próximo Passo →
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-zinc-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar Item no Arsenal</span>
            </button>
          </div>
        </div>
        {/* Subcategories / Folders Manager Modal */}
        {isFolderManagerOpen && (
          <FolderManagerModal
            isOpen={isFolderManagerOpen}
            onClose={() => setIsFolderManagerOpen(false)}
            scope="item"
            initialCategoryId={itemData.itemType || 'gear'}
            themeColor="amber"
            onRefresh={() => {
              setItemConfig(HecosStorage.getAllItemSubcategoriesConfig());
            }}
          />
        )}
      </div>
    </div>
  );
};
