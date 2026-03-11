import type { Metadata } from 'next'
import { AffiliateLinksPage } from './_client'

export const metadata: Metadata = {
  title: 'Affiliate Links',
}

export default function Page() {
  return <AffiliateLinksPage />
}
