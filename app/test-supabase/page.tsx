"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function TestSupabase() {
  const [tests, setTests] = useState({
    envVars: { status: "loading", message: "" },
    connection: { status: "loading", message: "" },
    tables: { status: "loading", message: "" },
    permissions: { status: "loading", message: "" },
  })

  const runTests = async () => {
    // Reset tests
    setTests({
      envVars: { status: "loading", message: "" },
      connection: { status: "loading", message: "" },
      tables: { status: "loading", message: "" },
      permissions: { status: "loading", message: "" },
    })

    // Test 1: Environment Variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      setTests((prev) => ({
        ...prev,
        envVars: {
          status: "error",
          message: `Faltan variables: ${!supabaseUrl ? "SUPABASE_URL " : ""}${!supabaseKey ? "SUPABASE_ANON_KEY" : ""}`,
        },
      }))
      return
    }

    setTests((prev) => ({
      ...prev,
      envVars: {
        status: "success",
        message: `URL: ${supabaseUrl.substring(0, 30)}... | Key: ${supabaseKey.substring(0, 20)}...`,
      },
    }))

    // Test 2: Connection
    try {
      const { data, error } = await supabase.from("stock_controls").select("count").limit(1)
      if (error) throw error

      setTests((prev) => ({
        ...prev,
        connection: { status: "success", message: "Conexión exitosa a Supabase" },
      }))
    } catch (error: any) {
      setTests((prev) => ({
        ...prev,
        connection: { status: "error", message: `Error de conexión: ${error.message}` },
      }))
      return
    }

    // Test 3: Tables
    try {
      const { data: controls, error: controlsError } = await supabase.from("stock_controls").select("*").limit(1)
      const { data: items, error: itemsError } = await supabase.from("stock_items").select("*").limit(1)

      if (controlsError || itemsError) {
        throw new Error(controlsError?.message || itemsError?.message)
      }

      setTests((prev) => ({
        ...prev,
        tables: { status: "success", message: "Tablas creadas correctamente" },
      }))
    } catch (error: any) {
      setTests((prev) => ({
        ...prev,
        tables: { status: "error", message: `Error en tablas: ${error.message}` },
      }))
      return
    }

    // Test 4: Permissions
    try {
      const testControl = {
        name: "Test Control",
        created_by: "Test User",
      }

      const { data, error } = await supabase.from("stock_controls").insert(testControl).select().single()

      if (error) throw error

      // Limpiar el test
      await supabase.from("stock_controls").delete().eq("id", data.id)

      setTests((prev) => ({
        ...prev,
        permissions: { status: "success", message: "Permisos configurados correctamente" },
      }))
    } catch (error: any) {
      setTests((prev) => ({
        ...prev,
        permissions: { status: "error", message: `Error de permisos: ${error.message}` },
      }))
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "loading":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">✅ OK</Badge>
      case "error":
        return <Badge variant="destructive">❌ Error</Badge>
      case "loading":
        return <Badge variant="outline">⏳ Probando...</Badge>
      default:
        return <Badge variant="outline">❓ Desconocido</Badge>
    }
  }

  const allTestsPassed = Object.values(tests).every((test) => test.status === "success")

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Diagnóstico de Supabase</h1>
          <p className="text-slate-600">Verificando la configuración de la base de datos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estado General</span>
              {allTestsPassed ? (
                <Badge className="bg-green-100 text-green-800">🎉 Todo Funcionando</Badge>
              ) : (
                <Badge variant="destructive">⚠️ Requiere Atención</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(tests.envVars.status)}
                  <div>
                    <h3 className="font-semibold">Variables de Entorno</h3>
                    <p className="text-sm text-slate-600">{tests.envVars.message}</p>
                  </div>
                </div>
                {getStatusBadge(tests.envVars.status)}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(tests.connection.status)}
                  <div>
                    <h3 className="font-semibold">Conexión a Supabase</h3>
                    <p className="text-sm text-slate-600">{tests.connection.message}</p>
                  </div>
                </div>
                {getStatusBadge(tests.connection.status)}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(tests.tables.status)}
                  <div>
                    <h3 className="font-semibold">Tablas de Base de Datos</h3>
                    <p className="text-sm text-slate-600">{tests.tables.message}</p>
                  </div>
                </div>
                {getStatusBadge(tests.tables.status)}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(tests.permissions.status)}
                  <div>
                    <h3 className="font-semibold">Permisos y Políticas</h3>
                    <p className="text-sm text-slate-600">{tests.permissions.message}</p>
                  </div>
                </div>
                {getStatusBadge(tests.permissions.status)}
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <Button onClick={runTests} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Volver a Probar
              </Button>
              <Button onClick={() => (window.location.href = "/")} className="bg-[#E47C00] hover:bg-orange-600">
                Ir al Sistema
              </Button>
            </div>
          </CardContent>
        </Card>

        {allTestsPassed && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">¡Configuración Completa!</h3>
                <p className="text-green-700">
                  Supabase está configurado correctamente. El sistema ahora funcionará en tiempo real con sincronización
                  automática entre usuarios.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Instrucciones de Configuración</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>
                <strong>1.</strong> Crea un proyecto en{" "}
                <a href="https://supabase.com" target="_blank" className="underline" rel="noreferrer">
                  supabase.com
                </a>
              </p>
              <p>
                <strong>2.</strong> Ve a Settings → API y copia la URL y la clave anónima
              </p>
              <p>
                <strong>3.</strong> Agrega las variables de entorno en Vercel
              </p>
              <p>
                <strong>4.</strong> Ejecuta el script SQL en el SQL Editor de Supabase
              </p>
              <p>
                <strong>5.</strong> Redeploya tu aplicación en Vercel
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
