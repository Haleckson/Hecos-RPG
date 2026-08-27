import React, { useState, useMemo, useEffect } from 'react';
import {
  HecosEntity,
  PF2eSpellAttributes,
  SpellCategoryType,
} from '../types';
import { parseSpellFromContent } from '../utils/spellSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { Tooltip } from './Tooltip';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { SpellCreateModal } from './SpellCreateModal';
import { TraitBadge } from './TraitBadge';
import { RichContentRenderer, renderContentWithMentions } from './RichContentRenderer';
import { FolderManagerModal } from './FolderManagerModal';
import { SpellDrawer } from './SpellDrawer';
import {
  Sparkles,
  Search,
  Plus,
  Filter,
  SlidersHorizontal,
  Folder,
  FolderPlus,
  FolderOpen,
  LayoutGrid,
  List,
  FolderTree,
  Edit,
  Trash2,
  ExternalLink,
  Check,
  X,
  Shield,
  BookOpen,
  Flame,
  Layers,
  ChevronDown,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Zap,
  Tag,
  ArrowRight,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
} from 'lucide-react';

export type SpellSortOption =
  | 'rank-asc'
  | 'rank-desc'
  | 'name-asc'
  | 'name-desc'
  | 'actions'
  | 'rarity'
  | 'tradition'
  | 'recent'
  | 'recent-desc'
  | 'recent-asc';

interface SpellExplorerProps {
  entities: HecosEntity[];
  onSelectEntity: (id: string) => void;
  onEditEntity: (id: string) => void;
  onCreateSpell: (presetTradition?: string, presetSubcategory?: string) => void;
  onDeleteEntity: (id: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
}

export const MAIN_SPELL_CATEGORIES: {
  id: SpellCategoryType;
  name: string;
  englishName: string;
  description: string;
  icon: any;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}[] = [
  {
    id: 'all',
    name: 'Todas',
    englishName: 'All Spells',
    description: 'Grimório completo de todas as magias e rituais registrados em Hecos.',
    icon: Sparkles,
    color: '#74b6c2',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'e_fisica',
    name: 'E. Física',
    englishName: 'Physical Energy',
    description: 'Manipulação de energia térmica, cinética, gravidade, calor, eletricidade e forças físicas materiais.',
    icon: Zap,
    color: '#00f0ff',
    badgeBg: 'bg-cyan-950/40',
    badgeBorder: 'border-cyan-600/40',
  },
  {
    id: 'e_meta',
    name: 'E. Meta',
    englishName: 'Metaphysical Energy',
    description: 'Manipulação de tempo, espaço, alma, ilusões, dimensões e forças transcendentais.',
    icon: Moon,
    color: '#b877db',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
  {
    id: 'm_organica',
    name: 'M. Orgânica',
    englishName: 'Organic Matter',
    description: 'Manipulação e transmutação de carne, sangue, biomassa, flora, cura e organismos vivos.',
    icon: Flame,
    color: '#34d399',
    badgeBg: 'bg-emerald-950/40',
    badgeBorder: 'border-emerald-600/40',
  },
  {
    id: 'm_inorganica',
    name: 'M. Inorgânica',
    englishName: 'Inorganic Matter',
    description: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos e matéria inanimada.',
    icon: Shield,
    color: '#fbbf24',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'omni',
    name: 'Omni',
    englishName: 'Omni Tradition',
    description: 'Tradição mágica suprema que unifica todas as vertentes da energia e matéria de Hecos.',
    icon: Sparkles,
    color: '#f43f5e',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
  },
  {
    id: 'focus',
    name: 'Foco',
    englishName: 'Focus Spells',
    description: 'Feitiços de classe especializados recarregados através de descanso e meditação.',
    icon: Zap,
    color: '#cb8394',
    badgeBg: 'bg-rose-950/40',
    badgeBorder: 'border-rose-600/40',
  },
  {
    id: 'ritual',
    name: 'Rituais',
    englishName: 'Rituals',
    description: 'Grandes encantamentos que exigem tempo, múltiplos conjuradores e testes de perícia.',
    icon: Layers,
    color: '#cca862',
    badgeBg: 'bg-amber-950/40',
    badgeBorder: 'border-amber-600/40',
  },
  {
    id: 'extras',
    name: 'Outros',
    englishName: 'Other Spells',
    description: 'Outras magias, rituais únicos, trama da penumbra e feitiços diversos de Hecos.',
    icon: Shield,
    color: '#cb8394',
    badgeBg: 'bg-purple-950/40',
    badgeBorder: 'border-purple-600/40',
  },
];

// Helper to normalize and match tradition strings flexibly
function matchesTradition(traditionsList: string[], target: string): boolean {
  if (!traditionsList || traditionsList.length === 0) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const targetNorm = norm(target);

  return traditionsList.some((t) => {
    const tNorm = norm(t);
    if (tNorm === targetNorm) return true;
    if (
      (targetNorm === 'efisica' || targetNorm === 'arcano' || targetNorm === 'arcane') &&
      (tNorm.includes('fisica') || tNorm.includes('arcano') || tNorm.includes('arcane'))
    )
      return true;
    if (
      (targetNorm === 'emeta' || targetNorm === 'oculto' || targetNorm === 'occult') &&
      (tNorm.includes('meta') || tNorm.includes('oculto') || tNorm.includes('occult'))
    )
      return true;
    if (
      (targetNorm === 'morganica' || targetNorm === 'primal') &&
      (tNorm.includes('organica') || tNorm.includes('primal'))
    )
      return true;
    if (
      (targetNorm === 'minorganica' || targetNorm === 'divino' || targetNorm === 'divine') &&
      (tNorm.includes('inorganica') || tNorm.includes('divino') || tNorm.includes('divine'))
    )
      return true;
    if (targetNorm === 'omni' && tNorm.includes('omni')) return true;
    return false;
  });
}

// Helper to get action glyph for cards
function getActionGlyphProp(castTime?: string): { type: ActionGlyphType; show: boolean } {
  const ct = (castTime || '').toLowerCase();
  if (ct.includes('1 a 3') || ct.includes('1 ou 2 ou 3')) return { type: '1-to-3-actions', show: true };
  if (ct.includes('1 ou 2') || ct.includes('1 a 2')) return { type: '1-to-2-actions', show: true };
  if (ct.includes('2 a 3') || ct.includes('2 ou 3')) return { type: '2-to-3-actions', show: true };
  if (ct.startsWith('1') || ct.includes('1 ação') || ct.includes('1 acao') || ct === '1') return { type: '1-action', show: true };
  if (ct.startsWith('2') || ct.includes('2 ações') || ct.includes('2 acoes') || ct === '2') return { type: '2-actions', show: true };
  if (ct.startsWith('3') || ct.includes('3 ações') || ct.includes('3 acoes') || ct === '3') return { type: '3-actions', show: true };
  if (ct.includes('reação') || ct.includes('reacao') || ct.includes('reaction')) return { type: 'reaction', show: true };
  if (ct.includes('livre') || ct.includes('free')) return { type: 'free-action', show: true };
  return { type: '1-action', show: false };
}

// Parse heightened lines supporting explicit newlines, paragraphs and PF2e heightened patterns
export function parseHeightenedLines(heightened?: string): string[] {
  if (!heightened) return [];
  const text = heightened.trim();
  if (!text) return [];

  // Normalize linebreaks
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (normalized.includes('\n')) {
    return normalized
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }

  // Split by heightened markers if on a single concatenated line
  const parts = normalized.split(/(?=(?:Intensificado\s*\([^)]+\)|\(\+\d+\)|\(\d+[ºª]\)))/gi);
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length > 1) {
    return cleaned;
  }

  return [text];
}

// Intelligent, Compact Index Blocks for Spell Cards with Zero Wasted Space
interface IndexBlockItem {
  key: string;
  label: string;
  value: string;
  bgBorderClass: string;
  labelColorClass: string;
  isWide?: boolean;
}

function SmartSpellCardIndexBlocks({ data }: { data: PF2eSpellAttributes }) {
  const items: IndexBlockItem[] = [];

  if (data.range && data.range.trim()) {
    items.push({
      key: 'range',
      label: 'Alcance',
      value: data.range.trim(),
      bgBorderClass: 'bg-cyan-950/40 border-cyan-800/60 hover:border-cyan-500/60',
      labelColorClass: 'text-cyan-400',
    });
  }

  if (data.area && data.area.trim()) {
    items.push({
      key: 'area',
      label: 'Área',
      value: data.area.trim(),
      bgBorderClass: 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500/60',
      labelColorClass: 'text-emerald-400',
    });
  }

  if (data.targets && data.targets.trim()) {
    items.push({
      key: 'targets',
      label: 'Alvos',
      value: data.targets.trim(),
      bgBorderClass: 'bg-purple-950/40 border-purple-800/60 hover:border-purple-500/60',
      labelColorClass: 'text-purple-400',
      isWide: data.targets.trim().length > 22,
    });
  }

  if (data.savingThrow && data.savingThrow.trim()) {
    items.push({
      key: 'savingThrow',
      label: 'Defesa',
      value: data.savingThrow.trim(),
      bgBorderClass: 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500/60',
      labelColorClass: 'text-rose-400',
    });
  }

  if (data.duration && data.duration.trim()) {
    items.push({
      key: 'duration',
      label: 'Duração',
      value: data.duration.trim(),
      bgBorderClass: 'bg-teal-950/40 border-teal-800/60 hover:border-teal-500/60',
      labelColorClass: 'text-teal-400',
    });
  }

  if (data.trigger && data.trigger.trim()) {
    items.push({
      key: 'trigger',
      label: 'Gatilho',
      value: data.trigger.trim(),
      bgBorderClass: 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500/60',
      labelColorClass: 'text-amber-400',
      isWide: true,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-zinc-800/80 text-[11px] auto-rows-min">
      {items.map((item, idx) => {
        // Dynamic smart fitting:
        // - 1 item total -> full span
        // - marked isWide -> full span
        // - single leftover in odd total count -> full span to fill entire row nicely
        const isLastOdd = items.length % 2 === 1 && idx === items.length - 1;
        const colSpanClass = items.length === 1 || item.isWide || isLastOdd ? 'col-span-1 sm:col-span-2' : 'col-span-1';

        return (
          <div
            key={item.key}
            className={`p-1.5 px-2.5 rounded-lg border transition-all flex items-baseline gap-1.5 overflow-hidden shadow-xs ${item.bgBorderClass} ${colSpanClass}`}
          >
            <strong className={`font-bold uppercase text-[10px] font-mono tracking-wider shrink-0 ${item.labelColorClass}`}>
              {item.label}:
            </strong>
            <span className="text-zinc-200 break-words font-medium truncate sm:whitespace-normal" title={item.value}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Crisp, pixel-perfect, zero-scroll Spell Popover Content
function SpellTooltipCard({
  spell,
  onSelectEntity,
}: {
  spell: HecosEntity;
  onSelectEntity: (id: string) => void;
}) {
  const data = spell.spellData;
  if (!data) return null;
  const rankLabel = data.rank === 0 ? 'Truque' : `${data.rank}º Círculo`;
  const heightenedLines = parseHeightenedLines(data.heightened);

  return (
    <div
      style={{
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity',
      }}
      className="w-96 sm:w-[440px] max-w-[calc(100vw-32px)] p-4 space-y-3 text-xs text-left bg-[#0d0a17] border border-cyan-500/60 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.95)] ring-1 ring-white/10 antialiased select-text"
    >
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-extrabold text-cyan-200 font-serif tracking-wide">{spell.title}</h4>
          <span className="text-xs font-mono font-bold text-purple-300 uppercase px-2 py-0.5 rounded bg-purple-950/90 border border-purple-800">
            {rankLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 font-mono font-semibold border border-cyan-800/60">
            {data.rarity || 'Comum'}
          </span>
          {data.traditions?.map((tr) => (
            <span key={`tt-trad-${tr}`} className="text-xs px-2 py-0.5 rounded bg-zinc-900/90 text-zinc-200 border border-zinc-800 font-mono font-medium">
              {tr}
            </span>
          ))}
          {data.traits?.map((tr) => (
            <span key={`tt-trait-${tr}`} className="text-xs px-2 py-0.5 rounded bg-zinc-900/90 text-zinc-300 border border-zinc-800 font-mono">
              {tr}
            </span>
          ))}
        </div>
      </div>

      {/* Index Metadata Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-zinc-200 font-sans">
        {data.castTime && <div><strong className="text-cyan-400">Conjuração:</strong> {renderContentWithMentions(data.castTime, onSelectEntity)}</div>}
        {data.range && <div><strong className="text-cyan-400">Alcance:</strong> {renderContentWithMentions(data.range, onSelectEntity)}</div>}
        {data.area && <div><strong className="text-emerald-400">Área:</strong> {renderContentWithMentions(data.area, onSelectEntity)}</div>}
        {data.targets && <div className="col-span-2"><strong className="text-purple-400">Alvos:</strong> {renderContentWithMentions(data.targets, onSelectEntity)}</div>}
        {data.trigger && <div className="col-span-2"><strong className="text-amber-400">Gatilho:</strong> {renderContentWithMentions(data.trigger, onSelectEntity)}</div>}
        {data.savingThrow && <div><strong className="text-rose-400">Defesa:</strong> {renderContentWithMentions(data.savingThrow, onSelectEntity)}</div>}
        {data.duration && <div><strong className="text-teal-400">Duração:</strong> {renderContentWithMentions(data.duration, onSelectEntity)}</div>}
      </div>

      {/* Full Description with No Scrolling */}
      <div className="pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-200 leading-relaxed">
        <RichContentRenderer content={data.description || spell.summary || 'Sem descrição.'} onNavigate={onSelectEntity} />
      </div>

      {/* Degrees of Success */}
      {(data.criticalSuccess || data.success || data.failure || data.criticalFailure) && (
        <div className="pt-2.5 border-t border-zinc-800 text-xs space-y-1">
          <div className="font-bold text-zinc-300 uppercase tracking-wider text-xs">Graus de Sucesso:</div>
          {data.criticalSuccess && <div><span className="text-emerald-400 font-bold">Sucesso Crítico:</span> {renderContentWithMentions(data.criticalSuccess, onSelectEntity)}</div>}
          {data.success && <div><span className="text-cyan-400 font-bold">Sucesso:</span> {renderContentWithMentions(data.success, onSelectEntity)}</div>}
          {data.failure && <div><span className="text-amber-400 font-bold">Falha:</span> {renderContentWithMentions(data.failure, onSelectEntity)}</div>}
          {data.criticalFailure && <div><span className="text-rose-400 font-bold">Falha Crítica:</span> {renderContentWithMentions(data.criticalFailure, onSelectEntity)}</div>}
        </div>
      )}

      {/* Heightened Section with line-break support */}
      {heightenedLines.length > 0 && (
        <div className="pt-2.5 border-t border-zinc-800 text-xs text-purple-200 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1 font-bold text-purple-400 uppercase text-[11px] font-mono tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Intensificado (Heightened):</span>
          </div>
          <div className="space-y-1.5 pl-1 text-zinc-200">
            {heightenedLines.map((line, idx) => (
              <div key={`heightened-line-${idx}`} className="flex items-start gap-1.5 text-xs text-zinc-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/80 mt-1.5 shrink-0" />
                <div className="flex-1">
                  {renderContentWithMentions(line, onSelectEntity)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SpellExplorer({
  entities,
  onSelectEntity,
  onEditEntity,
  onCreateSpell,
  onDeleteEntity,
  onTagClick,
  isGmMode = true,
}: SpellExplorerProps) {
  // 1. Storage and categories
  const [categoriesConfig, setCategoriesConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllSpellSubcategoriesConfig()
  );

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm';

  // 2. Active selection states
  const [activeCategory, setActiveCategory] = useState<SpellCategoryType>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'folders'>('grid');

  // 3. Filters & Sorting
  const [filterRank, setFilterRank] = useState<string>('all'); // 'all', 'cantrip', '1'..'10'
  const [filterTradition, setFilterTradition] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCastTime, setFilterCastTime] = useState<string>('all');
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SpellSortOption>(() => {
    try {
      const saved = localStorage.getItem('hecos_spell_sort_by');
      if (saved) return saved as SpellSortOption;
    } catch {}
    return 'rank-asc';
  });

  const handleSortChange = (newSort: SpellSortOption) => {
    setSortBy(newSort);
    try {
      localStorage.setItem('hecos_spell_sort_by', newSort);
    } catch {}
  };
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // 4. Modals & folder management
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [folderDropdownSearch, setFolderDropdownSearch] = useState('');

  // 5. Creation & Delete Modals
  const [isSpellCreateModalOpen, setIsSpellCreateModalOpen] = useState(false);
  const [pendingDeleteSpell, setPendingDeleteSpell] = useState<HecosEntity | null>(null);

  // 6. Manage Folders on a specific spell modal
  const [managingSpellFolders, setManagingSpellFolders] = useState<HecosEntity | null>(null);
  const [selectedSpellSubcats, setSelectedSpellSubcats] = useState<string[]>([]);

  // 7. Manage Spells inside a specific Folder modal
  const [managingFolderForSpells, setManagingFolderForSpells] = useState<string | null>(null);
  const [searchSpellsInFolderModal, setSearchSpellsInFolderModal] = useState('');

  // 8. Spell Article Drawer & Local Edit State
  const [selectedDrawerSpellId, setSelectedDrawerSpellId] = useState<string | null>(null);
  const [isSpellDrawerOpen, setIsSpellDrawerOpen] = useState(false);
  const [editingSpellEntity, setEditingSpellEntity] = useState<HecosEntity | null>(null);

  // Global event listener for hecos:open-spell-drawer
  useEffect(() => {
    const handleOpenSpellDrawer = (e: Event) => {
      const customEvent = e as CustomEvent<{ spellId?: string; id?: string }>;
      const targetId = customEvent.detail?.spellId || customEvent.detail?.id;
      if (targetId) {
        setSelectedDrawerSpellId(targetId);
        setIsSpellDrawerOpen(true);
      }
    };
    window.addEventListener('hecos:open-spell-drawer', handleOpenSpellDrawer);
    return () => window.removeEventListener('hecos:open-spell-drawer', handleOpenSpellDrawer);
  }, []);

  const handleOpenSpellInDrawer = (spellId: string) => {
    setSelectedDrawerSpellId(spellId);
    setIsSpellDrawerOpen(true);
  };

  const handleStartEditSpell = (spell: HecosEntity) => {
    setEditingSpellEntity(spell);
    setIsSpellCreateModalOpen(true);
  };

  // Real-time synchronization of spell categories config
  useEffect(() => {
    const unsub = HecosStorage.subscribeSpellCategories((cfg) => {
      setCategoriesConfig(cfg);
    });
    return () => unsub();
  }, []);

  // Refresh subcategories from storage
  const refreshConfig = () => {
    setCategoriesConfig(HecosStorage.getAllSpellSubcategoriesConfig());
  };

  // Helper: check if a spell belongs to a folder/subcategory
  const isSpellInSubcategory = (sp: HecosEntity, folderName: string) => {
    if (!folderName) return false;
    const data = sp.spellData;
    if (!data) return false;
    const subcats = Array.from(
      new Set([
        ...(data.subcategories || []),
        ...(sp.subcategories || []),
        ...(sp.subcategory ? [sp.subcategory] : []),
      ])
    );
    if (subcats.includes(folderName)) return true;
    if (sp.tags?.includes(folderName)) return true;
    if (folderName === 'Truques' && data.rank === 0) return true;
    if (folderName === `${data.rank}º Círculo` || folderName === `${data.rank}º Rank`) return true;
    if (data.traditions?.includes(folderName)) return true;
    return false;
  };

  // Extract all Spell Entities with parsed spell data
  const spellEntities = useMemo(() => {
    return entities
      .filter((e) => {
        const isSpell =
          e.category === 'spell' ||
          e.tags?.includes('spell') ||
          e.tags?.includes('magia') ||
          e.tags?.includes('feitiço');
        if (!isSpell) return false;
        return HecosStorage.canUserAccessItem(e, currentUser);
      })
      .map((e) => {
        const parsed = parseSpellFromContent(e.content, e.spellData);
        const subcats = Array.from(
          new Set([
            ...(e.subcategories || []),
            ...(parsed.subcategories || []),
            ...(e.subcategory ? [e.subcategory] : []),
          ])
        ).filter(Boolean);

        return {
          ...e,
          spellData: {
            ...parsed,
            subcategories: subcats,
          },
        };
      });
  }, [entities, isActualGm, currentUser]);

  // Extract all unique traits for filter dropdown
  const allTraits = useMemo(() => {
    const set = new Set<string>();
    spellEntities.forEach((sp) => {
      sp.spellData?.traits?.forEach((t) => set.add(t));
      sp.spellData?.traditions?.forEach((t) => set.add(t));
      sp.tags?.forEach((t) => {
        if (!['spell', 'magia', 'feitiço'].includes(t.toLowerCase())) {
          set.add(t);
        }
      });
    });
    return Array.from(set).sort();
  }, [spellEntities]);

  // Current folder list for active category tab
  const currentSubcategories = useMemo(() => {
    if (activeCategory === 'all') {
      const allSubs = new Set<string>();
      (Object.values(categoriesConfig) as string[][]).forEach((list) => {
        (list || []).forEach((s) => allSubs.add(s));
      });
      return Array.from(allSubs);
    }
    return categoriesConfig[activeCategory] || [];
  }, [activeCategory, categoriesConfig]);

  // Filtered spells
  const filteredSpells = useMemo(() => {
    return spellEntities.filter((sp) => {
      const data = sp.spellData!;
      const traditions = data.traditions || [];

      // 1. Category tab match
      if (activeCategory !== 'all') {
        if (activeCategory === 'e_fisica' && !matchesTradition(traditions, 'E. Física')) return false;
        if (activeCategory === 'e_meta' && !matchesTradition(traditions, 'E. Meta')) return false;
        if (activeCategory === 'm_organica' && !matchesTradition(traditions, 'M. Orgânica')) return false;
        if (activeCategory === 'm_inorganica' && !matchesTradition(traditions, 'M. Inorgânica')) return false;
        if (activeCategory === 'omni' && !matchesTradition(traditions, 'Omni')) return false;
        if (activeCategory === 'focus' && data.spellType !== 'focus' && !data.traits?.includes('Foco')) return false;
        if (activeCategory === 'ritual' && data.spellType !== 'ritual' && !data.traits?.includes('Ritual')) return false;
        if (activeCategory === 'extras' && data.spellType !== 'extras' && sp.category !== 'spell') return false;
      }

      // 2. Subcategory / Folder filter
      if (activeSubcategory) {
        if (activeSubcategory === '__none__') {
          const subs = data.subcategories || sp.subcategories || (sp.subcategory ? [sp.subcategory] : []);
          if (subs.length > 0) return false;
        } else {
          if (!isSpellInSubcategory(sp, activeSubcategory)) return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = sp.title.toLowerCase().includes(q);
        const inDesc = data.description?.toLowerCase().includes(q);
        const inTraits = data.traits?.some((t) => t.toLowerCase().includes(q));
        const inTrad = data.traditions?.some((t) => t.toLowerCase().includes(q));
        const inHecos = data.hecosLore?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTraits && !inTrad && !inHecos) return false;
      }

      // 4. Rank Filter
      if (filterRank !== 'all') {
        if (filterRank === 'cantrip' && data.rank !== 0) return false;
        if (filterRank !== 'cantrip' && data.rank !== parseInt(filterRank, 10)) return false;
      }

      // 5. Tradition Filter
      if (filterTradition !== 'all') {
        if (!matchesTradition(traditions, filterTradition)) return false;
      }

      // 6. Rarity Filter
      if (filterRarity !== 'all') {
        if ((data.rarity || 'Comum').toLowerCase() !== filterRarity.toLowerCase()) return false;
      }

      // 7. Cast Time / Actions Filter
      if (filterCastTime !== 'all') {
        const ct = (data.castTime || '').toLowerCase();
        if (filterCastTime === '1' && !ct.includes('1')) return false;
        if (filterCastTime === '2' && !ct.includes('2')) return false;
        if (filterCastTime === '3' && !ct.includes('3')) return false;
        if (filterCastTime === 'reaction' && !ct.includes('reação') && !ct.includes('reaction')) return false;
        if (filterCastTime === 'free' && !ct.includes('livre') && !ct.includes('free')) return false;
      }

      // 8. Trait Filter
      if (filterTrait !== 'all') {
        const hasTrait =
          data.traits?.includes(filterTrait) ||
          data.traditions?.includes(filterTrait) ||
          sp.tags?.includes(filterTrait);
        if (!hasTrait) return false;
      }

      return true;
    });
  }, [
    spellEntities,
    activeCategory,
    activeSubcategory,
    searchQuery,
    filterRank,
    filterTradition,
    filterRarity,
    filterCastTime,
    filterTrait,
  ]);

  // Sorted Spells according to chosen sorting mode
  const sortedSpells = useMemo(() => {
    const list = [...filteredSpells];
    const rarityOrder: Record<string, number> = {
      comum: 1,
      incomum: 2,
      raro: 3,
      único: 4,
      unico: 4,
    };

    const getActionScore = (sp: HecosEntity) => {
      const ct = (sp.spellData?.castTime || '').toLowerCase();
      if (ct.includes('livre') || ct.includes('free')) return 0;
      if (ct.includes('reação') || ct.includes('reaction')) return 0.5;
      if (ct.includes('1 a 3') || ct.includes('1 ou 2 ou 3')) return 1.5;
      if (ct.startsWith('1') || ct.includes('1 ação') || ct.includes('1 acao') || ct === '1') return 1;
      if (ct.startsWith('2') || ct.includes('2 ações') || ct.includes('2 acoes') || ct === '2') return 2;
      if (ct.startsWith('3') || ct.includes('3 ações') || ct.includes('3 acoes') || ct === '3') return 3;
      if (ct.includes('minuto') || ct.includes('hora')) return 10;
      return 5;
    };

    list.sort((a, b) => {
      const dataA = a.spellData!;
      const dataB = b.spellData!;

      switch (sortBy) {
        case 'name-asc':
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });

        case 'name-desc':
          return b.title.localeCompare(a.title, 'pt-BR', { sensitivity: 'base' });

        case 'rank-asc': {
          const diff = (dataA.rank ?? 0) - (dataB.rank ?? 0);
          if (diff !== 0) return diff;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        case 'rank-desc': {
          const diff = (dataB.rank ?? 0) - (dataA.rank ?? 0);
          if (diff !== 0) return diff;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        case 'rarity': {
          const rA = rarityOrder[(dataA.rarity || 'comum').toLowerCase()] || 1;
          const rB = rarityOrder[(dataB.rarity || 'comum').toLowerCase()] || 1;
          if (rA !== rB) return rA - rB;
          const diff = (dataA.rank ?? 0) - (dataB.rank ?? 0);
          if (diff !== 0) return diff;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        case 'actions': {
          const sA = getActionScore(a);
          const sB = getActionScore(b);
          if (sA !== sB) return sA - sB;
          const diff = (dataA.rank ?? 0) - (dataB.rank ?? 0);
          if (diff !== 0) return diff;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        case 'tradition': {
          const tA = (dataA.traditions || [])[0] || 'zzz';
          const tB = (dataB.traditions || [])[0] || 'zzz';
          const tradDiff = tA.localeCompare(tB, 'pt-BR', { sensitivity: 'base' });
          if (tradDiff !== 0) return tradDiff;
          const diff = (dataA.rank ?? 0) - (dataB.rank ?? 0);
          if (diff !== 0) return diff;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        case 'recent':
        case 'recent-desc': {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
          if (dateB !== dateA) return dateB - dateA;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        case 'recent-asc': {
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
          if (dateA !== dateB) return dateA - dateB;
          return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        }

        default:
          return 0;
      }
    });

    return list;
  }, [filteredSpells, sortBy]);

  // Folder Counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { __none__: 0 };
    const allSubs = new Set<string>();
    (Object.values(categoriesConfig) as string[][]).forEach((list) => {
      (list || []).forEach((s) => allSubs.add(s));
    });

    spellEntities.forEach((sp) => {
      const subs = sp.spellData?.subcategories || sp.subcategories || (sp.subcategory ? [sp.subcategory] : []);
      if (subs.length === 0) {
        counts.__none__ = (counts.__none__ || 0) + 1;
      }
    });

    allSubs.forEach((fName) => {
      counts[fName] = spellEntities.filter((sp) => isSpellInSubcategory(sp, fName)).length;
    });

    return counts;
  }, [spellEntities, categoriesConfig]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: spellEntities.length };
    MAIN_SPELL_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      counts[cat.id] = spellEntities.filter((sp) => {
        const data = sp.spellData!;
        const traditions = data.traditions || [];
        if (cat.id === 'e_fisica') return matchesTradition(traditions, 'E. Física');
        if (cat.id === 'e_meta') return matchesTradition(traditions, 'E. Meta');
        if (cat.id === 'm_organica') return matchesTradition(traditions, 'M. Orgânica');
        if (cat.id === 'm_inorganica') return matchesTradition(traditions, 'M. Inorgânica');
        if (cat.id === 'omni') return matchesTradition(traditions, 'Omni');
        if (cat.id === 'focus') return data.spellType === 'focus' || data.traits?.includes('Foco');
        if (cat.id === 'ritual') return data.spellType === 'ritual' || data.traits?.includes('Ritual');
        if (cat.id === 'extras') return data.spellType === 'extras' || sp.category === 'spell';
        return false;
      }).length;
    });
    return counts;
  }, [spellEntities]);

  // Active filters count
  const activeFiltersCount = [
    activeSubcategory !== null,
    filterRank !== 'all',
    filterTradition !== 'all',
    filterRarity !== 'all',
    filterCastTime !== 'all',
    filterTrait !== 'all',
    Boolean(searchQuery),
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setActiveSubcategory(null);
    setFilterRank('all');
    setFilterTradition('all');
    setFilterRarity('all');
    setFilterCastTime('all');
    setFilterTrait('all');
    setSearchQuery('');
  };

  // Save folder assignments on a specific spell
  const handleSaveSpellFolders = () => {
    if (!managingSpellFolders) return;
    HecosStorage.assignSpellSubcategories(managingSpellFolders.id, selectedSpellSubcats);
    setManagingSpellFolders(null);
    setSelectedSpellSubcats([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Actions */}
      <div className="bg-[#09080e] p-6 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
                  <span>Grimório de Feitiços & Rituais</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-mono">
                    {filteredSpells.length} {filteredSpells.length === 1 ? 'feitiço' : 'feitiços'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Catálogo estruturado pelas tradições de Hecos (E. Física, E. Meta, M. Orgânica, M. Inorgânica, Omni), Foco e Rituais.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            {isActualGm && (
              <>
                <button
                  type="button"
                  onClick={() => setIsFolderManagerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Gerenciar estrutura de pastas e subcategorias"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gerenciar Pastas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSpellCreateModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-extrabold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Novo Feitiço</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. CATEGORY SEGMENTED TABS (Compact, Horizontal) */}
        <div className="overflow-x-auto no-scrollbar py-0.5 mt-4 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 min-w-max p-1 rounded-xl bg-[#090710] border border-zinc-800/80">
            {MAIN_SPELL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <Tooltip
                  key={cat.id}
                  title={cat.name}
                  englishTitle={cat.englishName}
                  description={cat.description}
                  side="bottom"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveSubcategory(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-black text-cyan-300 font-bold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Search & Multi-Filter Toolbar */}
      <div className="bg-[#0d0b14] p-4 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Sort Icon Button, Search Input & Folder Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Quick Sort Icon-Only Button at Start */}
            <div className="relative shrink-0 flex items-center">
              <div
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/80 hover:bg-cyan-950/40 text-cyan-400 hover:text-cyan-200 transition-all cursor-pointer shadow-sm relative group/sort"
                title={`Ordenar Feitiços (Ativo: ${
                  sortBy === 'recent-desc' || sortBy === 'recent'
                    ? 'Mais recente para o mais antigo'
                    : sortBy === 'recent-asc'
                    ? 'Mais antigo para o mais recente'
                    : sortBy === 'rank-asc'
                    ? 'Círculo (Truques → 10º)'
                    : sortBy === 'rank-desc'
                    ? 'Círculo (10º → Truques)'
                    : sortBy === 'name-asc'
                    ? 'Nome (A → Z)'
                    : sortBy === 'name-desc'
                    ? 'Nome (Z → A)'
                    : sortBy === 'actions'
                    ? 'Ações / Conjuração'
                    : sortBy === 'rarity'
                    ? 'Raridade'
                    : 'Tradição Mágica'
                })`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SpellSortOption)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                  title="Alterar ordenação de feitiços"
                >
                  <option value="rank-asc" className="bg-[#0f0d1a] text-zinc-200">Círculo (Truques → 10º)</option>
                  <option value="rank-desc" className="bg-[#0f0d1a] text-zinc-200">Círculo (10º → Truques)</option>
                  <option value="name-asc" className="bg-[#0f0d1a] text-zinc-200">Nome (A → Z)</option>
                  <option value="name-desc" className="bg-[#0f0d1a] text-zinc-200">Nome (Z → A)</option>
                  <option value="recent-desc" className="bg-[#0f0d1a] text-zinc-200">Mais recente para o mais antigo</option>
                  <option value="recent-asc" className="bg-[#0f0d1a] text-zinc-200">Mais antigo para o mais recente</option>
                  <option value="actions" className="bg-[#0f0d1a] text-zinc-200">Ações / Conjuração</option>
                  <option value="rarity" className="bg-[#0f0d1a] text-zinc-200">Raridade (Comum → Único)</option>
                  <option value="tradition" className="bg-[#0f0d1a] text-zinc-200">Tradição Mágica</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, traço (Fogo, Mental), círculo, efeito..."
                className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Folder / Subcategory Dropdown Filter */}
            <div className="relative min-w-[200px] sm:w-56">
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  activeSubcategory !== null
                    ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-sm'
                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-3.5 h-3.5 shrink-0 ${activeSubcategory ? 'text-purple-400' : 'text-zinc-400'}`} />
                  <span className="truncate">
                    {activeSubcategory === null
                      ? 'Todas as Pastas'
                      : activeSubcategory === '__none__'
                      ? 'Sem Pasta Definida'
                      : activeSubcategory}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 border border-zinc-800">
                    {activeSubcategory === null
                      ? filteredSpells.length
                      : activeSubcategory === '__none__'
                      ? subcategoryCounts.__none__ || 0
                      : subcategoryCounts[activeSubcategory] || 0}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isFolderDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Folder Selector Dropdown Menu */}
              {isFolderDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsFolderDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 sm:right-auto sm:w-72 mt-1.5 z-40 bg-[#0d0a17] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-80">
                    {/* Search inside folder dropdown */}
                    <div className="p-2 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-zinc-500 ml-1 shrink-0" />
                      <input
                        type="text"
                        value={folderDropdownSearch}
                        onChange={(e) => setFolderDropdownSearch(e.target.value)}
                        placeholder="Filtrar pastas..."
                        className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none"
                        autoFocus
                      />
                      {folderDropdownSearch && (
                        <button
                          type="button"
                          onClick={() => setFolderDropdownSearch('')}
                          className="p-1 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Folders List */}
                    <div className="p-1.5 overflow-y-auto space-y-1 flex-1">
                      {/* Option: All Folders */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubcategory(null);
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          activeSubcategory === null
                            ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                            : 'text-zinc-300 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Todas as Pastas</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {activeCategory === 'all' ? spellEntities.length : categoryCounts[activeCategory] || 0}
                        </span>
                      </button>

                      {/* Option: Without Folder */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSubcategory('__none__');
                          setIsFolderDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          activeSubcategory === '__none__'
                            ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                            : 'text-zinc-400 hover:bg-zinc-900/90'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-zinc-600" />
                          <span className="italic">Sem Pasta Definida</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {subcategoryCounts.__none__ || 0}
                        </span>
                      </button>

                      <div className="my-1 border-t border-zinc-800/80" />

                      {/* Custom subcategories */}
                      {currentSubcategories
                        .filter((s) =>
                          s.toLowerCase().includes(folderDropdownSearch.toLowerCase().trim())
                        )
                        .map((subcat) => {
                          const isSelected = activeSubcategory === subcat;
                          const count = subcategoryCounts[subcat] || 0;

                          return (
                            <button
                              key={subcat}
                              type="button"
                              onClick={() => {
                                setActiveSubcategory(isSelected ? null : subcat);
                                setIsFolderDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                                isSelected
                                  ? 'bg-purple-950/80 text-purple-200 border border-purple-500/50'
                                  : 'text-zinc-300 hover:bg-zinc-900/90'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate">{subcat}</span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1">
                                {count}
                              </span>
                            </button>
                          );
                        })}

                      {currentSubcategories.filter((s) =>
                        s.toLowerCase().includes(folderDropdownSearch.toLowerCase().trim())
                      ).length === 0 && (
                        <div className="p-3 text-center text-xs text-zinc-500 italic">
                          Nenhuma pasta encontrada
                        </div>
                      )}
                    </div>

                    {/* Manage Folders footer action */}
                    {isActualGm && (
                      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950/90">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFolderDropdownOpen(false);
                            setIsFolderManagerOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-600/40 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>Gerenciar Pastas</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Rank, Tradition and Filter Panel Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Rank / Circle Quick Filter */}
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className={`bg-zinc-900/90 border rounded-xl px-2.5 py-2 text-xs font-semibold outline-none transition-all cursor-pointer ${
                filterRank !== 'all'
                  ? 'border-cyan-500/80 text-cyan-200 bg-cyan-950/40'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <option value="all">Todos Círculos</option>
              <option value="cantrip">Truque (0)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                <option key={r} value={String(r)}>
                  {r}º Círculo
                </option>
              ))}
            </select>

            {/* Tradition Quick Filter */}
            <select
              value={filterTradition}
              onChange={(e) => setFilterTradition(e.target.value)}
              className={`bg-zinc-900/90 border rounded-xl px-2.5 py-2 text-xs font-semibold outline-none transition-all cursor-pointer ${
                filterTradition !== 'all'
                  ? 'border-cyan-500/80 text-cyan-200 bg-cyan-950/40'
                  : 'border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <option value="all">Todas Tradições</option>
              <option value="E. Física">E. Física</option>
              <option value="E. Meta">E. Meta</option>
              <option value="M. Orgânica">M. Orgânica</option>
              <option value="M. Inorgânica">M. Inorgânica</option>
              <option value="Omni">Omni</option>
            </select>

            {/* More Filters Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterPanelOpen || activeFiltersCount > 0
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Mais Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple-500 text-zinc-950 font-bold text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                title="Limpar todos os filtros ativos"
              >
                Limpar
              </button>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Grade (Cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Lista / Tabela"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('folders')}
                className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  viewMode === 'folders'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Visualização em Árvore de Pastas"
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        {isFilterPanelOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 text-xs animate-fade-in">
            {/* Cast Time Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Tempo de Conjuração / Ações:</label>
              <select
                value={filterCastTime}
                onChange={(e) => setFilterCastTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Qualquer Ação</option>
                <option value="1">1 Ação [◆]</option>
                <option value="2">2 Ações [◆◆]</option>
                <option value="3">3 Ações [◆◆◆]</option>
                <option value="reaction">Reação [↺]</option>
                <option value="free">Ação Livre [◇]</option>
              </select>
            </div>

            {/* Rarity Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Raridade:</label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todas as Raridades</option>
                <option value="Comum">Comum</option>
                <option value="Incomum">Incomum</option>
                <option value="Raro">Raro</option>
                <option value="Único">Único</option>
              </select>
            </div>

            {/* Trait Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-zinc-400">Descritor / Traço:</label>
              <select
                value={filterTrait}
                onChange={(e) => setFilterTrait(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Traços ({allTraits.length})</option>
                {allTraits.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5. Main Results View */}
      {filteredSpells.length === 0 ? (
        <div className="bg-[#09080e] p-12 rounded-2xl border border-zinc-800/80 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-300">Nenhum feitiço encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Nenhum feitiço corresponde aos filtros selecionados. Tente ajustar os termos de busca ou crie uma nova magia.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
            <button
              onClick={() =>
                onCreateSpell(
                  activeCategory !== 'all' ? activeCategory : 'e_fisica',
                  activeSubcategory || undefined
                )
              }
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              + Criar Feitiço
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (ADAPTIVE: 3 COLS <1080P, 4 COLS FOR HIGH RESOLUTIONS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 min-[1800px]:grid-cols-4 gap-3 sm:gap-4 items-stretch">
          {sortedSpells.map((sp) => {
            const data = sp.spellData!;
            const perm = HecosStorage.getEntityPermission(sp.id);
            const rankLabel = data.rank === 0 ? 'Truque' : `${data.rank}º Círculo`;
            const actionGlyph = getActionGlyphProp(data.castTime);

            return (
              <div
                key={sp.id}
                className="group/card bg-[#0e0c15] hover:bg-[#13101c] border border-zinc-800/80 hover:border-cyan-500/50 rounded-2xl p-5 transition-all shadow-md hover:shadow-[0_0_24px_rgba(6,182,212,0.15)] flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Bar: Title, Action Glyph, Cast Time, Visibility */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Tooltip
                        side="right"
                        delay={200}
                        className="w-full"
                        content={<SpellTooltipCard spell={sp} onSelectEntity={handleOpenSpellInDrawer} />}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenSpellInDrawer(sp.id)}
                          className="text-left group/title focus:outline-none cursor-pointer block w-full"
                          title={`Abrir feitiço ${sp.title}`}
                        >
                          <h3 className="text-base font-bold text-zinc-100 group-hover/title:text-cyan-300 transition-all flex items-center gap-2 group-hover/title:drop-shadow-[0_0_12px_rgba(6,182,212,0.85)]">
                            <span className="group-hover/title:underline decoration-cyan-400/80 decoration-2 underline-offset-2 truncate">
                              {sp.title}
                            </span>
                            {actionGlyph.show && (
                              <PF2eActionGlyph type={actionGlyph.type} size="sm" />
                            )}
                            {data.castTime && !actionGlyph.show && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700/80 text-cyan-300 font-mono shrink-0">
                                {data.castTime}
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-cyan-400 group-hover/title:translate-x-0.5 transition-all shrink-0 ml-auto" />
                          </h3>
                        </button>
                      </Tooltip>

                      {/* Spell Type below Title in refined font */}
                      <div className="mt-1 text-xs font-serif italic text-purple-300/90 tracking-wide flex items-center gap-1.5 flex-wrap">
                        <span>{rankLabel}</span>
                        {data.spellType && data.spellType !== 'spell' && (
                          <span className="not-italic font-mono uppercase text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-bold">
                            {data.spellType === 'focus' ? 'Foco' : data.spellType === 'ritual' ? 'Ritual' : data.spellType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visibility Badge Menu */}
                    {isActualGm && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <VisibilityBadgeMenu
                          visibility={perm.visibility}
                          allowedUserIds={perm.allowedUserIds}
                          onChange={(newVis, newAllowed) => {
                            HecosStorage.setEntityPermission(sp.id, newVis, newAllowed);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Traits & Traditions Area: Rarity First, then Traditions as TraitBadges, then other Traits (Compact) */}
                  <div className="flex items-center gap-1 flex-wrap mt-2.5">
                    {/* 1. Rarity at the beginning of traits */}
                    <TraitBadge
                      compact
                      size="xs"
                      trait={data.rarity || 'Comum'}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('hecos:open-trait-drawer', {
                            detail: { trait: data.rarity || 'Comum' },
                          })
                        );
                      }}
                    />

                    {/* 2. Traditions as full interactive Traits */}
                    {data.traditions?.map((trad, tradIdx) => (
                      <TraitBadge
                        compact
                        size="xs"
                        key={`${sp.id}-trad-${trad}-${tradIdx}`}
                        trait={trad}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('hecos:open-trait-drawer', { detail: { trait: trad } })
                          );
                        }}
                      />
                    ))}

                    {/* 3. General Traits */}
                    {data.traits
                      ?.filter((t) => !data.traditions?.includes(t))
                      .map((t, tIdx) => (
                        <TraitBadge
                          compact
                          size="xs"
                          key={`${sp.id}-trait-${t}-${tIdx}`}
                          trait={t}
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('hecos:open-trait-drawer', { detail: { trait: t } })
                            );
                          }}
                        />
                      ))}
                  </div>

                  {/* Smart, Compact and Auto-Fitting Index Metadata Blocks */}
                  <SmartSpellCardIndexBlocks data={data} />

                  {/* Resumo Rápido displayed on card (rich formatted) */}
                  <div className="text-xs text-zinc-300 mt-3 leading-relaxed break-words line-clamp-4">
                    <RichContentRenderer
                      content={sp.summary || data.description || 'Sem resumo cadastrado.'}
                      onNavigate={onSelectEntity}
                    />
                  </div>
                </div>

                {/* Bottom Footer: Folder Tags & Edit/Delete Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                  {/* Folders assigned to this spell */}
                  <div className="flex items-center gap-1 flex-wrap flex-1 max-w-[70%]">
                    {data.subcategories && data.subcategories.length > 0 ? (
                      data.subcategories.map((sub, sIdx) => (
                        <span
                          key={`${sp.id}-sub-${sub}-${sIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubcategory(sub);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/40 hover:border-purple-400 truncate transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Folder className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{sub}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-zinc-600 italic">Sem pasta</span>
                    )}

                    {/* Manage Folders Trigger Button */}
                    {isActualGm && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setManagingSpellFolders(sp);
                          setSelectedSpellSubcats(data.subcategories || []);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Organizar nas Pastas"
                      >
                        <FolderPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Edit & Delete Buttons */}
                  {isActualGm && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar Feitiço" description="Modificar detalhes, estatísticas e descrição">
                        <button
                          type="button"
                          onClick={() => handleStartEditSpell(sp)}
                          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip title="Mover para a Lixeira" description="Mover feitiço com segurança para a lixeira">
                        <button
                          type="button"
                          onClick={() => setPendingDeleteSpell(sp)}
                          className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-600/50 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* TABLE / LIST VIEW */
        <div className="bg-[#09080e] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120f1c] border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                      className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors uppercase font-mono font-bold cursor-pointer"
                      title="Ordenar por Nome"
                    >
                      <span>Nome do Feitiço</span>
                      {sortBy === 'name-asc' && <ArrowUp className="w-3 h-3 text-cyan-400" />}
                      {sortBy === 'name-desc' && <ArrowDown className="w-3 h-3 text-cyan-400" />}
                      {sortBy !== 'name-asc' && sortBy !== 'name-desc' && <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => setSortBy(sortBy === 'rank-asc' ? 'rank-desc' : 'rank-asc')}
                      className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors uppercase font-mono font-bold cursor-pointer"
                      title="Ordenar por Círculo"
                    >
                      <span>Círculo</span>
                      {sortBy === 'rank-asc' && <ArrowUp className="w-3 h-3 text-cyan-400" />}
                      {sortBy === 'rank-desc' && <ArrowDown className="w-3 h-3 text-cyan-400" />}
                      {sortBy !== 'rank-asc' && sortBy !== 'rank-desc' && <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => setSortBy('tradition')}
                      className={`flex items-center gap-1.5 hover:text-cyan-300 transition-colors uppercase font-mono font-bold cursor-pointer ${
                        sortBy === 'tradition' ? 'text-cyan-300' : ''
                      }`}
                      title="Ordenar por Tradições"
                    >
                      <span>Tradições</span>
                      {sortBy === 'tradition' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />}
                    </button>
                  </th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => setSortBy('actions')}
                      className={`flex items-center gap-1.5 hover:text-cyan-300 transition-colors uppercase font-mono font-bold cursor-pointer ${
                        sortBy === 'actions' ? 'text-cyan-300' : ''
                      }`}
                      title="Ordenar por Ações"
                    >
                      <span>Conjuração</span>
                      {sortBy === 'actions' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />}
                    </button>
                  </th>
                  <th className="py-3 px-3">Alcance / Área</th>
                  <th className="py-3 px-3">
                    <button
                      type="button"
                      onClick={() => setSortBy('rarity')}
                      className={`flex items-center gap-1.5 hover:text-cyan-300 transition-colors uppercase font-mono font-bold cursor-pointer ${
                        sortBy === 'rarity' ? 'text-cyan-300' : ''
                      }`}
                      title="Ordenar por Raridade"
                    >
                      <span>Raridade</span>
                      {sortBy === 'rarity' ? <ArrowDown className="w-3 h-3 text-cyan-400" /> : <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />}
                    </button>
                  </th>
                  <th className="py-3 px-3">Pastas</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sortedSpells.map((sp) => {
                  const data = sp.spellData!;
                  const perm = HecosStorage.getEntityPermission(sp.id);
                  const rankLabel = data.rank === 0 ? 'Truque' : `${data.rank}º`;

                  return (
                    <tr key={sp.id} className="hover:bg-zinc-900/50 transition-colors group">
                      <td className="py-3 px-4">
                        <Tooltip
                          side="right"
                          delay={200}
                          content={<SpellTooltipCard spell={sp} onSelectEntity={handleOpenSpellInDrawer} />}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenSpellInDrawer(sp.id)}
                            className="text-left font-bold text-zinc-200 group-hover:text-cyan-300 hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all flex items-center gap-2 cursor-pointer focus:outline-none"
                          >
                            <span className="hover:underline decoration-cyan-400/80 decoration-2 underline-offset-2">
                              {sp.title}
                            </span>
                            {perm.visibility === 'gm' && <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                          </button>
                        </Tooltip>
                      </td>
                      <td className="py-3 px-3 font-mono text-purple-300 font-bold">{rankLabel}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {data.traditions?.map((trad) => (
                            <TraitBadge key={`tbl-trad-${trad}`} trait={trad} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{data.castTime || '—'}</td>
                      <td className="py-3 px-3 text-zinc-400 truncate max-w-[150px]">
                        {data.range || data.area || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <TraitBadge
                          trait={data.rarity || 'Comum'}
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent('hecos:open-trait-drawer', {
                                detail: { trait: data.rarity || 'Comum' },
                              })
                            );
                          }}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
                          {data.subcategories && data.subcategories.length > 0 ? (
                            data.subcategories.slice(0, 2).map((s, sIdx) => (
                              <span
                                key={`${sp.id}-tblsub-${s}-${sIdx}`}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 truncate max-w-[90px]"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 text-[10px]">—</span>
                          )}
                          {data.subcategories && data.subcategories.length > 2 && (
                            <span className="text-[10px] text-zinc-500">+{data.subcategories.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isActualGm ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <VisibilityBadgeMenu
                              visibility={perm.visibility}
                              allowedUserIds={perm.allowedUserIds}
                              onChange={(newVis, newAllowed) => {
                                HecosStorage.setEntityPermission(sp.id, newVis, newAllowed);
                              }}
                            />
                            <Tooltip title="Editar">
                              <button
                                type="button"
                                onClick={() => handleStartEditSpell(sp)}
                                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-cyan-300 cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <button
                                type="button"
                                onClick={() => setPendingDeleteSpell(sp)}
                                className="p-1 rounded bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">Leitura</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FOLDER TREE VIEW */
        <div className="space-y-4">
          {currentSubcategories.length === 0 ? (
            <div className="bg-[#0b0914] border border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/50 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                <FolderTree className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-zinc-200">Nenhuma pasta nesta categoria</h3>
                <p className="text-xs text-zinc-400">
                  Crie e organize pastas para estruturar os feitiços e rituais desta categoria.
                </p>
              </div>
              {isActualGm && (
                <button
                  type="button"
                  onClick={() => setIsFolderManagerOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Criar Pastas para esta Categoria</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSubcategories.map((folderName) => {
                const isSecret = HecosStorage.isFolderSecret(folderName);
                const spellsInFolder = sortedSpells.filter((sp) =>
                  isSpellInSubcategory(sp, folderName)
                );

                return (
                  <div
                    key={folderName}
                    className="bg-[#0b0914] border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all shadow-md flex flex-col justify-between"
                  >
                    {/* Folder Card Header */}
                    <div className="p-3.5 bg-purple-950/20 border-b border-zinc-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/50 text-purple-400 shrink-0">
                          {isSecret ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <FolderOpen className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-zinc-100 truncate">{folderName}</h3>
                          {isSecret && (
                            <span className="text-[9px] font-mono text-amber-400 font-bold block">
                              SECRETA (GM)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50">
                          {spellsInFolder.length}
                        </span>

                        {isActualGm && (
                          <Tooltip title="Organizar feitiços nesta pasta">
                            <button
                              type="button"
                              onClick={() => setManagingFolderForSpells(folderName)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                              title="Organizar feitiços"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          </Tooltip>
                        )}
                        <Tooltip title="Filtrar e ver em grade">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubcategory(folderName);
                              setViewMode('grid');
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-purple-300 transition-colors cursor-pointer"
                            title="Ver em grade"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Folder Content / Spell List */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      {spellsInFolder.length === 0 ? (
                        <div className="text-center py-6 text-zinc-600 text-xs italic space-y-2">
                          <p>Nenhum feitiço nesta pasta</p>
                          {isActualGm && (
                            <button
                              type="button"
                              onClick={() => setManagingFolderForSpells(folderName)}
                              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer inline-flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Feitiços</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {spellsInFolder.map((sp) => (
                            <div
                              key={sp.id}
                              onClick={() => handleOpenSpellInDrawer(sp.id)}
                              className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/40 hover:bg-cyan-950/30 border border-zinc-800/40 hover:border-cyan-500/40 cursor-pointer transition-all group"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 truncate">
                                  {sp.title}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 truncate">
                                  <span>{sp.spellData?.rank === 0 ? 'Truque' : `${sp.spellData?.rank}º Círculo`}</span>
                                  <span>•</span>
                                  <span className="truncate">{sp.spellData?.traditions?.join(', ') || 'Sem tradição'}</span>
                                </div>
                              </div>
                              {isActualGm && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditSpell(sp);
                                    }}
                                    className="p-1 rounded text-zinc-500 hover:text-cyan-300"
                                    title="Editar Feitiço"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick Add Spell to this folder button for GM */}
                      {isActualGm && (
                        <div className="pt-2 mt-2 border-t border-zinc-800/50 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              onCreateSpell(activeCategory !== 'all' ? activeCategory : undefined, folderName);
                            }}
                            className="text-[11px] font-bold text-zinc-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Novo Feitiço</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setManagingFolderForSpells(folderName)}
                            className="text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Organizar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Folder Management Modal (Standardized 90% Screen Width Modal) */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          isOpen={isFolderManagerOpen}
          scope="spell"
          categories={MAIN_SPELL_CATEGORIES.map((c) => ({
            id: c.id,
            name: c.name,
            englishName: c.englishName,
            icon: c.icon,
            color: c.color,
          }))}
          entities={spellEntities}
          initialCategoryId={activeCategory}
          themeColor="cyan"
          onClose={() => {
            setIsFolderManagerOpen(false);
            refreshConfig();
          }}
          onRefresh={refreshConfig}
        />
      )}

      {/* 7. Assign Folders to Specific Spell Modal */}
      {managingSpellFolders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f0d18] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Organizar em Pastas</h3>
                <p className="text-xs text-cyan-400 font-medium truncate">{managingSpellFolders.title}</p>
              </div>
              <button
                onClick={() => setManagingSpellFolders(null)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Selecione as pastas e círculos onde este feitiço deve aparecer:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {currentSubcategories.map((subcat) => {
                const isChecked = selectedSpellSubcats.includes(subcat);
                return (
                  <label
                    key={subcat}
                    onClick={() => {
                      setSelectedSpellSubcats((prev) =>
                        prev.includes(subcat) ? prev.filter((s) => s !== subcat) : [...prev, subcat]
                      );
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200 font-semibold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{subcat}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-cyan-500 border-cyan-400 text-zinc-950' : 'border-zinc-700 bg-zinc-800'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setManagingSpellFolders(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSpellFolders}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Manage/Assign Spells in a Specific Folder */}
      {managingFolderForSpells && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f0d18] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-600/50 text-purple-300">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Organizar Feitiços na Pasta</h3>
                  <p className="text-xs text-cyan-400 font-medium">Pasta: "{managingFolderForSpells}"</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManagingFolderForSpells(null);
                  setSearchSpellsInFolderModal('');
                }}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Marque ou desmarque os feitiços que pertencem a esta pasta. As alterações são sincronizadas imediatamente.
            </p>

            {/* Modal Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchSpellsInFolderModal}
                onChange={(e) => setSearchSpellsInFolderModal(e.target.value)}
                placeholder="Buscar feitiço para incluir..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 focus:border-cyan-500 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 outline-none"
              />
            </div>

            {/* Spells List with Checkboxes */}
            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {spellEntities
                .filter((sp) => {
                  if (!searchSpellsInFolderModal.trim()) return true;
                  const q = searchSpellsInFolderModal.toLowerCase();
                  return (
                    sp.title.toLowerCase().includes(q) ||
                    sp.spellData?.traditions?.some((t) => t.toLowerCase().includes(q)) ||
                    sp.spellData?.traits?.some((t) => t.toLowerCase().includes(q))
                  );
                })
                .map((sp) => {
                  const isInFolder = isSpellInSubcategory(sp, managingFolderForSpells);

                  return (
                    <label
                      key={sp.id}
                      onClick={() => {
                        HecosStorage.toggleSpellSubcategory(sp.id, managingFolderForSpells);
                        refreshConfig();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isInFolder
                          ? 'bg-purple-950/80 border-purple-500/60 text-purple-100 font-semibold'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-semibold">{sp.title}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {sp.spellData?.rank === 0 ? 'Truque' : `${sp.spellData?.rank}º Círculo`} •{' '}
                          {sp.spellData?.traditions?.join(', ') || 'Sem tradição'}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isInFolder
                            ? 'bg-purple-500 border-purple-400 text-zinc-950'
                            : 'border-zinc-700 bg-zinc-800'
                        }`}
                      >
                        {isInFolder && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-400">
                {spellEntities.filter((sp) => isSpellInSubcategory(sp, managingFolderForSpells)).length} feitiço(s) nesta pasta
              </span>
              <button
                type="button"
                onClick={() => {
                  setManagingFolderForSpells(null);
                  setSearchSpellsInFolderModal('');
                  refreshConfig();
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spell Creation / Edit Modal */}
      <SpellCreateModal
        isOpen={isSpellCreateModalOpen}
        onClose={() => {
          setIsSpellCreateModalOpen(false);
          setEditingSpellEntity(null);
        }}
        entityToEdit={editingSpellEntity || undefined}
        presetTradition={activeCategory !== 'all' ? activeCategory : undefined}
        presetSubcategory={activeSubcategory || undefined}
        onSave={(newSpellEntity) => {
          HecosStorage.saveEntity(newSpellEntity);
          setIsSpellCreateModalOpen(false);
          setEditingSpellEntity(null);
          // Return directly to the lateral drawer of this spell article!
          setSelectedDrawerSpellId(newSpellEntity.id);
          setIsSpellDrawerOpen(true);
        }}
      />

      {/* Lateral Spell Article Drawer */}
      <SpellDrawer
        spellId={selectedDrawerSpellId}
        entities={entities}
        isOpen={isSpellDrawerOpen}
        onClose={() => {
          setIsSpellDrawerOpen(false);
          setSelectedDrawerSpellId(null);
        }}
        onNavigateFullPage={(targetId) => {
          setIsSpellDrawerOpen(false);
          setSelectedDrawerSpellId(null);
          onSelectEntity(targetId);
        }}
        onEditSpell={(spellToEdit) => {
          handleStartEditSpell(spellToEdit);
        }}
        onDeleteSpell={(deleteId) => {
          onDeleteEntity(deleteId);
          setIsSpellDrawerOpen(false);
          setSelectedDrawerSpellId(null);
        }}
        onTagClick={onTagClick}
        isGmMode={isActualGm}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!pendingDeleteSpell}
        entityTitle={pendingDeleteSpell?.title || ''}
        onConfirm={() => {
          if (pendingDeleteSpell) {
            onDeleteEntity(pendingDeleteSpell.id);
            setPendingDeleteSpell(null);
          }
        }}
        onCancel={() => setPendingDeleteSpell(null)}
      />
    </div>
  );
}
