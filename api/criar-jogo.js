// api/criar-jogo.js
// Roblox AI Studio - Script Engine
// Backend para planejamento, geração, validação e revisão de scripts Luau.

const MODELO = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_SCRIPTS = 8;
const MAX_REVISIONS = 2;

/* =========================================================
   UTILITÁRIOS
========================================================= */

function resposta(res, status, dados) {
  res.status(status).json(dados);
}

function limparTexto(valor, fallback = "") {
  if (typeof valor !== "string") return fallback;
  return valor.trim();
}

function extrairJSON(texto) {
  if (!texto || typeof texto !== "string") {
    throw new Error("Resposta vazia da IA.");
  }

  let conteudo = texto.trim();

  // Remove markdown ```json ... ```
  conteudo = conteudo
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Tenta JSON direto
  try {
    return JSON.parse(conteudo);
  } catch (_) {}

  // Procura primeiro objeto JSON
  const inicioObjeto = conteudo.indexOf("{");
  const fimObjeto = conteudo.lastIndexOf("}");

  if (inicioObjeto !== -1 && fimObjeto > inicioObjeto) {
    try {
      return JSON.parse(
        conteudo.substring(inicioObjeto, fimObjeto + 1)
      );
    } catch (_) {}
  }

  // Procura array JSON
  const inicioArray = conteudo.indexOf("[");
  const fimArray = conteudo.lastIndexOf("]");

  if (inicioArray !== -1 && fimArray > inicioArray) {
    try {
      return JSON.parse(
        conteudo.substring(inicioArray, fimArray + 1)
      );
    } catch (_) {}
  }

  throw new Error("A IA retornou um formato que não é JSON válido.");
}

/* =========================================================
   GEMINI
========================================================= */

async function chamarGemini(prompt, temperatura = 0.15) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada na Vercel.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${MODELO}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
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
        temperature: temperatura,
        responseMimeType: "application/json"
      }
    })
  });

  const textoResposta = await response.text();

  if (!response.ok) {
    throw new Error(
      `Gemini HTTP ${response.status}: ${textoResposta.slice(0, 1000)}`
    );
  }

  let dados;

  try {
    dados = JSON.parse(textoResposta);
  } catch (_) {
    throw new Error("Resposta inválida da API Gemini.");
  }

  const texto =
    dados?.candidates?.[0]?.content?.parts
      ?.map((parte) => parte.text || "")
      .join("") || "";

  if (!texto) {
    throw new Error("A Gemini não retornou conteúdo.");
  }

  return extrairJSON(texto);
}

/* =========================================================
   FALLBACK
   Nunca deixar uma solicitação de script terminar com
   scripts: []
========================================================= */

function criarPlanoFallback(ideia) {
  const texto = ideia.toLowerCase();

  if (
    texto.includes("npc") ||
    texto.includes("personagem") ||
    texto.includes("diálogo") ||
    texto.includes("dialogo")
  ) {
    return [
      {
        id: "npc_server",
        name: "NPCInteractionServer",
        type: "Script",
        location: "ServerScriptService",
        purpose:
          "Controlar as interações dos jogadores com NPCs no servidor.",
        description:
          "Recebe a interação com NPCs e valida a comunicação no servidor.",
        dependencies: [
          "ReplicatedStorage > Remotes > NPCInteraction"
        ]
      },
      {
        id: "npc_client",
        name: "NPCDialogueClient",
        type: "LocalScript",
        location: "StarterPlayer > StarterPlayerScripts",
        purpose:
          "Detectar a interação do jogador com NPCs e apresentar o diálogo.",
        description:
          "Controla a interação visual do jogador com NPCs.",
        dependencies: [
          "ReplicatedStorage > Remotes > NPCInteraction"
        ]
      }
    ];
  }

  if (
    texto.includes("leaderstats") ||
    texto.includes("dinheiro") ||
    texto.includes("coins") ||
    texto.includes("moedas")
  ) {
    return [
      {
        id: "currency_server",
        name: "CurrencySystem",
        type: "Script",
        location: "ServerScriptService",
        purpose:
          "Criar e controlar a moeda dos jogadores.",
        description:
          "Sistema básico de moeda utilizando leaderstats.",
        dependencies: []
      }
    ];
  }

  if (
    texto.includes("porta") ||
    texto.includes("door") ||
    texto.includes("abrir")
  ) {
    return [
      {
        id: "door_server",
        name: "DoorSystem",
        type: "Script",
        location: "ServerScriptService",
        purpose:
          "Controlar a abertura e fechamento de uma porta.",
        description:
          "Sistema básico para portas interativas.",
        dependencies: []
      }
    ];
  }

  return [
    {
      id: "main_system",
      name: "MainGameSystem",
      type: "Script",
      location: "ServerScriptService",
      purpose:
        "Implementar o sistema principal solicitado pelo usuário.",
      description:
        `Sistema gerado para a solicitação: ${ideia}`,
      dependencies: []
    }
  ];
}

function garantirPlano(plano, ideia) {
  if (
    plano &&
    Array.isArray(plano.script_plan) &&
    plano.script_plan.length > 0
  ) {
    return plano.script_plan.slice(0, MAX_SCRIPTS);
  }

  return criarPlanoFallback(ideia);
}

/* =========================================================
   PLANEJADOR
========================================================= */

async function criarPlano(ideia) {
  const prompt = `
Você é o arquiteto principal de um projeto Roblox.

Use Luau moderno e organize o sistema corretamente entre
servidor e cliente.

SOLICITAÇÃO DO USUÁRIO:
${ideia}

Crie um plano técnico de scripts.

REGRAS:

1. Nunca retorne script_plan vazio.
2. Deve existir pelo menos 1 script.
3. Use Script para lógica do servidor.
4. Use LocalScript para lógica do cliente.
5. Use ModuleScript quando houver código compartilhado.
6. Nunca coloque DataStoreService em LocalScript.
7. Não use loadstring.
8. Evite código obsoleto.
9. Informe a localização correta de cada script.
10. Informe dependências.
11. Gere somente scripts realmente necessários.

Responda SOMENTE JSON:

{
  "title": "Nome do projeto",
  "description": "Descrição",
  "genre": "Gênero",
  "difficulty": "Fácil | Médio | Difícil",
  "players": 10,
  "systems": [],
  "script_plan": [
    {
      "id": "id_unico",
      "name": "NomeDoScript",
      "type": "Script | LocalScript | ModuleScript",
      "location": "ServerScriptService",
      "purpose": "Função do script",
      "description": "Descrição técnica",
      "dependencies": []
    }
  ]
}
`;

  try {
    return await chamarGemini(prompt, 0.1);
  } catch (erro) {
    console.error("Erro no planejador:", erro.message);

    return {
      title: "Roblox Game",
      description: ideia,
      genre: "Roblox",
      difficulty: "Médio",
      players: 10,
      systems: [],
      script_plan: criarPlanoFallback(ideia)
    };
  }
}

/* =========================================================
   CÓDIGO FALLBACK
========================================================= */

function codigoFallback(spec) {
  const nome = spec.name.toLowerCase();

  // NPC SERVIDOR
  if (
    nome.includes("npc") &&
    spec.type === "Script"
  ) {
    return `-- NPCInteractionServer
-- Gerado pelo Roblox AI Studio

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local remotes = ReplicatedStorage:FindFirstChild("Remotes")

if not remotes then
    remotes = Instance.new("Folder")
    remotes.Name = "Remotes"
    remotes.Parent = ReplicatedStorage
end

local npcInteraction = remotes:FindFirstChild("NPCInteraction")

if not npcInteraction then
    npcInteraction = Instance.new("RemoteEvent")
    npcInteraction.Name = "NPCInteraction"
    npcInteraction.Parent = remotes
end

npcInteraction.OnServerEvent:Connect(function(player, npc)
    if typeof(npc) ~= "Instance" then
        return
    end

    if not npc:IsDescendantOf(workspace) then
        return
    end

    if not npc:IsA("Model") then
        return
    end

    local humanoid = npc:FindFirstChildOfClass("Humanoid")

    if not humanoid then
        return
    end

    print(player.Name .. " interagiu com o NPC " .. npc.Name)

    npcInteraction:FireClient(
        player,
        npc,
        "Olá, " .. player.DisplayName .. "!"
    )
end)
`;
  }

  // NPC CLIENTE
  if (
    nome.includes("npc") &&
    spec.type === "LocalScript"
  ) {
    return `-- NPCDialogueClient
-- Gerado pelo Roblox AI Studio

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer

local remotes = ReplicatedStorage:WaitForChild("Remotes")
local npcInteraction = remotes:WaitForChild("NPCInteraction")

local function conectarNPC(npc)
    if not npc:IsA("Model") then
        return
    end

    if not npc:FindFirstChildOfClass("Humanoid") then
        return
    end

    local prompt = npc:FindFirstChildWhichIsA(
        "ProximityPrompt",
        true
    )

    if not prompt then
        return
    end

    if prompt:GetAttribute("NPCConnected") then
        return
    end

    prompt:SetAttribute("NPCConnected", true)

    prompt.Triggered:Connect(function()
        npcInteraction:FireServer(npc)
    end)
end

for _, objeto in ipairs(workspace:GetDescendants()) do
    if objeto:IsA("Model") then
        conectarNPC(objeto)
    end
end

workspace.DescendantAdded:Connect(function(objeto)
    if objeto:IsA("Model") then
        task.defer(function()
            conectarNPC(objeto)
        end)
    end
end)

npcInteraction.OnClientEvent:Connect(function(npc, mensagem)
    print("NPC:", npc.Name)
    print("Diálogo:", mensagem)
end)
`;
  }

  // MOEDA
  if (
    nome.includes("currency") ||
    nome.includes("coin") ||
    nome.includes("dinheiro")
  ) {
    return `-- CurrencySystem
-- Sistema básico de moeda

local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = leaderstats
end)
`;
  }

  // FALLBACK GENÉRICO
  return `-- ${spec.name}
-- Gerado pelo Roblox AI Studio

local function iniciarSistema()
    print("${spec.name} iniciado.")
end

iniciarSistema()
`;
}

/* =========================================================
   GERADOR DE SCRIPT
========================================================= */

async function gerarScript(spec, ideia, plano) {
  const prompt = `
Você é um programador especialista em Roblox Luau.

PROJETO:
${JSON.stringify(plano, null, 2)}

SOLICITAÇÃO ORIGINAL:
${ideia}

SCRIPT A SER GERADO:
${JSON.stringify(spec, null, 2)}

Crie SOMENTE o código Luau desse script.

REGRAS OBRIGATÓRIAS:

- Código Luau válido.
- Não use Markdown.
- Não coloque \`\`\`.
- Não invente APIs inexistentes.
- Use serviços Roblox corretamente.
- ServerScriptService para lógica segura do servidor.
- StarterPlayerScripts para LocalScripts gerais.
- ReplicatedStorage para objetos compartilhados.
- RemoteEvents devem ter validação no servidor.
- Não confie em valores enviados pelo cliente.
- Não use loadstring.
- Não use getfenv.
- Não use setfenv.
- Não use APIs depreciadas sem necessidade.
- Não coloque DataStoreService em LocalScript.
- O código deve ser executável.
- Não escreva explicações fora do código.

Retorne JSON:

{
  "name": "${spec.name}",
  "type": "${spec.type}",
  "location": "${spec.location}",
  "dependencies": ${JSON.stringify(spec.dependencies || [])},
  "description": ${JSON.stringify(spec.description || "")},
  "purpose": ${JSON.stringify(spec.purpose || "")},
  "code": "CÓDIGO LUA AQUI"
}
`;

  try {
    const resultado = await chamarGemini(prompt, 0.08);

    if (
      !resultado ||
      typeof resultado.code !== "string" ||
      resultado.code.trim().length < 10
    ) {
      throw new Error("A IA retornou código vazio.");
    }

    return {
      name: limparTexto(resultado.name, spec.name),
      type: limparTexto(resultado.type, spec.type),
      location: limparTexto(
        resultado.location,
        spec.location
      ),
      dependencies: Array.isArray(resultado.dependencies)
        ? resultado.dependencies
        : spec.dependencies || [],
      description: limparTexto(
        resultado.description,
        spec.description
      ),
      purpose: limparTexto(
        resultado.purpose,
        spec.purpose
      ),
      code: resultado.code.trim(),
      generated_by_ai: true
    };
  } catch (erro) {
    console.error(
      `Falha ao gerar ${spec.name}:`,
      erro.message
    );

    return {
      name: spec.name,
      type: spec.type,
      location: spec.location,
      dependencies: spec.dependencies || [],
      description: spec.description || "",
      purpose: spec.purpose || "",
      code: codigoFallback(spec),
      generated_by_ai: false,
      fallback: true
    };
  }
}

/* =========================================================
   VALIDAÇÃO LOCAL
========================================================= */

function validarScript(script) {
  const errors = [];
  const warnings = [];

  if (!script.name) {
    errors.push("Script sem nome.");
  }

  if (!script.type) {
    errors.push("Script sem tipo.");
  }

  if (!script.location) {
    errors.push("Script sem localização.");
  }

  if (!script.code || script.code.trim().length < 10) {
    errors.push("Script sem código válido.");
  }

  const codigo = script.code || "";

  if (
    codigo.includes("```lua") ||
    codigo.includes("```luau") ||
    codigo.includes("```")
  ) {
    errors.push(
      "O código contém blocos Markdown."
    );
  }

  if (/TODO|IMPLEMENT_ME/i.test(codigo)) {
    warnings.push(
      "O código possui marcador TODO ou IMPLEMENT_ME."
    );
  }

  if (/loadstring\s*\(/i.test(codigo)) {
    errors.push(
      "loadstring não é permitido."
    );
  }

  if (/getfenv\s*\(/i.test(codigo)) {
    errors.push(
      "getfenv não deve ser utilizado."
    );
  }

  if (/setfenv\s*\(/i.test(codigo)) {
    errors.push(
      "setfenv não deve ser utilizado."
    );
  }

  if (
    script.type === "LocalScript" &&
    /DataStoreService/i.test(codigo)
  ) {
    errors.push(
      "LocalScript não deve acessar DataStoreService."
    );
  }

  if (
    script.type === "LocalScript" &&
    /ServerStorage/i.test(codigo)
  ) {
    errors.push(
      "LocalScript não deve acessar ServerStorage."
    );
  }

  if (/HttpService/i.test(codigo)) {
    warnings.push(
      "O script utiliza HttpService. Verifique a configuração do jogo."
    );
  }

  if (
    script.type === "LocalScript" &&
    /FireServer\s*\(/i.test(codigo)
  ) {
    warnings.push(
      "RemoteEvent detectado. O servidor deve validar os dados recebidos."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/* =========================================================
   REVISOR
========================================================= */

async function revisarScript(script, plano) {
  const validacaoLocal = validarScript(script);

  if (!validacaoLocal.valid) {
    return {
      approved: false,
      score: 30,
      errors: validacaoLocal.errors,
      warnings: validacaoLocal.warnings,
      fixes: [
        "Corrigir os erros encontrados na validação local."
      ],
      source: "local"
    };
  }

  const prompt = `
Você é um revisor extremamente rigoroso de código Roblox Luau.

SCRIPT:
${JSON.stringify(script, null, 2)}

PROJETO:
${JSON.stringify(plano, null, 2)}

Analise:

1. Sintaxe Luau.
2. APIs Roblox.
3. Serviços utilizados.
4. Cliente versus servidor.
5. Segurança.
6. RemoteEvents.
7. Possíveis erros em runtime.
8. Variáveis inexistentes.
9. Eventos incorretos.
10. Código obsoleto.
11. Organização.
12. Compatibilidade com Roblox Studio.

Não invente problemas.

Retorne SOMENTE JSON:

{
  "approved": true,
  "score": 0,
  "errors": [],
  "warnings": [],
  "fixes": []
}

score deve ser de 0 a 100.
approved só pode ser true se o script estiver realmente utilizável.
`;

  try {
    const review = await chamarGemini(prompt, 0.05);

    return {
      approved: Boolean(review.approved),
      score: Math.max(
        0,
        Math.min(100, Number(review.score) || 0)
      ),
      errors: Array.isArray(review.errors)
        ? review.errors
        : [],
      warnings: Array.isArray(review.warnings)
        ? review.warnings
        : [],
      fixes: Array.isArray(review.fixes)
        ? review.fixes
        : [],
      source: "ai"
    };
  } catch (erro) {
    console.error(
      `Erro revisando ${script.name}:`,
      erro.message
    );

    return {
      approved: validacaoLocal.valid,
      score: validacaoLocal.valid ? 80 : 30,
      errors: validacaoLocal.errors,
      warnings: validacaoLocal.warnings,
      fixes: [],
      source: "local"
    };
  }
}

/* =========================================================
   CORRETOR
========================================================= */

async function corrigirScript(script, review, plano) {
  const prompt = `
Você é um especialista em correção de scripts Roblox Luau.

SCRIPT ATUAL:
${JSON.stringify(script, null, 2)}

REVISÃO:
${JSON.stringify(review, null, 2)}

PROJETO:
${JSON.stringify(plano, null, 2)}

Corrija TODOS os erros reais encontrados.

REGRAS:

- Preserve a finalidade original.
- Use Luau moderno.
- Não use loadstring.
- Não use getfenv.
- Não use setfenv.
- Não coloque lógica do servidor em LocalScript.
- Não confie no cliente.
- Não invente APIs.
- Retorne código executável.
- Não use Markdown.

Retorne SOMENTE JSON:

{
  "code": "CÓDIGO LUA CORRIGIDO"
}
`;

  try {
    const resultado = await chamarGemini(prompt, 0.05);

    if (
      !resultado ||
      typeof resultado.code !== "string" ||
      resultado.code.trim().length < 10
    ) {
      throw new Error("Correção vazia.");
    }

    return {
      ...script,
      code: resultado.code.trim(),
      generated_by_ai: true
    };
  } catch (erro) {
    console.error(
      `Erro corrigindo ${script.name}:`,
      erro.message
    );

    return script;
  }
}

/* =========================================================
   PIPELINE DE QUALIDADE
========================================================= */

async function verificarEUsar(script, plano) {
  let atual = script;
  let revisoes = 0;

  while (revisoes <= MAX_REVISIONS) {
    const review = await revisarScript(atual, plano);

    if (review.approved) {
      return {
        ...atual,
        quality: {
          status: "approved",
          score: review.score,
          revisions: revisoes,
          warnings: review.warnings,
          errors: review.errors || []
        }
      };
    }

    if (revisoes >= MAX_REVISIONS) {
      return {
        ...atual,
        quality: {
          status: "needs_review",
          score: review.score,
          revisions: revisoes,
          warnings: review.warnings,
          errors: review.errors || [],
          fixes: review.fixes || []
        }
      };
    }

    atual = await corrigirScript(
      atual,
      review,
      plano
    );

    revisoes++;
  }

  return {
    ...atual,
    quality: {
      status: "needs_review",
      score: 50,
      revisions: revisoes,
      warnings: [],
      errors: [
        "Não foi possível concluir a revisão."
      ]
    }
  };
}

/* =========================================================
   NORMALIZAÇÃO DO PROJETO
========================================================= */

function normalizarProjeto(base, ideia, scripts) {
  const plano = base || {};

  const scores = scripts
    .map((s) => Number(s?.quality?.score || 0))
    .filter((n) => n > 0);

  const aprovados = scripts.filter(
    (s) => s?.quality?.status === "approved"
  ).length;

  const media =
    scores.length > 0
      ? Math.round(
          scores.reduce((a, b) => a + b, 0) /
            scores.length
        )
      : 0;

  return {
    title:
      limparTexto(plano.title) ||
      "Roblox AI Game",

    game_name:
      limparTexto(plano.title) ||
      "Roblox AI Game",

    description:
      limparTexto(plano.description) ||
      ideia,

    genre:
      limparTexto(plano.genre) ||
      "Roblox",

    difficulty:
      limparTexto(plano.difficulty) ||
      "Médio",

    players:
      Number(plano.players) || 10,

    estimated_players:
      Number(plano.players) || 10,

    systems: Array.isArray(plano.systems)
      ? plano.systems
      : [],

    objects: Array.isArray(plano.objects)
      ? plano.objects
      : [],

    npcs: Array.isArray(plano.npcs)
      ? plano.npcs
      : [],

    quests: Array.isArray(plano.quests)
      ? plano.quests
      : [],

    items: Array.isArray(plano.items)
      ? plano.items
      : [],

    shops: Array.isArray(plano.shops)
      ? plano.shops
      : [],

    pets: Array.isArray(plano.pets)
      ? plano.pets
      : [],

    recommended_remotes:
      Array.isArray(plano.recommended_remotes)
        ? plano.recommended_remotes
        : [],

    scripts,

    steps: Array.isArray(plano.steps)
      ? plano.steps
      : [],

    future_upgrades:
      Array.isArray(plano.future_upgrades)
        ? plano.future_upgrades
        : [],

    quality: {
      total_scripts: scripts.length,
      approved_scripts: aprovados,
      scripts_needing_review:
        scripts.length - aprovados,
      average_score: media
    },

    generated_by:
      "Roblox AI Studio - Script Engine",

    engine_version: "2.1"
  };
}

/* =========================================================
   BUILDER DE COMPATIBILIDADE
   Não é mais o sistema principal.
========================================================= */

function criarCompatibilidadeBuilder(scripts) {
  const blocos = scripts.map((script) => {
    return [
      `-- ========================================`,
      `-- ${script.name}`,
      `-- Tipo: ${script.type}`,
      `-- Local: ${script.location}`,
      `-- ========================================`,
      ``,
      script.code
    ].join("\n");
  });

  return {
    name: "GeneratedScripts",
    type: "Collection",
    code: blocos.join("\n\n\n")
  };
}

/* =========================================================
   HANDLER
========================================================= */

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return resposta(res, 405, {
      sucesso: false,
      erro: "Método não permitido. Use POST."
    });
  }

  try {
    const body = req.body || {};

    const ideia = limparTexto(
      body.ideia ||
      body.idea ||
      body.prompt
    );

    if (!ideia) {
      return resposta(res, 400, {
        sucesso: false,
        erro: "Digite uma ideia para o jogo ou script."
      });
    }

    console.log(
      "========================================"
    );
    console.log(
      "ROBLOX AI STUDIO - NOVA SOLICITAÇÃO"
    );
    console.log(
      "Ideia:",
      ideia
    );
    console.log(
      "========================================"
    );

    // 1. PLANEJAMENTO
    const planoIA = await criarPlano(ideia);

    // 2. GARANTIR QUE EXISTE PELO MENOS UM SCRIPT
    const scriptPlan = garantirPlano(
      planoIA,
      ideia
    );

    console.log(
      "Scripts planejados:",
      scriptPlan.length
    );

    // 3. GERAR SCRIPTS
    const scriptsGerados = [];

    for (const spec of scriptPlan) {
      console.log(
        "Gerando:",
        spec.name
      );

      const script = await gerarScript(
        spec,
        ideia,
        planoIA
      );

      scriptsGerados.push(script);
    }

    // Segurança extra:
    // nunca permitir retorno com array vazio
    if (scriptsGerados.length === 0) {
      const fallbackPlan =
        criarPlanoFallback(ideia);

      for (const spec of fallbackPlan) {
        scriptsGerados.push({
          name: spec.name,
          type: spec.type,
          location: spec.location,
          dependencies:
            spec.dependencies || [],
          description:
            spec.description || "",
          purpose:
            spec.purpose || "",
          code: codigoFallback(spec),
          generated_by_ai: false,
          fallback: true
        });
      }
    }

    // 4. REVISÃO
    const scriptsFinais = [];

    for (const script of scriptsGerados) {
      console.log(
        "Revisando:",
        script.name
      );

      const finalScript =
        await verificarEUsar(
          script,
          planoIA
        );

      scriptsFinais.push(finalScript);
    }

    // 5. PROJETO FINAL
    const projeto = normalizarProjeto(
      planoIA,
      ideia,
      scriptsFinais
    );

    // Compatibilidade com a interface antiga
    projeto.builder_script =
      criarCompatibilidadeBuilder(
        scriptsFinais
      );

    const quality = projeto.quality;

    console.log(
      "========================================"
    );
    console.log(
      "FINALIZADO"
    );
    console.log(
      "Total:",
      quality.total_scripts
    );
    console.log(
      "Aprovados:",
      quality.approved_scripts
    );
    console.log(
      "Score:",
      quality.average_score
    );
    console.log(
      "========================================"
    );

    return resposta(res, 200, {
      sucesso: true,

      projeto,

      // Também no nível principal para
      // facilitar compatibilidade.
      scripts: scriptsFinais,

      quality,

      mensagem:
        `${scriptsFinais.length} script(s) gerado(s) com sucesso.`
    });

  } catch (erro) {
    console.error(
      "ERRO INTERNO:",
      erro
    );

    return resposta(res, 500, {
      sucesso: false,
      erro:
        erro?.message ||
        "Erro interno ao gerar projeto.",
      scripts: []
    });
  }
};9
