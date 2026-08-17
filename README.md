# Amigo — asistente de voz

App web (PWA) que escucha por voz y responde con la personalidad de un amigo cálido.
Pensada para instalarse en la pantalla de inicio de un celular Android.

## Pasos para desplegar

1. **Crear el repo en GitHub** y subir todos estos archivos manteniendo la
   misma estructura de carpetas (`src/`, `api/`, `public/`).
   - Si usás el editor web de GitHub: al crear un archivo nuevo, escribí la
     ruta completa (ej. `src/App.jsx`) y GitHub crea las carpetas solo.

2. **Conectar el repo a Vercel** (Importar proyecto → elegir el repo).
   Vercel detecta que es un proyecto Vite automáticamente.

3. **Agregar la API key como variable de entorno en Vercel:**
   - Vercel → tu proyecto → Settings → Environment Variables
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: tu API key de [console.anthropic.com](https://console.anthropic.com)
   - Guardar y volver a desplegar (Redeploy)

4. **Abrir la URL de Vercel desde Chrome en tu Android.**
   - Menú (⋮) → "Agregar a pantalla de inicio" / "Instalar app"
   - Se abre en pantalla completa como una app nativa.

## Notas

- El reconocimiento y síntesis de voz (`SpeechRecognition` /
  `SpeechSynthesis`) son APIs del navegador — funcionan en Chrome Android,
  no en todos los navegadores.
- La conversación se guarda solo en memoria mientras la pestaña está
  abierta (no persiste entre sesiones). Si querés que recuerde charlas
  entre sesiones, el siguiente paso sería sumar una base de datos
  (por ejemplo Supabase) — lo podemos armar después.
- Los íconos `icon-192.png` e `icon-512.png` referenciados en
  `manifest.json` no vienen incluidos; podés generarlos con cualquier
  imagen cuadrada (por ejemplo en https://realfavicongenerator.net) y
  subirlos a `public/`.
