// Third-party Imports
import 'server-only'

const dictionaries = {
  pt: () => import('@/sidebar/dictionaries/pt.json').then(module => module.default),
  en: () => import('@/sidebar/dictionaries/en.json').then(module => module.default),
  fr: () => import('@/sidebar/dictionaries/fr.json').then(module => module.default),
  ar: () => import('@/sidebar/dictionaries/ar.json').then(module => module.default)
}

export const getDictionary = async locale => dictionaries[locale]()
