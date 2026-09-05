// api/criar-jogo.js

const MODELOS = [
  "gemini-3.6-flash",
  "gemini-3.6-flash-lite"
];

const MAX_TENTATIVAS = 3;

function dormir(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function limparMarkdown(texto) {
  if (!texto) return "";

  return texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extrairJSON(texto) {
  let limpo = limparMarkdown(texto);

  try {
    return JSON.parse(limpo);
  } catch (_) {}

  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");

  if (inicio !== -1 && fim !== -1 && fim > inicio) {
    try {
      return JSON.parse(limpo.slice(inicio, fim + 1));
    } catch (_) {}
  }

  throw new Error("A IA não retornou um JSON válido.");
}

function arraySeguro(valor) {
  return Array.isArray(valor) ? valor : [];
}

function textoSeguro(valor, padrao = "") {
  return typeof valor === "string" ? valor : padrao;
}

function normalizarProjeto(p) {
  p = p || {};

  return {
    game_name: textoSeguro(p.game_name, "Meu Jogo Roblox"),
    description: textoSeguro(p.description, "Jogo criado pelo Roblox AI Studio."),
    genre: textoSeguro(p.genre, "Aventura"),
    objective: textoSeguro(p.objective, "Explore o mapa e complete os objetivos."),
    difficulty: textoSeguro(p.difficulty, "Médio"),
    estimated_players: p.estimated_players || 10,

    map: {
      description: textoSeguro(
        p.map?.description,
        "Mapa criado automaticamente."
      ),
      areas: arraySeguro(p.map?.areas).slice(0, 100)
    },

    objects: arraySeguro(p.objects).slice(0, 300),
    npcs: arraySeguro(p.npcs).slice(0, 60),
    systems: arraySeguro(p.systems).slice(0, 80),
    quests: arraySeguro(p.quests).slice(0, 80),
    items: arraySeguro(p.items).slice(0, 120),
    shops: arraySeguro(p.shops).slice(0, 40),
    pets: arraySeguro(p.pets).slice(0, 80),
    recommended_remotes: arraySeguro(p.recommended_remotes).slice(0, 60),
    scripts: arraySeguro(p.scripts).slice(0, 80),
    steps: arraySeguro(p.steps).slice(0, 100),
    future_upgrades: arraySeguro(p.future_upgrades).slice(0, 100)
  };
}

function gerarBuilder(p) {
  const projetoJSON = JSON.stringify(p)
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");

  return `--========================================================
-- ROBLOX AI STUDIO
-- COMPLETE BUILDER
-- Gerado automaticamente
--========================================================

local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local Lighting = game:GetService("Lighting")

local PROJECT_JSON = [[
${JSON.stringify(p, null, 2)}
]]

local Project

local success, decoded = pcall(function()
	return game:GetService("HttpService"):JSONDecode(PROJECT_JSON)
end)

if success then
	Project = decoded
else
	warn("Roblox AI Studio: não foi possível ler o projeto.")
	return
end

--========================================================
-- UTILIDADES
--========================================================

local function getOrCreateFolder(parent, name)
	local existing = parent:FindFirstChild(name)

	if existing and existing:IsA("Folder") then
		return existing
	end

	local folder = Instance.new("Folder")
	folder.Name = name
	folder.Parent = parent

	return folder
end

local function createPart(parent, data, index)
	local part = Instance.new("Part")

	part.Name = tostring(data.name or ("Object_" .. index))
	part.Anchored = true
	part.CanCollide = data.can_collide ~= false

	local size = data.size or {
		x = 6,
		y = 2,
		z = 6
	}

	part.Size = Vector3.new(
		tonumber(size.x) or 6,
		tonumber(size.y) or 2,
		tonumber(size.z) or 6
	)

	local position = data.position or {
		x = 0,
		y = 1,
		z = 0
	}

	part.Position = Vector3.new(
		tonumber(position.x) or 0,
		tonumber(position.y) or 1,
		tonumber(position.z) or 0
	)

	local material = tostring(data.material or "Plastic")

	local ok, enumMaterial = pcall(function()
		return Enum.Material[material]
	end)

	if ok and enumMaterial then
		part.Material = enumMaterial
	end

	if data.transparency then
		part.Transparency = tonumber(data.transparency) or 0
	end

	part:SetAttribute("GeneratedBy", "RobloxAIStudio")

	if data.category then
		part:SetAttribute("Category", tostring(data.category))
	end

	part.Parent = parent

	return part
end

local function createArea(parent, area, index)
	local model = Instance.new("Model")
	model.Name = tostring(area.name or ("Area_" .. index))
	model:SetAttribute(
		"Description",
		tostring(area.description or "")
	)

	model.Parent = parent

	local marker = Instance.new("Part")
	marker.Name = "AreaMarker"
	marker.Anchored = true
	marker.CanCollide = false
	marker.Transparency = 1
	marker.Size = Vector3.new(20, 1, 20)
	marker.Position = Vector3.new(
		(index - 1) * 35,
		0,
		0
	)
	marker.Parent = model

	return model
end

local function createNPC(parent, npc, index)
	local model = Instance.new("Model")
	model.Name = tostring(npc.name or ("NPC_" .. index))

	model:SetAttribute(
		"NPCType",
		tostring(npc.type or "Enemy")
	)

	model:SetAttribute(
		"GeneratedBy",
		"RobloxAIStudio"
	)

	local root = Instance.new("Part")
	root.Name = "HumanoidRootPart"
	root.Size = Vector3.new(2, 2, 1)
	root.Transparency = 1
	root.CanCollide = false
	root.Anchored = false
	root.Position = Vector3.new(
		(index - 1) * 8,
		4,
		20
	)
	root.Parent = model

	local body = Instance.new("Part")
	body.Name = "Body"
	body.Size = Vector3.new(2, 3, 1)
	body.Position = root.Position + Vector3.new(0, 1.5, 0)
	body.Parent = model

	local head = Instance.new("Part")
	head.Name = "Head"
	head.Shape = Enum.PartType.Ball
	head.Size = Vector3.new(2, 2, 2)
	head.Position = root.Position + Vector3.new(0, 3.5, 0)
	head.Parent = model

	local humanoid = Instance.new("Humanoid")
	humanoid.Name = "Humanoid"

	humanoid.MaxHealth =
		tonumber(npc.health)
		or 100

	humanoid.Health = humanoid.MaxHealth

	humanoid.WalkSpeed =
		tonumber(npc.walk_speed)
		or 12

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

	model.Parent = parent

	return model
end

--========================================================
-- LIMPAR PROJETO ANTERIOR
--========================================================

local old = Workspace:FindFirstChild("GeneratedMap")

if old then
	old:Destroy()
end

local oldAI = ReplicatedStorage:FindFirstChild("RobloxAI")

if oldAI then
	oldAI:Destroy()
end

--========================================================
-- WORKSPACE
--========================================================

local generatedMap = Instance.new("Folder")
generatedMap.Name = "GeneratedMap"
generatedMap.Parent = Workspace

local areasFolder = getOrCreateFolder(
	generatedMap,
	"Areas"
)

local objectsFolder = getOrCreateFolder(
	generatedMap,
	"Objects"
)

local npcsFolder = getOrCreateFolder(
	generatedMap,
	"NPCs"
)

local spawnsFolder = getOrCreateFolder(
	generatedMap,
	"Spawns"
)

--========================================================
-- ÁREAS
--========================================================

for i, area in ipairs(Project.map.areas) do
	createArea(
		areasFolder,
		area,
		i
	)
end

--========================================================
-- OBJETOS
--========================================================

for i, object in ipairs(Project.objects) do
	createPart(
		objectsFolder,
		object,
		i
	)
end

--========================================================
-- SPAWN
--========================================================

local spawn = Instance.new("SpawnLocation")

spawn.Name = "PlayerSpawn"
spawn.Anchored = true
spawn.Size = Vector3.new(8, 1, 8)
spawn.Position = Vector3.new(0, 2, -15)
spawn.Neutral = true
spawn.Parent = spawnsFolder

--========================================================
-- NPCS
--========================================================

for i, npc in ipairs(Project.npcs) do
	createNPC(
		npcsFolder,
		npc,
		i
	)
end

--========================================================
-- ROBLOX AI
--========================================================

local aiFolder = Instance.new("Folder")
aiFolder.Name = "RobloxAI"
aiFolder.Parent = ReplicatedStorage

local remotesFolder = Instance.new("Folder")
remotesFolder.Name = "Remotes"
remotesFolder.Parent = aiFolder

for i, remote in ipairs(Project.recommended_remotes) do
	local name = tostring(
		remote.name or
		remote or
		("Remote_" .. i)
	)

	if not remotesFolder:FindFirstChild(name) then
		local event = Instance.new("RemoteEvent")
		event.Name = name
		event.Parent = remotesFolder
	end
end

local modulesFolder = Instance.new("Folder")
modulesFolder.Name = "Modules"
modulesFolder.Parent = aiFolder

--========================================================
-- CONFIGURAÇÕES
--========================================================

local config = Instance.new("Configuration")
config.Name = "GameConfig"

config:SetAttribute(
	"GameName",
	tostring(Project.game_name)
)

config:SetAttribute(
	"Genre",
	tostring(Project.genre)
)

config:SetAttribute(
	"Difficulty",
	tostring(Project.difficulty)
)

config.Parent = aiFolder

--========================================================
-- LIGHTING
--========================================================

Lighting.ClockTime = 14

Lighting:SetAttribute(
	"GeneratedBy",
	"RobloxAIStudio"
)

--========================================================
-- FINAL
--========================================================

print("==========================================")
print(" ROBLOX AI STUDIO")
print(" Projeto criado: " .. tostring(Project.game_name))
print(" Áreas: " .. tostring(#Project.map.areas))
print(" Objetos: " .. tostring(#Project.objects))
print(" NPCs: " .. tostring(#Project.npcs))
print(" Sistemas: " .. tostring(#Project.systems))
print(" Quests: " .. tostring(#Project.quests))
print(" Itens: " .. tostring(#Project.items))
print(" Pets: " .. tostring(#Project.pets))
print("==========================================")
`;
}

function gerarScripts(p) {
  const linhas = [];

  linhas.push("--==================================================");
  linhas.push("-- ROBLOX AI STUDIO - SCRIPTS GERADOS");
  linhas.push("--==================================================");
  linhas.push("");

  for (const script of p.scripts) {
    const nome = script.name || "GeneratedScript";
    const tipo = script.type || "ServerScript";

    linhas.push("--==================================================");
    linhas.push("-- " + nome);
    linhas.push("-- Tipo: " + tipo);
    linhas.push("--==================================================");
    linhas.push(
      typeof script.code === "string"
        ? script.code
        : "-- Código não informado pela IA."
    );
    linhas.push("");
  }

  if (linhas.length <= 6) {
    linhas.push("-- Nenhum script específico foi retornado.");
    linhas.push("-- Use o Builder e crie os sistemas necessários no Roblox Studio.");
  }

  return linhas.join("\n");
}

function criarPrompt(ideia, modo, acao, projetoAtual) {
  const contextoAtual = projetoAtual
    ? JSON.stringify(projetoAtual, null, 2)
    : "NENHUM PROJETO EXISTENTE";

  let objetivo = `
Crie um jogo completo para Roblox baseado na ideia abaixo.

IDEIA:
${ideia}
`;

  if (acao) {
    objetivo = `
Você está EDITANDO um projeto Roblox existente.

AÇÃO SOLICITADA:
${acao}

INSTRUÇÕES:
- Preserve tudo que já existe.
- Não remova sistemas existentes sem necessidade.
- Adicione a nova funcionalidade.
- Melhore o projeto onde for necessário.
- Atualize objetos, NPCs, remotes, scripts, quests, itens, lojas e pets quando fizer sentido.
- Retorne o PROJETO COMPLETO ATUALIZADO, não apenas a alteração.

PROJETO ATUAL:
${contextoAtual}
`;
  }

  return `
Você é um desenvolvedor especialista em Roblox Studio, Luau,
level design, sistemas multiplayer, NPCs e arquitetura de jogos.

${objetivo}

MODO:
${modo}

IMPORTANTE:
Retorne SOMENTE JSON válido.
Não use Markdown.
Não coloque \`\`\`.
Não escreva explicações fora do JSON.

Formato obrigatório:

{
  "game_name": "Nome",
  "description": "Descrição",
  "genre": "Gênero",
  "objective": "Objetivo",
  "difficulty": "Fácil/Médio/Difícil",
  "estimated_players": 10,

  "map": {
    "description": "Descrição detalhada",
    "areas": [
      {
        "name": "Nome da área",
        "description": "Descrição",
        "type": "Island/City/Dungeon/etc"
      }
    ]
  },

  "objects": [
    {
      "name": "Nome",
      "category": "House/Tree/Weapon/etc",
      "description": "Descrição",
      "size": {
        "x": 6,
        "y": 4,
        "z": 6
      },
      "position": {
        "x": 0,
        "y": 2,
        "z": 0
      },
      "material": "Wood",
      "can_collide": true
    }
  ],

  "npcs": [
    {
      "name": "Nome",
      "type": "Enemy/NPC/Boss",
      "description": "Descrição",
      "health": 100,
      "walk_speed": 12,
      "damage": 10,
      "drops": ["Coin"]
    }
  ],

  "systems": [
    {
      "name": "Sistema",
      "description": "Como funciona",
      "priority": "high"
    }
  ],

  "quests": [
    {
      "name": "Quest",
      "description": "Objetivo",
      "reward": "100 Coins"
    }
  ],

  "items": [
    {
      "name": "Item",
      "type": "Weapon/Consumable/Material",
      "description": "Descrição",
      "rarity": "Common"
    }
  ],

  "shops": [
    {
      "name": "Loja",
      "items": ["Item 1", "Item 2"],
      "currency": "Coins"
    }
  ],

  "pets": [
    {
      "name": "Pet",
      "rarity": "Common",
      "ability": "Descrição"
    }
  ],

  "recommended_remotes": [
    {
      "name": "RemoteName",
      "purpose": "Para que serve"
    }
  ],

  "scripts": [
    {
      "name": "NomeDoScript",
      "type": "ServerScript",
      "purpose": "Função",
      "code": "código Luau completo"
    }
  ],

  "steps": [
    "Passo 1",
    "Passo 2"
  ],

  "future_upgrades": [
    "Upgrade 1",
    "Upgrade 2"
  ]
}

REGRAS PARA OS SCRIPTS:
- Use Luau válido.
- Não use código malicioso.
- Scripts devem ser compatíveis com Roblox Studio.
- Use ServerScriptService para lógica do servidor.
- Use ReplicatedStorage para RemoteEvents/Modules.
- Não coloque API keys no código.
- Não dependa de serviços externos sem necessidade.
- Os scripts devem ser o mais completos possível.

Se for uma atualização:
- mantenha os dados existentes;
- acrescente a funcionalidade;
- evite duplicações;
- corrija scripts quando solicitado;
- retorne todas as partes do projeto novamente.
`;
}

async function chamarGemini(apiKey, prompt) {
  let ultimoErro = null;

  for (const modelo of MODELOS) {
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      try {
        const url =
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          modelo +
          ":generateContent?key=" +
          encodeURIComponent(apiKey);

        const resposta = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
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
              temperature: 0.7,
              responseMimeType: "application/json"
            }
          })
        });

        const textoResposta = await resposta.text();

        if (!resposta.ok) {
          let mensagem = textoResposta;

          try {
            const erroJSON = JSON.parse(textoResposta);
            mensagem =
              erroJSON?.error?.message ||
              textoResposta;
          } catch (_) {}

          if (
            resposta.status === 404 &&
            modelo === MODELOS[0]
          ) {
            ultimoErro = new Error(mensagem);
            break;
          }

          if (
            resposta.status === 429 ||
            resposta.status >= 500
          ) {
            ultimoErro = new Error(mensagem);
            await dormir(1000 * tentativa);
            continue;
          }

          throw new Error(mensagem);
        }

        const dados = JSON.parse(textoResposta);

        const texto =
          dados?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("") || "";

        if (!texto) {
          throw new Error(
            "Gemini não retornou conteúdo."
          );
        }

        return extrairJSON(texto);

      } catch (erro) {
        ultimoErro = erro;

        if (tentativa < MAX_TENTATIVAS) {
          await dormir(700 * tentativa);
        }
      }
    }
  }

  throw ultimoErro || new Error(
    "Não foi possível chamar a IA."
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      erro: "Use POST."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        sucesso: false,
        erro: "GEMINI_API_KEY não está configurada na Vercel."
      });
    }

    const body = req.body || {};

    const ideia =
      typeof body.ideia === "string"
        ? body.ideia.trim()
        : "";

    const modo =
      typeof body.modo === "string"
        ? body.modo
        : "jogo_completo";

    const acao =
      typeof body.acao === "string"
        ? body.acao.trim()
        : "";

    const projetoAtual =
      body.projeto && typeof body.projeto === "object"
        ? body.projeto
        : null;

    if (!ideia && !acao) {
      return res.status(400).json({
        sucesso: false,
        erro: "Digite uma ideia para o jogo."
      });
    }

    const prompt = criarPrompt(
      ideia || "Atualizar o projeto atual",
      modo,
      acao,
      projetoAtual
    );

    const resultado = await chamarGemini(
      apiKey,
      prompt
    );

    const projeto = normalizarProjeto(resultado);

    projeto.builder_script = gerarBuilder(projeto);
    projeto.all_scripts = gerarScripts(projeto);

    return res.status(200).json({
      sucesso: true,
      projeto
    });

  } catch (erro) {
    console.error("ROBLOX AI STUDIO ERROR:", erro);

    return res.status(500).json({
      sucesso: false,
      erro:
        erro?.message ||
        "Erro desconhecido ao gerar o projeto."
    });
  }
                     }
