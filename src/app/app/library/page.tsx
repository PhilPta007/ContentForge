import type { Metadata } from 'next'
import { LibraryPage } from './_client'

export const metadata: Metadata = {
  title: 'Library',
}

export default function Page() {
  return <LibraryPage />
}
