module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  try {
    const { ideia, modo = "jogo_completo" } = req.body || {};

    if (!ideia || typeof ideia !== "string") {
      return res.status(400).json({
        error: "Digite uma ideia para o jogo."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada na Vercel."
      });
    }

    const prompt = `
Você é um desenvolvedor SENIOR de Roblox Studio especializado em Luau.

Transforme a ideia abaixo em um projeto completo e organizado de Roblox.

MODO:
${modo}

IDEIA:
${ideia.trim().slice(0, 8000)}

REGRAS:

- Responda SOMENTE JSON válido.
- Não use Markdown.
- Não use blocos de código.
- Use Luau válido.
- Use somente APIs reais do Roblox.
- Não use require de IDs externos.
- Não use exploits.
- Não use executores.
- Não use código externo.
- Não use URLs externas.
- Não dependa de plugins.
- Não dependa de assets externos.

O projeto será construído por um Builder automático.

O Builder deve conseguir construir o máximo possível do mapa usando Instance.new.

========================================
ESTRUTURA
========================================

Retorne:

{
  "game_name": "",
  "description": "",
  "genre": "",
  "objective": "",
  "difficulty": "",
  "estimated_players": "",

  "map": {
    "description": "",
    "areas": []
  },

  "objects": [],

  "npcs": [],

  "systems": [],

  "quests": [],

  "items": [],

  "shops": [],

  "pets": [],

  "recommended_remotes": [],

  "scripts": [],

  "steps": [],

  "future_upgrades": []
}

========================================
ÁREAS
========================================

Cada área:

{
  "name": "",
  "description": "",
  "type": "",
  "position": [0,0,0],
  "size": [100,20,100]
}

Tipos:

Spawn
Town
Shop
Combat
Boss
Forest
Dungeon
Secret
Other

========================================
OBJETOS
========================================

Cada objeto:

{
  "name": "",
  "type": "Part",
  "description": "",
  "position": [0,5,0],
  "size": [10,1,10],
  "material": "Grass",
  "anchored": true,
  "can_collide": true,
  "transparency": 0,
  "color": [1,1,1],
  "shape": "Block"
}

Use materiais Roblox reais.

========================================
NPCS
========================================

Cada NPC:

{
  "name": "",
  "type": "Enemy",
  "health": 100,
  "damage": 10,
  "speed": 16,
  "position": [0,5,0],
  "description": "",
  "behavior": ""
}

Tipos:

Enemy
Boss
Shopkeeper
QuestGiver
Friendly

========================================
SISTEMAS
========================================

Crie sistemas necessários para a ideia.

Exemplos:

Economy
Combat
Quest
Inventory
Pets
XP
Levels
Shop
Data
DayNight
Respawn
Teleport
Boss
EnemyAI
Rewards
Leaderboard

Cada sistema:

{
  "name": "",
  "description": "",
  "priority": "High"
}

========================================
REMOTES
========================================

Quando necessário:

{
  "name": "",
  "type": "RemoteEvent",
  "description": ""
}

========================================
SCRIPTS
========================================

Crie scripts completos somente quando forem necessários.

Formato:

{
  "name": "",
  "location": "ServerScriptService",
  "type": "Script",
  "description": "",
  "code": ""
}

Locais válidos:

ServerScriptService
ServerStorage
ReplicatedStorage
StarterGui
StarterPlayerScripts
Workspace

Tipos:

Script
LocalScript
ModuleScript

========================================
MISSÕES
========================================

{
  "name": "",
  "description": "",
  "objective": "",
  "reward": ""
}

========================================
ITENS
========================================

{
  "name": "",
  "type": "Tool",
  "description": "",
  "price": 100
}

========================================
LOJAS
========================================

{
  "name": "",
  "description": "",
  "items": []
}

========================================
PETS
========================================

{
  "name": "",
  "rarity": "Common",
  "description": "",
  "bonus": ""
}

========================================
BUILDER

O Builder final será montado pelo servidor.

Ele deve ser capaz de criar:

Workspace
GeneratedMap
Areas
Objects
NPCs
Spawns

ReplicatedStorage
RobloxAI
Remotes
Modules

ServerScriptService
RobloxAI
Systems
Scripts

O Builder não deve utilizar assets externos.

Para NPCs, crie modelos básicos usando Parts, Humanoid e HumanoidRootPart.

Use Attributes para armazenar:

Health
Damage
Speed
NPCType
Behavior

O projeto deve ser organizado.

========================================

Não gere milhares de objetos.

Priorize qualidade.

Agora gere o JSON.
`;

    const modelos = [
      "gemini-3.6-flash",
      "gemini-3.6-flash-lite"
    ];

    let ultimoErro = null;

    for (const modelo of modelos) {
      for (let tentativa = 1; tentativa <= 3; tentativa++) {

        try {
          const resposta = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt
                      }
                    ]
                  }
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.6
                }
              })
            }
          );

          const dados = await resposta.json();

          if (resposta.ok) {

            const texto =
              dados?.candidates?.[0]
                ?.content
                ?.parts?.[0]
                ?.text;

            if (!texto) {
              ultimoErro = "A Gemini não retornou conteúdo.";
              continue;
            }

            let projeto;

            try {
              projeto = JSON.parse(texto);
            } catch {
              ultimoErro = "A Gemini retornou JSON inválido.";
              continue;
            }

            normalizarProjeto(projeto);

            projeto.builder_script = {
              name: "CompleteBuilder",
              description:
                "Builder automático criado pela Roblox AI Studio.",
              code:
                gerarBuilder(projeto)
            };

            return res.status(200).json(projeto);
          }

          const mensagem =
            dados?.error?.message ||
            "Erro desconhecido na Gemini.";

          ultimoErro = mensagem;

          if ([400, 401, 403].includes(resposta.status)) {
            return res.status(500).json({
              error: "Erro na configuração da Gemini.",
              details: mensagem
            });
          }

          if (resposta.status === 404) {
            break;
          }

          if (
            [429, 500, 502, 503, 504].includes(resposta.status) ||
            /overloaded|high demand|temporarily/i.test(mensagem)
          ) {
            await esperar(tentativa * 2000);
            continue;
          }

          break;

        } catch (erro) {
          ultimoErro = erro.message;
          await esperar(tentativa * 2000);
        }
      }
    }

    return res.status(503).json({
      error: "A IA está temporariamente ocupada.",
      details:
        ultimoErro ||
        "Tente novamente em alguns segundos."
    });

  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: erro.message
    });
  }
};


function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function normalizarProjeto(p) {

  p.game_name =
    p.game_name ||
    "Meu Jogo Roblox";

  p.description =
    p.description ||
    "Projeto criado pela Roblox AI Studio.";

  p.genre =
    p.genre ||
    "Adventure";

  p.objective =
    p.objective ||
    "Complete o objetivo do jogo.";

  p.map =
    p.map || {};

  p.map.description =
    p.map.description ||
    "Mapa gerado pela IA.";

  const arrays = [
    "areas",
    "objects",
    "npcs",
    "systems",
    "quests",
    "items",
    "shops",
    "pets",
    "recommended_remotes",
    "scripts",
    "steps",
    "future_upgrades"
  ];

  for (const nome of arrays) {
    if (!Array.isArray(p[nome])) {
      p[nome] = [];
    }
  }

  if (!Array.isArray(p.map.areas)) {
    p.map.areas = [];
  }

  p.objects = p.objects.slice(0, 250);
  p.npcs = p.npcs.slice(0, 40);
  p.scripts = p.scripts.slice(0, 40);
  p.recommended_remotes =
    p.recommended_remotes.slice(0, 40);
}


function gerarBuilder(p) {

  const json = JSON.stringify({
    game_name: p.game_name,
    map: p.map,
    objects: p.objects,
    npcs: p.npcs,
    recommended_remotes:
      p.recommended_remotes
  });

  return `--[[

ROBLOX AI STUDIO
COMPLETE BUILDER

Jogo:
${p.game_name}

Este script constrói automaticamente:
- Mapa
- Áreas
- Objetos
- Spawns
- NPCs
- Remotes
- Estrutura do projeto

]]


local Workspace = game:GetService("Workspace")
local ReplicatedStorage =
    game:GetService("ReplicatedStorage")


local DATA = ${json}


--------------------------------------------------
-- UTILIDADES
--------------------------------------------------

local function getOrCreate(parent, className, name)

    local existing =
        parent:FindFirstChild(name)

    if existing then
        return existing
    end

    local object =
        Instance.new(className)

    object.Name = name
    object.Parent = parent

    return object
end


local function createFolder(parent, name)

    return getOrCreate(
        parent,
        "Folder",
        name
    )

end


local function createPart(
    parent,
    name,
    position,
    size,
    material,
    anchored,
    canCollide,
    transparency
)

    local part =
        Instance.new("Part")

    part.Name = name

    part.Size =
        Vector3.new(
            tonumber(size[1]) or 10,
            tonumber(size[2]) or 1,
            tonumber(size[3]) or 10
        )

    part.Position =
        Vector3.new(
            tonumber(position[1]) or 0,
            tonumber(position[2]) or 5,
            tonumber(position[3]) or 0
        )

    part.Anchored =
        anchored ~= false

    part.CanCollide =
        canCollide ~= false

    part.Transparency =
        tonumber(transparency) or 0

    part.Material =
        Enum.Material[
            tostring(material or "Plastic")
        ] or Enum.Material.Plastic

    part.TopSurface =
        Enum.SurfaceType.Smooth

    part.BottomSurface =
        Enum.SurfaceType.Smooth

    part.Parent = parent

    return part
end


local function createNPC(parent, data)

    local model =
        Instance.new("Model")

    model.Name =
        tostring(data.name or "NPC")

    model.Parent = parent


    local root =
        Instance.new("Part")

    root.Name =
        "HumanoidRootPart"

    root.Size =
        Vector3.new(2, 2, 1)

    root.Position =
        Vector3.new(
            tonumber(data.position and data.position[1]) or 0,
            tonumber(data.position and data.position[2]) or 5,
            tonumber(data.position and data.position[3]) or 0
        )

    root.Transparency = 1
    root.CanCollide = false
    root.Anchored = false
    root.Parent = model


    local body =
        Instance.new("Part")

    body.Name = "Body"

    body.Size =
        Vector3.new(2, 3, 1)

    body.Position =
        root.Position +
        Vector3.new(0, 1.5, 0)

    body.Anchored = false

    body.Parent = model


    local head =
        Instance.new("Part")

    head.Name = "Head"

    head.Shape =
        Enum.PartType.Ball

    head.Size =
        Vector3.new(2, 2, 2)

    head.Position =
        root.Position +
        Vector3.new(0, 3.8, 0)

    head.Anchored = false

    head.Parent = model


    local humanoid =
        Instance.new("Humanoid")

    humanoid.Name =
        "Humanoid"

    humanoid.MaxHealth =
        tonumber(data.health) or 100

    humanoid.Health =
        humanoid.MaxHealth

    humanoid.WalkSpeed =
        tonumber(data.speed) or 16

    humanoid.Parent = model


    local weld1 =
        Instance.new("WeldConstraint")

    weld1.Part0 = root
    weld1.Part1 = body
    weld1.Parent = root


    local weld2 =
        Instance.new("WeldConstraint")

    weld2.Part0 = root
    weld2.Part1 = head
    weld2.Parent = root


    model.PrimaryPart = root


    model:SetAttribute(
        "NPCType",
        tostring(data.type or "Enemy")
    )

    model:SetAttribute(
        "Damage",
        tonumber(data.damage) or 10
    )

    model:SetAttribute(
        "MaxHealth",
        tonumber(data.health) or 100
    )

    model:SetAttribute(
        "Speed",
        tonumber(data.speed) or 16
    )

    model:SetAttribute(
        "Behavior",
        tostring(data.behavior or "")
    )


    return model
end


--------------------------------------------------
-- LIMPEZA / ESTRUTURA
--------------------------------------------------

local old =
    Workspace:FindFirstChild("GeneratedMap")

if old then
    old:Destroy()
end


local generated =
    Instance.new("Folder")

generated.Name =
    "GeneratedMap"

generated.Parent =
    Workspace


local areasFolder =
    createFolder(
        generated,
        "Areas"
    )


local objectsFolder =
    createFolder(
        generated,
        "Objects"
    )


local npcsFolder =
    createFolder(
        generated,
        "NPCs"
    )


local spawnsFolder =
    createFolder(
        generated,
        "Spawns"
    )


--------------------------------------------------
-- REPLICATED STORAGE
--------------------------------------------------

local aiFolder =
    getOrCreate(
        ReplicatedStorage,
        "Folder",
        "RobloxAI"
    )


local remotesFolder =
    getOrCreate(
        aiFolder,
        "Folder",
        "Remotes"
    )


--------------------------------------------------
-- REMOTES
--------------------------------------------------

for _, remoteData in
    ipairs(DATA.recommended_remotes or {}) do

    local remoteType =
        tostring(
            remoteData.type or
            "RemoteEvent"
        )

    if remoteType ~= "RemoteEvent"
        and remoteType ~= "RemoteFunction" then

        remoteType = "RemoteEvent"

    end

    local remote =
        remotesFolder:
            FindFirstChild(
                tostring(
                    remoteData.name or
                    "Remote"
                )
            )

    if not remote then

        remote =
            Instance.new(remoteType)

        remote.Name =
            tostring(
                remoteData.name or
                "Remote"
            )

        remote.Parent =
            remotesFolder

    end

end


--------------------------------------------------
-- ÁREAS
--------------------------------------------------

for index, area in
    ipairs(DATA.map.areas or {}) do

    local model =
        Instance.new("Model")

    model.Name =
        tostring(
            area.name or
            ("Area_" .. index)
        )

    model.Parent =
        areasFolder


    local position =
        area.position or
        {0, 0, 0}

    local size =
        area.size or
        {100, 20, 100}


    local marker =
        createPart(
            model,
            "Area",
            position,
            size,
            "Grass",
            true,
            false,
            0.85
        )


    marker:SetAttribute(
        "AreaType",
        tostring(
            area.type or
            "Other"
        )
    )

    marker:SetAttribute(
        "Description",
        tostring(
            area.description or
            ""
        )
    )

end


--------------------------------------------------
-- OBJETOS
--------------------------------------------------

for index, data in
    ipairs(DATA.objects or {}) do

    local position =
        data.position or
        {0, 5, 0}

    local size =
        data.size or
        {10, 1, 10}


    local part =
        createPart(
            objectsFolder,
            tostring(
                data.name or
                ("Object_" .. index)
            ),
            position,
            size,
            tostring(
                data.material or
                "Plastic"
            ),
            data.anchored,
            data.can_collide,
            data.transparency
        )


    part:SetAttribute(
        "Description",
        tostring(
            data.description or
            ""
        )
    )


    part:SetAttribute(
        "GeneratedBy",
        "Roblox AI Studio"
    )

end


--------------------------------------------------
-- SPAWN
--------------------------------------------------

local spawn =
    Instance.new("SpawnLocation")

spawn.Name =
    "GeneratedSpawn"

spawn.Size =
    Vector3.new(6, 1, 6)

spawn.Position =
    Vector3.new(0, 5, 0)

spawn.Anchored = true

spawn.Neutral = true

spawn.Parent =
    spawnsFolder


--------------------------------------------------
-- NPCS
--------------------------------------------------

for _, npcData in
    ipairs(DATA.npcs or {}) do

    createNPC(
        npcsFolder,
        npcData
    )

end


--------------------------------------------------
-- ILUMINAÇÃO BÁSICA
--------------------------------------------------

local Lighting =
    game:GetService("Lighting")


Lighting.ClockTime = 14

Lighting.Brightness = 2

Lighting.GlobalShadows = true


--------------------------------------------------
-- FINALIZAÇÃO
--------------------------------------------------

print(
    "===================================="
)

print(
    "ROBLOX AI STUDIO"
)

print(
    "Projeto construído:"
)

print(
    DATA.game_name
)

print(
    "Objetos:",
    #(DATA.objects or {})
)

print(
    "NPCs:",
    #(DATA.npcs or {})
)

print(
    "Áreas:",
    #(DATA.map.areas or {})
)

print(
    "Remotes:",
    #(DATA.recommended_remotes or {})
)

print(
    "===================================="
)

`;
}
