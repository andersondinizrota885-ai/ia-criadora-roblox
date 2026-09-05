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
Crie um projeto de jogo Roblox baseado nesta ideia:

${ideia.trim().slice(0, 3000)}

Responda em JSON válido com esta estrutura:

{
  "nome": "Nome do jogo",
  "descricao": "Descrição",
  "genero": "Gênero",
  "objetivo": "Objetivo do jogador",
  "mapa": "Descrição do mapa",
  "sistemas": ["Sistema 1", "Sistema 2", "Sistema 3"],
  "scripts": [
    {
      "nome": "Nome do script",
      "local": "ServerScriptService",
      "codigo": "Código Luau"
    }
  ],
  "passos": [
    "Passo 1",
    "Passo 2",
    "Passo 3"
  ]
}

Não use Markdown.
Não coloque texto antes ou depois do JSON.
`;

    console.log("Iniciando chamada para Gemini...");

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
            responseMimeType: "application/json"
          }
        })
      }
    );

    console.log("Status Gemini:", resposta.status);

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("GEMINI_ERRO:", JSON.stringify(dados));

      return res.status(500).json({
        error: "Erro na API Gemini.",
        details: dados?.error?.message || "Erro desconhecido"
      });
    }

    const texto =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      console.error("GEMINI_SEM_RESPOSTA:", JSON.stringify(dados));

      return res.status(500).json({
        error: "A Gemini não retornou conteúdo."
      });
    }

    let projeto;

    try {
      projeto = JSON.parse(texto);
    } catch (erro) {
      console.error("JSON_INVALIDO:", texto);

      return res.status(500).json({
        error: "A Gemini retornou JSON inválido."
      });
    }

    console.log("Projeto criado com sucesso!");

    return res.status(200).json(projeto);

  } catch (erro) {
    console.error("ERRO_INTERNO:", erro);

    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: erro.message
    });
  }
};
