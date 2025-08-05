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
  ExternalLink,
  Menu,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import {
  initializeStorage,
  loadControls,
  createControl,
  updateItem,
  deleteControl,
  subscribeToChanges,
  type StockControlWithItems,
} from "@/lib/storage"

type User = {
  id: string
  name: string
  role: "lider" | "user1" | "user2"
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [stockText, setStockText] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [stockControls, setStockControls] = useState<StockControlWithItems[]>([])
  const [currentControl, setCurrentControl] = useState<StockControlWithItems | null>(null)
  const [controlName, setControlName] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [storageStatus, setStorageStatus] = useState<"supabase" | "localStorage" | "loading">("loading")

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user)
      setCurrentUser(parsedUser)
      if (parsedUser.role !== "lider") {
        window.location.href = "/verification"
        return
      }
    } else {
      window.location.href = "/"
      return
    }

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
      const controls = await loadControls()
      setStockControls(controls)

      // Actualizar control actual si existe
      if (currentControl) {
        const updated = controls.find((c) => c.id === currentControl.id)
        if (updated) setCurrentControl(updated)
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

      const match = line.match(/^(\d+)\s+(.+?)(\d+)?\s*$/)

      if (match) {
        const codigo = match[1]
        let denominacion = match[2].trim()
        let stock_sistema = 0

        if (match[3]) {
          stock_sistema = Number.parseInt(match[3])
          denominacion = denominacion.replace(/\s+\d+\s*$/, "").trim()
        }

        items.push({
          codigo,
          denominacion,
          stock_sistema,
        })
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

  const handleCorrectionChange = async (itemId: string, value: string) => {
    if (!currentControl) return

    try {
      const numValue = value === "" ? null : Number.parseInt(value) || 0
      const item = currentControl.stock_items.find((i) => i.id === itemId)
      const resultado = numValue !== null && item ? numValue - item.stock_sistema : null

      await updateItem(itemId, {
        corregido: numValue,
        resultado: resultado,
      })

      // Los datos se actualizarán automáticamente por la suscripción o el próximo refresh
    } catch (error) {
      console.error("Error updating correction:", error)
    }
  }

  const handleDeleteControl = async (controlId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este control?")) return

    try {
      await deleteControl(controlId)

      if (currentControl?.id === controlId) {
        setCurrentControl(null)
      }

      await refreshData()
    } catch (error) {
      console.error("Error deleting control:", error)
      alert("Error al eliminar el control")
    }
  }

  const exportToCSV = () => {
    if (!currentControl) return

    const headers = ["Código", "Denominación", "Stock Sistema", "Usuario 1", "Usuario 2", "Corregido"]
    if (showResults) {
      headers.push("Resultado")
    }

    const csvRows = []
    csvRows.push(headers.join(","))

    currentControl.stock_items.forEach((item) => {
      const row = []
      row.push(item.codigo)
      row.push(`"${item.denominacion}"`)
      row.push(item.stock_sistema.toString())

      if (item.user1_value !== undefined && item.user1_value !== null) {
        row.push(item.user1_value.toString())
      } else {
        row.push("Pendiente")
      }

      if (item.user2_value !== undefined && item.user2_value !== null) {
        row.push(item.user2_value.toString())
      } else {
        row.push("Pendiente")
      }

      if (item.corregido !== undefined && item.corregido !== null) {
        row.push(item.corregido.toString())
      } else {
        row.push("")
      }

      if (showResults) {
        if (item.resultado !== undefined && item.resultado !== null) {
          if (item.resultado > 0) {
            row.push(`+${item.resultado}`)
          } else {
            row.push(item.resultado.toString())
          }
        } else {
          row.push("")
        }
      }

      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `stock_control_${currentControl.name}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  const goToMainSite = () => {
    window.open("https://pedidos-alfonsa-dist.vercel.app/", "_blank")
  }

  if (!currentUser) return <div>Cargando...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-orange-200 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-[#E47C00] to-orange-600 rounded-lg sm:rounded-xl shadow-lg">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-800">Panel de Control</h1>
              <p className="text-sm sm:text-base text-slate-600 flex items-center">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Bienvenido, {currentUser.name}
              </p>
            </div>
          </div>

          {/* Storage Status */}
          {storageStatus !== "loading" && (
            <div className="flex items-center space-x-2">
              {storageStatus === "localStorage" && (
                <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Modo Local</span>
                </div>
              )}
              {storageStatus === "supabase" && (
                <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>En Línea</span>
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
              className="hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent"
            >
              {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
            <Button
              variant="outline"
              onClick={goToMainSite}
              className="hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Sitio Principal
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden w-full space-y-2 pt-4 border-t border-orange-200">
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={refreshing}
                className="w-full justify-start hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent"
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
                onClick={goToMainSite}
                className="w-full justify-start hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Sitio Principal
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="w-full justify-start hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>

        {/* Crear nuevo control - Responsive */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardHeader className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white rounded-t-lg p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Crear Nuevo Control de Stock</span>
            </CardTitle>
            <CardDescription className="text-orange-100 text-sm sm:text-base">
              Importa datos desde el sistema Husky y crea un nuevo control
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="control-name" className="text-slate-700 font-semibold text-sm sm:text-base">
                Nombre del Control
              </Label>
              <Input
                id="control-name"
                placeholder="Ej: Control Stock Licores, Control Stock Cervezas..."
                value={controlName}
                onChange={(e) => setControlName(e.target.value)}
                className="mt-2 border-orange-300 focus:border-[#E47C00] focus:ring-[#E47C00]/20 text-sm sm:text-base"
              />
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-sm sm:text-base">Datos desde Husky</Label>
              <Textarea
                placeholder="265             AMARULA 375CC CHICOOO                       
266             AMARULA 750CC                               
8194            AMARULA CREAM ETHIOPIAN COFFE 750           
25              ANIS 8 HERMANOS LITRO                       60
275             BEZIER CREMA DE CASSIS                      12"
                value={stockText}
                onChange={(e) => setStockText(e.target.value)}
                rows={6}
                className="mt-2 font-mono text-xs sm:text-sm border-orange-300 focus:border-[#E47C00] focus:ring-[#E47C00]/20"
              />
            </div>
            <Button
              onClick={handleProcessStock}
              disabled={!stockText.trim() || !controlName.trim() || loading}
              className="w-full bg-gradient-to-r from-[#E47C00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2 sm:py-3 shadow-lg text-sm sm:text-base"
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
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white rounded-t-lg p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-lg sm:text-xl">Controles de Stock Activos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-white/20 text-white text-sm">
                    {stockControls.length} controles
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={refreshing}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
                          ? "border-[#E47C00] bg-orange-50 shadow-lg"
                          : "border-orange-200 hover:border-[#E47C00]/50"
                      }`}
                      onClick={() => setCurrentControl(control)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-slate-800 mb-2 truncate">
                              {control.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 mb-1">
                              {control.stock_items.length} productos
                            </p>
                            <p className="text-xs text-slate-500">
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
                            className="text-red-500 hover:bg-red-50 hover:border-red-200 p-1.5 sm:p-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-medium text-slate-700">Usuario 1</span>
                            <Badge
                              variant={user1Progress === totalItems ? "default" : "outline"}
                              className={`text-xs ${user1Progress === totalItems ? "bg-[#E47C00]" : ""}`}
                            >
                              {user1Progress}/{totalItems}
                            </Badge>
                          </div>
                          <div className="w-full bg-orange-200 rounded-full h-1.5 sm:h-2">
                            <div
                              className="bg-gradient-to-r from-[#E47C00] to-orange-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                              style={{ width: `${totalItems > 0 ? (user1Progress / totalItems) * 100 : 0}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-medium text-slate-700">Usuario 2</span>
                            <Badge
                              variant={user2Progress === totalItems ? "default" : "outline"}
                              className={`text-xs ${user2Progress === totalItems ? "bg-amber-600" : ""}`}
                            >
                              {user2Progress}/{totalItems}
                            </Badge>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-1.5 sm:h-2">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
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
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">{currentControl.name}</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    {currentControl.stock_items.length} productos • Creado el{" "}
                    {new Date(currentControl.created_at).toLocaleDateString("es-ES")}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setShowResults(!showResults)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm"
                  >
                    {showResults ? "Ocultar" : "Ver"} Resultados
                  </Button>
                  <Button onClick={exportToCSV} className="bg-[#E47C00] hover:bg-orange-600 text-white text-sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-orange-50 border-b">
                    <tr>
                      <th className="text-left p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">Código</th>
                      <th className="text-left p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                        Denominación
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                        Stock Sistema
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                        Usuario 1
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                        Usuario 2
                      </th>
                      <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                        Corregido
                      </th>
                      {showResults && (
                        <th className="text-center p-2 sm:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                          Resultado
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentControl.stock_items.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-orange-50 transition-colors">
                        <td className="p-2 sm:p-4 font-mono font-semibold text-[#E47C00] text-xs sm:text-base">
                          {item.codigo}
                        </td>
                        <td className="p-2 sm:p-4 font-medium text-slate-800 text-xs sm:text-sm">
                          {item.denominacion}
                        </td>
                        <td className="p-2 sm:p-4 text-center">
                          <Badge variant="outline" className="font-semibold border-[#E47C00] text-[#E47C00] text-xs">
                            {item.stock_sistema}
                          </Badge>
                        </td>
                        <td className="p-2 sm:p-4 text-center">
                          {item.user1_value !== undefined && item.user1_value !== null ? (
                            <Badge className="bg-[#E47C00]/10 text-[#E47C00] border-[#E47C00]/30 text-xs">
                              {item.user1_value}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">Pendiente</span>
                          )}
                        </td>
                        <td className="p-2 sm:p-4 text-center">
                          {item.user2_value !== undefined && item.user2_value !== null ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                              {item.user2_value}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">Pendiente</span>
                          )}
                        </td>
                        <td className="p-2 sm:p-4 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.corregido || ""}
                            onChange={(e) => handleCorrectionChange(item.id, e.target.value)}
                            className="w-16 sm:w-24 text-center border-orange-300 focus:border-[#E47C00] text-xs sm:text-sm h-8 sm:h-10"
                            placeholder="0"
                          />
                        </td>
                        {showResults && (
                          <td className="p-2 sm:p-4 text-center">
                            {item.resultado !== undefined && item.resultado !== null && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  item.resultado > 0
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : item.resultado < 0
                                      ? "bg-red-100 text-red-800 border-red-300"
                                      : "bg-slate-100 text-slate-800 border-slate-300"
                                }`}
                              >
                                {item.resultado > 0 ? "+" : ""}
                                {item.resultado}
                              </Badge>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
