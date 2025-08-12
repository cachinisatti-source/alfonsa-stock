"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, RefreshCw, Database, Zap, Copy, ExternalLink, ArrowLeft } from "lucide-react"
import { testConnection } from "@/lib/supabase"

export default function SetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null)
  const [testMessage, setTestMessage] = useState("")

  useEffect(() => {
    // Cargar valores actuales si existen
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (currentUrl) setSupabaseUrl(currentUrl)
    if (currentKey) setSupabaseKey(currentKey)
  }, [])

  const handleTest = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult("error")
      setTestMessage("Por favor completa ambos campos")
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // Temporalmente establecer las variables para la prueba
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // @ts-ignore
      process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
      // @ts-ignore
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseKey

      const isConnected = await testConnection()

      // Restaurar valores originales
      // @ts-ignore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      // @ts-ignore
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey

      if (isConnected) {
        setTestResult("success")
        setTestMessage("¡Conexión exitosa! Supabase está configurado correctamente.")
      } else {
        setTestResult("error")
        setTestMessage("No se pudo conectar. Verifica las credenciales y que las tablas estén creadas.")
      }
    } catch (error: any) {
      setTestResult("error")
      setTestMessage(`Error: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copiado al portapapeles")
  }

  const sqlScript = `-- Crear tabla para controles de stock
CREATE TABLE IF NOT EXISTS stock_controls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para items de stock
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    control_id UUID REFERENCES stock_controls(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    denominacion TEXT NOT NULL,
    stock_sistema INTEGER DEFAULT 0,
    user1_value INTEGER,
    user2_value INTEGER,
    corregido INTEGER,
    resultado INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_stock_items_control_id ON stock_items(control_id);
CREATE INDEX IF NOT EXISTS idx_stock_controls_created_at ON stock_controls(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE stock_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad (permitir acceso a todos)
CREATE POLICY "Allow all operations" ON stock_controls FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON stock_items FOR ALL USING (true);`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Database className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Configuración de Supabase</h1>
          </div>
          <p className="text-slate-600">Configura la base de datos para sincronización en tiempo real</p>
        </div>

        {/* Botón de regreso */}
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Sistema
          </Button>
        </div>

        {/* Paso 1: Crear proyecto */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <span className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>Crear Proyecto en Supabase</span>
            </CardTitle>
            <CardDescription className="text-blue-100">Primero necesitas crear un proyecto en Supabase</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-blue-800">1. Ve a Supabase</h3>
                  <p className="text-sm text-blue-600">Crea una cuenta gratuita y un nuevo proyecto</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.open("https://supabase.com", "_blank")}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir a Supabase
                </Button>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-2">2. Obtén las credenciales</h3>
                <p className="text-sm text-amber-700 mb-2">Ve a Settings → API en tu proyecto y copia:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>
                    • <strong>Project URL</strong>
                  </li>
                  <li>
                    • <strong>anon/public key</strong>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 2: Configurar credenciales */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <span className="bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>Configurar Credenciales</span>
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Ingresa las credenciales de tu proyecto Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="supabase-url" className="text-slate-700 font-semibold">
                Project URL
              </Label>
              <Input
                id="supabase-url"
                placeholder="https://tu-proyecto.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="mt-2 border-indigo-300 focus:border-indigo-500"
              />
            </div>
            <div>
              <Label htmlFor="supabase-key" className="text-slate-700 font-semibold">
                Anon/Public Key
              </Label>
              <Input
                id="supabase-key"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="mt-2 border-indigo-300 focus:border-indigo-500"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleTest}
                disabled={!supabaseUrl || !supabaseKey || testing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Probando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Probar Conexión
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-lg flex items-center space-x-3 ${
                  testResult === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                }`}
              >
                {testResult === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <p className={`text-sm ${testResult === "success" ? "text-green-800" : "text-red-800"}`}>
                  {testMessage}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paso 3: Crear tablas */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <span className="bg-white text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>Crear Tablas en la Base de Datos</span>
            </CardTitle>
            <CardDescription className="text-purple-100">
              Ejecuta este script SQL en el SQL Editor de Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Script SQL</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(sqlScript)}
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Script
                </Button>
              </div>
              <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64">
                <pre>{sqlScript}</pre>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Instrucciones:</h4>
                <ol className="text-sm text-purple-700 space-y-1">
                  <li>
                    1. Ve al <strong>SQL Editor</strong> en tu proyecto Supabase
                  </li>
                  <li>2. Pega el script SQL copiado</li>
                  <li>
                    3. Haz clic en <strong>Run</strong>
                  </li>
                  <li>4. Verifica que las tablas se crearon correctamente</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 4: Variables de entorno */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <span className="bg-white text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>Configurar Variables de Entorno</span>
            </CardTitle>
            <CardDescription className="text-green-100">
              Agrega estas variables en Vercel para activar Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-3">Variables para Vercel:</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <code className="text-sm font-mono text-green-700">NEXT_PUBLIC_SUPABASE_URL</code>
                      <p className="text-xs text-green-600 mt-1">{supabaseUrl || "Tu Project URL"}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(supabaseUrl)}
                      disabled={!supabaseUrl}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <code className="text-sm font-mono text-green-700">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                      <p className="text-xs text-green-600 mt-1">
                        {supabaseKey ? `${supabaseKey.substring(0, 30)}...` : "Tu Anon Key"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(supabaseKey)}
                      disabled={!supabaseKey}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Cómo agregar en Vercel:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Ve a tu proyecto en Vercel</li>
                  <li>2. Settings → Environment Variables</li>
                  <li>3. Agrega las dos variables de arriba</li>
                  <li>4. Redeploya tu aplicación</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado final */}
        {testResult === "success" && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <div>
                  <h3 className="text-xl font-bold text-green-800">¡Configuración Completa!</h3>
                  <p className="text-green-700">Supabase está listo para sincronización en tiempo real</p>
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => (window.location.href = "/")} className="bg-green-600 hover:bg-green-700">
                  Ir al Sistema
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/test-supabase")}
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  Probar Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
