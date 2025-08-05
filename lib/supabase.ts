import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase configuration missing:")
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing")
  throw new Error("Missing Supabase environment variables")
}

console.log("🔧 Supabase config:")
console.log("URL:", supabaseUrl)
console.log("Key:", supabaseAnonKey?.substring(0, 20) + "...")

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Deshabilitamos auth por ahora
  },
})

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from("stock_controls").select("count").limit(1)
    if (error) {
      console.error("❌ Supabase connection test failed:", error)
      return false
    }
    console.log("✅ Supabase connection successful")
    return true
  } catch (err) {
    console.error("❌ Supabase connection error:", err)
    return false
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
