import type { Metadata } from 'next'
import { CreditsPage } from './_client'

export const metadata: Metadata = {
  title: 'Credits',
}

export default function Page() {
  return <CreditsPage />
}
