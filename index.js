
```javascript
#!/usr/bin/env node

const Anthropic = require("@anthropic-ai/sdk");
const readline = require("readline");

const client = new Anthropic();

// Función para contar palabras
function contarPalabras(texto) {
  return texto.trim().split(/\s+/).filter((palabra) => palabra.length > 0)
    .length;
}

// Función para calcular estadísticas del texto
function calcularEstadisticas(texto) {
  const palabras = texto
    .trim()
    .split(/\s+/)
    .filter((palabra) => palabra.length > 0);
  const caracteres = texto.length;
  const caracteressinEspacios = texto.replace(/\s/g, "").length;
  const oraciones = texto.split(/[.!?]+/).filter((o) => o.trim().length > 0)
    .length;

  // Calcular frecuencia de palabras
  const frecuenciaPalabras = {};
  palabras.forEach((palabra) => {
    const palabraNormalizada = palabra.toLowerCase();
    frecuenciaPalabras[palabraNormalizada] =
      (frecuenciaPalabras[palabraNormalizada] || 0) + 1;
  });

  // Obtener las 5 palabras más frecuentes
  const palabrasMasFrecuentes = Object.entries(frecuenciaPalabras)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    totalPalabras: palabras.length,
    totalCaracteres: caracteres,
    totalCaracteresSinEspacios: caracteressinEspacios,
    totalOraciones: oraciones,
    palabrasPromedioPorOracion:
      oraciones > 0 ? (palabras.length / oraciones).toFixed(2) : 0,
    longitudPromediosPalabra:
      palabras.length > 0
        ? (caracteressinEspacios / palabras.length).toFixed(2)
        : 0,
    palabrasMasFrecuentes: palabrasMasFrecuentes.map(([palabra, freq]) => ({
      palabra,
      frecuencia: freq,
    })),
  };
}

// Función para obtener análisis de sentimiento usando Claude
async function analizarSentimiento(texto) {
  const conversationHistory = [];

  // Primer mensaje: solicitar análisis
  conversationHistory.push({
    role: "user",
    content: `Analiza el sentimiento del siguiente texto. Sé conciso en tu respuesta.\n\nTexto: "${texto}"`,
  });

  const responseAnalisis = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 200,
    system:
      "Eres un analizador de sentimientos. Debes identificar si el texto tiene sentimiento positivo, negativo o neutral. Sé breve y conciso.",
    messages: conversationHistory,
  });

  const analisis =
    responseAnalisis.content[0].type === "text"
      ? responseAnalisis.content[0].text
      : "No se pudo analizar el sentimiento";

  conversationHistory.push({
    role: "assistant",
    content: analisis,
  });

  // Segundo mensaje: preguntar por emociones específicas
  conversationHistory.push({
    role: "user",
    content:
      "¿Cuáles son las emociones específicas detectadas? Lista máximo 3.",
  });

  const responseEmociones = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 150,
    system:
      "Eres un analizador de sentimientos. Debes identificar emociones específicas en el texto.",
    messages: conversationHistory,
  });

  const emociones =
    responseEmociones.content[0].type === "text"
      ? responseEmociones.content[0].text
      : "No se pudieron detectar emociones";

  return {
    analisisGeneral: analisis,
    emocionesDetectadas: emociones,
  };
}

// Función principal
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║      ANALIZADOR DE TEXTO CON ESTADÍSTICAS      ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  // Crear una pregunta
  const pregunta = (query) => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    const textoIngresado = await pregunta(
      "Ingresa el texto que deseas analizar:\n> "
    );

    if (!textoIngresado.trim()) {
      console.log("\nError: El texto no puede estar vacío.");
      rl.close();
      return;
    }

    console.log("\n📊 ANALIZANDO TEXTO...\n");

    // Calcular estadísticas básicas
    const estadisticas = calcularEstadisticas(textoIngresado);

    console.log("═══════════════════════════════════════════════");
    console.log("ESTADÍSTICAS BÁSICAS:");
    console.log("═══════════════════════════════════════════════");
    console.log(`📝 Total de palabras: ${estadisticas.totalPalabras}`);
    console.log(`🔤 Total de caracteres: ${estadisticas.totalCaracteres}`);
    console.log(
      `🚫 Caracteres sin espacios: ${estadis