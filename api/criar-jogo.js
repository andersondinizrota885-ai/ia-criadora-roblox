// api/criar-jogo.js
// ROBLOX AI STUDIO - BACKEND + COMPLETE BUILDER

const MODELOS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite"
];

const MAX_TENTATIVAS = 3;

function dormir(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function limparMarkdown(texto) {
  return String(texto || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extrairJSON(texto) {
  const limpo = limparMarkdown(texto);

  try {
    return JSON.parse(limpo);
  } catch (_) {}

  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");

  if (inicio !== -1 && fim !== -1 && fim > inicio) {
    try {
      return JSON.parse(
        limpo.slice(inicio, fim + 1)
      );
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
    game_name: textoSeguro(
      p.game_name,
      "Meu Jogo Roblox"
    ),

    description: textoSeguro(
      p.description,
      "Jogo criado pelo Roblox AI Studio."
    ),

    genre: textoSeguro(
      p.genre,
      "Aventura"
    ),

    objective: textoSeguro(
      p.objective,
      "Explore o mapa e complete os objetivos."
    ),

    difficulty: textoSeguro(
      p.difficulty,
      "Médio"
    ),

    estimated_players:
      Number(p.estimated_players) || 10,

    map: {
      description: textoSeguro(
        p.map?.description,
        "Mapa criado automaticamente."
      ),

      areas: arraySeguro(
        p.map?.areas
      ).slice(0, 100)
    },

    objects: arraySeguro(
      p.objects
    ).slice(0, 300),

    npcs: arraySeguro(
      p.npcs
    ).slice(0, 60),

    systems: arraySeguro(
      p.systems
    ).slice(0, 80),

    quests: arraySeguro(
      p.quests
    ).slice(0, 80),

    items: arraySeguro(
      p.items
    ).slice(0, 120),

    shops: arraySeguro(
      p.shops
    ).slice(0, 40),

    pets: arraySeguro(
      p.pets
    ).slice(0, 80),

    recommended_remotes:
      arraySeguro(
        p.recommended_remotes
      ).slice(0, 60),

    scripts:
      arraySeguro(
        p.scripts
      ).slice(0, 80),

    steps:
      arraySeguro(
        p.steps
      ).slice(0, 100),

    future_upgrades:
      arraySeguro(
        p.future_upgrades
      ).slice(0, 100)
  };
}

/*
===========================================================
COMPLETE BUILDER
===========================================================
*/

function gerarBuilder(p) {

  const projetoJSON =
    JSON.stringify(
      p,
      null,
      2
    );

  return `--========================================================
-- ROBLOX AI STUDIO
-- COMPLETE BUILDER
--========================================================
-- Este Builder cria automaticamente:
--
-- MAPA
-- OBJETOS
-- NPCS
-- SPAWN
-- REMOTES
-- MOEDAS
-- COMBATE
-- INVENTÁRIO
-- PETS
-- QUESTS
-- LOJA
--
-- Execute este Script no Roblox Studio.
--========================================================

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")
local HttpService = game:GetService("HttpService")

--========================================================
-- PROJETO GERADO PELA IA
--========================================================

local PROJECT_JSON = [==[
${projetoJSON}
]==]

local Project

local decodedOK, decodedResult = pcall(function()
	return HttpService:JSONDecode(PROJECT_JSON)
end)

if decodedOK then
	Project = decodedResult
else
	warn("[Roblox AI Studio] Erro ao ler projeto.")
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

local function getOrCreateRemote(parent, name)

	local existing = parent:FindFirstChild(name)

	if existing and existing:IsA("RemoteEvent") then
		return existing
	end

	local remote = Instance.new("RemoteEvent")
	remote.Name = name
	remote.Parent = parent

	return remote
end

local function createServerScript(
	parent,
	name,
	source
)

	local old = parent:FindFirstChild(name)

	if old then
		old:Destroy()
	end

	local script = Instance.new("Script")

	script.Name = name
	script.Source = source
	script.Parent = parent

	return script
end

local function createModule(
	parent,
	name,
	source
)

	local old = parent:FindFirstChild(name)

	if old then
		old:Destroy()
	end

	local module = Instance.new("ModuleScript")

	module.Name = name
	module.Source = source
	module.Parent = parent

	return module
end

--========================================================
-- LIMPAR ESTRUTURA ANTIGA
--========================================================

local oldMap =
	Workspace:FindFirstChild("GeneratedMap")

if oldMap then
	oldMap:Destroy()
end

local oldAI =
	ReplicatedStorage:FindFirstChild("RobloxAI")

if oldAI then
	oldAI:Destroy()
end

local oldSystems =
	ServerScriptService:FindFirstChild("RobloxAI")

if oldSystems then
	oldSystems:Destroy()
end

--========================================================
-- WORKSPACE
--========================================================

local generatedMap =
	Instance.new("Folder")

generatedMap.Name =
	"GeneratedMap"

generatedMap.Parent =
	Workspace

local areasFolder =
	getOrCreateFolder(
		generatedMap,
		"Areas"
	)

local objectsFolder =
	getOrCreateFolder(
		generatedMap,
		"Objects"
	)

local npcsFolder =
	getOrCreateFolder(
		generatedMap,
		"NPCs"
	)

local spawnsFolder =
	getOrCreateFolder(
		generatedMap,
		"Spawns"
	)

--========================================================
-- ÁREAS
--========================================================

for index, area in ipairs(
	Project.map.areas or {}
) do

	local model =
		Instance.new("Model")

	model.Name =
		tostring(
			area.name or
			("Area_" .. index)
		)

	model:SetAttribute(
		"Description",
		tostring(
			area.description or ""
		)
	)

	model:SetAttribute(
		"Type",
		tostring(
			area.type or "Area"
		)
	)

	model.Parent =
		areasFolder

	local marker =
		Instance.new("Part")

	marker.Name =
		"AreaMarker"

	marker.Size =
		Vector3.new(
			30,
			1,
			30
		)

	marker.Position =
		Vector3.new(
			(index - 1) * 35,
			0,
			0
		)

	marker.Anchored =
		true

	marker.Transparency =
		1

	marker.CanCollide =
		false

	marker.Parent =
		model
end

--========================================================
-- OBJETOS
--========================================================

for index, object in ipairs(
	Project.objects or {}
) do

	local part =
		Instance.new("Part")

	part.Name =
		tostring(
			object.name or
			("Object_" .. index)
		)

	local size =
		object.size or {}

	part.Size =
		Vector3.new(
			tonumber(size.x) or 6,
			tonumber(size.y) or 2,
			tonumber(size.z) or 6
		)

	local position =
		object.position or {}

	part.Position =
		Vector3.new(
			tonumber(position.x) or 0,
			tonumber(position.y) or 2,
			tonumber(position.z) or 0
		)

	part.Anchored =
		true

	part.CanCollide =
		object.can_collide ~= false

	local materialName =
		tostring(
			object.material or
			"Plastic"
		)

	local materialOK,
		materialValue =
		pcall(function()
			return Enum.Material[
				materialName
			]
		end)

	if materialOK and materialValue then
		part.Material =
			materialValue
	end

	part:SetAttribute(
		"GeneratedBy",
		"RobloxAIStudio"
	)

	part:SetAttribute(
		"Category",
		tostring(
			object.category or
			"Object"
		)
	)

	part.Parent =
		objectsFolder
end

--========================================================
-- SPAWN
--========================================================

local spawn =
	Instance.new("SpawnLocation")

spawn.Name =
	"PlayerSpawn"

spawn.Size =
	Vector3.new(
		8,
		1,
		8
	)

spawn.Position =
	Vector3.new(
		0,
		3,
		-15
	)

spawn.Anchored =
	true

spawn.Neutral =
	true

spawn.Parent =
	spawnsFolder

--========================================================
-- NPCS
--========================================================

for index, npc in ipairs(
	Project.npcs or {}
) do

	local model =
		Instance.new("Model")

	model.Name =
		tostring(
			npc.name or
			("NPC_" .. index)
		)

	model:SetAttribute(
		"NPCType",
		tostring(
			npc.type or "Enemy"
		)
	)

	model:SetAttribute(
		"Damage",
		tonumber(
			npc.damage
		) or 10
	)

	model:SetAttribute(
		"GeneratedBy",
		"RobloxAIStudio"
	)

	local root =
		Instance.new("Part")

	root.Name =
		"HumanoidRootPart"

	root.Size =
		Vector3.new(
			2,
			2,
			1
		)

	root.Transparency =
		1

	root.CanCollide =
		false

	root.Anchored =
		false

	root.Position =
		Vector3.new(
			(index - 1) * 8,
			4,
			20
		)

	root.Parent =
		model

	local body =
		Instance.new("Part")

	body.Name =
		"Body"

	body.Size =
		Vector3.new(
			2,
			3,
			1
		)

	body.Position =
		root.Position +
		Vector3.new(
			0,
			1.5,
			0
		)

	body.Parent =
		model

	local head =
		Instance.new("Part")

	head.Name =
		"Head"

	head.Shape =
		Enum.PartType.Ball

	head.Size =
		Vector3.new(
			2,
			2,
			2
		)

	head.Position =
		root.Position +
		Vector3.new(
			0,
			3.5,
			0
		)

	head.Parent =
		model

	local humanoid =
		Instance.new("Humanoid")

	humanoid.MaxHealth =
		tonumber(
			npc.health
		) or 100

	humanoid.Health =
		humanoid.MaxHealth

	humanoid.WalkSpeed =
		tonumber(
			npc.walk_speed
		) or 12

	humanoid.Parent =
		model

	local weldBody =
		Instance.new("WeldConstraint")

	weldBody.Part0 =
		root

	weldBody.Part1 =
		body

	weldBody.Parent =
		root

	local weldHead =
		Instance.new("WeldConstraint")

	weldHead.Part0 =
		root

	weldHead.Part1 =
		head

	weldHead.Parent =
		root

	model.PrimaryPart =
		root

	model.Parent =
		npcsFolder
end

--========================================================
-- REPLICATED STORAGE
--========================================================

local aiFolder =
	Instance.new("Folder")

aiFolder.Name =
	"RobloxAI"

aiFolder.Parent =
	ReplicatedStorage

local remotesFolder =
	Instance.new("Folder")

remotesFolder.Name =
	"Remotes"

remotesFolder.Parent =
	aiFolder

local modulesFolder =
	Instance.new("Folder")

modulesFolder.Name =
	"Modules"

modulesFolder.Parent =
	aiFolder

--========================================================
-- REMOTES PRINCIPAIS
--========================================================

local remoteNames = {

	"Combat",
	"Attack",
	"Coins",
	"Inventory",
	"AddItem",
	"RemoveItem",
	"Pets",
	"EquipPet",
	"Quests",
	"QuestUpdate",
	"Shop",
	"BuyItem",
	"NPC",
	"SystemMessage"

}

for _, remoteName in ipairs(
	remoteNames
) do

	getOrCreateRemote(
		remotesFolder,
		remoteName
	)

end

--========================================================
-- CONFIGURAÇÃO
--========================================================

local config =
	Instance.new("Configuration")

config.Name =
	"GameConfig"

config:SetAttribute(
	"GameName",
	tostring(
		Project.game_name
	)
)

config:SetAttribute(
	"Genre",
	tostring(
		Project.genre
	)
)

config:SetAttribute(
	"Difficulty",
	tostring(
		Project.difficulty
	)
)

config.Parent =
	aiFolder

--========================================================
-- SERVER FOLDER
--========================================================

local serverAI =
	Instance.new("Folder")

serverAI.Name =
	"RobloxAI"

serverAI.Parent =
	ServerScriptService

local systemsFolder =
	Instance.new("Folder")

systemsFolder.Name =
	"Systems"

systemsFolder.Parent =
	serverAI

local scriptsFolder =
	Instance.new("Folder")

scriptsFolder.Name =
	"Scripts"

scriptsFolder.Parent =
	serverAI

--========================================================
-- MODULE: INVENTORY
--========================================================

createModule(
	modulesFolder,
	"InventoryService",
[==[
local InventoryService = {}

function InventoryService.GetInventory(player)

	local folder =
		player:FindFirstChild("Inventory")

	if not folder then

		folder =
			Instance.new("Folder")

		folder.Name =
			"Inventory"

		folder.Parent =
			player

	end

	return folder
end

function InventoryService.AddItem(
	player,
	itemName,
	amount
)

	amount =
		tonumber(amount) or 1

	local inventory =
		InventoryService.GetInventory(
			player
		)

	local item =
		inventory:FindFirstChild(
			itemName
		)

	if not item then

		item =
			Instance.new("IntValue")

		item.Name =
			itemName

		item.Value =
			0

		item.Parent =
			inventory

	end

	item.Value += amount

	return item.Value
end

function InventoryService.RemoveItem(
	player,
	itemName,
	amount
)

	amount =
		tonumber(amount) or 1

	local inventory =
		InventoryService.GetInventory(
			player
		)

	local item =
		inventory:FindFirstChild(
			itemName
		)

	if not item then
		return false
	end

	if item.Value < amount then
		return false
	end

	item.Value -= amount

	return true
end

return InventoryService
]==]
)

--========================================================
-- MODULE: PETS
--========================================================

createModule(
	modulesFolder,
	"PetService",
[==[
local PetService = {}

function PetService.GetPets(player)

	local folder =
		player:FindFirstChild("Pets")

	if not folder then

		folder =
			Instance.new("Folder")

		folder.Name =
			"Pets"

		folder.Parent =
			player

	end

	return folder
end

function PetService.AddPet(
	player,
	petName
)

	local pets =
		PetService.GetPets(
			player
		)

	local pet =
		Instance.new("StringValue")

	pet.Name =
		petName

	pet.Value =
		petName

	pet.Parent =
		pets

	return pet
end

return PetService
]==]
)

--========================================================
-- MODULE: QUESTS
--========================================================

createModule(
	modulesFolder,
	"QuestService",
[==[
local QuestService = {}

function QuestService.GetQuests(player)

	local folder =
		player:FindFirstChild("Quests")

	if not folder then

		folder =
			Instance.new("Folder")

		folder.Name =
			"Quests"

		folder.Parent =
			player

	end

	return folder
end

function QuestService.StartQuest(
	player,
	questName
)

	local quests =
		QuestService.GetQuests(
			player
		)

	local quest =
		quests:FindFirstChild(
			questName
		)

	if not quest then

		quest =
			Instance.new("IntValue")

		quest.Name =
			questName

		quest.Value =
			0

		quest.Parent =
			quests

	end

	return quest
end

function QuestService.ProgressQuest(
	player,
	questName,
	amount
)

	local quest =
		QuestService.StartQuest(
			player,
			questName
		)

	quest.Value +=
		tonumber(amount) or 1

	return quest.Value
end

return QuestService
]==]
)

--========================================================
-- SYSTEM: MOEDAS
--========================================================

createServerScript(
	systemsFolder,
	"CoinsSystem",
[==[
local Players =
	game:GetService("Players")

local function setupPlayer(
	player
)

	local leaderstats =
		Instance.new("Folder")

	leaderstats.Name =
		"leaderstats"

	leaderstats.Parent =
		player

	local coins =
		Instance.new("IntValue")

	coins.Name =
		"Coins"

	coins.Value =
		0

	coins.Parent =
		leaderstats
end

Players.PlayerAdded:Connect(
	setupPlayer
)

for _, player in ipairs(
	Players:GetPlayers()
) do

	if not player:FindFirstChild(
		"leaderstats"
	) then

		setupPlayer(player)

	end
end
]==]
)

--========================================================
-- SYSTEM: COMBATE
--========================================================

createServerScript(
	systemsFolder,
	"CombatSystem",
[==[
local ReplicatedStorage =
	game:GetService(
		"ReplicatedStorage"
	)

local Players =
	game:GetService("Players")

local ai =
	ReplicatedStorage:
		WaitForChild("RobloxAI")

local remotes =
	ai:WaitForChild("Remotes")

local attack =
	remotes:WaitForChild(
		"Attack"
	)

local MAX_DISTANCE =
	12

local DAMAGE =
	10

attack.OnServerEvent:Connect(
	function(
		player,
		target
	)

		if typeof(target) ~= "Instance" then
			return
		end

		if not target:IsDescendantOf(
			workspace
		) then
			return
		end

		local character =
			player.Character

		if not character then
			return
		end

		local root =
			character:FindFirstChild(
				"HumanoidRootPart"
			)

		if not root then
			return
		end

		local targetHumanoid =
			target:FindFirstChildOfClass(
				"Humanoid"
			)

		local targetRoot =
			target:FindFirstChild(
				"HumanoidRootPart"
			)

		if not targetHumanoid or
			not targetRoot then
			return
		end

		if targetHumanoid.Health <= 0 then
			return
		end

		if (
			root.Position -
			targetRoot.Position
		).Magnitude > MAX_DISTANCE then
			return
		end

		targetHumanoid:TakeDamage(
			DAMAGE
		)
	end
)
]==]
)

--========================================================
-- SYSTEM: NPC
--========================================================

createServerScript(
	systemsFolder,
	"NPCSystem",
[==[
local Players =
	game:GetService("Players")

local Workspace =
	game:GetService("Workspace")

local npcFolder =
	Workspace:
		WaitForChild("GeneratedMap"):
		WaitForChild("NPCs")

local DETECTION_DISTANCE =
	45

local function getNearestPlayer(
	position
)

	local nearest = nil
	local nearestDistance =
		DETECTION_DISTANCE

	for _, player in ipairs(
		Players:GetPlayers()
	) do

		local character =
			player.Character

		if character then

			local root =
				character:FindFirstChild(
					"HumanoidRootPart"
				)

			if root then

				local distance =
					(
						root.Position -
						position
					).Magnitude

				if distance <
					nearestDistance then

					nearestDistance =
						distance

					nearest =
						player
				end
			end
		end
	end

	return nearest
end

while task.wait(1) do

	for _, npc in ipairs(
		npcFolder:GetChildren()
	) do

		local humanoid =
			npc:FindFirstChildOfClass(
				"Humanoid"
			)

		local root =
			npc:FindFirstChild(
				"HumanoidRootPart"
			)

		if humanoid and
			root and
			humanoid.Health > 0 then

			local player =
				getNearestPlayer(
					root.Position
				)

			if player and
				player.Character then

				local targetRoot =
					player.Character:
					FindFirstChild(
						"HumanoidRootPart"
					)

				if targetRoot then

					humanoid:MoveTo(
						targetRoot.Position
					)

				end
			end
		end
	end
end
]==]
)

--========================================================
-- SYSTEM: PETS
--========================================================

createServerScript(
	systemsFolder,
	"PetSystem",
[==[
local Players =
	game:GetService("Players")

Players.PlayerAdded:Connect(
	function(player)

		local pets =
			Instance.new("Folder")

		pets.Name =
			"Pets"

		pets.Parent =
			player

	end
)
]==]
)

--========================================================
-- SYSTEM: QUESTS
--========================================================

createServerScript(
	systemsFolder,
	"QuestSystem",
[==[
local Players =
	game:GetService("Players")

Players.PlayerAdded:Connect(
	function(player)

		local quests =
			Instance.new("Folder")

		quests.Name =
			"Quests"

		quests.Parent =
			player

	end
)
]==]
)

--========================================================
-- SYSTEM: LOJA
--========================================================

createServerScript(
	systemsFolder,
	"ShopSystem",
[==[
local ReplicatedStorage =
	game:GetService(
		"ReplicatedStorage"
	)

local ai =
	ReplicatedStorage:
		WaitForChild("RobloxAI")

local remotes =
	ai:WaitForChild("Remotes")

local buy =
	remotes:WaitForChild(
		"BuyItem"
	)

local PRICES = {

	WoodSword = 100,
	HealthPotion = 50,
	BasicPet = 250

}

buy.OnServerEvent:Connect(
	function(
		player,
		itemName
	)

		if typeof(itemName) ~= "string" then
			return
		end

		local price =
			PRICES[itemName]

		if not price then
			return
		end

		local leaderstats =
			player:FindFirstChild(
				"leaderstats"
			)

		if not leaderstats then
			return
		end

		local coins =
			leaderstats:FindFirstChild(
				"Coins"
			)

		if not coins then
			return
		end

		if coins.Value < price then
			return
		end

		coins.Value -= price

		local inventory =
			player:FindFirstChild(
				"Inventory"
			)

		if not inventory then

			inventory =
				Instance.new("Folder")

			inventory.Name =
				"Inventory"

			inventory.Parent =
				player

		end

		local item =
			inventory:FindFirstChild(
				itemName
			)

		if not item then

			item =
				Instance.new("IntValue")

			item.Name =
				itemName

			item.Value =
				0

			item.Parent =
				inventory

		end

		item.Value += 1
	end
)
]==]
)

--========================================================
-- SYSTEM: INVENTÁRIO
--========================================================

createServerScript(
	systemsFolder,
	"InventorySystem",
[==[
local Players =
	game:GetService("Players")

Players.PlayerAdded:Connect(
	function(player)

		local inventory =
			Instance.new("Folder")

		inventory.Name =
			"Inventory"

		inventory.Parent =
			player

	end
)
]==]
)

--========================================================
-- SCRIPT: SISTEMAS DA IA
--========================================================

for index, generated in ipairs(
	Project.scripts or {}
) do

	local scriptName =
		tostring(
			generated.name or
			("GeneratedScript_" .. index)
		)

	local code =
		tostring(
			generated.code or
			"-- Código não informado."
		)

	createServerScript(
		scriptsFolder,
		scriptName,
		code
	)

end

--========================================================
-- LIGHTING
--========================================================

Lighting.ClockTime =
	14

Lighting:SetAttribute(
	"GeneratedBy",
	"RobloxAIStudio"
)

--========================================================
-- ATRIBUTOS DO PROJETO
--========================================================

generatedMap:SetAttribute(
	"GameName",
	tostring(
		Project.game_name
	)
)

generatedMap:SetAttribute(
	"Description",
	tostring(
		Project.description
	)
)

generatedMap:SetAttribute(
	"Genre",
	tostring(
		Project.genre
	)
)

--========================================================
-- FINAL
--========================================================

print("")
print("==============================================")
print("        ROBLOX AI STUDIO - BUILDER")
print("==============================================")
print(
	"Jogo: " ..
	tostring(Project.game_name)
)
print(
	"Áreas: " ..
	tostring(
		#(Project.map.areas or {})
	)
)
print(
	"Objetos: " ..
	tostring(
		#(Project.objects or {})
	)
)
print(
	"NPCs: " ..
	tostring(
		#(Project.npcs or {})
	)
)
print(
	"Sistemas IA: " ..
	tostring(
		#(Project.systems or {})
	)
)
print("")
print("Sistemas instalados:")
print("✓ Moedas")
print("✓ Combate")
print("✓ NPCs")
print("✓ Pets")
print("✓ Quests")
print("✓ Inventário")
print("✓ Loja")
print("✓ RemoteEvents")
print("✓ Módulos")
print("")
print("Roblox AI Studio: BUILD CONCLUÍDO!")
print("==============================================")
`;
}

/*
===========================================================
SCRIPTS PARA DOWNLOAD
===========================================================
*/

function gerarScripts(p) {

  const linhas = [];

  linhas.push(
    "--=================================================="
  );

  linhas.push(
    "-- ROBLOX AI STUDIO - SCRIPTS"
  );

  linhas.push(
    "--=================================================="
  );

  linhas.push("");

  for (const script of p.scripts) {

    linhas.push(
      "--=================================================="
    );

    linhas.push(
      "-- " +
      String(
        script.name ||
        "GeneratedScript"
      )
    );

    linhas.push(
      "-- Tipo: " +
      String(
        script.type ||
        "ServerScript"
      )
    );

    linhas.push(
      "--=================================================="
    );

    linhas.push(
      String(
        script.code ||
        "-- Código não informado."
      )
    );

    linhas.push("");
  }

  if (p.scripts.length === 0) {

    linhas.push(
      "-- Nenhum script adicional foi retornado pela IA."
    );

  }

  return linhas.join("\n");
}

/*
===========================================================
PROMPT GEMINI
===========================================================
*/

function criarPrompt(
  ideia,
  modo,
  acao,
  projetoAtual
) {

  const contextoAtual =
    projetoAtual
      ? JSON.stringify(
          projetoAtual,
          null,
          2
        )
      : "NENHUM PROJETO EXISTENTE";

  let objetivo = `
Crie um jogo completo para Roblox baseado nesta ideia:

${ideia}
`;

  if (acao) {

    objetivo = `
Você está EDITANDO um projeto Roblox existente.

AÇÃO:
${acao}

PROJETO ATUAL:
${contextoAtual}

Faça a alteração solicitada mantendo tudo que já existe.

Não apague funcionalidades existentes.

Retorne o PROJETO COMPLETO ATUALIZADO.
`;
  }

  return `
Você é um desenvolvedor especialista em Roblox Studio,
Luau, sistemas multiplayer, NPCs, mapas, economia,
inventários, quests, pets, lojas e combate.

${objetivo}

MODO:
${modo}

RETORNE SOMENTE JSON VÁLIDO.

NÃO USE MARKDOWN.
NÃO USE \`\`\`.
NÃO ESCREVA TEXTO FORA DO JSON.

Formato:

{
  "game_name": "Nome",
  "description": "Descrição",
  "genre": "Gênero",
  "objective": "Objetivo",
  "difficulty": "Médio",
  "estimated_players": 10,

  "map": {
    "description": "Descrição",
    "areas": [
      {
        "name": "Área",
        "description": "Descrição",
        "type": "Island"
      }
    ]
  },

  "objects": [
    {
      "name": "Objeto",
      "category": "House",
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
      "name": "Enemy",
      "type": "Enemy",
      "description": "Descrição",
      "health": 100,
      "walk_speed": 12,
      "damage": 10,
      "drops": [
        "Coins"
      ]
    }
  ],

  "systems": [
    {
      "name": "Combat",
      "description": "Descrição",
      "priority": "high"
    }
  ],

  "quests": [
    {
      "name": "Quest",
      "description": "Descrição",
      "reward": "100 Coins"
    }
  ],

  "items": [
    {
      "name": "Sword",
      "type": "Weapon",
      "description": "Descrição",
      "rarity": "Common"
    }
  ],

  "shops": [
    {
      "name": "Shop",
      "items": [
        "Sword"
      ],
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
      "name": "Attack",
      "purpose": "Combate"
    }
  ],

  "scripts": [
    {
      "name": "ExampleSystem",
      "type": "ServerScript",
      "purpose": "Descrição",
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

REGRAS:

1. Gere código Luau válido.

2. O servidor deve validar ações importantes.

3. Não confie no cliente para moedas,
   dano, compras ou recompensas.

4. Use RemoteEvents para comunicação
   cliente-servidor.

5. Não coloque API keys nos scripts.

6. Use ServerScriptService para lógica
   do servidor.

7. Use ReplicatedStorage para módulos
   e RemoteEvents.

8. Gere sistemas completos quando possível.

9. Se o usuário pedir uma atualização,
   preserve o projeto existente.

10. Não duplique sistemas.

11. Scripts devem ser compatíveis
    com Roblox Studio.

12. Os sistemas padrão do Builder já incluem:
    - moedas
    - combate
    - NPCs
    - pets
    - quests
    - inventário
    - loja

Se a IA retornar scripts adicionais,
eles serão instalados automaticamente pelo Builder.
`;
}

/*
===========================================================
GEMINI
===========================================================
*/

async function chamarGemini(
  apiKey,
  prompt
) {

  let ultimoErro = null;

  for (const modelo of MODELOS) {

    for (
      let tentativa = 1;
      tentativa <= MAX_TENTATIVAS;
      tentativa++
    ) {

      try {

        const url =
          "https://generativelanguage.googleapis.com/v1beta/models/" +
          modelo +
          ":generateContent?key=" +
          encodeURIComponent(apiKey);

        const resposta =
          await fetch(
            url,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
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
                  responseMimeType:
                    "application/json"
                }
              })
            }
          );

        const textoResposta =
          await resposta.text();

        if (!resposta.ok) {

          let mensagem =
            textoResposta;

          try {

            const erroJSON =
              JSON.parse(
                textoResposta
              );

            mensagem =
              erroJSON?.error?.message ||
              textoResposta;

          } catch (_) {}

          if (
            resposta.status === 404
          ) {

            ultimoErro =
              new Error(
                mensagem
              );

            break;
          }

          if (
            resposta.status === 429 ||
            resposta.status >= 500
          ) {

            ultimoErro =
              new Error(
                mensagem
              );

            await dormir(
              1000 * tentativa
            );

            continue;
          }

          throw new Error(
            mensagem
          );
        }

        const dados =
          JSON.parse(
            textoResposta
          );

        const texto =
          dados?.candidates?.[0]
            ?.content?.parts
            ?.map(
              part =>
                part.text || ""
            )
            .join("") || "";

        if (!texto) {

          throw new Error(
            "Gemini não retornou conteúdo."
          );

        }

        return extrairJSON(
          texto
        );

      } catch (erro) {

        ultimoErro =
          erro;

        if (
          tentativa <
          MAX_TENTATIVAS
        ) {

          await dormir(
            700 * tentativa
          );

        }

      }

    }

  }

  throw (
    ultimoErro ||
    new Error(
      "Não foi possível chamar a IA."
    )
  );
}

/*
===========================================================
API
===========================================================
*/

export default async function handler(
  req,
  res
) {

  if (req.method !== "POST") {

    return res.status(405).json({
      sucesso: false,
      erro: "Use POST."
    });

  }

  try {

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {

      return res.status(500).json({
        sucesso: false,
        erro:
          "GEMINI_API_KEY não está configurada na Vercel."
      });

    }

    const body =
      req.body || {};

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
      body.projeto &&
      typeof body.projeto === "object"
        ? body.projeto
        : null;

    if (!ideia && !acao) {

      return res.status(400).json({
        sucesso: false,
        erro:
          "Digite uma ideia para o jogo."
      });

    }

    const prompt =
      criarPrompt(
        ideia ||
          "Atualizar projeto",
        modo,
        acao,
        projetoAtual
      );

    const resultado =
      await chamarGemini(
        apiKey,
        prompt
      );

    const projeto =
      normalizarProjeto(
        resultado
      );

    projeto.builder_script =
      gerarBuilder(
        projeto
      );

    projeto.all_scripts =
      gerarScripts(
        projeto
      );

    return res.status(200).json({
      sucesso: true,
      projeto
    });

  } catch (erro) {

    console.error(
      "ROBLOX AI STUDIO ERROR:",
      erro
    );

    return res.status(500).json({
      sucesso: false,
      erro:
        erro?.message ||
        "Erro desconhecido ao gerar o projeto."
    });

  }
}
