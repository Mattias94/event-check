export const DEFAULT_EVENT_CATEGORIES = [
  'Tecnologia',
  'Negócios',
  'Educação',
  'Networking',
  'Saúde',
  'Outras',
] as const

export function mergeEventCategories(extra: string[] = []): string[] {
  const defaults = new Set<string>(DEFAULT_EVENT_CATEGORIES)
  const legacy = extra.filter(
    (category) => category.trim().length > 0 && !defaults.has(category),
  )
  legacy.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
  return [...DEFAULT_EVENT_CATEGORIES, ...legacy]
}
