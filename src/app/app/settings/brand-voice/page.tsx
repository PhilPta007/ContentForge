import type { Metadata } from 'next'
import { BrandVoicePage } from './_client'

export const metadata: Metadata = {
  title: 'Brand Voice',
}

export default function Page() {
  return <BrandVoicePage />
}
