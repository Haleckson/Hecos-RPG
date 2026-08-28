import React, { useState } from 'react';
import { HecosEntity, ClassAttributes } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
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
  FileText
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
  const isClass = entity.category === 'class' || classData?.kind === 'class';
  const isArchetype = entity.category === 'archetype' || classData?.kind === 'archetype';

  const [activeTab, setActiveTab] = useState<'sheet' | 'features' | 'subclasses' | 'lore'>('sheet');

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
              <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                {isClass ? <Swords className="w-3.5 h-3.5 text-purple-400" /> : <Layers className="w-3.5 h-3.5 text-cyan-400" />}
                {isClass ? 'Classe de Personagem' : 'Vocação (Arquétipo)'}
              </span>

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
                Editar {isClass ? 'Classe' : 'Vocação'}
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
        <button
          type="button"
          onClick={() => setActiveTab('sheet')}
          className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'sheet'
              ? 'border-purple-500 text-purple-300 bg-[#120e20]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          {isClass ? 'Ficha de Proficiências' : 'Requisitos & Dedicação'}
        </button>

        {isClass && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('features')}
              className={`py-2.5 px-4 rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'features'
                  ? 'border-purple-500 text-purple-300 bg-[#120e20]'
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
                    ? 'border-purple-500 text-purple-300 bg-[#120e20]'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                Subclasses ({classData.subclasses.length})
              </button>
            )}
          </>
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
          Descrição Completa
        </button>
      </div>

      {/* TAB 1: TECHNICAL SHEET */}
      {activeTab === 'sheet' && (
        <div className="rounded-3xl bg-[#0b0814] border border-zinc-800/80 p-6 space-y-6 shadow-xl animate-in fade-in duration-150">
          {isClass && (
            <>
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
                    <strong className="text-zinc-200">{classData?.savingThrows?.fortitude || 'Especialista'}</strong>
                  </div>
                  <div className="bg-black/50 p-2 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 font-mono">Reflexos:</span>{' '}
                    <strong className="text-zinc-200">{classData?.savingThrows?.reflex || 'Treinado'}</strong>
                  </div>
                  <div className="bg-black/50 p-2 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 font-mono">Vontade:</span>{' '}
                    <strong className="text-zinc-200">{classData?.savingThrows?.will || 'Especialista'}</strong>
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
                    {classData?.attacksProficiency || 'Treinado em armas simples e marciais, e ataques desarmados'}
                  </div>
                  <div>
                    <strong className="text-zinc-100">Defesas & Armaduras:</strong>{' '}
                    {classData?.defensesProficiency || 'Treinado em armaduras leves, médias e escudos'}
                  </div>
                  <div>
                    <strong className="text-zinc-100">Perícias Iniciais:</strong>{' '}
                    {classData?.skillsProficiency || 'Treinado em perícia de classe + perícias adicionais'}
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
                      <strong className="text-zinc-100">Tradição:</strong> {classData.spellcasting.tradition}
                    </div>
                    <div>
                      <strong className="text-zinc-100">Tipo:</strong> {classData.spellcasting.spellType}
                    </div>
                    <div>
                      <strong className="text-zinc-100">Atributo-Chave:</strong> {classData.spellcasting.keyAttribute}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isArchetype && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#120e20] border border-purple-900/40 space-y-2">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Requisitos de Entrada no Arquétipo
                </h3>
                <div className="space-y-1 text-zinc-300">
                  <div>
                    <strong className="text-zinc-100">Nível Mínimo de Dedicação:</strong> Nível {classData?.archetypeDedicationLevel || 2}
                  </div>
                  <div>
                    <strong className="text-zinc-100">Pré-requisitos:</strong> {classData?.prerequisites || 'Nenhum'}
                  </div>
                  {classData?.access && (
                    <div>
                      <strong className="text-zinc-100">Acesso:</strong> {classData.access}
                    </div>
                  )}
                </div>
              </div>

              {classData?.dedicationFeat && (
                <div className="p-4 rounded-2xl bg-[#140f26] border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-100">
                      {classData.dedicationFeat.name} [Talento {classData.dedicationFeat.level}]
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      Dedicação
                    </span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{classData.dedicationFeat.description}</p>
                </div>
              )}

              {classData?.archetypeFeats && classData.archetypeFeats.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Talentos Adicionais do Arquétipo
                  </h3>
                  {(classData?.archetypeFeats || []).map((feat) => (
                    <div key={feat.id} className="p-3.5 rounded-xl bg-[#120e20] border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100">
                          {feat.name} [Talento {feat.level}]
                        </span>
                        {feat.prerequisites && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Pré-req: {feat.prerequisites}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 leading-relaxed">{feat.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FEATURES BY LEVEL (CLASSES) */}
      {activeTab === 'features' && isClass && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {(classData?.features || []).map((feat) => (
            <div
              key={feat.id}
              className="p-4 rounded-2xl bg-[#0b0814] border border-zinc-800/80 space-y-2 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-xs">
                    Nível {feat.level}
                  </span>
                  <h3 className="font-bold text-sm text-zinc-100">{feat.name}</h3>
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{feat.description}</p>
            </div>
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
              <p className="text-xs text-zinc-300 leading-relaxed">{sub.description}</p>
              {sub.grantedFeatures && (
                <div className="pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
                  <strong className="text-zinc-300">Benefícios:</strong> {sub.grantedFeatures}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: FULL LORE */}
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
