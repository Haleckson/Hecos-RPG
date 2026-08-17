export interface AncestryTemplateSection {
  id: string;
  title: string;
  category: 'mechanics' | 'biology' | 'culture' | 'society' | 'lore';
  icon: string;
  subsections: {
    id: string;
    title: string;
    description: string;
    placeholder: string;
  }[];
}

export const ANCESTRY_CATEGORIES = [
  {
    id: 'mechanics',
    name: 'Mecânicas & Heranças',
    subtitle: 'Regras, Atributos, Heranças e Talentos de Ancestralidade',
    icon: 'Swords',
    color: 'text-cyan-300',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/20'
  },
  {
    id: 'biology',
    name: 'Fisiologia & Biologia',
    subtitle: 'Anatomia, Dimorfismo, Ciclo de Vida e Metabolismo',
    icon: 'Dna',
    color: 'text-purple-300',
    border: 'border-purple-500/40',
    bg: 'bg-purple-950/20'
  },
  {
    id: 'culture',
    name: 'Cultura, Arte & Cotidiano',
    subtitle: 'Costumes, Nomes, Moda, Gastronomia e Lazer',
    icon: 'Sparkles',
    color: 'text-amber-300',
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/20'
  },
  {
    id: 'society',
    name: 'Sociedade, Fé & Guerra',
    subtitle: 'Governança, Religião, Leis e Táticas Militares',
    icon: 'Shield',
    color: 'text-rose-300',
    border: 'border-rose-500/40',
    bg: 'bg-rose-950/20'
  },
  {
    id: 'lore',
    name: 'Mundo, Lore & Mestre',
    subtitle: 'Geografia em Hecos, Filosofia, Diplomacia e Guia do GM',
    icon: 'Compass',
    color: 'text-emerald-300',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/20'
  }
] as const;

/**
 * Returns the default full Markdown/HTML template formatted for Hecos Ancestries
 */
export function getFullAncestryTemplate(ancestryName = '[NOME DA ANCESTRALIDADE]'): string {
  return `<!-- STATBLOCK MECÂNICO PRINCIPAL -->
<div style="padding: 14px; border: 2px solid #4FEFEF; background-color: rgba(211,159,224,0.12); border-radius: 8px 8px 0 0; box-shadow: 0 0 15px rgba(79,239,239,0.15);">
    <p style="margin: 0;"><span style="font-family: Cinzel, serif; font-size: 28px; font-weight: bold; color: #4FEFEF; text-shadow: 0 0 10px rgba(79,239,239,0.5);">${ancestryName}</span></p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; background: none; border: none;">
        <tbody>
            <tr>
                <td style="width: 50%; padding: 4px 0;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #ff5e7e;">🩸 HP (Pontos de Vida):</strong> 8 PV</span></p>
                </td>
                <td style="width: 50%; padding: 4px 0; border-left: 1px solid rgba(79,239,239,0.3); padding-left: 15px;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #4FEFEF;">📏 TAMANHO:</strong> Médio</span></p>
                </td>
            </tr>
            <tr>
                <td style="width: 50%; padding: 4px 0;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #D39FE0;">🏃 VELOCIDADE:</strong> 25 pés (≈ 7,5 m)</span></p>
                </td>
                <td style="width: 50%; padding: 4px 0; border-left: 1px solid rgba(79,239,239,0.3); padding-left: 15px;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #4FEFEF;">👁️ SENTIDOS:</strong> Visão na Penumbra</span></p>
                </td>
            </tr>
            <tr>
                <td style="width: 50%; padding: 4px 0;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #f6ad55;">🧠 ATRIBUTOS:</strong> +2 Destreza, +2 Inteligência, +2 Livre, -2 Força</span></p>
                </td>
                <td style="width: 50%; padding: 4px 0; border-left: 1px solid rgba(79,239,239,0.3); padding-left: 15px;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #D39FE0;">🏷️ TRAÇOS:</strong> Humanoide, ${ancestryName}</span></p>
                </td>
            </tr>
            <tr>
                <td style="width: 50%; padding: 4px 0;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #4FEFEF;">🛠️ INATO:</strong> Habilidade passiva de adaptação às correntes de Hecos.</span></p>
                </td>
                <td style="width: 50%; padding: 4px 0; border-left: 1px solid rgba(79,239,239,0.3); padding-left: 15px;">
                    <p style="margin: 0;"><span style="font-size: 15px; color: #F6F5F4; line-height: 1.6"><strong style="color: #4FEFEF;">🗣️ IDIOMAS:</strong> Humani, Idioma Ancestral + adicionais iguais ao modificador de Int</span></p>
                </td>
            </tr>
        </tbody>
    </table>
</div>

---

# 1: Heranças (Heritages)

### [Nome da Herança 1]
Descreva o que torna esta linhagem ou subespécie única no mundo de Hecos.  
**Benefício Mecânico:** Você recebe **Resistência 3 a dano de frio**, a perícia **Ocultismo** treinada e a ação especial *Pulso de Penumbra*.

### [Nome da Herança 2]
Uma linhagem adaptada às profundezas aquáticas ou às florestas luminescentes de Hecos.  
**Benefício Mecânico:** Você recebe **Deslocamento de Natação de 20 pés** e pode prender a respiração por até 10 minutos.

---

# 2: Fisiologia e Anatomia Detalhada

## Descrição Física e Dimorfismo
Detalhe a aparência média, estatura, compleição, tons de pele (de tons pálidos a iridescentes cianos), tipos de cabelo e as diferenças visuais entre os gêneros ou castas da espécie.

## Anatomia Funcional
Explique como o corpo funciona. Possuem órgãos extras, bioluminescência nos poros, ossos ocos ou articulações reforçadas? Como seus sentidos interagem biologicamente com as brumas e o eclipse de Hecos?

## Linguagem Corporal
Descreva sinais não-verbais e microexpressões. Como eles demonstram agressividade, respeito, medo ou alegria através de posturas, reflexos na pele, dilatação das pupilas ou movimentos involuntários?

## Ciclo de Vida e Envelhecimento
Determine a expectativa de vida (ex: 80 a 140 anos) e as fases de maturação (infância, rito de maioridade, maturidade plena e ancião). Como a aparência física se transforma com o avançar da idade?

## Dieta e Metabolismo
O que eles comem? Possuem necessidades nutricionais específicas (como ingestão de algas ricas em minerais) ou restrições biológicas (ex: intolerância a metais pesados ou necessidade de água salobra)?

---

# 3: Identidade e Mentalidade

## O Gancho Narrativo
> *"Nascidos entre os reflexos do eclipse, nós não tememos a penumbra; nós a tecemos em nossas canções e aço."*  
Uma frase ou parágrafo de impacto que resume a alma da espécie para o jogador que está criando seu personagem.

## Psicologia e Filosofia
Como eles pensam? Quais são seus traços de personalidade predominantes, valores morais, senso de honra comunitária e lógica de raciocínio comum perante conflitos?

## Mito da Criação
Como eles acreditam que surgiram? Foi um sopro divino sob as raízes do Salgueiro, evolução biológica através do miasma ou um experimento alquímico de civilizações esquecidas?

## Épicos e Figuras Históricas
Cite um ou dois heróis lendários que moldaram o que a espécie é hoje. Suas lendas são contadas em noites de vigília nas fogueiras.

## Propósito Existencial
O que move esta raça? Eles buscam desvendar segredos arcanos, restaurar a glória de seus templos submersos ou expandir a harmonia com as faunas místicas de Hecos?

## O Aventureiro [Raça]
Por que um membro desta espécie deixa seu lar pacífico ou enclave isolado? Liste motivações comuns de aventureiros e como eles são vistos por grupos de viajantes e mercenários.

---

# 4: Cultura, Arte e Cotidiano

## Etiqueta e Costumes
Como eles se cumprimentam? O que é considerado uma grande ofensa ou sinal de profundo respeito em sua sociedade? Como tratam forasteiros que chegam em suas vilas?

## Nomes e Significados
Explique a onomástica da raça.
- **Nomes Masculinos:** Vane, Thalor, Kaelen, Zhoran
- **Nomes Femininos:** Lyra, Sola, Naevia, Mirel
- **Nomes Neutros / Títulos:** Vesper, Zephyr, Umbra, Coroa-de-Vidro

## Vestuário e Moda
Descreva o estilo visual: tecidos tecidos de seda vegetal, capas com forro malva, adornos corporais em prata fria e como as vestimentas indicam status social ou ofício.

## Expressões Artísticas
Eles preferem cantos harmônicos polifônicos, entalhes em ossos marinhos, tatuagens rúnicas ou arquitetura espiralada? Como a arte reflete sua biologia?

## Gastronomia
Pratos típicos, infusões de ervas luminescentes, banquetes comemorativos e como lidam com a escassez ou fartura de recursos nas diferentes estações de Hecos.

## Lazer e Esportes
Como eles se divertem? Existem jogos de tabuleiro estratégicos, duelos acrobáticos ou competições de natação e escalada que treinam habilidades de sobrevivência?

---

# 5: Espiritualidade e Religião

## O Panteão Nativo
Quais deuses, constelações ou espíritos ancestrais eles veneram? Existe um sacerdócio formal com templos monumentais ou práticas xamânicas dispersas?

## Práticas Funerárias
Como lidam com a passagem dos mortos? Cremação cerimonial com incensos azuis, sepultamento em mausoléus de calcário ou devolução dos corpos às águas profundas do lago?

## Conexão Mágica
Como a magia se manifesta nesta raça? É vista como um dom inato do sangue, uma comunhão com os espíritos do eclipse ou uma disciplina de estudo rigoroso?

---

# 6: Sociedade, Governança e Lei

## Estrutura Social e Família
Como as famílias são organizadas? O conceito de clã é matriarcal, patriarcal ou baseado em fraternidades de ofício? Quem educa as crianças?

## Leis, Ética e Tabus
O que é estritamente proibido? Quais são os tabus sagrados que, se violados, resultam em punições severas, corte rúnico ou exílio irrevogável?

## Economia e Comércio
Como eles acumulam riquezas e realizam comércio? Valorizam pérolas do abismo, segredos guardados em pergaminhos, moedas cunhadas ou favores de honra?

## Educação e Ritos de Passagem
Como uma criança se torna um adulto reconhecido pela tribo? Há um teste de sobrevivência nas selvas perigosas, uma peregrinação até os monólitos ou um desafio de forja mágica?

---

# 7: Guerra e Táticas Militares

## Estilos de Luta Nativos
Descreva como seus guerreiros combatem. Preferem táticas de guerrilha nas sombras, falanges cerradas com lanças longas, magia de suporte com barreiras de força ou combate naval?

## Organização Militar
Como as forças de defesa são estruturadas? Existe uma guarda de elite real, patrulheiros das fronteiras ou milícias populares treinadas desde jovens?

## Engenharia de Defesa
Como eles fortificam seus lares? Vilas suspensas nas copas das árvores gigantes, muralhas de pedra basáltica ou armadilhas hidráulicas camufladas?

---

# 8: A Ancestralidade no Mundo

## Distribuição Geográfica
Onde eles habitam no mapa de Hecos? Cite regiões emblemáticas (como as margens do Lago Carmesim, o Vale dos Monólitos ou as Falésias de Bruma).

## Relações Diplomáticas
Como esta raça se relaciona com as outras facções e ancestrais de Hecos? Mantêm tratados comerciais pacíficos ou antigas rivalidades territoriais?

## Perspectiva Externa e Estereótipos
Como as outras raças os enxergam? Cite preconceitos comuns, admirações por suas habilidades artesanais ou temores infundados.

---

# 9: Arsenal Cultural e Equipamentos

## Proficiências e Armas
Quais armas e ferramentas são icônicas para este povo?
- **Armas Raciais:** Cimitarra Malva, Arco Curto de Bordo, Lança de Gancho.
- **Acesso:** Para efeitos de proficiência, armas com o traço da ancestralidade contam como armas simples.

## Itens Únicos e Arquétipos
- **Equipamentos Únicos:** Frasco de Óleo de Bruma, Amuleto de Coral Radiante.
- **Classes Recomendadas:** Thaumaturge, Ladino, Guerreiro, Bruxo e Ranger combinam perfeitamente com as aptidões biológicas e culturais desta espécie.

---

# 10: Talentos de Ancestralidade

### Rank 1
- **Sentidos Aguçados [Talento 1]:** Seus olhos se adaptam à escuridão total. Você ganha **Visão no Escuro**.
- **Armamentos Tradicionais [Talento 1]:** Você ganha treinamento com todas as armas que possuem o traço da sua ancestralidade.

### Rank 5
- **Magia Inata da Penumbra [Talento 5]:** Você pode conjurar *Mãos Mágicas* e *Luz* à vontade como magias inatas de tradição oculta.
- **Passo Silencioso [Talento 5]:** Você ignora terreno difícil não-mágico de lodo ou vegetação densa.

### Rank 9
- **Salto dos Eclipses [Talento 9]:** Uma vez a cada 10 minutos, você pode se teletransportar até 30 pés (9 m) como uma ação de 2 ações.
- **Resistência Ancestral [Talento 9]:** Seus salvamentos contra efeitos de encantamento e ilusão recebem um bônus de circunstância de +2.

### Rank 13
- **Herança Desperta [Talento 13]:** O dano das suas magias inatas raciais aumenta em 2d6 de dano de frio ou força cósmica.

### Rank 17
- **Avatar do Eclipse [Talento 17]:** Uma vez por dia, você assume a forma espectral dos primeiros ancestrais por 1 minuto, ganhando deslocamento de voo de 40 pés e resistência 10 a todo dano físico.

---

# 11: Guia do Mestre e Narrativa

## Interpretando NPCs [Raça]
- **Tom de Voz:** Calmo, ritmado, intercalado com pausas ponderadas ou sussurros melódicos.
- **Maneirismos:** Costumam inclinar levemente a cabeça ao ouvir segredos e mantêm as mãos abertas como sinal de honra e transparência.
- **Descrição na Mesa:** Enfatize o contraste entre seus traços luminescentes e os reflexos profundos das cores de Hecos.

## Temas e Conflitos Narrativos
- **Dramas Políticos:** Tensões sobre a exploração de suas terras sagradas por expedições arcanas.
- **Horror Cósmico:** Antigos rituais esquecidos que ameaçam ressurgir durante o Grande Eclipse.
- **Ganchos de Aventura:** O resgate de uma relíquia roubada do mausoléu ancestral ou a defesa de sua vila contra criaturas abissais.
`;
}
