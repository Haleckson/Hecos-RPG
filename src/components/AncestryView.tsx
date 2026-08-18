import React, { useState, useMemo } from 'react';
import { HecosEntity, AncestryAttributes } from '../types';
import { RichContentRenderer } from './RichContentRenderer';
import { renderContentWithMentions } from './MentionBadge';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { parseAncestryFromContent } from '../utils/ancestrySerializer';
import {
  Swords,
  Dna,
  Sparkles,
  Shield,
  Compass,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Heart,
  Eye,
  Activity,
  Zap,
  HelpCircle,
  Clock,
  Copy,
  Check,
  Crown,
  Scale,
  ShieldAlert,
  Globe,
  Users,
  Feather
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AncestryViewProps {
  entity: HecosEntity;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const AncestryView: React.FC<AncestryViewProps> = ({
  entity,
  onNavigate,
  onTagClick,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'mechanics' | 'lore' | 'gm'>('mechanics');
  const [activeFeatRank, setActiveFeatRank] = useState<1 | 5 | 9 | 13 | 17 | 'all'>('all');
  const [copiedStatblock, setCopiedStatblock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Structured Ancestry Data parsed from entity.ancestryData or content
  const data: AncestryAttributes = useMemo(() => {
    return parseAncestryFromContent(entity.title, entity.content || '', entity.ancestryData);
  }, [entity.title, entity.content, entity.ancestryData]);

  const copyStatblockText = () => {
    const text = `=== ${entity.title.toUpperCase()} ===
HP: ${data.hp || '8 PV'} | TAMANHO: ${data.size || 'Médio'} | VELOCIDADE: ${data.speed || '25 pés'}
SENTIDOS: ${data.senses || 'Visão na Penumbra'}
ATRIBUTOS: ${data.attributes || '+2 Des, +2 Int, +2 Livre, -2 For'}
TRAÇOS: ${data.traits || 'Humanoide'}
INATO: ${data.innate || '—'}
IDIOMAS: ${data.languages || 'Humani'}`;
    navigator.clipboard.writeText(text);
    setCopiedStatblock(true);
    setTimeout(() => setCopiedStatblock(false), 2000);
  };

  const getFeatsByRank = (rank: 1 | 5 | 9 | 13 | 17) => {
    const key = `rank${rank}` as keyof typeof data.feats;
    return data.feats?.[key] || [];
  };

  return (
    <div className="space-y-6 text-zinc-100 font-sans w-full max-w-full overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CABEÇALHO DA ANCESTRALIDADE (ESTRUTURA PF2E HECOS) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0f0e17] border border-[#2d3a42] shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2d3a42]/70">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#74b6c2] tracking-tight font-serif break-words">
              {entity.title || '[NOME DA ANCESTRALIDADE]'}
            </h2>
            {entity.subtitle && (
              <p className="text-xs sm:text-sm text-[#b19ecc] font-medium mt-1 break-words">
                {entity.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyStatblockText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141220] hover:bg-[#1a172c] border border-[#74b6c2]/40 text-[#74b6c2] text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar cabeçalho da ficha"
            >
              {copiedStatblock ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStatblock ? 'Copiado!' : 'Copiar Ficha'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 pt-4 text-sm">
          {/* Row 1: HP & TAMANHO */}
          <div className="flex items-baseline gap-2 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#cb8394] shrink-0">🩸 HP:</span>
            <span className="text-zinc-200 flex-1 min-w-0">
              {renderContentWithMentions(data.hp || '8 PV', onNavigate)}
            </span>
          </div>
          <div className="flex items-baseline gap-2 md:border-l md:border-[#2d3a42]/60 md:pl-5 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#74b6c2] shrink-0">📏 TAMANHO:</span>
            <span className="text-zinc-200 flex-1 min-w-0">
              {renderContentWithMentions(data.size || 'Médio', onNavigate)}
            </span>
          </div>

          {/* Row 2: VELOCIDADE & SENTIDOS */}
          <div className="flex items-baseline gap-2 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#b19ecc] shrink-0">🏃 VELOCIDADE:</span>
            <span className="text-zinc-200 flex-1 min-w-0">
              {renderContentWithMentions(data.speed || '25 pés (≈ 7,5 m)', onNavigate)}
            </span>
          </div>
          <div className="flex items-baseline gap-2 md:border-l md:border-[#2d3a42]/60 md:pl-5 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#74b6c2] shrink-0">👁️ SENTIDOS:</span>
            <span className="text-[#88c5d0] font-medium flex-1 min-w-0">
              {renderContentWithMentions(data.senses || 'Visão na Penumbra', onNavigate)}
            </span>
          </div>

          {/* Row 3: ATRIBUTOS & TRAÇOS */}
          <div className="flex items-baseline gap-2 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#cfb284] shrink-0">🧠 ATRIBUTOS:</span>
            <span className="text-zinc-200 font-mono text-xs sm:text-sm flex-1 min-w-0">
              {renderContentWithMentions(data.attributes || '+2 Des, +2 Int, +2 Livre, -2 For', onNavigate)}
            </span>
          </div>
          <div className="flex items-baseline gap-2 md:border-l md:border-[#2d3a42]/60 md:pl-5 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#b19ecc] shrink-0">🏷️ TRAÇOS:</span>
            <span className="text-zinc-200 flex-1 min-w-0">
              {renderContentWithMentions(data.traits || 'Humanoide', onNavigate)}
            </span>
          </div>

          {/* Row 4: INATO & IDIOMAS */}
          <div className="flex items-baseline gap-2 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#74b6c2] shrink-0">🛠️ INATO:</span>
            <span className="text-zinc-200 flex-1 min-w-0">
              {renderContentWithMentions(data.innate || '—', onNavigate)}
            </span>
          </div>
          <div className="flex items-baseline gap-2 md:border-l md:border-[#2d3a42]/60 md:pl-5 min-w-0 break-words leading-relaxed">
            <span className="font-bold text-[#b19ecc] shrink-0">🗣️ IDIOMAS:</span>
            <span className="text-zinc-200 flex-1 min-w-0">
              {renderContentWithMentions(data.languages || 'Humani', onNavigate)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* NAVEGAÇÃO DAS TRÊS ABAS: MECÂNICAS, LORE & ABA GM */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex border-b border-[#272438] bg-[#0e0d16] rounded-t-xl overflow-hidden p-1 gap-1">
        <button
          onClick={() => setActiveMainTab('mechanics')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'mechanics'
              ? 'bg-[#18262b] text-[#74b6c2] border border-[#74b6c2]/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141220]'
          }`}
        >
          <Swords className="w-4 h-4 text-[#74b6c2]" />
          <span>Mecânicas de Jogo</span>
          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-[#74b6c2]/15 text-[#74b6c2] font-mono">
            Heranças & Talentos
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('lore')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'lore'
              ? 'bg-[#251e33] text-[#b19ecc] border border-[#b19ecc]/40'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141220]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#b19ecc]" />
          <span>Lore & Cenário</span>
          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-[#b19ecc]/15 text-[#b19ecc] font-mono">
            Cultura & Sociedade
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('gm')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'gm'
              ? 'bg-[#2a121d] text-[#f43f5e] border border-[#f43f5e]/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
              : 'text-zinc-400 hover:text-rose-300 hover:bg-[#180f18]'
          }`}
        >
          <Crown className="w-4 h-4 text-[#f43f5e]" />
          <span>Aba GM</span>
          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-full bg-[#f43f5e]/15 text-[#f43f5e] font-mono font-bold">
            Segredos & Narrador
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DE MECÂNICAS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'mechanics' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-3 sm:p-5 rounded-b-2xl bg-[#0a0910] border border-t-0 border-[#272438]">
          {/* HERANÇAS DE LINHAGEM */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Sparkles className="w-4 h-4 text-[#74b6c2]" />
              <span>Heranças de Linhagem</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {data.heritages && data.heritages.length > 0 ? (
                data.heritages.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-4 rounded-xl bg-[#131120] border border-[#272438] hover:border-[#74b6c2]/50 transition-all space-y-2 min-w-0 break-words"
                  >
                    <h4 className="text-base font-bold text-[#b19ecc] font-serif flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#74b6c2] shrink-0" />
                      <span>{h.name}</span>
                    </h4>
                    <div className="text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                      <RichContentRenderer content={h.description} onNavigate={onNavigate} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 col-span-2 italic">
                  Nenhuma herança específica cadastrada.
                </p>
              )}
            </div>
          </section>

          {/* ARSENAL CULTURAL E EQUIPAMENTOS */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Shield className="w-4 h-4 text-[#b19ecc]" />
              <span>Arsenal Cultural & Equipamentos Tradicionais</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 p-4 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                <h4 className="text-sm font-bold text-[#b19ecc]">
                  Proficiências e Armas Tradicionais
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                  <RichContentRenderer
                    content={data.culturalArsenal?.proficienciesAndWeapons || 'Consulte os armamentos tradicionais.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                <h4 className="text-sm font-bold text-[#b19ecc]">
                  Itens Únicos e Arquétipos Recomendados
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                  <RichContentRenderer
                    content={data.culturalArsenal?.uniqueItemsAndArchetypes || 'Consulte os itens e arquétipos recomendados.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* TALENTOS DE ANCESTRALIDADE */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif">
                <Zap className="w-4 h-4 text-[#74b6c2]" />
                <span>Talentos de Ancestralidade</span>
              </h3>

              {/* Filter Tabs by Rank */}
              <div className="flex flex-wrap items-center gap-1 bg-[#131120] p-1 rounded-xl border border-[#272438] text-xs">
                <button
                  onClick={() => setActiveFeatRank('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeFeatRank === 'all'
                      ? 'bg-[#18262b] text-[#74b6c2] border border-[#74b6c2]/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todos os Ranks
                </button>
                {([1, 5, 9, 13, 17] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveFeatRank(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      activeFeatRank === r
                        ? 'bg-[#251e33] text-[#b19ecc] border border-[#b19ecc]/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Rank {r} ({getFeatsByRank(r).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Feats List */}
            <div className="space-y-4 pt-1">
              {([1, 5, 9, 13, 17] as const)
                .filter((r) => activeFeatRank === 'all' || activeFeatRank === r)
                .map((r) => {
                  const feats = getFeatsByRank(r);
                  if (feats.length === 0 && activeFeatRank !== 'all') {
                    return (
                      <div key={r} className="text-center py-6 text-xs text-zinc-500">
                        Nenhum talento cadastrado no Rank {r}.
                      </div>
                    );
                  }
                  if (feats.length === 0) return null;

                  return (
                    <div key={r} className="space-y-3">
                      {activeFeatRank === 'all' && (
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#74b6c2] px-2 py-1 bg-[#18262b] rounded border-l-2 border-[#74b6c2]">
                          Talentos de Rank {r}
                        </h4>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {feats.map((feat, idx) => (
                          <div
                            key={feat.id || idx}
                            className="p-4 rounded-xl bg-[#131120] border border-[#272438] hover:border-[#74b6c2]/40 transition-all space-y-2 min-w-0 break-words"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#272438] pb-2">
                              <span className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                                <span className="text-[#b19ecc]">◆</span>
                                {feat.featEntityId && onNavigate ? (
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(feat.featEntityId!)}
                                    className="hover:text-[#74b6c2] hover:underline transition-colors text-left font-bold cursor-pointer inline-flex items-center gap-1"
                                    title="Abrir página completa do talento"
                                  >
                                    <span>{feat.name}</span>
                                    <span className="text-[10px] text-[#74b6c2] opacity-70">↗</span>
                                  </button>
                                ) : (
                                  <span>{feat.name}</span>
                                )}
                              </span>
                              {feat.actions && (
                                <PF2eActionGlyph
                                  action={
                                    feat.actions === 'passive'
                                      ? 'passive'
                                      : feat.actions === 'free'
                                      ? 'free'
                                      : feat.actions === 'reaction'
                                      ? 'reaction'
                                      : (parseInt(feat.actions, 10) as 1 | 2 | 3) || 'passive'
                                  }
                                />
                              )}
                            </div>

                            {feat.traits && feat.traits.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {feat.traits.map((t, ti) => (
                                  <span
                                    key={ti}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#18262b] text-[#74b6c2] border border-[#2d3a42] font-mono"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {feat.prerequisites && (
                              <p className="text-xs text-[#cfb284] font-mono">
                                <strong>Pré-requisitos:</strong> {feat.prerequisites}
                              </p>
                            )}

                            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                              <RichContentRenderer content={feat.description} onNavigate={onNavigate} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DE LORE & CENÁRIO */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'lore' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-3 sm:p-5 rounded-b-2xl bg-[#0a0910] border border-t-0 border-[#272438]">
          {/* FISIOLOGIA & ANATOMIA */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Dna className="w-4 h-4 text-[#b19ecc]" />
              <span>Fisiologia & Anatomia Detalhada</span>
            </h3>

            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              {data.physiology?.physicalDescription && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono">
                    Descrição Física e Dimorfismo
                  </h4>
                  <RichContentRenderer content={data.physiology.physicalDescription} onNavigate={onNavigate} />
                </div>
              )}

              {data.physiology?.functionalAnatomy && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono">
                    Anatomia Funcional
                  </h4>
                  <RichContentRenderer content={data.physiology.functionalAnatomy} onNavigate={onNavigate} />
                </div>
              )}

              {data.physiology?.bodyLanguage && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono">
                    Linguagem Corporal
                  </h4>
                  <RichContentRenderer content={data.physiology.bodyLanguage} onNavigate={onNavigate} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {data.physiology?.lifeCycle && (
                  <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                      Ciclo de Vida e Envelhecimento
                    </h4>
                    <RichContentRenderer content={data.physiology.lifeCycle} onNavigate={onNavigate} />
                  </div>
                )}

                {data.physiology?.dietAndMetabolism && (
                  <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                      Dieta e Metabolismo
                    </h4>
                    <RichContentRenderer content={data.physiology.dietAndMetabolism} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* IDENTIDADE & PSICOLOGIA */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Compass className="w-4 h-4 text-[#74b6c2]" />
              <span>Identidade, Psicologia & Mentalidade</span>
            </h3>

            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              {data.identity?.narrativeHook && (
                <div className="p-3 rounded-xl bg-[#18262b] border border-[#2d3a42] text-[#88c5d0] font-medium italic min-w-0 break-words">
                  "{data.identity.narrativeHook}"
                </div>
              )}

              {data.identity?.psychologyAndPhilosophy && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono">
                    Psicologia e Filosofia
                  </h4>
                  <RichContentRenderer content={data.identity.psychologyAndPhilosophy} onNavigate={onNavigate} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.identity?.creationMyth && (
                  <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      Mito da Criação
                    </h4>
                    <RichContentRenderer content={data.identity.creationMyth} onNavigate={onNavigate} />
                  </div>
                )}

                {data.identity?.epicsAndFigures && (
                  <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      Épicos e Figuras Históricas
                    </h4>
                    <RichContentRenderer content={data.identity.epicsAndFigures} onNavigate={onNavigate} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.identity?.purpose && (
                  <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      Propósito Existencial
                    </h4>
                    <RichContentRenderer content={data.identity.purpose} onNavigate={onNavigate} />
                  </div>
                )}

                {data.identity?.theAdventurer && (
                  <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      O Aventureiro
                    </h4>
                    <RichContentRenderer content={data.identity.theAdventurer} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CULTURA & COTIDIANO */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Feather className="w-4 h-4 text-[#b19ecc]" />
              <span>Cultura, Tradições & Cotidiano</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.culture?.etiquetteAndCustoms && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Etiqueta e Costumes
                  </h4>
                  <RichContentRenderer content={data.culture.etiquetteAndCustoms} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.namesAndMeanings && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Nomes e Significados
                  </h4>
                  <RichContentRenderer content={data.culture.namesAndMeanings} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.clothingAndFashion && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Vestuário e Moda
                  </h4>
                  <RichContentRenderer content={data.culture.clothingAndFashion} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.artisticExpressions && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Expressões Artísticas
                  </h4>
                  <RichContentRenderer content={data.culture.artisticExpressions} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.gastronomy && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Gastronomia
                  </h4>
                  <RichContentRenderer content={data.culture.gastronomy} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.leisureAndSports && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Lazer e Esportes
                  </h4>
                  <RichContentRenderer content={data.culture.leisureAndSports} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>

          {/* ESPIRITUALIDADE */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Sparkles className="w-4 h-4 text-[#74b6c2]" />
              <span>Espiritualidade, Crenças & Misticismo</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.spirituality?.nativePantheon && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    O Panteão Nativo
                  </h4>
                  <RichContentRenderer content={data.spirituality.nativePantheon} onNavigate={onNavigate} />
                </div>
              )}

              {data.spirituality?.funeraryPractices && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Práticas Funerárias
                  </h4>
                  <RichContentRenderer content={data.spirituality.funeraryPractices} onNavigate={onNavigate} />
                </div>
              )}

              {data.spirituality?.magicalConnection && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Conexão Mágica
                  </h4>
                  <RichContentRenderer content={data.spirituality.magicalConnection} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>

          {/* SOCIEDADE, LEIS E ECONOMIA */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Scale className="w-4 h-4 text-[#b19ecc]" />
              <span>Estrutura Social, Leis & Economia</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.society?.socialStructure && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Estrutura Social e Família
                  </h4>
                  <RichContentRenderer content={data.society.socialStructure} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.lawsAndTaboos && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Leis, Ética e Tabus
                  </h4>
                  <RichContentRenderer content={data.society.lawsAndTaboos} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.economyAndTrade && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Economia e Comércio
                  </h4>
                  <RichContentRenderer content={data.society.economyAndTrade} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.educationAndRites && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Educação e Ritos de Passagem
                  </h4>
                  <RichContentRenderer content={data.society.educationAndRites} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>

          {/* GUERRA E TÁTICAS */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#cb8394] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <ShieldAlert className="w-4 h-4 text-[#cb8394]" />
              <span>Guerra & Táticas Militares</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.warfare?.nativeFightingStyles && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#cb8394] uppercase font-mono mb-1">
                    Estilos de Luta Nativos
                  </h4>
                  <RichContentRenderer content={data.warfare.nativeFightingStyles} onNavigate={onNavigate} />
                </div>
              )}

              {data.warfare?.militaryOrganization && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#cb8394] uppercase font-mono mb-1">
                    Organização Militar
                  </h4>
                  <RichContentRenderer content={data.warfare.militaryOrganization} onNavigate={onNavigate} />
                </div>
              )}

              {data.warfare?.defenseEngineering && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#cb8394] uppercase font-mono mb-1">
                    Engenharia de Defesa
                  </h4>
                  <RichContentRenderer content={data.warfare.defenseEngineering} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>

          {/* NO MUNDO DE HECOS */}
          <section className="p-5 rounded-xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif border-b border-[#272438] pb-2">
              <Globe className="w-4 h-4 text-[#74b6c2]" />
              <span>A Linhagem no Mundo de Hecos</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.world?.geographicalDistribution && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Distribuição Geográfica
                  </h4>
                  <RichContentRenderer content={data.world.geographicalDistribution} onNavigate={onNavigate} />
                </div>
              )}

              {data.world?.diplomaticRelations && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Relações Diplomáticas
                  </h4>
                  <RichContentRenderer content={data.world.diplomaticRelations} onNavigate={onNavigate} />
                </div>
              )}

              {data.world?.externalPerspective && (
                <div className="p-3 rounded-lg bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Perspectiva Externa
                  </h4>
                  <RichContentRenderer content={data.world.externalPerspective} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DO GM (GUIA DO NARRADOR & SEGREDOS ANCESTRAIS) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'gm' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-3 sm:p-5 rounded-b-2xl bg-[#0a060d] border border-t-0 border-[#3a1523]">
          {/* GM Banner Alert */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-purple-950/40 to-black border border-rose-600/60 shadow-[0_0_20px_rgba(244,63,94,0.15)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-500/80 flex items-center justify-center text-rose-300 shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-200 flex items-center gap-2">
                  <span>Guia do Mestre & Segredos de Campanha</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 border border-rose-700">
                    Apenas GM
                  </span>
                </h3>
                <p className="text-xs text-rose-200/70 mt-0.5">
                  Informações reservadas para o narrador. Utilize para construir ganchos narrativos, encontros únicos e interpretar NPCs desta ancestralidade.
                </p>
              </div>
            </div>
          </div>

          {/* INTERPRETAÇÃO & TEMAS */}
          <section className="p-5 rounded-xl bg-[#110914] border border-[#3a1523] space-y-4">
            <h3 className="text-lg font-black text-rose-300 flex items-center gap-2.5 font-serif border-b border-[#3a1523] pb-2">
              <Feather className="w-4 h-4 text-rose-400" />
              <span>Diretrizes de Interpretação & Conflitos</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#170c1b] border border-rose-900/40 min-w-0 break-words space-y-2">
                <h4 className="text-xs font-bold text-rose-300 uppercase font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>Interpretando NPCs da Espécie</span>
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  <RichContentRenderer
                    content={data.gmGuide?.roleplayingNpcs || 'Nenhuma diretriz de interpretação cadastrada ainda.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#170c1b] border border-rose-900/40 min-w-0 break-words space-y-2">
                <h4 className="text-xs font-bold text-rose-300 uppercase font-mono flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-rose-400" />
                  <span>Temas e Conflitos Sugeridos</span>
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  <RichContentRenderer
                    content={data.gmGuide?.themesAndConflicts || 'Nenhum tema narrativo específico cadastrado.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SEGREDOS E GANCHOS OCULTOS */}
          <section className="p-5 rounded-xl bg-[#110914] border border-[#3a1523] space-y-4">
            <h3 className="text-lg font-black text-amber-300 flex items-center gap-2.5 font-serif border-b border-[#3a1523] pb-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Segredos Ancestrais & Ganchos de Campanha</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#170c1b] border border-amber-900/40 min-w-0 break-words space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Segredos Ancestrais & Ocultismo</span>
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  <RichContentRenderer
                    content={data.gmGuide?.secretLore || 'Mistérios arcanos e segredos ocultos da linhagem não descritos publicamente.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#170c1b] border border-amber-900/40 min-w-0 break-words space-y-2">
                <h4 className="text-xs font-bold text-amber-300 uppercase font-mono flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ganchos de Aventura & Encontros</span>
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  <RichContentRenderer
                    content={data.gmGuide?.adventureHooks || 'Ganchos prontos para o mestre envolver personagens desta linhagem em missões e intrigas.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#170c1b] border border-purple-900/40 min-w-0 break-words space-y-2">
                <h4 className="text-xs font-bold text-purple-300 uppercase font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>Origens Ocultas & Facções Secretas</span>
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  <RichContentRenderer
                    content={data.gmGuide?.trueOrigins || 'Sociedades secretas, facções obscuras ou a verdadeira gênese proibida da espécie.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#170c1b] border border-rose-900/40 min-w-0 break-words space-y-2">
                <h4 className="text-xs font-bold text-rose-300 uppercase font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  <span>Notas & Scratchpad do Narrador</span>
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  <RichContentRenderer
                    content={data.gmGuide?.gmNotes || 'Anotações livres do mestre para a campanha atual.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

