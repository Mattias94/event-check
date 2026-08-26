'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Phone, X } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'
import { User, updateUserProfile } from '../lib/auth'
import { displayPhone, formatPhoneInput } from '../lib/phone'

interface ProfileEditDialogProps {
  user: User
  open: boolean
  onClose: () => void
  onSaved: (user: User) => void
}

const MAX_AVATAR_SIZE = 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function ProfileEditDialog({ user, open, onClose, onSaved }: ProfileEditDialogProps) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(displayPhone(user.phone))
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(user.name)
      setPhone(displayPhone(user.phone))
      setAvatarPreview(user.avatarUrl ?? null)
      setAvatarUrl(user.avatarUrl ?? null)
      setAvatarError(null)
      setFormError(null)
    }
  }, [open, user])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError('Formato inválido. Use JPEG, PNG ou WebP.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError('Imagem muito grande. Máximo de 1 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setAvatarPreview(dataUrl)
      setAvatarUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null)
    setAvatarUrl(null)
    setAvatarError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSaving(true)

    try {
      const updated = await updateUserProfile(user.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        avatarUrl,
      })
      localStorage.setItem('currentUser', JSON.stringify(updated))
      onSaved(updated)
      onClose()
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-edit-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border bg-card pb-safe shadow-xl sm:max-h-[90vh] sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="profile-edit-title" className="text-lg font-semibold text-foreground">
            Editar perfil
          </h2>
          <Button type="button" variant="ghost" size="icon" className="size-11" onClick={onClose} aria-label="Fechar">
            <X aria-hidden="true" />
          </Button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col items-center gap-3">
            {avatarPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="size-20 rounded-full object-cover object-center ring-2 ring-border sm:size-24"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="absolute -right-1 -top-1 size-10 rounded-full p-0 md:size-11"
                  aria-label="Remover foto"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground sm:size-24 sm:text-2xl">
                {initials}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus aria-hidden="true" />
              {avatarPreview ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
            />
            {avatarError && <p className="text-center text-sm text-destructive">{avatarError}</p>}
          </div>

          <div className="mt-4 space-y-4">
            <Input
              label="Nome"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Telefone para contato"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              icon={<Phone aria-hidden="true" />}
              value={phone}
              maxLength={15}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            />

            <p className="break-all text-xs text-muted-foreground sm:text-sm">
              E-mail: {user.email} (não editável)
            </p>

            {formError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>
            )}
          </div>

          <div className="mt-auto flex shrink-0 flex-col gap-2 pt-4 sm:flex-row">
            <Button type="button" variant="outline" className="h-11 flex-1 sm:h-10" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 sm:h-10"
              disabled={saving || name.trim().length < 2}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
