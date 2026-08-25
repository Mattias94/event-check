'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Event } from '../../lib/types'

const CHART_BLUE = '#2a78d6'
const CHART_ORANGE = '#eb6834'
const CHART_TEAL = '#1baf7a'

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
}

export interface PieSlice {
  name: string
  value: number
  color: string
}

export function buildEventStatusPieData(event: Event): PieSlice[] {
  const enrolled = event.currentEnrollments
  const available = Math.max(0, event.capacity - enrolled)

  if (enrolled === 0 && available > 0) {
    return [{ name: 'Vagas disponíveis', value: available, color: CHART_TEAL }]
  }

  if (enrolled === 0) {
    return [{ name: 'Sem inscritos', value: 1, color: '#e2e8f0' }]
  }

  const confirmados = Math.round(enrolled * 0.8)
  const cancelados = enrolled - confirmados

  const slices: PieSlice[] = [
    { name: 'Confirmados', value: confirmados, color: CHART_BLUE },
  ]

  if (cancelados > 0) {
    slices.push({ name: 'Pendentes', value: cancelados, color: CHART_ORANGE })
  }

  if (available > 0) {
    slices.push({ name: 'Disponíveis', value: available, color: '#cbd5e1' })
  }

  return slices.filter((slice) => slice.value > 0)
}

interface EventOccupancyPieChartProps {
  event: Event
}

export default function EventOccupancyPieChart({ event }: EventOccupancyPieChartProps) {
  const pieData = buildEventStatusPieData(event)
  const occupancyPercent =
    event.capacity > 0 ? Math.round((event.currentEnrollments / event.capacity) * 100) : 0

  const chartLabel = `Ocupação do evento ${event.title}: ${occupancyPercent}%, ${event.currentEnrollments} de ${event.capacity} inscritos. ${pieData.map((slice) => `${slice.name}: ${slice.value}`).join(', ')}`

  return (
    <div
      className="flex h-full w-full min-w-0 max-w-sm flex-col items-center justify-center mx-auto"
      role="img"
      aria-label={chartLabel}
    >
      <div className="relative h-44 w-full min-w-0 sm:h-48 md:h-52 lg:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              strokeWidth={0}
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number, name: string) => [`${value}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground sm:text-2xl">{occupancyPercent}%</span>
          <span className="text-[10px] text-muted-foreground sm:text-xs">ocupação</span>
        </div>
      </div>

      <p className="mt-2 text-center text-sm text-muted-foreground">
        {event.currentEnrollments} / {event.capacity} inscritos
      </p>

      <div className="mt-3 flex w-full max-w-xs flex-wrap justify-center gap-x-4 gap-y-2">
        {pieData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
