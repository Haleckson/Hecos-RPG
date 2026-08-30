import React, { useState } from 'react';
import { HecosStorage } from '../services/storage';
import {
  HecosEntity,
  ClassAttributes,
  ClassProficiencyRank,
  ClassFeature,
  ClassSubclass,
  ClassArchetypeFeat,
  ItemVisibility
} from '../types';
import { ImageUploadInput } from './ImageUploadInput';
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
  Zap
} from 'lucide-react';

interface ClassCreateModalProps {
  isOpen: boolean;
  initialKind?: 'class' | 'archetype';
  onClose: () => void;
  onSave: (entity: HecosEntity) => void;
}

export const ClassCreateModal: React.FC<ClassCreateModalProps> = ({
  isOpen,
  initialKind = 'class',
  onClose,
  onSave
}) => {
  const [kind, setKind] = useState<'class' | 'archetype'>(initialKind);
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [rarity, setRarity] = useState<'Comum' | 'Incomum' | 'Raro' | 'Único'>('Comum');
  const [coverImage, setCoverImage] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [hecosLore, setHecosLore] = useState('');
  const [gmNotes, setGmNotes] = useState('');

  // Class Specifics
  const [hpPerLevel, setHpPerLevel] = useState<number>(8);
  const [keyAttribute, setKeyAttribute] = useState<string>('Força ou Destreza');
  const [perceptionProficiency, setPerceptionProficiency] = useState<ClassProficiencyRank>('Treinado');
  const [fortitude, setFortitude] = useState<ClassProficiencyRank>('Especialista');
  const [reflex, setReflex] = useState<ClassProficiencyRank>('Treinado');
  const [will, setWill] = useState<ClassProficiencyRank>('Especialista');
  const [skillsProficiency, setSkillsProficiency] = useState('Treinado em Atletismo + 3 + modificador de Inteligência de perícias adicionais');
  const [attacksProficiency, setAttacksProficiency] = useState('Treinado em todas as armas simples e marciais, e ataques desarmados');
  const [defensesProficiency, setDefensesProficiency] = useState('Treinado em armaduras leves, médias e escudos');
  const [classDcProficiency, setClassDcProficiency] = useState<ClassProficiencyRank>('Treinado');

  // Spellcasting
  const [isSpellcaster, setIsSpellcaster] = useState(false);
  const [spellTradition, setSpellTradition] = useState<'Arcana' | 'Divina' | 'Oculta' | 'Primal' | 'Nenhuma'>('Arcana');
  const [spellType, setSpellType] = useState<'Preparado' | 'Espontâneo' | 'Foco'>('Preparado');
  const [spellKeyAttribute, setSpellKeyAttribute] = useState('Inteligência');

  // Features by Level
  const [features, setFeatures] = useState<ClassFeature[]>([
    {
      id: 'feat-1',
      level: 1,
      name: 'Característica Inicial',
      description: 'Descrição da habilidade ganha no nível 1...',
      actionCost: '',
      traits: []
    }
  ]);

  // Subclasses
  const [subclasses, setSubclasses] = useState<ClassSubclass[]>([
    {
      id: 'sub-1',
      name: 'Doutrina / Linhagem / Disciplina',
      description: 'Especialização da classe escolhida no nível 1...',
      grantedFeatures: 'Garante proficiência extra e talentos adicionais.'
    }
  ]);

  // Archetype Specifics
  const [archetypeDedicationLevel, setArchetypeDedicationLevel] = useState<number>(2);
  const [prerequisites, setPrerequisites] = useState('Força 14 ou Treinado em Atletismo');
  const [access, setAccess] = useState('');
  const [dedicationFeatName, setDedicationFeatName] = useState('Dedicação ao Arquétipo');
  const [dedicationFeatDesc, setDedicationFeatDesc] = useState('Você ganha treinamento nas perícias e posturas do arquétipo.');
  const [archetypeFeats, setArchetypeFeats] = useState<ClassArchetypeFeat[]>([
    {
      id: 'arch-feat-1',
      level: 4,
      name: 'Técnica Avançada',
      description: 'Habilidade complementar obtida nos níveis seguintes.',
      prerequisites: 'Dedicação ao Arquétipo'
    }
  ]);

  // Visibility
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [activeTab, setActiveTab] = useState<'basics' | 'proficiencies' | 'features' | 'archetype' | 'lore'>('basics');

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

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome da Classe ou Arquétipo.');
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
      archetypeDedicationLevel: kind === 'archetype' ? archetypeDedicationLevel : undefined,
      prerequisites: kind === 'archetype' ? prerequisites : undefined,
      access: kind === 'archetype' && access ? access : undefined,
      dedicationFeat:
        kind === 'archetype'
          ? {
              id: 'dedication-feat',
              level: archetypeDedicationLevel,
              name: dedicationFeatName,
              description: dedicationFeatDesc,
              prerequisites
            }
          : undefined,
      archetypeFeats: kind === 'archetype' ? archetypeFeats : undefined,
      description,
      hecosLore,
      gmNotes
    };

    // Serialize Markdown
    const markdown = `# ${name.trim()}
> ${subtitle.trim() || (kind === 'class' ? `Classe de Hecos • ${hpPerLevel} PV` : `Arquétipo de Dedicação (Nível ${archetypeDedicationLevel})`)}

---

${description.trim() || summary.trim() || 'Sem descrição cadastrada.'}

${
  kind === 'class'
    ? `## Características Iniciais
- **🩸 Pontos de Vida (HP):** ${hpPerLevel} + Modificador de Constituição por nível
- **🧠 Atributo-Chave:** ${keyAttribute}
- **👁️ Percepção:** ${perceptionProficiency}
- **🛡️ Salvamentos:** Fortitude (${fortitude}), Reflexos (${reflex}), Vontade (${will})
- **⚔️ Ataques:** ${attacksProficiency}
- **🛡️ Defesas:** ${defensesProficiency}
- **📐 CD de Classe:** ${classDcProficiency}
- **📚 Perícias:** ${skillsProficiency}
`
    : `## Requisitos de Arquétipo
- **Nível de Dedicação:** Nível ${archetypeDedicationLevel}
- **Pré-requisitos:** ${prerequisites || 'Nenhum'}
${access ? `- **Acesso:** ${access}\n` : ''}
`
}

${hecosLore.trim() ? `\n### Lore & Filosofia em Hecos\n${hecosLore.trim()}\n` : ''}
${gmNotes.trim() ? `\n:::gm\n**Notas do Mestre:**\n${gmNotes.trim()}\n:::\n` : ''}
`;

    const entityId = `${kind}-${Date.now()}`;
    const newEntity: HecosEntity = {
      id: entityId,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: name.trim(),
      subtitle: subtitle.trim() || (kind === 'class' ? `Classe • ${hpPerLevel} PV` : `Arquétipo • Dedicação Nível ${archetypeDedicationLevel}`),
      category: kind === 'class' ? 'class' : 'archetype',
      subcategory: kind === 'class' ? 'Classes' : 'Vocação',
      tags: [
        kind === 'class' ? 'Classe' : 'Vocação',
        rarity,
        kind === 'class' ? `${hpPerLevel} PV` : `Nível ${archetypeDedicationLevel}`
      ],
      summary: summary.trim() || description.slice(0, 140) || `${kind === 'class' ? 'Classe' : 'Vocação'} de Hecos.`,
      content: markdown,
      coverImage: coverImage.trim() || undefined,
      icon: kind === 'class' ? 'Swords' : 'Layers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: visibility === 'gm',
      visibility,
      classData
    };

    HecosStorage.saveEntity(newEntity);
    onSave(newEntity);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="class-create-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div
        id="class-create-modal-container"
        className="w-[95vw] h-[95vh] max-w-[98vw] max-h-[98vh] bg-[#0c0915] border border-purple-900/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden text-zinc-100"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-[#120e20]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 shadow-md">
              {kind === 'class' ? <Swords className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Criar {kind === 'class' ? 'Nova Classe' : 'Nova Vocação (Arquétipo)'}
              </h2>
              <p className="text-xs text-zinc-400">
                Ficha estruturada de regras de Pathfinder 2e para o cenário de Hecos.
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

        {/* Modal Kind Selector & Tabs */}
        <div className="flex border-b border-zinc-800/80 px-6 bg-[#0e0a19] overflow-x-auto text-xs items-center justify-between">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'basics'
                  ? 'border-purple-500 text-purple-300 bg-purple-950/20'
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
                  className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'proficiencies'
                      ? 'border-purple-500 text-purple-300 bg-purple-950/20'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Proficiências & Magia
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('features')}
                  className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'features'
                      ? 'border-purple-500 text-purple-300 bg-purple-950/20'
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
                className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'archetype'
                    ? 'border-purple-500 text-purple-300 bg-purple-950/20'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Dedicação & Talentos ({archetypeFeats.length + 1})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('lore')}
              className={`py-3 px-4 font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'lore'
                  ? 'border-purple-500 text-purple-300 bg-purple-950/20'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Lore & Segredos
            </button>
          </div>

          {/* Kind Switcher */}
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setKind('class')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                kind === 'class'
                  ? 'bg-purple-900 text-purple-200 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Classe Base
            </button>
            <button
              type="button"
              onClick={() => setKind('archetype')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                kind === 'archetype'
                  ? 'bg-purple-900 text-purple-200 shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
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
                    Nome da {kind === 'class' ? 'Classe' : 'Vocação'} <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={kind === 'class' ? 'Ex: Guerreiro de Obsidiana, Arquimago do Eclipse...' : 'Ex: Cavaleiro das Sombras, Escriba das Marés...'}
                    className="w-full px-3.5 py-2 text-sm bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Subtítulo / Epíteto
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex: Mestres das artes marciais e canalizadores de runas..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
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
                    placeholder="Breve resumo para exibição nos cards..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {kind === 'class' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      Pontos de Vida (PV por Nível)
                    </label>
                    <select
                      value={hpPerLevel}
                      onChange={(e) => setHpPerLevel(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-rose-300 font-bold"
                    >
                      <option value={6}>6 PV + Constituição (Frágil / Conjurador)</option>
                      <option value={8}>8 PV + Constituição (Padrão / Ladino / Clérigo)</option>
                      <option value={10}>10 PV + Constituição (Combatente / Guerreiro / Campeão)</option>
                      <option value={12}>12 PV + Constituição (Robusto / Bárbaro)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      Atributo-Chave
                    </label>
                    <input
                      type="text"
                      value={keyAttribute}
                      onChange={(e) => setKeyAttribute(e.target.value)}
                      placeholder="Ex: Força ou Destreza, Sabedoria, Inteligência..."
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Imagem de Capa / Ilustração
                </label>
                <ImageUploadInput
                  value={coverImage}
                  onChange={setCoverImage}
                  placeholder="URL da arte conceitual ou faça upload..."
                  category="classe"
                  entityName={name || 'classe'}
                  role="capa"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição Geral & Filosofia
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Apresentação narrativa da classe no universo de Hecos..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFICIENCIES & SPELLCASTING (FOR CLASSES) */}
          {activeTab === 'proficiencies' && kind === 'class' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Saving Throws & Perception */}
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Salvamentos Iniciais & Percepção
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
                      <option value="Destreinado">Destreinado</option>
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
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-purple-400" />
                  Ataques, Armaduras & CD de Classe
                </h3>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Proficiência em Ataques
                    </label>
                    <input
                      type="text"
                      value={attacksProficiency}
                      onChange={(e) => setAttacksProficiency(e.target.value)}
                      placeholder="Ex: Treinado em armas simples e marciais..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Proficiência em Defesas e Armaduras
                    </label>
                    <input
                      type="text"
                      value={defensesProficiency}
                      onChange={(e) => setDefensesProficiency(e.target.value)}
                      placeholder="Ex: Treinado em armaduras leves, médias e escudos..."
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Perícias Iniciais
                      </label>
                      <input
                        type="text"
                        value={skillsProficiency}
                        onChange={(e) => setSkillsProficiency(e.target.value)}
                        placeholder="Ex: Treinado em Atletismo + 3 + Int de perícias..."
                        className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spellcasting Setup */}
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Conjuração de Magias (Opcional)
                  </h3>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isSpellcaster}
                      onChange={(e) => setIsSpellcaster(e.target.checked)}
                      className="rounded border-zinc-700 bg-black/60 text-purple-600 focus:ring-0"
                    />
                    É Conjurador de Magias
                  </label>
                </div>

                {isSpellcaster && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                        Tradição Mágica
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
                        className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FEATURES & SUBCLASSES (FOR CLASSES) */}
          {activeTab === 'features' && kind === 'class' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Features by Level */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    Características de Classe por Nível
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Nova Habilidade
                  </button>
                </div>

                {features.map((feat, index) => (
                  <div
                    key={feat.id}
                    className="p-3.5 rounded-2xl bg-[#110d1f] border border-zinc-800/80 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 font-mono">Nível</span>
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
                            className="w-10 text-center text-xs font-bold text-purple-300 bg-transparent focus:outline-none"
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
                          placeholder="Nome da Habilidade (ex: Ataque Poderoso, Fúria Espiritual)"
                          className="flex-1 px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feat.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      value={feat.description}
                      onChange={(e) => {
                        const updated = [...features];
                        updated[index].description = e.target.value;
                        setFeatures(updated);
                      }}
                      rows={2}
                      placeholder="Descrição dos efeitos mecânicos..."
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Subclasses */}
              <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Subclasses / Doutrinas / Ordens
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddSubclass}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Nova Subclasse
                  </button>
                </div>

                {subclasses.map((sub, index) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-2xl bg-[#110d1f] border border-zinc-800/80 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...subclasses];
                          updated[index].name = e.target.value;
                          setSubclasses(updated);
                        }}
                        placeholder="Nome da Doutrina / Linhagem"
                        className="w-full max-w-sm px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-cyan-300 font-semibold"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveSubclass(sub.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded"
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
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHETYPE (FOR ARCHETYPES) */}
          {activeTab === 'archetype' && kind === 'archetype' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Dedication Feat Header */}
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Talento de Dedicação (Entrada no Arquétipo)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Nível do Talento de Dedicação
                    </label>
                    <select
                      value={archetypeDedicationLevel}
                      onChange={(e) => setArchetypeDedicationLevel(parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-purple-300 font-bold"
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
                      className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                  <input
                    type="text"
                    value={dedicationFeatName}
                    onChange={(e) => setDedicationFeatName(e.target.value)}
                    placeholder="Nome do Talento de Dedicação (ex: Dedicação ao Guarda de Obsidiana)"
                    className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold"
                  />

                  <textarea
                    value={dedicationFeatDesc}
                    onChange={(e) => setDedicationFeatDesc(e.target.value)}
                    rows={2}
                    placeholder="Efeito e benefícios conferidos ao escolher a dedicação..."
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                  />
                </div>
              </div>

              {/* Additional Archetype Feats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    Talentos Adicionais do Arquétipo
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddArchetypeFeat}
                    className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Novo Talento
                  </button>
                </div>

                {archetypeFeats.map((feat, index) => (
                  <div
                    key={feat.id}
                    className="p-3.5 rounded-2xl bg-[#110d1f] border border-zinc-800/80 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-lg border border-zinc-800">
                          <span className="text-[10px] text-zinc-500 font-mono">Nível</span>
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
                            className="w-10 text-center text-xs font-bold text-cyan-300 bg-transparent focus:outline-none"
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
                          className="flex-1 px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-100 font-semibold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveArchetypeFeat(feat.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                      className="w-full px-2.5 py-1 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-400"
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
                      className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: LORE & SECRETS */}
          {activeTab === 'lore' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-[#110d1f] p-4 rounded-2xl border border-zinc-800/80 space-y-2">
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Lore & Conexão com o Cenário de Hecos
                </label>
                <textarea
                  value={hecosLore}
                  onChange={(e) => setHecosLore(e.target.value)}
                  rows={3}
                  placeholder="Como esta classe ou arquétipo se insere na história, guildas ou ordens místicas de Hecos..."
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none"
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
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-purple-800/60 rounded-xl text-purple-200 focus:outline-none"
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
                        ? 'bg-purple-950 text-purple-300 border-purple-700'
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
            className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/60 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Salvar {kind === 'class' ? 'Classe' : 'Arquétipo'}
          </button>
        </div>
      </div>
    </div>
  );
};
