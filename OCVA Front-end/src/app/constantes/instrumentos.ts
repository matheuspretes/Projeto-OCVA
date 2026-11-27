// Instrumentos que podem aparecer em uma orquestra ou em uma banda,
// agrupados por família e em ordem alfabética dentro de cada grupo.
export const GRUPOS_DE_INSTRUMENTOS: { familia: string; instrumentos: string[] }[] = [
  {
    familia: 'Cordas',
    instrumentos: ['Contrabaixo acústico', 'Harpa', 'Viola', 'Violino', 'Violoncelo']
  },
  {
    familia: 'Cordas dedilhadas',
    instrumentos: [
      'Bandolim', 'Banjo', 'Baixo elétrico', 'Cavaquinho', 'Guitarra', 'Ukulele',
      'Viola caipira', 'Violão', 'Violão de 7 cordas'
    ]
  },
  {
    familia: 'Madeiras',
    instrumentos: [
      'Clarinete', 'Clarinete baixo', 'Clarone', 'Contrafagote', 'Corne inglês', 'Fagote',
      'Flauta doce', 'Flauta transversal', 'Flautim (piccolo)', 'Oboé', 'Requinta',
      'Saxofone alto', 'Saxofone barítono', 'Saxofone soprano', 'Saxofone tenor'
    ]
  },
  {
    familia: 'Metais',
    instrumentos: [
      'Bombardino (eufônio)', 'Corneta', 'Flugelhorn', 'Sousafone', 'Trompa', 'Trompete',
      'Trombone', 'Trombone baixo', 'Tuba'
    ]
  },
  {
    familia: 'Percussão',
    instrumentos: [
      'Agogô', 'Bateria', 'Bombo', 'Caixa clara', 'Carrilhão (sinos tubulares)', 'Castanholas',
      'Chocalho', 'Conga', 'Glockenspiel (lira)', 'Marimba', 'Pandeiro', 'Pratos', 'Surdo',
      'Tambor', 'Tamborim', 'Tímpanos', 'Triângulo', 'Vibrafone', 'Xilofone'
    ]
  },
  {
    familia: 'Teclas',
    instrumentos: ['Acordeão (sanfona)', 'Celesta', 'Cravo', 'Órgão', 'Piano', 'Sintetizador', 'Teclado']
  },
  {
    familia: 'Voz e regência',
    instrumentos: ['Canto (voz)', 'Regência']
  }
];

// Lista simples com todos os instrumentos, em ordem alfabética
export const INSTRUMENTOS: string[] = ([] as string[])
  .concat(...GRUPOS_DE_INSTRUMENTOS.map((grupo) => grupo.instrumentos))
  .sort((a, b) => a.localeCompare(b, 'pt-BR'));
