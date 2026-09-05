module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Use POST."
    });
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

Sua missão é transformar a ideia do usuário em um projeto completo de Roblox.

MODO:
${modo}

IDEIA DO USUÁRIO:
${ideia.trim().slice(0, 8000)}

========================================
REGRAS OBRIGATÓRIAS
========================================

RESPONDA SOMENTE COM JSON VÁLIDO.

NÃO use Markdown.
NÃO use \`\`\`.
NÃO escreva explicações fora do JSON.

Use somente Luau e APIs reais do Roblox.

Não use:
- require de IDs externos
- código externo
- URLs externas
- executores
- exploits
- APIs inexistentes
- serviços inexistentes
- código para burlar sistemas do Roblox

O projeto deve funcionar sem plugins externos.

Todos os scripts devem ser completos e executáveis.

========================================
SISTEMAS
========================================

Analise a ideia e crie os sistemas necessários.

Quando fizer sentido, inclua:

- moedas
- XP
- níveis
- inventário
- loja
- pets
- missões
- combate
- inimigos
- boss
- drops
- respawn
- checkpoints
- teleporte
- áreas desbloqueáveis
- eventos
- leaderboard
- salvamento de dados
- sistema de recompensa
- interface
- dia e noite
- spawn
- sistema de progressão

Não force sistemas que não combinam com o jogo.

========================================
MAPA
========================================

Crie um mapa coerente com a ideia.

Inclua:

- Spawn
- áreas
- terrenos
- construções
- obstáculos
- plataformas
- caminhos
- estruturas
- locais importantes
- áreas de combate
- área de boss quando necessário
- área de loja quando necessário

O Builder deve construir o máximo possível usando:

Instance.new()
Vector3.new()
CFrame.new()

Não dependa de modelos externos.

========================================
NPCS
========================================

Crie NPCs quando forem necessários.

Cada NPC pode ter:

- nome
- tipo
- vida
- dano
- velocidade
- comportamento
- posição
- função

Tipos possíveis:

Enemy
Boss
Shopkeeper
QuestGiver
Friendly
Pet
Other

========================================
BUILDER
========================================

O builder_script precisa:

1. Criar Workspace.GeneratedMap.
2. Criar todos os objetos possíveis.
3. Criar as áreas.
4. Criar SpawnLocation.
5. Criar estruturas.
6. Criar obstáculos.
7. Criar plataformas.
8. Criar NPCs básicos.
9. Organizar objetos em Models/Folders.
10. Configurar:
   Name
   Size
   Position
   Anchored
   CanCollide
   Material
   Transparency
11. Usar funções para evitar repetição.
12. Ser executável diretamente no Roblox Studio.

O builder não deve depender de assets externos.

========================================
SCRIPTS
========================================

Crie scripts separados quando necessário.

Possíveis locais:

ServerScriptService
ServerStorage
ReplicatedStorage
StarterPlayerScripts
StarterGui
Workspace

Tipos:

Script
LocalScript
ModuleScript

Cada script deve possuir:

name
location
type
description
code

========================================
REMOTES
========================================

Quando necessário, crie RemoteEvents e RemoteFunctions.

Eles devem ficar organizados em:

ReplicatedStorage
  Remotes

Não crie remotes desnecessários.

========================================
INTERFACE
========================================

Quando necessário, crie sistemas de UI.

Exemplos:

- contador de moedas
- XP
- nível
- loja
- inventário
- missões
- pets
- boss
- notificações

========================================
DATASTORE
========================================

Quando o jogo possuir progresso, gere um sistema básico de DataStoreService.

O código deve incluir tratamento de erros com pcall.

Não use dados externos.

========================================
FORMATO JSON
========================================

Retorne exatamente esta estrutura:

{
  "game_name": "Nome",

  "description": "Descrição",

  "genre": "Gênero",

  "objective": "Objetivo",

  "difficulty": "Fácil/Médio/Difícil",

  "estimated_players": "Quantidade",

  "map": {
    "description": "Descrição do mapa",

    "areas": [
      {
        "name": "Área",
        "description": "Descrição",
        "type": "Spawn/Combat/Shop/Boss/etc"
      }
    ]
  },

  "objects": [
    {
      "name": "Objeto",
      "type": "Part",
      "description": "Descrição",
      "position": [0, 5, 0],
      "size": [10, 1, 10],
      "material": "Grass",
      "anchored": true,
      "can_collide": true,
      "transparency": 0
    }
  ],

  "npcs": [
    {
      "name": "NPC",
      "type": "Enemy",
      "health": 100,
      "damage": 10,
      "speed": 16,
      "position": [0, 5, 0],
      "description": "Comportamento"
    }
  ],

  "systems": [
    {
      "name": "Sistema",
      "description": "Como funciona",
      "priority": "Alta"
    }
  ],

  "quests": [
    {
      "name": "Missão",
      "description": "Descrição",
      "objective": "Objetivo",
      "reward": "Recompensa"
    }
  ],

  "items": [
    {
      "name": "Item",
      "type": "Weapon/Tool/Pet/Consumable/Other",
      "description": "Descrição",
      "price": 100
    }
  ],

  "shops": [
    {
      "name": "Loja",
      "description": "Descrição",
      "items": ["Item 1", "Item 2"]
    }
  ],

  "pets": [
    {
      "name": "Pet",
      "rarity": "Common",
      "description": "Descrição",
      "bonus": "Bônus"
    }
  ],

  "builder_script": {
    "name": "MapBuilder",
    "description": "Construtor automático",
    "code": "CÓDIGO LUA COMPLETO"
  },

  "scripts": [
    {
      "name": "Script",
      "location": "ServerScriptService",
      "type": "Script",
      "description": "Descrição",
      "code": "CÓDIGO LUA COMPLETO"
    }
  ],

  "recommended_remotes": [
    {
      "name": "Remote",
      "type": "RemoteEvent",
      "description": "Função"
    }
  ],

  "steps": [
    "Passo 1",
    "Passo 2",
    "Passo 3"
  ],

  "future_upgrades": [
    "Upgrade 1",
    "Upgrade 2",
    "Upgrade 3"
  ]
}

========================================
QUALIDADE DO CÓDIGO
========================================

O código Luau deve:

- ser legível
- possuir comentários úteis
- evitar variáveis globais
- usar funções
- validar entradas do jogador
- evitar loops infinitos
- tratar erros importantes
- funcionar no Roblox Studio
- não depender de código externo

Para posições use:

Vector3.new(x, y, z)

Para criar objetos:

Instance.new("Part")

Para NPCs básicos, use Model e Parts.

========================================
IMPORTANTE
========================================

Gere uma quantidade razoável de objetos e scripts.

Não gere milhares de objetos desnecessários.

Priorize qualidade e funcionamento.

Agora gere o projeto.
`;

    const MODELOS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite"
];

    let ultimoErro = null;

    for (const modelo of modelos) {

      for (let tentativa = 1; tentativa <= 3; tentativa++) {

        try {

          console.log(
            "Gemini:",
            modelo,
            "Tentativa:",
            tentativa
          );

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
                  temperature: 0.7
                }
              })
            }
          );

          const dados = await resposta.json();

          console.log(
            "Status Gemini:",
            resposta.status
          );

          if (resposta.ok) {

            const texto =
              dados?.candidates?.[0]
                ?.content
                ?.parts?.[0]
                ?.text;

            if (!texto) {
              ultimoErro =
                "A Gemini não retornou conteúdo.";
              continue;
            }

            let projeto;

            try {

              projeto = JSON.parse(texto);

            } catch (erro) {

              console.error(
                "JSON inválido:",
                texto
              );

              ultimoErro =
                "A Gemini retornou JSON inválido.";

              continue;
            }

            projeto.game_name =
              projeto.game_name ||
              "Meu Jogo Roblox";

            projeto.description =
              projeto.description ||
              "Jogo criado pela Roblox AI Studio.";

            projeto.genre =
              projeto.genre ||
              "Adventure";

            projeto.objective =
              projeto.objective ||
              "Divirta-se e complete o objetivo.";

            projeto.map =
              projeto.map || {
                description: "Mapa gerado pela IA.",
                areas: []
              };

            if (!Array.isArray(projeto.map.areas)) {
              projeto.map.areas = [];
            }

            if (!Array.isArray(projeto.objects)) {
              projeto.objects = [];
            }

            if (!Array.isArray(projeto.npcs)) {
              projeto.npcs = [];
            }

            if (!Array.isArray(projeto.systems)) {
              projeto.systems = [];
            }

            if (!Array.isArray(projeto.quests)) {
              projeto.quests = [];
            }

            if (!Array.isArray(projeto.items)) {
              projeto.items = [];
            }

            if (!Array.isArray(projeto.shops)) {
              projeto.shops = [];
            }

            if (!Array.isArray(projeto.pets)) {
              projeto.pets = [];
            }

            if (!Array.isArray(projeto.scripts)) {
              projeto.scripts = [];
            }

            if (!Array.isArray(projeto.recommended_remotes)) {
              projeto.recommended_remotes = [];
            }

            if (!Array.isArray(projeto.steps)) {
              projeto.steps = [];
            }

            if (!Array.isArray(projeto.future_upgrades)) {
              projeto.future_upgrades = [];
            }

            projeto.builder_script =
              projeto.builder_script || {
                name: "MapBuilder",
                description:
                  "Construtor automático do mapa.",
                code:
                  "-- Builder não gerado."
              };

            console.log(
              "Projeto criado:",
              projeto.game_name
            );

            return res.status(200).json(projeto);
          }

          const mensagem =
            dados?.error?.message ||
            "Erro desconhecido na Gemini.";

          ultimoErro = mensagem;

          console.error(
            "Erro Gemini:",
            mensagem
          );

          if (
            resposta.status === 400 ||
            resposta.status === 401 ||
            resposta.status === 403
          ) {
            return res.status(500).json({
              error:
                "Erro na configuração da Gemini.",
              details: mensagem
            });
          }

          if (resposta.status === 404) {
            break;
          }

          if (
            resposta.status === 429 ||
            resposta.status === 500 ||
            resposta.status === 502 ||
            resposta.status === 503 ||
            resposta.status === 504 ||
            mensagem.toLowerCase().includes("high demand") ||
            mensagem.toLowerCase().includes("overloaded") ||
            mensagem.toLowerCase().includes("temporarily")
          ) {

            const espera =
              tentativa * 2000;

            await new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  espera
                )
            );

            continue;
          }

          break;

        } catch (erro) {

          console.error(
            "Erro de conexão:",
            erro
          );

          ultimoErro =
            erro.message;

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                tentativa * 2000
              )
          );
        }
      }
    }

    return res.status(503).json({
      error:
        "A IA está temporariamente ocupada.",
      details:
        ultimoErro ||
        "Tente novamente em alguns segundos."
    });

  } catch (erro) {

    console.error(
      "ERRO INTERNO:",
      erro
    );

    return res.status(500).json({
      error:
        "Erro interno do servidor.",
      details:
        erro.message
    });
  }
};
