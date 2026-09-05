const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido. Use POST."
    });
  }

  try {
    const { ideia } = req.body || {};

    // Verificar se o usuário enviou uma ideia
    if (!ideia || typeof ideia !== "string") {
      return res.status(400).json({
        error: "Envie uma ideia para o jogo."
      });
    }

    // Limite para evitar pedidos gigantes
    const ideiaLimpa = ideia.trim().slice(0, 5000);

    const resposta = await client.responses.create({
      model: "gpt-5.6-luna",

      instructions: `
Você é uma IA especializada em criar projetos para Roblox Studio.

O usuário vai descrever uma ideia de jogo.

Sua tarefa é transformar a ideia em um pequeno projeto organizado,
com scripts Luau que possam ser usados no Roblox Studio.

IMPORTANTE:
- Responda SOMENTE com JSON válido.
- Não coloque markdown.
- Não coloque ```json.
- Gere código Luau válido.
- Explique no campo "description" como os scripts devem ser usados.
- Não invente campos fora do formato solicitado.

Formato obrigatório:

{
  "game_name": "Nome do jogo",
  "description": "Descrição curta do projeto",
  "scripts": [
    {
      "name": "NomeDoScript",
      "location": "ServerScriptService",
      "code": "código Luau aqui"
    }
  ]
}

Crie scripts simples, organizados e seguros.
Quando possível, indique no campo "location" onde o script deve ficar.
`,

      input: `
Crie um projeto Roblox baseado nesta ideia:

${ideiaLimpa}
`
    });

    const texto = resposta.output_text;

    if (!texto) {
      throw new Error("A IA não retornou conteúdo.");
    }

    // Tentar transformar a resposta em JSON
    let projeto;

    try {
      projeto = JSON.parse(texto);
    } catch (erro) {
      // Caso a IA tenha colocado algum texto extra
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");

      if (inicio === -1 || fim === -1) {
        throw new Error("A resposta da IA não é um JSON válido.");
      }

      projeto = JSON.parse(
        texto.substring(inicio, fim + 1)
      );
    }

    // Garantir estrutura mínima
    if (!projeto.game_name) {
      projeto.game_name = "Meu Jogo Roblox";
    }

    if (!projeto.description) {
      projeto.description = "Projeto criado pela IA.";
    }

    if (!Array.isArray(projeto.scripts)) {
      projeto.scripts = [];
    }

    return res.status(200).json(projeto);

  } catch (erro) {

    console.error("Erro:", erro);

    return res.status(500).json({
      error: "Não foi possível criar o jogo.",
      details: erro.message
    });
  }
};
