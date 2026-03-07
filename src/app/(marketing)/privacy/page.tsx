import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ContentForge',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-500 mb-8">Last updated: March 2026</p>

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
          <p className="text-neutral-300 leading-relaxed">
            ContentForge (Pty) Ltd (&quot;ContentForge&quot;, &quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;) is committed to protecting your
            privacy and personal information. This Privacy Policy explains how
            we collect, use, store, and share your information when you use the
            ContentForge platform (&quot;the Platform&quot;).
          </p>
          <p className="text-neutral-300 leading-relaxed">
            This policy applies to all users of the Platform and is compliant
            with the Protection of Personal Information Act, 2013 (POPIA) of
            South Africa. By using the Platform, you consent to the collection
            and processing of your personal information as described in this
            policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            2. Information We Collect
          </h2>

          <h3 className="text-lg font-medium text-neutral-200">
            Account Information
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            When you register for an account, we collect your name, email
            address, and a securely hashed version of your password. We do not
            store your password in plain text.
          </p>

          <h3 className="text-lg font-medium text-neutral-200">
            Payment Information
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            Payments are processed by our third-party payment providers,
            PayFast and Stripe. We do not store your credit card details or
            banking information on our servers. We retain records of
            transaction amounts, dates, and credit pack purchases for
            accounting purposes.
          </p>

          <h3 className="text-lg font-medium text-neutral-200">Usage Data</h3>
          <p className="text-neutral-300 leading-relaxed">
            We collect information about how you use the Platform, including
            content generation history, credit transactions, feature usage
            patterns, and your preferences and settings.
          </p>

          <h3 className="text-lg font-medium text-neutral-200">
            Technical Data
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            We automatically collect certain technical information when you
            access the Platform, including your IP address, browser type and
            version, device type, operating system, and referring URLs. This
            data is used solely for security, performance monitoring, and
            service improvement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            3. How We Use Your Information
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            We use your personal information for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              To provide, operate, and maintain the Platform and its features.
            </li>
            <li>
              To process credit purchases and maintain accurate transaction
              records.
            </li>
            <li>
              To send transactional emails, including purchase confirmations,
              credit balance notifications, and account-related communications.
            </li>
            <li>
              To improve and optimise the Platform based on usage patterns and
              feedback.
            </li>
            <li>
              To detect, prevent, and address security issues and fraudulent
              activity.
            </li>
            <li>
              To comply with applicable legal obligations.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            4. Legal Basis for Processing
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            Under POPIA and applicable data protection law, we process your
            personal information on the following legal bases:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              <strong className="text-white">Consent:</strong> You provide
              consent when you create an account and agree to this Privacy
              Policy.
            </li>
            <li>
              <strong className="text-white">Contract Performance:</strong>{' '}
              Processing is necessary to fulfil our contractual obligations to
              you, including providing the service and processing payments.
            </li>
            <li>
              <strong className="text-white">Legitimate Interest:</strong> We
              may process data where we have a legitimate business interest,
              such as improving the Platform and ensuring its security,
              provided this does not override your rights.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            5. Data Sharing
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            We do not sell, rent, or trade your personal information. We share
            your data only with the following categories of third parties, and
            only to the extent necessary:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              <strong className="text-white">Payment Processors:</strong>{' '}
              PayFast and Stripe process your payments securely. They operate
              under their own privacy policies.
            </li>
            <li>
              <strong className="text-white">AI Service Providers:</strong>{' '}
              Your content prompts are sent to AI providers solely for the
              purpose of generating content. These providers process your data
              in accordance with their data processing agreements with us.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            6. AI Processing
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            When you generate content on the Platform, your input prompts are
            transmitted to third-party AI service providers for processing.
            These providers process your content solely for the purpose of
            generating the requested output and do not retain your data beyond
            the generation session. We select AI providers that maintain
            appropriate data handling practices and do not use your inputs to
            train their models.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            7. Data Retention
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            We retain your account data for as long as your account remains
            active. If you choose to delete your account, we will delete your
            personal data within thirty (30) days of your request, except
            where we are required by law to retain certain records (such as
            financial transaction records for tax and accounting purposes).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            8. Your Rights Under POPIA
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            As a data subject under the Protection of Personal Information Act,
            you have the following rights:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              <strong className="text-white">Right to Access:</strong> You may
              request confirmation of whether we hold personal information
              about you and request a copy of that information.
            </li>
            <li>
              <strong className="text-white">Right to Correction:</strong> You
              may request that we correct or update inaccurate or incomplete
              personal information.
            </li>
            <li>
              <strong className="text-white">Right to Deletion:</strong> You
              may request that we delete your personal information, subject to
              any legal obligations requiring retention.
            </li>
            <li>
              <strong className="text-white">Right to Object:</strong> You may
              object to the processing of your personal information in certain
              circumstances.
            </li>
            <li>
              <strong className="text-white">Right to Data Portability:</strong>{' '}
              You may request a copy of your personal information in a
              structured, commonly used, machine-readable format.
            </li>
          </ul>
          <p className="text-neutral-300 leading-relaxed">
            To exercise any of these rights, please contact us at{' '}
            <a
              href="mailto:privacy@contentforge.com"
              className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
            >
              privacy@contentforge.com
            </a>
            . We will respond to your request within a reasonable timeframe
            and in accordance with POPIA requirements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            9. Information Officer
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            In accordance with POPIA, our designated Information Officer is
            responsible for ensuring compliance with data protection
            legislation. You may contact our Information Officer for any
            data-related queries:
          </p>
          <ul className="list-none pl-0 text-neutral-300 space-y-1">
            <li>
              <strong className="text-white">Name:</strong> The Information
              Officer
            </li>
            <li>
              <strong className="text-white">Email:</strong>{' '}
              <a
                href="mailto:privacy@contentforge.com"
                className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
              >
                privacy@contentforge.com
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">10. Cookies</h2>
          <p className="text-neutral-300 leading-relaxed">
            The Platform uses essential session cookies to maintain your
            authentication state and ensure the proper functioning of the
            service. We do not use advertising, analytics, or tracking cookies.
            By using the Platform, you consent to the use of these essential
            cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            11. Security Measures
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            We implement appropriate technical and organisational measures to
            protect your personal information, including:
          </p>
          <ul className="list-disc pl-6 text-neutral-300 space-y-2">
            <li>
              Encryption of data in transit using TLS/SSL protocols.
            </li>
            <li>
              Row Level Security (RLS) policies to ensure data isolation
              between users.
            </li>
            <li>
              Secure authentication mechanisms with hashed password storage.
            </li>
            <li>
              Regular security reviews and monitoring.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">12. Children</h2>
          <p className="text-neutral-300 leading-relaxed">
            The Platform is not intended for use by individuals under the age
            of 18. We do not knowingly collect personal information from
            children. If we become aware that we have collected personal
            information from a child under 18, we will take steps to delete
            that information promptly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            13. International Data Transfers
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            Your data may be processed in countries other than South Africa by
            our AI service providers and infrastructure partners. Where such
            transfers occur, we ensure that appropriate safeguards are in
            place, including data processing agreements that require the
            recipient to protect your information to a standard consistent
            with POPIA.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            14. Changes to This Policy
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or applicable law. We will notify you of
            any material changes by posting the revised policy on the Platform
            and updating the &quot;Last updated&quot; date. We will provide at
            least thirty (30) days&apos; notice before any material changes
            take effect.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">
            15. Contact Us
          </h2>
          <p className="text-neutral-300 leading-relaxed">
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or the handling of your personal information, please
            contact us at{' '}
            <a
              href="mailto:privacy@contentforge.com"
              className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
            >
              privacy@contentforge.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
