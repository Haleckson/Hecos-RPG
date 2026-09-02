import React, { useState, useMemo } from 'react';
import { HecosEntity, ClassAttributes } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { ClassFeatListItem } from './ClassFeatListItem';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Swords,
  Layers,
  Shield,
  Heart,
  Brain,
  Sparkles,
  Award,
  BookOpen,
  Edit3,
  ChevronRight,
  Zap,
  CheckCircle2,
  FileText,
  GraduationCap,
  Users,
  Compass,
  Clock,
  Sparkle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface ClassViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const ClassView: React.FC<ClassViewProps> = ({
  entity,
  onEdit,
  onNavigate,
  onTagClick
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm' || HecosStorage.getGmMode();

  const classData = entity.classData;
  const isVocation =
    classData?.kind === 'vocation' ||
    entity.subcategory === 'Vocações' ||
    (entity.tags || []).some((t) => t.toLowerCase() === 'vocação' || t.toLowerCase() === 'vocation');
  const isClass =
    (entity.category === 'class' || classData?.kind === 'class') && !isVocation;
  const isArchetype =
    (entity.category === 'archetype' || classData?.kind === 'archetype') && !isVocation;

  const [activeTab, setActiveTab] = useState<
    'sheet' | 'features' | 'subclasses' | 'vocation' | 'lore'
  >(isVocation ? 'vocation' : 'sheet');

  const allEntities = useMemo(() => HecosStorage.getEntities(), []);

  // Helper to find entity by title or slug for trainer NPCs and Quests
  const findEntityByTitleOrSlug = (nameOrTitle: string) => {
    const clean = nameOrTitle.trim().toLowerCase();
    return allEntities.find(
      (e) =>
        e.id === nameOrTitle ||
        e.title.toLowerCase() === clean ||
        e.slug?.toLowerCase() === clean
    );
  };

  return (
    <div id="class-view-container" className="space-y-6 max-w-4xl mx-auto text-zinc-200">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-[#0f0a1c] border border-purple-900/40 overflow-hidden shadow-2xl">
        {entity.coverImage && (
          <div className="relative h-64 w-full overflow-hidden border-b border-zinc-800">
            <AdjustableImage
              src={entity.coverImage}
              alt={entity.title}
              imageKey={`class-cover-${entity.id}`}
              isGm={isActualGm}
              containerClassName="relative w-full h-full overflow-hidden"
              imgClassName="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1c] via-[#0f0a1c]/60 to-transparent pointer-events-none" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {isVocation ? (
                <span className="px-3 py-1 rounded-xl bg-teal-950 text-teal-300 border border-teal-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
                  Vocação
                </span>
              ) : isArchetype ? (
                <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Arquétipo
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-blue-950 text-blue-300 border border-blue-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Swords className="w-3.5 h-3.5 text-blue-400" />
                  Classe
                </span>
              )}

              {sortTraitsHierarchically(
                [
                  ...(classData?.traits || []),
                  ...(entity.traits || []),
                ],
                { rarity: classData?.rarity || 'Comum' }
              ).map((trait) => (
                <TraitBadge key={trait} trait={trait} />
              ))}
            </div>

            {onEdit && isActualGm && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                Editar {isClass ? 'Classe' : isVocation ? 'Vocação' : 'Arquétipo'}
              </button>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-black text-zinc-100 tracking-tight">
              {entity.title}
            </h1>
            {entity.subtitle && (
              <p className="text-sm text-zinc-400 mt-1">{entity.subtitle}</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {(entity.tags || []).map((tag, idx) => (
              <span
                key={idx}
                onClick={() => onTagClick(tag)}
                className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-mono hover:border-purple-500/50 cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800 px-2 gap-2 text-xs font-semibold overflow-x-auto">
        {isClass && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'sheet'
                  ? 'border-blue-500 text-blue-300 bg-[#0c1424]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Ficha de Proficiências
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'features'
                  ? 'border-blue-500 text-blue-300 bg-[#0c1424]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Award className="w-4 h-4" />
              Características ({classData?.features?.length || 0})
            </button>

            {classData?.subclasses && classData.subclasses.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('subclasses')}
                className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'subclasses'
                    ? 'border-blue-500 text-blue-300 bg-[#0c1424]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Subclasses ({classData.subclasses.length})
              </button>
            )}
          </>
        )}

        {isArchetype && (
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sheet'
                ? 'border-purple-500 text-purple-300 bg-[#140e24]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Dedicação & Talentos
          </button>
        )}

        {isVocation && (
          <button
            type="button"
            onClick={() => setActiveTab('vocation')}
            className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'vocation'
                ? 'border-teal-500 text-teal-300 bg-[#0c181a]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Trilha de Evolução
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('lore')}
          className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'lore'
              ? 'border-purple-500 text-purple-300 bg-[#120e20]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Descrição & Lore
        </button>
      </div>

      {/* TAB 1: TECHNICAL SHEET (CLASSES & ARCHETYPES) */}
      {activeTab === 'sheet' && isClass && (
        <div className="rounded-3xl bg-[#0b0814] border border-zinc-800/80 p-6 space-y-6 shadow-xl animate-in fade-in duration-150">
          {/* Initial Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#140f26] p-3.5 rounded-2xl border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono text-rose-400 mb-1">
                <Heart className="w-3.5 h-3.5" /> Pontos de Vida
              </div>
              <div className="text-lg font-black text-rose-200">
                {classData?.hpPerLevel || 8} + Con
              </div>
              <div className="text-[10px] text-zinc-500">por nível</div>
            </div>

            <div className="bg-[#140f26] p-3.5 rounded-2xl border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono text-purple-400 mb-1">
                <Brain className="w-3.5 h-3.5" /> Atributo-Chave
              </div>
              <div className="text-sm font-bold text-zinc-100 mt-1">
                {classData?.keyAttribute || 'Força ou Destreza'}
              </div>
            </div>

            <div className="bg-[#140f26] p-3.5 rounded-2xl border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono text-cyan-400 mb-1">
                <Shield className="w-3.5 h-3.5" /> Percepção
              </div>
              <div className="text-sm font-bold text-zinc-100 mt-1">
                {classData?.perceptionProficiency || 'Treinado'}
              </div>
            </div>

            <div className="bg-[#140f26] p-3.5 rounded-2xl border border-zinc-800 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono text-amber-400 mb-1">
                <Zap className="w-3.5 h-3.5" /> CD de Classe
              </div>
              <div className="text-sm font-bold text-zinc-100 mt-1">
                {classData?.classDcProficiency || 'Treinado'}
              </div>
            </div>
          </div>

          {/* Saving Throws */}
          <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Salvamentos Iniciais
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 font-mono">Fortitude:</span>{' '}
                <strong className="text-zinc-200">
                  {classData?.savingThrows?.fortitude || 'Especialista'}
                </strong>
              </div>
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 font-mono">Reflexos:</span>{' '}
                <strong className="text-zinc-200">
                  {classData?.savingThrows?.reflex || 'Treinado'}
                </strong>
              </div>
              <div className="bg-black/50 p-2 rounded-xl border border-zinc-800">
                <span className="text-zinc-500 font-mono">Vontade:</span>{' '}
                <strong className="text-zinc-200">
                  {classData?.savingThrows?.will || 'Especialista'}
                </strong>
              </div>
            </div>
          </div>

          {/* Proficiencies breakdown */}
          <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3 text-xs">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Proficiências de Combate & Perícias
            </h3>
            <div className="space-y-2 text-zinc-300">
              <div>
                <strong className="text-zinc-100">Ataques:</strong>{' '}
                {classData?.attacksProficiency ||
                  'Treinado em armas simples e marciais, e ataques desarmados'}
              </div>
              <div>
                <strong className="text-zinc-100">Defesas & Armaduras:</strong>{' '}
                {classData?.defensesProficiency ||
                  'Treinado em armaduras leves, médias e escudos'}
              </div>
              <div>
                <strong className="text-zinc-100">Perícias Iniciais:</strong>{' '}
                {classData?.skillsProficiency ||
                  'Treinado em perícia de classe + perícias adicionais'}
              </div>
            </div>
          </div>

          {/* Spellcasting */}
          {classData?.spellcasting?.isSpellcaster && (
            <div className="p-4 rounded-2xl bg-[#140f26] border border-cyan-900/50 space-y-2 text-xs">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Conjuração de Magias
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-300">
                <div>
                  <strong className="text-zinc-100">Perícia Conjuradora:</strong>{' '}
                  {classData.spellcasting.tradition}
                </div>
                <div>
                  <strong className="text-zinc-100">Tipo:</strong>{' '}
                  {classData.spellcasting.spellType}
                </div>
                <div>
                  <strong className="text-zinc-100">Atributo-Chave:</strong>{' '}
                  {classData.spellcasting.keyAttribute}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: ARCHETYPE DEDICATION, TRAINERS & FEATS */}
      {activeTab === 'sheet' && isArchetype && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Dedication Requirements & Access */}
          <div className="p-5 rounded-3xl bg-[#0b101c] border border-cyan-900/40 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Requisitos de Entrada no Arquétipo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/40 p-3 rounded-xl border border-cyan-950">
                <span className="text-zinc-400 font-mono block mb-1">Nível de Dedicação:</span>
                <strong className="text-cyan-200 text-sm">
                  Nível {classData?.archetypeDedicationLevel || 2}
                </strong>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-cyan-950">
                <span className="text-zinc-400 font-mono block mb-1">Pré-requisitos:</span>
                <strong className="text-zinc-200">
                  {classData?.prerequisites || 'Nenhum requisito adicional'}
                </strong>
              </div>
            </div>
            {classData?.access && (
              <div className="bg-black/40 p-3 rounded-xl border border-cyan-950 text-xs">
                <span className="text-zinc-400 font-mono block mb-1">Acesso Especial:</span>
                <span className="text-zinc-200">{classData.access}</span>
              </div>
            )}
          </div>

          {/* Training NPCs & Linked Quests */}
          {((classData?.trainerNpcs && classData.trainerNpcs.length > 0) ||
            (classData?.linkedQuests && classData.linkedQuests.length > 0) ||
            classData?.trainingRequirements) && (
            <div className="p-5 rounded-3xl bg-[#140e24] border border-purple-800/50 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                Treinamento & Instrutores em Hecos
              </h3>

              {/* Trainers List */}
              {classData?.trainerNpcs && classData.trainerNpcs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    NPCs que Fornecem Treinamento:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classData.trainerNpcs.map((trainerName, idx) => {
                      const trainerEntity = findEntityByTitleOrSlug(trainerName);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (trainerEntity) onNavigate(trainerEntity.id);
                          }}
                          className={`p-2.5 rounded-xl bg-black/40 border border-purple-900/40 flex items-center justify-between gap-2 transition-all ${
                            trainerEntity
                              ? 'hover:border-purple-500/60 hover:bg-purple-950/30 cursor-pointer'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 font-bold text-xs">
                              {trainerName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-zinc-200">
                              {trainerName}
                            </span>
                          </div>
                          {trainerEntity && (
                            <ExternalLink className="w-3.5 h-3.5 text-purple-400 opacity-70" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quests List */}
              {classData?.linkedQuests && classData.linkedQuests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-purple-900/30">
                  <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    Quests / Provas de Campanha Requeridas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classData.linkedQuests.map((questName, idx) => {
                      const questEntity = findEntityByTitleOrSlug(questName);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (questEntity) onNavigate(questEntity.id);
                          }}
                          className={`p-2.5 rounded-xl bg-black/40 border border-amber-900/40 flex items-center justify-between gap-2 transition-all ${
                            questEntity
                              ? 'hover:border-amber-500/60 hover:bg-amber-950/30 cursor-pointer'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-300 font-bold text-xs">
                              Q
                            </div>
                            <span className="text-xs font-bold text-zinc-200">
                              {questName}
                            </span>
                          </div>
                          {questEntity && (
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400 opacity-70" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Training Narrative Requirements */}
              {classData?.trainingRequirements && (
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-xs text-zinc-300">
                  <strong className="text-purple-300">Tempo & Condições de Treino:</strong>{' '}
                  {classData.trainingRequirements}
                </div>
              )}
            </div>
          )}

          {/* Dedication Feat Card */}
          {classData?.dedicationFeat && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                Talento de Dedicação
              </h3>
              <ClassFeatListItem
                feat={{
                  level: classData.dedicationFeat.level,
                  name: classData.dedicationFeat.name,
                  title: classData.dedicationFeat.name,
                  description: classData.dedicationFeat.description,
                  prerequisites: classData.dedicationFeat.prerequisites || classData.prerequisites,
                  actionCost: classData.dedicationFeat.actionCost || 'passive',
                  traits: classData.dedicationFeat.traits || ['Arquétipo', 'Dedicação'],
                  featEntityId: classData.dedicationFeat.featEntityId
                }}
                theme="purple"
                mode="view"
                onNavigate={onNavigate}
              />
            </div>
          )}

          {/* Additional Archetype Feats */}
          {classData?.archetypeFeats && classData.archetypeFeats.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                Talentos Adicionais do Arquétipo ({classData.archetypeFeats.length})
              </h3>

              <div className="space-y-2">
                {classData.archetypeFeats.map((feat) => (
                  <ClassFeatListItem
                    key={feat.id}
                    feat={feat}
                    theme="purple"
                    mode="view"
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: VOCATION LINEAR PROGRESSION */}
      {activeTab === 'vocation' && isVocation && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Vocation Concept Overview */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-950/60 to-emerald-950/40 border border-teal-800/60 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-400" />
              <h3 className="text-xs font-bold text-teal-200 uppercase tracking-wider">
                Estrutura da Vocação
              </h3>
            </div>
            <p className="text-xs text-teal-300/80 leading-relaxed">
              Vocações concedem uma <strong>linha contínua de talentos</strong> nos
              níveis <strong className="text-teal-200">1, 3, 6, 9, 12, 15 e 18</strong>. Ao
              escolher esta vocação no 1º nível, o personagem avança por esta trilha de
              maestria durante toda a campanha.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-teal-900/40 text-xs">
              {classData?.vocationTheme && (
                <div className="bg-black/40 p-3 rounded-xl border border-teal-900/50">
                  <span className="text-zinc-400 font-mono block mb-1">Origem & Filosofia:</span>
                  <span className="text-teal-200 font-medium">{classData.vocationTheme}</span>
                </div>
              )}

              {classData?.initialBonusSkill && (
                <div className="bg-black/40 p-3 rounded-xl border border-teal-900/50">
                  <span className="text-zinc-400 font-mono block mb-1">Bônus Inicial (Nível 1):</span>
                  <span className="text-teal-200 font-medium">
                    {classData.initialBonusSkill}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progression Visual Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-teal-400" />
                Trilha de Talentos
              </h3>
              <span className="text-[11px] text-teal-300 font-mono">
                {classData?.vocationProgression?.length || 0} Talentos
              </span>
            </div>

            <div className="space-y-2.5">
              {(classData?.vocationProgression || []).map((vp) => (
                <ClassFeatListItem
                  key={vp.level}
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
                  mode="view"
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURES BY LEVEL (CLASSES) */}
      {activeTab === 'features' && isClass && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          {(classData?.features || []).map((feat) => (
            <ClassFeatListItem
              key={feat.id}
              feat={feat}
              theme="blue"
              mode="view"
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {/* TAB 3: SUBCLASSES (CLASSES) */}
      {activeTab === 'subclasses' && isClass && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {(classData?.subclasses || []).map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-2xl bg-[#0b0814] border border-zinc-800/80 space-y-2 shadow-md"
            >
              <h3 className="font-bold text-sm text-cyan-300">{sub.name}</h3>
              <div className="text-xs text-zinc-300 leading-relaxed">
                <RichContentRenderer
                  content={sub.description}
                  onNavigate={onNavigate}
                  onTagClick={onTagClick}
                />
              </div>
              {sub.grantedFeatures && (
                <div className="pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
                  <strong className="text-zinc-300">Benefícios:</strong> {sub.grantedFeatures}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB: FULL LORE */}
      {activeTab === 'lore' && (
        <div className="rounded-3xl bg-[#0b0814] border border-zinc-800/80 p-6 shadow-xl animate-in fade-in duration-150">
          <RichContentRenderer
            content={entity.content}
            onNavigate={onNavigate}
            onTagClick={onTagClick}
          />
        </div>
      )}
    </div>
  );
};
