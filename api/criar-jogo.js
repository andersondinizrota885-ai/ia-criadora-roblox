<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IA Criadora Roblox</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background: #111;
      color: white;
      padding: 20px;
    }

    .container {
      max-width: 700px;
      margin: auto;
    }

    textarea {
      width: 100%;
      height: 180px;
      padding: 15px;
      box-sizing: border-box;
      border-radius: 10px;
      border: none;
      margin-bottom: 10px;
      font-size: 16px;
    }

    button {
      width: 100%;
      padding: 15px;
      border: none;
      border-radius: 10px;
      background: #5865f2;
      color: white;
      font-size: 18px;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.6;
    }

    #status {
      margin-top: 15px;
    }

    #result {
      margin-top: 20px;
    }

    pre {
      background: #222;
      padding: 15px;
      overflow-x: auto;
      border-radius: 10px;
      white-space: pre-wrap;
    }
  </style>
</head>

<body>

  <div class="container">
    <h1>🤖 IA Criadora Roblox</h1>

    <textarea
      id="gameIdea"
      placeholder="Digite a ideia do seu jogo..."
    ></textarea>

    <button id="createButton">
      🎮 Criar Jogo
    </button>

    <div id="status"></div>
    <div id="result"></div>
  </div>

  <script>
    const API_URL = "/api/criar-jogo";

    const button = document.getElementById("createButton");
    const idea = document.getElementById("gameIdea");
    const status = document.getElementById("status");
    const result = document.getElementById("result");

    button.addEventListener("click", async () => {
      const ideia = idea.value.trim();

      if (!ideia) {
        status.textContent = "❌ Digite uma ideia primeiro.";
        return;
      }

      button.disabled = true;
      status.textContent = "⏳ Criando seu jogo...";
      result.innerHTML = "";

      try {
        const resposta = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ideia: ideia
          })
        });

        const texto = await resposta.text();

        let dados;

        try {
          dados = JSON.parse(texto);
        } catch {
          throw new Error(texto);
        }

        if (!resposta.ok) {
          throw new Error(
            dados.error || "Erro no servidor."
          );
        }

        status.textContent = "✅ Jogo criado!";

        result.innerHTML = `
          <h2>${dados.game_name || "Meu Jogo"}</h2>
          <p>${dados.description || ""}</p>
        `;

        if (Array.isArray(dados.scripts)) {
          dados.scripts.forEach(script => {

            result.innerHTML += `
              <h3>${script.name || "Script"}</h3>
              <p>
                <b>Local:</b>
                ${script.location || "ServerScriptService"}
              </p>

              <pre>${script.code || ""}</pre>
            `;
          });
        }

      } catch (erro) {

        status.textContent =
          "❌ Erro: " + erro.message;

      } finally {

        button.disabled = false;
      }
    });
  </script>

</body>
</html>
