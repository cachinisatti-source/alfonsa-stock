"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Package,
  CheckCircle,
  AlertCircle,
  UserIcon,
  Clock,
  RefreshCw,
  Menu,
  Save,
  Loader2,
  Edit3,
  X,
  AlertTriangle,
} from "lucide-react"
import {
  loadControls,
  updateItem,
  subscribeToChanges,
  type StockControlWithItems,
  getCurrentBranchInfo,
} from "@/lib/storage"

type UserRole = "lider" | "user1" | "user2"

export default function VerificationPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: UserRole } | null>(null)
  const [stockControls, setStockControls] = useState<StockControlWithItems[]>([])
  const [selectedControl, setSelectedControl] = useState<StockControlWithItems | null>(null)
  const [editingItems, setEditingItems] = useState<{ [key: string]: string }>({}) // Para items en edición
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [selectedProductModal, setSelectedProductModal] = useState<any | null>(null)
  const [branchInfo, setBranchInfo] = useState<{ name: string; color: string }>({ name: "Betbeder", color: "blue" })

  const openProductModal = (item: any) => {
    setSelectedProductModal(item)
  }

  const closeProductModal = () => {
    setSelectedProductModal(null)
  }

  // Memoized function to load controls
  const loadControlsData = useCallback(async () => {
    try {
      const data = await loadControls()
      setStockControls(data || [])
      setLastUpdate(new Date())

      // Update selected control if it exists
      if (selectedControl) {
        const updated = data?.find((c: StockControlWithItems) => c.id === selectedControl.id)
        if (updated) {
          setSelectedControl(updated)
        }
      }
    } catch (error) {
      console.error("Error loading stock controls:", error)
    }
  }, [selectedControl])

  useEffect(() => {
    // Check user authentication
    const user = localStorage.getItem("currentUser")
    if (user) {
      try {
        const parsedUser = JSON.parse(user)
        setCurrentUser(parsedUser)
        if (parsedUser.role === "lider") {
          window.location.href = "/dashboard"
          return
        }
      } catch (error) {
        console.error("Error parsing user:", error)
        window.location.href = "/"
        return
      }
    } else {
      window.location.href = "/"
      return
    }

    // Cargar información de sucursal
    const branchData = getCurrentBranchInfo()
    setBranchInfo(branchData)

    // Initial load of controls
    loadControlsData()

    // Suscribirse a cambios en tiempo real
    const subscription = subscribeToChanges(() => loadControlsData())

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [loadControlsData])

  const startEditing = (itemId: string, currentValue?: number) => {
    setEditingItems((prev) => ({
      ...prev,
      [itemId]: currentValue?.toString() || "",
    }))
  }

  const handleInputChange = (itemId: string, value: string) => {
    setEditingItems((prev) => ({
      ...prev,
      [itemId]: value,
    }))
  }

  const saveVerification = async (itemId: string) => {
    if (!selectedControl || !currentUser) return

    setSaving(itemId)
    try {
      const value = Number.parseInt(editingItems[itemId]) || 0
      const field = currentUser.role === "user1" ? "user1_value" : "user2_value"

      await updateItem(itemId, {
        [field]: value,
        updated_at: new Date().toISOString(),
      })

      // Limpiar el estado de edición
      setEditingItems((prev) => {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      })

      // Actualizar datos
      await loadControlsData()
    } catch (error) {
      console.error("Error saving verification:", error)
      alert("Error al guardar la verificación")
    } finally {
      setSaving(null)
    }
  }

  const cancelEditing = (itemId: string) => {
    setEditingItems((prev) => {
      const newState = { ...prev }
      delete newState[itemId]
      return newState
    })
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadControlsData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const goBackToControls = () => {
    console.log("🔄 Volviendo a la vista de controles...")

    // Limpiar TODOS los estados inmediatamente
    setSelectedControl(null)
    setEditingItems({})
    setMobileMenuOpen(false)
    setSelectedProductModal(null)

    console.log("✅ Estados limpiados, volviendo a vista de tarjetas")
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E47C00] mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 relative">
      <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
        {/* Header - Responsive */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-orange-200 space-y-4 sm:space-y-0">
          {/* Botón página principal - Esquina superior izquierda */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://pedidos-alfonsa-dist.vercel.app/", "_blank")}
              className="bg-white/90 hover:bg-white border-orange-200 hover:border-[#E47C00] text-slate-700 hover:text-[#E47C00] shadow-md"
              title="Ir a página principal"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-[#E47C00] to-orange-600 rounded-lg sm:rounded-xl shadow-lg">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-800">Verificación de Stock</h1>
              <p className="text-sm sm:text-base text-slate-600 flex items-center">
                <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Bienvenido, {currentUser.name}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold bg-${branchInfo.color}-100 text-${branchInfo.color}-800`}
                >
                  {branchInfo.name}
                </span>
              </p>
            </div>
          </div>

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
          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={refreshing}
              className="hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00] transition-colors bg-transparent"
            >
              {refreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Actualizar
            </Button>
            {selectedControl && (
              <Button
                variant="outline"
                onClick={goBackToControls}
                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors bg-transparent"
              >
                <Package className="h-4 w-4 mr-2" />
                Ver Controles
              </Button>
            )}
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
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 mb-2">
                <Clock className="h-3 w-3" />
                <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
              </div>
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
              {selectedControl && (
                <Button
                  variant="outline"
                  onClick={goBackToControls}
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors bg-transparent"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ver Controles
                </Button>
              )}
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

        {!selectedControl ? (
          // Vista de selección de controles - Responsive
          <>
            {stockControls.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="text-center py-12 sm:py-16 px-4">
                  <div className="p-3 sm:p-4 bg-orange-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-[#E47C00]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-3">No hay controles disponibles</h3>
                  <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                    El líder aún no ha creado ningún control de stock.
                  </p>
                  <Button
                    onClick={refreshData}
                    disabled={refreshing}
                    variant="outline"
                    className="flex items-center space-x-2 bg-transparent hover:bg-[#E47C00]/10 hover:border-[#E47C00]/30 hover:text-[#E47C00]"
                  >
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    <span>Actualizar</span>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardHeader className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white rounded-t-lg p-4 sm:p-6">
                    <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
                      <span>Seleccionar Control de Stock</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshData}
                        disabled={refreshing}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        {refreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-orange-100 text-sm sm:text-base">
                      Elige qué control de stock deseas verificar
                    </CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {stockControls.map((control) => {
                    const userVerifications = control.stock_items.filter((item) =>
                      currentUser?.role === "user1"
                        ? item.user1_value !== null && item.user1_value !== undefined
                        : item.user2_value !== null && item.user2_value !== undefined,
                    ).length
                    const totalItems = control.stock_items.length
                    const progress = totalItems > 0 ? (userVerifications / totalItems) * 100 : 0
                    const isComplete = progress === 100

                    return (
                      <Card
                        key={control.id}
                        className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 border-orange-200 hover:border-[#E47C00]/50 bg-white"
                        onClick={() => setSelectedControl(control)}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start justify-between mb-4 sm:mb-6">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg sm:text-xl text-slate-800 mb-2 truncate">
                                {control.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600 mb-1">
                                {control.stock_items.length} productos
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(control.created_at).toLocaleDateString("es-ES", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            {isComplete && (
                              <div className="p-1.5 sm:p-2 bg-green-100 rounded-full">
                                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs sm:text-sm font-medium text-slate-700">Tu progreso</span>
                              <Badge
                                variant={isComplete ? "default" : "outline"}
                                className={`text-xs ${isComplete ? "bg-[#E47C00]" : "border-[#E47C00] text-[#E47C00]"}`}
                              >
                                {userVerifications}/{totalItems}
                              </Badge>
                            </div>
                            <div className="w-full bg-orange-200 rounded-full h-2 sm:h-3">
                              <div
                                className={`h-2 sm:h-3 rounded-full transition-all duration-500 ${
                                  isComplete
                                    ? "bg-gradient-to-r from-green-500 to-green-600"
                                    : "bg-gradient-to-r from-[#E47C00] to-orange-600"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 text-center">
                              {isComplete ? "¡Verificación completa!" : `${Math.round(progress)}% completado`}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          // Vista de verificación de productos - Responsive y Optimizada
          <>
            <Card className="shadow-lg border-0 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardHeader className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white rounded-t-lg p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="truncate">{selectedControl.name}</span>
                </CardTitle>
                <CardDescription className="text-orange-100 text-sm sm:text-base">
                  Verifica físicamente cada producto y registra la cantidad exacta que encuentres.
                  <strong className="text-white"> No puedes ver el stock del sistema.</strong>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[380px] sm:min-w-[480px]">
                    <thead className="bg-orange-50 border-b">
                      <tr>
                        <th className="text-left p-1 sm:p-2 md:p-4 font-semibold text-slate-700 text-xs sm:text-sm">
                          Denominación
                        </th>
                        <th className="text-center p-1 sm:p-2 md:p-4 font-semibold text-slate-700 text-xs sm:text-sm w-32 sm:w-40">
                          Cantidad Física
                        </th>
                        <th className="text-center p-1 sm:p-2 md:p-4 font-semibold text-slate-700 text-xs sm:text-sm w-20 sm:w-24">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedControl.stock_items.map((item) => {
                        const userValue = currentUser?.role === "user1" ? item.user1_value : item.user2_value
                        const hasValue = userValue !== undefined && userValue !== null
                        const isEditing = editingItems.hasOwnProperty(item.id)

                        // Verificar inconsistencia del usuario actual
                        const hasInconsistency = hasValue && userValue !== item.stock_sistema

                        return (
                          <tr
                            key={item.id}
                            className={`border-b transition-colors ${
                              hasValue && !isEditing
                                ? hasInconsistency
                                  ? "bg-red-50 border-l-4 border-l-red-400 hover:bg-red-100"
                                  : "bg-green-50 hover:bg-green-100"
                                : "hover:bg-orange-50"
                            }`}
                          >
                            <td className="p-1 sm:p-2 md:p-4 font-medium text-slate-800 text-xs sm:text-sm">
                              <div
                                className="truncate max-w-[140px] sm:max-w-none cursor-pointer hover:text-[#E47C00] transition-colors sm:cursor-default sm:hover:text-slate-800"
                                title={item.denominacion}
                                onClick={() => (window.innerWidth < 640 ? openProductModal(item) : undefined)}
                              >
                                {item.denominacion}
                              </div>
                            </td>
                            <td className="p-1 sm:p-2 md:p-4 text-center">
                              {isEditing ? (
                                // Modo edición
                                <div className="flex items-center justify-center space-x-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={editingItems[item.id] || ""}
                                    onChange={(e) => handleInputChange(item.id, e.target.value)}
                                    className="w-16 sm:w-20 text-center text-xs sm:text-sm font-semibold border-orange-300 focus:border-[#E47C00] h-7 sm:h-8"
                                    autoFocus
                                  />
                                  <Button
                                    onClick={() => saveVerification(item.id)}
                                    disabled={!editingItems[item.id] || saving === item.id}
                                    size="sm"
                                    className="bg-[#E47C00] hover:bg-orange-600 p-1.5 h-7 sm:h-8 w-7 sm:w-8"
                                  >
                                    {saving === item.id ? (
                                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => cancelEditing(item.id)}
                                    size="sm"
                                    variant="outline"
                                    className="p-1.5 h-7 sm:h-8 w-7 sm:w-8 border-gray-300"
                                  >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              ) : hasValue ? (
                                // Modo mostrar valor guardado
                                <div className="flex items-center justify-center space-x-2">
                                  <Badge className="bg-green-100 text-green-800 border-green-300 px-2 py-1 text-xs sm:text-sm font-semibold">
                                    {userValue}
                                  </Badge>
                                  <Button
                                    onClick={() => startEditing(item.id, userValue)}
                                    size="sm"
                                    variant="outline"
                                    className="p-1.5 h-7 sm:h-8 w-7 sm:w-8 border-blue-300 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              ) : (
                                // Modo inicial - sin valor
                                <Button
                                  onClick={() => startEditing(item.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-[#E47C00] text-[#E47C00] hover:bg-[#E47C00]/10"
                                >
                                  ?
                                </Button>
                              )}
                            </td>
                            <td className="p-1 sm:p-2 md:p-4 text-center">
                              {hasValue && !isEditing ? (
                                <div className="flex items-center justify-center space-x-1">
                                  <div className="p-1 sm:p-1.5 bg-green-100 rounded-full">
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                  </div>
                                  {hasInconsistency && (
                                    <div
                                      className="p-1 bg-red-100 rounded-full"
                                      title="Diferencia detectada con el stock del sistema"
                                    >
                                      <AlertTriangle className="h-3 w-3 text-red-600" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-orange-300 rounded-full" />
                                </div>
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

            {/* Progress - Responsive */}
            <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                  <span className="text-base sm:text-lg font-semibold text-slate-700">Progreso de verificación</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800">
                    {
                      selectedControl.stock_items.filter((item) =>
                        currentUser?.role === "user1"
                          ? item.user1_value !== null && item.user1_value !== undefined
                          : item.user2_value !== null && item.user2_value !== undefined,
                      ).length
                    }{" "}
                    / {selectedControl.stock_items.length}
                  </span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-3 sm:h-4">
                  <div
                    className="bg-gradient-to-r from-[#E47C00] to-orange-600 h-3 sm:h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (selectedControl.stock_items.filter((item) =>
                          currentUser?.role === "user1"
                            ? item.user1_value !== null && item.user1_value !== undefined
                            : item.user2_value !== null && item.user2_value !== undefined,
                        ).length /
                          selectedControl.stock_items.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
        {/* Modal de información del producto - Solo móvil */}
        {selectedProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 sm:hidden">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full max-h-[80vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-[#E47C00] to-orange-600 text-white p-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Información del Producto</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeProductModal}
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-slate-600">Código</Label>
                  <p className="text-lg font-mono font-bold text-[#E47C00] mt-1">{selectedProductModal.codigo}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-600">Denominación Completa</Label>
                  <p className="text-base font-medium text-slate-800 mt-1 leading-relaxed">
                    {selectedProductModal.denominacion}
                  </p>
                </div>

                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <Label className="text-sm font-semibold text-orange-800">Recordatorio</Label>
                  </div>
                  <p className="text-sm text-orange-700">
                    Verifica físicamente este producto y registra la cantidad exacta que encuentres.
                  </p>
                </div>

                <Button onClick={closeProductModal} className="w-full bg-[#E47C00] hover:bg-orange-600 text-white">
                  Entendido
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
