module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(500).json({
  error: "Erro na API da IA.",
  details: dados
});
    });
  }

  try {
    const { ideia } = req.body || {};

    if (!ideia || typeof ideia !== "string") {
      return res.status(400).json({
        error: "Digite uma ideia para o jogo."
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY não configurada na Vercel."
      });
    }

    const resposta = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions: `
Você é uma IA especializada em criar projetos para Roblox Studio.

Transforme a ideia do usuário em um projeto Roblox.

Responda SOMENTE com JSON válido.

Formato obrigatório:

{
  "game_name": "Nome do jogo",
  "description": "Descrição do jogo",
  "scripts": [
    {
      "name": "NomeDoScript",
      "location": "ServerScriptService",
      "code": "código Luau"
    }
  ]
}

Gere código Luau simples, organizado e válido.
`,

          input:
            "Crie um projeto Roblox baseado nesta ideia:\n" +
            ideia.trim().slice(0, 5000)
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro OpenAI:", dados);

      return res.status(500).json({
        error: "Erro na API da IA.",
        details:
          dados.error?.message ||
          "Erro desconhecido."
      });
    }

    const texto = dados.output_text;

    if (!texto) {
      throw new Error(
        "A IA não retornou conteúdo."
      );
    }

    let projeto;

    try {
      projeto = JSON.parse(texto);
    } catch {
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");

      if (inicio === -1 || fim === -1) {
        throw new Error(
          "A resposta da IA não é um JSON válido."
        );
      }

      projeto = JSON.parse(
        texto.substring(inicio, fim + 1)
      );
    }

    return res.status(200).json(projeto);

  } catch (erro) {

    console.error(
      "Erro interno:",
      erro
    );

    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: erro.message
    });
  }
};
