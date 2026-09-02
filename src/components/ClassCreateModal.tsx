import React, { useState, useMemo } from 'react';
import { HecosStorage } from '../services/storage';
import {
  HecosEntity,
  ClassAttributes,
  ClassProficiencyRank,
  ClassFeature,
  ClassSubclass,
  ClassArchetypeFeat,
  VocationProgressionLevel,
  ItemVisibility,
  PF2eFeatAttributes
} from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import { FeatPickerModal } from './FeatPickerModal';
import { ClassFeatListItem } from './ClassFeatListItem';
import {
  Swords,
  Layers,
  Shield,
  Heart,
  Brain,
  Sparkles,
  Award,
  Plus,
  Trash2,
  Check,
  X,
  BookOpen,
  FileText,
  Sliders,
  ChevronRight,
  Zap,
  Users,
  Compass,
  GraduationCap,
  Clock,
  Sparkle,
  Flame,
  CheckCircle2,
  Search,
  Link as LinkIcon
} from 'lucide-react';

interface ClassCreateModalProps {
  isOpen: boolean;
  initialKind?: 'class' | 'archetype' | 'vocation';
  editingEntity?: HecosEntity | null;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
}

const DEFAULT_VOCATION_LEVELS: VocationProgressionLevel[] = [
  {
    level: 1,
    title: 'Talento Inicial de Vocação',
    actionCost: 'passive',
    traits: ['Vocação'],
    description: 'Habilidade fundamental adquirida ao assumir esta vocação no 1º nível.',
    benefitsSummary: 'Concede proficiência e bônus de perícia inicial.'
  },
  {
    level: 3,
    title: '1º Avanço de Vocação',
    actionCost: 'passive',
    traits: ['Vocação'],
    description: 'Primeira expansão das técnicas e reflexos de sua vocação.',
    benefitsSummary: 'Aprimoramento de manobras e perícia.'
  },
  {
    level: 6,
    title: '2º Avanço de Vocação',
    actionCost: 'passive',
    traits: ['Vocação'],
    description: 'Técnica intermediária que consolida a maestria em seu caminho.',
    benefitsSummary: 'Novo truque, reação ou manobra tática.'
  },
  {
    level: 9,
    title: '3º Avanço de Vocação',
    actionCost: 'passive',
    traits: ['Vocação'],
    description: 'Evolução notável das capacidades práticas e intuitivas.',
    benefitsSummary: 'Acesso a posturas ou melhorias defensivas/ofensivas.'
  },
  {
    level: 12,
    title: '4º Avanço de Vocação',
    actionCost: 'passive',
    traits: ['Vocação'],
    description: 'Habilidade de mestre reconhecida por ordens e guildas.',
    benefitsSummary: 'Bônus substancial e novas ativações de combate/utilidade.'
  },
  {
    level: 15,
    title: '5º Avanço de Vocação',
    actionCost: 'passive',
    traits: ['Vocação'],
    description: 'Poder quase lendário no domínio de sua especialidade.',
    benefitsSummary: 'Capacidade de contornar resistências ou imunidades.'
  },
  {
    level: 18,
    title: 'Ápice da Vocação',
    actionCost: 'passive',
    traits: ['Vocação', 'Ápice'],
    description: 'O ápice supremo da vocação. Um feito de lenda nos anais de Hecos.',
    benefitsSummary: 'Poder definitivo da trilha de vocação.'
  }
];

export const ClassCreateModal: React.FC<ClassCreateModalProps> = ({
  isOpen,
  initialKind = 'class',
  editingEntity,
  onClose,
  onSave
}) => {
  const existingClassData = editingEntity?.classData;
  const initialResolvedKind: 'class' | 'archetype' | 'vocation' =
    existingClassData?.kind ||
    (editingEntity?.category === 'class' ? 'class' : initialKind === 'vocation' ? 'vocation' : initialKind);

  const [kind, setKind] = useState<'class' | 'archetype' | 'vocation'>(initialResolvedKind);
  const [name, setName] = useState(editingEntity?.title || '');
  const [subtitle, setSubtitle] = useState(editingEntity?.subtitle || '');
  const [rarity, setRarity] = useState<'Comum' | 'Incomum' | 'Raro' | 'Único'>(
    existingClassData?.rarity || 'Comum'
  );
  const [coverImage, setCoverImage] = useState(editingEntity?.coverImage || '');
  const [summary, setSummary] = useState(editingEntity?.summary || '');
  const [description, setDescription] = useState(
    existingClassData?.description || editingEntity?.summary || ''
  );
  const [hecosLore, setHecosLore] = useState(existingClassData?.hecosLore || '');
  const [gmNotes, setGmNotes] = useState(existingClassData?.gmNotes || '');

  // Class Specifics
  const [hpPerLevel, setHpPerLevel] = useState<number>(existingClassData?.hpPerLevel || 8);
  const [keyAttribute, setKeyAttribute] = useState<string>(
    existingClassData?.keyAttribute || 'Força ou Destreza'
  );
  const [perceptionProficiency, setPerceptionProficiency] = useState<ClassProficiencyRank>(
    existingClassData?.perceptionProficiency || 'Treinado'
  );
  const [fortitude, setFortitude] = useState<ClassProficiencyRank>(
    existingClassData?.savingThrows?.fortitude || 'Especialista'
  );
  const [reflex, setReflex] = useState<ClassProficiencyRank>(
    existingClassData?.savingThrows?.reflex || 'Treinado'
  );
  const [will, setWill] = useState<ClassProficiencyRank>(
    existingClassData?.savingThrows?.will || 'Especialista'
  );
  const [skillsProficiency, setSkillsProficiency] = useState(
    existingClassData?.skillsProficiency ||
      'Treinado em Atletismo + 3 + modificador de Inteligência de perícias adicionais'
  );
  const [attacksProficiency, setAttacksProficiency] = useState(
    existingClassData?.attacksProficiency ||
      'Treinado em todas as armas simples e marciais, e ataques desarmados'
  );
  const [defensesProficiency, setDefensesProficiency] = useState(
    existingClassData?.defensesProficiency || 'Treinado em armaduras leves, médias e escudos'
  );
  const [classDcProficiency, setClassDcProficiency] = useState<ClassProficiencyRank>(
    existingClassData?.classDcProficiency || 'Treinado'
  );

  // Spellcasting
  const [isSpellcaster, setIsSpellcaster] = useState(
    existingClassData?.spellcasting?.isSpellcaster || false
  );
  const [spellTradition, setSpellTradition] = useState<'Arcana' | 'Divina' | 'Oculta' | 'Primal' | 'Nenhuma'>(
    existingClassData?.spellcasting?.tradition || 'Arcana'
  );
  const [spellType, setSpellType] = useState<'Preparado' | 'Espontâneo' | 'Foco'>(
    existingClassData?.spellcasting?.spellType || 'Preparado'
  );
  const [spellKeyAttribute, setSpellKeyAttribute] = useState(
    existingClassData?.spellcasting?.keyAttribute || 'Inteligência'
  );

  // Features by Level (Classes)
  const [features, setFeatures] = useState<ClassFeature[]>(
    existingClassData?.features && existingClassData.features.length > 0
      ? existingClassData.features
      : [
          {
            id: 'feat-1',
            level: 1,
            name: 'Característica Inicial',
            description: 'Descrição da habilidade ganha no nível 1...',
            actionCost: '',
            traits: []
          }
        ]
  );

  // Subclasses (Classes)
  const [subclasses, setSubclasses] = useState<ClassSubclass[]>(
    existingClassData?.subclasses && existingClassData.subclasses.length > 0
      ? existingClassData.subclasses
      : [
          {
            id: 'sub-1',
            name: 'Doutrina / Linhagem / Disciplina',
            description: 'Especialização da classe escolhida no nível 1...',
            grantedFeatures: 'Garante proficiência extra e talentos adicionais.'
          }
        ]
  );

  // Archetype Specifics (PF2e + Trainers + Quests)
  const [archetypeDedicationLevel, setArchetypeDedicationLevel] = useState<number>(
    existingClassData?.archetypeDedicationLevel || 2
  );
  const [prerequisites, setPrerequisites] = useState(
    existingClassData?.prerequisites || 'Força 14 ou Treinado em Atletismo'
  );
  const [access, setAccess] = useState(existingClassData?.access || '');
  const [dedicationFeatName, setDedicationFeatName] = useState(
    existingClassData?.dedicationFeat?.name || 'Dedicação ao Arquétipo'
  );
  const [dedicationFeatDesc, setDedicationFeatDesc] = useState(
    existingClassData?.dedicationFeat?.description ||
      'Você ganha treinamento nas perícias e posturas fundamentais deste arquétipo.'
  );
  const [dedicationFeatEntityId, setDedicationFeatEntityId] = useState<string | undefined>(
    existingClassData?.dedicationFeat?.featEntityId
  );
  const [dedicationFeatActionCost, setDedicationFeatActionCost] = useState<string | undefined>(
    existingClassData?.dedicationFeat?.actionCost
  );
  const [dedicationFeatTraits, setDedicationFeatTraits] = useState<string[] | undefined>(
    existingClassData?.dedicationFeat?.traits
  );

  // Manual edit toggles for list cards
  const [manualEditFeatures, setManualEditFeatures] = useState<Record<string, boolean>>({});
  const [manualEditArchetypeFeats, setManualEditArchetypeFeats] = useState<Record<string, boolean>>({});
  const [manualEditVocationLevels, setManualEditVocationLevels] = useState<Record<number, boolean>>({});
  const [manualEditDedication, setManualEditDedication] = useState<boolean>(false);
  const [trainerNpcs, setTrainerNpcs] = useState<string[]>(
    existingClassData?.trainerNpcs || []
  );
  const [newTrainerInput, setNewTrainerInput] = useState('');
  const [linkedQuests, setLinkedQuests] = useState<string[]>(
    existingClassData?.linkedQuests || []
  );
  const [newQuestInput, setNewQuestInput] = useState('');
  const [trainingRequirements, setTrainingRequirements] = useState(
    existingClassData?.trainingRequirements || ''
  );
  const [archetypeFeats, setArchetypeFeats] = useState<ClassArchetypeFeat[]>(
    existingClassData?.archetypeFeats && existingClassData.archetypeFeats.length > 0
      ? existingClassData.archetypeFeats
      : [
          {
            id: 'arch-feat-1',
            level: 4,
            name: 'Técnica Avançada',
            description: 'Habilidade complementar obtida através de treino e experiência.',
            prerequisites: 'Dedicação ao Arquétipo'
          }
        ]
  );

  // Vocation Specifics (Background+ Linear Progression 1, 3, 6, 9, 12, 15, 18)
  const [vocationTheme, setVocationTheme] = useState(
    existingClassData?.vocationTheme || 'Origem, ofício ou chamado pré-destinado no cenário'
  );
  const [initialBonusSkill, setInitialBonusSkill] = useState(
    existingClassData?.initialBonusSkill || 'Treinado em Sobrevivência e Lore (Ofício)'
  );
  const [vocationProgression, setVocationProgression] = useState<VocationProgressionLevel[]>(() => {
    if (existingClassData?.vocationProgression && existingClassData.vocationProgression.length > 0) {
      return existingClassData.vocationProgression;
    }
    return DEFAULT_VOCATION_LEVELS;
  });

  // Visibility & Active Tab
  const [visibility, setVisibility] = useState<ItemVisibility>(editingEntity?.visibility || 'all');
  const [activeTab, setActiveTab] = useState<
    'basics' | 'proficiencies' | 'features' | 'archetype' | 'vocation' | 'lore'
  >(kind === 'class' ? 'basics' : kind === 'archetype' ? 'archetype' : 'vocation');

  // Feat Picker Modal State & Configuration
  const [isFeatPickerOpen, setIsFeatPickerOpen] = useState(false);
  const [featPickerConfig, setFeatPickerConfig] = useState<{
    target:
      | 'class_feature_new'
      | 'class_feature_slot'
      | 'archetype_dedication'
      | 'archetype_feat_new'
      | 'archetype_feat_slot'
      | 'vocation_level'
      | 'vocation_batch';
    featureIndex?: number;
    vocationLevelIndex?: number;
    targetLevel?: number;
    title?: string;
    subtitle?: string;
    initialTypeFilter?: string;
    mode?: 'ancestry' | 'class' | 'archetype' | 'vocation' | 'general';
    singleSelectOnly?: boolean;
  }>({
    target: 'class_feature_new',
  });

  const handleFeatPickerSinglePick = (entity: HecosEntity, parsedFeat: PF2eFeatAttributes) => {
    if (!featPickerConfig) return;

    if (featPickerConfig.target === 'vocation_level' && featPickerConfig.vocationLevelIndex !== undefined) {
      const idx = featPickerConfig.vocationLevelIndex;
      const updated = [...vocationProgression];
      const targetLevel = updated[idx].level;
      updated[idx] = {
        ...updated[idx],
        title: entity.title,
        description: parsedFeat.description || entity.summary || '',
        actionCost: (parsedFeat.actionCost as string) || 'passive',
        traits: parsedFeat.traits && parsedFeat.traits.length > 0 ? parsedFeat.traits : ['Vocação'],
        benefitsSummary: parsedFeat.frequency || parsedFeat.prerequisites || '',
        featEntityId: entity.id
      };
      setVocationProgression(updated);
      setManualEditVocationLevels((prev) => ({ ...prev, [targetLevel]: false }));
    } else if (featPickerConfig.target === 'archetype_dedication') {
      setDedicationFeatName(entity.title);
      setDedicationFeatDesc(parsedFeat.description || entity.summary || '');
      setDedicationFeatEntityId(entity.id);
      setDedicationFeatActionCost((parsedFeat.actionCost as string) || 'passive');
      setDedicationFeatTraits(parsedFeat.traits && parsedFeat.traits.length > 0 ? parsedFeat.traits : ['Arquétipo', 'Dedicação']);
      if (parsedFeat.prerequisites) setPrerequisites(parsedFeat.prerequisites);
      if (parsedFeat.level) setArchetypeDedicationLevel(parsedFeat.level);
      setManualEditDedication(false);
    } else if (featPickerConfig.target === 'archetype_feat_slot' && featPickerConfig.featureIndex !== undefined) {
      const idx = featPickerConfig.featureIndex;
      const updated = [...archetypeFeats];
      const featId = updated[idx].id;
      updated[idx] = {
        ...updated[idx],
        name: entity.title,
        level: parsedFeat.level || updated[idx].level || 4,
        description: parsedFeat.description || entity.summary || '',
        prerequisites: parsedFeat.prerequisites || updated[idx].prerequisites || '',
        actionCost: (parsedFeat.actionCost as string) || '',
        traits: parsedFeat.traits || [],
        featEntityId: entity.id
      };
      setArchetypeFeats(updated);
      setManualEditArchetypeFeats((prev) => ({ ...prev, [featId]: false }));
    } else if (featPickerConfig.target === 'class_feature_slot' && featPickerConfig.featureIndex !== undefined) {
      const idx = featPickerConfig.featureIndex;
      const updated = [...features];
      const featId = updated[idx].id;
      updated[idx] = {
        ...updated[idx],
        name: entity.title,
        level: parsedFeat.level || updated[idx].level || 1,
        description: parsedFeat.description || entity.summary || '',
        actionCost: (parsedFeat.actionCost as string) || '',
        traits: parsedFeat.traits || [],
        featEntityId: entity.id
      };
      setFeatures(updated);
      setManualEditFeatures((prev) => ({ ...prev, [featId]: false }));
    } else if (featPickerConfig.target === 'class_feature_new') {
      const newId = `feat-${Date.now()}`;
      setFeatures([
        ...features,
        {
          id: newId,
          level: parsedFeat.level || 1,
          name: entity.title,
          description: parsedFeat.description || entity.summary || '',
          actionCost: (parsedFeat.actionCost as string) || '',
          traits: parsedFeat.traits || [],
          featEntityId: entity.id
        }
      ]);
      setManualEditFeatures((prev) => ({ ...prev, [newId]: false }));
    } else if (featPickerConfig.target === 'archetype_feat_new') {
      const newId = `arch-${Date.now()}`;
      setArchetypeFeats([
        ...archetypeFeats,
        {
          id: newId,
          level: parsedFeat.level || 4,
          name: entity.title,
          description: parsedFeat.description || entity.summary || '',
          prerequisites: parsedFeat.prerequisites || dedicationFeatName || 'Dedicação ao Arquétipo',
          actionCost: (parsedFeat.actionCost as string) || '',
          traits: parsedFeat.traits || [],
          featEntityId: entity.id
        }
      ]);
      setManualEditArchetypeFeats((prev) => ({ ...prev, [newId]: false }));
    }
  };

  const handleFeatPickerEntitiesSelect = (
    selected: { entity: HecosEntity; parsedFeat: PF2eFeatAttributes }[]
  ) => {
    if (!featPickerConfig || selected.length === 0) return;

    if (featPickerConfig.target === 'class_feature_new') {
      const newFeats: ClassFeature[] = selected.map((s, i) => ({
        id: `feat-${Date.now()}-${i}`,
        level: s.parsedFeat.level || 1,
        name: s.entity.title,
        description: s.parsedFeat.description || s.entity.summary || '',
        actionCost: (s.parsedFeat.actionCost as string) || '',
        traits: s.parsedFeat.traits || [],
        featEntityId: s.entity.id
      }));
      setFeatures([...features, ...newFeats]);
    } else if (featPickerConfig.target === 'archetype_feat_new') {
      const newFeats: ClassArchetypeFeat[] = selected.map((s, i) => ({
        id: `arch-${Date.now()}-${i}`,
        level: s.parsedFeat.level || 4,
        name: s.entity.title,
        description: s.parsedFeat.description || s.entity.summary || '',
        prerequisites: s.parsedFeat.prerequisites || dedicationFeatName || 'Dedicação ao Arquétipo',
        actionCost: (s.parsedFeat.actionCost as string) || '',
        traits: s.parsedFeat.traits || [],
        featEntityId: s.entity.id
      }));
      setArchetypeFeats([...archetypeFeats, ...newFeats]);
    } else if (featPickerConfig.target === 'vocation_batch') {
      const updated = [...vocationProgression];
      selected.forEach((s, idx) => {
        if (idx < updated.length) {
          updated[idx] = {
            ...updated[idx],
            title: s.entity.title,
            description: s.parsedFeat.description || s.entity.summary || '',
            actionCost: (s.parsedFeat.actionCost as string) || 'passive',
            traits: s.parsedFeat.traits && s.parsedFeat.traits.length > 0 ? s.parsedFeat.traits : ['Vocação'],
            benefitsSummary: s.parsedFeat.frequency || s.parsedFeat.prerequisites || '',
            featEntityId: s.entity.id
          };
        }
      });
      setVocationProgression(updated);
    }
  };

  // List of already used feat IDs for picker badges
  const alreadyAddedFeatEntityIds = useMemo(() => {
    const list: string[] = [];
    features.forEach((f) => f.featEntityId && list.push(f.featEntityId));
    archetypeFeats.forEach((a) => a.featEntityId && list.push(a.featEntityId));
    vocationProgression.forEach((v) => v.featEntityId && list.push(v.featEntityId));
    return list;
  }, [features, archetypeFeats, vocationProgression]);

  const alreadyAddedFeatNames = useMemo(() => {
    const list: string[] = [];
    features.forEach((f) => f.name && list.push(f.name));
    archetypeFeats.forEach((a) => a.name && list.push(a.name));
    vocationProgression.forEach((v) => v.title && list.push(v.title));
    if (dedicationFeatName) list.push(dedicationFeatName);
    return list;
  }, [features, archetypeFeats, vocationProgression, dedicationFeatName]);

  // Load existing entities for trainer and quest autocomplete
  const entities = useMemo(() => HecosStorage.getEntities(), []);
  const availableNpcs = useMemo(
    () => entities.filter((e) => e.category === 'npc' || e.tags?.includes('npc')),
    [entities]
  );
  const availableQuests = useMemo(
    () => entities.filter((e) => e.category === 'quest' || e.tags?.includes('quest')),
    [entities]
  );

  const handleAddTrainer = (nameToAdd?: string) => {
    const val = (nameToAdd || newTrainerInput).trim();
    if (!val) return;
    if (!trainerNpcs.includes(val)) {
      setTrainerNpcs([...trainerNpcs, val]);
    }
    setNewTrainerInput('');
  };

  const handleRemoveTrainer = (nameToRemove: string) => {
    setTrainerNpcs(trainerNpcs.filter((t) => t !== nameToRemove));
  };

  const handleAddQuest = (nameToAdd?: string) => {
    const val = (nameToAdd || newQuestInput).trim();
    if (!val) return;
    if (!linkedQuests.includes(val)) {
      setLinkedQuests([...linkedQuests, val]);
    }
    setNewQuestInput('');
  };

  const handleRemoveQuest = (nameToRemove: string) => {
    setLinkedQuests(linkedQuests.filter((q) => q !== nameToRemove));
  };

  const handleAddFeature = () => {
    setFeatures([
      ...features,
      {
        id: `feat-${Date.now()}`,
        level: 1,
        name: 'Nova Característica de Classe',
        description: 'Descreva os efeitos mecânicos desta característica...',
        actionCost: '',
        traits: []
      }
    ]);
  };

  const handleRemoveFeature = (id: string) => {
    setFeatures(features.filter((f) => f.id !== id));
  };

  const handleAddSubclass = () => {
    setSubclasses([
      ...subclasses,
      {
        id: `sub-${Date.now()}`,
        name: 'Nova Subclasse / Doutrina',
        description: 'Descreva a filosofia e poderes desta trilha...',
        grantedFeatures: ''
      }
    ]);
  };

  const handleRemoveSubclass = (id: string) => {
    setSubclasses(subclasses.filter((s) => s.id !== id));
  };

  const handleAddArchetypeFeat = () => {
    setArchetypeFeats([
      ...archetypeFeats,
      {
        id: `arch-${Date.now()}`,
        level: 4,
        name: 'Novo Talento de Arquétipo',
        description: 'Descrição mecânica do talento...',
        prerequisites: dedicationFeatName || 'Dedicação ao Arquétipo'
      }
    ]);
  };

  const handleRemoveArchetypeFeat = (id: string) => {
    setArchetypeFeats(archetypeFeats.filter((f) => f.id !== id));
  };

  const handleUpdateVocationLevel = (
    index: number,
    field: keyof VocationProgressionLevel,
    val: any
  ) => {
    const updated = [...vocationProgression];
    updated[index] = { ...updated[index], [field]: val };
    setVocationProgression(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome do artigo.');
      return;
    }

    const classData: ClassAttributes = {
      kind,
      hpPerLevel: kind === 'class' ? hpPerLevel : undefined,
      keyAttribute: kind === 'class' ? keyAttribute : undefined,
      rarity,
      perceptionProficiency: kind === 'class' ? perceptionProficiency : undefined,
      savingThrows:
        kind === 'class'
          ? {
              fortitude,
              reflex,
              will
            }
          : undefined,
      skillsProficiency: kind === 'class' ? skillsProficiency : undefined,
      attacksProficiency: kind === 'class' ? attacksProficiency : undefined,
      defensesProficiency: kind === 'class' ? defensesProficiency : undefined,
      classDcProficiency: kind === 'class' ? classDcProficiency : undefined,
      spellcasting:
        kind === 'class' && isSpellcaster
          ? {
              isSpellcaster: true,
              tradition: spellTradition,
              spellType,
              keyAttribute: spellKeyAttribute
            }
          : undefined,
      features: kind === 'class' ? features : undefined,
      subclasses: kind === 'class' && subclasses.length > 0 ? subclasses : undefined,

      // Archetype Specifics
      archetypeDedicationLevel: kind === 'archetype' ? archetypeDedicationLevel : undefined,
      prerequisites: kind === 'archetype' ? prerequisites : undefined,
      access: kind === 'archetype' && access ? access : undefined,
      trainerNpcs: kind === 'archetype' && trainerNpcs.length > 0 ? trainerNpcs : undefined,
      linkedQuests: kind === 'archetype' && linkedQuests.length > 0 ? linkedQuests : undefined,
      trainingRequirements:
        kind === 'archetype' && trainingRequirements ? trainingRequirements : undefined,
      dedicationFeat:
        kind === 'archetype'
          ? {
              id: 'dedication-feat',
              level: archetypeDedicationLevel,
              name: dedicationFeatName,
              description: dedicationFeatDesc,
              prerequisites,
              actionCost: dedicationFeatActionCost,
              traits: dedicationFeatTraits,
              featEntityId: dedicationFeatEntityId
            }
          : undefined,
      archetypeFeats: kind === 'archetype' ? archetypeFeats : undefined,

      // Vocation Specifics
      vocationTheme: kind === 'vocation' ? vocationTheme : undefined,
      initialBonusSkill: kind === 'vocation' ? initialBonusSkill : undefined,
      vocationProgression: kind === 'vocation' ? vocationProgression : undefined,

      description,
      hecosLore,
      gmNotes
    };

    // Construct rich serialized markdown
    let markdown = `# ${name.trim()}\n`;
    if (kind === 'class') {
      markdown += `> ${subtitle.trim() || `Classe de Hecos • ${hpPerLevel} PV`}\n\n---\n\n`;
      markdown += `${description.trim() || summary.trim() || 'Sem descrição cadastrada.'}\n\n`;
      markdown += `## Características Iniciais\n`;
      markdown += `- **🩸 Pontos de Vida (HP):** ${hpPerLevel} + Modificador de Constituição por nível\n`;
      markdown += `- **🧠 Atributo-Chave:** ${keyAttribute}\n`;
      markdown += `- **👁️ Percepção:** ${perceptionProficiency}\n`;
      markdown += `- **🛡️ Salvamentos:** Fortitude (${fortitude}), Reflexos (${reflex}), Vontade (${will})\n`;
      markdown += `- **⚔️ Ataques:** ${attacksProficiency}\n`;
      markdown += `- **🛡️ Defesas:** ${defensesProficiency}\n`;
      markdown += `- **📐 CD de Classe:** ${classDcProficiency}\n`;
      markdown += `- **📚 Perícias:** ${skillsProficiency}\n\n`;
    } else if (kind === 'archetype') {
      markdown += `> ${subtitle.trim() || `Arquétipo de Dedicação (Nível ${archetypeDedicationLevel})`}\n\n---\n\n`;
      markdown += `${description.trim() || summary.trim() || 'Sem descrição cadastrada.'}\n\n`;
      markdown += `## Requisitos de Arquétipo & Treinamento\n`;
      markdown += `- **Nível de Dedicação:** Nível ${archetypeDedicationLevel}\n`;
      markdown += `- **Pré-requisitos:** ${prerequisites || 'Nenhum'}\n`;
      if (access) markdown += `- **Acesso Especial:** ${access}\n`;
      if (trainerNpcs.length > 0)
        markdown += `- **Instrutores / Mestres de Treino:** ${trainerNpcs.join(', ')}\n`;
      if (linkedQuests.length > 0)
        markdown += `- **Quests de Desbloqueio:** ${linkedQuests.join(', ')}\n`;
      if (trainingRequirements)
        markdown += `- **Condições de Treinamento:** ${trainingRequirements}\n`;
      markdown += `\n`;
    } else {
      // Vocation
      markdown += `> ${subtitle.trim() || `Vocação (Background+ • Progressão Linear Níveis 1, 3, 6, 9, 12, 15, 18)`}\n\n---\n\n`;
      markdown += `${description.trim() || summary.trim() || 'Sem descrição cadastrada.'}\n\n`;
      markdown += `## Visão Geral da Vocação\n`;
      markdown += `*Vocações funcionam como uma evolução linear contínua (Background+). O personagem escolhe sua vocação no Nível 1 e recebe os talentos pré-definidos nos níveis 1, 3, 6, 9, 12, 15 e 18.*\n\n`;
      if (vocationTheme) markdown += `- **Origem / Filosofia:** ${vocationTheme}\n`;
      if (initialBonusSkill) markdown += `- **Bônus Inicial (Nível 1):** ${initialBonusSkill}\n\n`;
      markdown += `## Trilha Linear de Talentos (Níveis 1, 3, 6, 9, 12, 15, 18)\n`;
      vocationProgression.forEach((vp) => {
        markdown += `### Nível ${vp.level}: ${vp.title}\n`;
        if (vp.actionCost) markdown += `*Custo de Ação:* ${vp.actionCost} | *Traços:* ${(vp.traits || []).join(', ')}\n\n`;
        markdown += `${vp.description || 'Sem descrição.'}\n\n`;
      });
    }

    if (hecosLore.trim()) {
      markdown += `\n### Lore & Filosofia em Hecos\n${hecosLore.trim()}\n`;
    }
    if (gmNotes.trim()) {
      markdown += `\n:::gm\n**Notas do Mestre:**\n${gmNotes.trim()}\n:::\n`;
    }

    const entityId = editingEntity?.id || `${kind}-${Date.now()}`;
    const subcategoryName =
      kind === 'class' ? 'Classes' : kind === 'vocation' ? 'Vocações' : 'Arquétipos';

    const defaultSubtitle =
      kind === 'class'
        ? `Classe • ${hpPerLevel} PV`
        : kind === 'vocation'
        ? 'Vocação • Progressão Linear (1-18)'
        : `Arquétipo • Dedicação Nível ${archetypeDedicationLevel}`;

    const newEntity: HecosEntity = {
      id: entityId,
      slug:
        editingEntity?.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      title: name.trim(),
      subtitle: subtitle.trim() || defaultSubtitle,
      category: kind === 'class' ? 'class' : 'archetype',
      subcategory: subcategoryName,
      subcategories: [subcategoryName],
      tags: [
        kind === 'class' ? 'Classe' : kind === 'vocation' ? 'Vocação' : 'Arquétipo',
        rarity,
        kind === 'class'
          ? `${hpPerLevel} PV`
          : kind === 'vocation'
          ? 'Linear 1-18'
          : `Dedicação ${archetypeDedicationLevel}`
      ],
      summary:
        summary.trim() ||
        description.slice(0, 140) ||
        `${kind === 'class' ? 'Classe' : kind === 'vocation' ? 'Vocação' : 'Arquétipo'} de Hecos.`,
      content: markdown,
      coverImage: coverImage.trim() || undefined,
      icon: kind === 'class' ? 'Swords' : kind === 'vocation' ? 'GraduationCap' : 'Layers',
      createdAt: editingEntity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: visibility === 'gm',
      visibility,
      classData
    };

    HecosStorage.saveEntity(newEntity);
    onSave(newEntity);
    onClose();
  };

  const theme = useMemo(() => {
    if (kind === 'class') {
      return {
        kindName: 'Classe',
        kindLabel: 'Classe de Personagem',
        kindSub: 'Ficha completa de classe com PVs, proficiências, habilidades e subclasses.',
        icon: Swords,
        iconColor: 'text-blue-400',
        colorHex: '#3b82f6',
        accentText: 'text-blue-400',
        accentBorder: 'border-blue-500/60',
        focusBorder: 'focus:border-blue-500',
        modalBorder: 'border-blue-500/40',
        modalGlow: 'shadow-[0_0_60px_rgba(59,130,246,0.25)]',
        headerBg: 'bg-[#081024]',
        containerBg: 'bg-[#050a17]',
        tabsBg: 'bg-[#070d1e]',
        iconBoxBg: 'bg-blue-950/80 border-blue-600/70 text-blue-400',
        tabActive: 'border-blue-500 text-blue-300 bg-blue-950/30',
        btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/80',
        cardBg: 'bg-[#0a1326] border-blue-900/40',
        badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-700/60',
        tagBg: 'bg-blue-950/90 text-blue-200 border-blue-700/70',
      };
    }
    if (kind === 'archetype') {
      return {
        kindName: 'Arquétipo',
        kindLabel: 'Arquétipo',
        kindSub: 'Arquétipos obtidos via dedicação, treinamento com NPCs e quests de campanha.',
        icon: Layers,
        iconColor: 'text-purple-400',
        colorHex: '#a855f7',
        accentText: 'text-purple-400',
        accentBorder: 'border-purple-500/60',
        focusBorder: 'focus:border-purple-500',
        modalBorder: 'border-purple-500/40',
        modalGlow: 'shadow-[0_0_60px_rgba(168,85,247,0.25)]',
        headerBg: 'bg-[#150a24]',
        containerBg: 'bg-[#0e0719]',
        tabsBg: 'bg-[#12081f]',
        iconBoxBg: 'bg-purple-950/80 border-purple-600/70 text-purple-400',
        tabActive: 'border-purple-500 text-purple-300 bg-purple-950/30',
        btnPrimary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/80',
        cardBg: 'bg-[#160d26] border-purple-900/40',
        badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
        tagBg: 'bg-purple-950/90 text-purple-200 border-purple-700/70',
      };
    }
    // kind === 'vocation'
    return {
      kindName: 'Vocação',
      kindLabel: 'Vocação',
      kindSub: 'Ofício e vocação com progressão contínua de talentos nos níveis 1, 3, 6, 9, 12, 15 e 18.',
      icon: GraduationCap,
      iconColor: 'text-teal-400',
      colorHex: '#14b8a6',
      accentText: 'text-teal-400',
      accentBorder: 'border-teal-500/60',
      focusBorder: 'focus:border-teal-500',
      modalBorder: 'border-teal-500/40',
      modalGlow: 'shadow-[0_0_60px_rgba(20,184,166,0.25)]',
      headerBg: 'bg-[#061819]',
      containerBg: 'bg-[#041011]',
      tabsBg: 'bg-[#051415]',
      iconBoxBg: 'bg-teal-950/80 border-teal-600/70 text-teal-400',
      tabActive: 'border-teal-500 text-teal-300 bg-teal-950/30',
      btnPrimary: 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-950/80',
      cardBg: 'bg-[#081e20] border-teal-900/40',
      badgeBg: 'bg-teal-950/80 text-teal-300 border-teal-700/60',
      tagBg: 'bg-teal-950/90 text-teal-200 border-teal-700/70',
    };
  }, [kind]);

  if (!isOpen) return null;

  return (
    <div
      id="class-create-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="class-create-modal-container"
        className={`w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] ${theme.containerBg} ${theme.modalBorder} border rounded-2xl ${theme.modalGlow} flex flex-col overflow-hidden text-zinc-100 transition-colors duration-200`}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between ${theme.headerBg} transition-colors duration-200`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${theme.iconBoxBg} flex items-center justify-center shadow-md transition-colors duration-200`}>
              {kind === 'class' ? (
                <Swords className="w-5 h-5 text-blue-400" />
              ) : kind === 'vocation' ? (
                <GraduationCap className="w-5 h-5 text-teal-400" />
              ) : (
                <Layers className="w-5 h-5 text-purple-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                {editingEntity ? 'Editar' : 'Criar'} {theme.kindLabel}
              </h2>
              <p className="text-xs text-zinc-400">
                {theme.kindSub}
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

        {/* Modal Kind Switcher & Tabs */}
        <div className={`flex border-b border-zinc-800/80 px-6 ${theme.tabsBg} overflow-x-auto text-xs items-center justify-between gap-4 transition-colors duration-200`}>
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'basics'
                  ? theme.tabActive
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Visão Geral
            </button>

            {kind === 'class' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('proficiencies')}
                  className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'proficiencies'
                      ? 'border-blue-500 text-blue-300 bg-blue-950/30'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Proficiências & Magia
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('features')}
                  className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'features'
                      ? 'border-blue-500 text-blue-300 bg-blue-950/30'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Habilidades & Subclasses ({features.length + subclasses.length})
                </button>
              </>
            )}

            {kind === 'archetype' && (
              <button
                type="button"
                onClick={() => setActiveTab('archetype')}
                className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'archetype'
                    ? 'border-purple-500 text-purple-300 bg-purple-950/30'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Dedicação, Instrutores & Talentos ({archetypeFeats.length + 1})
              </button>
            )}

            {kind === 'vocation' && (
              <button
                type="button"
                onClick={() => setActiveTab('vocation')}
                className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'vocation'
                    ? 'border-teal-500 text-teal-300 bg-teal-950/30'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Progressão de Vocação (7 Níveis)
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('lore')}
              className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'lore'
                  ? theme.tabActive
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Lore & Segredos
            </button>
          </div>

          {/* 3-Way Kind Switcher with visual color distinction */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => {
                setKind('class');
                setActiveTab('basics');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                kind === 'class'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950 font-bold border border-blue-400'
                  : 'text-zinc-400 hover:text-blue-300 hover:bg-blue-950/20'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              Classe
            </button>
            <button
              type="button"
              onClick={() => {
                setKind('archetype');
                setActiveTab('archetype');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                kind === 'archetype'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-950 font-bold border border-purple-400'
                  : 'text-zinc-400 hover:text-purple-300 hover:bg-purple-950/20'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Arquétipo
            </button>
            <button
              type="button"
              onClick={() => {
                setKind('vocation');
                setActiveTab('vocation');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                kind === 'vocation'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950 font-bold border border-teal-400'
                  : 'text-zinc-400 hover:text-teal-300 hover:bg-teal-950/20'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Vocação
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome {theme.kindName === 'Classe' ? 'da Classe' : theme.kindName === 'Vocação' ? 'da Vocação' : 'do Arquétipo'}{' '}
                    <span className={theme.accentText}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      kind === 'class'
                        ? 'Ex: Guerreiro de Obsidiana, Arquimago do Eclipse...'
                        : kind === 'vocation'
                        ? 'Ex: Guarda da Caravana, Acadêmico do Eclipse, Veterano de Cerco...'
                        : 'Ex: Cavaleiro da Penumbra, Duelista de Lâmina de Vidro...'
                    }
                    className={`w-full px-3.5 py-2 text-sm bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none ${theme.focusBorder}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Raridade
                  </label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-200"
                  >
                    <option value="Comum">Comum</option>
                    <option value="Incomum">Incomum</option>
                    <option value="Raro">Raro</option>
                    <option value="Único">Único</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Subtítulo / Epíteto
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex: Sentinelas jurados à proteção das muralhas de obsidiana..."
                  className={`w-full px-3.5 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none ${theme.focusBorder}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Imagem de Capa (URL ou Upload)
                </label>
                <ImageUploadInput
                  value={coverImage}
                  onChange={setCoverImage}
                  label="URL da Capa"
                  placeholder="https://..."
                  role="capa"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Resumo Rápido
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Breve sumário de uma linha para cards e buscas..."
                  className={`w-full px-3.5 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none ${theme.focusBorder}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição Conceitual & Identidade
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Apresentação narrativa, função no grupo e treinamento no mundo de Hecos..."
                  className={`w-full px-3.5 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none ${theme.focusBorder}`}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFICIENCIES & SPELLCASTING (FOR CLASSES - BLUE THEME) */}
          {activeTab === 'proficiencies' && kind === 'class' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Hit Points & Key Stat */}
              <div className="bg-[#091326] p-4 rounded-2xl border border-blue-900/50 space-y-3">
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-400" />
                  Estatísticas Vitais & Atributo (Classe)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Pontos de Vida por Nível (HP)
                    </label>
                    <select
                      value={hpPerLevel}
                      onChange={(e) => setHpPerLevel(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-rose-300 font-bold"
                    >
                      <option value={6}>6 PV (Conjuradores Frágeis)</option>
                      <option value={8}>8 PV (Especialistas / Ladinos / Clérigos)</option>
                      <option value={10}>10 PV (Combatentes / Guerreiros / Rangers)</option>
                      <option value={12}>12 PV (Bárbaros / Guardiões Titânicos)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Atributo-Chave
                    </label>
                    <input
                      type="text"
                      value={keyAttribute}
                      onChange={(e) => setKeyAttribute(e.target.value)}
                      placeholder="Ex: Força, Destreza, Inteligência..."
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Initial Saving Throws & Perceptions */}
              <div className="bg-[#091326] p-4 rounded-2xl border border-blue-900/50 space-y-3">
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-400" />
                  Salvamentos & Percepção Iniciais
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Percepção
                    </label>
                    <select
                      value={perceptionProficiency}
                      onChange={(e) => setPerceptionProficiency(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    >
                      <option value="Treinado">Treinado</option>
                      <option value="Especialista">Especialista</option>
                      <option value="Mestre">Mestre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Fortitude
                    </label>
                    <select
                      value={fortitude}
                      onChange={(e) => setFortitude(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    >
                      <option value="Treinado">Treinado</option>
                      <option value="Especialista">Especialista</option>
                      <option value="Mestre">Mestre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Reflexos
                    </label>
                    <select
                      value={reflex}
                      onChange={(e) => setReflex(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    >
                      <option value="Treinado">Treinado</option>
                      <option value="Especialista">Especialista</option>
                      <option value="Mestre">Mestre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Vontade
                    </label>
                    <select
                      value={will}
                      onChange={(e) => setWill(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    >
                      <option value="Treinado">Treinado</option>
                      <option value="Especialista">Especialista</option>
                      <option value="Mestre">Mestre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Combat Proficiencies */}
              <div className="bg-[#091326] p-4 rounded-2xl border border-blue-900/50 space-y-3">
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-blue-400" />
                  Proficiências de Combate & CD
                </h3>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Ataques e Armas
                    </label>
                    <input
                      type="text"
                      value={attacksProficiency}
                      onChange={(e) => setAttacksProficiency(e.target.value)}
                      placeholder="Ex: Treinado em armas simples e marciais..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Defesas e Armaduras
                    </label>
                    <input
                      type="text"
                      value={defensesProficiency}
                      onChange={(e) => setDefensesProficiency(e.target.value)}
                      placeholder="Ex: Treinado em armaduras leves, médias e escudos..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        CD de Classe
                      </label>
                      <select
                        value={classDcProficiency}
                        onChange={(e) => setClassDcProficiency(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                      >
                        <option value="Treinado">Treinado</option>
                        <option value="Especialista">Especialista</option>
                        <option value="Mestre">Mestre</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Perícias Iniciais
                      </label>
                      <input
                        type="text"
                        value={skillsProficiency}
                        onChange={(e) => setSkillsProficiency(e.target.value)}
                        placeholder="Ex: Treinado em Atletismo + 3 + Int de perícias..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spellcasting Setup */}
              <div className="bg-[#091326] p-4 rounded-2xl border border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Conjuração de Magias (Opcional)
                  </h3>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isSpellcaster}
                      onChange={(e) => setIsSpellcaster(e.target.checked)}
                      className="rounded border-blue-700 bg-black/60 text-blue-600 focus:ring-0"
                    />
                    É Conjurador de Magias
                  </label>
                </div>

                {isSpellcaster && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-900/40">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Perícia Conjuradora
                      </label>
                      <select
                        value={spellTradition}
                        onChange={(e) => setSpellTradition(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                      >
                        <option value="Arcana">Arcana</option>
                        <option value="Divina">Divina</option>
                        <option value="Oculta">Oculta</option>
                        <option value="Primal">Primal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Tipo de Conjuração
                      </label>
                      <select
                        value={spellType}
                        onChange={(e) => setSpellType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                      >
                        <option value="Preparado">Preparado</option>
                        <option value="Espontâneo">Espontâneo</option>
                        <option value="Foco">Foco / Inato</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Atributo de Conjuração
                      </label>
                      <input
                        type="text"
                        value={spellKeyAttribute}
                        onChange={(e) => setSpellKeyAttribute(e.target.value)}
                        placeholder="Inteligência, Sabedoria..."
                        className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FEATURES & SUBCLASSES (FOR CLASSES - BLUE THEME) */}
          {activeTab === 'features' && kind === 'class' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Features by Level */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-400" />
                    Características de Classe por Nível
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeatPickerConfig({
                          target: 'class_feature_new',
                          title: 'Buscar Talentos / Habilidades do Compêndio',
                          subtitle: 'Selecione talentos ou habilidades do compêndio para adicionar à classe.',
                          mode: 'class',
                          initialTypeFilter: 'class',
                        });
                        setIsFeatPickerOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-300" /> Buscar do Compêndio
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-2.5 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-blue-950"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Nova Habilidade
                    </button>
                  </div>
                </div>

                {features.map((feat, index) => {
                  const isManual = Boolean(manualEditFeatures[feat.id]);
                  return (
                    <div key={feat.id} className="space-y-2">
                      <ClassFeatListItem
                        feat={feat}
                        theme="blue"
                        mode="edit"
                        onPickFeat={() => {
                          setFeatPickerConfig({
                            target: 'class_feature_slot',
                            featureIndex: index,
                            targetLevel: feat.level,
                            title: `Buscar Talento (Nível ${feat.level})`,
                            subtitle: `Selecione um talento para preencher esta habilidade (${feat.name || 'Habilidade'}).`,
                            singleSelectOnly: true,
                            mode: 'class',
                            initialTypeFilter: 'class',
                          });
                          setIsFeatPickerOpen(true);
                        }}
                        onRemove={() => handleRemoveFeature(feat.id)}
                        onToggleManualEdit={() => {
                          setManualEditFeatures((prev) => ({ ...prev, [feat.id]: !prev[feat.id] }));
                        }}
                        isManuallyEditing={isManual}
                      />

                      {/* Manual text inputs expandable below list item */}
                      {isManual && (
                        <div className="p-3 rounded-xl bg-[#0a1220] border border-blue-900/40 space-y-2 ml-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-blue-900/60">
                              <span className="text-[10px] text-blue-400 font-mono">Nível</span>
                              <input
                                type="number"
                                value={feat.level}
                                onChange={(e) => {
                                  const updated = [...features];
                                  updated[index].level = parseInt(e.target.value, 10) || 1;
                                  setFeatures(updated);
                                }}
                                min={1}
                                max={20}
                                className="w-10 text-center text-xs font-bold text-blue-300 bg-transparent focus:outline-none"
                              />
                            </div>

                            <input
                              type="text"
                              value={feat.name}
                              onChange={(e) => {
                                const updated = [...features];
                                updated[index].name = e.target.value;
                                setFeatures(updated);
                              }}
                              placeholder="Nome da Característica"
                              className="flex-1 px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold focus:border-blue-400 focus:outline-none"
                            />
                          </div>

                          <textarea
                            value={feat.description}
                            onChange={(e) => {
                              const updated = [...features];
                              updated[index].description = e.target.value;
                              setFeatures(updated);
                            }}
                            rows={2}
                            placeholder="Descrição mecânica da habilidade concedida neste nível..."
                            className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Subclasses */}
              <div className="space-y-3 pt-3 border-t border-blue-900/40">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Subclasses / Doutrinas / Ordens
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddSubclass}
                    className="px-2.5 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-blue-950"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Nova Subclasse
                  </button>
                </div>

                {subclasses.map((sub, index) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl bg-[#091326] border border-blue-900/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...subclasses];
                          updated[index].name = e.target.value;
                          setSubclasses(updated);
                        }}
                        placeholder="Nome da Subclasse (Ex: Doutrina da Batalha, Ordem da Espada)"
                        className="w-full max-w-sm px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-blue-300 font-semibold focus:border-blue-400 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveSubclass(sub.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      value={sub.description}
                      onChange={(e) => {
                        const updated = [...subclasses];
                        updated[index].description = e.target.value;
                        setSubclasses(updated);
                      }}
                      rows={2}
                      placeholder="Descrição narrativa e habilidades concedidas..."
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHETYPE (FOR ARCHETYPES - PURPLE THEME) */}
          {activeTab === 'archetype' && kind === 'archetype' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Training Masters & Quests Box */}
              <div className="bg-[#150a24] p-4 rounded-2xl border border-purple-800/60 space-y-4">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  Mestres de Treinamento & Vínculo com Quests
                </h3>
                <p className="text-xs text-purple-200/70">
                  Arquétipos em Hecos são obtidos através de mentoria com NPCs específicos e
                  desbloqueados ao concluir marcos de campanha e quests.
                </p>

                {/* NPCs Trainers */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Instrutores / NPCs que fornecem Treinamento
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {trainerNpcs.map((trainer) => (
                      <span
                        key={trainer}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/90 border border-purple-700/60 text-purple-200 text-xs font-medium"
                      >
                        {trainer}
                        <button
                          type="button"
                          onClick={() => handleRemoveTrainer(trainer)}
                          className="hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {trainerNpcs.length === 0 && (
                      <span className="text-xs text-zinc-500 italic">
                        Nenhum NPC instrutor adicionado ainda.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTrainerInput}
                      onChange={(e) => setNewTrainerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTrainer();
                        }
                      }}
                      placeholder="Nome do NPC instrutor (ex: Mestre Thaelen de Obsidiana)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTrainer()}
                      className="px-3 py-1.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-xs font-semibold hover:bg-purple-900 transition-colors cursor-pointer"
                    >
                      + Adicionar NPC
                    </button>
                  </div>

                  {availableNpcs.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1 text-[11px] text-zinc-400">
                      <span className="text-zinc-500">Sugestões de NPCs:</span>
                      {availableNpcs.slice(0, 5).map((npc) => (
                        <button
                          key={npc.id}
                          type="button"
                          onClick={() => handleAddTrainer(npc.title)}
                          className="px-2 py-0.5 rounded bg-black/40 border border-zinc-800 hover:border-purple-500/50 hover:text-purple-300 transition-colors text-[11px] cursor-pointer"
                        >
                          + {npc.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Linked Quests */}
                <div className="space-y-2 pt-3 border-t border-purple-900/40">
                  <label className="block text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    Quests ou Provas de Desbloqueio
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {linkedQuests.map((quest) => (
                      <span
                        key={quest}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-700/60 text-amber-200 text-xs font-medium"
                      >
                        {quest}
                        <button
                          type="button"
                          onClick={() => handleRemoveQuest(quest)}
                          className="hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {linkedQuests.length === 0 && (
                      <span className="text-xs text-zinc-500 italic">
                        Nenhuma quest vinculada ainda.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newQuestInput}
                      onChange={(e) => setNewQuestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddQuest();
                        }
                      }}
                      placeholder="Nome da Quest ou Prova (ex: A Prova das Sombras na Fortaleza)..."
                      className="flex-1 px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddQuest()}
                      className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-xs font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
                    >
                      + Adicionar Quest
                    </button>
                  </div>

                  {availableQuests.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1 text-[11px] text-zinc-400">
                      <span className="text-zinc-500">Sugestões de Quests:</span>
                      {availableQuests.slice(0, 4).map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => handleAddQuest(q.title)}
                          className="px-2 py-0.5 rounded bg-black/40 border border-zinc-800 hover:border-amber-500/50 hover:text-amber-300 transition-colors text-[11px] cursor-pointer"
                        >
                          + {q.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Training Requirements */}
                <div className="pt-3 border-t border-purple-900/40">
                  <label className="block text-[11px] font-semibold text-purple-300 mb-1">
                    Condições, Tempo e Custo de Treino
                  </label>
                  <input
                    type="text"
                    value={trainingRequirements}
                    onChange={(e) => setTrainingRequirements(e.target.value)}
                    placeholder="Ex: 2 meses de reclusão em templo, 50 PO em materiais místicos..."
                    className="w-full px-3 py-1.5 text-xs bg-black/60 border border-purple-900/50 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Dedication Feat Header */}
              <div className="bg-[#160d26] p-4 rounded-2xl border border-purple-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Talento de Dedicação (Entrada no Arquétipo)
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFeatPickerConfig({
                        target: 'archetype_dedication',
                        title: 'Buscar Talento de Dedicação do Compêndio',
                        subtitle: 'Selecione um talento de dedicação para preencher os dados do arquétipo.',
                        singleSelectOnly: true,
                        mode: 'archetype',
                        initialTypeFilter: 'archetype',
                      });
                      setIsFeatPickerOpen(true);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Search className="w-3.5 h-3.5 text-purple-300" /> Buscar Dedicação
                  </button>
                </div>

                {dedicationFeatName ? (
                  <ClassFeatListItem
                    feat={{
                      level: archetypeDedicationLevel,
                      name: dedicationFeatName,
                      title: dedicationFeatName,
                      description: dedicationFeatDesc,
                      prerequisites,
                      actionCost: dedicationFeatActionCost || 'passive',
                      traits: dedicationFeatTraits || ['Arquétipo', 'Dedicação'],
                      featEntityId: dedicationFeatEntityId
                    }}
                    theme="purple"
                    mode="edit"
                    onPickFeat={() => {
                      setFeatPickerConfig({
                        target: 'archetype_dedication',
                        title: 'Buscar Talento de Dedicação do Compêndio',
                        subtitle: 'Selecione um talento de dedicação para preencher os dados do arquétipo.',
                        singleSelectOnly: true,
                        mode: 'archetype',
                        initialTypeFilter: 'archetype',
                      });
                      setIsFeatPickerOpen(true);
                    }}
                    onRemove={() => {
                      setDedicationFeatName('');
                      setDedicationFeatDesc('');
                      setDedicationFeatEntityId(undefined);
                    }}
                    onToggleManualEdit={() => setManualEditDedication(!manualEditDedication)}
                    isManuallyEditing={manualEditDedication}
                  />
                ) : null}

                {(!dedicationFeatName || manualEditDedication) && (
                  <div className="space-y-3 pt-2 border-t border-purple-900/40 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Nível do Talento de Dedicação
                        </label>
                        <select
                          value={archetypeDedicationLevel}
                          onChange={(e) => setArchetypeDedicationLevel(parseInt(e.target.value, 10))}
                          className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-purple-900/60 rounded-lg text-purple-300 font-bold"
                        >
                          <option value={2}>Nível 2 (Padrão PF2e)</option>
                          <option value={4}>Nível 4</option>
                          <option value={6}>Nível 6</option>
                          <option value={8}>Nível 8</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                          Pré-requisitos de Acesso
                        </label>
                        <input
                          type="text"
                          value={prerequisites}
                          onChange={(e) => setPrerequisites(e.target.value)}
                          placeholder="Ex: Força 14 ou Treinado em Atletismo..."
                          className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={dedicationFeatName}
                        onChange={(e) => setDedicationFeatName(e.target.value)}
                        placeholder="Nome do Talento de Dedicação (ex: Dedicação ao Cavaleiro da Penumbra)"
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold focus:border-purple-400 focus:outline-none"
                      />

                      <textarea
                        value={dedicationFeatDesc}
                        onChange={(e) => setDedicationFeatDesc(e.target.value)}
                        rows={2}
                        placeholder="Efeito e benefícios conferidos ao escolher a dedicação..."
                        className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Archetype Feats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    Talentos Adicionais do Arquétipo
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeatPickerConfig({
                          target: 'archetype_feat_new',
                          title: 'Buscar Talentos de Arquétipo do Compêndio',
                          subtitle: 'Selecione talentos de arquétipo para vincular e incluir nesta lista.',
                          mode: 'archetype',
                          initialTypeFilter: 'archetype',
                        });
                        setIsFeatPickerOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5 text-purple-300" /> Buscar do Compêndio
                    </button>

                    <button
                      type="button"
                      onClick={handleAddArchetypeFeat}
                      className="px-2.5 py-1 text-xs rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-purple-950"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Novo Talento
                    </button>
                  </div>
                </div>

                {archetypeFeats.map((feat, index) => {
                  const isManual = Boolean(manualEditArchetypeFeats[feat.id]);
                  return (
                    <div key={feat.id} className="space-y-2">
                      <ClassFeatListItem
                        feat={feat}
                        theme="purple"
                        mode="edit"
                        onPickFeat={() => {
                          setFeatPickerConfig({
                            target: 'archetype_feat_slot',
                            featureIndex: index,
                            targetLevel: feat.level,
                            title: `Buscar Talento de Arquétipo (Nível ${feat.level})`,
                            subtitle: `Selecione um talento para este slot de Nível ${feat.level}.`,
                            singleSelectOnly: true,
                            mode: 'archetype',
                            initialTypeFilter: 'archetype',
                          });
                          setIsFeatPickerOpen(true);
                        }}
                        onRemove={() => handleRemoveArchetypeFeat(feat.id)}
                        onToggleManualEdit={() => {
                          setManualEditArchetypeFeats((prev) => ({ ...prev, [feat.id]: !prev[feat.id] }));
                        }}
                        isManuallyEditing={isManual}
                      />

                      {/* Manual text inputs expandable below list item */}
                      {isManual && (
                        <div className="p-3 rounded-xl bg-[#140b22] border border-purple-900/40 space-y-2 ml-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-purple-900/60">
                              <span className="text-[10px] text-purple-400 font-mono">Nível</span>
                              <input
                                type="number"
                                value={feat.level}
                                onChange={(e) => {
                                  const updated = [...archetypeFeats];
                                  updated[index].level = parseInt(e.target.value, 10) || 4;
                                  setArchetypeFeats(updated);
                                }}
                                min={2}
                                max={20}
                                className="w-10 text-center text-xs font-bold text-purple-300 bg-transparent focus:outline-none"
                              />
                            </div>

                            <input
                              type="text"
                              value={feat.name}
                              onChange={(e) => {
                                const updated = [...archetypeFeats];
                                updated[index].name = e.target.value;
                                setArchetypeFeats(updated);
                              }}
                              placeholder="Nome do Talento"
                              className="flex-1 px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold focus:border-purple-400 focus:outline-none"
                            />
                          </div>

                          <input
                            type="text"
                            value={feat.prerequisites || ''}
                            onChange={(e) => {
                              const updated = [...archetypeFeats];
                              updated[index].prerequisites = e.target.value;
                              setArchetypeFeats(updated);
                            }}
                            placeholder="Pré-requisitos do talento..."
                            className="w-full px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-400 focus:border-purple-400 focus:outline-none"
                          />

                          <textarea
                            value={feat.description}
                            onChange={(e) => {
                              const updated = [...archetypeFeats];
                              updated[index].description = e.target.value;
                              setArchetypeFeats(updated);
                            }}
                            rows={2}
                            placeholder="Descrição mecânica..."
                            className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: VOCATION (LINEAR PROGRESSION 1, 3, 6, 9, 12, 15, 18 - TURQUOISE / TEAL THEME) */}
          {activeTab === 'vocation' && kind === 'vocation' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Vocation Concept Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/70 to-cyan-950/40 border border-teal-700/60 space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-400" />
                  <h3 className="text-xs font-bold text-teal-200 uppercase tracking-wider">
                    Conceito de Vocação
                  </h3>
                </div>
                <p className="text-xs text-teal-300/80 leading-relaxed">
                  A Vocação define o ofício e chamado do personagem em Hecos, concedendo uma{' '}
                  <strong className="text-teal-200">trilha contínua de talentos</strong> nos níveis{' '}
                  <strong className="text-teal-200">1, 3, 6, 9, 12, 15 e 18</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-900/40">
                  <div>
                    <label className="block text-[11px] font-semibold text-teal-300 mb-1">
                      Filosofia / Origem da Vocação
                    </label>
                    <input
                      type="text"
                      value={vocationTheme}
                      onChange={(e) => setVocationTheme(e.target.value)}
                      placeholder="Ex: Tradição secular de proteção das caravanas do eclipse..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-teal-800/60 rounded-lg text-zinc-100 placeholder-zinc-600 focus:border-teal-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-teal-300 mb-1">
                      Perícia / Bônus Inicial Concedido (Nível 1)
                    </label>
                    <input
                      type="text"
                      value={initialBonusSkill}
                      onChange={(e) => setInitialBonusSkill(e.target.value)}
                      placeholder="Ex: Treinado em Sobrevivência e Lore (Ermos)..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-teal-800/60 rounded-lg text-zinc-100 placeholder-zinc-600 focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Linear Progression 7 Levels List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-teal-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkle className="w-4 h-4 text-teal-400" />
                    Trilha de Talentos da Vocação (7 Níveis)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFeatPickerConfig({
                          target: 'vocation_batch',
                          title: 'Preencher Trilha com Talentos do Compêndio',
                          subtitle: 'Selecione múltiplos talentos para preencher sequencialmente a progressão da vocação.',
                          mode: 'vocation',
                          initialTypeFilter: 'vocation',
                        });
                        setIsFeatPickerOpen(true);
                      }}
                      className="px-3 py-1 text-xs rounded-lg bg-teal-900/80 hover:bg-teal-800 text-teal-200 border border-teal-700 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <Search className="w-3.5 h-3.5 text-teal-300" /> Buscar Talentos do Compêndio
                    </button>
                    <span className="text-[11px] text-teal-400 font-mono font-semibold hidden sm:inline">
                      Níveis 1, 3, 6, 9, 12, 15, 18
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {vocationProgression.map((vp, index) => {
                    const hasFeat = Boolean(vp.title && vp.title.trim().length > 0);
                    const isManual = Boolean(manualEditVocationLevels[vp.level]);

                    return (
                      <div key={vp.level} className="space-y-2">
                        {hasFeat ? (
                          <ClassFeatListItem
                            feat={{
                              level: vp.level,
                              name: vp.title,
                              title: vp.title,
                              description: vp.description,
                              actionCost: vp.actionCost || 'passive',
                              traits: vp.traits && vp.traits.length > 0 ? vp.traits : ['Vocação'],
                              benefitsSummary: vp.benefitsSummary,
                              featEntityId: vp.featEntityId
                            }}
                            theme="teal"
                            mode="edit"
                            onPickFeat={() => {
                              setFeatPickerConfig({
                                target: 'vocation_level',
                                vocationLevelIndex: index,
                                targetLevel: vp.level,
                                title: `Buscar Talento de Vocação (Nível ${vp.level})`,
                                subtitle: `Selecione um talento do compêndio para o Nível ${vp.level} da vocação.`,
                                singleSelectOnly: true,
                                mode: 'vocation',
                                initialTypeFilter: 'vocation',
                              });
                              setIsFeatPickerOpen(true);
                            }}
                            onRemove={() => {
                              const updated = [...vocationProgression];
                              updated[index] = {
                                ...updated[index],
                                title: '',
                                description: '',
                                benefitsSummary: '',
                                featEntityId: undefined
                              };
                              setVocationProgression(updated);
                            }}
                            onToggleManualEdit={() => {
                              setManualEditVocationLevels((prev) => ({ ...prev, [vp.level]: !prev[vp.level] }));
                            }}
                            isManuallyEditing={isManual}
                          />
                        ) : null}

                        {(!hasFeat || isManual) && (
                          <div className="p-4 rounded-2xl bg-[#081e20] border border-teal-800/50 space-y-3 shadow-md relative animate-in fade-in duration-150">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
                                <div className="px-3 py-1 rounded-xl bg-teal-950 text-teal-300 border border-teal-600 font-black font-mono text-xs flex items-center gap-1 shadow-sm">
                                  <span className="text-teal-400">NÍVEL</span> {vp.level}
                                </div>

                                <input
                                  type="text"
                                  value={vp.title}
                                  onChange={(e) =>
                                    handleUpdateVocationLevel(index, 'title', e.target.value)
                                  }
                                  placeholder={`Nome do Talento de Nível ${vp.level}`}
                                  className="flex-1 px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-bold focus:outline-none focus:border-teal-400"
                                />
                              </div>

                              {/* Action Cost Selector & Compendium Picker */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFeatPickerConfig({
                                      target: 'vocation_level',
                                      vocationLevelIndex: index,
                                      targetLevel: vp.level,
                                      title: `Buscar Talento de Vocação (Nível ${vp.level})`,
                                      subtitle: `Selecione um talento do compêndio para o Nível ${vp.level} da vocação.`,
                                      singleSelectOnly: true,
                                      mode: 'vocation',
                                      initialTypeFilter: 'vocation',
                                    });
                                    setIsFeatPickerOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                                  title="Buscar talento correspondente no compêndio"
                                >
                                  <Search className="w-3.5 h-3.5 text-teal-400" />
                                  <span>Buscar Talento</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  <label className="text-[11px] text-zinc-400 font-mono">Ação:</label>
                                  <select
                                    value={vp.actionCost || 'passive'}
                                    onChange={(e) =>
                                      handleUpdateVocationLevel(index, 'actionCost', e.target.value)
                                    }
                                    className="px-2 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                                  >
                                    <option value="passive">Passivo (Efeito Contínuo)</option>
                                    <option value="1">◆ 1 Ação</option>
                                    <option value="2">◆◆ 2 Ações</option>
                                    <option value="3">◆◆◆ 3 Ações</option>
                                    <option value="reaction">↺ Reação</option>
                                    <option value="free">◇ Ação Livre</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold text-zinc-400">
                                Descrição Mecânica & Efeitos do Talento
                              </label>
                              <textarea
                                value={vp.description}
                                onChange={(e) =>
                                  handleUpdateVocationLevel(index, 'description', e.target.value)
                                }
                                rows={2}
                                placeholder={`Descreva os efeitos, bônus e poderes conferidos no Nível ${vp.level}...`}
                                className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-teal-400"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-semibold text-zinc-400 shrink-0">
                                Resumo / Benefício Rápido:
                              </label>
                              <input
                                type="text"
                                value={vp.benefitsSummary || ''}
                                onChange={(e) =>
                                  handleUpdateVocationLevel(index, 'benefitsSummary', e.target.value)
                                }
                                placeholder="Ex: Concede +2 em salvamentos contra medo e postura defensiva..."
                                className="flex-1 px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-teal-300 placeholder-zinc-600 focus:outline-none focus:border-teal-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: LORE & SECRETS */}
          {activeTab === 'lore' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-black/40 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Lore & Conexão com o Cenário de Hecos
                </label>
                <textarea
                  value={hecosLore}
                  onChange={(e) => setHecosLore(e.target.value)}
                  rows={3}
                  placeholder="Como este artigo se insere na história, guildas ou ordens místicas de Hecos..."
                  className={`w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none ${theme.focusBorder}`}
                />
              </div>

              <div className="bg-[#180e22] p-4 rounded-2xl border border-purple-900/50 space-y-2">
                <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Notas Secretas do Mestre
                </label>
                <textarea
                  value={gmNotes}
                  onChange={(e) => setGmNotes(e.target.value)}
                  rows={3}
                  placeholder="Informações restritas ao GM..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-purple-800/60 rounded-xl text-purple-200 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-200">Visibilidade Geral</div>
                  <div className="text-[11px] text-zinc-500">Defina quem pode acessar este artigo</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      visibility === 'all'
                        ? theme.badgeBg
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Público
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('gm')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      visibility === 'gm'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Apenas GM
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t border-zinc-800/80 ${theme.headerBg} flex items-center justify-between transition-colors duration-200`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 text-xs font-bold rounded-xl ${theme.btnPrimary} transition-all flex items-center gap-2 cursor-pointer`}
          >
            <Check className="w-4 h-4" />
            Salvar {theme.kindName}
          </button>
        </div>
      </div>

      {/* Feat Picker Modal for Universal Compendium Feat Selection */}
      <FeatPickerModal
        isOpen={isFeatPickerOpen}
        onClose={() => setIsFeatPickerOpen(false)}
        title={featPickerConfig.title}
        subtitle={featPickerConfig.subtitle}
        mode={featPickerConfig.mode || 'class'}
        initialTypeFilter={featPickerConfig.initialTypeFilter}
        targetLevel={featPickerConfig.targetLevel}
        singleSelectOnly={featPickerConfig.singleSelectOnly}
        alreadyAddedFeatEntityIds={alreadyAddedFeatEntityIds}
        alreadyAddedFeatNames={alreadyAddedFeatNames}
        onPickSingleFeat={(entity, feat) => {
          handleFeatPickerSinglePick(entity, feat);
        }}
        onSelectEntities={(selected) => {
          handleFeatPickerEntitiesSelect(selected);
        }}
      />
    </div>
  );
};
