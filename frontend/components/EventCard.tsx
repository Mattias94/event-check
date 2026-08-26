'use client'

import Link from 'next/link'
import { CalendarDays, Clock, Tag, Users } from 'lucide-react'
import EventCoverImage from './EventCoverImage'
import EventLocationTrigger from './EventLocationTrigger'
import { Event } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Badge } from './ui/Badge'
import { Progress } from './ui/Progress'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const availableSpots = event.capacity - event.currentEnrollments
  const isAlmostFull = availableSpots <= Math.ceil(event.capacity * 0.2)

  const statusVariant =
    event.status === 'active' ? ('success' as const)
    : event.status === 'cancelled' ? ('destructive' as const)
    : ('secondary' as const)
  const statusLabel =
    event.status === 'active' ? 'Ativo' : event.status === 'cancelled' ? 'Cancelado' : 'Finalizado'

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:border-primary/40 group-hover:shadow-md">
        {event.coverImageUrl && (
          <EventCoverImage src={event.coverImageUrl} maxHeightClass="max-h-44 sm:max-h-48" />
        )}
        <CardHeader className="pb-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="min-w-0 flex-1 line-clamp-2 text-base leading-snug md:text-lg">
              {event.title}
            </CardTitle>
            <Badge variant={statusVariant} className="w-fit shrink-0">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-col gap-1.5 xs:flex-row xs:flex-wrap xs:items-center xs:gap-x-4 xs:gap-y-1">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                {new Date(event.date).toLocaleDateString('pt-BR')}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4 shrink-0" aria-hidden="true" />
                {event.time}
              </span>
            </div>
            <p className="flex items-center gap-2">
              <EventLocationTrigger
                location={event.location}
                latitude={event.latitude}
                longitude={event.longitude}
                className="min-w-0 flex-1"
              />
            </p>
            <p className="flex items-center gap-2">
              <Tag className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{event.category}</span>
            </p>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                Vagas
              </span>
              <span className={`font-medium ${isAlmostFull ? 'text-destructive' : 'text-success'}`}>
                {availableSpots}/{event.capacity}
              </span>
            </div>
            <Progress
              value={event.currentEnrollments}
              max={event.capacity}
              indicatorClassName={isAlmostFull ? 'bg-destructive' : undefined}
              aria-label="Ocupação de vagas"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
