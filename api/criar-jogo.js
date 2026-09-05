module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
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
        error: "GEMINI_API_KEY não configurada."
      });
    }

    const prompt = `
Você é um desenvolvedor profissional de Roblox Studio especializado em Luau.

O usuário vai fornecer uma ideia de jogo.
Transforme essa ideia em um projeto detalhado que possa ser montado no Roblox Studio.

IMPORTANTE:
- Responda SOMENTE JSON válido.
- Não use markdown.
- Não coloque texto fora do JSON.
- Gere scripts Luau completos e funcionais.
- Organize cada script pelo local onde deve ser colocado.
- Não invente APIs inexistentes do Roblox.

Estrutura obrigatória:

{
  "nome": "Nome do jogo",
  "descricao": "Descrição completa",
  "genero": "Gênero",
  "objetivo": "Objetivo principal do jogador",

  "mapa": {
    "descricao": "Descrição geral do mapa",
    "areas": [
      {
        "nome": "Nome da área",
        "descricao": "Descrição",
        "posicao": "Descrição aproximada da posição"
      }
    ]
  },

  "objetos": [
    {
      "nome": "Nome",
      "tipo": "Part/NPC/Model/etc",
      "descricao": "Descrição",
      "local": "Workspace"
    }
  ],

  "npc": [
    {
      "nome": "Nome do NPC",
      "tipo": "Inimigo/Animal/NPC",
      "vida": 100,
      "dano": 10,
      "descricao": "Comportamento do NPC"
    }
  ],

  "sistemas": [
    {
      "nome": "Nome do sistema",
      "descricao": "Como funciona"
    }
  ],

  "scripts": [
    {
      "nome": "Nome do script",
      "local": "ServerScriptService",
      "tipo": "Script",
      "descricao": "O que o script faz",
      "codigo": "CÓDIGO LUA COMPLETO"
    }
  ],

  "passos": [
    "Passo 1 para montar o jogo",
    "Passo 2 para montar o jogo",
    "Passo 3 para montar o jogo"
  ]
}

A ideia do usuário é:

${ideia.trim().slice(0, 5000)}
`;

    const resposta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
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

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro Gemini:", dados);

      return res.status(500).json({
        error: "Erro na API Gemini.",
        details: dados?.error?.message || "Erro desconhecido."
      });
    }

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      return res.status(500).json({
        error: "A Gemini não retornou conteúdo."
      });
    }

    let projeto;

    try {
      projeto = JSON.parse(texto);
    } catch {
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");

      if (inicio === -1 || fim === -1) {
        return res.status(500).json({
          error: "A IA retornou um formato inválido."
        });
      }

      projeto = JSON.parse(
        texto.substring(inicio, fim + 1)
      );
    }

    return res.status(200).json(projeto);

  } catch (erro) {
    console.error("Erro interno:", erro);

    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: erro.message
    });
  }
};
