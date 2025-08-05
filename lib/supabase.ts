import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
