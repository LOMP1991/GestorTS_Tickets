'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Calendar } from 'lucide-react'
import type { Ticket } from '@/types'
import { TicketItem } from './ticket-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from '@/components/ui/label'

interface SolvedTicketsProps {
  tickets: Ticket[]
  onUpdateStatus: (ticketId: string, newStatus: Ticket['status']) => void
  onUpdateTicket: (ticketId: string, updatedTicket: Partial<Ticket>) => void
}

export function SolvedTickets({ tickets, onUpdateStatus, onUpdateTicket }: SolvedTicketsProps) {
  const [policySearch, setPolicySearch] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all')
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  })
  
  // Función para filtrar por fecha
  const filterByDate = (ticket: Ticket) => {
    const ticketDate = new Date(ticket.createdAt)
    const today = new Date()
    
    switch (dateFilter) {
      case 'today':
        return ticketDate.toDateString() === today.toDateString()
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 7)
        return ticketDate >= weekAgo
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(today.getMonth() - 1)
        return ticketDate >= monthAgo
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          const start = new Date(customDateRange.start)
          const end = new Date(customDateRange.end)
          end.setHours(23, 59, 59) // Incluir todo el día final
          return ticketDate >= start && ticketDate <= end
        }
        return true
      default:
        return true
    }
  }

  // Filtrar tickets
  const filteredTickets = tickets
    .filter(ticket => ticket.status === 'solved')
    .filter(ticket => 
      ticket.policyNumber?.toLowerCase().includes(policySearch.toLowerCase())
    )
    .filter(filterByDate)

  // Agrupar por fecha
  const groupedTickets = filteredTickets.reduce((groups, ticket) => {
    const date = new Date(ticket.createdAt)
    const dateKey = date.toISOString().split('T')[0]
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(ticket)
    return groups
  }, {} as Record<string, Ticket[]>)

  const sortedDates = Object.keys(groupedTickets).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <CardTitle className="text-xl font-bold">Tickets Solucionados</CardTitle>
        
        {/* Filtros */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Búsqueda por número de póliza */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de póliza..."
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filtro por fecha */}
          <div className="space-y-2">
            <Select
              value={dateFilter}
              onValueChange={(value: typeof dateFilter) => setDateFilter(value)}
            >
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="custom">Rango personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rango de fechas personalizado */}
        {dateFilter === 'custom' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  start: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha final</Label>
              <Input
                id="end-date"
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  end: e.target.value
                }))}
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {filteredTickets.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No se encontraron tickets solucionados
          </p>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="space-y-4">
              <h3 className="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                {formatDate(date)}
              </h3>
              <div className="grid gap-4">
                {groupedTickets[date].map(ticket => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateTicket={onUpdateTicket}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

