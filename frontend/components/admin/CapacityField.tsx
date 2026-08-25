'use client'

import { forwardRef } from 'react'
import Input, { InputProps } from '../ui/Input'
import { MAX_EVENT_CAPACITY } from '../../lib/event-categories'

interface CapacityFieldProps extends Omit<InputProps, 'type' | 'label' | 'inputMode'> {
  minEnrolled?: number
}

const CapacityField = forwardRef<HTMLInputElement, CapacityFieldProps>(
  ({ minEnrolled = 0, hint, min, max, ...props }, ref) => {
    const minimum = Math.max(1, minEnrolled, typeof min === 'number' ? min : 1)
    const defaultHint =
      minEnrolled > 0
        ? `Mín. ${minimum} vagas (${minEnrolled} inscrito(s))`
        : 'Total de vagas para inscrição'

    return (
      <Input
        ref={ref}
        type="number"
        inputMode="numeric"
        label="Capacidade"
        placeholder="Ex.: 100"
        min={minimum}
        max={max ?? MAX_EVENT_CAPACITY}
        step={1}
        hint={hint ?? defaultHint}
        {...props}
      />
    )
  },
)

CapacityField.displayName = 'CapacityField'

export default CapacityField
