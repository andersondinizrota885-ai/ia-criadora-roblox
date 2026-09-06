const MODELO = "gemini-3.6-flash";

function resposta(res, status, dados) {
  res.status(status).json(dados);
}

function limparProjeto(projeto) {
  return {
    title: projeto.title || "Meu Jogo Roblox",
    genre: projeto.genre || "Aventura",
    objective: projeto.objective || "",
    difficulty: projeto.difficulty || "Médio",
    players: Number(projeto.players) || 10,

    areas: Array.isArray(projeto.areas)
      ? projeto.areas
      : [],

    objects: Array.isArray(projeto.objects)
      ? projeto.objects
      : [],

    npcs: Array.isArray(projeto.npcs)
      ? projeto.npcs
      : [],

    systems: Array.isArray(projeto.systems)
      ? projeto.systems
      : [],

    quests: Array.isArray(projeto.quests)
      ? projeto.quests
      : [],

    items: Array.isArray(projeto.items)
      ? projeto.items
      : [],

    shops: Array.isArray(projeto.shops)
      ? projeto.shops
      : [],

    pets: Array.isArray(projeto.pets)
      ? projeto.pets
      : [],

    remotes: Array.isArray(projeto.remotes)
      ? projeto.remotes
      : [],

    scripts: Array.isArray(projeto.scripts)
      ? projeto.scripts
      : [],

    next_upgrades: Array.isArray(projeto.next_upgrades)
      ? projeto.next_upgrades
      : []
  };
}

function gerarBuilder(projeto) {

  const dados = JSON.stringify(projeto)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");

  return `-- ROBLOX AI BUILDER
-- Gerado pelo Roblox AI Studio

local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")

local PROJECT_JSON = "${dados}"

local PROJECT

local ok, result = pcall(function()
    return HttpService:JSONDecode(PROJECT_JSON)
end)

if not ok then
    warn("[Roblox AI] Erro ao ler projeto:", result)
    return
end

--------------------------------------------------
-- FUNÇÕES
--------------------------------------------------

local function folder(parent, name)

    local old = parent:FindFirstChild(name)

    if old then
        old:Destroy()
    end

    local f = Instance.new("Folder")
    f.Name = name
    f.Parent = parent

    return f
end

local function part(parent, name, position, size)

    local p = Instance.new("Part")

    p.Name = name
    p.Position = position
    p.Size = size

    p.Anchored = true
    p.CanCollide = true

    p.Parent = parent

    return p
end

local function stringValue(parent, name, value)

    local v = Instance.new("StringValue")

    v.Name = name
    v.Value = tostring(value or "")

    v.Parent = parent

    return v
end

--------------------------------------------------
-- LIMPAR PROJETO ANTERIOR
--------------------------------------------------

local oldMap = workspace:FindFirstChild("GeneratedMap")

if oldMap then
    oldMap:Destroy()
end

local replicated = game:GetService("ReplicatedStorage")

local oldAI = replicated:FindFirstChild("RobloxAI")

if oldAI then
    oldAI:Destroy()
end

--------------------------------------------------
-- WORKSPACE
--------------------------------------------------

local generatedMap = folder(
    workspace,
    "GeneratedMap"
)

local areasFolder = folder(
    generatedMap,
    "Areas"
)

local objectsFolder = folder(
    generatedMap,
    "Objects"
)

local npcsFolder = folder(
    generatedMap,
    "NPCs"
)

local spawnsFolder = folder(
    generatedMap,
    "Spawns"
)

--------------------------------------------------
-- ÁREAS
--------------------------------------------------

local positions = {
    Vector3.new(0, 0, 0),
    Vector3.new(120, 0, 0),
    Vector3.new(-120, 0, 0),
    Vector3.new(0, 0, 120),
    Vector3.new(0, 0, -120),
    Vector3.new(120, 0, 120),
    Vector3.new(-120, 0, -120)
}

for i, area in ipairs(PROJECT.areas or {}) do

    local name

    if typeof(area) == "string" then
        name = area
    else
        name = area.name or area.nome or ("Area_" .. i)
    end

    local position =
        positions[i]
        or Vector3.new(i * 100, 0, 0)

    local zone = part(
        areasFolder,
        name,
        position + Vector3.new(0, -5, 0),
        Vector3.new(80, 10, 80)
    )

    zone.Material = Enum.Material.Grass

    zone:SetAttribute(
        "GeneratedBy",
        "Roblox AI Studio"
    )
end

--------------------------------------------------
-- OBJETOS
--------------------------------------------------

for i, object in ipairs(PROJECT.objects or {}) do

    local name

    if typeof(object) == "string" then
        name = object
    else
        name =
            object.name
            or object.nome
            or ("Object_" .. i)
    end

    local p = part(
        objectsFolder,
        name,
        Vector3.new(i * 12, 3, 0),
        Vector3.new(8, 6, 8)
    )

    p:SetAttribute(
        "GeneratedBy",
        "Roblox AI Studio"
    )

    if typeof(object) == "table" then

        p:SetAttribute(
            "Type",
            tostring(
                object.type
                or object.tipo
                or "Object"
            )
        )
    end
end

--------------------------------------------------
-- NPCS
--------------------------------------------------

for i, npc in ipairs(PROJECT.npcs or {}) do

    local name
    local hp = 100

    if typeof(npc) == "string" then

        name = npc

    else

        name =
            npc.name
            or npc.nome
            or ("NPC_" .. i)

        hp =
            tonumber(
                npc.hp
                or npc.health
                or npc.vida
                or 100
            )
            or 100
    end

    local model = Instance.new("Model")

    model.Name = name

    local root = Instance.new("Part")

    root.Name = "HumanoidRootPart"
    root.Size = Vector3.new(2, 2, 1)
    root.Position = Vector3.new(
        i * 15,
        5,
        20
    )

    root.Transparency = 1
    root.CanCollide = false
    root.Anchored = false

    root.Parent = model

    local body = Instance.new("Part")

    body.Name = "Body"
    body.Size = Vector3.new(4, 5, 2)
    body.Position = root.Position + Vector3.new(0, 2, 0)

    body.Anchored = false
    body.Parent = model

    local head = Instance.new("Part")

    head.Name = "Head"
    head.Shape = Enum.PartType.Ball
    head.Size = Vector3.new(2, 2, 2)
    head.Position = root.Position + Vector3.new(0, 5.5, 0)

    head.Anchored = false
    head.Parent = model

    local humanoid = Instance.new("Humanoid")

    humanoid.MaxHealth = hp
    humanoid.Health = hp

    humanoid.Parent = model

    local weld1 = Instance.new("WeldConstraint")

    weld1.Part0 = root
    weld1.Part1 = body
    weld1.Parent = root

    local weld2 = Instance.new("WeldConstraint")

    weld2.Part0 = root
    weld2.Part1 = head
    weld2.Parent = root

    model.PrimaryPart = root

    model:SetAttribute(
        "GeneratedBy",
        "Roblox AI Studio"
    )

    model:SetAttribute(
        "Health",
        hp
    )

    model.Parent = npcsFolder
end

--------------------------------------------------
-- SPAWN
--------------------------------------------------

local spawn = Instance.new("SpawnLocation")

spawn.Name = "MainSpawn"
spawn.Size = Vector3.new(8, 1, 8)
spawn.Position = Vector3.new(0, 5, 0)

spawn.Anchored = true
spawn.Neutral = true

spawn.Parent = spawnsFolder

--------------------------------------------------
-- REPLICATED STORAGE
--------------------------------------------------

local aiFolder = folder(
    replicated,
    "RobloxAI"
)

local remotesFolder = folder(
    aiFolder,
    "Remotes"
)

local modulesFolder = folder(
    aiFolder,
    "Modules"
)

--------------------------------------------------
-- REMOTES
--------------------------------------------------

local defaultRemotes = {
    "Attack",
    "BuyItem",
    "ClaimQuest",
    "EquipPet",
    "Inventory",
    "SystemMessage"
}

for _, remoteName in ipairs(defaultRemotes) do

    local remote = Instance.new("RemoteEvent")

    remote.Name = remoteName
    remote.Parent = remotesFolder
end

for _, remoteData in ipairs(PROJECT.remotes or {}) do

    local name

    if typeof(remoteData) == "string" then
        name = remoteData
    else
        name =
            remoteData.name
            or remoteData.nome
    end

    if name and not remotesFolder:FindFirstChild(name) then

        local remote = Instance.new("RemoteEvent")

        remote.Name = name
        remote.Parent = remotesFolder
    end
end

--------------------------------------------------
-- CONFIGURAÇÃO
--------------------------------------------------

local config = Instance.new("Configuration")

config.Name = "GameConfig"

config:SetAttribute(
    "GameName",
    PROJECT.title or "Roblox AI Game"
)

config:SetAttribute(
    "Genre",
    PROJECT.genre or "Aventura"
)

config:SetAttribute(
    "Objective",
    PROJECT.objective or ""
)

config:SetAttribute(
    "Players",
    PROJECT.players or 10
)

config.Parent = aiFolder

--------------------------------------------------
-- INFORMAÇÕES DO PROJETO
--------------------------------------------------

local infoFolder = folder(
    aiFolder,
    "ProjectInfo"
)

for i, quest in ipairs(PROJECT.quests or {}) do

    local name

    if typeof(quest) == "string" then
        name = quest
    else
        name =
            quest.name
            or quest.nome
            or ("Quest_" .. i)
    end

    stringValue(
        infoFolder,
        "Quest_" .. i,
        name
    )
end

for i, item in ipairs(PROJECT.items or {}) do

    local name

    if typeof(item) == "string" then
        name = item
    else
        name =
            item.name
            or item.nome
            or ("Item_" .. i)
    end

    stringValue(
        infoFolder,
        "Item_" .. i,
        name
    )
end

for i, pet in ipairs(PROJECT.pets or {}) do

    local name

    if typeof(pet) == "string" then
        name = pet
    else
        name =
            pet.name
            or pet.nome
            or ("Pet_" .. i)
    end

    stringValue(
        infoFolder,
        "Pet_" .. i,
        name
    )
end

--------------------------------------------------
-- LIGHTING
--------------------------------------------------

Lighting.ClockTime = 14
Lighting.Brightness = 2

--------------------------------------------------
-- FINAL
--------------------------------------------------

print("--------------------------------")
print("ROBLOX AI STUDIO")
print("Jogo criado:", PROJECT.title)
print("Áreas:", #PROJECT.areas)
print("Objetos:", #PROJECT.objects)
print("NPCs:", #PROJECT.npcs)
print("Sistemas:", #PROJECT.systems)
print("Quests:", #PROJECT.quests)
print("Itens:", #PROJECT.items)
print("Pets:", #PROJECT.pets)
print("--------------------------------")

print("✅ Builder concluído!")
`;
}

async function chamarGemini(prompt) {

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada no Vercel."
    );
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODELO +
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
      temperature: 0.7,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      "Gemini HTTP " +
      response.status +
      ": " +
      text
    );
  }

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "Resposta inválida da Gemini."
    );
  }

  const result =
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  if (!result) {
    throw new Error(
      "Gemini não retornou conteúdo."
    );
  }

  return result;
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {

    return resposta(
      res,
      405,
      {
        erro: "Método não permitido."
      }
    );
  }

  try {

    const body = req.body || {};

    const ideia =
      String(body.ideia || "").trim();

    if (!ideia) {

      return resposta(
        res,
        400,
        {
          erro: "Digite uma ideia para o jogo."
        }
      );
    }

    const prompt = `
Você é uma IA especialista em criação de jogos para Roblox.

Sua tarefa é transformar a ideia abaixo em um projeto de jogo completo e organizado.

IDEIA DO USUÁRIO:
${ideia}

Retorne SOMENTE JSON válido.

Use exatamente esta estrutura:

{
  "title": "Nome do jogo",
  "genre": "Gênero",
  "objective": "Objetivo principal",
  "difficulty": "Fácil, Médio ou Difícil",
  "players": 10,

  "areas": [
    {
      "name": "Nome da área",
      "description": "Descrição"
    }
  ],

  "objects": [
    {
      "name": "Nome do objeto",
      "type": "Structure",
      "description": "Descrição"
    }
  ],

  "npcs": [
    {
      "name": "Nome do NPC",
      "type": "Enemy",
      "hp": 100,
      "description": "Descrição"
    }
  ],

  "systems": [
    {
      "name": "Nome do sistema",
      "description": "Como funciona"
    }
  ],

  "quests": [
    {
      "name": "Nome da missão",
      "description": "Objetivo",
      "reward": 100
    }
  ],

  "items": [
    {
      "name": "Nome do item",
      "rarity": "Common",
      "description": "Descrição"
    }
  ],

  "shops": [
    {
      "name": "Nome da loja",
      "items": ["Item 1", "Item 2"]
    }
  ],

  "pets": [
    {
      "name": "Nome do pet",
      "ability": "Habilidade"
    }
  ],

  "remotes": [
    {
      "name": "NomeDoRemote",
      "description": "Função"
    }
  ],

  "scripts": [],

  "next_upgrades": [
    "Melhoria futura 1",
    "Melhoria futura 2",
    "Melhoria futura 3"
  ]
}

REGRAS:

1. Crie entre 3 e 8 áreas.
2. Crie entre 5 e 15 objetos.
3. Crie entre 3 e 10 NPCs.
4. Crie sistemas coerentes com o gênero.
5. Crie pelo menos 3 missões.
6. Crie pelo menos 5 itens.
7. Crie pelo menos 1 loja quando fizer sentido.
8. Crie pets quando fizer sentido.
9. Crie RemoteEvents relacionados aos sistemas.
10. Não coloque código Lua dentro do JSON.
11. Não escreva explicações fora do JSON.
12. Tudo deve estar relacionado à ideia do usuário.
13. O jogo deve ser possível de implementar no Roblox Studio.
`;

    const raw = await chamarGemini(prompt);

    let projeto;

    try {

      projeto = JSON.parse(raw);

    } catch {

      const inicio = raw.indexOf("{");
      const fim = raw.lastIndexOf("}");

      if (
        inicio === -1 ||
        fim === -1 ||
        fim <= inicio
      ) {
        throw new Error(
          "A Gemini retornou JSON inválido."
        );
      }

      projeto = JSON.parse(
        raw.substring(
          inicio,
          fim + 1
        )
      );
    }

    projeto = limparProjeto(projeto);

    projeto.builder_script =
      gerarBuilder(projeto);

    projeto.generated_by =
      "Roblox AI Studio";

    return resposta(
      res,
      200,
      {
        sucesso: true,
        projeto
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
          "Não foi possível gerar o jogo.",
        detalhe:
          error.message
      }
    );
  }
};
