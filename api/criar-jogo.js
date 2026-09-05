module.exports = async function handler(req, res) {
  try {
    console.log("FUNCAO INICIOU");

    const apiKey = process.env.GEMINI_API_KEY;

    console.log("CHAVE EXISTE:", !!apiKey);

    return res.status(200).json({
      sucesso: true,
      mensagem: "A função Vercel está funcionando!",
      chaveConfigurada: !!apiKey
    });

  } catch (erro) {
    console.error("ERRO:", erro);

    return res.status(500).json({
      error: erro.message
    });
  }
};
