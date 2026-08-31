import { HecosEntity, EntityCategory } from '../types';
import { HecosStorage } from './storage';

export interface IndexedEntity {
  id: string;
  slug: string;
  title: string;
  normalizedTitle: string;
  cleanSlug: string;
  subtitle?: string;
  category: EntityCategory;
  categoryLabel: string;
  categoryColor: string;
  icon?: string;
  tags?: string[];
  summary?: string;
  levelOrRank?: string;
  isSecret?: boolean;
  score?: number;
}

// Category display configurations for indexing
export const CATEGORY_CONFIG: Record<
  EntityCategory,
  { label: string; color: string; bgClass: string; borderClass: string; textClass: string; iconName: string }
> = {
  npc: {
    label: 'NPC / Personagem',
    color: '#a855f7',
    bgClass: 'bg-purple-950/80',
    borderClass: 'border-purple-600/70',
    textClass: 'text-purple-300',
    iconName: 'User',
  },
  pc: {
    label: 'PC / Jogador',
    color: '#06b6d4',
    bgClass: 'bg-cyan-950/80',
    borderClass: 'border-cyan-600/70',
    textClass: 'text-cyan-300',
    iconName: 'Users',
  },
  spell: {
    label: 'Feitiço / Magia',
    color: '#38bdf8',
    bgClass: 'bg-sky-950/80',
    borderClass: 'border-sky-600/70',
    textClass: 'text-sky-300',
    iconName: 'Sparkles',
  },
  item: {
    label: 'Item / Equipamento',
    color: '#eab308',
    bgClass: 'bg-amber-950/80',
    borderClass: 'border-amber-600/70',
    textClass: 'text-amber-300',
    iconName: 'Gem',
  },
  location: {
    label: 'Local / Geografia',
    color: '#10b981',
    bgClass: 'bg-emerald-950/80',
    borderClass: 'border-emerald-600/70',
    textClass: 'text-emerald-300',
    iconName: 'Compass',
  },
  creature: {
    label: 'Criatura / Besta',
    color: '#f43f5e',
    bgClass: 'bg-rose-950/80',
    borderClass: 'border-rose-600/70',
    textClass: 'text-rose-300',
    iconName: 'Skull',
  },
  peril: {
    label: 'Perigo / Armadilha',
    color: '#ef4444',
    bgClass: 'bg-red-950/80',
    borderClass: 'border-red-600/70',
    textClass: 'text-red-300',
    iconName: 'ShieldAlert',
  },
  organization: {
    label: 'Facção / Organização',
    color: '#8b5cf6',
    bgClass: 'bg-violet-950/80',
    borderClass: 'border-violet-600/70',
    textClass: 'text-violet-300',
    iconName: 'Shield',
  },
  fauna: {
    label: 'Fauna Silvestre',
    color: '#14b8a6',
    bgClass: 'bg-teal-950/80',
    borderClass: 'border-teal-600/70',
    textClass: 'text-teal-300',
    iconName: 'PawPrint',
  },
  flora: {
    label: 'Flora / Botânica',
    color: '#84cc16',
    bgClass: 'bg-lime-950/80',
    borderClass: 'border-lime-600/70',
    textClass: 'text-lime-300',
    iconName: 'Flower2',
  },
  ancestry: {
    label: 'Ancestralidade / Povo',
    color: '#06b6d4',
    bgClass: 'bg-cyan-950/80',
    borderClass: 'border-cyan-600/70',
    textClass: 'text-cyan-300',
    iconName: 'Dna',
  },
  class: {
    label: 'Classe / Arquétipo',
    color: '#d946ef',
    bgClass: 'bg-fuchsia-950/80',
    borderClass: 'border-fuchsia-600/70',
    textClass: 'text-fuchsia-300',
    iconName: 'Swords',
  },
  archetype: {
    label: 'Arquétipo',
    color: '#c084fc',
    bgClass: 'bg-purple-950/80',
    borderClass: 'border-purple-600/70',
    textClass: 'text-purple-300',
    iconName: 'Layers',
  },
  feat: {
    label: 'Talento / Feat',
    color: '#f59e0b',
    bgClass: 'bg-amber-950/80',
    borderClass: 'border-amber-600/70',
    textClass: 'text-amber-300',
    iconName: 'Award',
  },
  rule: {
    label: 'Regra / Sistema',
    color: '#64748b',
    bgClass: 'bg-slate-950/80',
    borderClass: 'border-slate-600/70',
    textClass: 'text-slate-300',
    iconName: 'Scroll',
  },
  timeline: {
    label: 'Linha do Tempo / Evento',
    color: '#ec4899',
    bgClass: 'bg-pink-950/80',
    borderClass: 'border-pink-600/70',
    textClass: 'text-pink-300',
    iconName: 'History',
  },
  quest: {
    label: 'Missão / Quest',
    color: '#fbbf24',
    bgClass: 'bg-yellow-950/80',
    borderClass: 'border-yellow-600/70',
    textClass: 'text-yellow-300',
    iconName: 'CheckSquare',
  },
  session: {
    label: 'Sessão de Jogo',
    color: '#3b82f6',
    bgClass: 'bg-blue-950/80',
    borderClass: 'border-blue-600/70',
    textClass: 'text-blue-300',
    iconName: 'BookOpen',
  },
  gm_note: {
    label: 'Anotação do Mestre',
    color: '#e11d48',
    bgClass: 'bg-rose-950/80',
    borderClass: 'border-rose-600/70',
    textClass: 'text-rose-300',
    iconName: 'Lock',
  },
};

export function normalizeSearchTerm(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanMentionSlug(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

class EntityIndexService {
  private indexedEntities: IndexedEntity[] = [];
  private isInitialized = false;

  constructor() {
    this.refreshIndex();
    // Subscribe to changes in HecosStorage
    HecosStorage.subscribeEntities(() => {
      this.refreshIndex();
    });
    HecosStorage.subscribeTrash(() => {
      this.refreshIndex();
    });
  }

  public refreshIndex(): void {
    const rawEntities = HecosStorage.getEntities();
    const deletedIds = HecosStorage.getDeletedEntityIds();
    const trashed = HecosStorage.getTrashedEntities();
    const trashedIds = new Set(
      trashed.flatMap((t) => [
        t?.entity?.id,
        t?.entity?.id?.toLowerCase()?.trim(),
        t?.entity?.slug,
        t?.entity?.slug?.toLowerCase()?.trim(),
      ]).filter(Boolean) as string[]
    );

    // Filter strictly to only active, non-deleted, non-trashed entities
    const validEntities = rawEntities.filter((entity) => {
      if (!entity || !entity.id) return false;
      if (HecosStorage.isEntityDeleted(deletedIds, entity.id, entity.slug)) return false;
      if (trashedIds.has(entity.id) || trashedIds.has(entity.id.toLowerCase().trim())) return false;
      if (entity.slug && (trashedIds.has(entity.slug) || trashedIds.has(entity.slug.toLowerCase().trim()))) return false;
      return true;
    });

    this.indexedEntities = validEntities.map((entity) => {
      const config = CATEGORY_CONFIG[entity.category] || {
        label: entity.category || 'Artigo',
        color: '#a855f7',
        bgClass: 'bg-purple-950/80',
        borderClass: 'border-purple-600/70',
        textClass: 'text-purple-300',
        iconName: 'BookOpen',
      };

      // Extract level / rank metadata
      let levelOrRank: string | undefined;
      if (entity.spellData?.rank !== undefined) {
        levelOrRank = entity.spellData.rank === 0 ? 'Truque' : `Rank ${entity.spellData.rank}`;
      } else if (entity.itemData?.level !== undefined) {
        levelOrRank = `Item Nv ${entity.itemData.level}`;
      } else if (entity.statblock?.level !== undefined) {
        levelOrRank = `Nv ${entity.statblock.level}`;
      } else if (entity.timelineData?.year) {
        levelOrRank = entity.timelineData.year;
      }

      const slug = entity.slug || entity.id;

      return {
        id: entity.id,
        slug: slug,
        cleanSlug: cleanMentionSlug(slug),
        title: entity.title || 'Sem título',
        normalizedTitle: normalizeSearchTerm(entity.title || ''),
        subtitle: entity.subtitle,
        category: entity.category,
        categoryLabel: config.label,
        categoryColor: config.color,
        icon: entity.icon,
        tags: entity.tags || [],
        summary: entity.summary,
        levelOrRank,
        isSecret: entity.isSecret ?? false,
      };
    });
    this.isInitialized = true;
  }

  public getAllIndexed(): IndexedEntity[] {
    if (!this.isInitialized || this.indexedEntities.length === 0) {
      this.refreshIndex();
    }
    return this.indexedEntities;
  }

  /**
   * Fast, intelligent fuzzy search across all indexed articles / terms.
   * Matches titles, slugs, tags, categories, and aliases with precision weighting.
   */
  public search(
    query: string,
    options?: {
      limit?: number;
      excludeId?: string;
      category?: EntityCategory;
      includeSecrets?: boolean;
    }
  ): IndexedEntity[] {
    const all = this.getAllIndexed();
    const limit = options?.limit ?? 10;
    const excludeId = options?.excludeId;
    const filterCat = options?.category;
    const includeSecrets = options?.includeSecrets ?? true;

    const trimmed = query.trim();
    if (!trimmed) {
      // Return top recent/active entities
      return all
        .filter((e) => {
          if (excludeId && e.id === excludeId) return false;
          if (filterCat && e.category !== filterCat) return false;
          if (!includeSecrets && e.isSecret) return false;
          return true;
        })
        .slice(0, limit);
    }

    const normQuery = normalizeSearchTerm(trimmed);
    const querySlug = cleanMentionSlug(trimmed);
    const queryWords = normQuery.split(' ').filter(Boolean);

    const scored: Array<{ entity: IndexedEntity; score: number }> = [];

    for (const entity of all) {
      if (excludeId && entity.id === excludeId) continue;
      if (filterCat && entity.category !== filterCat) continue;
      if (!includeSecrets && entity.isSecret) continue;

      let score = 0;
      const titleLower = entity.title.toLowerCase();
      const normTitle = entity.normalizedTitle;
      const slug = entity.cleanSlug;

      // 1. Exact Match (Highest score)
      if (normTitle === normQuery || slug === querySlug) {
        score += 150;
      }
      // 2. Starts with query (Very high score)
      else if (normTitle.startsWith(normQuery) || slug.startsWith(querySlug)) {
        score += 100;
      }
      // 3. Word starts with query (High score)
      else {
        const titleWords = normTitle.split(' ');
        const matchedWords = queryWords.filter((qw) =>
          titleWords.some((tw) => tw.startsWith(qw))
        );

        if (matchedWords.length === queryWords.length && queryWords.length > 0) {
          score += 70 + matchedWords.length * 10;
        } else if (normTitle.includes(normQuery) || slug.includes(querySlug)) {
          score += 50;
        }
      }

      // 4. Subtitle match
      if (entity.subtitle) {
        const normSub = normalizeSearchTerm(entity.subtitle);
        if (normSub.includes(normQuery)) {
          score += 25;
        }
      }

      // 5. Category label / name match
      const normCat = normalizeSearchTerm(entity.categoryLabel + ' ' + entity.category);
      if (normCat.includes(normQuery)) {
        score += 30;
      }

      // 6. Tags match
      if (entity.tags && entity.tags.length > 0) {
        for (const tag of entity.tags) {
          const normTag = normalizeSearchTerm(tag);
          if (normTag === normQuery) {
            score += 40;
          } else if (normTag.includes(normQuery)) {
            score += 20;
          }
        }
      }

      // 7. Summary match
      if (entity.summary) {
        const normSum = normalizeSearchTerm(entity.summary);
        if (normSum.includes(normQuery)) {
          score += 10;
        }
      }

      if (score > 0) {
        scored.push({
          entity: { ...entity, score },
          score,
        });
      }
    }

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.entity);
  }

  /**
   * Find entity by exact slug or title (used for link resolution)
   */
  public findBySlugOrTitle(slugOrTitle: string): IndexedEntity | undefined {
    const norm = normalizeSearchTerm(slugOrTitle);
    const slug = cleanMentionSlug(slugOrTitle);
    const all = this.getAllIndexed();

    return all.find(
      (e) =>
        e.id.toLowerCase() === slugOrTitle.toLowerCase() ||
        e.cleanSlug === slug ||
        e.normalizedTitle === norm ||
        e.title.toLowerCase() === slugOrTitle.toLowerCase()
    );
  }
}

export const entityIndexService = new EntityIndexService();
