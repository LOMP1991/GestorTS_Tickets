"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/auth"
import { testConnection } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    checking: boolean
    error?: string
  }>({ checking: true })

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get("from") || "/"

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testConnection()
        if (!result.success) {
          setConnectionStatus({
            checking: false,
            error: result.error,
          })
          toast.error("Error de conexión con el servidor")
        } else {
          setConnectionStatus({ checking: false })
        }
      } catch (error) {
        setConnectionStatus({
          checking: false,
          error: "Error al verificar la conexión",
        })
        toast.error("Error al verificar la conexión")
      }
    }

    checkConnection()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (connectionStatus.error) {
      toast.error("No se puede iniciar sesión debido a problemas de conexión")
      return
    }

    setLoading(true)

    try {
      if (!email || !password) {
        throw new Error("Por favor ingrese email y contraseña")
      }

      const result = await signIn(email, password)

      if (!result?.user) {
        throw new Error("Credenciales inválidas")
      }

      toast.success("Inicio de sesión exitoso")

      // Ensure we're using window.location for consistent navigation behavior
      window.location.href = redirectTo
    } catch (error) {
      console.error("Error de login:", {
        error,
        message: error instanceof Error ? error.message : "Error desconocido",
        stack: error instanceof Error ? error.stack : undefined,
      })

      let errorMessage = "Error al iniciar sesión"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "object" && error !== null) {
        errorMessage = "Error de autenticación: " + (error.message || JSON.stringify(error))
      }

      toast.error(errorMessage, {
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  if (connectionStatus.checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Verificando conexión...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Error de conexión:{" "}
                {typeof connectionStatus.error === "string" ? connectionStatus.error : "Error de conexión desconocido"}
                <br />
                Por favor, verifique la configuración de Supabase o contacte al administrador.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !!connectionStatus.error}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !!connectionStatus.error}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !!connectionStatus.error}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tiene una cuenta?{" "}
              <Link
                href="/signup"
                className={`text-primary hover:underline ${connectionStatus.error ? "pointer-events-none opacity-50" : ""}`}
              >
                Registrarse
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Cargando...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

