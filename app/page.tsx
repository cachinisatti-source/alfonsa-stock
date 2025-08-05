"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Users, BarChart3 } from "lucide-react"

type User = {
  id: string
  name: string
  role: "lider" | "user1" | "user2"
}

export default function LoginPage() {
  const [customName, setCustomName] = useState("")

  const predefinedUsers: User[] = [
    { id: "lider", name: "Líder", role: "lider" },
    { id: "user1", name: "Usuario 1", role: "user1" },
    { id: "user2", name: "Usuario 2", role: "user2" },
  ]

  const handleLogin = (user: User) => {
    localStorage.setItem("currentUser", JSON.stringify(user))
    if (user.role === "lider") {
      window.location.href = "/dashboard"
    } else {
      window.location.href = "/verification"
    }
  }

  const handleCustomLogin = () => {
    if (!customName.trim()) return

    const customUser: User = {
      id: `custom_${Date.now()}`,
      name: customName,
      role: "user1",
    }

    handleLogin(customUser)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Package className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Alfonsa Bebidas</h1>
          </div>
          <p className="text-gray-600">Sistema de Control de Stock</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Seleccionar Usuario</span>
            </CardTitle>
            <CardDescription>Elige tu rol para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {predefinedUsers.map((user) => (
                <Button
                  key={user.id}
                  variant={user.role === "lider" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleLogin(user)}
                >
                  {user.role === "lider" && <BarChart3 className="h-4 w-4 mr-2" />}
                  {user.role !== "lider" && <Users className="h-4 w-4 mr-2" />}
                  {user.name}
                  {user.role === "lider" && (
                    <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>
                  )}
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">O</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-name">Nombre personalizado</Label>
              <div className="flex space-x-2">
                <Input
                  id="custom-name"
                  placeholder="Ingresa tu nombre"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomLogin()}
                />
                <Button onClick={handleCustomLogin} disabled={!customName.trim()}>
                  Entrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Sistema desarrollado para Alfonsa Bebidas</p>
        </div>
      </div>
    </div>
  )
}
