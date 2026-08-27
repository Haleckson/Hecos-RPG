import { PF2eFeatAttributes, FeatActionCost, FeatCategoryType, FeatRarity } from '../types';

/**
 * Returns blank Feat data for new articles
 */
export function getEmptyFeatData(): PF2eFeatAttributes {
  return {
    level: 1,
    featType: 'general',
    subcategories: [],
    rarity: 'Comum',
    traits: [],
    actionCost: '1',
    actionCostDetails: '',
    prerequisites: '',
    frequency: '',
    trigger: '',
    requirements: '',
    description: '',
    criticalSuccess: '',
    success: '',
    failure: '',
    criticalFailure: '',
    special: '',
    associatedClassOrAncestry: '',
    hecosLore: '',
    roleplayTips: '',
    gmNotes: '',
  };
}

/**
 * Example pre-filled template for Pathfinder 2e Feat in Hecos
 */
export function getDefaultFeatData(featName = 'Golpe do Eclipse'): PF2eFeatAttributes {
  return {
    level: 1,
    featType: 'class',
    subcategories: ['Fighter (Guerreiro)', 'Guerreiro da Obsidiana'],
    rarity: 'Comum',
    traits: ['Ataque', 'Floreio', 'Marcial'],
    actionCost: '1',
    actionCostDetails: '',
    prerequisites: 'Treinado em Atletismo ou Acrobacia',
    frequency: '1 vez por rodada',
    trigger: '',
    requirements: 'Você está empunhando uma arma corpo a corpo.',
    description: 'Você canaliza a escuridão do eclipse em um golpe preciso e desorientador.\n\nFaça um Golpe corpo a corpo. Se acertar, o alvo sofre dano normal e deve fazer um salvamento de **Fortitude** contra sua CD de Classe ou sofrer a condição **Desajeitado 1** até o fim do seu próximo turno.',
    criticalSuccess: 'O alvo sofre dano crítico dobrado e fica **Desajeitado 2** por 1 rodada.',
    success: 'O alvo sofre dano normal e fica **Desajeitado 1** até o fim do seu próximo turno.',
    failure: 'O alvo sofre dano normal sem condições adicionais.',
    criticalFailure: 'Você erra o golpe e perde o equilíbrio, ficando Desprevenido até o início do seu próximo turno.',
    special: 'Guerreiros e Renegados de Hecos podem escolher este talento como um talento de classe de 1º nível.',
    associatedClassOrAncestry: 'Guerreiro / Ordem da Obsidiana',
    hecosLore: 'Técnica forjada pelos primeiros cavaleiros da vigília durante o Grande Eclipse para quebrar as defesas das aberrações.',
    roleplayTips: 'Ao executar este golpe, o aço da sua arma reflete uma sombra violeta antes do impacto.',
    gmNotes: 'Pode ser concedido como recompensa de treino em vez de ouro após uma missão na Cidadela de Ferro.',
  };
}

/**
 * Serializes PF2e Feat attributes into structured HTML with embedded metadata
 */
export function serializeFeatToHTML(title: string, data: PF2eFeatAttributes): string {
  const jsonPayload = JSON.stringify(data);
  const actionSymbol = getActionSymbol(data.actionCost);
  const levelBadge = `Talento ${data.level}`;

  return `<!-- JSON_FEAT_DATA: ${jsonPayload} -->
<div class="pf2e-feat-container" style="font-family: inherit;">
    <!-- CABEÇALHO DO TALENTO PF2E -->
    <header class="feat-header" style="border-bottom: 2px solid #2d3a42; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
            <h2 style="font-size: 1.65rem; font-weight: 900; margin: 0; color: #cca862; display: flex; align-items: center; gap: 8px;">
                <span>${title || '[NOME DO TALENTO]'}</span>
                ${actionSymbol ? `<span style="font-size: 1.2rem; color: #74b6c2;">${actionSymbol}</span>` : ''}
            </h2>
            <div style="font-family: monospace; font-weight: bold; color: #b19ecc; font-size: 0.95rem;">
                ${levelBadge}
            </div>
        </div>

        <!-- TRAÇOS E RARIDADE -->
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            <span class="trait-badge rarity-${(data.rarity || 'comum').toLowerCase()}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
                ${data.rarity || 'Comum'}
            </span>
            <span class="trait-badge type-${data.featType}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
                ${getFeatTypeLabel(data.featType)}
            </span>
            ${data.traits && data.traits.length > 0 ? data.traits.map(t => `<span class="trait-badge" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${t}</span>`).join(' ') : ''}
        </div>
    </header>

    <!-- REQUISITOS E ATIVAÇÃO -->
    <section class="feat-prerequisites" style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px; display: grid; gap: 4px;">
        ${data.prerequisites ? `<div><strong>Pré-requisitos:</strong> ${data.prerequisites}</div>` : ''}
        ${data.frequency ? `<div><strong>Frequência:</strong> ${data.frequency}</div>` : ''}
        ${data.trigger ? `<div><strong>Gatilho:</strong> ${data.trigger}</div>` : ''}
        ${data.requirements ? `<div><strong>Requisitos:</strong> ${data.requirements}</div>` : ''}
        ${data.actionCostDetails ? `<div><strong>Ativação:</strong> ${data.actionCostDetails}</div>` : ''}
    </section>

    <!-- DESCRIÇÃO E BENEFÍCIO -->
    <section class="feat-body" style="font-size: 0.95rem; line-height: 1.7; margin-bottom: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px;">
        ${data.description || '<p><em>Nenhuma descrição fornecida para este talento.</em></p>'}
    </section>

    <!-- GRAUS DE SUCESSO -->
    ${(data.criticalSuccess || data.success || data.failure || data.criticalFailure) ? `
    <section class="feat-degrees-of-success" style="margin-bottom: 16px; padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.25); border: 1px solid #272438;">
        <h4 style="font-size: 0.85rem; font-weight: bold; text-transform: uppercase; color: #b19ecc; margin-bottom: 8px;">Graus de Sucesso</h4>
        ${data.criticalSuccess ? `<div style="margin-bottom: 4px;"><strong>Sucesso Crítico:</strong> ${data.criticalSuccess}</div>` : ''}
        ${data.success ? `<div style="margin-bottom: 4px;"><strong>Sucesso:</strong> ${data.success}</div>` : ''}
        ${data.failure ? `<div style="margin-bottom: 4px;"><strong>Falha:</strong> ${data.failure}</div>` : ''}
        ${data.criticalFailure ? `<div><strong>Falha Crítica:</strong> ${data.criticalFailure}</div>` : ''}
    </section>` : ''}

    <!-- ESPECIAL -->
    ${data.special ? `
    <section class="feat-special" style="margin-bottom: 16px; font-size: 0.9rem; color: #b19ecc;">
        <strong>Especial:</strong> ${data.special}
    </section>` : ''}

    <!-- LORE E CONTEXTO DE HECOS -->
    ${(data.hecosLore || data.associatedClassOrAncestry || data.roleplayTips) ? `
    <section class="feat-lore-section" style="margin-top: 20px; padding: 14px; border-radius: 10px; background: rgba(20, 18, 32, 0.6); border: 1px solid #272438;">
        <h3 style="font-size: 1.05rem; font-weight: bold; color: #74b6c2; margin-bottom: 8px;">Contexto & Tradição em Hecos</h3>
        ${data.associatedClassOrAncestry ? `<div style="font-size: 0.85rem; color: #cca862; margin-bottom: 6px;"><strong>Vinculação:</strong> ${data.associatedClassOrAncestry}</div>` : ''}
        ${data.hecosLore ? `<div style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 8px;">${data.hecosLore}</div>` : ''}
        ${data.roleplayTips ? `<div style="font-size: 0.85rem; font-style: italic; color: #a19db5;"><strong>Dica de Roleplay:</strong> ${data.roleplayTips}</div>` : ''}
    </section>` : ''}
</div>`;
}

/**
 * Parses raw HTML / Markdown to reconstruct PF2eFeatAttributes
 */
export function parseFeatFromContent(
  title: string,
  rawContent: string,
  existingData?: PF2eFeatAttributes
): PF2eFeatAttributes {
  // 1. If explicit existing structured data is present and valid, return it
  if (existingData && typeof existingData.level === 'number') {
    return existingData;
  }

  // 2. Try to extract embedded JSON
  const jsonMatch = rawContent.match(/<!-- JSON_FEAT_DATA:\s*(\{[\s\S]*?\})\s*-->/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed && typeof parsed === 'object') {
        return {
          ...getEmptyFeatData(),
          ...parsed,
        };
      }
    } catch {
      // JSON parsing fallback
    }
  }

  // 3. Fallback: Parse from regex patterns if imported or typed in plain text
  const clean = getEmptyFeatData();

  // Try extracting level
  const levelMatch = rawContent.match(/Talento\s+(\d+)|Feat\s+(\d+)|Rank\s+(\d+)|N[íi]vel\s+(\d+)/i);
  if (levelMatch) {
    const lvl = parseInt(levelMatch[1] || levelMatch[2] || levelMatch[3] || levelMatch[4], 10);
    if (!isNaN(lvl)) clean.level = lvl;
  }

  // Try extracting traits
  const traitsMatch = rawContent.match(/Tra[çc]os:\s*([^\n\r<]+)/i);
  if (traitsMatch && traitsMatch[1]) {
    clean.traits = traitsMatch[1].split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Try extracting prerequisites
  const prereqMatch = rawContent.match(/Pr[ée]-requisitos?:\s*([^\n\r<]+)/i);
  if (prereqMatch && prereqMatch[1]) {
    clean.prerequisites = prereqMatch[1].trim();
  }

  // Try extracting frequency
  const freqMatch = rawContent.match(/Frequ[êe]ncia:\s*([^\n\r<]+)/i);
  if (freqMatch && freqMatch[1]) {
    clean.frequency = freqMatch[1].trim();
  }

  // Try extracting trigger
  const triggerMatch = rawContent.match(/Gatilho:\s*([^\n\r<]+)/i);
  if (triggerMatch && triggerMatch[1]) {
    clean.trigger = triggerMatch[1].trim();
  }

  // Try extracting requirements
  const reqMatch = rawContent.match(/Requisitos?:\s*([^\n\r<]+)/i);
  if (reqMatch && reqMatch[1]) {
    clean.requirements = reqMatch[1].trim();
  }

  // Try extracting action
  if (rawContent.includes('◆◆◆') || rawContent.includes('3 Ações')) clean.actionCost = '3';
  else if (rawContent.includes('◆◆') || rawContent.includes('2 Ações')) clean.actionCost = '2';
  else if (rawContent.includes('◆') || rawContent.includes('1 Ação')) clean.actionCost = '1';
  else if (rawContent.includes('↺') || rawContent.includes('Reação')) clean.actionCost = 'reaction';
  else if (rawContent.includes('◇') || rawContent.includes('Ação Livre')) clean.actionCost = 'free';

  // Description fallback
  clean.description = rawContent
    .replace(/<!-- JSON_FEAT_DATA:[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  return clean;
}

export function getActionSymbol(cost: FeatActionCost): string {
  switch (cost) {
    case '1':
      return '◆';
    case '2':
      return '◆◆';
    case '3':
      return '◆◆◆';
    case 'free':
      return '◇';
    case 'reaction':
      return '↺';
    case '1-to-2':
      return '◆ ou ◆◆';
    case '1-to-3':
      return '◆ a ◆◆◆';
    case 'activity':
      return '⏱';
    default:
      return '';
  }
}

export function getFeatTypeLabel(type: FeatCategoryType): string {
  switch (type) {
    case 'ancestry':
      return 'Ancestralidade';
    case 'class':
      return 'Classe';
    case 'extras':
      return 'Extra';
    case 'general':
      return 'Geral';
    case 'skill':
      return 'Perícia';
    case 'archetype':
      return 'Vocação';
    case 'hecos':
      return 'Extra';
    default:
      return 'Geral';
  }
}
