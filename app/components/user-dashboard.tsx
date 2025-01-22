import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, Clock, MoveRight, UserCheck } from 'lucide-react'
import type { Ticket, User } from '@/types'

interface UserDashboardProps {
  user: User
  tickets: Ticket[]
}

export function UserDashboard({ user, tickets }: UserDashboardProps) {
  const ticketStats = {
    assigned: tickets.filter(t => t.status === 'assigned').length,
    'in-progress': tickets.filter(t => t.status === 'in-progress').length,
    transferred: tickets.filter(t => t.status === 'transferred').length,
    solved: tickets.filter(t => t.status === 'solved').length,
  }

  const statCards = [
    {
      title: 'Asignados',
      value: ticketStats.assigned,
      icon: UserCheck,
      color: 'text-blue-500'
    },
    {
      title: 'En Progreso',
      value: ticketStats['in-progress'],
      icon: Clock,
      color: 'text-yellow-500'
    },
    {
      title: 'Transferidos',
      value: ticketStats.transferred,
      icon: MoveRight,
      color: 'text-purple-500'
    },
    {
      title: 'Solucionados',
      value: ticketStats.solved,
      icon: CheckCircle2,
      color: 'text-green-500'
    }
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle>{user.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.role}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <Card key={stat.title}>
            <CardContent className="flex flex-row items-center p-6">
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

