"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, CheckCircle, AlertCircle } from "lucide-react"

type StockItem = {
  codigo: string
  denominacion: string
  stockSistema: number
  user1?: number
  user2?: number
  corregido?: number
  resultado?: number
}

type User = {
  id: string
  name: string
  role: "lider" | "user1" | "user2"
}

type StockControl = {
  id: string
  name: string
  createdAt: string
  items: StockItem[]
}

export default function VerificationPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [stockControls, setStockControls] = useState<StockControl[]>([])
  const [selectedControl, setSelectedControl] = useState<StockControl | null>(null)
  const [userInputs, setUserInputs] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      const parsedUser = JSON.parse(user)
      setCurrentUser(parsedUser)
      if (parsedUser.role === "lider") {
        window.location.href = "/dashboard"
        return
      }
    } else {
      window.location.href = "/"
      return
    }

    // Cargar controles de stock
    const savedControls = localStorage.getItem("stockControls")
    if (savedControls) {
      const controls = JSON.parse(savedControls)
      setStockControls(controls)
    }
  }, [])

  const handleInputChange = (index: number, value: string) => {
    setUserInputs((prev) => ({
      ...prev,
      [index]: value,
    }))
  }

  const saveVerification = (index: number) => {
    if (!selectedControl) return

    const value = Number.parseInt(userInputs[index]) || 0
    const updatedControl = { ...selectedControl }

    if (currentUser?.role === "user1") {
      updatedControl.items[index].user1 = value
    } else if (currentUser?.role === "user2") {
      updatedControl.items[index].user2 = value
    }

    // Actualizar en la lista de controles
    const updatedControls = stockControls.map((control) =>
      control.id === selectedControl.id ? updatedControl : control,
    )

    setStockControls(updatedControls)
    setSelectedControl(updatedControl)
    localStorage.setItem("stockControls", JSON.stringify(updatedControls))

    // Limpiar input después de guardar
    setUserInputs((prev) => ({
      ...prev,
      [index]: "",
    }))
  }

  const logout = () => {
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  if (!currentUser) return <div>Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verificación de Stock</h1>
              <p className="text-gray-600">Bienvenido, {currentUser.name}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {selectedControl && (
              <Button variant="outline" onClick={() => setSelectedControl(null)}>
                Volver a Controles
              </Button>
            )}
            <Button variant="outline" onClick={logout}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        {!selectedControl ? (
          // Vista de selección de controles
          <>
            {stockControls.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay controles disponibles</h3>
                  <p className="text-gray-600">El líder aún no ha creado ningún control de stock.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Seleccionar Control de Stock</CardTitle>
                    <CardDescription>Elige qué control de stock deseas verificar</CardDescription>
                  </CardHeader>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stockControls.map((control) => {
                    const userVerifications = control.items.filter((item) =>
                      currentUser?.role === "user1" ? item.user1 !== undefined : item.user2 !== undefined,
                    ).length
                    const totalItems = control.items.length
                    const progress = totalItems > 0 ? (userVerifications / totalItems) * 100 : 0

                    return (
                      <Card
                        key={control.id}
                        className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                        onClick={() => setSelectedControl(control)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg text-gray-900">{control.name}</h3>
                              <p className="text-sm text-gray-600">{control.items.length} productos</p>
                              <p className="text-xs text-gray-500">
                                {new Date(control.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {progress === 100 && <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progreso</span>
                              <span>
                                {userVerifications}/{totalItems}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
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
          // Vista de verificación de productos
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>{selectedControl.name}</span>
                </CardTitle>
                <CardDescription>
                  Verifica físicamente cada producto y registra la cantidad exacta que encuentres.
                  <strong className="text-red-600"> No puedes ver el stock del sistema.</strong>
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left p-4 font-semibold">Código</th>
                        <th className="text-left p-4 font-semibold">Denominación</th>
                        <th className="text-center p-4 font-semibold">Cantidad Física</th>
                        <th className="text-center p-4 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedControl.items.map((item, index) => {
                        const userValue = currentUser?.role === "user1" ? item.user1 : item.user2
                        const hasValue = userValue !== undefined

                        return (
                          <tr key={index} className={`border-b hover:bg-gray-50 ${hasValue ? "bg-green-50" : ""}`}>
                            <td className="p-4 font-mono text-blue-600 font-semibold">#{item.codigo}</td>
                            <td className="p-4 font-medium">{item.denominacion}</td>
                            <td className="p-4 text-center">
                              {hasValue ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                  {userValue}
                                </Badge>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={userInputs[index] || ""}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="w-24 text-center"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => saveVerification(index)}
                                    disabled={!userInputs[index]}
                                  >
                                    Guardar
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {hasValue ? (
                                <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <div className="h-5 w-5 border-2 border-gray-300 rounded-full mx-auto" />
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

            {/* Progress */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progreso de verificación</span>
                  <span className="text-sm font-semibold">
                    {
                      selectedControl.items.filter((item) =>
                        currentUser?.role === "user1" ? item.user1 !== undefined : item.user2 !== undefined,
                      ).length
                    }{" "}
                    / {selectedControl.items.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (selectedControl.items.filter((item) =>
                          currentUser?.role === "user1" ? item.user1 !== undefined : item.user2 !== undefined,
                        ).length /
                          selectedControl.items.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
