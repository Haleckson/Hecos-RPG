import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  BookOpen,
  Dna,
  Swords,
  Award,
  Wand2,
  Gem,
  Skull,
  Shield,
  Search,
  ExternalLink,
  Lock,
  Eye,
  Sliders,
  Check,
  Edit3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { HecosEntity, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { EntityIcon } from './EntityIcon';
import { getCategoryMeta } from '../utils/categories';
import { TRAIT_CATEGORIES } from './TraitModal';

interface TraitDrawerProps {
  trait: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (entityId: string) => void;
  isGmMode?: boolean;
}

// Default trait dictionary
const DEFAULT_TRAIT_DESCRIPTIONS: Record<string, { category: string; description: string; color: string }> = {
  humanoide: { category: 'Ancestralidade e Herança', description: 'Criaturas humanóides com duas pernas, dois braços e postura bípede.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  comum: { category: 'Raridade', description: 'Geralmente disponível e acessível para qualquer personagem ou contexto regular.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  incomum: { category: 'Raridade', description: 'Algo incomum no mundo de Hecos. Exige acesso narrativo, treinamento específico ou aprovação do Mestre.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-300' },
  raro: { category: 'Raridade', description: 'Muito difícil de encontrar ou aprender. Requer aprovação expressa do GM ou evento de campanha.', color: 'border-blue-700/80 bg-blue-950/80 text-blue-300' },
  unico: { category: 'Raridade', description: 'Existe apenas um exemplar deste item, criatura ou efeito em todo o cosmos.', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  fogo: { category: 'Dano e Elementos', description: 'Efeitos com este traço manipulam energia térmica, causam dano por fogo ou pertencem ao plano ígneo.', color: 'border-rose-700/80 bg-rose-950/80 text-rose-300' },
  agua: { category: 'Dano e Elementos', description: 'Manipulação de água, correntes líquidas e pressões aquáticas.', color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  terra: { category: 'Dano e Elementos', description: 'Magias e poderes ligados a minerais, rochas, areia e solidez telúrica.', color: 'border-amber-800/80 bg-amber-950/70 text-amber-200' },
  ar: { category: 'Dano e Elementos', description: 'Efeitos de ventania, tempestade, vácuo ou gás.', color: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  luz: { category: 'Dano e Elementos', description: 'Efeitos radiantes capazes de dissipar escuridão mágica de nível igual ou menor.', color: 'border-yellow-600/80 bg-yellow-950/80 text-yellow-300' },
  escuridao: { category: 'Dano e Elementos', description: 'Efeitos de penumbra profunda, sombras vivas e supressão de luz.', color: 'border-zinc-800 bg-[#0c0914] text-purple-300' },
  sombrio: { category: 'Dano e Elementos', description: 'Conectado à energia umbrosa e à penumbra perpétua de Hecos.', color: 'border-purple-900/80 bg-purple-950/80 text-purple-200' },
  mental: { category: 'Magias e Tradições', description: 'Afeta diretamente a mente, psique ou pensamentos do alvo.', color: 'border-indigo-700/80 bg-indigo-950/80 text-indigo-300' },
  emocao: { category: 'Magias e Tradições', description: 'Altera o estado emocional (medo, coragem, fúria, desespero).', color: 'border-pink-700/80 bg-pink-950/80 text-pink-300' },
  medo: { category: 'Condições', description: 'Efeito mental que pode impor a condição Amedrontado.', color: 'border-rose-800 bg-rose-950 text-rose-300' },
  cura: { category: 'Magias e Tradições', description: 'Restaura Pontos de Vida ou remove aflições de criaturas vivas.', color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300' },
  veneno: { category: 'Condições', description: 'Toxinas, peçonhas e miasmas biológicos ou alquímicos.', color: 'border-emerald-800 bg-emerald-950 text-emerald-400' },
  necromancia: { category: 'Magias e Tradições', description: 'Manipulação das energias da vida, morte e não-vida.', color: 'border-zinc-700 bg-black text-rose-300' },
  evocacao: { category: 'Magias e Tradições', description: 'Manifestação direta de energia elemental e forças brutas.', color: 'border-rose-700 bg-rose-950/70 text-rose-200' },
  transmutacao: { category: 'Magias e Tradições', description: 'Alteração da forma física, matéria e propriedades corporais.', color: 'border-cyan-700 bg-cyan-950/70 text-cyan-200' },
  ilusao: { category: 'Magias e Tradições', description: 'Enganação sensorial visual, sonora ou olfativa.', color: 'border-violet-700 bg-violet-950/70 text-violet-300' },
  abjuracao: { category: 'Magias e Tradições', description: 'Magias protetivas, barreiras, contrafeitiços e santuários.', color: 'border-blue-700 bg-blue-950/70 text-blue-300' },
  adivinhacao: { category: 'Magias e Tradições', description: 'Revelação de segredos, presságios e visão remota.', color: 'border-cyan-600 bg-cyan-950 text-cyan-300' },
  encantamento: { category: 'Magias e Tradições', description: 'Influência mental, comandos imperativos e fascínio.', color: 'border-pink-800 bg-pink-950 text-pink-300' },
  concentracao: { category: 'Ações e Atividades', description: 'Exige foco contínuo; pode ser interrompido por reações com ataque de oportunidade.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-200' },
  manipular: { category: 'Ações e Atividades', description: 'Movimento físico com as mãos ou corpo; provoca reações contra manipulação.', color: 'border-orange-700/80 bg-orange-950/80 text-orange-200' },
  auditivo: { category: 'Extra', description: 'Depende de som ou audição para surtir efeito total.', color: 'border-teal-700 bg-teal-950 text-teal-300' },
  visual: { category: 'Extra', description: 'Depende da visão da criatura para surtir efeito.', color: 'border-sky-700 bg-sky-950 text-sky-300' },
  linguistico: { category: 'Extra', description: 'O alvo precisa compreender o idioma falado ou transmitido.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  ataque: { category: 'Ações e Atividades', description: 'Conta e sofre a Penalidade por Ataque Múltiplo (PAM).', color: 'border-rose-700 bg-rose-950 text-rose-300' },
  postura: { category: 'Ações e Atividades', description: 'Assume uma postura marcial ativa até adotar outra ou encerrar combate.', color: 'border-purple-700 bg-purple-950 text-purple-300' },
  golpe: { category: 'Ações e Atividades', description: 'Ataque básico corpo a corpo ou à distância com arma ou ataque desarmado.', color: 'border-red-800 bg-red-950 text-red-300' },
  magico: { category: 'Extra', description: 'Possui natureza sobrenatural e pode ser afetado por dissipar magia.', color: 'border-cyan-700 bg-cyan-950 text-cyan-300' },
};

export const TraitDrawer: React.FC<TraitDrawerProps> = ({
  trait,
  isOpen,
  onClose,
  onNavigate,
  isGmMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isEditingCustomTrait, setIsEditingCustomTrait] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGmMode || currentUser?.role === 'gm' || HecosStorage.getGmMode();

  const cleanTrait = trait ? trait.trim() : '';
  const normalizedKey = cleanTrait.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const customTraits = HecosStorage.getCustomTraits();
  const traitInfo = customTraits[normalizedKey] || DEFAULT_TRAIT_DESCRIPTIONS[normalizedKey] || {
    category: 'Mecânica PF2e / Hecos',
    description: `Traço mecânico ou temático de Pathfinder 2e aplicado a regras, ações, feitiços, itens, ancestrais ou criaturas em Hecos.`,
    color: 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]'
  };

  // Find all accessible entities that have this trait
  const matchingEntities = useMemo(() => {
    if (!cleanTrait) return [];
    const all = HecosStorage.getEntities();

    return all.filter((e) => {
      // 1. Permission Check (Strictly respect GM vs Player visibility)
      const hasAccess = HecosStorage.canUserAccess(
        e.visibility,
        e.allowedUserIds,
        currentUser,
        !e.isSecret
      );
      if (!hasAccess && !effectiveIsGm) return false;

      // 2. Trait matching across all possible trait containers
      const entityTraits: string[] = [];

      if (e.traits && Array.isArray(e.traits)) {
        entityTraits.push(...e.traits);
      }

      if (e.ancestryData?.traits) {
        if (Array.isArray(e.ancestryData.traits)) entityTraits.push(...e.ancestryData.traits);
        else entityTraits.push(...String(e.ancestryData.traits).split(',').map((t) => t.trim()));
      }

      if (e.itemData?.traits && Array.isArray(e.itemData.traits)) {
        entityTraits.push(...e.itemData.traits);
      }

      if (e.spellData?.traits && Array.isArray(e.spellData.traits)) {
        entityTraits.push(...e.spellData.traits);
      }

      if (e.featData?.traits && Array.isArray(e.featData.traits)) {
        entityTraits.push(...e.featData.traits);
      }

      if (e.statblock?.traits && Array.isArray(e.statblock.traits)) {
        entityTraits.push(...e.statblock.traits);
      }

      if (e.perilData?.traits && Array.isArray(e.perilData.traits)) {
        entityTraits.push(...e.perilData.traits);
      }

      // Raridade como Traço global
      if (e.featData?.rarity) entityTraits.push(e.featData.rarity);
      if (e.spellData?.rarity) entityTraits.push(e.spellData.rarity);
      if (e.itemData?.rarity) entityTraits.push(e.itemData.rarity);
      if (e.perilData?.rarity) entityTraits.push(e.perilData.rarity);
      if (e.classData?.rarity) entityTraits.push(e.classData.rarity);

      // Check tags as secondary trait match
      if (e.tags && Array.isArray(e.tags)) {
        entityTraits.push(...e.tags);
      }

      // Normalized search match
      const target = cleanTrait.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return entityTraits.some((t) => {
        const norm = String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return norm === target || norm.includes(target);
      });
    });
  }, [cleanTrait, currentUser, effectiveIsGm]);

  // Filtered by search within drawer
  const filteredEntities = useMemo(() => {
    return matchingEntities.filter((e) => {
      if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSubtitle = e.subtitle?.toLowerCase().includes(q);
        const matchSummary = e.summary?.toLowerCase().includes(q);
        return matchTitle || matchSubtitle || matchSummary;
      }
      return true;
    });
  }, [matchingEntities, selectedCategoryFilter, searchQuery]);

  // Group entities by category
  const categoriesPresent = useMemo(() => {
    const map = new Map<string, number>();
    matchingEntities.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([cat, count]) => ({
      category: cat,
      count,
      meta: getCategoryMeta(cat as any)
    }));
  }, [matchingEntities]);

  const handleStartEdit = () => {
    setEditDescription(traitInfo.description);
    setEditCategory(traitInfo.category);
    setIsEditingCustomTrait(true);
  };

  const handleSaveCustomTrait = () => {
    if (!normalizedKey) return;
    HecosStorage.saveCustomTrait(normalizedKey, {
      category: editCategory.trim() || 'Mecânica Personalizada',
      description: editDescription.trim() || 'Sem descrição.',
      color: traitInfo.color || 'border-cyan-700 bg-cyan-950 text-cyan-300'
    });
    setIsEditingCustomTrait(false);
  };

  if (!isOpen || !trait) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xl bg-[#0b0814] border-l border-zinc-800 shadow-2xl z-10 flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-800/90 bg-[#120d20] flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80">
                  {traitInfo.category}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {matchingEntities.length} artigo{matchingEntities.length !== 1 ? 's' : ''} com este traço
                </span>
              </div>

              <h2 className="text-2xl font-black text-zinc-100 tracking-tight font-serif uppercase flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#cca862]" />
                <span className="text-[#cca862] drop-shadow-[0_0_12px_rgba(204,168,98,0.4)]">
                  {cleanTrait}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {effectiveIsGm && !isEditingCustomTrait && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 transition-colors cursor-pointer"
                  title="Editar Descrição do Traço (GM)"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors cursor-pointer"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Trait Definition / Description Box */}
          <div className="p-4 bg-[#140f24]/80 border-b border-zinc-800/80">
            {isEditingCustomTrait ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase">Categoria do Traço</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-black/70 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {TRAIT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase">Regra / Descrição Mecânica</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-black/70 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomTrait(false)}
                    className="px-3 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomTrait}
                    className="px-4 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Salvar Traço
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                {traitInfo.description}
              </p>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 border-b border-zinc-800/80 bg-[#0e0a17] space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filtrar artigos com o traço ${cleanTrait}...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                    : 'bg-black/40 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                Todos ({matchingEntities.length})
              </button>

              {categoriesPresent.map(({ category, count, meta }) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(category)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedCategoryFilter === category
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                      : 'bg-black/40 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <EntityIcon category={category} className="w-3 h-3" />
                  <span>{meta.name}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* List of Matching Articles */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#090710]">
            {filteredEntities.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">
                  {matchingEntities.length === 0
                    ? `Nenhum artigo acessível com o traço "${cleanTrait}" foi encontrado.`
                    : 'Nenhum resultado corresponde à busca ou filtro de categoria.'}
                </p>
                {!effectiveIsGm && (
                  <p className="text-[11px] text-zinc-500">
                    Artigos marcados como confidenciais (GM) permanecem ocultos conforme as permissões.
                  </p>
                )}
              </div>
            ) : (
              filteredEntities.map((ent) => {
                const meta = getCategoryMeta(ent.category);
                const isSecret = ent.visibility === 'gm' || (ent.isSecret && ent.visibility !== 'all');

                return (
                  <div
                    key={ent.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-[#110e1c] hover:bg-[#181326] border border-zinc-800/80 hover:border-cyan-500/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-[#1a1429] border border-zinc-700/60 flex items-center justify-center text-cyan-300 shrink-0">
                        <EntityIcon
                          icon={ent.icon}
                          category={ent.category}
                          className="w-4 h-4"
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              onNavigate(ent.id);
                              onClose();
                            }}
                            className="text-left font-bold text-sm text-zinc-100 hover:text-cyan-300 transition-colors line-clamp-1 cursor-pointer hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] focus:outline-none"
                            title={`Abrir artigo ${ent.title}`}
                          >
                            <span className="hover:underline decoration-cyan-400/70 decoration-2 underline-offset-2">
                              {ent.title}
                            </span>
                          </button>

                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 border border-zinc-800 text-zinc-400 font-mono">
                            {meta.name}
                          </span>

                          {isSecret && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> GM
                            </span>
                          )}
                        </div>

                        {ent.subtitle && (
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                            {ent.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(ent.id);
                        onClose();
                      }}
                      className="ml-3 p-2 rounded-lg bg-black/40 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-700 transition-all shrink-0 cursor-pointer"
                      title="Abrir Artigo"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
