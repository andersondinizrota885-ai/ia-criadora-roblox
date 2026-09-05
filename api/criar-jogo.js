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

Transforme a ideia do usuário em um projeto detalhado para Roblox Studio.

REGRAS:
- Responda SOMENTE com JSON válido.
- Não use Markdown.
- Não coloque texto fora do JSON.
- Não use blocos de código.
- Gere scripts Luau completos.
- Use somente APIs reais do Roblox.
- Informe onde cada script deve ser colocado.

A resposta deve seguir exatamente esta estrutura:

{
  "game_name": "Nome do jogo",
  "description": "Descrição do jogo",
  "genre": "Gênero",
  "objective": "Objetivo principal",
  "map": {
    "description": "Descrição do mapa",
    "areas": [
      {
        "name": "Nome da área",
        "description": "Descrição da área"
      }
    ]
  },
  "objects": [
    {
      "name": "Nome do objeto",
      "type": "Part, Model, NPC etc",
      "description": "Descrição",
      "location": "Workspace"
    }
  ],
  "npcs": [
    {
      "name": "Nome do NPC",
      "type": "Inimigo ou NPC",
      "health": 100,
      "damage": 10,
      "description": "Comportamento"
    }
  ],
  "systems": [
    {
      "name": "Nome do sistema",
      "description": "Como funciona"
    }
  ],
  "scripts": [
    {
      "name": "Nome do script",
      "location": "ServerScriptService",
      "type": "Script",
      "description": "O que o script faz",
      "code": "CÓDIGO LUA COMPLETO"
    }
  ],
  "steps": [
    "Passo 1",
    "Passo 2",
    "Passo 3"
  ]
}

IDEIA DO USUÁRIO:

${ideia.trim().slice(0, 5000)}
`;

    console.log("Iniciando Gemini...");

    const resposta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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
            temperature: 0.7,
            maxOutputTokens: 20000,
            responseMimeType: "application/json"
          }
        })
      }
    );

    console.log("Status Gemini:", resposta.status);

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error(
        "GEMINI_ERRO:",
        JSON.stringify(dados)
      );

      return res.status(500).json({
        error: "Erro na API Gemini.",
        details:
          dados?.error?.message ||
          "Erro desconhecido na Gemini."
      });
    }

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error(
        "GEMINI_SEM_RESPOSTA:",
        JSON.stringify(dados)
      );

      return res.status(500).json({
        error: "A Gemini não retornou conteúdo."
      });
    }

    let projeto;

    try {
      projeto = JSON.parse(texto);
    } catch (erro) {
      console.error(
        "JSON_INVALIDO:",
        texto
      );

      return res.status(500).json({
        error: "A Gemini retornou um JSON inválido."
      });
    }

    console.log("Projeto criado com sucesso!");

    return res.status(200).json(projeto);

  } catch (erro) {
    console.error(
      "ERRO_INTERNO:",
      erro
    );

    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: erro.message
    });
  }
};
