import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { href: '/pricing', label: 'Pricing' },
    { href: '/examples', label: 'Examples' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/refund', label: 'Refund Policy' },
  ],
  Company: [
    { href: '/about', label: 'About' },
  ],
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#1e1e1e] bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {category}
              </h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-[#1e1e1e] pt-6">
          <p className="text-xs text-neutral-500">
            &copy; 2026 ContentForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
