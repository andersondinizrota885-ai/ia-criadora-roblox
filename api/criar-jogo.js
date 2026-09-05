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
- Gere scripts Luau completos e funcionais.
- Use somente APIs reais do Roblox.
- Informe onde cada script deve ser colocado.
- Não invente APIs inexistentes.

A resposta deve seguir exatamente esta estrutura:

{
  "game_name": "Nome do jogo",
  "description": "Descrição do jogo",
  "genre": "Gênero",
  "objective": "Objetivo principal",

  "map": {
    "description": "Descrição completa do mapa",
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

    // Modelos para tentar.
    // Se o primeiro estiver temporariamente sobrecarregado,
    // tentamos o próximo.
    const modelos = [
      "gemini-3.6-flash",
      "gemini-3.6-flash-lite"
    ];

    let ultimoErro = null;

    for (const modelo of modelos) {
      for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
          console.log(
            `Tentando Gemini: ${modelo} | tentativa ${tentativa}`
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
            `Gemini ${modelo} respondeu com status ${resposta.status}`
          );

          // Se deu certo
          if (resposta.ok) {
            const texto =
              dados?.candidates?.[0]?.content?.parts?.[0]?.text;

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
                "JSON retornado pela Gemini:",
                texto
              );

              ultimoErro =
                "A Gemini retornou um JSON inválido.";

              continue;
            }

            console.log(
              "Projeto criado com sucesso!"
            );

            return res.status(200).json(projeto);
          }

          const mensagem =
            dados?.error?.message ||
            "Erro desconhecido na Gemini.";

          ultimoErro = mensagem;

          console.error(
            `Erro Gemini ${modelo}:`,
            mensagem
          );

          // Erros que não adianta repetir
          if (
            resposta.status === 400 ||
            resposta.status === 401 ||
            resposta.status === 403
          ) {
            return res.status(500).json({
              error: "Erro na configuração da Gemini.",
              details: mensagem
            });
          }

          // Se for erro temporário, espera e tenta novamente
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
            const espera = tentativa * 2000;

            console.log(
              `Servidor ocupado. Esperando ${espera}ms...`
            );

            await new Promise(resolve =>
              setTimeout(resolve, espera)
            );

            continue;
          }

          // Modelo não disponível:
          // pula para o próximo modelo
          if (resposta.status === 404) {
            break;
          }

          break;

        } catch (erro) {
          console.error(
            "Erro na tentativa:",
            erro
          );

          ultimoErro = erro.message;

          // Pequena espera antes de tentar novamente
          await new Promise(resolve =>
            setTimeout(resolve, tentativa * 2000)
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
      "ERRO_INTERNO:",
      erro
    );

    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: erro.message
    });
  }
};
