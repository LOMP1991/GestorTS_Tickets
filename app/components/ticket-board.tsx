'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TicketItem } from './ticket-item'
import type { Ticket } from '@/types'
import { useAuth } from '@/lib/auth'

interface TicketBoardProps {
  tickets: Ticket[]
  onUpdateStatus: (ticketId: string, newStatus: Ticket['status']) => void
  onUpdateTicket: (ticketId: string, updatedTicket: Partial<Ticket>) => void
}

export function TicketBoard({ tickets, onUpdateStatus, onUpdateTicket }: TicketBoardProps) {
  const { user } = useAuth()

  const ticketsByStatus = {
    assigned: tickets.filter(t => t.status === 'assigned'),
    'in-progress': tickets.filter(t => t.status === 'in-progress'),
    transferred: tickets.filter(t => t.status === 'transferred'),
    solved: tickets.filter(t => t.status === 'solved')
  }

  const statusTitles = {
    assigned: 'Asignados',
    'in-progress': 'En Progreso',
    transferred: 'Transferidos',
    solved: 'Solucionados'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {(Object.keys(ticketsByStatus) as Array<keyof typeof ticketsByStatus>).map(status => (
        <Card key={status}>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between">
              {statusTitles[status]}
              <span className="text-sm bg-primary/10 px-2 py-1 rounded-full">
                {ticketsByStatus[status].length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticketsByStatus[status].map(ticket => (
              <TicketItem 
                key={ticket.id} 
                ticket={ticket} 
                onUpdateStatus={onUpdateStatus}
                onUpdateTicket={onUpdateTicket}
                currentUserRole={user?.role || 'user'}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

