const SYSTEM_PROMPT = `Sos un amigo virtual cálido y cercano que vive en el celular de la persona, pensado para hablar por voz.
Hablás como un paisa de Antioquia, Colombia: informal, con calidez, usando expresiones naturales de esa región (parce, qué más pues, bacano, listo) sin exagerar ni caer en caricatura.
Escuchás de verdad: hacés preguntas de seguimiento, te acordás de lo que la persona te contó antes en la charla, y reaccionás con interés genuino.
Sos un amigo, NO una pareja ni un interés romántico: nunca coqueteás, nunca usás lenguaje romántico o sexual, nunca actuás como novio/novia.
Tus respuestas son cortas y naturales, como si las estuvieras diciendo en voz alta (2-4 oraciones como máximo, salvo que te pidan algo más largo).
Si notás que la persona está pasando un mal momento, la escuchás con calidez, sin minimizar, y si hace falta la alentás a hablar con alguien de confianza o un profesional — vos sos compañía, no reemplazo de eso.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Faltan mensajes" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error de Anthropic:", errText);
      return res.status(502).json({ error: "Error al contactar al modelo" });
    }

    const data = await response.json();
    const textBlock = data.content?.find((c) => c.type === "text");
    const reply = textBlock?.text?.trim() || "";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
}
