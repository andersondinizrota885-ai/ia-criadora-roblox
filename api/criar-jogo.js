module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Use POST."
    });
  }

  try {
    const { ideia } = req.body || {};

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
Você é um desenvolvedor profissional de Roblox Studio especializado em Luau.

Sua tarefa é transformar a ideia do usuário em um projeto de Roblox.

O projeto precisa conter:

1. MAPA
2. ÁREAS
3. PARTS
4. OBJETOS
5. NPCS
6. SISTEMAS
7. SCRIPTS
8. UM BUILDER SCRIPT QUE CONSTRÓI O MAPA AUTOMATICAMENTE

REGRAS IMPORTANTES:

- Responda SOMENTE com JSON válido.
- Não use Markdown.
- Não use blocos de código.
- Não escreva explicações fora do JSON.
- Use somente APIs reais do Roblox.
- Use Luau válido.
- Os scripts devem ser completos.
- O Builder deve criar o mapa usando Instance.new.
- O Builder deve criar Parts, Models, pastas e NPCs básicos.
- O Builder deve configurar posições, tamanhos, materiais e propriedades.
- Não use serviços ou APIs inexistentes.
- Não use require de IDs externos.
- Não use código externo.
- Não use HTTPService para baixar código.
- O projeto deve funcionar sem depender de plugins externos.

ESTRUTURA OBRIGATÓRIA:

{
  "game_name": "Nome do jogo",

  "description": "Descrição completa",

  "genre": "Gênero",

  "objective": "Objetivo principal",

  "map": {
    "description": "Descrição do mapa",

    "areas": [
      {
        "name": "Nome da área",
        "description": "Descrição"
      }
    ]
  },

  "objects": [
    {
      "name": "Nome",
      "type": "Part",
      "description": "Descrição",
      "position": [0, 5, 0],
      "size": [10, 1, 10],
      "material": "Grass"
    }
  ],

  "npcs": [
    {
      "name": "Nome",
      "type": "Enemy",
      "health": 100,
      "damage": 10,
      "description": "Comportamento"
    }
  ],

  "systems": [
    {
      "name": "Sistema",
      "description": "Como funciona"
    }
  ],

  "builder_script": {
    "name": "MapBuilder",
    "description": "Script que constrói o mapa automaticamente",
    "code": "CÓDIGO LUA COMPLETO"
  },

  "scripts": [
    {
      "name": "Nome do script",
      "location": "ServerScriptService",
      "type": "Script",
      "description": "Função",
      "code": "CÓDIGO LUA COMPLETO"
    }
  ],

  "steps": [
    "Passo 1",
    "Passo 2",
    "Passo 3"
  ]
}

REGRAS PARA O BUILDER:

O Builder deve:

- Criar uma pasta chamada GeneratedMap dentro de Workspace.
- Criar as Parts do mapa.
- Criar SpawnLocation quando necessário.
- Criar áreas organizadas em Models ou Folders.
- Usar Vector3.new().
- Usar Instance.new().
- Definir Name, Size, Position, Anchored, Material e outras propriedades válidas.
- Criar iluminação simples quando necessário.
- Criar obstáculos.
- Criar plataformas.
- Criar estruturas.
- Criar NPCs básicos quando possível.
- Usar funções para evitar código repetido.
- Ser independente.
- Não depender de assets externos.

IMPORTANTE:

O Builder deve ser um script executável dentro do Roblox Studio.

IDEIA DO USUÁRIO:

${ideia.trim().slice(0, 5000)}
`;

    const modelos = [
      "gemini-3.6-flash",
      "gemini-3.6-flash-lite"
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
                  responseMimeType: "application/json"
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

            if (!projeto.game_name) {
              projeto.game_name =
                "Meu Jogo Roblox";
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

            if (!Array.isArray(projeto.scripts)) {
              projeto.scripts = [];
            }

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

          if (
            resposta.status === 404
          ) {
            break;
          }

          if (
            resposta.status === 429 ||
            resposta.status === 500 ||
            resposta.status === 502 ||
            resposta.status === 503 ||
            resposta.status === 504 ||
            mensagem
              .toLowerCase()
              .includes("high demand") ||
            mensagem
              .toLowerCase()
              .includes("overloaded") ||
            mensagem
              .toLowerCase()
              .includes("temporarily")
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
