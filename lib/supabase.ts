import { createClient } from "@supabase/supabase-js"
import { getActiveSupabaseConfig } from "./auto-supabase"

let supabaseClient: any = null
let initializationPromise: Promise<any> | null = null

const initializeSupabase = async () => {
  // Si ya está inicializando, esperar a que termine
  if (initializationPromise) {
    return initializationPromise
  }

  // Si ya está inicializado, devolverlo
  if (supabaseClient) {
    return supabaseClient
  }

  console.log("🚀 Initializing Supabase...")

  initializationPromise = (async () => {
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

      console.log("✅ Supabase initialized successfully")
      return supabaseClient
    } catch (error) {
      console.error("❌ Failed to initialize Supabase:", error)
      initializationPromise = null // Reset para permitir reintentos
      throw error
    }
  })()

  return initializationPromise
}

// Función para obtener el cliente inicializado
export const getSupabaseClient = async () => {
  return await initializeSupabase()
}

// Export directo del cliente (se inicializa automáticamente)
export const supabase = {
  from: async (table: string) => {
    const client = await initializeSupabase()
    return client.from(table)
  },
  channel: (name: string) => {
    // Return a promise that resolves to the channel
    return initializeSupabase().then((client) => client.channel(name))
  },
  auth: {
    getUser: async () => {
      const client = await initializeSupabase()
      return client.auth.getUser()
    },
  },
}

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
  try {
    await initializeSupabase()
    const { getActiveConfigName, getConnectionStatus } = await import("./auto-supabase")
    return {
      isConnected: !!supabaseClient,
      configName: getActiveConfigName(),
      status: getConnectionStatus(),
    }
  } catch (error) {
    return {
      isConnected: false,
      configName: "Error",
      status: "error",
    }
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
