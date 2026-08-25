import React, { useState } from 'react';
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
  Sliders,
  Maximize2,
  Activity,
  Compass,
  FileText,
  HelpCircle
} from 'lucide-react';

interface PerilCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
}

const DEFAULT_USERS: HecosUser[] = HecosStorage.getUsers();

export const PerilCreateModal: React.FC<PerilCreateModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const users = HecosStorage.getUsers();

  // Basic Details
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [perilKind, setPerilKind] = useState<PerilKind>('monster');
  const [level, setLevel] = useState<number>(1);
  const [rarity, setRarity] = useState<'Comum' | 'Incomum' | 'Raro' | 'Único'>('Comum');
  const [size, setSize] = useState<'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'>('Medium');
  const [traitsInput, setTraitsInput] = useState('');
  const [stealthCheck, setStealthCheck] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [hecosLore, setHecosLore] = useState('');
  const [gmNotes, setGmNotes] = useState('');

  // Perception & Attributes
  const [perception, setPerception] = useState<string>('6');
  const [senses, setSenses] = useState('Visão na Penumbra');
  const [languages, setLanguages] = useState('Comum');
  const [skills, setSkills] = useState('Atletismo +7, Furtividade +5');
  const [abilities, setAbilities] = useState({
    str: 3,
    dex: 2,
    con: 2,
    int: -1,
    wis: 1,
    cha: 0
  });

  // Defenses & HP
  const [ac, setAc] = useState<string>('16');
  const [fort, setFort] = useState<string>('7');
  const [refSave, setRefSave] = useState<string>('5');
  const [will, setWill] = useState<string>('4');
  const [hp, setHp] = useState<string>('20');
  const [hardness, setHardness] = useState<string>('');
  const [brokenThreshold, setBrokenThreshold] = useState<string>('');
  const [immunitiesInput, setImmunitiesInput] = useState('');
  const [weaknessesInput, setWeaknessesInput] = useState('');
  const [resistancesInput, setResistancesInput] = useState('');

  // Speed & Offense
  const [speed, setSpeed] = useState('25 pés (7,5m)');
  const [attacks, setAttacks] = useState<PerilAttack[]>([
    {
      id: 'atk-1',
      name: 'Golpe de Garras',
      type: 'melee',
      bonus: 7,
      traits: ['Ágil', 'Desarmado'],
      damage: '1d6+3 cortante',
      extraEffects: ''
    }
  ]);
  const [actions, setActions] = useState<PerilAction[]>([
    {
      id: 'act-1',
      name: 'Investida Selvagem',
      cost: '2',
      traits: ['Movimento'],
      trigger: '',
      effect: 'O perigo avança até o dobro do seu deslocamento e desfere um Ataque Corpo a Corpo.'
    }
  ]);

  // Hazard Specifics
  const [disable, setDisable] = useState('');
  const [resetCondition, setResetCondition] = useState('');
  const [routine, setRoutine] = useState('');

  // Spells
  const [tradition, setTradition] = useState('Arcana');
  const [spellDc, setSpellDc] = useState('17');
  const [spellAttack, setSpellAttack] = useState('7');
  const [spellsList, setSpellsList] = useState('');

  // Granular Field Visibility ("Olhinho")
  const [fieldVis, setFieldVis] = useState<PerilFieldVisibility>({
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
  });

  // Overall Article Visibility
  const [articleVisibility, setArticleVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'basics' | 'defenses' | 'attacks' | 'hazard' | 'lore' | 'visibility'>('basics');

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
        name: type === 'melee' ? 'Novo Ataque Corpo a Corpo' : 'Novo Ataque à Distância',
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

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        id: `act-${Date.now()}`,
        name: 'Nova Ação / Reação',
        cost: '1',
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
      stealthCheck: stealthCheck.trim() || undefined,
      perception: perception ? parseInt(perception, 10) : undefined,
      senses: senses.trim() || undefined,
      languages: languages.split(',').map((l) => l.trim()).filter(Boolean),
      skills: skills
        ? skills.split(',').reduce((acc, curr) => {
            const parts = curr.split('+');
            if (parts.length === 2) {
              acc[parts[0].trim()] = parseInt(parts[1].trim(), 10);
            } else {
              acc[curr.trim()] = 0;
            }
            return acc;
          }, {} as Record<string, number>)
        : undefined,
      attributes: abilities,
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
      speed: speed.trim() || undefined,
      attacks: attacks.length > 0 ? attacks : undefined,
      actions: actions.length > 0 ? actions : undefined,
      spells: spellsList.trim()
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

    // Serialize Markdown content
    const contentMarkdown = `# ${name.trim()} • Nível ${level}
> ${subtitle.trim() || `Perigo (${perilKind}) de nível ${level} no mundo de Hecos.`}

---

${description.trim() || summary.trim() || 'Sem descrição cadastrada.'}

${hecosLore.trim() ? `\n### Lore & Ecologia em Hecos\n${hecosLore.trim()}\n` : ''}
${gmNotes.trim() ? `\n:::gm\n**Notas do Mestre (Segredos & Revelações):**\n${gmNotes.trim()}\n:::\n` : ''}
`;

    // Construct entity without default pf2e tag
    const entityId = `peril-${Date.now()}`;
    const newEntity: HecosEntity = {
      id: entityId,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: name.trim(),
      subtitle: subtitle.trim() || `Nível ${level} • ${perilKind === 'monster' ? 'Monstro' : 'Hazard / Armadilha'}`,
      category: 'creature',
      subcategory: 'Perigos',
      tags: [
        'Perigo',
        perilKind === 'monster' ? 'Monstro' : 'Armadilha',
        `Nível ${level}`,
        ...cleanTraits
      ],
      summary: summary.trim() || description.slice(0, 140) || `Perigo de nível ${level}.`,
      content: contentMarkdown,
      coverImage: coverImage.trim() || undefined,
      icon: perilKind === 'monster' ? 'Skull' : 'AlertTriangle',
      createdAt: new Date().toISOString(),
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
        speed,
        senses
      }
    };

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
          title={`Visibilidade do campo "${label}": ${
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

  return (
    <div
      id="peril-create-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="peril-create-modal-container"
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0915] border border-rose-900/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#120e20]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 shadow-md">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Criar Novo Perigo (Monstro / Hazard)
              </h2>
              <p className="text-xs text-zinc-400">
                Sistema avançado de PF2e com controle de revelação por campo (Olhinho do GM).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-zinc-800/80 px-6 bg-[#0e0a19] overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'basics'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Skull className="w-4 h-4" />
            Dados Básicos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('defenses')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'defenses'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Defesas & Sentidos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attacks')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'attacks'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            Ataques & Ações ({attacks.length + actions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hazard')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'hazard'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Mecânicas de Perigo / Armadilha
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lore')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lore'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Lore & Segredos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visibility')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'visibility'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            Matriz de Revelação
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Tipo de Perigo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'monster', label: 'Monstro', icon: Skull, desc: 'Criatura de combate' },
                    { id: 'hazard_simple', label: 'Perigo Simples', icon: AlertTriangle, desc: 'Armadilha reativa (1 uso)' },
                    { id: 'hazard_complex', label: 'Perigo Complexo', icon: Zap, desc: 'Rola iniciativa e rotina' },
                    { id: 'environmental', label: 'Ambiental', icon: Flame, desc: 'Clima, gás, abismo' },
                    { id: 'haunt', label: 'Assombração', icon: Ghost, desc: 'Perigo espiritual / oculto' }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = perilKind === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPerilKind(t.id as PerilKind)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/50'
                            : 'bg-[#110d1f] border-zinc-800 text-zinc-400 hover:bg-[#181329] hover:text-zinc-200'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-rose-400' : 'text-zinc-500'}`} />
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[10px] text-zinc-500 line-clamp-1">{t.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Nome do Perigo <span className="text-rose-400">*</span>
                    </label>
                    {renderFieldEye('name', 'Nome')}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Devorador de Almas de Hecos, Fosso de Lâminas Rúnicas..."
                    className="w-full px-3.5 py-2 text-sm bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Nível (-1 a 25)
                    </label>
                    {renderFieldEye('level', 'Nível')}
                  </div>
                  <input
                    type="number"
                    value={level}
                    onChange={(e) => setLevel(parseInt(e.target.value, 10) || 0)}
                    min={-1}
                    max={25}
                    className="w-full px-3.5 py-2 text-sm bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Subtitle & Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Subtítulo / Epíteto
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Guardião das ruínas de obsidiana..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Resumo Curto
                  </label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Breve frase exibida nos cards..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Rarity, Size, Traits, Stealth */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#110d1f] p-3.5 rounded-2xl border border-zinc-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Raridade
                  </label>
                  <select
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                  >
                    <option value="Comum">Comum</option>
                    <option value="Incomum">Incomum</option>
                    <option value="Raro">Raro</option>
                    <option value="Único">Único</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Tamanho
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                  >
                    <option value="Tiny">Minúsculo (Tiny)</option>
                    <option value="Small">Pequeno (Small)</option>
                    <option value="Medium">Médio (Medium)</option>
                    <option value="Large">Grande (Large)</option>
                    <option value="Huge">Enorme (Huge)</option>
                    <option value="Gargantuan">Gargantuesco</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-400">
                      Traços & Tipos PF2e (Traits)
                    </label>
                    {renderFieldEye('typeAndTraits', 'Traços')}
                  </div>
                  <TraitInputCombobox
                    selectedTraits={traitsInput.split(',').map((t) => t.trim()).filter(Boolean)}
                    onChange={(newTraits) => setTraitsInput(newTraits.join(', '))}
                    placeholder="Buscar ou criar traço (ex: Humanoide, Morto-vivo, Aberração, Mecânico, Veneno)..."
                    defaultCategory="Criaturas e Perigos"
                  />
                </div>
              </div>

              {/* Stealth / Perception to spot */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Furtividade / CD de Percepção para Notar
                </label>
                <input
                  type="text"
                  value={stealthCheck}
                  onChange={(e) => setStealthCheck(e.target.value)}
                  placeholder="Ex: Furtividade +15 (especialista) ou Percepção CD 22 para notar runas gravadas..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Imagem de Capa / Token
                </label>
                <ImageUploadInput
                  value={coverImage}
                  onChange={setCoverImage}
                  placeholder="URL da ilustração ou faça upload..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: DEFENSES & STATS */}
          {activeTab === 'defenses' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Perception & Senses */}
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Percepção & Sentidos
                  </h3>
                  {renderFieldEye('sensesAndPerception', 'Percepção')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Percepção (+bônus)
                    </label>
                    <input
                      type="number"
                      value={perception}
                      onChange={(e) => setPerception(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Sentidos Especiais
                    </label>
                    <input
                      type="text"
                      value={senses}
                      onChange={(e) => setSenses(e.target.value)}
                      placeholder="Visão no escuro, Faro impreciso 9m, Sentido sísmico..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Idiomas
                    </label>
                    <input
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      placeholder="Comum, Necril, Aklo..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Perícias (+bônus)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="Atletismo +12, Acrobacia +9, Ladinagem +14..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Ability Modifiers */}
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Modificadores de Atributo
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                  {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((attr) => (
                    <div key={attr} className="bg-black/50 p-2 rounded-xl border border-zinc-800">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">{attr}</div>
                      <input
                        type="number"
                        value={abilities[attr]}
                        onChange={(e) =>
                          setAbilities({
                            ...abilities,
                            [attr]: parseInt(e.target.value, 10) || 0
                          })
                        }
                        className="w-full text-center bg-transparent font-bold text-sm text-zinc-100 mt-1 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Defenses: AC, Saves, HP */}
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-400" />
                    Defesas & Salvamentos
                  </h3>
                  <div className="flex items-center gap-2">
                    {renderFieldEye('acAndDefenses', 'CA & Saves')}
                    {renderFieldEye('hpAndHealth', 'PV')}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Classe de Armadura (CA)
                    </label>
                    <input
                      type="number"
                      value={ac}
                      onChange={(e) => setAc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Fortitude (+bônus)
                    </label>
                    <input
                      type="number"
                      value={fort}
                      onChange={(e) => setFort(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Reflexos (+bônus)
                    </label>
                    <input
                      type="number"
                      value={refSave}
                      onChange={(e) => setRefSave(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Vontade (+bônus)
                    </label>
                    <input
                      type="number"
                      value={will}
                      onChange={(e) => setWill(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Pontos de Vida (HP)
                    </label>
                    <input
                      type="number"
                      value={hp}
                      onChange={(e) => setHp(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-rose-300 font-bold"
                    />
                  </div>
                </div>

                {/* Hardness & BT for hazards/objects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Dureza (Hardness - para objetos e armadilhas)
                      </label>
                      {renderFieldEye('hardnessAndBT', 'Dureza')}
                    </div>
                    <input
                      type="number"
                      value={hardness}
                      onChange={(e) => setHardness(e.target.value)}
                      placeholder="Ex: 8"
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Limite de Quebra (BT)
                    </label>
                    <input
                      type="number"
                      value={brokenThreshold}
                      onChange={(e) => setBrokenThreshold(e.target.value)}
                      placeholder="Ex: 16"
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>
                </div>

                {/* Immunities, Weaknesses, Resistances */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Imunidades
                      </label>
                      {renderFieldEye('immunities', 'Imunidades')}
                    </div>
                    <input
                      type="text"
                      value={immunitiesInput}
                      onChange={(e) => setImmunitiesInput(e.target.value)}
                      placeholder="Sangramento, Veneno, Morte..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-400">
                        Fraquezas
                      </label>
                      {renderFieldEye('weaknessesAndResistances', 'Fraquezas')}
                    </div>
                    <input
                      type="text"
                      value={weaknessesInput}
                      onChange={(e) => setWeaknessesInput(e.target.value)}
                      placeholder="Fogo 5, Prata 10..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Resistências
                    </label>
                    <input
                      type="text"
                      value={resistancesInput}
                      onChange={(e) => setResistancesInput(e.target.value)}
                      placeholder="Físico 5 (exceto cortante), Frio 5..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTACKS & COMBAT ACTIONS */}
          {activeTab === 'attacks' && (
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

              {/* Strikes (Ataques) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-rose-400" />
                      Golpes & Ataques
                    </h3>
                    {renderFieldEye('attacksAndDamage', 'Ataques')}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddAttack('melee')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Melee
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddAttack('ranged')}
                      className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Ranged
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
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded"
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
                        placeholder="Nome do ataque (ex: Mordida, Arco de Espinhos)"
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
                        placeholder="Traços (ex: Ágil, Desarmado, Venenoso)"
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
                        placeholder="Efeitos extras (ex: Agarrar, Veneno de Hecos CD 18)"
                        className="px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Combat Actions & Abilities */}
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
                    onClick={handleAddAction}
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
                          placeholder="Nome da Habilidade (ex: Sopro Eclipsado)"
                          className="px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAction(act.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded"
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
                      placeholder="Descrição mecânica e efeito da ação..."
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HAZARD MECHANICS */}
          {activeTab === 'hazard' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Desativação & Desarme (Disable)
                  </h3>
                  {renderFieldEye('disableAndReset', 'Desativação')}
                </div>

                <textarea
                  value={disable}
                  onChange={(e) => setDisable(e.target.value)}
                  rows={3}
                  placeholder="Ex: Ladinagem CD 22 (especialista) para travar os contrapesos, ou Arcanismo CD 20 (treinado) para dissipar os círculos rúnicos..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Rotina de Hazard Complexo (Complex Routine)
                  </h3>
                  {renderFieldEye('routine', 'Rotina')}
                </div>

                <textarea
                  value={routine}
                  onChange={(e) => setRoutine(e.target.value)}
                  rows={3}
                  placeholder="Ex: Rotina (3 ações): No seu turno na iniciativa, o perigo dispara 2 dardos envenenados contra alvos na sala e estende a névoa tóxica em 1,5m..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Condição de Reset / Reinício
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

          {/* TAB 5: LORE & SECRETS */}
          {activeTab === 'lore' && (
            <div className="space-y-4 animate-in fade-in duration-150">
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
                  placeholder="Descreva a aparência visual, o som dos passos, o cheiro de ozônio ou a atmosfera que o perigo transmite..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Ecologia & Lore no Cenário de Hecos
                </label>
                <textarea
                  value={hecosLore}
                  onChange={(e) => setHecosLore(e.target.value)}
                  rows={3}
                  placeholder="Como esta criatura ou perigo se relaciona com o eclipse, as cidades de obsidiana e as ordens do mundo..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="bg-[#180e22] p-4 rounded-2xl border border-purple-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-purple-400" />
                    Notas Secretas do Mestre (GM Scratchpad)
                  </label>
                  {renderFieldEye('gmNotes', 'Notas GM')}
                </div>
                <textarea
                  value={gmNotes}
                  onChange={(e) => setGmNotes(e.target.value)}
                  rows={3}
                  placeholder="Táticas de combate, itens que a criatura carrega, segredos sobre sua criação..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-purple-800/60 rounded-xl text-purple-200 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 6: VISIBILITY MATRIX (MATRIZ DE REVELAÇÃO) */}
          {activeTab === 'visibility' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#110d1f] border border-zinc-800 space-y-2">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  Matriz de Revelação Progressiva de Estatísticas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Defina o que os jogadores podem enxergar na ficha do monstro. Você pode revelar informações gradualmente durante a sessão conforme os jogadores passam em testes de Recordar Conhecimento (Recall Knowledge) ou atacam o perigo!
                </p>
              </div>

              {/* Grid of all field permissions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'name', label: 'Nome do Perigo' },
                  { key: 'level', label: 'Nível / Nível de Ameaça' },
                  { key: 'typeAndTraits', label: 'Traços & Tipo' },
                  { key: 'description', label: 'Descrição Geral' },
                  { key: 'sensesAndPerception', label: 'Percepção & Sentidos' },
                  { key: 'acAndDefenses', label: 'Classe de Armadura & Salvamentos' },
                  { key: 'hpAndHealth', label: 'Pontos de Vida (HP)' },
                  { key: 'hardnessAndBT', label: 'Dureza & Limite de Quebra' },
                  { key: 'weaknessesAndResistances', label: 'Fraquezas & Resistências' },
                  { key: 'immunities', label: 'Imunidades' },
                  { key: 'attacksAndDamage', label: 'Golpes & Dados de Dano' },
                  { key: 'actionsAndAbilities', label: 'Ações Especiais & Reações' },
                  { key: 'disableAndReset', label: 'CD de Desativação & Desarme' },
                  { key: 'routine', label: 'Rotina de Combate' },
                  { key: 'spells', label: 'Magias Inatas' },
                  { key: 'gmNotes', label: 'Notas Secretas do Mestre' }
                ].map((item) => {
                  const k = item.key as keyof PerilFieldVisibility;
                  const vis = fieldVis[k] || 'gm';
                  return (
                    <div
                      key={k}
                      className="p-3 rounded-xl bg-[#140f26] border border-zinc-800/80 flex items-center justify-between"
                    >
                      <span className="text-xs font-semibold text-zinc-200">{item.label}</span>
                      <div className="flex items-center gap-2">
                        {renderFieldEye(k, item.label)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Article global visibility */}
              <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-200">Visibilidade Geral do Artigo</div>
                  <div className="text-[11px] text-zinc-500">Se 'Oculto', apenas o GM vê o card na lista</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setArticleVisibility('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      articleVisibility === 'all'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Público
                  </button>
                  <button
                    type="button"
                    onClick={() => setArticleVisibility('gm')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      articleVisibility === 'gm'
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
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-[#120e20] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Salvar Perigo
          </button>
        </div>
      </div>
    </div>
  );
};
