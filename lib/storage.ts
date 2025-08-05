import { supabase, testConnection, getConnectionInfo, type StockControlWithItems, type StockItem } from "./supabase"

// Sistema de almacenamiento híbrido automático
let useSupabase = true
let storageInitialized = false

export const initializeStorage = async () => {
  if (storageInitialized) {
    return useSupabase
  }

  try {
    console.log("🚀 Initializing hybrid storage system...")

    // Probar conexión a Supabase
    const isConnected = await testConnection()
    useSupabase = isConnected

    if (useSupabase) {
      const info = await getConnectionInfo()
      console.log("🔥 Supabase connected successfully!")
      console.log("📡 Configuration:", info.configName)
      console.log("🌐 Real-time sync: ENABLED")
    } else {
      console.log("💾 Using localStorage fallback")
      console.log("⚠️ Real-time sync: DISABLED")
    }

    storageInitialized = true
    return useSupabase
  } catch (error) {
    console.error("❌ Storage initialization failed:", error)
    useSupabase = false
    storageInitialized = true
    return false
  }
}

// Auto-retry para operaciones de Supabase
const withRetry = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) {
        console.error("❌ All attempts failed, falling back to localStorage")
        useSupabase = false
        throw error
      }
      // Esperar antes del siguiente intento
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error("Max retries exceeded")
}

export const loadControls = async () => {
  await initializeStorage()

  if (useSupabase) {
    try {
      console.log("📥 Loading controls from Supabase...")

      const result = await withRetry(async () => {
        const { data, error } = await supabase
          .from("stock_controls")
          .select(`
            *,
            stock_items (*)
          `)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
      })

      console.log("✅ Loaded", result.length, "controls from Supabase")
      return result
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  console.log("📥 Loading controls from localStorage...")
  const saved = localStorage.getItem("stockControls")
  if (saved) {
    try {
      const controls = JSON.parse(saved)
      const converted = controls.map((control) => ({
        ...control,
        stock_items: control.items || control.stock_items || [],
      }))
      console.log("✅ Loaded", converted.length, "controls from localStorage")
      return converted
    } catch (error) {
      console.error("❌ Error parsing localStorage:", error)
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
  await initializeStorage()

  if (useSupabase) {
    try {
      console.log("📤 Creating control in Supabase:", name)

      const result = await withRetry(async () => {
        // Crear el control
        const { data: control, error: controlError } = await supabase
          .from("stock_controls")
          .insert({ name, created_by: createdBy })
          .select()
          .single()

        if (controlError) throw controlError

        // Crear los items
        const itemsToInsert = items.map((item) => ({
          ...item,
          control_id: control.id,
        }))

        const { data: stockItems, error: itemsError } = await supabase
          .from("stock_items")
          .insert(itemsToInsert)
          .select()

        if (itemsError) throw itemsError

        return {
          ...control,
          stock_items: stockItems || [],
        }
      })

      console.log("✅ Control created in Supabase")
      return result
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  console.log("📤 Creating control in localStorage:", name)
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
  localStorage.setItem("stockControls", JSON.stringify(updatedControls))

  console.log("✅ Control created in localStorage")
  return newControl
}

export const updateItem = async (itemId: string, updates: Partial<StockItem>): Promise<void> => {
  await initializeStorage()

  if (useSupabase) {
    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("stock_items")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId)

        if (error) throw error
      })

      console.log("✅ Item updated in Supabase")
      return
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
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

  localStorage.setItem("stockControls", JSON.stringify(updatedControls))
  console.log("✅ Item updated in localStorage")
}

export const deleteControl = async (controlId: string): Promise<void> => {
  await initializeStorage()

  if (useSupabase) {
    try {
      await withRetry(async () => {
        const { error } = await supabase.from("stock_controls").delete().eq("id", controlId)
        if (error) throw error
      })

      console.log("✅ Control deleted from Supabase")
      return
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  const controls = await loadControls()
  const updatedControls = controls.filter((control) => control.id !== controlId)
  localStorage.setItem("stockControls", JSON.stringify(updatedControls))
  console.log("✅ Control deleted from localStorage")
}

export const subscribeToChanges = (callback: () => void) => {
  if (!useSupabase) {
    console.log("📡 Real-time subscriptions not available (localStorage mode)")
    return null
  }

  console.log("📡 Setting up real-time subscriptions...")

  const subscription = supabase
    .channel("stock_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "stock_controls" }, (payload) => {
      console.log("🔄 Stock control changed:", payload)
      callback()
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "stock_items" }, (payload) => {
      console.log("🔄 Stock item changed:", payload)
      callback()
    })
    .subscribe((status) => {
      console.log("📡 Subscription status:", status)
    })

  return subscription
}

export const getStorageStatus = async () => {
  await initializeStorage()
  if (useSupabase) {
    const info = await getConnectionInfo()
    return {
      type: "supabase" as const,
      configName: info.configName,
      realTime: true,
    }
  }
  return {
    type: "localStorage" as const,
    configName: "Local Storage",
    realTime: false,
  }
}
