'use client'

import Link from 'next/link'
import { Event } from '../lib/types'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const availableSpots = event.capacity - event.currentEnrollments
  const isAlmostFull = availableSpots <= Math.ceil(event.capacity * 0.2)

  return (
    <Link href={`/events/${event.id}`}>
      <div className="card p-4 md:p-4 hover:shadow-lg transition cursor-pointer h-full">
        <div className="flex flex-col gap-3 mb-3">
          <div className="flex justify-between items-start gap-2 min-h-[3rem]">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base md:text-lg line-clamp-2">{event.title}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              event.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : event.status === 'cancelled'
                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {event.status === 'active' ? 'Ativo' : event.status === 'cancelled' ? 'Cancelado' : 'Finalizado'}
            </span>
          </div>
        </div>

        <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
          <p>📅 {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}</p>
          <p>📍 {event.location}</p>
          <p>📂 {event.category}</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center text-xs md:text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">Vagas</span>
            <span className={`font-medium ${isAlmostFull ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {availableSpots}/{event.capacity}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isAlmostFull ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${((event.capacity - availableSpots) / event.capacity) * 100}%` }}
            />
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{event.description}</p>
      </div>
    </Link>
  )
}
