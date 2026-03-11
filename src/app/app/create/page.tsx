import type { Metadata } from 'next'
import { CreatePage } from './_client'

export const metadata: Metadata = {
  title: 'Create',
}

export default function Page() {
  return <CreatePage />
}
