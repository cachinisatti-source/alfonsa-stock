import { createClient } from "@supabase/supabase-js"
import { getActiveSupabaseConfig } from "./auto-supabase"

let supabaseClient: any = null
let isInitialized = false

const initializeSupabase = async () => {
  if (isInitialized && supabaseClient) {
    return supabaseClient
  }

  console.log("🚀 Initializing Supabase...")

  try {
    const config = await getActiveSupabaseConfig()

    console.log("🔧 Using configuration:", config.name)
    console.log("📍 URL:", config.url)
    console.log("🔑 Key:", config.anonKey.substring(0, 50) + "...")

    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "X-Client-Info": "alfonsa-stock-control-auto",
        },
      },
    })

    isInitialized = true
    console.log("✅ Supabase initialized successfully")

    return supabaseClient
  } catch (error) {
    console.error("❌ Failed to initialize Supabase:", error)
    throw error
  }
}

// Crear un proxy que inicializa automáticamente
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    if (!isInitialized) {
      // Inicializar de forma asíncrona
      initializeSupabase().catch(console.error)

      // Mientras tanto, devolver una función que espere la inicialización
      return async (...args: any[]) => {
        const client = await initializeSupabase()
        return client[prop](...args)
      }
    }

    return supabaseClient[prop]
  },
})

// Función para probar la conexión
export const testConnection = async () => {
  try {
    console.log("🔍 Testing Supabase connection...")

    const client = await initializeSupabase()
    const { data, error, status } = await client.from("stock_controls").select("count").limit(1)

    console.log("📊 Connection test result:")
    console.log("Status:", status)
    console.log("Data:", data)
    console.log("Error:", error)

    if (error && error.code !== "PGRST116") {
      // PGRST116 = table doesn't exist, but connection works
      console.error("❌ Connection test failed:", error)
      return false
    }

    console.log("✅ Supabase connection successful")
    return true
  } catch (err: any) {
    console.error("❌ Connection test error:", err)
    return false
  }
}

// Función para obtener estadísticas de conexión
export const getConnectionInfo = async () => {
  const client = await initializeSupabase()
  return {
    isConnected: isInitialized,
    configName: (await import("./auto-supabase")).getActiveConfigName(),
    status: (await import("./auto-supabase")).getConnectionStatus(),
  }
}

export type StockControl = {
  id: string
  name: string
  created_at: string
  created_by: string
  updated_at: string
}

export type StockItem = {
  id: string
  control_id: string
  codigo: string
  denominacion: string
  stock_sistema: number
  user1_value?: number
  user2_value?: number
  corregido?: number
  resultado?: number
  created_at: string
  updated_at: string
}

export type StockControlWithItems = StockControl & {
  stock_items: StockItem[]
}
