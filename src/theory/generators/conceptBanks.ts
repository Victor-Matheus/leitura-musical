// Bancos de perguntas conceituais (texto original)

export interface ConceptItem {
  prompt: string
  correct: string
  distractors: [string, string, string]
  explanation: string
}

export type ConceptBank = 'properties' | 'dynamics'

const PROPERTIES: ConceptItem[] = [
  {
    prompt: 'O que é o som?',
    correct: 'Uma vibração que chega aos nossos ouvidos',
    distractors: ['Uma luz que vemos', 'Um sinal escrito na pauta', 'Um tipo de instrumento'],
    explanation: 'O som nasce de uma vibração. Ela viaja pelo ar até os nossos ouvidos.',
  },
  {
    prompt: 'Quais são as quatro propriedades do som?',
    correct: 'Altura, duração, intensidade e timbre',
    distractors: ['Altura, ritmo, melodia e harmonia', 'Grave, agudo, forte e fraco', 'Pauta, clave, nota e compasso'],
    explanation: 'Todo som tem altura, duração, intensidade e timbre.',
  },
  {
    prompt: 'Qual propriedade diz se um som é grave ou agudo?',
    correct: 'Altura',
    distractors: ['Intensidade', 'Duração', 'Timbre'],
    explanation: 'A altura diz se o som é grave (grosso) ou agudo (fino).',
  },
  {
    prompt: 'Qual propriedade diz se um som é forte ou fraco?',
    correct: 'Intensidade',
    distractors: ['Altura', 'Duração', 'Timbre'],
    explanation: 'A intensidade é a força do som: forte ou fraco.',
  },
  {
    prompt: 'Qual propriedade diz se um som é longo ou curto?',
    correct: 'Duração',
    distractors: ['Altura', 'Intensidade', 'Timbre'],
    explanation: 'A duração é o tempo que o som fica soando.',
  },
  {
    prompt: 'Um violino e uma flauta tocam a mesma nota. O que faz você saber qual é qual?',
    correct: 'Timbre',
    distractors: ['Altura', 'Duração', 'Intensidade'],
    explanation: 'O timbre é a "cor" do som. Cada instrumento e cada voz tem o seu.',
  },
  {
    prompt: 'Duas pessoas cantam a mesma nota e você reconhece cada voz. Isso é graças a qual propriedade?',
    correct: 'Timbre',
    distractors: ['Altura', 'Intensidade', 'Duração'],
    explanation: 'Mesmo na mesma nota, cada voz tem um timbre próprio.',
  },
  {
    prompt: 'Você toca a mesma tecla com mais força. Qual propriedade muda?',
    correct: 'Intensidade',
    distractors: ['Altura', 'Timbre', 'Duração'],
    explanation: 'Mais força deixa o som mais forte. Isso é intensidade; a nota continua a mesma.',
  },
  {
    prompt: 'Você segura a mesma nota por mais tempo. Qual propriedade muda?',
    correct: 'Duração',
    distractors: ['Altura', 'Intensidade', 'Timbre'],
    explanation: 'Segurar a nota por mais tempo aumenta a sua duração.',
  },
  {
    prompt: 'Abaixar o volume muda qual propriedade do som?',
    correct: 'Intensidade',
    distractors: ['Altura', 'Duração', 'Timbre'],
    explanation: 'O volume é a força do som, ou seja, a intensidade.',
  },
  {
    prompt: 'Como é um som agudo?',
    correct: 'Fino, como o canto de um passarinho',
    distractors: ['Grosso, como um trovão', 'Sempre mais forte que os outros', 'Sempre mais longo que os outros'],
    explanation: 'Agudo é o som fino. O som grosso é chamado de grave.',
  },
  {
    prompt: 'Como é um som grave?',
    correct: 'Grosso, como um trovão',
    distractors: ['Fino, como um apito', 'Sempre mais fraco que os outros', 'Sempre mais curto que os outros'],
    explanation: 'Grave é o som grosso. Grave e agudo falam da altura, não da força.',
  },
  {
    prompt: 'Um sino grande, comparado a um sininho, soa mais...',
    correct: 'Grave',
    distractors: ['Agudo', 'Curto', 'Fraco'],
    explanation: 'Objetos maiores costumam vibrar mais devagar e dar sons mais graves.',
  },
  {
    prompt: 'Na partitura, o que mostra a altura de uma nota?',
    correct: 'O lugar dela nas linhas e espaços da pauta',
    distractors: ['O formato da figura', 'O tamanho da cabeça da nota', 'O número do compasso'],
    explanation: 'Quanto mais alta na pauta, mais aguda é a nota.',
  },
  {
    prompt: 'Na partitura, o que mostra a duração de uma nota?',
    correct: 'A figura de valor, como mínima ou semínima',
    distractors: ['O lugar da nota na pauta', 'A clave no começo da pauta', 'A cor da nota'],
    explanation: 'Cada figura de valor tem uma duração: a semibreve dura mais que a mínima, e assim por diante.',
  },
  {
    prompt: 'Uma nota que soa por bastante tempo é um som...',
    correct: 'Longo',
    distractors: ['Agudo', 'Forte', 'Grave'],
    explanation: 'Longo e curto falam da duração do som.',
  },
]

const DYNAMICS: ConceptItem[] = [
  {
    prompt: 'O que é dinâmica na música?',
    correct: 'A variação entre tocar forte e suave',
    distractors: ['A velocidade da música', 'A altura das notas', 'A divisão em compassos'],
    explanation: 'Dinâmica trata da intensidade: quando tocar mais forte ou mais suave.',
  },
  {
    prompt: 'O que é andamento?',
    correct: 'A velocidade da música',
    distractors: ['A força do som', 'A altura das notas', 'O nome das notas'],
    explanation: 'Andamento diz se a música vai devagar ou depressa.',
  },
  {
    prompt: 'O que pede o sinal pp (pianíssimo)?',
    correct: 'Tocar muito suave',
    distractors: ['Tocar muito forte', 'Tocar meio forte', 'Tocar bem depressa'],
    explanation: 'pp quer dizer pianíssimo: o mais suave entre esses sinais.',
  },
  {
    prompt: 'O que pede o sinal p (piano)?',
    correct: 'Tocar suave',
    distractors: ['Tocar forte', 'Tocar depressa', 'Ir diminuindo aos poucos'],
    explanation: 'p quer dizer piano, que em música significa suave.',
  },
  {
    prompt: 'O que pede o sinal mp (meio piano)?',
    correct: 'Tocar um pouco suave',
    distractors: ['Tocar muito suave', 'Tocar um pouco forte', 'Tocar muito forte'],
    explanation: 'mp é meio piano: suave, mas nem tanto.',
  },
  {
    prompt: 'O que pede o sinal mf (meio forte)?',
    correct: 'Tocar um pouco forte',
    distractors: ['Tocar um pouco suave', 'Tocar muito forte', 'Tocar suave'],
    explanation: 'mf é meio forte: forte, mas sem exagero.',
  },
  {
    prompt: 'O que pede o sinal f (forte)?',
    correct: 'Tocar forte',
    distractors: ['Tocar suave', 'Tocar mais agudo', 'Tocar depressa'],
    explanation: 'f quer dizer forte.',
  },
  {
    prompt: 'O que pede o sinal ff (fortíssimo)?',
    correct: 'Tocar muito forte',
    distractors: ['Tocar forte só no final', 'Tocar muito suave', 'Tocar muito depressa'],
    explanation: 'ff quer dizer fortíssimo: o mais forte entre esses sinais.',
  },
  {
    prompt: 'Qual destes sinais pede o som mais forte?',
    correct: 'ff',
    distractors: ['mf', 'mp', 'p'],
    explanation: 'Do mais suave ao mais forte: pp, p, mp, mf, f, ff.',
  },
  {
    prompt: 'Qual destes sinais pede o som mais suave?',
    correct: 'pp',
    distractors: ['p', 'mp', 'mf'],
    explanation: 'Do mais suave ao mais forte: pp, p, mp, mf, f, ff.',
  },
  {
    prompt: 'O que pede o crescendo (cresc.)?',
    correct: 'Ir tocando mais forte aos poucos',
    distractors: ['Ir tocando mais suave aos poucos', 'Ir acelerando aos poucos', 'Ir subindo as notas'],
    explanation: 'Crescendo é aumentar a força do som pouco a pouco.',
  },
  {
    prompt: 'O que pede o diminuendo (dim.)?',
    correct: 'Ir tocando mais suave aos poucos',
    distractors: ['Ir tocando mais forte aos poucos', 'Ir mais devagar aos poucos', 'Parar de repente'],
    explanation: 'Diminuendo é diminuir a força do som pouco a pouco.',
  },
  {
    prompt: 'Um sinal em forma de ângulo que vai se abrindo, embaixo das notas, significa...',
    correct: 'Crescendo',
    distractors: ['Diminuendo', 'Fortíssimo', 'Pausa'],
    explanation: 'O ângulo se abre como o som que vai crescendo.',
  },
  {
    prompt: 'Um sinal em forma de ângulo que vai se fechando, embaixo das notas, significa...',
    correct: 'Diminuendo',
    distractors: ['Crescendo', 'Pianíssimo', 'Ponto de aumento'],
    explanation: 'O ângulo se fecha como o som que vai diminuindo.',
  },
  {
    prompt: 'O que indica o andamento Largo?',
    correct: 'Muito lento e amplo',
    distractors: ['Rápido e alegre', 'Moderado', 'Muito forte'],
    explanation: 'Largo é um dos andamentos mais lentos.',
  },
  {
    prompt: 'O que indica o andamento Adagio?',
    correct: 'Lento e tranquilo',
    distractors: ['Rápido e alegre', 'Muito rápido', 'Moderado'],
    explanation: 'Adagio é lento, um pouco menos que o Largo.',
  },
  {
    prompt: 'O que indica o andamento Andante?',
    correct: 'Calmo, no passo de quem caminha',
    distractors: ['Muito lento, quase parando', 'Rápido e alegre', 'Muito forte'],
    explanation: 'Andante vem de "andar": uma velocidade calma, como um passeio.',
  },
  {
    prompt: 'O que indica o andamento Moderato?',
    correct: 'Moderado, nem lento nem rápido',
    distractors: ['Muito lento', 'Muito rápido', 'Meio forte'],
    explanation: 'Moderato fica no meio: nem devagar, nem depressa.',
  },
  {
    prompt: 'O que indica o andamento Allegro?',
    correct: 'Rápido e alegre',
    distractors: ['Lento e tranquilo', 'Moderado', 'Muito suave'],
    explanation: 'Allegro quer dizer alegre: um andamento rápido.',
  },
  {
    prompt: 'Qual destes andamentos é o mais lento?',
    correct: 'Largo',
    distractors: ['Andante', 'Moderato', 'Allegro'],
    explanation: 'Do mais lento ao mais rápido: Largo, Adagio, Andante, Moderato, Allegro.',
  },
  {
    prompt: 'Qual destes andamentos é o mais rápido?',
    correct: 'Allegro',
    distractors: ['Largo', 'Adagio', 'Andante'],
    explanation: 'Do mais lento ao mais rápido: Largo, Adagio, Andante, Moderato, Allegro.',
  },
]

export const CONCEPT_BANKS: Record<ConceptBank, readonly ConceptItem[]> = {
  properties: PROPERTIES,
  dynamics: DYNAMICS,
}
