import { supabase, testConnection, type StockControlWithItems, type StockItem } from "./supabase"

// Fallback a localStorage si Supabase no está disponible
let useSupabase = true

export const initializeStorage = async () => {
  try {
    const isConnected = await testConnection()
    useSupabase = isConnected
    console.log(useSupabase ? "🔥 Using Supabase" : "💾 Using localStorage fallback")
    return useSupabase
  } catch (error) {
    console.error("Storage initialization failed, using localStorage:", error)
    useSupabase = false
    return false
  }
}

// Funciones para controles
export const loadControls = async (): Promise<StockControlWithItems[]> => {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from("stock_controls")
        .select(`
          *,
          stock_items (*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error loading from Supabase, falling back to localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  const saved = localStorage.getItem("stockControls")
  if (saved) {
    try {
      const controls = JSON.parse(saved)
      // Convertir formato antiguo al nuevo
      return controls.map((control: any) => ({
        ...control,
        stock_items: control.items || [],
      }))
    } catch (error) {
      console.error("Error parsing localStorage data:", error)
      return []
    }
  }
  return []
}

export const createControl = async (
  name: string,
  createdBy: string,
  items: Omit<StockItem, "id" | "control_id" | "created_at" | "updated_at">[],
): Promise<StockControlWithItems> => {
  if (useSupabase) {
    try {
      // Crear el control
      const { data: control, error: controlError } = await supabase
        .from("stock_controls")
        .insert({
          name,
          created_by: createdBy,
        })
        .select()
        .single()

      if (controlError) throw controlError

      // Crear los items
      const itemsToInsert = items.map((item) => ({
        ...item,
        control_id: control.id,
      }))

      const { data: stockItems, error: itemsError } = await supabase.from("stock_items").insert(itemsToInsert).select()

      if (itemsError) throw itemsError

      return {
        ...control,
        stock_items: stockItems || [],
      }
    } catch (error) {
      console.error("Error creating in Supabase, falling back to localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  const newControl: StockControlWithItems = {
    id: `control_${Date.now()}`,
    name,
    created_by: createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stock_items: items.map((item, index) => ({
      ...item,
      id: `item_${Date.now()}_${index}`,
      control_id: `control_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  }

  const controls = await loadControls()
  const updatedControls = [newControl, ...controls]

  // Guardar en localStorage (formato antiguo para compatibilidad)
  const oldFormat = updatedControls.map((control) => ({
    ...control,
    items: control.stock_items,
  }))
  localStorage.setItem("stockControls", JSON.stringify(oldFormat))

  return newControl
}

export const updateItem = async (itemId: string, updates: Partial<StockItem>): Promise<void> => {
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from("stock_items")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)

      if (error) throw error
      return
    } catch (error) {
      console.error("Error updating in Supabase, falling back to localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  const controls = await loadControls()
  const updatedControls = controls.map((control) => ({
    ...control,
    stock_items: control.stock_items.map((item) =>
      item.id === itemId ? { ...item, ...updates, updated_at: new Date().toISOString() } : item,
    ),
  }))

  // Guardar en localStorage (formato antiguo)
  const oldFormat = updatedControls.map((control) => ({
    ...control,
    items: control.stock_items,
  }))
  localStorage.setItem("stockControls", JSON.stringify(oldFormat))
}

export const deleteControl = async (controlId: string): Promise<void> => {
  if (useSupabase) {
    try {
      const { error } = await supabase.from("stock_controls").delete().eq("id", controlId)
      if (error) throw error
      return
    } catch (error) {
      console.error("Error deleting from Supabase, falling back to localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  const controls = await loadControls()
  const updatedControls = controls.filter((control) => control.id !== controlId)

  // Guardar en localStorage (formato antiguo)
  const oldFormat = updatedControls.map((control) => ({
    ...control,
    items: control.stock_items,
  }))
  localStorage.setItem("stockControls", JSON.stringify(oldFormat))
}

// Función para suscribirse a cambios (solo funciona con Supabase)
export const subscribeToChanges = (callback: () => void) => {
  if (!useSupabase) return null

  const subscription = supabase
    .channel("stock_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "stock_controls" }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: "stock_items" }, callback)
    .subscribe()

  return subscription
}
