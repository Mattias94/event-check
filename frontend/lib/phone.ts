/** Remove tudo que não for dígito. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Formata dígitos no padrão brasileiro: (11) 99999-9999 ou (11) 9999-9999 */
export function formatPhoneBR(digits: string): string {
  const d = phoneDigits(digits).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Máscara progressiva enquanto o usuário digita. */
export function formatPhoneInput(value: string): string {
  return formatPhoneBR(value)
}

/** Exibe telefone salvo (com ou sem formatação prévia). */
export function displayPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) return ''
  const digits = phoneDigits(phone)
  if (digits.length < 10) return phone.trim()
  return formatPhoneBR(digits)
}
