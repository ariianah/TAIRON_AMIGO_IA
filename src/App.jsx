import { useState, useRef, useEffect, useCallback } from "react";


const COLORS = {
  bgDeep: "#12142A",
  bgElevated2: "#252A4E",
  amber: "#E8A754",
  amberSoft: "#F5C883",
  cream: "#F1ECDD",
  muted: "#8A8FB0",
  mutedDim: "#5B5F82",
};
const MicIcon = ({ size =26, color = "currentColor"}) => (
  <svg width = {size} hig = {size} viee = "0 0 24 24" fill = "nose" strok= {color} strokeWidh ="2" strokeLinecap ="round" strokeLinejoin ="round">
    <path d=  "M12 1a3 3 0 0 0 -3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d= "M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1= "12" y1 ="19" x2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
  );
const SquareIcon = ({ size = 22, color ="currentColor" }) => (
  <svg width ={size} height ={size} viewBox = "0 0 24 24" fill={color}>
    <rect x="4" y="4" width = "16" height ="16" rx="2" />
  </svg>
);
  
const STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  SPEAKING: "speaking",
};

export default function App() {
  const [state, setState] = useState(STATES.IDLE);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setTranscript(finalText || interimText);
      if (finalText) handleUserSpeech(finalText);
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") setError("No pude escucharte bien. Probá de nuevo.");
      setState(STATES.IDLE);
    };

    recognition.onend = () => {
      setState((s) => (s === STATES.LISTENING ? STATES.IDLE : s));
    };

    recognitionRef.current = recognition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    if (!recognitionRef.current || state !== STATES.IDLE) return;
    setError(null);
    setTranscript("");
    setState(STATES.LISTENING);
    try {
      recognitionRef.current.start();
    } catch (e) {
      setState(STATES.IDLE);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const pickVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Preferencia 1: voz masculina en español colombiano
    const maleWords = ["male", "hombre", "masculin"];
    const isLikelyMale = (v) =>
      maleWords.some((w) => v.name.toLowerCase().includes(w)) ||
      /\b(carlos|juan|diego|jorge|miguel|pablo)\b/i.test(v.name);

    let candidate = voices.find((v) => v.lang === "es-CO" && isLikelyMale(v));
    if (candidate) return candidate;

    // Preferencia 2: cualquier voz es-CO
    candidate = voices.find((v) => v.lang === "es-CO");
    if (candidate) return candidate;

    // Preferencia 3: español latinoamericano genérico, masculino si se puede
    candidate =
      voices.find((v) => v.lang.startsWith("es-4") && isLikelyMale(v)) ||
      voices.find((v) => v.lang.startsWith("es-4"));
    if (candidate) return candidate;

    // Última opción: cualquier voz en español
    return voices.find((v) => v.lang.startsWith("es")) || null;
  }, []);

  const speak = useCallback(
    (text) => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = "es-CO";
      }
      utter.rate = 1.0;
      utter.pitch = 0.92;
      utter.onstart = () => setState(STATES.SPEAKING);
      utter.onend = () => setState(STATES.IDLE);
      utter.onerror = () => setState(STATES.IDLE);
      window.speechSynthesis.speak(utter);
    },
    [pickVoice]
  );

  const handleUserSpeech = async (text) => {
    setState(STATES.THINKING);
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!response.ok) throw new Error("bad response");
      const data = await response.json();
      const reply = data.reply || "Perdón, no te entendí bien. ¿Me lo decís de nuevo?";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (e) {
      setError("Tuve un problema para responder. Probá de nuevo.");
      setState(STATES.IDLE);
    }
  };

  const statusLabel = {
    [STATES.IDLE]: "Tocá para hablar",
    [STATES.LISTENING]: "Te escucho...",
    [STATES.THINKING]: "Pensando...",
    [STATES.SPEAKING]: "Hablando...",
  }[state];

  if (!supported) {
    return (
      <div style={{ ...wrap, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <p style={{ color: COLORS.cream, textAlign: "center" }}>
          Tu navegador no soporta reconocimiento ni síntesis de voz. Probá con Chrome en Android.
        </p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes pulseFast {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        @keyframes shimmer {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(3deg); }
        }
        @keyframes ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div style={header}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: COLORS.cream }}>
          Amigo
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.mutedDim }}>
          {messages.length > 0 ? `${messages.length} mensajes` : "nueva charla"}
        </span>
      </div>

      <div style={orbZone}>
        <div style={{ position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {state === STATES.LISTENING && (
            <>
              <div style={{ ...ringStyle, animationDelay: "0s" }} />
              <div style={{ ...ringStyle, animationDelay: "0.6s" }} />
            </>
          )}
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${COLORS.amberSoft}, ${COLORS.amber} 60%, #C17F32 100%)`,
              boxShadow: `0 0 40px 6px rgba(232,167,84,0.35)`,
              animation:
                state === STATES.LISTENING
                  ? "pulseFast 1s ease-in-out infinite"
                  : state === STATES.SPEAKING
                  ? "shimmer 0.5s ease-in-out infinite"
                  : state === STATES.THINKING
                  ? "shimmer 1.4s ease-in-out infinite"
                  : "breathe 3.4s ease-in-out infinite",
            }}
          />
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COLORS.muted, marginTop: 20, minHeight: 18 }}>
          {statusLabel}
        </p>
        {transcript && state === STATES.LISTENING && (
          <p style={{ fontSize: 15, color: COLORS.cream, marginTop: 8, textAlign: "center", maxWidth: 280 }}>
            {transcript}
          </p>
        )}
        {error && <p style={{ fontSize: 13, color: "#E08787", marginTop: 8 }}>{error}</p>}
      </div>

      <div style={logZone}>
        {messages.slice(-6).map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              background: m.role === "user" ? COLORS.bgElevated2 : "transparent",
              border: m.role === "user" ? "none" : `1px solid ${COLORS.bgElevated2}`,
              color: COLORS.cream,
              fontSize: 14,
              padding: "8px 13px",
              borderRadius: 14,
              maxWidth: "82%",
              lineHeight: 1.4,
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={controlZone}>
        <button
          onClick={state === STATES.LISTENING ? stopListening : startListening}
          disabled={state === STATES.THINKING || state === STATES.SPEAKING}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "none",
            background: state === STATES.LISTENING ? "#C4573F" : COLORS.amber,
            color: COLORS.bgDeep,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: state === STATES.THINKING || state === STATES.SPEAKING ? "default" : "pointer",
            opacity: state === STATES.THINKING || state === STATES.SPEAKING ? 0.5 : 1,
            boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
          }}
          aria-label={state === STATES.LISTENING ? "Detener" : "Hablar"}
        >
          {state === STATES.LISTENING ? <SquareIcon size={22} color={COLORS.bgDeep} /> : <MicIcon size={26} color={COLORS.bgDeep} />}
        </button>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  width: "100%",
  background: `linear-gradient(180deg, ${COLORS.bgDeep} 0%, #0E1024 100%)`,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  padding: "20px 22px 8px",
};

const orbZone = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px 20px 10px",
};

const logZone = {
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "10px 20px",
  minHeight: 90,
};

const controlZone = {
  display: "flex",
  justifyContent: "center",
  padding: "18px 0 34px",
};

const ringStyle = {
  position: "absolute",
  width: 130,
  height: 130,
  borderRadius: "50%",
  border: `2px solid ${COLORS.amberSoft}`,
  animation: "ring 1.6s ease-out infinite",
};
