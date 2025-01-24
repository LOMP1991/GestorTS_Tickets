'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Pencil, User, FileText } from 'lucide-react'
import { useState } from 'react'
import { EditTicketModal } from './edit-ticket-modal'
import type { Ticket, UserProfile } from '@/types'

interface TicketItemProps {
  ticket: Ticket & {
    assigned_user: UserProfile
    created_by: UserProfile
  }
  onUpdateStatus: (ticketId: string, newStatus: Ticket['status']) => void
  onUpdateTicket: (ticketId: string, updatedTicket: Partial<Ticket>) => void
  currentUserRole: string
}

export function TicketItem({ ticket, onUpdateStatus, onUpdateTicket, currentUserRole }: TicketItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const canEdit = currentUserRole === 'admin' || 
                 ticket.assigned_user?.id === ticket.assigned_user_id

  return (
    <>
      <Card className="bg-card hover:shadow-md transition-shadow">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{ticket.title}</CardTitle>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditModalOpen(true)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar ticket</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <p className="text-sm text-muted-foreground">{ticket.description}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Asignado a: {ticket.assigned_user?.full_name || 'Sin asignar'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Creado por: {ticket.created_by?.full_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
          {ticket.policy_number && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Póliza: {ticket.policy_number}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <EditTicketModal
          ticket={ticket}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={onUpdateTicket}
        />
      )}
    </>
  )
}

