import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Pricing — StudioStack',
  description:
    'Credit packs for AI content creation. Buy once, use anytime. No subscriptions.',
};

const CREDIT_PACKS = [
  {
    name: 'Starter',
    credits: 50,
    priceUsd: '$4.49',
    priceZar: 'R75.00',
    perCredit: '$0.090',
    savings: null,
    description: 'Try it out with a small pack.',
  },
  {
    name: 'Creator',
    credits: 150,
    priceUsd: '$11.99',
    priceZar: 'R199.00',
    perCredit: '$0.080',
    savings: 11,
    description: 'For regular creators getting started.',
  },
  {
    name: 'Pro',
    credits: 500,
    priceUsd: '$35.99',
    priceZar: 'R599.00',
    perCredit: '$0.072',
    savings: 20,
    description: 'Best value for active creators.',
  },
  {
    name: 'Studio',
    credits: 1500,
    priceUsd: '$89.99',
    priceZar: 'R1,499.00',
    perCredit: '$0.060',
    savings: 33,
    description: 'For teams and heavy production.',
  },
  {
    name: 'Agency',
    credits: 5000,
    priceUsd: '$239.99',
    priceZar: 'R3,999.00',
    perCredit: '$0.048',
    savings: 47,
    description: 'Maximum volume, maximum savings.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do credits work?',
    answer:
      'Credits are the currency inside StudioStack. Each generation costs a certain number of credits depending on the content type and quality tier you choose. For example, a 10-minute podcast with Standard voice costs about 5 credits, while Ultra voice costs about 40 credits. You can see the exact cost before generating.',
  },
  {
    question: 'Do credits expire?',
    answer:
      'No. Credits never expire. Buy them when you want, use them whenever you are ready. There is no monthly reset or deadline.',
  },
  {
    question: 'Can I get a refund?',
    answer:
      'Unused credit packs can be refunded within 14 days of purchase. Once credits have been used for generations, they cannot be refunded. If a generation fails, the credits are automatically returned to your balance.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept PayPal for international payments (USD), including cards and PayPal balance. South African users can also pay with EFT, local cards, and other methods through PayFast (ZAR).',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Pricing
        </h1>
        <p className="mt-3 text-base text-neutral-400">
          Buy credits, spend them on content. No subscriptions, no monthly fees.
          Credits never expire.
        </p>
      </div>

      {/* Credit Packs Table */}
      <div className="mt-12 overflow-hidden rounded-lg border border-[#1e1e1e]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1e1e1e] hover:bg-transparent">
              <TableHead className="text-neutral-500">Pack</TableHead>
              <TableHead className="text-right text-neutral-500">Credits</TableHead>
              <TableHead className="text-right text-neutral-500">USD</TableHead>
              <TableHead className="text-right text-neutral-500">ZAR</TableHead>
              <TableHead className="text-right text-neutral-500">Per Credit</TableHead>
              <TableHead className="text-right text-neutral-500">Savings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CREDIT_PACKS.map((pack) => (
              <TableRow key={pack.name} className="border-[#1e1e1e] hover:bg-[#111111]">
                <TableCell>
                  <div>
                    <span className="font-medium text-white">{pack.name}</span>
                    <p className="mt-0.5 text-xs text-neutral-500">{pack.description}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-neutral-300">
                  {pack.credits.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-neutral-300">
                  {pack.priceUsd}
                </TableCell>
                <TableCell className="text-right text-neutral-300">
                  {pack.priceZar}
                </TableCell>
                <TableCell className="text-right text-neutral-400">
                  {pack.perCredit}
                </TableCell>
                <TableCell className="text-right">
                  {pack.savings ? (
                    <span className="text-indigo-400">{pack.savings}%</span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Per-generation cost examples */}
      <section className="mt-16 border-t border-[#1e1e1e] pt-16">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Example costs
        </h2>
        <p className="mt-3 text-base text-neutral-400">
          How many credits common generations cost at each tier.
        </p>
        <div className="mt-8 overflow-hidden rounded-lg border border-[#1e1e1e]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1e1e1e] hover:bg-transparent">
                <TableHead className="text-neutral-500">Content</TableHead>
                <TableHead className="text-right text-neutral-500">Standard</TableHead>
                <TableHead className="text-right text-neutral-500">Premium</TableHead>
                <TableHead className="text-right text-neutral-500">Ultra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-[#1e1e1e] hover:bg-[#111111]">
                <TableCell className="font-medium text-white">
                  10-min podcast
                </TableCell>
                <TableCell className="text-right text-neutral-300">5 credits</TableCell>
                <TableCell className="text-right text-neutral-300">10 credits</TableCell>
                <TableCell className="text-right text-neutral-300">40 credits</TableCell>
              </TableRow>
              <TableRow className="border-[#1e1e1e] hover:bg-[#111111]">
                <TableCell className="font-medium text-white">
                  10-min video (static)
                </TableCell>
                <TableCell className="text-right text-neutral-300">15 credits</TableCell>
                <TableCell className="text-right text-neutral-300">34 credits</TableCell>
                <TableCell className="text-right text-neutral-300">80 credits</TableCell>
              </TableRow>
              <TableRow className="border-[#1e1e1e] hover:bg-[#111111]">
                <TableCell className="font-medium text-white">
                  SEO description
                </TableCell>
                <TableCell className="text-right text-neutral-300" colSpan={3}>
                  5 credits (flat)
                </TableCell>
              </TableRow>
              <TableRow className="border-[#1e1e1e] hover:bg-[#111111]">
                <TableCell className="font-medium text-white">
                  Thumbnail (3 options)
                </TableCell>
                <TableCell className="text-right text-neutral-300" colSpan={3}>
                  8 credits (flat)
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16 border-t border-[#1e1e1e] pt-16">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-0 divide-y divide-[#1e1e1e] rounded-lg border border-[#1e1e1e]">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-white hover:bg-[#111111] [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="ml-4 text-neutral-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed text-neutral-400">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 border-t border-[#1e1e1e] pt-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Ready to start?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-400">
          Create an account, pick a credit pack, and generate your first content in
          minutes.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}
