"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Download,
  Eye,
  Package,
  ArrowLeft,
  Save,
  Plus,
  Users,
  BarChart3,
  Trash2,
  Menu,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import {
  initializeStorage,
  loadControls as loadControlsLib,
  createControl,
  updateItem,
  deleteControl,
  subscribeToChanges,
  type StockControlWithItems,
  getCurrentBranchInfo,
} from "@/lib/storage"
import { useUserNames } from "@/hooks/use-user-names"

import * as XLSX from "xlsx"

interface StockControl {
  id: string
  userId: string
  userName: string
  stockData: string
  timestamp: string
  verified: boolean
  branchName?: string
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<{
    id: string
    name: string
    role: "lider" | "user1" | "user2"
  } | null>(null)
  const [stockText, setStockText] = useState("")
  const [showResults, setShowResults] = useState(true)
  const [stockControls, setStockControls] = useState<StockControlWithItems[]>([])
  const [currentControl, setCurrentControl] = useState<StockControlWithItems | null>(null)
  const [controlName, setControlName] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [storageStatus, setStorageStatus] = useState<"supabase" | "localStorage" | "loading">("loading")
  const [branchInfo, setBranchInfo] = useState<{ name: string; color: string }>({ name: "Betbeder", color: "blue" })
  const [userRole, setUserRole] = useState<"leader" | "user">("user")
  const [userName, setUserName] = useState("")
  const [controls, setControls] = useState<StockControl[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Estados para manejar inputs con debounce
  const [localInputs, setLocalInputs] = useState<{ [key: string]: string }>({})
  const [saveTimeouts, setSaveTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({})

  // Hook para obtener nombres de usuarios actualizados
  const { user1Name, user2Name } = useUserNames()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user)
      setCurrentUser(parsedUser)
      setUserRole(parsedUser.role)
      setUserName(parsedUser.name)
      if (parsedUser.role !== "lider") {
        window.location.href = "/verification"
        return
      }
    } else {
      window.location.href = "/"
      return
    }

    // Cargar información de sucursal
    const branchData = getCurrentBranchInfo()
    setBranchInfo(branchData)

    // Inicializar storage y cargar datos
    const init = async () => {
      try {
        const useSupabase = await initializeStorage()
        setStorageStatus(useSupabase ? "supabase" : "localStorage")
        await refreshData()

        // Suscribirse a cambios si usa Supabase
        const subscription = subscribeToChanges(() => {
          refreshData()
        })

        return () => {
          if (subscription) subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Initialization error:", error)
        setStorageStatus("localStorage")
        await refreshData()
      }
    }

    init()
  }, [])

  const refreshData = async () => {
    setRefreshing(true)
    try {
      const controlsLib = await loadControlsLib()
      setStockControls(controlsLib)

      // Actualizar control actual si existe
      if (currentControl) {
        const updated = controlsLib.find((c) => c.id === currentControl.id)
        if (updated) {
          setCurrentControl(updated)
          // Actualizar inputs locales con valores actuales
          const newLocalInputs: { [key: string]: string } = {}
          updated.stock_items.forEach((item) => {
            if (item.corregido !== null && item.corregido !== undefined) {
              newLocalInputs[item.id] = item.corregido.toString()
            }
          })
          setLocalInputs(newLocalInputs)
        }
      }
    } catch (error) {
      console.error("Error loading controls:", error)
    } finally {
      setTimeout(() => setRefreshing(false), 500)
    }
  }

  const parseStockText = (text: string) => {
    const lines = text.trim().split("\n")
    const items: any[] = []

    lines.forEach((line) => {
      if (!line.trim()) return

      // Limpiar la línea de espacios extra pero mantener la estructura
      const cleanLine = line.trim()

      // Patrón para detectar: código (3-5 dígitos) + espacios + denominación + posible stock al final
      const match = cleanLine.match(/^(\d{2,5})\s+(.+)$/)

      if (match) {
        const codigo = match[1]
        const restOfLine = match[2].trim()
        let denominacion = restOfLine
        let stock_sistema = 0

        // Buscar si hay un número al final que podría ser stock
        // Patrón: muchos espacios seguidos de un número al final
        const stockMatch = restOfLine.match(/^(.+?)\s{3,}(\d+)\s*$/)

        if (stockMatch) {
          // Hay un número separado por muchos espacios - es stock
          denominacion = stockMatch[1].trim()
          stock_sistema = Number.parseInt(stockMatch[2])
        } else {
          // Verificar si termina con un número que podría ser stock
          const endNumberMatch = restOfLine.match(/^(.+?)\s+(\d+)\s*$/)

          if (endNumberMatch) {
            const possibleStock = Number.parseInt(endNumberMatch[2])
            const beforeNumber = endNumberMatch[1].trim()

            // Heurística: si el número es razonable para stock (≤500) y la denominación
            // termina en unidades comunes, entonces es stock
            if (possibleStock <= 500 && /\b(CC|ML|LITRO|LT|CL)\b\s*$/i.test(beforeNumber)) {
              denominacion = beforeNumber
              stock_sistema = possibleStock
            }
            // Si no cumple la heurística, el número es parte del nombre
          }
        }

        items.push({
          codigo,
          denominacion,
          stock_sistema,
        })
      } else {
        // Fallback: intentar parsing básico si no coincide con el patrón principal
        const parts = cleanLine.split(/\s+/)
        if (parts.length >= 2 && /^\d{2,5}$/.test(parts[0])) {
          const codigo = parts[0]
          const lastPart = parts[parts.length - 1]
          const isLastPartStock = /^\d+$/.test(lastPart) && Number.parseInt(lastPart) <= 500

          let denominacion: string
          let stock_sistema = 0

          if (isLastPartStock && parts.length > 2) {
            denominacion = parts.slice(1, -1).join(" ")
            stock_sistema = Number.parseInt(lastPart)
          } else {
            denominacion = parts.slice(1).join(" ")
          }

          items.push({
            codigo,
            denominacion,
            stock_sistema,
          })
        }
      }
    })

    return items
  }

  const handleProcessStock = async () => {
    if (!controlName.trim() || !currentUser) {
      alert("Por favor ingresa un nombre para el control de stock")
      return
    }

    setLoading(true)
    try {
      const items = parseStockText(stockText)
      const newControl = await createControl(controlName, currentUser.name, items)

      // Recargar datos
      await refreshData()

      // Limpiar formulario
      setStockText("")
      setControlName("")

      alert("Control de stock creado exitosamente")
    } catch (error) {
      console.error("Error creating control:", error)
      alert("Error al crear el control de stock")
    } finally {
      setLoading(false)
    }
  }

  const handleCorrectionChange = (itemId: string, value: string) => {
    // Actualizar input local inmediatamente
    setLocalInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }))

    // Limpiar timeout anterior si existe
    if (saveTimeouts[itemId]) {
      clearTimeout(saveTimeouts[itemId])
    }

    // Crear nuevo timeout para guardar después de 1 segundo
    const newTimeout = setTimeout(async () => {
      try {
        const numValue = value === "" ? null : Number.parseInt(value) || 0
        const item = currentControl?.stock_items.find((i) => i.id === itemId)

        // CORRECCIÓN: El resultado debe ser Corregido - Stock Sistema
        const resultado = numValue !== null && item ? numValue - item.stock_sistema : null

        await updateItem(itemId, {
          corregido: numValue,
          resultado: resultado,
        })

        // Limpiar el timeout del estado
        setSaveTimeouts((prev) => {
          const newTimeouts = { ...prev }
          delete newTimeouts[itemId]
          return newTimeouts
        })
      } catch (error) {
        console.error("Error updating correction:", error)
      }
    }, 1000)

    // Guardar el nuevo timeout
    setSaveTimeouts((prev) => ({
      ...prev,
      [itemId]: newTimeout,
    }))
  }

  const handleDeleteControl = async (controlId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este control?")) return

    try {
      await deleteControl(controlId)

      if (currentControl?.id === controlId) {
        setCurrentControl(null)
        setLocalInputs({})
      }

      await refreshData()
    } catch (error) {
      console.error("Error deleting control:", error)
      alert("Error al eliminar el control")
    }
  }

  const exportToExcel = () => {
    if (!currentControl) return

    console.log("🔍 Exportando datos a Excel...")
    console.log("Control actual:", currentControl.name)
    console.log("Items:", currentControl.stock_items.length)

    // Crear array de datos
    const data = []

    // Headers
    const headers = ["Código", "Denominación", "Stock Sistema", user1Name, user2Name, "Corregido", "Resultado"]
    data.push(headers)

    // Datos de productos
    currentControl.stock_items.forEach((item) => {
      const user1Display = item.user1_value !== undefined && item.user1_value !== null ? item.user1_value : "Pendiente"
      const user2Display = item.user2_value !== undefined && item.user2_value !== null ? item.user2_value : "Pendiente"

      const correctedValue =
        localInputs[item.id] !== undefined && localInputs[item.id] !== ""
          ? localInputs[item.id]
          : item.corregido !== null && item.corregido !== undefined
            ? item.corregido.toString()
            : ""

      const calculatedResult = calculateResult(item)
      let resultadoDisplay = ""

      if (calculatedResult !== undefined && calculatedResult !== null) {
        resultadoDisplay = calculatedResult > 0 ? `+${calculatedResult}` : calculatedResult.toString()
      }

      data.push([
        item.codigo,
        item.denominacion,
        item.stock_sistema,
        user1Display,
        user2Display,
        correctedValue,
        resultadoDisplay,
      ])
    })

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Ajustar ancho de columnas para mejor visualización
    worksheet["!cols"] = [
      { wch: 12 }, // Código
      { wch: 30 }, // Denominación
      { wch: 15 }, // Stock Sistema
      { wch: 12 }, // Usuario 1
      { wch: 12 }, // Usuario 2
      { wch: 12 }, // Corregido
      { wch: 12 }, // Resultado
    ]

    // Aplicar estilos a headers
    const headerStyle = {
      fill: { fgColor: { rgb: "FFD966" } }, // Fondo amarillo
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }

    // Aplicar estilos a todas las celdas
    for (let i = 0; i < headers.length; i++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = headerStyle
    }

    // Aplicar bordes a todas las celdas
    for (let row = 0; row < data.length; row++) {
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!worksheet[cellAddress]) continue
        if (row === 0) continue // Headers ya tienen estilos
        worksheet[cellAddress].s = {
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          alignment: { horizontal: "left", vertical: "center" },
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Control Stock")

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `Control_Stock_${currentControl.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log("✅ Archivo descargado:", a.download)
    alert("✅ Archivo exportado exitosamente en formato Excel!")
  }

  const exportGlobalDifferences = () => {
    if (stockControls.length === 0) {
      alert("No hay controles para exportar")
      return
    }

    const allDifferences: any[] = []

    // Recorrer todos los controles y recolectar solo las diferencias
    stockControls.forEach((control) => {
      control.stock_items.forEach((item) => {
        // Verificar si hay inconsistencia con cualquier usuario
        const hasUser1Inconsistency =
          item.user1_value !== undefined && item.user1_value !== null && item.user1_value !== item.stock_sistema

        const hasUser2Inconsistency =
          item.user2_value !== undefined && item.user2_value !== null && item.user2_value !== item.stock_sistema

        const hasAnyInconsistency = hasUser1Inconsistency || hasUser2Inconsistency

        // Solo incluir si hay diferencia
        if (hasAnyInconsistency) {
          const correctedValue =
            localInputs[item.id] !== undefined && localInputs[item.id] !== ""
              ? localInputs[item.id]
              : item.corregido !== null && item.corregido !== undefined
                ? item.corregido.toString()
                : ""

          const calculatedResult = calculateResult(item)
          let resultadoDisplay = ""

          if (calculatedResult !== undefined && calculatedResult !== null) {
            resultadoDisplay = calculatedResult > 0 ? `+${calculatedResult}` : calculatedResult.toString()
          }

          allDifferences.push({
            codigo: item.codigo,
            denominacion: item.denominacion,
            stock_sistema: item.stock_sistema,
            user1_value: item.user1_value !== undefined && item.user1_value !== null ? item.user1_value : "Pendiente",
            user2_value: item.user2_value !== undefined && item.user2_value !== null ? item.user2_value : "Pendiente",
            corregido: correctedValue,
            resultado: resultadoDisplay,
          })
        }
      })
    })

    if (allDifferences.length === 0) {
      alert("No hay diferencias para exportar")
      return
    }

    // Crear el Excel con las diferencias
    const data: any[] = []
    const headers = ["Código", "Denominación", "Stock Sistema", "Usuario 1", "Usuario 2", "Corregido", "Resultado"]
    data.push(headers)

    allDifferences.forEach((item) => {
      data.push([
        item.codigo,
        item.denominacion,
        item.stock_sistema,
        item.user1_value,
        item.user2_value,
        item.corregido,
        item.resultado,
      ])
    })

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    worksheet["!cols"] = [
      { wch: 12 }, // Código
      { wch: 30 }, // Denominación
      { wch: 15 }, // Stock Sistema
      { wch: 12 }, // Usuario 1
      { wch: 12 }, // Usuario 2
      { wch: 12 }, // Corregido
      { wch: 12 }, // Resultado
    ]

    // Aplicar estilos al header
    const headerStyle = {
      fill: { fgColor: { rgb: "FFFF00" } },
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }

    for (let i = 0; i < headers.length; i++) {
      const cellRef = XLSX.utils.encode_col(i) + "1"
      worksheet[cellRef].s = headerStyle
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Diferencias")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data_blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(data_blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `diferencias-globales-${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  const handleSave = async () => {
    if (!stockText.trim()) return

    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newControl: StockControl = {
      id: Date.now().toString(),
      userId: userName,
      userName: userName,
      stockData: stockText,
      timestamp: new Date().toISOString(),
      verified: false,
    }

    const newControls = [newControl, ...controls]
    saveControls(newControls)
    setStockText("")
    setIsSaving(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este control?")) {
      const newControls = controls.filter((c) => c.id !== id)
      saveControls(newControls)
    }
  }

  const handleVerify = (id: string) => {
    const newControls = controls.map((c) => (c.id === id ? { ...c, verified: true } : c))
    saveControls(newControls)
  }

  const saveControls = (newControls: StockControl[]) => {
    localStorage.setItem("stockControls", JSON.stringify(newControls))
    setControls(newControls)
  }

  // Función para calcular el resultado en tiempo real
  const calculateResult = (item: any) => {
    const correctedValue = localInputs[item.id] || item.corregido
    if (correctedValue !== null && correctedValue !== undefined && correctedValue !== "") {
      return Number(correctedValue) - item.stock_sistema
    }
    return item.resultado
  }

  // Limpiar timeouts al desmontar el componente
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach((timeout) => clearTimeout(timeout))
    }
  }, [saveTimeouts])

  if (!currentUser) return <div>Cargando...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 relative dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      {/* Botón página principal - Esquina superior izquierda */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "https://pedidos-alfonsa-dist.vercel.app/")}
          className="bg-white/90 hover:bg-white border-orange-200 hover:border-[#E47C00] text-slate-700 hover:text-[#E47C00] shadow-md dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/20 dark:hover:border-[#E47C00]/50 dark:text-white dark:hover:text-[#E47C00]"
          title="Ir a página principal"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-orange-200 space-y-4 sm:space-y-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-[#E47C00] to-orange-600 rounded-lg sm:rounded-xl shadow-lg dark:from-red-500 dark:to-red-600">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-800 dark:text-white">Panel de Control</h1>
              <p className="text-sm sm:text-base text-slate-600 flex items-center dark:text-gray-400">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Bienvenido, {currentUser.name}
                <span
                  className={`ml-2 px-2 py-1.5 rounded-full text-xs font-semibold bg-${branchInfo.color}-100 text-${branchInfo.color}-800 dark:bg-red-500 dark:text-white`}
                >
                  {branchInfo.name}
                </span>
              </p>
            </div>
          </div>

          {/* Storage Status - Mejorado */}
          {storageStatus !== "loading" && (
            <div className="flex items-center space-x-2">
              {storageStatus === "localStorage" && (
                <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-xs border border-amber-200 dark:text-red-500 dark:bg-red-500 dark:border-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Modo Local</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = "/setup")}
                    className="text-amber-700 hover:bg-amber-100 p-1 h-5 ml-2 dark:text-red-500 dark:hover:bg-red-600"
                  >
                    Configurar
                  </Button>
                </div>
              )}
              {storageStatus === "supabase" && (
                <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs border border-green-200 dark:text-green-500 dark:bg-green-500 dark:border-green-700">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Tiempo Real</span>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-300 text-xs ml-1 dark:bg-green-600 dark:text-green-100 dark:border-green-700"
                  >
                    Supabase
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <div className="sm:hidden w-full">
            <Button
              variant="outline"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full justify-center"
            >
              <Menu className="h-4 w-4 mr-2" />
              Menú
            </Button>
          </div>

          {/* Desktop buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={refreshing}
              className="hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent dark:hover:bg-red-50 dark:hover:border-red-200 dark:hover:text-red-600"
            >
              {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent dark:hover:bg-red-50 dark:hover:border-red-200 dark:hover:text-red-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden w-full space-y-2 pt-4 border-t border-orange-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={refreshing}
                className="w-full justify-start hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent dark:hover:bg-red-50 dark:hover:border-red-200 dark:hover:text-red-600"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Actualizar
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="w-full justify-start hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent dark:hover:bg-red-50 dark:hover:border-red-200 dark:hover:text-red-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>

        {/* Crear nuevo control - Responsive */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-amber-50 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white rounded-t-lg p-4 sm:p-6 dark:from-red-500 dark:to-red-600">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Crear Nuevo Control de Stock</span>
            </CardTitle>
            <CardDescription className="text-orange-100 text-sm sm:text-base dark:text-gray-400">
              Importa datos desde el sistema Husky y crea un nuevo control
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <Label
                htmlFor="control-name"
                className="text-slate-700 font-semibold text-sm sm:text-base dark:text-white"
              >
                Nombre del Control
              </Label>
              <Input
                id="control-name"
                placeholder="Ej: Control Stock Licores, Control Stock Cervezas..."
                value={controlName}
                onChange={(e) => setControlName(e.target.value)}
                className="mt-2 border-orange-300 focus:border-[#E47C00] focus:ring-[#E47C00]/20 text-sm sm:text-base dark:border-gray-500 dark:focus:border-red-500 dark:focus:ring-red-500/20"
              />
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-sm sm:text-base dark:text-white">
                Datos desde Husky
              </Label>
              <Textarea
                placeholder="265             AMARULA 375CC CHICOOO                       
266             AMARULA 750CC                               
8194            AMARULA CREAM ETHIOPIAN COFFE 750           
25              ANIS 8 HERMANOS LITRO                       60
275             BEZIER CREMA DE CASSIS                      12"
                value={stockText}
                onChange={(e) => setStockText(e.target.value)}
                rows={6}
                className="mt-2 font-mono text-xs sm:text-sm border-orange-300 focus:border-[#E47C00] focus:ring-[#E47C00]/20 dark:border-gray-500 dark:focus:border-red-500 dark:focus:ring-red-500/20"
              />
            </div>
            <Button
              onClick={handleProcessStock}
              disabled={!stockText.trim() || !controlName.trim() || loading}
              className="w-full bg-gradient-to-r from-[#E47C00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 sm:py-3 shadow-lg text-sm sm:text-base dark:bg-red-500 dark:hover:bg-red-600 dark:text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Control de Stock
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de controles - Responsive */}
        {stockControls.length > 0 && (
          <Card className="shadow-lg border-0 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white rounded-t-lg p-4 sm:p-6 dark:from-red-500 dark:to-red-600">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-lg sm:text-xl">Controles de Stock Activos</span>
                </div>
                <div className="flex items-center space-x-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportGlobalDifferences}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs sm:text-sm"
                  >
                    Exportar diferencias globales
                  </Button>
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white text-sm dark:bg-gray-700 dark:text-white"
                  >
                    {stockControls.length} controles
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {stockControls.map((control) => {
                  const user1Progress = control.stock_items.filter(
                    (item) => item.user1_value !== null && item.user1_value !== undefined,
                  ).length
                  const user2Progress = control.stock_items.filter(
                    (item) => item.user2_value !== null && item.user2_value !== undefined,
                  ).length
                  const totalItems = control.stock_items.length

                  return (
                    <Card
                      key={control.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${
                        currentControl?.id === control.id
                          ? "border-[#E47C00] bg-orange-50 shadow-lg dark:border-red-500 dark:bg-red-600"
                          : "border-orange-200 hover:border-[#E47C00]/50 dark:border-gray-500 dark:hover:border-red-500"
                      }`}
                      onClick={() => setCurrentControl(control)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-2 truncate dark:text-white">
                              {control.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 mb-1 dark:text-gray-400">
                              {control.stock_items.length} productos
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">
                              {new Date(control.created_at).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteControl(control.id)
                            }}
                            className="text-red-500 hover:bg-red-50 hover:border-red-200 p-1.5 sm:p-2 dark:text-white dark:hover:bg-red-600 dark:hover:border-red-700"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-white">
                              {user1Name}
                            </span>
                            <Badge
                              variant={user1Progress === totalItems ? "default" : "outline"}
                              className={`text-xs ${user1Progress === totalItems ? "bg-[#E47C00]" : ""}`}
                            >
                              {user1Progress}/{totalItems}
                            </Badge>
                          </div>
                          <div className="w-full bg-orange-200 rounded-full h-1.5 sm:h-2 dark:bg-red-500">
                            <div
                              className="bg-gradient-to-r from-[#E47C00] to-orange-600 h-1.5 sm:h-2 rounded-full transition-all duration-300 dark:bg-red-600"
                              style={{ width: `${totalItems > 0 ? (user1Progress / totalItems) * 100 : 0}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-white">
                              {user2Name}
                            </span>
                            <Badge
                              variant={user2Progress === totalItems ? "default" : "outline"}
                              className={`text-xs ${user2Progress === totalItems ? "bg-amber-600" : ""}`}
                            >
                              {user2Progress}/{totalItems}
                            </Badge>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-1.5 sm:h-2 dark:bg-red-500">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 sm:h-2 rounded-full transition-all duration-300 dark:bg-red-600"
                              style={{ width: `${totalItems > 0 ? (user2Progress / totalItems) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de productos - Responsive */}
        {currentControl && (
          <Card className="shadow-lg border-0 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg p-4 sm:p-6 dark:from-red-500 dark:to-red-600">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">{currentControl.name}</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm dark:text-gray-400">
                    {currentControl.stock_items.length} productos • Creado el{" "}
                    {new Date(currentControl.created_at).toLocaleDateString("es-ES")}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    onClick={exportToExcel}
                    className="bg-[#E47C00] hover:bg-orange-600 text-white text-sm dark:bg-red-500 dark:hover:bg-red-600 dark:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                  {/* Botón para exportar diferencias globales */}
                  <Button
                    onClick={exportGlobalDifferences}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm dark:bg-red-500 dark:hover:bg-red-600 dark:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Diferencias Globales
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-orange-50 border-b dark:bg-red-500">
                    <tr>
                      <th className="text-left p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        Código
                      </th>
                      <th className="text-left p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        Denominación
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        Stock Sistema
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        {user1Name}
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        {user2Name}
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        Corregido
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm dark:text-white">
                        Resultado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentControl.stock_items.map((item) => {
                      const calculatedResult = calculateResult(item)

                      // Verificar si hay inconsistencia con cualquier usuario
                      const hasUser1Inconsistency =
                        item.user1_value !== undefined &&
                        item.user1_value !== null &&
                        item.user1_value !== item.stock_sistema

                      const hasUser2Inconsistency =
                        item.user2_value !== undefined &&
                        item.user2_value !== null &&
                        item.user2_value !== item.stock_sistema

                      const hasAnyInconsistency = hasUser1Inconsistency || hasUser2Inconsistency

                      return (
                        <tr
                          key={item.id}
                          className={`border-b transition-colors ${
                            hasAnyInconsistency
                              ? "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-400 dark:bg-red-600 dark:hover:bg-red-700"
                              : "hover:bg-orange-50 dark:hover:bg-red-600"
                          }`}
                        >
                          <td className="p-2 sm:p-4 font-mono font-semibold text-[#E47C00] text-xs sm:text-base dark:text-white">
                            {item.codigo}
                          </td>
                          <td className="p-2 sm:p-4 font-medium text-slate-800 text-xs sm:text-sm dark:text-white">
                            {item.denominacion}
                          </td>
                          <td className="p-2 sm:p-4 text-center">
                            <Badge
                              variant="outline"
                              className="font-semibold border-[#E47C00] text-[#E47C00] text-xs dark:bg-red-500 dark:text-white dark:border-red-700"
                            >
                              {item.stock_sistema}
                            </Badge>
                          </td>
                          <td className="p-2 sm:p-4 text-center">
                            {item.user1_value !== undefined && item.user1_value !== null ? (
                              <Badge
                                className={`text-xs font-semibold ${
                                  item.user1_value !== item.stock_sistema
                                    ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-600 dark:text-white dark:border-red-700"
                                    : "bg-[#E47C00]/10 text-[#E47C00] border-[#E47C00]/30 dark:bg-red-500 dark:text-white dark:border-red-700"
                                }`}
                              >
                                {item.user1_value}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs dark:text-gray-500">Pendiente</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-4 text-center">
                            {item.user2_value !== undefined && item.user2_value !== null ? (
                              <Badge
                                className={`text-xs font-semibold ${
                                  item.user2_value !== item.stock_sistema
                                    ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-600 dark:text-white dark:border-red-700"
                                    : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-red-500 dark:text-white dark:border-red-700"
                                }`}
                              >
                                {item.user2_value}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs dark:text-gray-500">Pendiente</span>
                            )}
                          </td>
                          <td className="p-2 sm:p-4 text-center">
                            <Input
                              type="number"
                              min="0"
                              value={localInputs[item.id] || ""}
                              onChange={(e) => handleCorrectionChange(item.id, e.target.value)}
                              className="w-16 sm:w-24 text-center border-orange-300 focus:border-[#E47C00] text-xs sm:text-sm h-8 sm:h-10 dark:border-gray-500 dark:focus:border-red-500"
                              placeholder="0"
                            />
                            {saveTimeouts[item.id] && (
                              <div className="text-xs text-blue-600 mt-1 dark:text-blue-400">Guardando...</div>
                            )}
                          </td>
                          <td className="p-2 sm:p-4 text-center">
                            {calculatedResult !== undefined && calculatedResult !== null && (
                              <Badge
                                variant="outline"
                                className={`text-xs font-bold ${
                                  calculatedResult > 0
                                    ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-600 dark:text-white dark:border-green-700"
                                    : calculatedResult < 0
                                      ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-600 dark:text-white dark:border-red-700"
                                      : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-gray-600 dark:text-white dark:border-gray-700"
                                }`}
                              >
                                {calculatedResult > 0 ? "+" : ""}
                                {calculatedResult}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controles Registrados */}
        <Card className="mt-4 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Controles Registrados</CardTitle>
            <CardDescription>{controls.length} control(es) en total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {controls.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 dark:text-gray-500">
                  No hay controles registrados
                </p>
              ) : (
                controls.map((control) => (
                  <div
                    key={control.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors dark:bg-gray-700 dark:hover:bg-red-500"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{control.userName}</p>
                        {control.verified && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 dark:bg-red-500 dark:text-white"
                          >
                            <CheckCircle2 className="h-3 w-3 dark:text-white" />
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {new Date(control.timestamp).toLocaleString("es-ES")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1 dark:text-gray-500">
                        {control.stockData.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = `/verification?id=${control.id}`)}
                        className="dark:text-white"
                      >
                        <Eye className="h-4 w-4 dark:text-white" />
                      </Button>
                      {userRole === "leader" && !control.verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerify(control.id)}
                          className="dark:text-white"
                        >
                          <CheckCircle2 className="h-4 w-4 dark:text-white" />
                        </Button>
                      )}
                      {userRole === "leader" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(control.id)}
                          className="dark:text-white"
                        >
                          <Trash2 className="h-4 w-4 dark:text-white" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
