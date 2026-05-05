/**
 * Base de Conhecimento - Programa SC Mais Inovação
 * Dados extraídos diretamente do site oficial: https://www.scmaisinovacao.scti.sc.gov.br/
 *
 * Esta base é utilizada como contexto inicial para o agente. O Firecrawl é usado
 * para validação em tempo real e atualização de informações dinâmicas (notícias,
 * eventos, novos números do programa).
 */

const KNOWLEDGE_BASE = {
  programa: {
    nome: "SC Mais Inovação",
    lancamento: "21 de outubro de 2024",
    iniciativa: "Governo do Estado de Santa Catarina",
    coordenacao: "Secretaria de Estado da Ciência, Tecnologia e Inovação (SCTI)",
    objetivo:
      "Transformar Santa Catarina em um grande polo tecnológico, conectando governo, iniciativa privada, academia e sociedade civil organizada.",
    missao:
      "Escutar e dialogar com as 21 microrregiões de Santa Catarina, democratizando a política de inovação e garantindo que ela atinja todos que precisam.",
    pilares: [
      "Inovação",
      "Fomento",
      "Educação",
      "Desenvolvimento regional"
    ],
    contato: {
      endereco: "Rod. Virgílio Várzea, 529 - 6° andar, Florianópolis - SC, 88032-000",
      telefone: "+55 (48) 99136-8846",
      email: "scmaisinovacao@scti.gov.br",
      instagram: "@scmaisinovacao"
    }
  },

  lideranca: {
    governador: "Jorginho Mello",
    secretarioCTI: "Edgard Usuy",
    presidenteFAPESC: "Fábio Wagner Pinto",
    reitoraExecutora: "Gisele Coelho Lopes",
    coordenadorProjeto: "Adriano Rodrigues"
  },

  coordenacao: [
    {
      nome: "Gustavo Bisognin",
      funcao: "Coordenação de Conexões, Capacitações e Eventos",
      email: "gustavo@bisognin.com.br"
    },
    {
      nome: "Everton Perin",
      funcao: "Coordenação de Ativação de Ecossistema",
      telefone: "(48) 99106-5171",
      email: "everton@unesc.net"
    },
    {
      nome: "Eduardo Tonelli Largura",
      funcao: "Coordenador de Fomento, Atração e Captação de Investimentos",
      telefone: "(48) 99921-9582",
      email: "eduardolargura@gmail.com"
    }
  ],

  equipeTecnica: [
    { nome: "Cristina Martins", area: "Marco Legal e DemandaSC", email: "crismartins2611@gmail.com" },
    { nome: "Eduardo Estevão", area: "Plataforma Catarina", email: "eestevao107@gmail.com" },
    { nome: "Greyce Kelly de Souza", area: "Secretaria", email: "greycehp@unesc.net" },
    { nome: "Kelly Dalla Lana", area: "Controladoria", email: "assessoriainstitucional@unesc.net" },
    { nome: "Marcelo Mazon", area: "Plataforma Catarina", telefone: "(48) 99944-5959", email: "mazon@innoviti.com.br" },
    { nome: "Mateus Bendo", area: "Plataforma Catarina", email: "mateusbendo@gmail.com" },
    { nome: "Paula Daros Darolt", area: "Comunicação", email: "pauladdarolt@gmail.com" },
    { nome: "Paula Vieira", area: "SCTI", email: "paula.vieira@scti.sc.gov.br" },
    { nome: "Ricardo Niehues Buss", area: "Universidades", email: "ricardobuss@gmail.com" },
    { nome: "Suélen Rosa Biz", area: "Jurídico", telefone: "(48) 9148-5251", email: "suelenrosa@unesc.net" }
  ],

  agentesInovacao: [
    { nome: "Ana Carla de Sousa", microrregiao: "AMURC - Curitibanos", telefone: "(49) 99107-5520", email: "anacarla.desousa@gmail.com" },
    { nome: "Ana Carla Kantovick", microrregiao: "AMPLASC - Campos Novos", telefone: "(49) 99942-1856", email: "anacarlapetronilio@gmail.com" },
    { nome: "Angelo Rodrigo Cé", microrregiao: "AMAVI - Rio do Sul", telefone: "(47) 99926-4521", email: "angeloinva@gmail.com" },
    { nome: "Daniela Cristina Martins", microrregiao: "AMUNESC - Joinville", telefone: "(47) 99157-7519", email: "m.daniela2005@gmail.com" },
    { nome: "Danieli Lazzari Pastório", microrregiao: "AMNOROESTE - São Lourenço do Oeste", telefone: "(49) 98832-0105", email: "danieli.pastorio@unochapeco.edu.br" },
    { nome: "Douglas Rodrigues", microrregiao: "AMEOSC - São Miguel do Oeste", telefone: "(49) 99107-5823", email: "douglasrodrigues.ea@gmail.com" },
    { nome: "Edjunior Matos", microrregiao: "AMARP - Videira", telefone: "(49) 99948-1532", email: "edjunior.matos@comprasja.com" },
    { nome: "Eduardo Luiz Domingos", microrregiao: "GRANFPOLIS - Florianópolis", telefone: "(48) 99990-8880", email: "eluizdo@gmail.com" },
    { nome: "Gelson Rossetto", microrregiao: "AMERIOS - Maravilha", telefone: "(49) 98804-5506", email: "scmaisinovacao.amerios@gmail.com" },
    { nome: "Gustavo Damschi", microrregiao: "AMAI - Xanxerê", telefone: "(49) 98838-0000", email: "scmaisinovacao.amai@gmail.com" },
    { nome: "Laís Machado da Silva", microrregiao: "AMREC - Criciúma", telefone: "(48) 9994-35576", email: "laisscinovacao@gmail.com" },
    { nome: "Luiz Eduardo Mutzberg", microrregiao: "AMUREL - Tubarão", telefone: "(48) 99192-4808", email: "eduardo@exithum.com.br" },
    { nome: "Manuela Hermes", microrregiao: "AMFRI - Itajaí", telefone: "(47) 99727-6273", email: "manuhermes@gmail.com" },
    { nome: "Matheus Brizola Oberderfer", microrregiao: "AMOSC - Chapecó", telefone: "(49) 99974-1313", email: "matheus.oberderfer@unochapeco.edu.br" },
    { nome: "Paula Christina Mattos dos Santos", microrregiao: "AMVE - Blumenau", telefone: "(47) 98402-0983", email: "paula@institutogene.org.br" },
    { nome: "Rone Guimarães", microrregiao: "AMESC - Araranguá", telefone: "(48) 99638-5910", email: "roneguimaraes@gmail.com" },
    { nome: "Rosiméri Fátima Spanini", microrregiao: "AMMOC - Joaçaba", telefone: "(49) 99971-2064", email: "spaziniarquitetura@hotmail.com" },
    { nome: "Suzana Fernandes", microrregiao: "AMPLANORTE - Mafra", telefone: "(47) 9723-4028", email: "agenteinovacao.an@gmail.com" },
    { nome: "William Tapia", microrregiao: "AMAUC - Concórdia", telefone: "(49) 98806-1010", email: "tapiascmaisinovacao@gmail.com" },
    { nome: "Wladmir Manzan", microrregiao: "AMVALI - Jaraguá do Sul", telefone: "(47) 93383-0986", email: "agente.inovacao.jgs@gmail.com" }
  ],

  cooperacaoBRDE: [
    { nome: "Matheus Nazario", funcao: "Coordenador do Programa BRDE", telefone: "(48) 99607-9627", email: "matheusouzanazario@gmail.com" },
    { nome: "Manuela Dalla Lana Mota", funcao: "Coordenadora de Gestão do Programa BRDE", telefone: "(48) 99972-8082", email: "manuddalla@hotmail.com" },
    { nome: "Alexandre Luís Anschau", funcao: "Consultor da Mesorregião Oeste", telefone: "(49) 99539-491", email: "alexandre32anschau@gmail.com" },
    { nome: "Anderson Retzlaff", funcao: "Consultor da Mesorregião Norte", telefone: "(47) 98867-7256", email: "anderson@inovamaisconsultoria.com" },
    { nome: "Henrique Azevedo Carvalho", funcao: "Consultor da Mesorregião Vale do Itajaí", telefone: "(47) 99182-0608", email: "economista.henrique@gmail.com" },
    { nome: "Leonardo Varela Wolowski", funcao: "Consultor da Mesorregião Granfpolis", telefone: "(48) 99961-1428", email: "nadowolowski@gmail.com" },
    { nome: "Lourenir G. Nascimento", funcao: "Consultor da Mesorregião Sul", telefone: "(48) 99638-7000", email: "hiko.scinovacao@gmail.com" }
  ],

  hubsRegionais: [
    { sigla: "AMURES", regiao: "Serra Catarinense / Lages" },
    { sigla: "AMURC", regiao: "Curitibanos" },
    { sigla: "AMPLASC", regiao: "Campos Novos" },
    { sigla: "AMNOROESTE", regiao: "São Lourenço do Oeste" },
    { sigla: "AMAI", regiao: "Xanxerê" },
    { sigla: "AMEOSC", regiao: "São Miguel do Oeste" },
    { sigla: "AMERIOS", regiao: "Maravilha" },
    { sigla: "AMOSC", regiao: "Chapecó" },
    { sigla: "AMARP", regiao: "Videira" },
    { sigla: "AMUNESC", regiao: "Joinville" },
    { sigla: "AMESC", regiao: "Araranguá / Extremo Sul" },
    { sigla: "AMMOC", regiao: "Joaçaba / Meio-Oeste" },
    { sigla: "GRANFPOLIS", regiao: "Florianópolis / Grande Florianópolis" },
    { sigla: "AMAVI", regiao: "Rio do Sul / Alto Vale do Itajaí" },
    { sigla: "AMAUC", regiao: "Concórdia / Alto Uruguai Catarinense" },
    { sigla: "AMUREL", regiao: "Tubarão / Laguna" },
    { sigla: "AMFRI", regiao: "Itajaí / Foz do Rio Itajaí" },
    { sigla: "AMREC", regiao: "Criciúma / Região Carbonífera" },
    { sigla: "AMVALI", regiao: "Jaraguá do Sul / Vale do Itapocu" },
    { sigla: "AMVE", regiao: "Blumenau / Vale Europeu" },
    { sigla: "AMPLANORTE", regiao: "Mafra / Planalto Norte" }
  ],

  resultados2025: {
    empresasEntidadesVisitadas: 1829,
    detalhamento: {
      associacoes: 110,
      camaras: 225,
      centrosDeInovacao: 31,
      empresas: 1020,
      instituicoes: 148,
      prefeituras: 295
    },
    marcoLegal: {
      municipiosEmAnalise: 78,
      municipiosEmTramitacao: 97,
      municipiosAprovados: 277
    },
    demandaSC: {
      municipiosConcluidos: 260,
      municipiosEmAndamento: 2,
      municipiosNaoIniciados: 33
    }
  },

  iniciativas: {
    marcoLegal: {
      nome: "100% Marco Legal",
      descricao: "Iniciativa para que 100% dos municípios catarinenses adotem o Marco Legal da Inovação, criando ambiente seguro e propício para inovação",
      url: "https://www.scmaisinovacao.scti.sc.gov.br/marcolegal.php"
    },
    demandaSC: {
      nome: "DemandaSC",
      descricao: "Mapeamento das demandas prioritárias e oportunidades por regiões e municípios catarinenses",
      url: "https://www.scmaisinovacao.scti.sc.gov.br/demandasc.php"
    },
    cidadesDoFuturo: {
      nome: "SC Cidades do Futuro",
      descricao: "Programa de transformação digital e modernização das cidades catarinenses",
      url: "https://www.scmaisinovacao.scti.sc.gov.br/SCcidadesdoFuturo/"
    },
    multiLabSC: {
      nome: "Laboratórios Multiusuários (MultiLabSC)",
      descricao: "Rede de laboratórios multiusuários disponíveis para reserva, com diversos serviços para inovação e pesquisa"
    },
    plataformaCatarina: {
      nome: "Plataforma Catarina",
      descricao: "Plataforma digital integradora do ecossistema de inovação catarinense"
    },
    ignitionStartup: {
      nome: "Ignition Startup",
      descricao: "Circuito estadual que conecta empreendedores catarinenses, apresenta editais de fomento, linhas de crédito e oportunidades de inovação"
    }
  },

  ecossistema: {
    categorias: [
      "Agências de Inovação",
      "Ambientes de Inovação",
      "Associações",
      "Autarquias",
      "Câmaras Municipais",
      "Empresas de Base Tecnológica",
      "Entidades de Fomento",
      "Escritórios de Projetos",
      "Federações",
      "Hubs de Inovação",
      "Incubadoras",
      "Instituições de Ensino Superior",
      "Instituições de Ensino de Formação Técnica",
      "Institutos de Ciência e Tecnologia (ICTs)",
      "Laboratórios de Inovação",
      "Laboratórios Multiusuários (MultiLabSC)",
      "NITs - Núcleos de Inovação Tecnológica",
      "Prefeituras Municipais",
      "Redes e Observatórios de Inovação",
      "Secretarias",
      "Sistema S"
    ]
  },

  parceiros: [
    "Governo do Estado de Santa Catarina (SC.gov.br)",
    "Secretaria de Estado da Ciência, Tecnologia e Inovação (SCTI)",
    "ACAFE - Associação Catarinense das Fundações Educacionais",
    "FECAM - Federação Catarinense de Municípios",
    "FAPESC - Fundação de Amparo à Pesquisa e Inovação do Estado de Santa Catarina",
    "BRDE - Banco Regional de Desenvolvimento do Extremo Sul",
    "FIESC - Federação das Indústrias do Estado de Santa Catarina",
    "FACISC - Federação das Associações Empresariais de Santa Catarina",
    "ACATE - Associação Catarinense de Tecnologia"
  ],

  noticiasDestaque: [
    {
      data: "17/12/2025",
      titulo: "SC Mais Inovação apresenta balanço de um ano e reconhece mais de 200 municípios inovadores",
      local: "Florianópolis",
      resumo: "Mais de 130 prefeitos estiveram presentes, além de autoridades regionais e sociedade civil organizada"
    },
    {
      data: "12/12/2025",
      titulo: "SC Mais Inovação fortalece empreendedorismo em Abdon Batista no encerramento do Empreendedor em Foco 2025",
      local: "Abdon Batista",
      resumo: "O Programa foi um dos protagonistas do encerramento do Projeto Empreendedor em Foco 2025"
    },
    {
      data: "30/10/2025",
      titulo: "Ignition Startup encerra circuito estadual em Lages e consolida conexões entre empreendedores catarinenses",
      local: "Lages",
      resumo: "O Roadshow marcou um importante passo na consolidação da política de inovação do Estado"
    },
    {
      data: "30/10/2025",
      titulo: "Santa Catarina fortalece política de inovação regional com foco em sustentabilidade, competitividade e conexão territorial",
      local: "Itajaí",
      resumo: "SC Mais Inovação encerrou nesta semana a rodada de Workshops que mobilizou centenas de atores do ecossistema"
    },
    {
      data: "29/10/2025",
      titulo: "Ignition Startup conecta empreendedores do Oeste catarinense em Chapecó",
      local: "Chapecó",
      resumo: "A ação integra o circuito estadual promovido pelo SC Mais Inovação"
    },
    {
      data: "22/10/2025",
      titulo: "Em Joinville, Ignition Startup conecta empreendedores a editais de fomento para inovação",
      local: "Joinville",
      resumo: "O evento apresentou oportunidades de fomento, linhas de crédito e editais voltados à inovação"
    }
  ],

  paginasOficiais: {
    home: "https://www.scmaisinovacao.scti.sc.gov.br/",
    sobre: "https://www.scmaisinovacao.scti.sc.gov.br/sobre.php",
    ecossistema: "https://www.scmaisinovacao.scti.sc.gov.br/ecossistema.php",
    governanca: "https://www.scmaisinovacao.scti.sc.gov.br/governanca.php",
    centros: "https://www.scmaisinovacao.scti.sc.gov.br/centros.php",
    escritorios: "https://www.scmaisinovacao.scti.sc.gov.br/escritorios.php",
    fomentos: "https://www.scmaisinovacao.scti.sc.gov.br/fomentos.php",
    eventos: "https://www.scmaisinovacao.scti.sc.gov.br/eventos.php",
    noticias: "https://www.scmaisinovacao.scti.sc.gov.br/noticias.php",
    contato: "https://www.scmaisinovacao.scti.sc.gov.br/contato.php",
    conecteSe: "https://www.scmaisinovacao.scti.sc.gov.br/conecte-se.php",
    marcoLegal: "https://www.scmaisinovacao.scti.sc.gov.br/marcolegal.php",
    demandaSC: "https://www.scmaisinovacao.scti.sc.gov.br/demandasc.php"
  }
};

/**
 * Bloco estático da base de conhecimento usado no system prompt do agente.
 */
function buildStaticContextString() {
  const kb = KNOWLEDGE_BASE;
  return `
# CONHECIMENTO OFICIAL — PROGRAMA SC MAIS INOVAÇÃO

## SOBRE O PROGRAMA
- **Nome:** ${kb.programa.nome}
- **Lançamento:** ${kb.programa.lancamento}
- **Iniciativa:** ${kb.programa.iniciativa}
- **Coordenação:** ${kb.programa.coordenacao}
- **Objetivo:** ${kb.programa.objetivo}
- **Missão:** ${kb.programa.missao}
- **Pilares:** ${kb.programa.pilares.join(", ")}

## CONTATO OFICIAL
- Endereço: ${kb.programa.contato.endereco}
- Telefone: ${kb.programa.contato.telefone}
- E-mail: ${kb.programa.contato.email}
- Instagram: ${kb.programa.contato.instagram}

## LIDERANÇA
- Governador do Estado: ${kb.lideranca.governador}
- Secretário de Ciência, Tecnologia e Inovação: ${kb.lideranca.secretarioCTI}
- Presidente da FAPESC: ${kb.lideranca.presidenteFAPESC}
- Reitora / Executora do Projeto: ${kb.lideranca.reitoraExecutora}
- Coordenador do Projeto: ${kb.lideranca.coordenadorProjeto}

## COORDENAÇÃO DO PROGRAMA
${kb.coordenacao.map(c => `- **${c.nome}** — ${c.funcao}${c.telefone ? ` | Tel: ${c.telefone}` : ""} | E-mail: ${c.email}`).join("\n")}

## EQUIPE TÉCNICA
${kb.equipeTecnica.map(e => `- **${e.nome}** — ${e.area}${e.telefone ? ` | Tel: ${e.telefone}` : ""} | E-mail: ${e.email}`).join("\n")}

## OS 21 HUBS REGIONAIS DE INOVAÇÃO (microrregiões de SC)
${kb.hubsRegionais.map(h => `- ${h.sigla} — ${h.regiao}`).join("\n")}

## AGENTES DE INOVAÇÃO (atuando em cada microrregião)
${kb.agentesInovacao.map(a => `- **${a.nome}** — ${a.microrregiao} | Tel: ${a.telefone} | E-mail: ${a.email}`).join("\n")}

## COOPERAÇÃO TÉCNICA BRDE
${kb.cooperacaoBRDE.map(c => `- **${c.nome}** — ${c.funcao} | Tel: ${c.telefone} | E-mail: ${c.email}`).join("\n")}

## RESULTADOS DE 2025 (entregas oficiais do programa)
- **Empresas e Entidades Visitadas:** ${kb.resultados2025.empresasEntidadesVisitadas}
  - Associações: ${kb.resultados2025.detalhamento.associacoes}
  - Câmaras Municipais: ${kb.resultados2025.detalhamento.camaras}
  - Centros de Inovação: ${kb.resultados2025.detalhamento.centrosDeInovacao}
  - Empresas: ${kb.resultados2025.detalhamento.empresas}
  - Instituições: ${kb.resultados2025.detalhamento.instituicoes}
  - Prefeituras: ${kb.resultados2025.detalhamento.prefeituras}

### Marco Legal (status dos municípios)
- Em Análise: ${kb.resultados2025.marcoLegal.municipiosEmAnalise}
- Em Tramitação: ${kb.resultados2025.marcoLegal.municipiosEmTramitacao}
- Aprovados: ${kb.resultados2025.marcoLegal.municipiosAprovados}

### DemandaSC (status do preenchimento)
- Concluídos: ${kb.resultados2025.demandaSC.municipiosConcluidos}
- Em Andamento: ${kb.resultados2025.demandaSC.municipiosEmAndamento}
- Não Iniciados: ${kb.resultados2025.demandaSC.municipiosNaoIniciados}

## INICIATIVAS PRINCIPAIS
${Object.values(kb.iniciativas).map(i => `- **${i.nome}**: ${i.descricao}`).join("\n")}

## ECOSSISTEMA DE INOVAÇÃO — CATEGORIAS MAPEADAS
${kb.ecossistema.categorias.map(c => `- ${c}`).join("\n")}

## PARCEIROS OFICIAIS
${kb.parceiros.map(p => `- ${p}`).join("\n")}

## NOTÍCIAS RECENTES EM DESTAQUE
${kb.noticiasDestaque.map(n => `- **${n.data}** (${n.local}) — ${n.titulo}\n  ${n.resumo}`).join("\n")}

## LINKS OFICIAIS DO SITE
${Object.entries(kb.paginasOficiais).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
`;
}

/**
 * Gera o contexto formatado para o system prompt do Claude.
 * Quando `onlyLive=true`, retorna apenas o bloco com dados ao vivo (volátil)
 * — útil para separar do bloco estático pré-cacheado.
 */
function buildContextString(liveData = null, onlyLive = false) {
  const staticPart = onlyLive ? "" : buildStaticContextString();

  if (!liveData || !liveData.markdown) {
    return staticPart;
  }

  const liveBlock = `

---

## DADOS ATUALIZADOS EM TEMPO REAL (via Firecrawl)
Data da consulta: ${liveData.timestamp}
URL consultada: ${liveData.url}

${liveData.markdown.substring(0, 8000)}
`;

  return onlyLive ? liveBlock.trimStart() : staticPart + liveBlock;
}

module.exports = {
  KNOWLEDGE_BASE,
  buildContextString,
  buildStaticContextString
};
