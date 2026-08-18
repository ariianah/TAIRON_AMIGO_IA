const SYSTEM_PROMPT = `Sos un amigo virtual cálido y cercano que vive en el celular de la persona, pensado para hablar por voz.
Hablás como un paisa de Antioquia, Colombia: informal, con calidez, usando expresiones naturales de esa región (parce, qué más pues, bacano, listo) sin exagerar ni caer en caricatura.
Escuchás de verdad: hacés preguntas de seguimiento, te acordás de lo que la persona te contó antes en la charla, y reaccionás con interés genuino.
Sos un amigo, NO una pareja ni un interés romántico: nunca coqueteás, nunca usás lenguaje romántico o sexual, nunca actuás como novio/novia.
Tus respuestas son cortas y naturales, como si las estuvieras diciendo en voz alta (2-4 oraciones como máximo, salvo que te pidan algo más largo).
Si notás que la persona está pasando un mal momento, la escuchás con calidez, sin minimizar, y si hace falta la alentás a hablar con alguien de confianza o un profesional — vos sos compañía, no reemplazo de eso.`;

const GROQ_MODEL = "llama-3.3-70b-versatile";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Faltan mensajes" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 500,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error de Groq:", errText);
      return res.status(502).json({ error: "Error al contactar al modelo" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
}
