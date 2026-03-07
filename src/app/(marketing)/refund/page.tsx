import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — ContentForge',
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
      <p className="text-sm text-neutral-500 mb-8">Last updated: March 2026</p>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Overview</h2>
          <p className="text-neutral-300 leading-relaxed">
            ContentForge operates on a credit-based pricing model. Credits are
            digital goods purchased for use on the Platform and are generally
            non-refundable once purchased. This policy outlines the
            circumstances under which refunds may be granted.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            2. When We Issue Refunds
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            We will issue refunds or credit restorations in the following
            circumstances:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              <strong className="text-white">Failed Generation:</strong> If a
              content generation fails due to a system error and credits are
              deducted, those credits will be automatically restored to your
              account.
            </li>
            <li>
              <strong className="text-white">Technical Errors:</strong> If a
              technical issue on our end prevents you from using credits you
              have purchased, we will review your case and issue a refund or
              credit restoration as appropriate.
            </li>
            <li>
              <strong className="text-white">
                Accidental Duplicate Purchase:
              </strong>{' '}
              If you accidentally purchase the same credit pack twice within a
              24-hour period, we will refund the duplicate transaction upon
              request.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            3. When We Do Not Issue Refunds
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            Refunds will not be granted in the following cases:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              <strong className="text-white">Used Credits:</strong> Credits
              that have been successfully consumed to generate content are
              non-refundable, regardless of whether you are satisfied with the
              output.
            </li>
            <li>
              <strong className="text-white">
                Dissatisfaction with Output Quality:
              </strong>{' '}
              AI-generated content varies in quality. We do not offer refunds
              based on subjective dissatisfaction with the generated output.
              You are encouraged to review and refine your prompts for better
              results.
            </li>
            <li>
              <strong className="text-white">Change of Mind:</strong> We do
              not offer refunds for credit purchases where you have simply
              changed your mind after completing the transaction.
            </li>
            <li>
              <strong className="text-white">
                Account Termination for Violations:
              </strong>{' '}
              If your account is terminated due to a breach of our Terms of
              Service, any remaining credits in your account will be forfeited
              and no refund will be issued.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            4. How to Request a Refund
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            To request a refund, please email{' '}
            <a
              href="mailto:support@contentforge.com"
              className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
            >
              support@contentforge.com
            </a>{' '}
            within seven (7) days of the transaction in question. Please
            include your account email address, the transaction date, and a
            description of the issue. Refund requests submitted after seven
            days may not be eligible for processing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            5. Processing Time
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            Approved refunds will be processed within five to ten (5-10)
            business days from the date the refund is approved. The time it
            takes for the refund to appear in your account may vary depending
            on your payment provider.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            6. Refund Method
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            All refunds will be issued to the original payment method used for
            the purchase. We are unable to process refunds to alternative
            payment methods or accounts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            7. Contact Us
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            If you have any questions about this Refund Policy or need
            assistance with a refund request, please contact us at{' '}
            <a
              href="mailto:support@contentforge.com"
              className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
            >
              support@contentforge.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
