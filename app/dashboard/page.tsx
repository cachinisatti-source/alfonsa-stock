"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Download, Eye, Package, ArrowLeft, Save } from "lucide-react"

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

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [stockText, setStockText] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [stockControls, setStockControls] = useState<StockControl[]>([])
  const [currentControl, setCurrentControl] = useState<StockControl | null>(null)
  const [controlName, setControlName] = useState("")

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

    // Cargar controles guardados
    const savedControls = localStorage.getItem("stockControls")
    if (savedControls) {
      const controls = JSON.parse(savedControls)
      setStockControls(controls)
    }
  }, [])

  const parseStockText = (text: string): StockItem[] => {
    const lines = text.trim().split("\n")
    const items: StockItem[] = []

    lines.forEach((line) => {
      if (!line.trim()) return

      // Buscar el patrón: código + espacios + denominación + posible stock al final
      const match = line.match(/^(\d+)\s+(.+?)(\d+)?\s*$/)

      if (match) {
        const codigo = match[1]
        let denominacion = match[2].trim()
        let stockSistema = 0

        // Si hay un número al final, es el stock
        if (match[3]) {
          stockSistema = Number.parseInt(match[3])
          // Remover el número del final de la denominación si está ahí
          denominacion = denominacion.replace(/\s+\d+\s*$/, "").trim()
        }

        items.push({
          codigo,
          denominacion,
          stockSistema,
        })
      }
    })

    return items
  }

  const handleProcessStock = () => {
    if (!controlName.trim()) {
      alert("Por favor ingresa un nombre para el control de stock")
      return
    }

    const items = parseStockText(stockText)
    const newControl: StockControl = {
      id: `control_${Date.now()}`,
      name: controlName,
      createdAt: new Date().toISOString(),
      items: items,
    }

    const updatedControls = [...stockControls, newControl]
    setStockControls(updatedControls)
    setCurrentControl(newControl)
    localStorage.setItem("stockControls", JSON.stringify(updatedControls))
    setStockText("")
    setControlName("")
  }

  const handleCorrectionChange = (index: number, value: string) => {
    if (!currentControl) return

    const newItems = [...currentControl.items]
    const numValue = value === "" ? undefined : Number.parseInt(value) || 0
    newItems[index].corregido = numValue

    // Calcular resultado si hay corrección
    if (numValue !== undefined) {
      newItems[index].resultado = numValue - newItems[index].stockSistema
    } else {
      newItems[index].resultado = undefined
    }

    const updatedControl: StockControl = { ...currentControl, items: newItems }
    const updatedControls = stockControls.map((control) =>
      control.id === currentControl.id ? updatedControl : control,
    )

    setStockControls(updatedControls)
    setCurrentControl(updatedControl)
    localStorage.setItem("stockControls", JSON.stringify(updatedControls))
  }

  const exportToCSV = () => {
    if (!currentControl) return

    const headers = ["Código", "Denominación", "Stock Sistema", "Usuario 1", "Usuario 2", "Corregido", "Resultado"]
    const csvContent = [
      headers.join(","),
      ...currentControl.items.map((item) =>
        [
          item.codigo,
          `"${item.denominacion}"`,
          item.stockSistema,
          item.user1 || "",
          item.user2 || "",
          item.corregido || "",
          item.resultado || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `stock_control_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
              <h1 className="text-2xl font-bold text-gray-900">Panel de Control - Líder</h1>
              <p className="text-gray-600">Bienvenido, {currentUser.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>

        {/* Upload Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Crear Nuevo Control de Stock</span>
            </CardTitle>
            <CardDescription>Crea un nuevo control de stock desde el sistema Husky</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="control-name">Nombre del Control</Label>
              <Input
                id="control-name"
                placeholder="Ej: Control Stock Licores, Control Stock Cervezas..."
                value={controlName}
                onChange={(e) => setControlName(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="265             AMARULA 375CC CHICOOO                       
266             AMARULA 750CC                               
8194            AMARULA CREAM ETHIOPIAN COFFE 750           
25              ANIS 8 HERMANOS LITRO                       60
275             BEZIER CREMA DE CASSIS                      12"
              value={stockText}
              onChange={(e) => setStockText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <Button onClick={handleProcessStock} disabled={!stockText.trim() || !controlName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Crear Control de Stock
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Controles */}
        {stockControls.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Controles de Stock Creados</CardTitle>
              <CardDescription>{stockControls.length} controles disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stockControls.map((control) => (
                  <Card
                    key={control.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentControl?.id === control.id ? "border-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => setCurrentControl(control)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{control.name}</h3>
                      <p className="text-sm text-gray-600">{control.items.length} productos</p>
                      <p className="text-xs text-gray-500">{new Date(control.createdAt).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Items */}
        {currentControl && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>{currentControl.name}</span>
                  </CardTitle>
                  <CardDescription>{currentControl.items.length} productos</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowResults(!showResults)}>
                    {showResults ? "Ocultar" : "Ver"} Resultados
                  </Button>
                  <Button onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Código</th>
                      <th className="border border-gray-300 p-2 text-left">Denominación</th>
                      <th className="border border-gray-300 p-2 text-center">Stock Sistema</th>
                      <th className="border border-gray-300 p-2 text-center">Usuario 1</th>
                      <th className="border border-gray-300 p-2 text-center">Usuario 2</th>
                      <th className="border border-gray-300 p-2 text-center">Corregido</th>
                      {showResults && <th className="border border-gray-300 p-2 text-center">Resultado</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentControl.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-mono">{item.codigo}</td>
                        <td className="border border-gray-300 p-2">{item.denominacion}</td>
                        <td className="border border-gray-300 p-2 text-center font-semibold">{item.stockSistema}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          {item.user1 !== undefined ? (
                            <Badge variant="outline">{item.user1}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {item.user2 !== undefined ? (
                            <Badge variant="outline">{item.user2}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.corregido || ""}
                            onChange={(e) => handleCorrectionChange(index, e.target.value)}
                            className="w-20 text-center"
                            placeholder="0"
                          />
                        </td>
                        {showResults && (
                          <td className="border border-gray-300 p-2 text-center">
                            {item.resultado !== undefined && (
                              <Badge
                                variant={item.resultado === 0 ? "outline" : "default"}
                                className={
                                  item.resultado > 0
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : item.resultado < 0
                                      ? "bg-red-100 text-red-800 border-red-300"
                                      : ""
                                }
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
