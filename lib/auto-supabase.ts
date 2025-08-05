// Configuración automática de Supabase
// Se conecta automáticamente sin necesidad de configuración manual

interface SupabaseCredentials {
  url: string
  anonKey: string
  name: string
}

// Múltiples configuraciones de respaldo
const SUPABASE_CONFIGS: SupabaseCredentials[] = [
  {
    name: "Alfonsa Primary",
    url: "https://bpdqcstslghcejppyccl.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHFjc3RzbGdoY2VqcHB5Y2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTc2MzYsImV4cCI6MjA2OTk3MzYzNn0.XPeeyLXjn8lz288UKLR8UC1TJNuca4AlU9Rk6r5GxwE",
  },
  {
    name: "Alfonsa Backup",
    url: "https://xvwqkqjvvddqhxzhyabc.supabase.co",
    anonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2d3FrcWp2dmRkcWh4emh5YWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTc4MjAsImV4cCI6MjA2OTk3MzgyMH0.8vQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ",
  },
]

let activeConfig: SupabaseCredentials | null = null
let connectionTested = false

export const getActiveSupabaseConfig = async (): Promise<SupabaseCredentials> => {
  // Si ya tenemos una configuración activa, usarla
  if (activeConfig && connectionTested) {
    return activeConfig
  }

  console.log("🔍 Auto-detecting Supabase configuration...")

  // 1. Intentar variables de entorno primero
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    console.log("✅ Found environment variables")
    const envConfig = { name: "Environment", url: envUrl, anonKey: envKey }

    if (await testConfig(envConfig)) {
      activeConfig = envConfig
      connectionTested = true
      return activeConfig
    }
  }

  // 2. Probar configuraciones predefinidas
  for (const config of SUPABASE_CONFIGS) {
    console.log(`🔄 Testing ${config.name}...`)

    if (await testConfig(config)) {
      console.log(`✅ ${config.name} is working!`)
      activeConfig = config
      connectionTested = true
      return activeConfig
    }

    console.log(`❌ ${config.name} failed`)
  }

  // 3. Si nada funciona, usar la primera como fallback
  console.log("⚠️ Using fallback configuration")
  activeConfig = SUPABASE_CONFIGS[0]
  return activeConfig
}

const testConfig = async (config: SupabaseCredentials): Promise<boolean> => {
  try {
    const response = await fetch(`${config.url}/rest/v1/`, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    })

    return response.status === 200 || response.status === 404 // 404 is OK, means API is responding
  } catch (error) {
    return false
  }
}

// Función para obtener el estado de la conexión
export const getConnectionStatus = () => {
  if (!activeConfig) return "not-tested"
  if (!connectionTested) return "testing"
  return "connected"
}

export const getActiveConfigName = () => {
  return activeConfig?.name || "Unknown"
}
