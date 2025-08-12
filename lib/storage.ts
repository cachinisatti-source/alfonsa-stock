import {
  supabase,
  testConnection,
  getConnectionInfo,
  getSupabaseClient,
  type StockControlWithItems,
  type StockItem,
} from "./supabase"

// Sistema de almacenamiento híbrido automático con soporte para sucursales
let useSupabase = true
let storageInitialized = false
let realtimeSubscription: any = null

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

// Obtener sucursal actual
const getCurrentBranch = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("currentBranch") || "betbeder"
  }
  return "betbeder"
}

// Auto-retry para operaciones de Supabase
const withRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
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

export const loadControls = async (): Promise<StockControlWithItems[]> => {
  await initializeStorage()
  const currentBranch = getCurrentBranch()

  if (useSupabase) {
    try {
      console.log(`📥 Loading controls from Supabase for branch: ${currentBranch}...`)

      const result = await withRetry(async () => {
        const table = await supabase.from("stock_controls")
        const { data, error } = await table
          .select(`
            *,
            stock_items (*)
          `)
          .eq("branch", currentBranch)
          .order("created_at", { ascending: false })

        if (error) throw error
        return data || []
      })

      console.log("✅ Loaded", result.length, `controls from Supabase for ${currentBranch}`)
      return result
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  console.log(`📥 Loading controls from localStorage for branch: ${currentBranch}...`)
  const saved = localStorage.getItem(`stockControls_${currentBranch}`)
  if (saved) {
    try {
      const controls = JSON.parse(saved)
      const converted = controls.map((control: any) => ({
        ...control,
        stock_items: control.items || control.stock_items || [],
      }))
      console.log("✅ Loaded", converted.length, `controls from localStorage for ${currentBranch}`)
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
  const currentBranch = getCurrentBranch()

  if (useSupabase) {
    try {
      console.log(`📤 Creating control in Supabase for branch ${currentBranch}:`, name)

      const result = await withRetry(async () => {
        // Crear el control con sucursal
        const controlsTable = await supabase.from("stock_controls")
        const { data: control, error: controlError } = await controlsTable
          .insert({
            name,
            created_by: createdBy,
            branch: currentBranch,
          })
          .select()
          .single()

        if (controlError) throw controlError

        // Crear los items
        const itemsToInsert = items.map((item) => ({
          ...item,
          control_id: control.id,
        }))

        const itemsTable = await supabase.from("stock_items")
        const { data: stockItems, error: itemsError } = await itemsTable.insert(itemsToInsert).select()

        if (itemsError) throw itemsError

        return {
          ...control,
          stock_items: stockItems || [],
        }
      })

      console.log(`✅ Control created in Supabase for ${currentBranch}`)
      return result
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  console.log(`📤 Creating control in localStorage for branch ${currentBranch}:`, name)
  const newControl: StockControlWithItems = {
    id: `control_${Date.now()}`,
    name,
    created_by: createdBy,
    branch: currentBranch,
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
  localStorage.setItem(`stockControls_${currentBranch}`, JSON.stringify(updatedControls))

  console.log(`✅ Control created in localStorage for ${currentBranch}`)
  return newControl
}

export const updateItem = async (itemId: string, updates: Partial<StockItem>): Promise<void> => {
  await initializeStorage()
  const currentBranch = getCurrentBranch()

  if (useSupabase) {
    try {
      await withRetry(async () => {
        const table = await supabase.from("stock_items")
        const { error } = await table
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId)

        if (error) throw error
      })

      console.log(`✅ Item updated in Supabase for ${currentBranch}`)
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

  localStorage.setItem(`stockControls_${currentBranch}`, JSON.stringify(updatedControls))
  console.log(`✅ Item updated in localStorage for ${currentBranch}`)
}

export const deleteControl = async (controlId: string): Promise<void> => {
  await initializeStorage()
  const currentBranch = getCurrentBranch()

  if (useSupabase) {
    try {
      await withRetry(async () => {
        const table = await supabase.from("stock_controls")
        const { error } = await table.delete().eq("id", controlId)
        if (error) throw error
      })

      console.log(`✅ Control deleted from Supabase for ${currentBranch}`)
      return
    } catch (error) {
      console.error("❌ Supabase failed, using localStorage:", error)
      useSupabase = false
    }
  }

  // Fallback a localStorage
  const controls = await loadControls()
  const updatedControls = controls.filter((control) => control.id !== controlId)
  localStorage.setItem(`stockControls_${currentBranch}`, JSON.stringify(updatedControls))
  console.log(`✅ Control deleted from localStorage for ${currentBranch}`)
}

export const subscribeToChanges = (callback: () => void) => {
  if (!useSupabase) {
    console.log("📡 Real-time subscriptions not available (localStorage mode)")
    return null
  }

  const currentBranch = getCurrentBranch()
  console.log(`📡 Setting up real-time subscriptions for branch: ${currentBranch}...`)

  // Limpiar suscripción anterior si existe
  if (realtimeSubscription) {
    realtimeSubscription.unsubscribe()
  }

  // Usar el cliente de Supabase de forma asíncrona
  const setupSubscription = async () => {
    try {
      const client = await getSupabaseClient()

      realtimeSubscription = client
        .channel(`stock_changes_${currentBranch}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "stock_controls",
            filter: `branch=eq.${currentBranch}`,
          },
          (payload: any) => {
            console.log(
              `🔄 Stock control changed in ${currentBranch}:`,
              payload.eventType,
              payload.new?.name || payload.old?.name,
            )
            callback()
          },
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "stock_items" }, (payload: any) => {
          console.log(
            `🔄 Stock item changed in ${currentBranch}:`,
            payload.eventType,
            payload.new?.codigo || payload.old?.codigo,
          )
          callback()
        })
        .subscribe((status: string) => {
          console.log(`📡 Real-time subscription status for ${currentBranch}:`, status)
          if (status === "SUBSCRIBED") {
            console.log(`🎉 Real-time sync is now active for ${currentBranch}!`)
          }
        })

      return realtimeSubscription
    } catch (error) {
      console.error("❌ Failed to setup subscription:", error)
      return null
    }
  }

  // Setup subscription asynchronously
  setupSubscription()

  return {
    unsubscribe: () => {
      if (realtimeSubscription) {
        realtimeSubscription.unsubscribe()
        realtimeSubscription = null
        console.log(`📡 Real-time subscription unsubscribed for ${currentBranch}`)
      }
    },
  }
}

export const getStorageStatus = async () => {
  await initializeStorage()
  const currentBranch = getCurrentBranch()

  if (useSupabase) {
    const info = await getConnectionInfo()
    return {
      type: "supabase" as const,
      configName: info.configName,
      realTime: true,
      branch: currentBranch,
    }
  }
  return {
    type: "localStorage" as const,
    configName: "Local Storage",
    realTime: false,
    branch: currentBranch,
  }
}

// Función para obtener información de la sucursal actual
export const getCurrentBranchInfo = () => {
  const currentBranch = getCurrentBranch()
  const branches = {
    betbeder: { name: "Betbeder", color: "blue" },
    iseas: { name: "Iseas", color: "green" },
    llerena: { name: "Llerena", color: "purple" },
  }

  return branches[currentBranch as keyof typeof branches] || branches.betbeder
}
