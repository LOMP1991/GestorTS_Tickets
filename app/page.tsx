'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TicketBoard } from './components/ticket-board'
import { UserDashboard } from './components/user-dashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SolvedTickets } from './components/solved-tickets'
import { AddTicketForm } from './components/add-ticket-form'
import { getTickets, updateTicket as updateTicketAction } from './actions'
import { supabase } from '@/lib/supabase'
import type { Ticket, User } from '@/types'
import { Toaster, toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, LogOut } from 'lucide-react'
import { signOut, useAuth } from '@/lib/auth'

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  // Cargar tickets iniciales
  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true)
        const data = await getTickets()
        setTickets(data)
        setError(null)
      } catch (err) {
        console.error('Error loading tickets:', err)
        setError('Error al cargar los tickets. Por favor, intente nuevamente.')
        // Show toast directly here
        toast.error('Error al cargar los tickets. Por favor, intente nuevamente.')
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [])

  // Configurar suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('tickets-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        async (payload) => {
          console.log('Cambio detectado:', payload)
          const updatedTickets = await getTickets()
          setTickets(updatedTickets)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const currentUser: User = {
    id: user?.id || '1',
    name: 'Orlando Martinez',
    email: user?.email || 'luis.martinez@softwareone.com',
    role: 'Analista LV3',
    avatar: '/placeholder.svg?height=40&width=40'
  }

  const updateTicketStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      await updateTicketAction(ticketId, { status: newStatus })
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const updateTicket = async (ticketId: string, updatedTicket: Partial<Ticket>) => {
    try {
      await updateTicketAction(ticketId, updatedTicket)
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="flex items-center space-x-2 p-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p>Cargando tickets...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="solved">Solucionados</TabsTrigger>
          <TabsTrigger value="new">Nuevo Ticket</TabsTrigger>
          <TabsTrigger value="user">Usuario</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          <TicketBoard 
            tickets={tickets} 
            onUpdateStatus={updateTicketStatus}
            onUpdateTicket={updateTicket}
          />
        </TabsContent>
        <TabsContent value="solved">
          <SolvedTickets 
            tickets={tickets}
            onUpdateStatus={updateTicketStatus}
            onUpdateTicket={updateTicket}
          />
        </TabsContent>
        <TabsContent value="new">
          <AddTicketForm />
        </TabsContent>
        <TabsContent value="user">
          <UserDashboard user={currentUser} tickets={tickets} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

