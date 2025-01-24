'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createTicket, getAvailableUsers } from '../actions'
import type { Ticket, UserProfile } from '@/types'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'

export function AddTicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_user_id: '',
    status: 'assigned' as Ticket['status'],
    policy_number: '',
    createdAt: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const loadUsers = async () => {
      const availableUsers = await getAvailableUsers()
      setUsers(availableUsers)
      
      // If not admin, auto-assign to self
      if (availableUsers.length === 1 && availableUsers[0].id === user?.id) {
        setFormData(prev => ({
          ...prev,
          assigned_user_id: user.id
        }))
      }
    }
    loadUsers()
  }, [user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // If not admin, ensure ticket is self-assigned
      const finalData = {
        ...formData,
        assigned_user_id: users.length === 1 ? user?.id : formData.assigned_user_id,
        createdAt: new Date(formData.createdAt).toISOString(),
      }

      const result = await createTicket(finalData)

      if (result.success) {
        setFormData({
          title: '',
          description: '',
          assigned_user_id: users.length === 1 ? user?.id || '' : '',
          status: 'assigned',
          policy_number: '',
          createdAt: new Date().toISOString().split('T')[0],
        })
        toast.success('Ticket creado exitosamente')
      } else {
        toast.error(result.error || 'Error al crear el ticket')
      }
    } catch (error) {
      console.error('Error al crear ticket:', error)
      toast.error('Error inesperado al crear el ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusOptions = [
    { value: 'assigned', label: 'Asignado' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'transferred', label: 'Transferido' },
    { value: 'solved', label: 'Solucionado' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ingrese el título del ticket"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describa el problema o solicitud"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="policy_number">Número de Póliza</Label>
            <Input
              id="policy_number"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              placeholder="Ingrese el número de póliza"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assigned_user_id">Asignar a</Label>
            <Select
              value={formData.assigned_user_id}
              onValueChange={(value) => setFormData({ ...formData, assigned_user_id: value })}
              disabled={users.length === 1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {users.length === 1 && (
              <p className="text-sm text-muted-foreground">
                Los tickets serán asignados automáticamente a su usuario
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as Ticket['status'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el estado" />
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

          <div className="grid gap-2">
            <Label htmlFor="createdAt">Fecha</Label>
            <Input
              id="createdAt"
              type="date"
              value={formData.createdAt}
              onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando...' : 'Crear Ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

