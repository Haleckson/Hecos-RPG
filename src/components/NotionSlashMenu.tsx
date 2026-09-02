import React, { useState, useEffect, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Info,
  ShieldAlert,
  Sparkles,
  Coins,
  TreePine,
  Lock,
  Table,
  Columns,
  Code,
  Minus,
  Youtube,
  Image as ImageIcon,
  BookOpen,
  AtSign,
  Search,
  Zap,
  Sword,
  Wand2,
  FileText,
  Award
} from 'lucide-react';
import { PF2eActionGlyph } from './PF2eActionGlyph';

export interface SlashCommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'basico' | 'caixas' | 'pf2e' | 'avancado';
  icon: React.ReactNode;
  keywords: string[];
  execute: () => void;
}

interface NotionSlashMenuProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onInsertSnippet: (snippet: string, replaceSlashLength?: number) => void;
  onOpenImgBBUpload?: () => void;
  onTriggerMention?: () => void;
}

export const NotionSlashMenu: React.FC<NotionSlashMenuProps> = ({
  isOpen,
  onClose,
  query,
  onInsertSnippet,
  onOpenImgBBUpload,
  onTriggerMention,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: SlashCommandItem[] = [
    // BÁSICO
    {
      id: 'h1',
      title: 'Título 1 (H1)',
      subtitle: 'Cabeçalho principal de seção em Cinzel com barra lateral ciano',
      category: 'basico',
      icon: <Heading1 className="w-4 h-4 text-cyan-400" />,
      keywords: ['h1', 'titulo', 'header', 'cabecalho', 'grande'],
      execute: () => onInsertSnippet('# Título da Seção\n\n'),
    },
    {
      id: 'h2',
      title: 'Título 2 (H2)',
      subtitle: 'Subtítulo intermediário com barra lateral malva',
      category: 'basico',
      icon: <Heading2 className="w-4 h-4 text-purple-400" />,
      keywords: ['h2', 'subtitulo', 'header', 'medio'],
      execute: () => onInsertSnippet('## Subtítulo do Tópico\n\n'),
    },
    {
      id: 'h3',
      title: 'Título 3 (H3)',
      subtitle: 'Subcabeçalho menor em ciano com detalhe bordô',
      category: 'basico',
      icon: <Heading3 className="w-4 h-4 text-rose-400" />,
      keywords: ['h3', 'subtitulo', 'pequeno', 'secao'],
      execute: () => onInsertSnippet('### Nome do Subtópico\n\n'),
    },
    {
      id: 'bullet_list',
      title: 'Lista com Marcadores',
      subtitle: 'Lista de tópicos não ordenada com marcadores ciano',
      category: 'basico',
      icon: <List className="w-4 h-4 text-cyan-400" />,
      keywords: ['lista', 'bullet', 'marcadores', 'topicos', 'ul'],
      execute: () => onInsertSnippet('- Item de lista 1\n- Item de lista 2\n- Item de lista 3\n'),
    },
    {
      id: 'numbered_list',
      title: 'Lista Numerada',
      subtitle: 'Lista sequencial 1, 2, 3...',
      category: 'basico',
      icon: <ListOrdered className="w-4 h-4 text-purple-400" />,
      keywords: ['numero', 'ordem', 'numerada', 'ol', '1.'],
      execute: () => onInsertSnippet('1. Primeiro passo\n2. Segundo passo\n3. Terceiro passo\n'),
    },
    {
      id: 'checklist',
      title: 'Lista de Tarefas / Checklist',
      subtitle: 'Caixas de seleção interativas para objetivos e quests',
      category: 'basico',
      icon: <CheckSquare className="w-4 h-4 text-emerald-400" />,
      keywords: ['tarefa', 'check', 'todo', 'missao', 'quest', 'box'],
      execute: () => onInsertSnippet('- [ ] Tarefa ou objetivo pendente\n- [ ] Investigar os arredores\n- [x] Objetivo já concluído\n'),
    },
    {
      id: 'toggle',
      title: 'Lista Expansível (Toggle)',
      subtitle: 'Caixa retrátil para ocultar spoilers, lore densa ou fichas',
      category: 'basico',
      icon: <ChevronRight className="w-4 h-4 text-purple-400" />,
      keywords: ['toggle', 'accordion', 'recolher', 'expansivel', 'details', 'spoiler', 'oculto'],
      execute: () => onInsertSnippet('<details>\n<summary><b>Clique para Revelar Detalhes</b></summary>\n\nConteúdo oculto que pode ser expandido quando o leitor quiser.\n\n</details>\n\n'),
    },
    {
      id: 'quote',
      title: 'Citação / Depoimento',
      subtitle: 'Citação com borda lateral e texto em itálico',
      category: 'basico',
      icon: <Quote className="w-4 h-4 text-zinc-400" />,
      keywords: ['citacao', 'quote', 'fala', 'depoimento', 'bloco'],
      execute: () => onInsertSnippet('> "As cinzas da penumbra nunca mentem, elas apenas esperam que você durma."\n> — *Crônicas do Salgueiro de Hecos*\n\n'),
    },
    {
      id: 'divider',
      title: 'Divisor Horizontal',
      subtitle: 'Linha separadora elegante com gradiente',
      category: 'basico',
      icon: <Minus className="w-4 h-4 text-zinc-400" />,
      keywords: ['linha', 'divisor', 'separador', 'hr', '---'],
      execute: () => onInsertSnippet('\n---\n\n'),
    },

    // DESTAQUES / CAIXAS NOTION
    {
      id: 'callout_info',
      title: 'Caixa de Informação (Ciano)',
      subtitle: 'Destaque visual para notas de lore, história e contexto',
      category: 'caixas',
      icon: <Info className="w-4 h-4 text-cyan-400" />,
      keywords: ['info', 'lore', 'ciano', 'callout', 'nota', 'card'],
      execute: () => onInsertSnippet('> ℹ️ **LORE & CONHECIMENTO:** Detalhes importantes sobre o cenário ou personagem que merecem atenção especial dos jogadores.\n\n'),
    },
    {
      id: 'callout_hazard',
      title: 'Caixa de Perigo / Alerta (Bordô)',
      subtitle: 'Destaque para ameaças, combates mortais e armadilhas',
      category: 'caixas',
      icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
      keywords: ['perigo', 'combate', 'alerta', 'bordo', 'dano', 'morte', 'armadilha'],
      execute: () => onInsertSnippet('> 🩸 **PERIGO / AMEAÇA ATIVA:** A atmosfera nesta câmara está impregnada de esporos venenosos (Fortitude CD 22 contra Veneno Nível 4).\n\n'),
    },
    {
      id: 'callout_eclipse',
      title: 'Caixa Mística / Eclipse (Malva)',
      subtitle: 'Destaque para efeitos planares, penumbra e ocultismo',
      category: 'caixas',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      keywords: ['eclipse', 'malva', 'penumbra', 'magia', 'oculto', 'ritual'],
      execute: () => onInsertSnippet('> 🌌 **EFEITO DE PENUMBRA:** Durante o eclipse de Hecos, magias de tradição Etérea recebem +1 de status na CD de salvamento.\n\n'),
    },
    {
      id: 'callout_treasure',
      title: 'Caixa de Tesouro / Relíquia (Ouro)',
      subtitle: 'Destaque para itens lendários, recompensas e loot',
      category: 'caixas',
      icon: <Coins className="w-4 h-4 text-amber-400" />,
      keywords: ['tesouro', 'ouro', 'recompensa', 'item', 'loot', 'dinheiro'],
      execute: () => onInsertSnippet('> 💰 **RECOMPENSA & TESOURO:** Ao derrotar a criatura, os heróis encontram 120 PO e uma *Adaga de Prata do Eclipse* (+1 Rúnica).\n\n'),
    },
    {
      id: 'callout_nature',
      title: 'Caixa de Ermos / Fauna (Esmeralda)',
      subtitle: 'Destaque para ecossistemas, rastreamento e sobrevivência',
      category: 'caixas',
      icon: <TreePine className="w-4 h-4 text-emerald-400" />,
      keywords: ['natureza', 'ermos', 'fauna', 'flora', 'esmeralda', 'verde', 'sobrevivencia'],
      execute: () => onInsertSnippet('> 🌿 **ECOSSISTEMA & SOBREVIVÊNCIA:** Esta região exige teste de Sobrevivência CD 19 para forragem ou evitar animais carniceiros.\n\n'),
    },
    {
      id: 'callout_secret',
      title: 'Caixa de Segredo do Mestre (GM Only)',
      subtitle: 'Anotações confidenciais, tramas ocultas e pistas do GM',
      category: 'caixas',
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      keywords: ['gm', 'mestre', 'segredo', 'oculto', 'spoiler', 'confidencial'],
      execute: () => onInsertSnippet('> 🔒 **SEGREDO DO MESTRE:** O líder do culto é na verdade o irmão do taverneiro. Ele possui a chave da masmorra no colar.\n\n'),
    },

    // PATHFINDER 2E MACROS, GLYPHS & TRAITS
    {
      id: 'insert_trait',
      title: 'Traço / Trait PF2e (/tr)',
      subtitle: 'Inserir distintivo de Traço oficial (ex: [tr:Humanoide], [tr:Incomum], [tr:Fogo])',
      category: 'pf2e',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      keywords: ['tr', 'trait', 'traco', 'traço', 'pf2e', 'badge', 'tag', 'raridade', 'escola'],
      execute: () => onInsertSnippet('[tr:Incomum] '),
    },
    {
      id: 'glyph_1_action',
      title: 'Glifo: 1 Ação [1-action]',
      subtitle: 'Símbolo oficial de 1 ação do PF2e com tooltip',
      category: 'pf2e',
      icon: <PF2eActionGlyph type="1-action" size="sm" showTooltip={false} />,
      keywords: ['1-action', 'uma acao', 'acao', 'pf2e', 'glyph', 'glifo'],
      execute: () => onInsertSnippet('**[1-action] Golpe Rápido:** **Requisitos:** Arma empunhada. **Efeito:** Faça um Golpe Corpo a Corpo.\n\n'),
    },
    {
      id: 'glyph_2_actions',
      title: 'Glifo: 2 Ações [2-actions]',
      subtitle: 'Símbolo oficial de 2 ações do PF2e',
      category: 'pf2e',
      icon: <PF2eActionGlyph type="2-actions" size="sm" showTooltip={false} />,
      keywords: ['2-actions', 'duas acoes', 'pf2e', 'acao dupla', 'magia'],
      execute: () => onInsertSnippet('**[2-actions] Conjuração Maior:** Descrição do efeito de 2 ações.\n\n'),
    },
    {
      id: 'glyph_3_actions',
      title: 'Glifo: 3 Ações [3-actions]',
      subtitle: 'Símbolo oficial de 3 ações do PF2e',
      category: 'pf2e',
      icon: <PF2eActionGlyph type="3-actions" size="sm" showTooltip={false} />,
      keywords: ['3-actions', 'tres acoes', 'pf2e', 'acao tripla', 'ritual'],
      execute: () => onInsertSnippet('**[3-actions] Ataque Devastador:** Requer todas as 3 ações do turno.\n\n'),
    },
    {
      id: 'glyph_free',
      title: 'Glifo: Ação Livre [free-action]',
      subtitle: 'Símbolo oficial de ação livre do PF2e',
      category: 'pf2e',
      icon: <PF2eActionGlyph type="free-action" size="sm" showTooltip={false} />,
      keywords: ['free', 'livre', 'free-action', 'acao livre', 'pf2e'],
      execute: () => onInsertSnippet('**[free-action] Liberação Espontânea:** **Gatilho:** No início do seu turno. **Efeito:** ...\n\n'),
    },
    {
      id: 'glyph_reaction',
      title: 'Glifo: Reação [reaction]',
      subtitle: 'Símbolo oficial de reação com gatilho',
      category: 'pf2e',
      icon: <PF2eActionGlyph type="reaction" size="sm" showTooltip={false} />,
      keywords: ['reacao', 'reaction', 'gatilho', 'pf2e', 'interromper'],
      execute: () => onInsertSnippet('**[reaction] Resposta Instantânea:** **Gatilho:** Um inimigo na sua área de alcance sai do espaço. **Efeito:** Faça um Golpe contra o alvo.\n\n'),
    },
    {
      id: 'template_creature',
      title: 'Ficha Completa de Monstro / NPC (Statblock PF2e)',
      subtitle: 'Template completo com CA, PV, Salvamentos, Percepção e Ataques',
      category: 'pf2e',
      icon: <Sword className="w-4 h-4 text-rose-400" />,
      keywords: ['monstro', 'criatura', 'npc', 'statblock', 'ficha', 'bestiario', 'ca', 'pv'],
      execute: () =>
        onInsertSnippet(`### Estatísticas da Criatura
- **Nível:** 5 | **Traços:** Incomum, Médio, Aberração, Sombrio
- **Percepção:** +13 (Visão no Escuro, Faro Impreciso 30 pés)
- **Idiomas:** Comum, Aklo
- **Perícias:** Atletismo +14, Furtividade +13, Ocultismo +11
- **For** +4, **Des** +3, **Con** +3, **Int** +0, **Sab** +2, **Car** -1
- **CA:** 22 | **Fort:** +14, **Ref:** +12, **Vont:** +10
- **PV:** 75 | **Imunidades:** Dano mental | **Fraquezas:** Fogo 5
- **Deslocamento:** 30 pés, Escalada 20 pés

**Ações de Combate:**
- **[1-action] Mordida:** +14 corpo a corpo (ágil), Dano 2d8+6 perfurante mais 1d6 ácido.
- **[2-actions] Olhar da Penumbra:** A criatura fixa seus olhos num alvo em até 30 pés. O alvo deve ter sucesso num salvamento de Vontade CD 21 ou fica Amedrontado 2.
- **[reaction] Contracolpe Voraz:** **Gatilho:** Um inimigo erra um Golpe corpo a corpo contra ela. **Efeito:** Faz um Golpe de mordida com penalidade de ataque múltiplo.\n\n`),
    },
    {
      id: 'template_spell',
      title: 'Grimório / Ficha de Feitiço PF2e',
      subtitle: 'Template para magias, rituais, tradições e efeitos',
      category: 'pf2e',
      icon: <Wand2 className="w-4 h-4 text-cyan-400" />,
      keywords: ['magia', 'feitico', 'spell', 'grimorio', 'tradicao', 'rank', 'ritual'],
      execute: () =>
        onInsertSnippet(`### Feitiço: Véu da Penumbra de Hecos
- **Rank:** 3 | **Tradições:** Cinética, Etérea
- **Conjuração:** [2-actions] somática, verbal
- **Alcance:** 60 pés | **Área:** Explosão de 20 pés
- **Duração:** 1 minuto | **Salvamento:** Reflexos básico CD 20

Uma névoa malva espessa preenche a área. Todas as criaturas na área recebem Ocultação. Criaturas inimigas sofrem 4d6 de dano de frio e terreno difícil.
- **Amplificado (+1):** O dano aumenta em 1d6 e a área em 5 pés.\n\n`),
    },

    // AVANÇADO
    {
      id: 'table',
      title: 'Tabela de Dados Formatada',
      subtitle: 'Tabela de atributos, encontros ou lista de itens',
      category: 'avancado',
      icon: <Table className="w-4 h-4 text-cyan-400" />,
      keywords: ['tabela', 'grid', 'colunas', 'dados', 'linhas', 'table'],
      execute: () =>
        onInsertSnippet(`| Nível | Nome da Ameaça | Tipo de Perigo | Recompensa (XP/PO) |
|---|---|---|---|
| Nível 1 | Ratos da Penumbra | Besta Menor | 30 XP / 5 PO |
| Nível 3 | Carniçal de Hecos | Morto-Vivo | 80 XP / 25 PO |
| Nível 5 | Guardião de Cinza | Construto Élfico | 120 XP / 100 PO |\n\n`),
    },
    {
      id: 'code_block',
      title: 'Bloco de Código / Dados Técnicos',
      subtitle: 'Bloco com fundo escuro e botão de copiar',
      category: 'avancado',
      icon: <Code className="w-4 h-4 text-purple-400" />,
      keywords: ['codigo', 'code', 'script', 'json', 'bloco'],
      execute: () =>
        onInsertSnippet('```json\n{\n  "nome": "Orbe do Eclipse",\n  "nivel": 7,\n  "preco": 350,\n  "raridade": "incomum"\n}\n```\n\n'),
    },
    {
      id: 'mention_link',
      title: 'Link / Menção de Artigo (@)',
      subtitle: 'Conectar este artigo com outro personagem, local ou regra',
      category: 'avancado',
      icon: <AtSign className="w-4 h-4 text-cyan-400" />,
      keywords: ['mencao', 'link', 'arroba', '@', 'artigo', 'conectar', 'wiki'],
      execute: () => {
        if (onTriggerMention) onTriggerMention();
        else onInsertSnippet('@');
      },
    },
    {
      id: 'youtube_audio',
      title: 'Trilha Sonora / Player do YouTube',
      subtitle: 'Incorporar player de música imersiva para o cenário',
      category: 'avancado',
      icon: <Youtube className="w-4 h-4 text-rose-400" />,
      keywords: ['youtube', 'musica', 'audio', 'som', 'trilha', 'video'],
      execute: () =>
        onInsertSnippet('\n<div class="youtube-player" data-video="0m4sT68tBvo">Trilha Sonora Recomendada: Penumbra de Hecos</div>\n\n'),
    },
    {
      id: 'ancestry_template',
      title: 'Template Completo de Ancestralidade',
      subtitle: 'Insere as 11 seções temáticas, tabela de estatísticas, heranças e talentos',
      category: 'avancado',
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      keywords: ['ancestralidade', 'raca', 'ancestry', 'template', 'pf2e', 'heranca', 'talento'],
      execute: () =>
        onInsertSnippet(`<!-- [NOME DA ANCESTRALIDADE] -->
<div style="padding: 12px; border: 2px solid #4FEFEF; background-color: rgba(211,159,224,0.14); border-radius: 5px;">
    <p style="font-size: 24px; font-weight: bold; color: #4FEFEF; margin: 0 0 10px 0;">ESTATÍSTICAS DA ANCESTRALIDADE</p>
    <table style="width: 100%; border-collapse: collapse; background: none; border: none;">
        <tbody>
            <tr>
                <td style="width: 50%; padding: 4px 0; color: #F6F5F4;"><strong>PONTOS DE VIDA:</strong> [6/8/10/12]</td>
                <td style="width: 50%; padding: 4px 0; color: #F6F5F4;"><strong>TAMANHO:</strong> [Médio / Pequeno]</td>
            </tr>
            <tr>
                <td style="width: 50%; padding: 4px 0; color: #F6F5F4;"><strong>DESLOCAMENTO:</strong> [7,5 m / 9 m]</td>
                <td style="width: 50%; padding: 4px 0; color: #F6F5F4;"><strong>AUMENTO DE ATRIBUTO:</strong> [Atributos]</td>
            </tr>
            <tr>
                <td style="width: 50%; padding: 4px 0; color: #F6F5F4;"><strong>DEFICIÊNCIA DE ATRIBUTO:</strong> [Se houver]</td>
                <td style="width: 50%; padding: 4px 0; color: #F6F5F4;"><strong>IDIOMAS:</strong> [Comum + adicionais]</td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px 0; color: #F6F5F4;"><strong>TRAÇOS:</strong> [Humanóide, etc.]</td>
            </tr>
            <tr>
                <td colspan="2" style="padding: 4px 0; color: #F6F5F4;"><strong>VISÃO / HABILIDADES ESPECIAIS:</strong> [Visão na Penumbra / Visão no Escuro]</td>
            </tr>
        </tbody>
    </table>
</div>

### 1. Você Pode...
* Agir com bravura diante do desconhecido de Hecos.
* Valorizar as tradições e laços do seu povo.
* Buscar novas verdades além do horizonte.

### 2. Outros Provavelmente...
* Respeitam sua determinação inabalável.
* Admiram suas habilidades únicas e resiliência.

### 3. Descrição Física
Descreva aqui a aparência, altura média, cores de olhos, pele, cabelos e detalhes anatômicos distintos.

### 4. Sociedade & Organização
Como esta espécie vive em sociedade, quais são suas vilas, cidades, conselhos e leis fundamentais.

### 5. Crenças & Deuses
Qual a postura religiosa e filosófica predominante em relação ao panteão e aos mistérios de Hecos.

### 6. Relações com Outros Povos
Como esta ancestralidade interage com as demais raças e civilizações vizinhas.

### 7. Nomes Populares
* **Exemplos Masculinos:** Nome 1, Nome 2, Nome 3
* **Exemplos Femininos:** Nome 1, Nome 2, Nome 3
* **Sobrenomes / Clãs:** Clã 1, Clã 2

### 8. Aventureiros
Por que membros desta espécie deixam o conforto de suas casas para explorar as ruínas e perigos de Hecos.

### 9. Heranças da Ancestralidade
#### [Nome da Herança 1]
Descrição dos benefícios biológicos ou mágicos herdados por esta linhagem.

#### [Nome da Herança 2]
Descrição dos benefícios biológicos ou mágicos herdados por esta linhagem.

### 10. Talentos de Ancestralidade (Nível 1+)
#### [Nome do Talento 1] • Talento 1
* **Pré-requisitos:** [Se houver]
* **Frequência / Gatilho:** [Se aplicável]
Descrição mecânica completa da habilidade e seus benefícios em jogo.

#### [Nome do Talento 2] • Talento 1
* **Pré-requisitos:** [Se houver]
Descrição mecânica completa da habilidade.
\n\n`),
    },
  ];

  // Filter commands by search query
  const cleanQuery = query.replace(/^\//, '').toLowerCase().trim();
  const filteredCommands = commands.filter((cmd) => {
    if (!cleanQuery) return true;
    return (
      cmd.title.toLowerCase().includes(cleanQuery) ||
      cmd.subtitle.toLowerCase().includes(cleanQuery) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(cleanQuery))
    );
  });

  // Handle keyboard events (up, down, enter, escape)
  useEffect(() => {
    setSelectedIndex(0);
  }, [cleanQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        if (filteredCommands.length > 0) {
          e.preventDefault();
          filteredCommands[selectedIndex]?.execute();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  const categoryTitles = {
    basico: 'Estrutura Básica',
    caixas: 'Caixas de Destaque (Notion Callouts)',
    pf2e: 'Pathfinder 2e & Ações',
    avancado: 'Avançado & Mídia',
  };

  return (
    <div
      ref={menuRef}
      className="absolute left-6 top-10 z-[99999] w-96 max-h-96 overflow-hidden flex flex-col rounded-2xl bg-[#0f0c1a]/98 backdrop-blur-2xl border-2 border-purple-500/80 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(168,85,247,0.4)] text-zinc-100 animate-in fade-in zoom-in-95 duration-150 ring-2 ring-purple-500/30"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#171226] border-b border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Comandos Rápidos do Notion (/)</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 border border-zinc-800 text-zinc-400 font-mono">
          {filteredCommands.length} opções
        </span>
      </div>

      {/* List of commands */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {filteredCommands.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            Nenhum comando correspondente a "{cleanQuery}".
          </div>
        ) : (
          filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.id}
                type="button"
                onClick={() => {
                  cmd.execute();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-start gap-3 p-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/80 to-purple-950/80 border border-cyan-500/50 text-zinc-100 shadow-sm'
                    : 'hover:bg-zinc-800/40 text-zinc-300 border border-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                    isSelected
                      ? 'bg-black/60 border-cyan-500/60 text-cyan-300'
                      : 'bg-black/40 border-zinc-800 text-zinc-400'
                  }`}
                >
                  {cmd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold truncate text-zinc-100">{cmd.title}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/40 text-zinc-500 border border-zinc-800/80">
                      {cmd.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 leading-snug">
                    {cmd.subtitle}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="px-3 py-1.5 bg-[#090710] border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Use ↑ ↓ para navegar • Enter para inserir</span>
        <span>Esc para fechar</span>
      </div>
    </div>
  );
};
