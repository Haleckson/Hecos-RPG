import { PF2eSpellAttributes, SpellCategoryType } from '../types';

/**
 * Returns blank Spell data for new spell articles
 */
export function getEmptySpellData(): PF2eSpellAttributes {
  return {
    rank: 1,
    traditions: ['arcano'],
    spellType: 'spell',
    subcategories: [],
    castTime: '2 ações',
    range: '9 metros',
    area: '',
    targets: '1 criatura',
    duration: 'instantânea',
    savingThrow: '',
    rarity: 'Comum',
    traits: ['Evocação', 'Concentração', 'Manipulação'],
    description: '',
    heightened: '',
    criticalSuccess: '',
    success: '',
    failure: '',
    criticalFailure: '',
    hecosLore: '',
    gmNotes: '',
  };
}

/**
 * Default sample spell for Hecos
 */
export function getDefaultSpellData(spellName = 'Lampejo de Obsidiana'): PF2eSpellAttributes {
  return {
    rank: 1,
    traditions: ['arcano', 'oculto'],
    spellType: 'spell',
    subcategories: ['1º Círculo', 'Evocação'],
    castTime: '2 ações',
    range: '18 metros',
    area: 'explosão de 3 metros',
    targets: 'criaturas na área',
    duration: 'instantânea',
    savingThrow: 'Reflexos',
    rarity: 'Comum',
    traits: ['Evocação', 'Trevas', 'Concentração', 'Manipulação'],
    description: 'Você conjura estilhaços negros e luminescentes de obsidiana que explodem no ponto alvo.\n\nAs criaturas na área sofrem 2d6 de dano perfurante e cortante com um salvamento básico de **Reflexos**.',
    heightened: '(+1) O dano aumenta em 2d6.',
    criticalSuccess: 'A criatura não sofre dano.',
    success: 'A criatura sofre metade do dano.',
    failure: 'A criatura sofre dano total.',
    criticalFailure: 'A criatura sofre dano crítico em dobro e fica **Desajeitada 1** por 1 rodada devido aos estilhaços.',
    hecosLore: 'Criado pelos magos do Eclipse para neutralizar invasores nas cavernas profundas.',
    gmNotes: 'Pode ser encontrado em pergaminhos de obsidiana na Biblioteca Esquecida.',
  };
}

/**
 * Serializes PF2e Spell attributes into structured HTML
 */
export function serializeSpellToHTML(title: string, data: PF2eSpellAttributes): string {
  const jsonPayload = JSON.stringify(data);
  const rankLabel = data.rank === 0 ? 'Truque (Cantrip)' : `Magia ${data.rank}º Círculo`;

  return `<!-- JSON_SPELL_DATA: ${jsonPayload} -->
<div class="pf2e-spell-container" style="font-family: inherit;">
    <!-- CABEÇALHO DA MAGIA PF2E -->
    <header class="spell-header" style="border-bottom: 2px solid #2d3a42; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
            <h2 style="font-size: 1.65rem; font-weight: 900; margin: 0; color: #74b6c2; display: flex; align-items: center; gap: 8px;">
                <span>${title || '[NOME DA MAGIA]'}</span>
            </h2>
            <div style="font-family: monospace; font-weight: bold; color: #b19ecc; font-size: 0.95rem;">
                ${rankLabel}
            </div>
        </div>

        <!-- TRAÇOS, TRADIÇÕES E RARIDADE -->
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            <span class="trait-badge rarity-${(data.rarity || 'comum').toLowerCase()}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
                ${data.rarity || 'Comum'}
            </span>
            ${(data.traditions || []).map(t => `<span class="trait-badge tradition-${t.toLowerCase()}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${t}</span>`).join(' ')}
            ${(data.traits || []).map(t => `<span class="trait-badge" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${t}</span>`).join(' ')}
        </div>
    </header>

    <!-- METADADOS DE LANÇAMENTO -->
    <section class="spell-cast-details" style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px; display: grid; gap: 4px;">
        ${data.castTime ? `<div><strong>Conjuração:</strong> ${data.castTime}</div>` : ''}
        ${data.range ? `<div><strong>Alcance:</strong> ${data.range}</div>` : ''}
        ${data.area ? `<div><strong>Área:</strong> ${data.area}</div>` : ''}
        ${data.targets ? `<div><strong>Alvos:</strong> ${data.targets}</div>` : ''}
        ${data.savingThrow ? `<div><strong>Salvamento:</strong> ${data.savingThrow}</div>` : ''}
        ${data.duration ? `<div><strong>Duração:</strong> ${data.duration}</div>` : ''}
    </section>

    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 16px 0;" />

    <!-- DESCRIÇÃO -->
    <section class="spell-description" style="font-size: 0.95rem; line-height: 1.7; margin-bottom: 16px;">
        ${data.description ? data.description.replace(/\n/g, '<br/>') : '<em>Sem descrição fornecida.</em>'}
    </section>

    <!-- GRAUS DE SUCESSO -->
    ${(data.criticalSuccess || data.success || data.failure || data.criticalFailure) ? `
    <section class="spell-outcomes" style="background: rgba(0, 0, 0, 0.2); border-left: 3px solid #74b6c2; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 0.88rem; display: grid; gap: 6px;">
        ${data.criticalSuccess ? `<div><strong style="color: #4ade80;">Sucesso Crítico:</strong> ${data.criticalSuccess}</div>` : ''}
        ${data.success ? `<div><strong style="color: #60a5fa;">Sucesso:</strong> ${data.success}</div>` : ''}
        ${data.failure ? `<div><strong style="color: #f87171;">Falha:</strong> ${data.failure}</div>` : ''}
        ${data.criticalFailure ? `<div><strong style="color: #ef4444;">Falha Crítica:</strong> ${data.criticalFailure}</div>` : ''}
    </section>` : ''}

    <!-- INTENSIFICADO -->
    ${data.heightened ? `
    <section class="spell-heightened" style="background: rgba(116, 182, 194, 0.08); border: 1px solid rgba(116, 182, 194, 0.2); padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem;">
        <strong style="color: #74b6c2;">Intensificado:</strong> ${data.heightened}
    </section>` : ''}

    <!-- LORE DE HECOS -->
    ${data.hecosLore ? `
    <section class="spell-lore" style="background: rgba(203, 131, 148, 0.08); border: 1px dashed rgba(203, 131, 148, 0.4); padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 0.88rem;">
        <strong style="color: #cb8394;">Lore de Hecos:</strong> ${data.hecosLore}
    </section>` : ''}

    <!-- NOTAS DO MESTRE (GM) -->
    ${data.gmNotes ? `
    <section class="spell-gm-notes" style="background: rgba(177, 158, 204, 0.1); border: 1px solid rgba(177, 158, 204, 0.3); padding: 12px; border-radius: 6px; font-size: 0.88rem;">
        <strong style="color: #b19ecc;">🔒 Segredo do Mestre:</strong> ${data.gmNotes}
    </section>` : ''}
</div>`;
}

/**
 * Extracts PF2e Spell attributes from raw entity content or HTML
 */
export function parseSpellFromContent(content: string, defaultSpell?: Partial<PF2eSpellAttributes>): PF2eSpellAttributes {
  const fallback = { ...getEmptySpellData(), ...defaultSpell };
  if (!content) return fallback;

  // 1. Try parsing JSON comment tag
  const match = content.match(/<!--\s*JSON_SPELL_DATA:\s*([\s\S]*?)\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        ...fallback,
        ...parsed,
        subcategories: Array.isArray(parsed.subcategories) ? parsed.subcategories : [],
        traditions: Array.isArray(parsed.traditions) ? parsed.traditions : ['arcano'],
        traits: Array.isArray(parsed.traits) ? parsed.traits : [],
      };
    } catch (e) {
      console.warn("Failed to parse embedded JSON spell data:", e);
    }
  }

  // 2. Parse from simple text if no comment
  const clean = content.replace(/<[^>]*>?/gm, '');
  return {
    ...fallback,
    description: clean.slice(0, 500),
  };
}
