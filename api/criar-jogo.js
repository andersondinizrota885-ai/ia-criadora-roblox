const MODELO = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const MAX_REVISIONS = 2;
const MAX_SCRIPTS = 30;

function resposta(res, status, dados) {
  return res.status(status).json(dados);
}

function texto(valor, fallback = "") {
  if (valor === undefined || valor === null) return fallback;
  return String(valor);
}

function arraySeguro(valor) {
  return Array.isArray(valor) ? valor : [];
}

function limparNome(nome, fallback) {
  const valor = texto(nome, fallback)
    .trim()
    .replace(/[<>:"/\\|?*]/g, "_");

  return valor || fallback;
}

/*
|--------------------------------------------------------------------------
| JSON
|--------------------------------------------------------------------------
*/

function extrairJSON(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("A IA não retornou texto.");
  }

  let textoResposta = raw.trim();

  textoResposta = textoResposta
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(textoResposta);
  } catch (_) {
    const inicioObjeto = textoResposta.indexOf("{");
    const fimObjeto = textoResposta.lastIndexOf("}");

    if (inicioObjeto !== -1 && fimObjeto > inicioObjeto) {
      return JSON.parse(
        textoResposta.substring(
          inicioObjeto,
          fimObjeto + 1
        )
      );
    }

    const inicioArray = textoResposta.indexOf("[");
    const fimArray = textoResposta.lastIndexOf("]");

    if (inicioArray !== -1 && fimArray > inicioArray) {
      return JSON.parse(
        textoResposta.substring(
          inicioArray,
          fimArray + 1
        )
      );
    }

    throw new Error("A IA retornou JSON inválido.");
  }
}

/*
|--------------------------------------------------------------------------
| GEMINI
|--------------------------------------------------------------------------
*/

async function chamarGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no Vercel."
    );
  }

  const modelo = options.modelo || MODELO;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelo +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature:
        options.temperature !== undefined
          ? options.temperature
          : 0.2,

      responseMimeType:
        options.responseMimeType || "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      "Gemini HTTP " +
      response.status +
      ": " +
      responseText
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (_) {
    throw new Error(
      "Resposta da Gemini não é JSON válido."
    );
  }

  const result =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!result) {
    throw new Error(
      "Gemini não retornou conteúdo."
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO DO PROJETO
|--------------------------------------------------------------------------
*/

function normalizarProjeto(projeto) {
  projeto = projeto || {};

  return {
    title: texto(
      projeto.title || projeto.game_name,
      "Meu Jogo Roblox"
    ),

    genre: texto(
      projeto.genre,
      "Aventura"
    ),

    objective: texto(
      projeto.objective,
      ""
    ),

    difficulty: texto(
      projeto.difficulty,
      "Médio"
    ),

    players:
      Number(projeto.players) ||
      Number(projeto.estimated_players) ||
      10,

    areas: arraySeguro(projeto.areas),

    objects: arraySeguro(projeto.objects),

    npcs: arraySeguro(projeto.npcs),

    systems: arraySeguro(projeto.systems),

    quests: arraySeguro(projeto.quests),

    items: arraySeguro(projeto.items),

    shops: arraySeguro(projeto.shops),

    pets: arraySeguro(projeto.pets),

    remotes: arraySeguro(projeto.remotes),

    scripts: arraySeguro(projeto.scripts),

    next_upgrades:
      arraySeguro(projeto.next_upgrades)
  };
}

/*
|--------------------------------------------------------------------------
| NORMALIZAÇÃO DE SCRIPT
|--------------------------------------------------------------------------
|
| Cada script agora possui:
|
| name
| type
| location
| dependencies
| description
| code
| purpose
|
*/

function normalizarScript(script, index) {
  script = script || {};

  const tipoOriginal =
    texto(
      script.type ||
      script.script_type ||
      script.tipo,
      "Script"
    );

  const tiposValidos = [
    "Script",
    "LocalScript",
    "ModuleScript"
  ];

  const type =
    tiposValidos.includes(tipoOriginal)
      ? tipoOriginal
      : "Script";

  const dependencies = arraySeguro(
    script.dependencies ||
    script.dependencias
  ).map((item) => {
    if (typeof item === "string") {
      return item;
    }

    return texto(
      item?.name ||
      item?.nome,
      ""
    );
  }).filter(Boolean);

  return {
    id:
      texto(
        script.id,
        `script_${index + 1}`
      ),

    name: limparNome(
      script.name ||
      script.nome,
      `GeneratedScript_${index + 1}`
    ),

    type,

    location:
      texto(
        script.location ||
        script.path ||
        script.localizacao,
        type === "LocalScript"
          ? "StarterPlayer > StarterPlayerScripts"
          : type === "ModuleScript"
            ? "ReplicatedStorage > Modules"
            : "ServerScriptService"
      ),

    dependencies,

    description:
      texto(
        script.description ||
        script.descricao,
        ""
      ),

    purpose:
      texto(
        script.purpose ||
        script.objetivo,
        ""
      ),

    code:
      texto(
        script.code ||
        script.codigo,
        ""
      ),

    enabled:
      script.enabled !== false
  };
}

/*
|--------------------------------------------------------------------------
| VALIDAÇÃO BÁSICA DO SCRIPT
|--------------------------------------------------------------------------
*/

function validarScript(script) {
  const erros = [];
  const avisos = [];

  if (!script.name) {
    erros.push("Script sem nome.");
  }

  if (!script.type) {
    erros.push("Script sem tipo.");
  }

  if (!script.location) {
    erros.push("Script sem localização.");
  }

  if (!script.code.trim()) {
    erros.push("Script sem código.");
  }

  const codigo = script.code;

  if (
    codigo.includes("```lua") ||
    codigo.includes("```luau") ||
    codigo.includes("```")
  ) {
    avisos.push(
      "O código contém delimitadores Markdown."
    );
  }

  if (
    codigo.includes("TODO") ||
    codigo.includes("IMPLEMENT_ME")
  ) {
    avisos.push(
      "O código contém marcador de implementação."
    );
  }

  if (
    script.type === "LocalScript" &&
    /DataStoreService/i.test(codigo)
  ) {
    erros.push(
      "LocalScript não deve acessar DataStoreService diretamente."
    );
  }

  if (
    script.type === "LocalScript" &&
    /ServerStorage/i.test(codigo)
  ) {
    erros.push(
      "LocalScript não deve acessar ServerStorage."
    );
  }

  if (
    /\bgame\s*:\s*GetService\s*\(\s*["']HttpService["']\s*\)/i.test(
      codigo
    )
  ) {
    avisos.push(
      "Script utiliza HttpService; confirme se a configuração necessária está habilitada."
    );
  }

  if (
    /\bloadstring\s*\(/i.test(codigo)
  ) {
    erros.push(
      "loadstring não deve ser usado neste código gerado."
    );
  }

  if (
    /\bgetfenv\s*\(/i.test(codigo) ||
    /\bsetfenv\s*\(/i.test(codigo)
  ) {
    avisos.push(
      "Código utiliza funções de ambiente que podem ser inadequadas no Roblox."
    );
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos
  };
}

/*
|--------------------------------------------------------------------------
| LIMPEZA DO CÓDIGO
|--------------------------------------------------------------------------
*/

function limparCodigo(codigo) {
  let resultado = texto(codigo);

  resultado = resultado
    .replace(/^```lua\s*/i, "")
    .replace(/^```luau\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return resultado;
}

/*
|--------------------------------------------------------------------------
| PLANEJADOR
|--------------------------------------------------------------------------
*/

async function criarPlano(ideia) {
  const prompt = `
Você é o ARQUITETO PRINCIPAL de uma IA especialista em Roblox Studio.

Sua função é transformar a ideia do usuário em uma especificação técnica
antes de qualquer código ser escrito.

Roblox usa Luau.

IDEIA DO USUÁRIO:
${ideia}

Crie SOMENTE JSON válido.

Estrutura:

{
  "title": "Nome do jogo",
  "genre": "Gênero",
  "objective": "Objetivo principal",
  "difficulty": "Fácil, Médio ou Difícil",
  "players": 10,

  "areas": [],
  "objects": [],
  "npcs": [],
  "systems": [],
  "quests": [],
  "items": [],
  "shops": [],
  "pets": [],
  "remotes": [],

  "script_plan": [
    {
      "id": "script_1",
      "name": "Nome",
      "type": "Script",
      "location": "ServerScriptService",
      "purpose": "Responsabilidade exata",
      "dependencies": [
        "OutroScript",
        "RemoteEvent"
      ],
      "description": "Como esse script funciona"
    }
  ],

  "next_upgrades": []
}

REGRAS:

1. Não escreva código.
2. Cada sistema importante deve possuir responsabilidade clara.
3. Não crie scripts duplicados.
4. Use Script para lógica do servidor.
5. Use LocalScript para lógica do cliente.
6. Use ModuleScript para código reutilizável.
7. Defina dependências reais.
8. Defina o caminho completo de cada script.
9. Não coloque lógica do servidor em LocalScript.
10. Não coloque lógica exclusiva do cliente em Script.
11. Evite dependências circulares.
12. Use RemoteEvents/RemoteFunctions quando cliente e servidor precisarem conversar.
13. O projeto precisa ser implementável no Roblox Studio.
14. Não invente APIs inexistentes.
15. Crie somente os sistemas necessários para a ideia.

Retorne SOMENTE JSON.
`;

  const raw = await chamarGemini(prompt, {
    temperature: 0.15
  });

  return extrairJSON(raw);
}

/*
|--------------------------------------------------------------------------
| GERADOR DE SCRIPTS
|--------------------------------------------------------------------------
*/

async function gerarScripts(plano) {
  const scriptPlan = arraySeguro(
    plano.script_plan
  );

  if (scriptPlan.length > MAX_SCRIPTS) {
    scriptPlan.length = MAX_SCRIPTS;
  }

  const resultados = [];

  for (
    let index = 0;
    index < scriptPlan.length;
    index++
  ) {
    const specification =
      scriptPlan[index];

    const prompt = `
Você é um engenheiro sênior de Roblox/Luau.

Você precisa implementar UM ÚNICO script de um projeto Roblox.

PROJETO:
${JSON.stringify(plano, null, 2)}

SCRIPT A IMPLEMENTAR:
${JSON.stringify(
  specification,
  null,
  2
)}

REGRAS ABSOLUTAS:

1. Escreva código Luau válido.
2. Retorne SOMENTE JSON.
3. Não use Markdown.
4. Não coloque o código dentro de \`\`\`.
5. Não invente APIs do Roblox.
6. Respeite o tipo do script.
7. Respeite a localização.
8. Respeite as dependências.
9. Use GetService corretamente.
10. Prefira referências locais.
11. Não crie variáveis inexistentes.
12. Não dependa de objetos que não foram planejados.
13. Se precisar de um objeto, ele deve aparecer nas dependências.
14. Não coloque lógica exclusiva do servidor em LocalScript.
15. Não coloque lógica exclusiva do cliente em Script.
16. Não use loadstring.
17. Não coloque chaves/API secrets no código.
18. Use nomes consistentes.
19. O código deve ser completo, não um exemplo parcial.
20. Não escreva comentários dizendo que algo deve ser implementado depois.
21. Não omita funções importantes.
22. O código precisa poder ser colado no Roblox Studio.

FORMATO:

{
  "name": "Nome do script",
  "type": "Script | LocalScript | ModuleScript",
  "location": "Caminho",
  "dependencies": [],
  "description": "Descrição",
  "purpose": "Responsabilidade",
  "code": "CÓDIGO LUA AQUI"
}
`;

    const raw = await chamarGemini(prompt, {
      temperature: 0.1
    });

    const scriptGerado =
      normalizarScript(
        extrairJSON(raw),
        index
      );

    scriptGerado.code =
      limparCodigo(
        scriptGerado.code
      );

    resultados.push(
      scriptGerado
    );
  }

  return resultados;
}

/*
|--------------------------------------------------------------------------
| REVISOR
|--------------------------------------------------------------------------
*/

async function revisarScript(script, plano) {
  const validacao =
    validarScript(script);

  const prompt = `
Você é o REVISOR DE CÓDIGO de uma IA especialista em Roblox.

Analise cuidadosamente o script abaixo.

PROJETO:
${JSON.stringify(plano, null, 2)}

SCRIPT:
${JSON.stringify(script, null, 2)}

Analise:

- sintaxe Luau;
- APIs Roblox;
- serviços;
- cliente/servidor;
- referências;
- dependências;
- eventos;
- RemoteEvents;
- RemoteFunctions;
- escopo de variáveis;
- funções inexistentes;
- propriedades inexistentes;
- objetos que podem não existir;
- problemas de execução;
- loops problemáticos;
- conexões de eventos;
- segurança básica;
- inconsistências com o projeto.

IMPORTANTE:

Não considere que o código está correto só porque parece correto.

Retorne SOMENTE JSON:

{
  "approved": true,
  "score": 0,
  "errors": [],
  "warnings": [],
  "fixes": []
}

score deve ser de 0 a 100.

Se existir qualquer erro que possa impedir a execução,
approved deve ser false.

VALIDAÇÃO LOCAL JÁ DETECTADA:
${JSON.stringify(
  validacao,
  null,
  2
)}
`;

  const raw =
    await chamarGemini(prompt, {
      temperature: 0.05
    });

  return extrairJSON(raw);
}

/*
|--------------------------------------------------------------------------
| CORRETOR
|--------------------------------------------------------------------------
*/

async function corrigirScript(
  script,
  review,
  plano
) {
  const prompt = `
Você é o CORRETOR FINAL de código Roblox/Luau.

O script abaixo apresentou problemas durante a revisão.

PROJETO:
${JSON.stringify(plano, null, 2)}

SCRIPT ORIGINAL:
${JSON.stringify(script, null, 2)}

REVISÃO:
${JSON.stringify(review, null, 2)}

Corrija TODOS os problemas encontrados.

REGRAS:

1. Preserve a finalidade do script.
2. Preserve o tipo.
3. Preserve a localização.
4. Preserve as dependências válidas.
5. Não invente APIs.
6. Não remova funcionalidades importantes sem motivo.
7. Corrija referências inexistentes.
8. Corrija problemas cliente/servidor.
9. Corrija escopo.
10. Corrija eventos.
11. Corrija chamadas de serviço.
12. Não use loadstring.
13. Não use código Markdown.
14. Retorne SOMENTE JSON.
15. O campo code deve conter o código Luau completo.

Formato:

{
  "name": "Nome",
  "type": "Script",
  "location": "ServerScriptService",
  "dependencies": [],
  "description": "",
  "purpose": "",
  "code": ""
}
`;

  const raw =
    await chamarGemini(prompt, {
      temperature: 0.05
    });

  const corrigido =
    normalizarScript(
      extrairJSON(raw),
      0
    );

  corrigido.code =
    limparCodigo(
      corrigido.code
    );

  return corrigido;
}

/*
|--------------------------------------------------------------------------
| PIPELINE DE QUALIDADE
|--------------------------------------------------------------------------
*/

async function verificarEUsar(
  script,
  plano
) {
  let atual = script;

  const historico = [];

  for (
    let tentativa = 0;
    tentativa <= MAX_REVISIONS;
    tentativa++
  ) {
    const review =
      await revisarScript(
        atual,
        plano
      );

    historico.push({
      tentativa,
      review
    });

    const validacao =
      validarScript(atual);

    const aprovado =
      review?.approved === true &&
      validacao.valido === true;

    if (aprovado) {
      return {
        script: atual,
        status: "approved",
        score:
          Number(review.score) || 100,
        warnings: [
          ...validacao.avisos,
          ...arraySeguro(review.warnings)
        ],
        revisions: tentativa,
        history: historico
      };
    }

    if (
      tentativa >= MAX_REVISIONS
    ) {
      return {
        script: atual,
        status: "needs_review",
        score:
          Number(review.score) || 0,
        warnings: [
          ...validacao.avisos,
          ...arraySeguro(review.warnings),
          ...arraySeguro(review.errors)
        ],
        revisions: tentativa,
        history: historico
      };
    }

    atual =
      await corrigirScript(
        atual,
        review,
        plano
      );
  }

  return {
    script: atual,
    status: "needs_review",
    score: 0,
    warnings: [
      "Não foi possível concluir a validação."
    ],
    revisions: MAX_REVISIONS,
    history: historico
  };
}

/*
|--------------------------------------------------------------------------
| BUILDER DE COMPATIBILIDADE
|--------------------------------------------------------------------------
|
| NÃO É MAIS A ARQUITETURA PRINCIPAL.
|
| Serve apenas para clientes antigos que ainda esperam
| projeto.builder_script.code.
|
*/

function criarCompatibilidadeBuilder(scripts) {
  const blocos = [];

  for (const script of scripts) {
    blocos.push(
      [
        `-- ==================================================`,
        `-- ${script.name}`,
        `-- Tipo: ${script.type}`,
        `-- Localização: ${script.location}`,
        `-- ==================================================`,
        script.code
      ].join("\n")
    );
  }

  return {
    name: "GeneratedScripts",
    type: "Collection",
    code: blocos.join(
      "\n\n"
    )
  };
}

/*
|--------------------------------------------------------------------------
| HANDLER
|--------------------------------------------------------------------------
*/

module.exports = async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    return resposta(
      res,
      405,
      {
        sucesso: false,
        erro: "Método não permitido."
      }
    );
  }

  try {
    const body =
      req.body || {};

    const ideia =
      texto(
        body.ideia,
        ""
      ).trim();

    if (!ideia) {
      return resposta(
        res,
        400,
        {
          sucesso: false,
          erro:
            "Digite uma ideia para o jogo."
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ETAPA 1 — PLANEJAMENTO
    |--------------------------------------------------------------------------
    */

    const plano =
      await criarPlano(
        ideia
      );

    /*
    |--------------------------------------------------------------------------
    | ETAPA 2 — PROJETO BASE
    |--------------------------------------------------------------------------
    */

    const projeto =
      normalizarProjeto(
        plano
      );

    /*
    |--------------------------------------------------------------------------
    | ETAPA 3 — GERAÇÃO DOS SCRIPTS
    |--------------------------------------------------------------------------
    */

    const scriptsGerados =
      await gerarScripts(
        projeto
      );

    /*
    |--------------------------------------------------------------------------
    | ETAPA 4 — REVISÃO + AUTOCORREÇÃO
    |--------------------------------------------------------------------------
    */

    const scriptsFinais = [];

    for (
      const script of scriptsGerados
    ) {
      const resultado =
        await verificarEUsar(
          script,
          projeto
        );

      const finalScript =
        resultado.script;

      scriptsFinais.push({
        ...finalScript,

        quality: {
          status:
            resultado.status,

          score:
            resultado.score,

          revisions:
            resultado.revisions,

          warnings:
            resultado.warnings
        }
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ETAPA 5 — RESULTADO
    |--------------------------------------------------------------------------
    */

    projeto.scripts =
      scriptsFinais;

    /*
    | Compatibilidade com o frontend antigo.
    | A nova IA NÃO depende disso.
    */

    projeto.builder_script =
      criarCompatibilidadeBuilder(
        scriptsFinais
      );

    const aprovados =
      scriptsFinais.filter(
        (script) =>
          script.quality?.status ===
          "approved"
      ).length;

    const scoreMedio =
      scriptsFinais.length > 0
        ? Math.round(
            scriptsFinais.reduce(
              (total, script) =>
                total +
                Number(
                  script.quality?.score ||
                  0
                ),
              0
            ) /
            scriptsFinais.length
          )
        : 0;

    projeto.quality = {
      total_scripts:
        scriptsFinais.length,

      approved_scripts:
        aprovados,

      scripts_needing_review:
        scriptsFinais.length -
        aprovados,

      average_score:
        scoreMedio
    };

    projeto.generated_by =
      "Roblox AI Studio - Script Engine";

    projeto.engine_version =
      "2.0";

    return resposta(
      res,
      200,
      {
        sucesso: true,
        projeto,

        /*
        | Acesso direto aos scripts.
        */
        scripts:
          scriptsFinais,

        quality:
          projeto.quality
      }
    );

  } catch (error) {
    console.error(
      "ERRO INTERNO:",
      error
    );

    return resposta(
      res,
      500,
      {
        sucesso: false,

        erro:
          "Não foi possível gerar o projeto.",

        detalhe:
          error?.message ||
          "Erro desconhecido."
      }
    );
  }
};
