import React, { useState, useEffect } from 'react';
import {
  HecosEntity,
  PerilAttributes,
  PerilKind,
  PerilAttack,
  PerilAction,
  PerilFieldVisibility,
  ItemVisibility,
  HecosUser
} from '../types';
import { HecosStorage } from '../services/storage';
import { ImageUploadInput } from './ImageUploadInput';
import { TraitInputCombobox } from './TraitInputCombobox';
import { FolderManagerModal } from './FolderManagerModal';
import {
  canonicalizeSizeName,
  canonicalizeRarityName,
  CANONICAL_SIZES,
  CANONICAL_RARITIES
} from '../utils/traitUtils';
import {
  Skull,
  AlertTriangle,
  Flame,
  Ghost,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Swords,
  Zap,
  Sparkles,
  Plus,
  Trash2,
  Lock,
  Users,
  Check,
  X,
  Clock,
  Compass,
  FileText,
  BookOpen,
  Key,
  Folder,
  FolderPlus,
  FolderTree,
  AlertCircle
} from 'lucide-react';

interface PerilCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
  initialEntity?: HecosEntity | null;
  entityToEdit?: HecosEntity | null;
}

export type PerilTabId =
  | 'basics'
  | 'stats'
  | 'defenses'
  | 'structure'
  | 'attacks'
  | 'reaction'
  | 'routine'
  | 'effects'
  | 'countermeasures'
  | 'manifestation'
  | 'exorcism'
  | 'disable'
  | 'lore'
  | 'visibility';

interface CategoryDefinition {
  id: PerilKind;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  ringColor: string;
  description: string;
}

const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'monster',
    label: 'Monstro',
    shortDesc: 'Criatura',
    icon: Skull,
    iconColor: 'text-rose-400',
    activeBg: 'bg-rose-950/80',
    activeBorder: 'border-rose-600',
    activeText: 'text-rose-200',
    ringColor: 'ring-rose-500/50',
    description: 'Criaturas com estatísticas completas, ataques corpo a corpo e à distância'
  },
  {
    id: 'hazard_simple',
    label: 'P. Simples',
    shortDesc: 'Armadilha',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    activeBg: 'bg-amber-950/80',
    activeBorder: 'border-amber-600',
    activeText: 'text-amber-200',
    ringColor: 'ring-amber-500/50',
    description: 'Armadilhas e perigos de reação única, desarmáveis via Ladinagem ou perícias'
  },
  {
    id: 'hazard_complex',
    label: 'P. Complexo',
    shortDesc: 'Iniciativa',
    icon: Zap,
    iconColor: 'text-orange-400',
    activeBg: 'bg-orange-950/80',
    activeBorder: 'border-orange-600',
    activeText: 'text-orange-200',
    ringColor: 'ring-orange-500/50',
    description: 'Perigos persistentes com iniciativa e rotina de combate por rodada'
  },
  {
    id: 'environmental',
    label: 'Ambiental',
    shortDesc: 'Clima / Área',
    icon: Flame,
    iconColor: 'text-emerald-400',
    activeBg: 'bg-emerald-950/80',
    activeBorder: 'border-emerald-600',
    activeText: 'text-emerald-200',
    ringColor: 'ring-emerald-500/50',
    description: 'Climas extremos, abismos, avalanches e terrenos com salvamentos periódicos'
  },
  {
    id: 'haunt',
    label: 'Assombração',
    shortDesc: 'Espiritual',
    icon: Ghost,
    iconColor: 'text-purple-400',
    activeBg: 'bg-purple-950/80',
    activeBorder: 'border-purple-600',
    activeText: 'text-purple-200',
    ringColor: 'ring-purple-500/50',
    description: 'Ecos espirituais com salvamento de Vontade, manifestação e rituais de exorcismo'
  }
];

interface HorizontalTabItem {
  id: PerilTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  countBadge?: number;
}

export const PerilCreateModal: React.FC<PerilCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntity,
  entityToEdit
}) => {
  if (!isOpen) return null;

  const targetEntity = initialEntity || entityToEdit;
  const users = HecosStorage.getUsers();
  const initPeril = targetEntity?.perilData;

  // Basic Details
  const [name, setName] = useState(targetEntity?.title || '');
  const [subtitle, setSubtitle] = useState(targetEntity?.subtitle || '');
  const [perilKind, setPerilKind] = useState<PerilKind>(
    initPeril?.perilKind || (targetEntity?.category === 'creature' ? 'monster' : 'monster')
  );
  const [level, setLevel] = useState<number>(initPeril?.level ?? targetEntity?.statblock?.level ?? 1);
  const [rarity, setRarity] = useState<'Comum' | 'Incomum' | 'Raro' | 'Único'>(
    initPeril?.rarity || targetEntity?.statblock?.rarity || 'Comum'
  );
  const [size, setSize] = useState<'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'>(
    initPeril?.size || targetEntity?.statblock?.size || 'Medium'
  );
  const [traitsInput, setTraitsInput] = useState(
    (initPeril?.traits || targetEntity?.statblock?.traits || []).join(', ')
  );
  const [stealthCheck, setStealthCheck] = useState(initPeril?.stealthCheck || '');
  const [portraitImage, setPortraitImage] = useState(
    targetEntity?.coverImage || initPeril?.portraitImage || ''
  );
  const [tokenImage, setTokenImage] = useState(
    targetEntity?.icon || initPeril?.tokenImage || ''
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    targetEntity?.subcategories ||
      initPeril?.subcategories ||
      (targetEntity?.subcategory ? [targetEntity.subcategory] : [])
  );
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const availableSubcategories = React.useMemo(() => {
    const config = HecosStorage.getScopeSubcategoriesConfig('peril');
    const set = new Set<string>();
    Object.values(config).forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((sub) => {
          if (sub && sub.trim()) set.add(sub.trim());
        });
      }
    });
    return Array.from(set);
  }, [isFolderManagerOpen]);
  const [summary, setSummary] = useState(targetEntity?.summary || '');
  const [description, setDescription] = useState(initPeril?.description || '');
  const [hecosLore, setHecosLore] = useState(initPeril?.hecosLore || '');
  const [gmNotes, setGmNotes] = useState(initPeril?.gmNotes || '');

  // Perception & Attributes (Monsters)
  const [perception, setPerception] = useState<string>(
    initPeril?.perception !== undefined ? String(initPeril.perception) : '6'
  );
  const [senses, setSenses] = useState(
    initPeril?.senses || targetEntity?.statblock?.senses || 'Visão na Penumbra'
  );
  const [languages, setLanguages] = useState(
    (initPeril?.languages || ['Comum']).join(', ')
  );
  const [skills, setSkills] = useState(
    initPeril?.skills
      ? Object.entries(initPeril.skills)
          .map(([k, v]) => `${k} +${v}`)
          .join(', ')
      : 'Atletismo +7, Furtividade +5'
  );
  const [abilities, setAbilities] = useState(
    initPeril?.attributes || {
      str: 3,
      dex: 2,
      con: 2,
      int: -1,
      wis: 1,
      cha: 0
    }
  );

  // Defenses & HP
  const [ac, setAc] = useState<string>(
    initPeril?.ac !== undefined
      ? String(initPeril.ac)
      : targetEntity?.statblock?.ac !== undefined
      ? String(targetEntity.statblock.ac)
      : '16'
  );
  const [fort, setFort] = useState<string>(
    initPeril?.fort !== undefined
      ? String(initPeril.fort)
      : targetEntity?.statblock?.fort !== undefined
      ? String(targetEntity.statblock.fort)
      : '7'
  );
  const [refSave, setRefSave] = useState<string>(
    initPeril?.ref !== undefined
      ? String(initPeril.ref)
      : targetEntity?.statblock?.ref !== undefined
      ? String(targetEntity.statblock.ref)
      : '5'
  );
  const [will, setWill] = useState<string>(
    initPeril?.will !== undefined
      ? String(initPeril.will)
      : targetEntity?.statblock?.will !== undefined
      ? String(targetEntity.statblock.will)
      : '4'
  );
  const [hp, setHp] = useState<string>(
    initPeril?.hp !== undefined
      ? String(initPeril.hp)
      : targetEntity?.statblock?.hp !== undefined
      ? String(targetEntity.statblock.hp)
      : '20'
  );
  const [hardness, setHardness] = useState<string>(
    initPeril?.hardness !== undefined ? String(initPeril.hardness) : ''
  );
  const [brokenThreshold, setBrokenThreshold] = useState<string>(
    initPeril?.brokenThreshold !== undefined ? String(initPeril.brokenThreshold) : ''
  );
  const [immunitiesInput, setImmunitiesInput] = useState(
    (initPeril?.immunities || []).join(', ')
  );
  const [weaknessesInput, setWeaknessesInput] = useState(
    (initPeril?.weaknesses || []).join(', ')
  );
  const [resistancesInput, setResistancesInput] = useState(
    (initPeril?.resistances || []).join(', ')
  );

  // Speed & Offense
  const [speed, setSpeed] = useState(
    initPeril?.speed || targetEntity?.statblock?.speed || '25 pés (7,5m)'
  );
  const [attacks, setAttacks] = useState<PerilAttack[]>(
    initPeril?.attacks || [
      {
        id: 'atk-1',
        name: 'Golpe de Garras',
        type: 'melee',
        bonus: 7,
        traits: ['Ágil', 'Desarmado'],
        damage: '1d6+3 cortante',
        extraEffects: ''
      }
    ]
  );
  const [actions, setActions] = useState<PerilAction[]>(
    initPeril?.actions || [
      {
        id: 'act-1',
        name: 'Investida Selvagem',
        cost: '2',
        traits: ['Movimento'],
        trigger: '',
        effect: 'O perigo avança até o dobro do seu deslocamento e desfere um Golpe Corpo a Corpo.'
      }
    ]
  );

  // Hazard Specifics
  const [disable, setDisable] = useState(initPeril?.disable || '');
  const [resetCondition, setResetCondition] = useState(initPeril?.reset || '');
  const [routine, setRoutine] = useState(initPeril?.routine || '');

  // Spells
  const [tradition, setTradition] = useState(initPeril?.spells?.tradition || 'Arcana');
  const [spellDc, setSpellDc] = useState(initPeril?.spells?.dc ? String(initPeril.spells.dc) : '17');
  const [spellAttack, setSpellAttack] = useState(
    initPeril?.spells?.attack ? String(initPeril.spells.attack) : '7'
  );
  const [spellsList, setSpellsList] = useState(initPeril?.spells?.spellsList || '');

  // Granular Field Visibility ("Olhinho")
  const [fieldVis, setFieldVis] = useState<PerilFieldVisibility>(
    initPeril?.fieldVisibility || {
      name: 'all',
      level: 'all',
      typeAndTraits: 'all',
      description: 'all',
      sensesAndPerception: 'gm',
      acAndDefenses: 'gm',
      hpAndHealth: 'gm',
      hardnessAndBT: 'gm',
      weaknessesAndResistances: 'gm',
      immunities: 'gm',
      attacksAndDamage: 'gm',
      actionsAndAbilities: 'gm',
      disableAndReset: 'gm',
      routine: 'gm',
      spells: 'gm',
      gmNotes: 'gm',
      allowedUsers: {}
    }
  );

  // Overall Article Visibility
  const [articleVisibility, setArticleVisibility] = useState<ItemVisibility>(
    targetEntity?.visibility || 'all'
  );
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>(
    targetEntity?.allowedUserIds || []
  );

  // Active Horizontal Tab
  const [activeTab, setActiveTab] = useState<PerilTabId>('basics');

  // Reactively hydrate form state when targetEntity changes
  useEffect(() => {
    if (!isOpen) return;

    const peril = targetEntity?.perilData;
    setName(targetEntity?.title || '');
    setSubtitle(targetEntity?.subtitle || '');
    setPerilKind(peril?.perilKind || (targetEntity?.category === 'creature' ? 'monster' : 'monster'));
    setLevel(peril?.level ?? targetEntity?.statblock?.level ?? 1);
    setRarity(canonicalizeRarityName(peril?.rarity || targetEntity?.statblock?.rarity || 'Comum'));
    setSize(canonicalizeSizeName(peril?.size || targetEntity?.statblock?.size || 'Médio'));
    setTraitsInput((peril?.traits || targetEntity?.statblock?.traits || []).join(', '));
    setStealthCheck(peril?.stealthCheck || '');
    setPortraitImage(targetEntity?.coverImage || peril?.portraitImage || '');
    setTokenImage(targetEntity?.icon || peril?.tokenImage || '');
    setSelectedSubcategories(
      targetEntity?.subcategories ||
        peril?.subcategories ||
        (targetEntity?.subcategory ? [targetEntity.subcategory] : [])
    );
    setSummary(targetEntity?.summary || '');
    setDescription(peril?.description || '');
    setHecosLore(peril?.hecosLore || '');
    setGmNotes(peril?.gmNotes || '');

    setPerception(peril?.perception !== undefined ? String(peril.perception) : '6');
    setSenses(peril?.senses || targetEntity?.statblock?.senses || 'Visão na Penumbra');
    setLanguages((peril?.languages || ['Comum']).join(', '));
    setSkills(
      peril?.skills
        ? Object.entries(peril.skills)
            .map(([k, v]) => `${k} +${v}`)
            .join(', ')
        : 'Atletismo +7, Furtividade +5'
    );
    setAbilities(
      peril?.attributes || {
        str: 3,
        dex: 2,
        con: 2,
        int: -1,
        wis: 1,
        cha: 0
      }
    );

    setAc(
      peril?.ac !== undefined
        ? String(peril.ac)
        : targetEntity?.statblock?.ac !== undefined
        ? String(targetEntity.statblock.ac)
        : '16'
    );
    setFort(
      peril?.fort !== undefined
        ? String(peril.fort)
        : targetEntity?.statblock?.fort !== undefined
        ? String(targetEntity.statblock.fort)
        : '7'
    );
    setRefSave(
      peril?.ref !== undefined
        ? String(peril.ref)
        : targetEntity?.statblock?.ref !== undefined
        ? String(targetEntity.statblock.ref)
        : '5'
    );
    setWill(
      peril?.will !== undefined
        ? String(peril.will)
        : targetEntity?.statblock?.will !== undefined
        ? String(targetEntity.statblock.will)
        : '4'
    );
    setHp(
      peril?.hp !== undefined
        ? String(peril.hp)
        : targetEntity?.statblock?.hp !== undefined
        ? String(targetEntity.statblock.hp)
        : '20'
    );
    setHardness(peril?.hardness !== undefined ? String(peril.hardness) : '');
    setBrokenThreshold(peril?.brokenThreshold !== undefined ? String(peril.brokenThreshold) : '');
    setImmunitiesInput((peril?.immunities || []).join(', '));
    setWeaknessesInput((peril?.weaknesses || []).join(', '));
    setResistancesInput((peril?.resistances || []).join(', '));

    setSpeed(peril?.speed || targetEntity?.statblock?.speed || '25 pés (7,5m)');
    setAttacks(
      peril?.attacks || [
        {
          id: 'atk-1',
          name: 'Golpe de Garras',
          type: 'melee',
          bonus: 7,
          traits: ['Ágil', 'Desarmado'],
          damage: '1d6+3 cortante',
          extraEffects: ''
        }
      ]
    );
    setActions(
      peril?.actions || [
        {
          id: 'act-1',
          name: 'Investida Selvagem',
          cost: '2',
          traits: ['Movimento'],
          trigger: '',
          effect: 'O perigo avança até o dobro do seu deslocamento e desfere um Golpe Corpo a Corpo.'
        }
      ]
    );

    setDisable(peril?.disable || '');
    setResetCondition(peril?.reset || '');
    setRoutine(peril?.routine || '');

    setTradition(peril?.spells?.tradition || 'Arcana');
    setSpellDc(peril?.spells?.dc ? String(peril.spells.dc) : '17');
    setSpellAttack(peril?.spells?.attack ? String(peril.spells.attack) : '7');
    setSpellsList(peril?.spells?.spellsList || '');

    setFieldVis(
      peril?.fieldVisibility || {
        name: 'all',
        level: 'all',
        typeAndTraits: 'all',
        description: 'all',
        sensesAndPerception: 'gm',
        acAndDefenses: 'gm',
        hpAndHealth: 'gm',
        hardnessAndBT: 'gm',
        weaknessesAndResistances: 'gm',
        immunities: 'gm',
        attacksAndDamage: 'gm',
        actionsAndAbilities: 'gm',
        disableAndReset: 'gm',
        routine: 'gm',
        spells: 'gm',
        gmNotes: 'gm',
        allowedUsers: {}
      }
    );

    setArticleVisibility(targetEntity?.visibility || 'all');
    setAllowedUserIds(targetEntity?.allowedUserIds || []);
    setActiveTab('basics');
  }, [isOpen, targetEntity]);

  // Compute allowed tabs based on selected perilKind
  const getTabsForKind = (kind: PerilKind): HorizontalTabItem[] => {
    switch (kind) {
      case 'monster':
        return [
          { id: 'basics', label: 'Dados Básicos', icon: Skull },
          { id: 'stats', label: 'Defesas & Atributos', icon: Shield },
          { id: 'attacks', label: 'Golpes & Ações', icon: Swords, countBadge: attacks.length + actions.length },
          { id: 'lore', label: 'Lore & Segredos', icon: BookOpen },
          { id: 'visibility', label: 'Revelação', icon: Eye }
        ];
      case 'hazard_simple':
        return [
          { id: 'basics', label: 'Dados Básicos', icon: AlertTriangle },
          { id: 'structure', label: 'Dureza & Estrutura', icon: Shield },
          { id: 'reaction', label: 'Gatilho & Reação', icon: Zap, countBadge: actions.length + attacks.length },
          { id: 'disable', label: 'Desativação & Reset', icon: Key },
          { id: 'lore', label: 'Descrição & Lore', icon: BookOpen },
          { id: 'visibility', label: 'Revelação', icon: Eye }
        ];
      case 'hazard_complex':
        return [
          { id: 'basics', label: 'Dados Básicos', icon: Zap },
          { id: 'structure', label: 'Dureza & Estrutura', icon: Shield },
          { id: 'routine', label: 'Iniciativa & Rotina', icon: Clock, countBadge: actions.length + attacks.length },
          { id: 'disable', label: 'Desativação & Reset', icon: Key },
          { id: 'lore', label: 'Descrição & Lore', icon: BookOpen },
          { id: 'visibility', label: 'Revelação', icon: Eye }
        ];
      case 'environmental':
        return [
          { id: 'basics', label: 'Dados Básicos', icon: Flame },
          { id: 'effects', label: 'Efeitos & Salvamentos', icon: AlertCircle },
          { id: 'countermeasures', label: 'Superação & Abrigo', icon: Compass },
          { id: 'lore', label: 'Geografia & Lore', icon: BookOpen },
          { id: 'visibility', label: 'Revelação', icon: Eye }
        ];
      case 'haunt':
        return [
          { id: 'basics', label: 'Dados Básicos', icon: Ghost },
          { id: 'defenses', label: 'Defesas Espirituais', icon: Shield },
          { id: 'manifestation', label: 'Manifestação & Efeito', icon: Sparkles, countBadge: actions.length },
          { id: 'exorcism', label: 'Exorcismo & Descanso', icon: Key },
          { id: 'lore', label: 'História Trágica & Lore', icon: BookOpen },
          { id: 'visibility', label: 'Revelação', icon: Eye }
        ];
      default:
        return [
          { id: 'basics', label: 'Dados Básicos', icon: AlertTriangle },
          { id: 'stats', label: 'Defesas & Atributos', icon: Shield },
          { id: 'lore', label: 'Descrição', icon: BookOpen },
          { id: 'visibility', label: 'Revelação', icon: Eye }
        ];
    }
  };

  const horizontalTabs = getTabsForKind(perilKind);

  // When switching vertical category, adjust horizontal tab if activeTab is not allowed
  const handleSelectPerilKind = (newKind: PerilKind) => {
    setPerilKind(newKind);
    const allowed = getTabsForKind(newKind);
    if (!allowed.some((t) => t.id === activeTab)) {
      setActiveTab(allowed[0].id);
    }
  };

  // Toggle helper for a specific field's visibility
  const cycleFieldVisibility = (field: keyof PerilFieldVisibility) => {
    if (field === 'allowedUsers') return;
    setFieldVis((prev) => {
      const current = prev[field] || 'gm';
      const next: ItemVisibility = current === 'gm' ? 'all' : current === 'all' ? 'custom' : 'gm';
      return {
        ...prev,
        [field]: next
      };
    });
  };

  const setFieldUsers = (field: string, userId: string) => {
    setFieldVis((prev) => {
      const currentAllowed = prev.allowedUsers?.[field] || [];
      const exists = currentAllowed.includes(userId);
      const updated = exists ? currentAllowed.filter((u) => u !== userId) : [...currentAllowed, userId];
      return {
        ...prev,
        allowedUsers: {
          ...(prev.allowedUsers || {}),
          [field]: updated
        }
      };
    });
  };

  const handleAddAttack = (type: 'melee' | 'ranged') => {
    setAttacks([
      ...attacks,
      {
        id: `atk-${Date.now()}`,
        name: type === 'melee' ? 'Novo Golpe Corpo a Corpo' : 'Novo Golpe à Distância',
        type,
        bonus: 5,
        traits: [],
        damage: '1d6+2 físico',
        range: type === 'ranged' ? '18m' : undefined,
        extraEffects: ''
      }
    ]);
  };

  const handleRemoveAttack = (id: string) => {
    setAttacks(attacks.filter((a) => a.id !== id));
  };

  const handleAddAction = (defaultName = 'Nova Habilidade / Reação', defaultCost: any = '1') => {
    setActions([
      ...actions,
      {
        id: `act-${Date.now()}`,
        name: defaultName,
        cost: defaultCost,
        traits: [],
        trigger: '',
        effect: 'Descreva os efeitos mecânicos da ação...'
      }
    ]);
  };

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome do Perigo.');
      return;
    }

    const cleanTraits = traitsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanImmunities = immunitiesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanWeaknesses = weaknessesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanResistances = resistancesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const perilData: PerilAttributes = {
      perilKind,
      level,
      rarity,
      size,
      traits: cleanTraits,
      subcategories: selectedSubcategories,
      portraitImage: portraitImage.trim() || undefined,
      tokenImage: tokenImage.trim() || undefined,
      stealthCheck: stealthCheck.trim() || undefined,
      perception: perception ? parseInt(perception, 10) : undefined,
      senses: senses.trim() || undefined,
      languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
      skills: skills
        ? skills.split(',').reduce((acc, curr) => {
            const parts = curr.split('+');
            if (parts && parts.length === 2 && parts[0] && parts[1]) {
              acc[parts[0].trim()] = parseInt(parts[1].trim(), 10) || 0;
            } else if (curr) {
              acc[curr.trim()] = 0;
            }
            return acc;
          }, {} as Record<string, number>)
        : undefined,
      attributes: perilKind === 'monster' ? abilities : undefined,
      ac: ac ? parseInt(ac, 10) : undefined,
      fort: fort ? parseInt(fort, 10) : undefined,
      ref: refSave ? parseInt(refSave, 10) : undefined,
      will: will ? parseInt(will, 10) : undefined,
      hp: hp ? parseInt(hp, 10) : undefined,
      maxHp: hp ? parseInt(hp, 10) : undefined,
      hardness: hardness ? parseInt(hardness, 10) : undefined,
      brokenThreshold: brokenThreshold ? parseInt(brokenThreshold, 10) : undefined,
      immunities: cleanImmunities.length > 0 ? cleanImmunities : undefined,
      weaknesses: cleanWeaknesses.length > 0 ? cleanWeaknesses : undefined,
      resistances: cleanResistances.length > 0 ? cleanResistances : undefined,
      speed: perilKind === 'monster' ? (speed.trim() || undefined) : undefined,
      attacks: attacks.length > 0 ? attacks : undefined,
      actions: actions.length > 0 ? actions : undefined,
      spells:
        spellsList.trim() && perilKind === 'monster'
          ? {
              tradition,
              dc: spellDc ? parseInt(spellDc, 10) : 10,
              attack: spellAttack ? parseInt(spellAttack, 10) : 0,
              spellsList
            }
          : undefined,
      disable: disable.trim() || undefined,
      reset: resetCondition.trim() || undefined,
      routine: routine.trim() || undefined,
      description: description.trim() || undefined,
      hecosLore: hecosLore.trim() || undefined,
      gmNotes: gmNotes.trim() || undefined,
      fieldVisibility: fieldVis
    };

    // Construct Markdown article content
    const kindLabel =
      perilKind === 'monster'
        ? 'Monstro'
        : perilKind === 'hazard_simple'
        ? 'Perigo Simples'
        : perilKind === 'hazard_complex'
        ? 'Perigo Complexo'
        : perilKind === 'environmental'
        ? 'Perigo Ambiental'
        : 'Assombração';

    const contentMarkdown = `# ${name.trim()} • Nível ${level}
> ${subtitle.trim() || `${kindLabel} de nível ${level} no mundo de Hecos.`}

---

${description.trim() || summary.trim() || 'Sem descrição cadastrada.'}

${hecosLore.trim() ? `\n### Lore & Ocorrência em Hecos\n${hecosLore.trim()}\n` : ''}
${gmNotes.trim() ? `\n:::gm\n**Notas Secretas do Mestre:**\n${gmNotes.trim()}\n:::\n` : ''}
`;

    // Construct entity
    const entityId = targetEntity?.id || `peril-${Date.now()}`;
    const newEntity: HecosEntity = {
      id: entityId,
      slug: targetEntity?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: name.trim(),
      subtitle: subtitle.trim() || `Nível ${level} • ${kindLabel}`,
      category: 'peril',
      subcategory: selectedSubcategories[0] || (perilKind === 'monster' ? 'Monstros' : 'Perigos'),
      subcategories: selectedSubcategories,
      tags: [
        'Perigo',
        kindLabel,
        `Nível ${level}`,
        ...cleanTraits
      ],
      summary: summary.trim() || description.slice(0, 140) || `Perigo de nível ${level}.`,
      content: contentMarkdown,
      coverImage: portraitImage.trim() || undefined,
      icon: tokenImage.trim() || (perilKind === 'monster' ? 'Skull' : 'AlertTriangle'),
      createdAt: targetEntity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: articleVisibility === 'gm',
      visibility: articleVisibility,
      allowedUserIds: articleVisibility === 'custom' ? allowedUserIds : [],
      perilData,
      statblock: {
        level,
        traits: cleanTraits,
        ac: ac ? parseInt(ac, 10) : undefined,
        hp: hp ? parseInt(hp, 10) : undefined,
        fort: fort ? parseInt(fort, 10) : undefined,
        ref: refSave ? parseInt(refSave, 10) : undefined,
        will: will ? parseInt(will, 10) : undefined,
        speed: perilKind === 'monster' ? speed : undefined,
        senses: perilKind === 'monster' ? senses : undefined
      }
    };

    HecosStorage.saveEntity(newEntity);
    onSave(newEntity);
    onClose();
  };

  // Helper render for Field Eye / Olhinho
  const renderFieldEye = (fieldKey: keyof PerilFieldVisibility, label: string) => {
    const vis = fieldVis[fieldKey] || 'gm';
    const isGmOnly = vis === 'gm';
    const isAll = vis === 'all';
    const isCustom = vis === 'custom';

    return (
      <div className="inline-flex items-center gap-1.5 ml-2">
        <button
          type="button"
          onClick={() => cycleFieldVisibility(fieldKey)}
          title={`Visibilidade de "${label}": ${
            isGmOnly ? '🔒 Oculto (Apenas GM)' : isAll ? '👁️ Revelado a Todos' : '👥 Usuários Específicos'
          }`}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all border cursor-pointer ${
            isGmOnly
              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 hover:bg-rose-900'
              : isAll
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900'
              : 'bg-amber-950/80 text-amber-300 border-amber-800/80 hover:bg-amber-900'
          }`}
        >
          {isGmOnly && <EyeOff className="w-3 h-3 text-rose-400" />}
          {isAll && <Eye className="w-3 h-3 text-emerald-400" />}
          {isCustom && <Users className="w-3 h-3 text-amber-400" />}
          <span>{isGmOnly ? 'Oculto' : isAll ? 'Público' : 'Restrito'}</span>
        </button>
      </div>
    );
  };

  const selectedCategoryDef = CATEGORIES.find((c) => c.id === perilKind) || CATEGORIES[0];
  const CategoryIcon = selectedCategoryDef.icon;

  return (
    <div
      id="peril-create-modal-backdrop"
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="peril-create-modal-container"
        className="relative w-full max-w-6xl w-[95vw] h-[92vh] max-h-[95vh] bg-[#0c0915] border border-rose-900/50 rounded-3xl shadow-2xl flex overflow-hidden text-zinc-200"
      >
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* LEFT VERTICAL DOCK: CATEGORIES SIDEBAR */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <div className="w-20 sm:w-24 md:w-28 shrink-0 bg-[#07050f] border-r border-zinc-800/90 flex flex-col items-center py-4 px-1.5 sm:px-2 space-y-2.5 select-none overflow-y-auto z-10 scrollbar-none">
          <div className="text-[9px] uppercase font-mono font-bold tracking-wider text-zinc-500 mb-0.5 text-center">
            Categoria
          </div>

          {CATEGORIES.map((cat) => {
            const isSelected = perilKind === cat.id;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectPerilKind(cat.id)}
                className={`w-full p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative ${
                  isSelected
                    ? `${cat.activeBg} ${cat.activeBorder} ${cat.activeText} border shadow-lg ring-1 ${cat.ringColor}`
                    : 'bg-[#110d1f]/70 hover:bg-[#181329] border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
                title={`${cat.label}: ${cat.description}`}
              >
                <IconComponent
                  className={`w-5 h-5 mb-1 transition-transform group-hover:scale-110 ${
                    isSelected ? cat.iconColor : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                <span className="text-[11px] font-bold leading-tight">{cat.label}</span>
                <span className="text-[8px] opacity-70 mt-0.5 hidden sm:block leading-tight line-clamp-1">
                  {cat.shortDesc}
                </span>
                {isSelected && (
                  <div className="absolute -left-1.5 sm:-left-2 top-1/2 -translate-y-1/2 w-1 sm:w-1.5 h-6 bg-rose-500 rounded-r-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* RIGHT MAIN CONTENT AREA */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#0c0915]">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#110c1e]/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl border ${selectedCategoryDef.activeBg} ${selectedCategoryDef.activeBorder}`}>
                <CategoryIcon className={`w-5 h-5 ${selectedCategoryDef.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                    {targetEntity ? 'Editar Perigo' : 'Criar Novo Perigo'}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedCategoryDef.activeBg} ${selectedCategoryDef.activeBorder} ${selectedCategoryDef.activeText}`}>
                    {selectedCategoryDef.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                  {selectedCategoryDef.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Horizontal Tabs (Adapt to Selected Category) */}
          <div className="flex border-b border-zinc-800/80 px-4 sm:px-6 bg-[#0e0a19] overflow-x-auto text-xs shrink-0 scrollbar-none">
            {horizontalTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-3.5 sm:px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'border-rose-500 text-rose-300 bg-rose-950/25'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                  {tab.countBadge !== undefined && tab.countBadge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] font-mono text-zinc-300">
                      {tab.countBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Body: Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: BASICS (For all categories, with adapted hints & stealth) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'basics' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Name & Subtitle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Nome do Perigo / Criatura *
                      </label>
                      {renderFieldEye('name', 'Nome')}
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        perilKind === 'monster'
                          ? 'Ex: Devorador de Almas, Troll da Floresta'
                          : perilKind === 'hazard_simple'
                          ? 'Ex: Armadilha de Fosso Venenoso, Lâmina de Foice Oculta'
                          : perilKind === 'hazard_complex'
                          ? 'Ex: Relógio Rúnico da Perdição, Câmara de Espinhos Rotativa'
                          : perilKind === 'environmental'
                          ? 'Ex: Nevasca Ártica Eclipsada, Avalanche de Cinzas'
                          : 'Ex: Aparição da Donzela Afogada, Eco do Carniceiro'
                      }
                      className="w-full px-3 py-2 text-sm bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Nível (Level)
                      </label>
                      {renderFieldEye('level', 'Nível')}
                    </div>
                    <input
                      type="number"
                      value={level}
                      onChange={(e) => setLevel(parseInt(e.target.value, 10) || 0)}
                      min={-1}
                      max={25}
                      className="w-full px-3 py-2 text-sm bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Subtitle & Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Subtítulo Curto
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ex: Predador solitário dos pântanos sombrios de Hecos"
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Resumo Tático (Para Cards)
                    </label>
                    <input
                      type="text"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Ex: Dispara espinhos tóxicos ao ser pisado e reinicia manualmente."
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Rarity, Size & Traits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Raridade
                    </label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                    >
                      {CANONICAL_RARITIES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Tamanho
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                    >
                      {CANONICAL_SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Traços & Tipos PF2e
                    </label>
                    <TraitInputCombobox
                      value={traitsInput}
                      onChange={setTraitsInput}
                      placeholder="Ex: Fera, Mecânico, Armadilha, Mágico..."
                    />
                  </div>
                </div>

                {/* Stealth / Perception to Spot Check (Especially for Hazards and Haunts) */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-300">
                      {perilKind === 'monster'
                        ? 'CD de Furtividade / Notar Criatura (Opcional se emboscador)'
                        : perilKind === 'environmental'
                        ? 'Sinais do Clima / CD de Percepção para Prever a Ameaça'
                        : perilKind === 'haunt'
                        ? 'Sinais Sobrenaturais / Percepção para Notar o Espírito'
                        : 'Furtividade / CD de Percepção para Notar a Armadilha'}
                    </label>
                    {renderFieldEye('sensesAndPerception', 'Percepção/Notar')}
                  </div>
                  <input
                    type="text"
                    value={stealthCheck}
                    onChange={(e) => setStealthCheck(e.target.value)}
                    placeholder={
                      perilKind === 'monster'
                        ? 'Ex: Furtividade +12 ou Percepção CD 22 para notar emboscada'
                        : perilKind === 'environmental'
                        ? 'Ex: Sobrevivência ou Percepção CD 20 para notar a mudança drástica de vento'
                        : perilKind === 'haunt'
                        ? 'Ex: Furtividade +18 ou Percepção CD 25 para sentir a queda de temperatura súbita'
                        : 'Ex: Furtividade +15 (treinado) ou Percepção CD 23 para notar a laje solta'
                    }
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Este valor aparecerá no topo do card e na ficha do perigo para testes de detecção dos heróis.
                  </p>
                </div>

                {/* Folders & Subcategories */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-semibold text-zinc-200">
                        Pastas & Subcategorias Organizacionais
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFolderManagerOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Gerenciar Pastas
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {availableSubcategories.map((sub) => {
                      const isSelected = selectedSubcategories.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSubcategories(selectedSubcategories.filter((s) => s !== sub));
                            } else {
                              setSelectedSubcategories([...selectedSubcategories, sub]);
                            }
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-900/60 border border-rose-500 text-rose-200'
                              : 'bg-black/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dual Visuals: Vertical Portrait & 1:1 Token */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Retrato Vertical (Portrait do Perigo)
                    </label>
                    <ImageUploadInput
                      value={portraitImage}
                      onChange={setPortraitImage}
                      placeholder="URL da ilustração vertical ou envie arquivo..."
                      label="Retrato"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Token Tático de Combate (1:1 Circular / Quadrado)
                    </label>
                    <ImageUploadInput
                      value={tokenImage}
                      onChange={setTokenImage}
                      placeholder="URL do token de mapa ou envie arquivo..."
                      label="Token"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: STATS (For Monsters: Perception, Modifiers, Defenses, HP) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'stats' && perilKind === 'monster' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Senses & Perception */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      Percepção & Sentidos da Criatura
                    </h3>
                    {renderFieldEye('sensesAndPerception', 'Sentidos')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Bônus de Percepção</label>
                      <input
                        type="number"
                        value={perception}
                        onChange={(e) => setPerception(e.target.value)}
                        placeholder="+6"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-zinc-400 mb-1">Sentidos Especiais</label>
                      <input
                        type="text"
                        value={senses}
                        onChange={(e) => setSenses(e.target.value)}
                        placeholder="Visão no Escuro, Faro Impreciso 9m, Visão de Tremores..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Idiomas</label>
                      <input
                        type="text"
                        value={languages}
                        onChange={(e) => setLanguages(e.target.value)}
                        placeholder="Comum, Dracônico, Silvestre..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Perícias (Bônus)</label>
                      <input
                        type="text"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        placeholder="Atletismo +8, Furtividade +6, Sobrevivência +7..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Ability Modifiers */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Modificadores de Atributo (FOR, DES, CON, INT, SAB, CAR)
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { key: 'str', label: 'FOR' },
                      { key: 'dex', label: 'DES' },
                      { key: 'con', label: 'CON' },
                      { key: 'int', label: 'INT' },
                      { key: 'wis', label: 'SAB' },
                      { key: 'cha', label: 'CAR' }
                    ].map((attr) => (
                      <div key={attr.key} className="bg-black/50 p-2 rounded-xl border border-zinc-800/60 text-center">
                        <label className="block text-[10px] font-mono font-bold text-zinc-400 mb-1">
                          {attr.label}
                        </label>
                        <input
                          type="number"
                          value={(abilities as any)[attr.key]}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setAbilities({ ...abilities, [attr.key]: val });
                          }}
                          className="w-full text-center text-sm font-mono font-bold bg-transparent text-rose-300 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defenses: AC, Saves, HP */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Defesas & Saúde
                    </h3>
                    <div className="flex items-center gap-1">
                      {renderFieldEye('acAndDefenses', 'Defesas')}
                      {renderFieldEye('hpAndHealth', 'PV')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Classe de Armadura (CA)</label>
                      <input
                        type="number"
                        value={ac}
                        onChange={(e) => setAc(e.target.value)}
                        placeholder="16"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Fortitude</label>
                      <input
                        type="number"
                        value={fort}
                        onChange={(e) => setFort(e.target.value)}
                        placeholder="+7"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Reflexos</label>
                      <input
                        type="number"
                        value={refSave}
                        onChange={(e) => setRefSave(e.target.value)}
                        placeholder="+5"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Vontade</label>
                      <input
                        type="number"
                        value={will}
                        onChange={(e) => setWill(e.target.value)}
                        placeholder="+4"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-mono text-rose-400 font-bold mb-1">Pontos de Vida (PV)</label>
                      <input
                        type="number"
                        value={hp}
                        onChange={(e) => setHp(e.target.value)}
                        placeholder="25"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-rose-900/80 rounded-xl text-rose-200 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Immunities, Weaknesses, Resistances */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Imunidades</label>
                      <input
                        type="text"
                        value={immunitiesInput}
                        onChange={(e) => setImmunitiesInput(e.target.value)}
                        placeholder="Veneno, Doenças, Sono..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Fraquezas</label>
                      <input
                        type="text"
                        value={weaknessesInput}
                        onChange={(e) => setWeaknessesInput(e.target.value)}
                        placeholder="Fogo 5, Prata 3..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Resistências</label>
                      <input
                        type="text"
                        value={resistancesInput}
                        onChange={(e) => setResistancesInput(e.target.value)}
                        placeholder="Cortante 5, Frio 5..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: STRUCTURE & HARDNESS (For Simple and Complex Hazards) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'structure' && (perilKind === 'hazard_simple' || perilKind === 'hazard_complex') && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Dureza, Limiar de Quebra & Estrutura Física
                    </h3>
                    <div className="flex items-center gap-1">
                      {renderFieldEye('hardnessAndBT', 'Dureza')}
                      {renderFieldEye('hpAndHealth', 'PV')}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400">
                    Armadilhas e mecanismos geralmente possuem Dureza alta e são imunes a acertos críticos, dano de precisão e efeitos mentais.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Dureza (Hardness)</label>
                      <input
                        type="number"
                        value={hardness}
                        onChange={(e) => setHardness(e.target.value)}
                        placeholder="Ex: 8"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Limiar de Quebra (BT)</label>
                      <input
                        type="number"
                        value={brokenThreshold}
                        onChange={(e) => setBrokenThreshold(e.target.value)}
                        placeholder="Ex: 16"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Pontos de Vida (PV)</label>
                      <input
                        type="number"
                        value={hp}
                        onChange={(e) => setHp(e.target.value)}
                        placeholder="Ex: 32"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-rose-300 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">CA da Estrutura</label>
                      <input
                        type="number"
                        value={ac}
                        onChange={(e) => setAc(e.target.value)}
                        placeholder="Ex: 18"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                  </div>

                  {/* Saves of the Trap */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Salvamento de Fortitude</label>
                      <input
                        type="number"
                        value={fort}
                        onChange={(e) => setFort(e.target.value)}
                        placeholder="+11"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">Salvamento de Reflexos</label>
                      <input
                        type="number"
                        value={refSave}
                        onChange={(e) => setRefSave(e.target.value)}
                        placeholder="+3"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    {perilKind === 'hazard_complex' && (
                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 mb-1">Salvamento de Vontade (se mágico)</label>
                        <input
                          type="number"
                          value={will}
                          onChange={(e) => setWill(e.target.value)}
                          placeholder="Imune ou +8"
                          className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Immunities, Weaknesses, Resistances */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Imunidades</label>
                      <input
                        type="text"
                        value={immunitiesInput}
                        onChange={(e) => setImmunitiesInput(e.target.value)}
                        placeholder="Efeitos mentais, acertos críticos, dano de precisão..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Fraquezas</label>
                      <input
                        type="text"
                        value={weaknessesInput}
                        onChange={(e) => setWeaknessesInput(e.target.value)}
                        placeholder="Eletricidade 5, Dissipar Magia..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Resistências</label>
                      <input
                        type="text"
                        value={resistancesInput}
                        onChange={(e) => setResistancesInput(e.target.value)}
                        placeholder="Fogo 10, Físico 5..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: DEFENSES (For Haunts: Will Save, Immateriality, Spirit Anchor) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'defenses' && perilKind === 'haunt' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Ghost className="w-4 h-4 text-purple-400" />
                      Defesas Espirituais & Vontade da Alma
                    </h3>
                    <div className="flex items-center gap-1">
                      {renderFieldEye('acAndDefenses', 'Defesas')}
                      {renderFieldEye('hpAndHealth', 'PV')}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400">
                    Assombrações são entidades espectrais. Elas dependem fortemente do seu Salvamento de Vontade contra exorcismos e costumam ser vulneráveis a dano de Vitalidade (positivo) ou fogo sagrado.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-purple-300 font-bold mb-1">
                        Salvamento de Vontade *
                      </label>
                      <input
                        type="number"
                        value={will}
                        onChange={(e) => setWill(e.target.value)}
                        placeholder="+14"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-purple-800 rounded-xl text-purple-200 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                        CA Espectral / Ectoplasma
                      </label>
                      <input
                        type="number"
                        value={ac}
                        onChange={(e) => setAc(e.target.value)}
                        placeholder="Ex: 20"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                        Salvamento de Reflexos
                      </label>
                      <input
                        type="number"
                        value={refSave}
                        onChange={(e) => setRefSave(e.target.value)}
                        placeholder="+8"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                        PV da Âncora Espiritual
                      </label>
                      <input
                        type="number"
                        value={hp}
                        onChange={(e) => setHp(e.target.value)}
                        placeholder="Ex: 40"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-rose-300 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Imunidades Espirituais</label>
                      <input
                        type="text"
                        value={immunitiesInput}
                        onChange={(e) => setImmunitiesInput(e.target.value)}
                        placeholder="Dano físico não mágico, venenos, doenças, morte..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Fraquezas (Vitalidade/Sagrado)</label>
                      <input
                        type="text"
                        value={weaknessesInput}
                        onChange={(e) => setWeaknessesInput(e.target.value)}
                        placeholder="Dano de Vitalidade 10, Fogo Sagrado 5..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Resistências</label>
                      <input
                        type="text"
                        value={resistancesInput}
                        onChange={(e) => setResistancesInput(e.target.value)}
                        placeholder="Todo o dano 5 (exceto energia mágica)..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: ATTACKS & COMBAT ACTIONS (For Monsters) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'attacks' && perilKind === 'monster' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Speed */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Deslocamento (Speed)
                  </label>
                  <input
                    type="text"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="Ex: 25 pés (7,5m), voo 40 pés, escalada 20 pés..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                </div>

                {/* Strikes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Swords className="w-4 h-4 text-rose-400" />
                        Golpes & Ataques da Criatura
                      </h3>
                      {renderFieldEye('attacksAndDamage', 'Ataques')}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddAttack('melee')}
                        className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> + Corpo a Corpo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddAttack('ranged')}
                        className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> + À Distância
                      </button>
                    </div>
                  </div>

                  {attacks.map((atk, index) => (
                    <div
                      key={atk.id}
                      className="p-3.5 rounded-2xl bg-[#110d1f] border border-zinc-800/80 space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                          {atk.type === 'melee' ? '⚔️ Corpo a Corpo' : '🏹 À Distância'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttack(atk.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remover Ataque"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={atk.name}
                          onChange={(e) => {
                            const updated = [...attacks];
                            updated[index].name = e.target.value;
                            setAttacks(updated);
                          }}
                          placeholder="Nome do ataque (ex: Mordida, Garras)"
                          className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                        />

                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-500 font-mono">+</span>
                          <input
                            type="number"
                            value={atk.bonus}
                            onChange={(e) => {
                              const updated = [...attacks];
                              updated[index].bonus = parseInt(e.target.value, 10) || 0;
                              setAttacks(updated);
                            }}
                            placeholder="Bônus"
                            className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                          />
                        </div>

                        <input
                          type="text"
                          value={atk.damage}
                          onChange={(e) => {
                            const updated = [...attacks];
                            updated[index].damage = e.target.value;
                            setAttacks(updated);
                          }}
                          placeholder="Dano (ex: 2d6+4 cortante)"
                          className="px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-rose-300"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={atk.traits.join(', ')}
                          onChange={(e) => {
                            const updated = [...attacks];
                            updated[index].traits = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                            setAttacks(updated);
                          }}
                          placeholder="Traços (ex: Ágil, Desarmado, Veneno)"
                          className="px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-300"
                        />

                        <input
                          type="text"
                          value={atk.extraEffects || ''}
                          onChange={(e) => {
                            const updated = [...attacks];
                            updated[index].extraEffects = e.target.value;
                            setAttacks(updated);
                          }}
                          placeholder="Efeitos extras (ex: Agarrar, Derrubar, Veneno CD 18)"
                          className="px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Special Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Ações Especiais, Reações & Habilidades
                      </h3>
                      {renderFieldEye('actionsAndAbilities', 'Ações')}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddAction('Nova Habilidade')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Nova Habilidade
                    </button>
                  </div>

                  {actions.map((act, index) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-[#110d1f] border border-zinc-800/80 space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <select
                            value={act.cost}
                            onChange={(e) => {
                              const updated = [...actions];
                              updated[index].cost = e.target.value as any;
                              setActions(updated);
                            }}
                            className="px-2 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-amber-300 font-mono font-bold"
                          >
                            <option value="1">[1 Ação]</option>
                            <option value="2">[2 Ações]</option>
                            <option value="3">[3 Ações]</option>
                            <option value="free">[Livre]</option>
                            <option value="reaction">[Reação]</option>
                          </select>

                          <input
                            type="text"
                            value={act.name}
                            onChange={(e) => {
                              const updated = [...actions];
                              updated[index].name = e.target.value;
                              setActions(updated);
                            }}
                            placeholder="Nome da Habilidade"
                            className="px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAction(act.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {act.cost === 'reaction' && (
                        <input
                          type="text"
                          value={act.trigger || ''}
                          onChange={(e) => {
                            const updated = [...actions];
                            updated[index].trigger = e.target.value;
                            setActions(updated);
                          }}
                          placeholder="Gatilho da Reação (ex: Uma criatura entra no alcance de ameaça...)"
                          className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-amber-300/80"
                        />
                      )}

                      <textarea
                        value={act.effect}
                        onChange={(e) => {
                          const updated = [...actions];
                          updated[index].effect = e.target.value;
                          setActions(updated);
                        }}
                        rows={2}
                        placeholder="Descrição mecânica e efeito da habilidade..."
                        className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: TRIGGER & REACTION (For Simple Hazards) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'reaction' && perilKind === 'hazard_simple' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Gatilho de Ativação (Trigger)
                    </h3>
                    {renderFieldEye('actionsAndAbilities', 'Gatilho')}
                  </div>

                  <textarea
                    value={actions[0]?.trigger || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      if (!updated[0]) {
                        updated[0] = {
                          id: `act-${Date.now()}`,
                          name: 'Disparo da Armadilha',
                          cost: 'reaction',
                          traits: ['Mecânico'],
                          trigger: e.target.value,
                          effect: 'Dispara a reação da armadilha.'
                        };
                      } else {
                        updated[0].trigger = e.target.value;
                        updated[0].cost = 'reaction';
                      }
                      setActions(updated);
                    }}
                    rows={2}
                    placeholder="Ex: Uma criatura pisa na laje de pressão sem dizer a palavra de passe, ou tenta forçar a fechadura..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-amber-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Efeito da Reação Imediata
                  </h3>

                  <textarea
                    value={actions[0]?.effect || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      if (!updated[0]) {
                        updated[0] = {
                          id: `act-${Date.now()}`,
                          name: 'Disparo da Armadilha',
                          cost: 'reaction',
                          traits: ['Mecânico'],
                          trigger: '',
                          effect: e.target.value
                        };
                      } else {
                        updated[0].effect = e.target.value;
                      }
                      setActions(updated);
                    }}
                    rows={3}
                    placeholder="Ex: As lâminas ocultas despencam do teto. Todas as criaturas na área de 3x3m devem fazer um Salvamento de Reflexos CD 22..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Strikes if direct attack roll is made */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-rose-400" />
                      Golpe / Ataque Direto da Armadilha (se houver rolagem de ataque)
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleAddAttack('ranged')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Adicionar Ataque
                    </button>
                  </div>

                  {attacks.map((atk, index) => (
                    <div
                      key={atk.id}
                      className="p-3.5 rounded-2xl bg-[#110d1f] border border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={atk.name}
                          onChange={(e) => {
                            const updated = [...attacks];
                            updated[index].name = e.target.value;
                            setAttacks(updated);
                          }}
                          placeholder="Nome do ataque (ex: Dardos Envenenados)"
                          className="px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttack(atk.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-400">Bônus: +</span>
                          <input
                            type="number"
                            value={atk.bonus}
                            onChange={(e) => {
                              const updated = [...attacks];
                              updated[index].bonus = parseInt(e.target.value, 10) || 0;
                              setAttacks(updated);
                            }}
                            className="w-full px-2 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                          />
                        </div>
                        <input
                          type="text"
                          value={atk.damage}
                          onChange={(e) => {
                            const updated = [...attacks];
                            updated[index].damage = e.target.value;
                            setAttacks(updated);
                          }}
                          placeholder="Dano (ex: 2d8 perfurante + veneno)"
                          className="px-2 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-rose-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: INITIATIVE & ROUTINE (For Complex Hazards) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'routine' && perilKind === 'hazard_complex' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Rotina de Combate em Iniciativa (Turno por Rodada)
                    </h3>
                    {renderFieldEye('routine', 'Rotina')}
                  </div>

                  <textarea
                    value={routine}
                    onChange={(e) => setRoutine(e.target.value)}
                    rows={4}
                    placeholder="Ex: Rotina (3 ações): No seu turno na ordem de iniciativa, o perigo executa:&#10;• Ação 1: Dispara jatos de ácido contra as 2 criaturas mais próximas (+15 para acertar, dano 2d10 ácido).&#10;• Ação 2-3: Gira os pilares de espinhos, forçando todas as criaturas na sala a um Salvamento de Reflexos CD 22."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Gatilho da Reação Inicial (Entrada em Combate)
                  </h3>

                  <textarea
                    value={actions[0]?.trigger || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      if (!updated[0]) {
                        updated[0] = {
                          id: `act-${Date.now()}`,
                          name: 'Reação Inicial',
                          cost: 'reaction',
                          traits: ['Mágico'],
                          trigger: e.target.value,
                          effect: 'O perigo rola iniciativa e entra em combate.'
                        };
                      } else {
                        updated[0].trigger = e.target.value;
                      }
                      setActions(updated);
                    }}
                    rows={2}
                    placeholder="Ex: Reação: Quando qualquer criatura viva entra na câmara sem a chave rúnica, as portas se trancam e o perigo rola iniciativa (Furtividade +16)."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: EFFECTS & SAVES (For Environmental Perils) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'effects' && perilKind === 'environmental' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      CD de Salvamento do Perigo & Frequência
                    </h3>
                    {renderFieldEye('acAndDefenses', 'CD')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">CD de Salvamento</label>
                      <input
                        type="text"
                        value={fort ? `Fortitude CD ${fort}` : 'Fortitude CD 20'}
                        onChange={(e) => {
                          const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 20;
                          setFort(String(num));
                        }}
                        placeholder="Ex: Fortitude CD 22"
                        className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Intervalo / Frequência</label>
                      <input
                        type="text"
                        value={resetCondition}
                        onChange={(e) => setResetCondition(e.target.value)}
                        placeholder="Ex: A cada 10 minutos de exposição, ou no início de cada rodada"
                        className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    Dano & Efeitos dos Graus de Sucesso
                  </h3>

                  <textarea
                    value={actions[0]?.effect || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      if (!updated[0]) {
                        updated[0] = {
                          id: `act-${Date.now()}`,
                          name: 'Efeito Ambiental',
                          cost: 'free',
                          traits: ['Ambiental'],
                          trigger: 'Exposição contínua',
                          effect: e.target.value
                        };
                      } else {
                        updated[0].effect = e.target.value;
                      }
                      setActions(updated);
                    }}
                    rows={4}
                    placeholder="Ex:&#10;• Sucesso Crítico: O personagem não é afetado por 1 hora.&#10;• Sucesso: Sofre 2d6 de dano de frio cortante.&#10;• Falha: Sofre 4d6 de dano de frio e fica Fatigado.&#10;• Falha Crítica: Sofre 6d6 de dano de frio, fica Fatigado e Lentidão 1."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: COUNTERMEASURES (For Environmental Perils) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'countermeasures' && perilKind === 'environmental' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      Superação, Sobrevivência & Abrigo
                    </h3>
                    {renderFieldEye('disableAndReset', 'Superação')}
                  </div>

                  <textarea
                    value={disable}
                    onChange={(e) => setDisable(e.target.value)}
                    rows={4}
                    placeholder="Ex: Um teste de Sobrevivência CD 22 (especialista) permite aos aventureiros encontrar uma fenda protegida contra os ventos cortantes, concedendo bônus de +4 nos testes de salvamento pelos próximos 30 minutos..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: MANIFESTATION (For Haunts) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'manifestation' && perilKind === 'haunt' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Ghost className="w-4 h-4 text-purple-400" />
                      Gatilho da Manifestação Espectral
                    </h3>
                    {renderFieldEye('actionsAndAbilities', 'Gatilho')}
                  </div>

                  <textarea
                    value={actions[0]?.trigger || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      if (!updated[0]) {
                        updated[0] = {
                          id: `act-${Date.now()}`,
                          name: 'Aparição Espectral',
                          cost: 'reaction',
                          traits: ['Assombração', 'Oculto'],
                          trigger: e.target.value,
                          effect: 'Manifesta o efeito do espírito.'
                        };
                      } else {
                        updated[0].trigger = e.target.value;
                      }
                      setActions(updated);
                    }}
                    rows={2}
                    placeholder="Ex: Uma criatura profana a sepultura, toca a relíquia amaldiçoada ou tenta atravessar o corredor sem rezar pelos mortos..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-purple-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Efeito da Aparição & Dano Sobrenatural
                  </h3>

                  <textarea
                    value={actions[0]?.effect || ''}
                    onChange={(e) => {
                      const updated = [...actions];
                      if (!updated[0]) {
                        updated[0] = {
                          id: `act-${Date.now()}`,
                          name: 'Aparição Espectral',
                          cost: 'reaction',
                          traits: ['Assombração', 'Oculto'],
                          trigger: '',
                          effect: e.target.value
                        };
                      } else {
                        updated[0].effect = e.target.value;
                      }
                      setActions(updated);
                    }}
                    rows={3}
                    placeholder="Ex: O espectro surge gritando em agonia etérea. Todas as criaturas na sala devem realizar um Salvamento de Vontade CD 22. Em uma falha, sofrem 4d8 de dano mental e ficam Aterrorizadas 2..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: EXORCISM & PEACE (For Haunts) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'exorcism' && perilKind === 'haunt' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-purple-400" />
                      Rituais de Exorcismo & Desativação Temporária
                    </h3>
                    {renderFieldEye('disableAndReset', 'Exorcismo')}
                  </div>

                  <textarea
                    value={disable}
                    onChange={(e) => setDisable(e.target.value)}
                    rows={3}
                    placeholder="Ex: Religião CD 24 (especialista) para entoar preces de consagração e dissipar a presença do espírito por 24 horas, ou Ocultismo CD 22 para quebrar o padrão geométrico que ancora o fantasma..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Ghost className="w-4 h-4 text-cyan-400" />
                    Condição de Descanso Eterno / Paz Permanente
                  </h3>

                  <textarea
                    value={resetCondition}
                    onChange={(e) => setResetCondition(e.target.value)}
                    rows={3}
                    placeholder="Ex: Para que a assombração não retorne após 24 horas, os heróis devem resgatar os restos mortais do espírito nos escombros e sepultá-los no Templo de Pharasma com as honras devidas..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: DISABLE & RESET (For Simple and Complex Hazards) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'disable' && (perilKind === 'hazard_simple' || perilKind === 'hazard_complex') && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      Mecanismos de Desativação & Desarme (Disable)
                    </h3>
                    {renderFieldEye('disableAndReset', 'Desativação')}
                  </div>

                  <textarea
                    value={disable}
                    onChange={(e) => setDisable(e.target.value)}
                    rows={4}
                    placeholder={
                      perilKind === 'hazard_complex'
                        ? 'Ex: Desativação em 3 etapas: Ladinagem CD 24 (especialista) para desacoplar as engrenagens principais, ou Arcanismo CD 22 para neutralizar as 3 runas de energia nas paredes...'
                        : 'Ex: Ladinagem CD 20 (treinado) para travar os contrapesos da foice, ou Força bruta Atletismo CD 22 para segurar a alavanca...'
                    }
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Condição de Reset / Reinício do Mecanismo
                  </h3>

                  <input
                    type="text"
                    value={resetCondition}
                    onChange={(e) => setResetCondition(e.target.value)}
                    placeholder="Ex: Manual após 1 hora, ou Automático no início da próxima rodada se as runas não forem apagadas..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: LORE & SECRETS (For all categories) */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'lore' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      Descrição & Visual Geral
                    </label>
                    {renderFieldEye('description', 'Descrição')}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Descreva a aparência visual, atmosfera, sons e sensações que os heróis percebem ao encontrar este perigo..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                  <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Ecologia, Ocorrência & Lore no Cenário de Hecos
                  </label>
                  <textarea
                    value={hecosLore}
                    onChange={(e) => setHecosLore(e.target.value)}
                    rows={4}
                    placeholder="Onde este perigo ou criatura é comumente encontrado em Hecos? Quem o construiu ou o que provocou sua manifestação? Lendas locais e relatos de viajantes..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="bg-[#1a0f1e] p-4 rounded-2xl border border-rose-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-rose-400" />
                      <label className="text-xs font-bold text-rose-200 uppercase tracking-wider">
                        Notas Secretas do Mestre (GM Notes)
                      </label>
                    </div>
                    {renderFieldEye('gmNotes', 'Notas GM')}
                  </div>
                  <textarea
                    value={gmNotes}
                    onChange={(e) => setGmNotes(e.target.value)}
                    rows={4}
                    placeholder="Segredos de bastidores, táticas de combate do perigo, fraquezas que os jogadores podem descobrir através de testes de Lembrança (Recall Knowledge)..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-rose-900/80 rounded-xl text-rose-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────────── */}
            {/* TAB: VISIBILITY MATRIX */}
            {/* ───────────────────────────────────────────────────────────────── */}
            {activeTab === 'visibility' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-400" />
                    Visibilidade Global do Artigo
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Controla se este perigo aparece na lista e na busca para os jogadores.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {[
                      { id: 'all', label: 'Público (Todos)', desc: 'Qualquer usuário vê este perigo' },
                      { id: 'gm', label: 'Oculto (Apenas GM)', desc: 'Apenas Mestres veem' },
                      { id: 'custom', label: 'Restrito (Usuários)', desc: 'Apenas usuários selecionados' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setArticleVisibility(opt.id as ItemVisibility)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          articleVisibility === opt.id
                            ? 'bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{opt.label}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  {articleVisibility === 'custom' && (
                    <div className="pt-2 space-y-2 border-t border-zinc-800/60">
                      <span className="text-xs text-zinc-300 font-semibold">
                        Selecione os usuários permitidos:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {users.map((u) => {
                          const isSel = allowedUserIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setAllowedUserIds(
                                  isSel ? allowedUserIds.filter((id) => id !== u.id) : [...allowedUserIds, u.id]
                                );
                              }}
                              className={`px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-rose-900/60 border border-rose-500 text-rose-200'
                                  : 'bg-black/40 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              <span>{u.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Field-level visibility matrix */}
                <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Matriz de Revelação por Campo ("Olhinhos")
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Campos marcados como <strong>Oculto</strong> aparecem apenas para o GM ou como <code>???</code> para jogadores até que o Mestre os revele durante o combate.
                  </p>

                  <div className="divide-y divide-zinc-800/60 border border-zinc-800/60 rounded-xl overflow-hidden text-xs">
                    {[
                      { key: 'acAndDefenses', label: 'Classe de Armadura (CA) & Salvamentos' },
                      { key: 'hpAndHealth', label: 'Pontos de Vida (PV) & Saúde' },
                      { key: 'hardnessAndBT', label: 'Dureza & Limiar de Quebra' },
                      { key: 'sensesAndPerception', label: 'Percepção, Furtividade & Sentidos' },
                      { key: 'attacksAndDamage', label: 'Golpes, Bônus de Ataque & Dano' },
                      { key: 'actionsAndAbilities', label: 'Ações Especiais, Gatilhos & Reações' },
                      { key: 'routine', label: 'Rotina de Combate em Iniciativa' },
                      { key: 'disableAndReset', label: 'Mecanismos de Desativação & Exorcismo' },
                      { key: 'weaknessesAndResistances', label: 'Fraquezas & Resistências' },
                      { key: 'immunities', label: 'Imunidades da Criatura/Perigo' },
                      { key: 'gmNotes', label: 'Notas Secretas do Mestre' }
                    ].map((row) => (
                      <div key={row.key} className="p-2.5 flex items-center justify-between bg-black/40 hover:bg-black/60">
                        <span className="text-zinc-300 font-medium">{row.label}</span>
                        {renderFieldEye(row.key as keyof PerilFieldVisibility, row.label)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-[#0e0a19] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {targetEntity ? 'Salvar Alterações' : 'Criar Perigo'}
            </button>
          </div>
        </div>
      </div>

      {/* Folder Manager Modal */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          onClose={() => setIsFolderManagerOpen(false)}
          scope="peril"
        />
      )}
    </div>
  );
};
