import React, { useState, useEffect } from 'react';
import { HecosEntity, HecosUser } from '../types';
import { HecosStorage } from '../services/storage';
import { getCategoryMeta } from '../utils/categories';
import { EntityIcon } from './EntityIcon';
import { TraitBadge } from './TraitBadge';
import { RichContentRenderer } from './RichContentRenderer';
import {
  Sparkles,
  BookOpen,
  Clock,
  Edit2,
  Check,
  X,
  Plus,
  Flame,
  Zap,
  Shield,
  Search,
  EyeOff,
  Compass,
  Layers,
  ArrowRight,
  Bookmark,
  Calendar,
} from 'lucide-react';

interface HomePageProps {
  entities: HecosEntity[];
  onSelectEntity: (id: string) => void;
  onNavigateCategory: (categoryKey: string) => void;
  onCreateArticle: () => void;
  isGm: boolean;
}

interface HomeCustomBlock {
  title: string;
  subtitle: string;
  content: string;
  themeColor: 'cyan' | 'purple' | 'amber' | 'rose';
}

const DEFAULT_HOME_BLOCK: HomeCustomBlock = {
  title: 'Bem-vindo ao Codex de Hecos',
  subtitle: 'Crônicas, Grimório e Regras de Campanha no Sistema Pathfinder 2e',
  content:
    'Este compêndio reúne todo o conhecimento sobre o mundo de **Hecos**, suas vertentes de magia (*Energia Física, Metafísica, Matéria Orgânica e Inorgânica*), perícias ancestrais, rituais, talentos de classe e perigos sombrios.\n\nUtilize a barra de busca rápida (`Ctrl+K` ou `Cmd+K`) para pesquisar em tempo real ou explore os módulos temáticos abaixo.',
  themeColor: 'cyan',
};

export function HomePage({
  entities,
  onSelectEntity,
  onNavigateCategory,
  onCreateArticle,
  isGm,
}: HomePageProps) {
  // 1. Customizable Block state (persisted)
  const [customBlock, setCustomBlock] = useState<HomeCustomBlock>(() => {
    try {
      const saved = localStorage.getItem('hecos_home_custom_block');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_HOME_BLOCK;
  });

  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [editTitle, setEditTitle] = useState(customBlock.title);
  const [editSubtitle, setEditSubtitle] = useState(customBlock.subtitle);
  const [editContent, setEditContent] = useState(customBlock.content);
  const [editThemeColor, setEditThemeColor] = useState<HomeCustomBlock['themeColor']>(
    customBlock.themeColor
  );

  const [recentFilter, setRecentFilter] = useState('');

  const handleSaveBlock = () => {
    const updated: HomeCustomBlock = {
      title: editTitle.trim() || 'Codex de Hecos',
      subtitle: editSubtitle.trim(),
      content: editContent.trim(),
      themeColor: editThemeColor,
    };
    setCustomBlock(updated);
    try {
      localStorage.setItem('hecos_home_custom_block', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setIsEditingBlock(false);
  };

  const handleCancelBlock = () => {
    setEditTitle(customBlock.title);
    setEditSubtitle(customBlock.subtitle);
    setEditContent(customBlock.content);
    setEditThemeColor(customBlock.themeColor);
    setIsEditingBlock(false);
  };

  // 2. Recent Articles
  const recentEntities = useMemoRecentEntities(entities, recentFilter);

  const themeClasses = {
    cyan: {
      bg: 'bg-gradient-to-br from-[#0b1622] via-[#090b14] to-[#0d0a1a]',
      border: 'border-cyan-500/30 hover:border-cyan-500/50',
      title: 'text-cyan-200',
      accent: 'text-cyan-400',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
    },
    purple: {
      bg: 'bg-gradient-to-br from-[#160d24] via-[#0a0814] to-[#120a1c]',
      border: 'border-purple-500/30 hover:border-purple-500/50',
      title: 'text-purple-200',
      accent: 'text-purple-400',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    },
    amber: {
      bg: 'bg-gradient-to-br from-[#1c1409] via-[#0c0910] to-[#140e08]',
      border: 'border-amber-500/30 hover:border-amber-500/50',
      title: 'text-amber-200',
      accent: 'text-amber-400',
      badge: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    },
    rose: {
      bg: 'bg-gradient-to-br from-[#1f0b14] via-[#0b0810] to-[#160810]',
      border: 'border-rose-500/30 hover:border-rose-500/50',
      title: 'text-rose-200',
      accent: 'text-rose-400',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    },
  }[customBlock.themeColor || 'cyan'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* 1. CUSTOMIZABLE BANNER / BLOCK */}
      <section
        className={`relative p-6 sm:p-8 rounded-3xl border ${themeClasses.border} ${themeClasses.bg} shadow-2xl transition-all overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {isEditingBlock ? (
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>Editar Bloco Inicial Personalizado</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveBlock}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Bloco</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelBlock}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Título do Bloco</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-100 outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">Subtítulo / Assunto</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-100 outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-400">Conteúdo (Markdown / Informações da Mesa)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500 mr-1">Cor de Destaque:</span>
                  {(['cyan', 'purple', 'amber', 'rose'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditThemeColor(color)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        editThemeColor === color ? 'scale-125 border-white' : 'border-transparent opacity-60 hover:opacity-100'
                      } ${
                        color === 'cyan'
                          ? 'bg-cyan-500'
                          : color === 'purple'
                          ? 'bg-purple-500'
                          : color === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <textarea
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-200 outline-none focus:border-cyan-400 font-mono leading-relaxed"
                placeholder="Escreva anotações gerais da campanha, links ou avisos..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border shadow-sm mb-1 bg-cyan-950/80 text-cyan-300 border-cyan-700/60">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Compêndio de Hecos</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight font-serif">
                  {customBlock.title}
                </h1>
                {customBlock.subtitle && (
                  <p className="text-sm sm:text-base text-zinc-300 font-medium">
                    {customBlock.subtitle}
                  </p>
                )}
              </div>

              {isGm && (
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(customBlock.title);
                    setEditSubtitle(customBlock.subtitle);
                    setEditContent(customBlock.content);
                    setEditThemeColor(customBlock.themeColor);
                    setIsEditingBlock(true);
                  }}
                  className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
                  title="Editar este bloco de início"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {customBlock.content && (
              <div className="pt-2 border-t border-zinc-800/80 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl">
                <RichContentRenderer
                  content={customBlock.content}
                  onNavigate={(id) => onSelectEntity(id)}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. QUICK ACCESS CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigateCategory('spell')}
          className="p-4 rounded-2xl bg-[#0f0c18] hover:bg-[#151122] border border-cyan-500/20 hover:border-cyan-400/60 transition-all text-left group cursor-pointer shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors">
            Grimório de Feitiços
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Magias, truques, rituais e vertentes de Hecos.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateCategory('feat')}
          className="p-4 rounded-2xl bg-[#0f0c18] hover:bg-[#151122] border border-purple-500/20 hover:border-purple-400/60 transition-all text-left group cursor-pointer shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-300 mb-2 group-hover:scale-110 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 group-hover:text-purple-300 transition-colors">
            Talentos & Habilidades
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Talentos de ancestralidade, classe e perícia.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateCategory('item')}
          className="p-4 rounded-2xl bg-[#0f0c18] hover:bg-[#151122] border border-amber-500/20 hover:border-amber-400/60 transition-all text-left group cursor-pointer shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-300 mb-2 group-hover:scale-110 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
            Arsenal & Equipamento
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">Armas, armaduras, relíquias e itens alquímicos.</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateCategory('lore')}
          className="p-4 rounded-2xl bg-[#0f0c18] hover:bg-[#151122] border border-rose-500/20 hover:border-rose-400/60 transition-all text-left group cursor-pointer shadow-md"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-300 mb-2 group-hover:scale-110 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 group-hover:text-rose-300 transition-colors">
            Crônicas & Lore
          </h4>
          <p className="text-[11px] text-zinc-400 mt-0.5">História, facções, deuses e o mundo de Hecos.</p>
        </button>
      </section>

      {/* 3. RECENT ARTICLES SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-zinc-100 font-serif">Artigos Recentes</h2>
              <p className="text-xs text-zinc-400">Entradas criadas ou editadas recentemente no Codex</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recentFilter}
                onChange={(e) => setRecentFilter(e.target.value)}
                placeholder="Filtrar recentes..."
                className="pl-8 pr-3 py-1.5 text-xs bg-black/40 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400 w-44 sm:w-56"
              />
              {recentFilter && (
                <button
                  type="button"
                  onClick={() => setRecentFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {isGm && (
              <button
                type="button"
                onClick={onCreateArticle}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Novo Artigo</span>
              </button>
            )}
          </div>
        </div>

        {recentEntities.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#09080e] border border-zinc-800 text-zinc-500 text-xs italic">
            Nenhum artigo recente encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentEntities.map((entity) => {
              const catMeta = getCategoryMeta(entity.category);
              const dateStr = formatRelativeTime(entity.updatedAt || entity.createdAt);

              return (
                <div
                  key={entity.id}
                  onClick={() => onSelectEntity(entity.id)}
                  className="p-4 rounded-2xl bg-[#0d0a15] hover:bg-[#141020] border border-zinc-800/80 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1">
                        <EntityIcon icon={entity.icon} category={entity.category} className="w-3 h-3 text-cyan-400" />
                        <span>{catMeta.name}</span>
                      </span>

                      <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                        <span className="truncate">{entity.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-all shrink-0 ml-1" />
                      </h4>
                      {entity.subtitle && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {entity.subtitle}
                        </p>
                      )}
                    </div>

                    {entity.summary && (
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {entity.summary}
                      </p>
                    )}
                  </div>

                  {/* Tags / Traits footer */}
                  {(((entity.traits || []).length > 0) || ((entity.tags || []).length > 0)) && (
                    <div className="flex items-center gap-1 flex-wrap pt-3 mt-3 border-t border-zinc-800/60">
                      {(entity.traits || []).slice(0, 2).map((tr) => (
                        <TraitBadge key={`rec-trait-${tr}`} trait={tr} />
                      ))}
                      {(entity.tags || []).slice(0, 2).map((tg) => (
                        <span
                          key={`rec-tag-${tg}`}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-purple-300 border border-zinc-800 font-mono"
                        >
                          #{tg}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function useMemoRecentEntities(entities: HecosEntity[] = [], filter: string) {
  return React.useMemo(() => {
    let list = Array.isArray(entities) ? [...entities] : [];
    list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    if (filter && filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(
        (e) =>
          (e?.title || '').toLowerCase().includes(q) ||
          (e?.summary || '').toLowerCase().includes(q) ||
          (e?.tags || []).some((t) => (t || '').toLowerCase().includes(q)) ||
          (e?.category || '').toLowerCase().includes(q)
      );
    }

    return list.slice(0, 12);
  }, [entities, filter]);
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'recente';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (isNaN(diffMinutes)) return 'recente';
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
