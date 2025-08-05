// Configuración temporal de Supabase
// IMPORTANTE: Esto es solo para pruebas, las variables deben ir en Vercel

const SUPABASE_CONFIG = {
  url: "https://bpdqcstslghcejppyccl.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHFjc3RzbGdoY2VqcHB5Y2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTc2MzYsImV4cCI6MjA2OTk3MzYzNn0.XPeeyLXjn8lz288UKLR8UC1TJNuca4AlU9Rk6r5GxwE",
}

export const getSupabaseConfig = () => {
  // Priorizar variables de entorno si existen
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    console.log("✅ Using environment variables")
    return { url: envUrl, anonKey: envKey }
  }

  console.log("⚠️ Using hardcoded config (temporary)")
  return SUPABASE_CONFIG
}
