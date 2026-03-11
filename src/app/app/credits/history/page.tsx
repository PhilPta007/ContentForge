import type { Metadata } from 'next'
import { CreditHistoryPage } from './_client'

export const metadata: Metadata = {
  title: 'Credit History',
}

export default function Page() {
  return <CreditHistoryPage />
}
