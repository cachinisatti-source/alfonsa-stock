"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, BarChart3, Lock, UserIcon, Edit2, Check, X, CheckCircle, ArrowLeft } from "lucide-react"

type SystemUser = {
  id: string
  name: string
  role: "lider" | "user1" | "user2"
  branch?: string
}

export default function LoginPage() {
  const [customName, setCustomName] = useState("")
  const [showLeaderLogin, setShowLeaderLogin] = useState(false)
  const [leaderCredentials, setLeaderCredentials] = useState({ username: "", password: "" })
  const [loginError, setLoginError] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [predefinedUsers, setPredefinedUsers] = useState<SystemUser[]>([
    { id: "user1", name: "Usuario 1", role: "user1" },
    { id: "user2", name: "Usuario 2", role: "user2" },
  ])
  const [selectedBranch, setSelectedBranch] = useState<string>("")

  const branches = [
    { id: "betbeder", name: "Betbeder", color: "from-blue-600 to-blue-700" },
    { id: "iseas", name: "Iseas", color: "from-green-600 to-green-700" },
    { id: "llerena", name: "Llerena", color: "from-purple-600 to-purple-700" },
  ]

  useEffect(() => {
    // Cargar nombres personalizados guardados
    const savedUser1Name = localStorage.getItem("user1_custom_name")
    const savedUser2Name = localStorage.getItem("user2_custom_name")

    if (savedUser1Name) {
      setPredefinedUsers((prev) => prev.map((user) => (user.id === "user1" ? { ...user, name: savedUser1Name } : user)))
    }

    if (savedUser2Name) {
      setPredefinedUsers((prev) => prev.map((user) => (user.id === "user2" ? { ...user, name: savedUser2Name } : user)))
    }
  }, [])

  const handleLogin = (user: SystemUser) => {
    if (!selectedBranch) {
      alert("Por favor selecciona una sucursal")
      return
    }

    const userWithBranch = { ...user, branch: selectedBranch }
    localStorage.setItem("currentUser", JSON.stringify(userWithBranch))
    localStorage.setItem("currentBranch", selectedBranch)

    if (user.role === "lider") {
      window.location.href = "/dashboard"
    } else {
      window.location.href = "/verification"
    }
  }

  const handleLeaderLogin = () => {
    if (!selectedBranch) {
      alert("Por favor selecciona una sucursal primero")
      return
    }

    if (leaderCredentials.username === "admin" && leaderCredentials.password === "admin1234") {
      const leaderUser: SystemUser = { id: "lider", name: "Líder", role: "lider" }
      handleLogin(leaderUser)
    } else {
      setLoginError("Usuario o contraseña incorrectos")
    }
  }

  const handleCustomLogin = () => {
    if (!selectedBranch) {
      alert("Por favor selecciona una sucursal primero")
      return
    }

    if (!customName.trim()) return

    const customUser: SystemUser = {
      id: `custom_${Date.now()}`,
      name: customName,
      role: "user1",
    }

    handleLogin(customUser)
  }

  const startEditing = (userId: string, currentName: string) => {
    setEditingUser(userId)
    setEditingName(currentName)
  }

  const saveUserName = (userId: string) => {
    if (!editingName.trim()) return

    // Actualizar en el estado
    setPredefinedUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, name: editingName.trim() } : user)),
    )

    // Guardar en localStorage
    localStorage.setItem(`${userId}_custom_name`, editingName.trim())

    // Limpiar estado de edición
    setEditingUser(null)
    setEditingName("")
  }

  const cancelEditing = () => {
    setEditingUser(null)
    setEditingName("")
  }

  const goToMainSite = () => {
    window.open("https://pedidos-alfonsa-dist.vercel.app/", "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-amber-900 to-orange-800 flex items-center justify-center p-3 sm:p-4 relative">
      {/* Botón página principal - Esquina superior izquierda */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
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

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3Zn')] opacity-20"></div>

      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8 relative z-10 mt-12 sm:mt-0">
        {/* Header - Responsive */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-[#E47C00] to-orange-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Alfonsa Distribuidora</h1>
              <p className="text-sm sm:text-base text-orange-200">Sistema de Control de Stock</p>
            </div>
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-white text-lg sm:text-xl">Acceso al Sistema</CardTitle>
            <CardDescription className="text-orange-200 text-sm sm:text-base">
              Selecciona tu rol para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {!showLeaderLogin ? (
              <>
                {/* Botón Líder - Responsive */}
                <Button
                  onClick={() => setShowLeaderLogin(true)}
                  className="w-full h-10 sm:h-12 bg-gradient-to-r from-[#E47C00] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                  Acceso Líder
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-3 text-orange-200 font-medium">Usuarios</span>
                  </div>
                </div>

                {/* Usuarios predefinidos - Responsive */}
                <div className="grid gap-2 sm:gap-3">
                  {predefinedUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      {editingUser === user.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveUserName(user.id)
                              if (e.key === "Escape") cancelEditing()
                            }}
                            className="bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus:bg-white/20 focus:border-[#E47C00]/50 text-sm sm:text-base h-9 sm:h-10"
                            placeholder="Nombre del usuario"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => saveUserName(user.id)}
                            className="bg-green-600 hover:bg-green-700 p-1.5 sm:p-2 h-9 sm:h-10"
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="bg-white/5 border-white/20 text-white hover:bg-red-500/20 p-1.5 sm:p-2 h-9 sm:h-10"
                          >
                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="flex-1 h-9 sm:h-12 bg-white/5 border-white/20 text-white hover:bg-[#E47C00]/20 hover:border-[#E47C00]/30 transition-all duration-200 justify-start text-sm sm:text-base"
                            onClick={() => handleLogin(user)}
                          >
                            <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                            <span className="truncate">{user.name}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(user.id, user.name)}
                            className="bg-white/5 border-white/20 text-white hover:bg-[#E47C00]/20 hover:border-[#E47C00]/30 p-1.5 sm:p-2 h-9 sm:h-10"
                          >
                            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Selector de Sucursal - Compacto */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-white font-medium text-sm sm:text-base">Sucursal</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {branches.map((branch) => (
                      <Button
                        key={branch.id}
                        onClick={() => setSelectedBranch(branch.id)}
                        variant={selectedBranch === branch.id ? "default" : "outline"}
                        className={`h-8 sm:h-10 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          selectedBranch === branch.id
                            ? `bg-gradient-to-r ${branch.color} text-white shadow-md scale-105`
                            : "bg-white/5 border-white/20 text-white hover:bg-white/10"
                        }`}
                      >
                        {branch.name}
                        {selectedBranch === branch.id && <CheckCircle className="h-3 w-3 ml-1" />}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-3 text-orange-200 font-medium">Personalizado</span>
                  </div>
                </div>

                {/* Usuario personalizado - Responsive */}
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="custom-name" className="text-white font-medium text-sm sm:text-base">
                    Nombre personalizado
                  </Label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Input
                      id="custom-name"
                      placeholder="Ingresa tu nombre"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCustomLogin()}
                      className="bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus:bg-white/20 focus:border-[#E47C00]/50 text-sm sm:text-base h-9 sm:h-10"
                    />
                    <Button
                      onClick={handleCustomLogin}
                      disabled={!customName.trim()}
                      className="bg-[#E47C00] hover:bg-orange-600 h-9 sm:h-10 text-sm sm:text-base w-full sm:w-auto"
                    >
                      Entrar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login del Líder - Responsive */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-[#E47C00] to-orange-600 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                      <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Acceso de Líder</h3>
                    <p className="text-orange-200 text-sm">Ingresa tus credenciales</p>
                  </div>

                  {loginError && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm text-center">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="username" className="text-white font-medium text-sm sm:text-base">
                        Usuario
                      </Label>
                      <Input
                        id="username"
                        placeholder="Ingresa tu usuario"
                        value={leaderCredentials.username}
                        onChange={(e) => {
                          setLeaderCredentials((prev) => ({ ...prev, username: e.target.value }))
                          setLoginError("")
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus:bg-white/20 focus:border-[#E47C00]/50 text-sm sm:text-base h-9 sm:h-10 mt-1 sm:mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-white font-medium text-sm sm:text-base">
                        Contraseña
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Ingresa tu contraseña"
                        value={leaderCredentials.password}
                        onChange={(e) => {
                          setLeaderCredentials((prev) => ({ ...prev, password: e.target.value }))
                          setLoginError("")
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleLeaderLogin()}
                        className="bg-white/10 border-white/20 text-white placeholder:text-orange-200 focus:bg-white/20 focus:border-[#E47C00]/50 text-sm sm:text-base h-9 sm:h-10 mt-1 sm:mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowLeaderLogin(false)
                        setLeaderCredentials({ username: "", password: "" })
                        setLoginError("")
                      }}
                      className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10 h-9 sm:h-10 text-sm sm:text-base"
                    >
                      Volver
                    </Button>
                    <Button
                      onClick={handleLeaderLogin}
                      disabled={!leaderCredentials.username || !leaderCredentials.password}
                      className="flex-1 bg-gradient-to-r from-[#E47C00] to-orange-600 hover:from-orange-600 hover:to-orange-700 h-9 sm:h-10 text-sm sm:text-base"
                    >
                      Ingresar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs sm:text-sm text-orange-200 px-4">
          <p>© 2024 Alfonsa Distribuidora - Sistema de Control de Stock</p>
        </div>
      </div>
    </div>
  )
}
