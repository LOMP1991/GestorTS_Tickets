'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Ticket } from "@/types"
import { useState, useEffect } from "react"

interface EditTicketModalProps {
  ticket: Ticket
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (ticketId: string, updatedTicket: Partial<Ticket>) => void
}

export function EditTicketModal({ ticket, open, onOpenChange, onSave }: EditTicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_user_id: '',
    status: '' as Ticket['status'],
    policy_number: '',
    createdAt: '',
  })

  useEffect(() => {
    setFormData({
      title: ticket.title,
      description: ticket.description,
      assigned_user_id: ticket.assigned_user_id || '',
      status: ticket.status,
      policy_number: ticket.policy_number || '',
      createdAt: new Date(ticket.createdAt).toISOString().split('T')[0],
    })
  }, [ticket])

  const handleSave = () => {
    onSave(ticket.id, {
      ...formData,
      createdAt: new Date(formData.createdAt).toISOString(),
    })
    onOpenChange(false)
  }

  const statusOptions = [
    { value: 'assigned', label: 'Asignado' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'transferred', label: 'Transferido' },
    { value: 'solved', label: 'Solucionado' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Ticket</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policyNumber">Número de Póliza</Label>
            <Input
              id="policyNumber"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              placeholder="Ingrese el número de póliza"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="createdAt">Fecha</Label>
            <Input
              id="createdAt"
              type="date"
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as Ticket['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

