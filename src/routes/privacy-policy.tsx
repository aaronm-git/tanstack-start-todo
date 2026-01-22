import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Addo Labs"
const PRIVACY_CONTACT_EMAIL =
  import.meta.env.VITE_PRIVACY_CONTACT_EMAIL ?? "hey@aaronmolina.me"

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
})

function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="mb-4">
        This Privacy Policy explains how <strong>{APP_NAME}</strong> ("we",
        "us", or "our") collects, uses, stores, and protects your information
        when you use our application.
      </p>

      <p className="mb-8">
        By accessing or using {APP_NAME}, you agree to the practices described
        in this Privacy Policy.
      </p>

      {/* INFORMATION WE COLLECT */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Information We Collect
        </h2>
        <p className="mb-3">
          We collect only the information necessary to operate and improve the
          service.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account Information:</strong> Full name, email address, and
            an encrypted password. We never store plaintext passwords.
          </li>
          <li>
            <strong>User Content:</strong> Tasks, task descriptions, and other
            content you voluntarily create within the application.
          </li>
          <li>
            <strong>Usage & Technical Data:</strong> IP address, device
            information, browser type, and interaction data used for security,
            analytics, fraud prevention, user management, and service
            improvement.
          </li>
        </ul>
      </section>

      {/* AI USAGE */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Artificial Intelligence Features
        </h2>
        <p className="mb-3">
          {APP_NAME} may use artificial intelligence features to enhance
          productivity, such as generating suggestions or improving task
          organization.
        </p>
        <p className="mb-3">
          User-generated content (such as task descriptions) may be processed
          by AI systems to provide these features. You should not include
          sensitive personal information, confidential data, or regulated
          information in prompts or task content.
        </p>
        <p>
          AI outputs are provided for convenience only and may be inaccurate or
          incomplete. You remain solely responsible for how you rely on or act
          upon AI-generated results.
        </p>
      </section>

      {/* COOKIES */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Cookies & Tracking</h2>
        <p className="mb-3">
          We use cookies and similar technologies to operate the service and
          maintain secure authentication sessions.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Authentication and session management cookies</li>
          <li>Analytics cookies to understand usage patterns</li>
        </ul>
        <p className="mt-3">
          We do not use cookies for third-party advertising sales.
        </p>
      </section>

      {/* HOW WE USE DATA */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          How We Use Your Information
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, maintain, and improve the service</li>
          <li>Authenticate users and secure accounts</li>
          <li>Communicate account, product, and marketing updates</li>
          <li>Prevent abuse, fraud, and unauthorized access</li>
          <li>Enforce our terms and policies</li>
        </ul>
      </section>

      {/* DATA RETENTION */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
        <p className="mb-3">
          You may delete your account at any time through the application.
        </p>
        <p>
          After account deletion, we may retain certain information for up to
          <strong> 30 days</strong> for legal, security, backup, or operational
          purposes. After this period, data is permanently deleted or
          anonymized.
        </p>
      </section>

      {/* SHARING */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Data Sharing & Disclosure
        </h2>
        <p className="mb-3">
          We do not sell personal information.
        </p>
        <p className="mb-3">
          We may share information with service providers that help us operate
          the application (such as infrastructure, email delivery, analytics,
          and error monitoring). These providers are permitted to use data only
          to perform services on our behalf.
        </p>
        <p>
          We may also disclose information if required by law or to protect the
          rights, safety, and integrity of {APP_NAME}.
        </p>
      </section>

      {/* CHILDREN */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Children’s Privacy</h2>
        <p>
          {APP_NAME} may be used by individuals under the age of 13. We do not
          knowingly collect more information than necessary to operate the
          service and do not sell children's personal data.
        </p>
      </section>

      {/* SECURITY */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Security</h2>
        <p>
          We use reasonable administrative, technical, and organizational
          safeguards to protect your information. However, no system is
          completely secure, and we cannot guarantee absolute security.
        </p>
      </section>

      {/* YOUR RIGHTS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
        <p className="mb-3">
          Depending on applicable law, you may have the right to access, update,
          or delete your personal information.
        </p>
        <p>
          If you have questions about your data, you may contact us at{" "}
          <a
            href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
            className="underline"
          >
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      {/* CHANGES */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Changes to This Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated effective date. Continued use of
          the service constitutes acceptance of the revised policy.
        </p>
      </section>

      {/* CONTACT */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our data
          practices, contact us at{" "}
          <a
            href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
            className="underline"
          >
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </main>
  )
}
