  module.exports = async function handler(req, res) {
  // Apenas POST
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
        error: "GEMINI_API_KEY não configurada no Vercel."
      });
    }

    const prompt = `
Você é uma IA especializada em criar projetos de jogos Roblox.

Crie um projeto de jogo baseado na ideia do usuário.

A resposta DEVE ser somente JSON válido.
Não use markdown.
Não coloque \`\`\`json.
Não escreva explicações fora do JSON.

Use exatamente esta estrutura:

{
  "nome": "Nome do jogo",
  "descricao": "Descrição do jogo",
  "genero": "Gênero do jogo",
  "mapa": {
    "descricao": "Descrição detalhada do mapa",
    "areas": [
      "Área 1",
      "Área 2",
      "Área 3"
    ]
  },
  "sistemas": [
    {
      "nome": "Nome do sistema",
      "descricao": "Como funciona"
    }
  ],
  "objetos": [
    {
      "nome": "Nome do objeto",
      "descricao": "Descrição"
    }
  ],
  "scripts": [
    {
      "nome": "Nome do script",
      "local": "ServerScriptService",
      "codigo": "Código Lua completo"
    }
  ]
}

Crie scripts Lua funcionais sempre que possível.

IDEIA DO USUÁRIO:
${ideia.trim().slice(0, 5000)}
`;

    const resposta = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "Você é um especialista em desenvolvimento de jogos Roblox e programação Lua."
              }
            ]
          },
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
            maxOutputTokens: 12000,
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
        details:
          dados?.error?.message ||
          "Erro desconhecido na API Gemini."
      });
    }

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error("Resposta Gemini sem texto:", dados);

      return res.status(500).json({
        error: "A Gemini não retornou conteúdo."
      });
    }

    let projeto;

    try {
      projeto = JSON.parse(texto);
    } catch (erroJson) {
      console.error("JSON inválido recebido da Gemini:", texto);

      // Tenta encontrar um JSON dentro da resposta
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");

      if (inicio === -1 || fim === -1) {
        return res.status(500).json({
          error: "A IA retornou um formato inválido.",
          details: texto.substring(0, 500)
        });
      }

      try {
        projeto = JSON.parse(
          texto.substring(inicio, fim + 1)
        );
      } catch (erroFinal) {
        return res.status(500).json({
          error: "Não foi possível interpretar o projeto gerado."
        });
      }
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
