import { AncestryAttributes, AncestryFeat, AncestryHeritage } from '../types';

/**
 * Returns empty Ancestry data with blank fields for new ancestry articles
 */
export function getEmptyAncestryData(): AncestryAttributes {
  return {
    hp: '',
    size: '',
    speed: '',
    senses: '',
    attributes: '',
    traits: '',
    innate: '',
    languages: '',
    heritages: [],
    culturalArsenal: {
      proficienciesAndWeapons: '',
      uniqueItemsAndArchetypes: '',
    },
    feats: {
      rank1: [],
      rank5: [],
      rank9: [],
      rank13: [],
      rank17: [],
    },
    physiology: {
      physicalDescription: '',
      functionalAnatomy: '',
      bodyLanguage: '',
      lifeCycle: '',
      dietAndMetabolism: '',
    },
    identity: {
      narrativeHook: '',
      psychologyAndPhilosophy: '',
      creationMyth: '',
      epicsAndFigures: '',
      purpose: '',
      theAdventurer: '',
    },
    culture: {
      etiquetteAndCustoms: '',
      namesAndMeanings: '',
      clothingAndFashion: '',
      artisticExpressions: '',
      gastronomy: '',
      leisureAndSports: '',
    },
    spirituality: {
      nativePantheon: '',
      funeraryPractices: '',
      magicalConnection: '',
    },
    society: {
      socialStructure: '',
      lawsAndTaboos: '',
      economyAndTrade: '',
      educationAndRites: '',
    },
    warfare: {
      nativeFightingStyles: '',
      militaryOrganization: '',
      defenseEngineering: '',
    },
    world: {
      geographicalDistribution: '',
      diplomaticRelations: '',
      externalPerspective: '',
    },
    gmGuide: {
      roleplayingNpcs: '',
      themesAndConflicts: '',
    },
  };
}

/**
 * Example pre-filled template (used only when explicitly requesting sample demo data)
 */
export function getDefaultAncestryData(ancestryName = '[NOME DA ANCESTRALIDADE]'): AncestryAttributes {
  return {
    hp: '8 PV',
    size: 'Médio',
    speed: '25 pés (≈ 7,5 m)',
    senses: 'Visão na Penumbra',
    attributes: '+2 Des, +2 Int, +2 Livre, -2 For',
    traits: `Humanoide, ${ancestryName !== '[NOME DA ANCESTRALIDADE]' ? ancestryName : 'Ancestralidade'}`,
    innate: 'Habilidade passiva de adaptação ao ambiente de Hecos.',
    languages: 'Humani, Idioma Ancestral + adicionais iguais ao modificador de Int',
    heritages: [
      {
        id: 'heritage-1',
        name: 'Herança das Brumas',
        description: 'Adaptados às regiões enevoadas de Hecos. **Benefício Mecânico:** Você recebe **Resistência 3 a dano de frio** e a perícia **Ocultismo** treinada.',
      },
    ],
    culturalArsenal: {
      proficienciesAndWeapons: 'Armas tradicionais e proficiências culturais da linhagem.',
      uniqueItemsAndArchetypes: 'Equipamentos icônicos e arquétipos recomendados.',
    },
    feats: {
      rank1: [
        {
          id: 'feat-r1-1',
          name: 'Sentidos Aguçados',
          rank: 1,
          actions: 'passive',
          traits: ['Ancestralidade'],
          prerequisites: '',
          description: 'Seus olhos se adaptam à penumbra de Hecos. Você ganha **Visão no Escuro**.',
        },
      ],
      rank5: [],
      rank9: [],
      rank13: [],
      rank17: [],
    },
    physiology: {
      physicalDescription: '',
      functionalAnatomy: '',
      bodyLanguage: '',
      lifeCycle: '',
      dietAndMetabolism: '',
    },
    identity: {
      narrativeHook: '',
      psychologyAndPhilosophy: '',
      creationMyth: '',
      epicsAndFigures: '',
      purpose: '',
      theAdventurer: '',
    },
    culture: {
      etiquetteAndCustoms: '',
      namesAndMeanings: '',
      clothingAndFashion: '',
      artisticExpressions: '',
      gastronomy: '',
      leisureAndSports: '',
    },
    spirituality: {
      nativePantheon: '',
      funeraryPractices: '',
      magicalConnection: '',
    },
    society: {
      socialStructure: '',
      lawsAndTaboos: '',
      economyAndTrade: '',
      educationAndRites: '',
    },
    warfare: {
      nativeFightingStyles: '',
      militaryOrganization: '',
      defenseEngineering: '',
    },
    world: {
      geographicalDistribution: '',
      diplomaticRelations: '',
      externalPerspective: '',
    },
    gmGuide: {
      roleplayingNpcs: '',
      themesAndConflicts: '',
    },
  };
}

/**
 * Serializes AncestryAttributes into clean, symmetrical HTML/Markdown consistent with Hecos pastel theme
 */
export function serializeAncestryToHTML(title: string, data: AncestryAttributes): string {
  const displayTitle = title || '[NOME DA ANCESTRALIDADE]';
  const jsonPayload = JSON.stringify(data);

  // Format Heritages Section
  const heritagesHTML = (data.heritages && data.heritages.length > 0)
    ? data.heritages
        .map(
          (h) => `
        <div style="margin-bottom: 14px; padding: 12px 14px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
          <h3 style="margin: 0 0 6px 0; color: #b19ecc; font-size: 16px; font-weight: 700;">${h.name || '[Nome da Herança]'}</h3>
          <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${h.description || ''}</p>
        </div>`
        )
        .join('\n')
    : '<p style="color: #71717a; font-style: italic; font-size: 13px;">Nenhuma herança específica cadastrada.</p>';

  // Format Feats Section
  const formatFeatsForRank = (rankNum: 1 | 5 | 9 | 13 | 17, featsList: AncestryFeat[] = []) => {
    if (!featsList || featsList.length === 0) return '';
    const rankHeader = `<h3 style="margin: 16px 0 8px 0; color: #74b6c2; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Rank ${rankNum}</h3>`;
    const items = featsList
      .map((f) => {
        const actionTag = f.actions && f.actions !== 'passive' ? ` <span style="display: inline-block; padding: 1px 6px; border-radius: 4px; background-color: #1b2a32; color: #74b6c2; font-size: 11px; font-family: monospace;">[${f.actions === 'free' ? 'Livre' : f.actions === 'reaction' ? 'Reação' : `${f.actions} Ação(ões)`}]</span>` : '';
        const traitsTag = f.traits && f.traits.length > 0 ? ` <span style="color: #b19ecc; font-size: 12px;">(${f.traits.join(', ')})</span>` : '';
        const prereq = f.prerequisites ? ` <br/><span style="color: #a1a1aa; font-size: 12px;"><em>Pré-requisitos:</em> ${f.prerequisites}</span>` : '';
        return `
        <div style="margin-bottom: 10px; padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
          <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">
            <strong style="color: #74b6c2;">${f.name}</strong>${actionTag}${traitsTag}: ${f.description}${prereq}
          </p>
        </div>`;
      })
      .join('\n');
    return rankHeader + '\n' + items;
  };

  const featsHTML = [
    formatFeatsForRank(1, data.feats?.rank1),
    formatFeatsForRank(5, data.feats?.rank5),
    formatFeatsForRank(9, data.feats?.rank9),
    formatFeatsForRank(13, data.feats?.rank13),
    formatFeatsForRank(17, data.feats?.rank17),
  ].filter(Boolean).join('\n') || '<p style="color: #71717a; font-style: italic; font-size: 13px;">Nenhum talento registrado.</p>';

  return `<!-- JSON_ANCESTRY_DATA: ${jsonPayload} -->
<div style="padding: 20px; border: 1px solid #2e4f5a; background-color: #13111b; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
    <h1 style="color: #74b6c2; font-size: 24px; font-weight: 800; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #2e4f5a; letter-spacing: -0.02em;">${displayTitle}</h1>
    <table style="width: 100%; border-collapse: collapse; background: none; border: none; table-layout: fixed;">
        <tbody>
          <tr>
            <td style="width: 50%; padding: 6px 12px 6px 0; vertical-align: top; border-bottom: 1px solid #1a2228;">
              <p style="margin: 0; color: #cb8394; font-weight: bold; font-size: 13px;">🩸 HP: <span style="color: #d4d4d8; font-weight: normal;">${data.hp || '8 PV'}</span></p>
            </td>
            <td style="width: 50%; padding: 6px 0 6px 12px; border-left: 1px solid #2e4f5a; border-bottom: 1px solid #1a2228; vertical-align: top;">
              <p style="margin: 0; color: #74b6c2; font-weight: bold; font-size: 13px;">📏 TAMANHO: <span style="color: #d4d4d8; font-weight: normal;">${data.size || 'Médio'}</span></p>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 6px 12px 6px 0; vertical-align: top; border-bottom: 1px solid #1a2228;">
              <p style="margin: 0; color: #b19ecc; font-weight: bold; font-size: 13px;">🏃 VELOCIDADE: <span style="color: #d4d4d8; font-weight: normal;">${data.speed || '25 pés (≈ 7,5 m)'}</span></p>
            </td>
            <td style="width: 50%; padding: 6px 0 6px 12px; border-left: 1px solid #2e4f5a; border-bottom: 1px solid #1a2228; vertical-align: top;">
              <p style="margin: 0; color: #74b6c2; font-weight: bold; font-size: 13px;">👁️ SENTIDOS: <span style="color: #d4d4d8; font-weight: normal;">${data.senses || 'Visão na Penumbra'}</span></p>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 6px 12px 6px 0; vertical-align: top; border-bottom: 1px solid #1a2228;">
              <p style="margin: 0; color: #d9a766; font-weight: bold; font-size: 13px;">🧠 ATRIBUTOS: <span style="color: #d4d4d8; font-weight: normal;">${data.attributes || '+2 Des, +2 Int, +2 Livre, -2 For'}</span></p>
            </td>
            <td style="width: 50%; padding: 6px 0 6px 12px; border-left: 1px solid #2e4f5a; border-bottom: 1px solid #1a2228; vertical-align: top;">
              <p style="margin: 0; color: #b19ecc; font-weight: bold; font-size: 13px;">🏷️ TRAÇOS: <span style="color: #d4d4d8; font-weight: normal;">${data.traits || 'Humanoide'}</span></p>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 6px 12px 6px 0; vertical-align: top;">
              <p style="margin: 0; color: #74b6c2; font-weight: bold; font-size: 13px;">🛠️ INATO: <span style="color: #d4d4d8; font-weight: normal;">${data.innate || '—'}</span></p>
            </td>
            <td style="width: 50%; padding: 6px 0 6px 12px; border-left: 1px solid #2e4f5a; vertical-align: top;">
              <p style="margin: 0; color: #b19ecc; font-weight: bold; font-size: 13px;">🗣️ IDIOMAS: <span style="color: #d4d4d8; font-weight: normal;">${data.languages || 'Humani'}</span></p>
            </td>
          </tr>
        </tbody>
    </table>
</div>

<div style="display: flex; flex-direction: column; gap: 24px;">
    <!-- HERANÇAS -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #74b6c2; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Heranças de Linhagem</h2>
        ${heritagesHTML}
    </section>

    <!-- ARSENAL CULTURAL -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #b19ecc; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Arsenal Cultural & Equipamentos Tradicionais</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
          <div style="padding: 12px 14px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 6px 0; color: #b19ecc; font-size: 15px; font-weight: 700;">Proficiências e Armas Tradicionais</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culturalArsenal?.proficienciesAndWeapons || '—'}</p>
          </div>
          <div style="padding: 12px 14px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 6px 0; color: #b19ecc; font-size: 15px; font-weight: 700;">Itens Únicos e Arquétipos Recomendados</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culturalArsenal?.uniqueItemsAndArchetypes || '—'}</p>
          </div>
        </div>
    </section>

    <!-- TALENTOS -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #74b6c2; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Talentos de Ancestralidade</h2>
        ${featsHTML}
    </section>

    <!-- FISIOLOGIA -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #b19ecc; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Fisiologia & Anatomia Detalhada</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Descrição Física e Dimorfismo</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.physiology?.physicalDescription || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Anatomia Funcional</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.physiology?.functionalAnatomy || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Linguagem Corporal</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.physiology?.bodyLanguage || '—'}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
            <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Ciclo de Vida e Envelhecimento</h3>
              <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.physiology?.lifeCycle || '—'}</p>
            </div>
            <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Dieta e Metabolismo</h3>
              <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.physiology?.dietAndMetabolism || '—'}</p>
            </div>
          </div>
        </div>
    </section>

    <!-- IDENTIDADE -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #74b6c2; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Identidade, Psicologia & Mentalidade</h2>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Gancho Narrativo</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6; font-style: italic;">${data.identity?.narrativeHook || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Psicologia e Filosofia</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.identity?.psychologyAndPhilosophy || '—'}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
            <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Mito da Criação</h3>
              <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.identity?.creationMyth || '—'}</p>
            </div>
            <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Épicos e Figuras Históricas</h3>
              <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.identity?.epicsAndFigures || '—'}</p>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
            <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Propósito Existencial</h3>
              <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.identity?.purpose || '—'}</p>
            </div>
            <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
              <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">O Aventureiro</h3>
              <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.identity?.theAdventurer || '—'}</p>
            </div>
          </div>
        </div>
    </section>

    <!-- CULTURA -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #b19ecc; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Cultura, Arte & Cotidiano</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Etiqueta e Costumes</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culture?.etiquetteAndCustoms || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Nomes e Significados</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culture?.namesAndMeanings || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Vestuário e Moda</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culture?.clothingAndFashion || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Expressões Artísticas</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culture?.artisticExpressions || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Gastronomia</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culture?.gastronomy || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Lazer e Esportes</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.culture?.leisureAndSports || '—'}</p>
          </div>
        </div>
    </section>

    <!-- ESPIRITUALIDADE -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #74b6c2; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Espiritualidade, Fé & Misticismo</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">O Panteão Nativo</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.spirituality?.nativePantheon || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Práticas Funerárias</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.spirituality?.funeraryPractices || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Conexão Mágica</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.spirituality?.magicalConnection || '—'}</p>
          </div>
        </div>
    </section>

    <!-- SOCIEDADE -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #b19ecc; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Estrutura Social, Leis & Economia</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Estrutura Social e Família</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.society?.socialStructure || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Leis, Ética e Tabus</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.society?.lawsAndTaboos || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Economia e Comércio</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.society?.economyAndTrade || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #b19ecc; font-size: 14px; font-weight: 700;">Educação e Ritos de Passagem</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.society?.educationAndRites || '—'}</p>
          </div>
        </div>
    </section>

    <!-- GUERRA -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #cb8394; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Guerra & Táticas Militares</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #3d1c25; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #cb8394; font-size: 14px; font-weight: 700;">Estilos de Luta Nativos</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.warfare?.nativeFightingStyles || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #3d1c25; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #cb8394; font-size: 14px; font-weight: 700;">Organização Militar</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.warfare?.militaryOrganization || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #3d1c25; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #cb8394; font-size: 14px; font-weight: 700;">Engenharia de Defesa</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.warfare?.defenseEngineering || '—'}</p>
          </div>
        </div>
    </section>

    <!-- NO MUNDO -->
    <section style="border-bottom: 1px solid #272438; padding-bottom: 20px;">
        <h2 style="color: #74b6c2; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">A Linhagem no Mundo de Hecos</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px;">
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Distribuição Geográfica</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.world?.geographicalDistribution || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Relações Diplomáticas</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.world?.diplomaticRelations || '—'}</p>
          </div>
          <div style="padding: 10px 12px; background-color: #0e0d14; border: 1px solid #1f2a30; border-radius: 8px;">
            <h3 style="margin: 0 0 4px 0; color: #74b6c2; font-size: 14px; font-weight: 700;">Perspectiva Externa e Visão do Mundo</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.world?.externalPerspective || '—'}</p>
          </div>
        </div>
    </section>

    <!-- GUIA DO MESTRE -->
    <section>
        <h2 style="color: #b19ecc; font-size: 20px; font-weight: 800; margin: 0 0 12px 0;">Guia do Mestre & Dicas de Narrativa</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
          <div style="padding: 12px 14px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 6px 0; color: #b19ecc; font-size: 15px; font-weight: 700;">Interpretando NPCs da Espécie</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.gmGuide?.roleplayingNpcs || '—'}</p>
          </div>
          <div style="padding: 12px 14px; background-color: #0e0d14; border: 1px solid #272438; border-radius: 8px;">
            <h3 style="margin: 0 0 6px 0; color: #b19ecc; font-size: 15px; font-weight: 700;">Temas e Conflitos Sugeridos</h3>
            <p style="margin: 0; color: #d4d4d8; font-size: 14px; line-height: 1.6;">${data.gmGuide?.themesAndConflicts || '—'}</p>
          </div>
        </div>
    </section>
</div>`;
}

/**
 * Parses raw HTML / Markdown to reconstruct AncestryAttributes if already saved
 */
export function parseAncestryFromContent(
  title: string,
  content: string,
  existingData?: AncestryAttributes
): AncestryAttributes {
  // If we already have structured ancestryData saved, prefer it directly
  if (existingData) {
    return JSON.parse(JSON.stringify(existingData));
  }

  // If content contains embedded JSON, parse it directly
  if (content) {
    const jsonMatch = content.match(/<!-- JSON_ANCESTRY_DATA:\s*(\{[\s\S]*?\})\s*-->/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed && typeof parsed === 'object') {
          return {
            ...getEmptyAncestryData(),
            ...parsed,
          };
        }
      } catch {
        // fallback to regex parsing
      }
    }
  }

  // If content is empty or fresh entity, return empty blank data
  if (!content || !content.trim() || content.includes('Escreva a história e os segredos de Hecos aqui')) {
    return getEmptyAncestryData();
  }

  const res: AncestryAttributes = getEmptyAncestryData();

  // Helper to extract text between label or headings
  const extractStat = (pattern: RegExp): string | null => {
    const m = content.match(pattern);
    return m && m[1] ? m[1].replace(/<[^>]+>/g, '').trim() : null;
  };

  // Header extraction
  const hp = extractStat(/(?:🩸\s*HP[^:]*:[^<]*<\/strong>|🩸\s*HP[^:]*:\*\*|🩸\s*HP:)\s*([^<\n]+)/i);
  if (hp) res.hp = hp;

  const size = extractStat(/(?:📏\s*TAMANHO[^:]*:[^<]*<\/strong>|📏\s*TAMANHO[^:]*:\*\*|📏\s*TAMANHO:)\s*([^<\n]+)/i);
  if (size) res.size = size;

  const speed = extractStat(/(?:🏃\s*VELOCIDADE[^:]*:[^<]*<\/strong>|🏃\s*VELOCIDADE[^:]*:\*\*|🏃\s*VELOCIDADE:)\s*([^<\n]+)/i);
  if (speed) res.speed = speed;

  const senses = extractStat(/(?:👁️\s*SENTIDOS[^:]*:[^<]*<\/strong>|👁️\s*SENTIDOS[^:]*:\*\*|👁️\s*SENTIDOS:)\s*([^<\n]+)/i);
  if (senses) res.senses = senses;

  const attributes = extractStat(/(?:🧠\s*ATRIBUTOS[^:]*:[^<]*<\/strong>|🧠\s*ATRIBUTOS[^:]*:\*\*|🧠\s*ATRIBUTOS:)\s*([^<\n]+)/i);
  if (attributes) res.attributes = attributes;

  const traits = extractStat(/(?:🏷️\s*TRAÇOS[^:]*:[^<]*<\/strong>|🏷️\s*TRAÇOS[^:]*:\*\*|🏷️\s*TRAÇOS:)\s*([^<\n]+)/i);
  if (traits) res.traits = traits;

  const innate = extractStat(/(?:🛠️\s*INATO[^:]*:[^<]*<\/strong>|🛠️\s*INATO[^:]*:\*\*|🛠️\s*INATO:)\s*([^<\n]+)/i);
  if (innate) res.innate = innate;

  const languages = extractStat(/(?:🗣️\s*IDIOMAS[^:]*:[^<]*<\/strong>|🗣️\s*IDIOMAS[^:]*:\*\*|🗣️\s*IDIOMAS:)\s*([^<\n]+)/i);
  if (languages) res.languages = languages;

  // Helper to extract text under h2/h3
  const extractSectionText = (headingText: string): string | null => {
    const regex = new RegExp(
      `(?:<h2[^>]*>.*?${headingText}.*?</h2>\\s*<p[^>]*>(?:<span[^>]*>)?([\\s\\S]*?)(?:</span>)?</p>|##\\s*${headingText}[^\\n]*\\n([\\s\\S]*?)(?=(?:\\n##|\\n#|$)))`,
      'i'
    );
    const m = content.match(regex);
    if (!m) return null;
    const raw = (m[1] || m[2] || '').trim();
    return raw.replace(/<[^>]+>/g, '').trim();
  };

  // Lore fields
  const pDesc = extractSectionText('Descrição Física e Dimorfismo');
  if (pDesc) res.physiology.physicalDescription = pDesc;

  const fAnat = extractSectionText('Anatomia Funcional');
  if (fAnat) res.physiology.functionalAnatomy = fAnat;

  const bLang = extractSectionText('Linguagem Corporal');
  if (bLang) res.physiology.bodyLanguage = bLang;

  const lCycle = extractSectionText('Ciclo de Vida e Envelhecimento');
  if (lCycle) res.physiology.lifeCycle = lCycle;

  const dMeta = extractSectionText('Dieta e Metabolismo');
  if (dMeta) res.physiology.dietAndMetabolism = dMeta;

  const nHook = extractSectionText('Gancho Narrativo') || extractSectionText('O Gancho Narrativo');
  if (nHook) res.identity.narrativeHook = nHook;

  const psych = extractSectionText('Psicologia e Filosofia');
  if (psych) res.identity.psychologyAndPhilosophy = psych;

  const cMyth = extractSectionText('Mito da Criação');
  if (cMyth) res.identity.creationMyth = cMyth;

  const eFig = extractSectionText('Épicos e Figuras Históricas');
  if (eFig) res.identity.epicsAndFigures = eFig;

  const purp = extractSectionText('Propósito Existencial');
  if (purp) res.identity.purpose = purp;

  const adv = extractSectionText('O Aventureiro');
  if (adv) res.identity.theAdventurer = adv;

  const etiq = extractSectionText('Etiqueta e Costumes');
  if (etiq) res.culture.etiquetteAndCustoms = etiq;

  const names = extractSectionText('Nomes e Significados');
  if (names) res.culture.namesAndMeanings = names;

  const cloth = extractSectionText('Vestuário e Moda');
  if (cloth) res.culture.clothingAndFashion = cloth;

  const arts = extractSectionText('Expressões Artísticas');
  if (arts) res.culture.artisticExpressions = arts;

  const gast = extractSectionText('Gastronomia');
  if (gast) res.culture.gastronomy = gast;

  const leis = extractSectionText('Lazer e Esportes');
  if (leis) res.culture.leisureAndSports = leis;

  const pant = extractSectionText('O Panteão Nativo') || extractSectionText('Panteão Nativo');
  if (pant) res.spirituality.nativePantheon = pant;

  const fune = extractSectionText('Práticas Funerárias');
  if (fune) res.spirituality.funeraryPractices = fune;

  const magc = extractSectionText('Conexão Mágica');
  if (magc) res.spirituality.magicalConnection = magc;

  const socs = extractSectionText('Estrutura Social e Família');
  if (socs) res.society.socialStructure = socs;

  const laws = extractSectionText('Leis, Ética e Tabus');
  if (laws) res.society.lawsAndTaboos = laws;

  const econ = extractSectionText('Economia e Comércio');
  if (econ) res.society.economyAndTrade = econ;

  const educ = extractSectionText('Educação e Ritos de Passagem');
  if (educ) res.society.educationAndRites = educ;

  const fight = extractSectionText('Estilos de Luta Nativos');
  if (fight) res.warfare.nativeFightingStyles = fight;

  const milo = extractSectionText('Organização Militar');
  if (milo) res.warfare.militaryOrganization = milo;

  const defo = extractSectionText('Engenharia de Defesa');
  if (defo) res.warfare.defenseEngineering = defo;

  const geod = extractSectionText('Distribuição Geográfica');
  if (geod) res.world.geographicalDistribution = geod;

  const dipl = extractSectionText('Relações Diplomáticas');
  if (dipl) res.world.diplomaticRelations = dipl;

  const extp = extractSectionText('Perspectiva Externa');
  if (extp) res.world.externalPerspective = extp;

  const rNpc = extractSectionText('Interpretando NPCs');
  if (rNpc) res.gmGuide.roleplayingNpcs = rNpc;

  const them = extractSectionText('Temas e Conflitos');
  if (them) res.gmGuide.themesAndConflicts = them;

  const profw = extractSectionText('Proficiências e Armas');
  if (profw) res.culturalArsenal.proficienciesAndWeapons = profw;

  const uniqi = extractSectionText('Itens Únicos e Arquétipos');
  if (uniqi) res.culturalArsenal.uniqueItemsAndArchetypes = uniqi;

  return res;
}
