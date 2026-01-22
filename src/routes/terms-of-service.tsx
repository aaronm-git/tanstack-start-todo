import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Addo Labs"
const TERMS_CONTACT_EMAIL =
  import.meta.env.VITE_TERMS_CONTACT_EMAIL ?? import.meta.env.VITE_PRIVACY_CONTACT_EMAIL ?? "hey@aaronmolina.me"

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfServicePage,
})

function TermsOfServicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <p className="mb-4">
        These Terms of Service ("Terms") govern your access to and use of{" "}
        <strong>{APP_NAME}</strong> ("Service", "we", "us", or "our"), including
        our website, mobile applications, and related services.
      </p>

      <p className="mb-8">
        By accessing or using {APP_NAME}, you agree to be bound by these Terms.
        If you do not agree to these Terms, you may not use the Service.
      </p>

      {/* ACCEPTANCE OF TERMS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="mb-3">
          By creating an account, accessing, or using {APP_NAME}, you acknowledge
          that you have read, understood, and agree to be bound by these Terms and
          our Privacy Policy, which is incorporated by reference.
        </p>
        <p>
          You represent that you are at least 13 years of age and have the legal
          capacity to enter into these Terms. If you are using the Service on
          behalf of an organization, you represent that you have authority to
          bind that organization to these Terms.
        </p>
      </section>

      {/* DESCRIPTION OF SERVICE */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
        <p className="mb-3">
          {APP_NAME} is a task management and productivity application that
          provides tools for organizing, tracking, and managing tasks and
          projects. The Service may include artificial intelligence features to
          assist with task management, suggestions, and productivity enhancement.
        </p>
        <p>
          We reserve the right to modify, suspend, or discontinue any aspect of
          the Service at any time, with or without notice, at our sole
          discretion.
        </p>
      </section>

      {/* USER ACCOUNTS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
        <p className="mb-3">
          To access certain features of the Service, you must create an account.
          You agree to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-3">
          <li>
            Provide accurate, current, and complete information when creating
            your account
          </li>
          <li>
            Maintain and promptly update your account information to keep it
            accurate, current, and complete
          </li>
          <li>
            Maintain the security of your account credentials and accept
            responsibility for all activities that occur under your account
          </li>
          <li>
            Notify us immediately of any unauthorized use of your account or any
            other breach of security
          </li>
        </ul>
        <p>
          You are solely responsible for maintaining the confidentiality of your
          account credentials. We are not liable for any loss or damage arising
          from your failure to protect your account information.
        </p>
      </section>

      {/* USER CONTENT AND INTELLECTUAL PROPERTY */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          4. User Content and Intellectual Property Rights
        </h2>
        <p className="mb-3">
          <strong>Your Content:</strong> You retain ownership of all content you
          create, upload, or submit through the Service ("User Content"). By
          using the Service, you grant us a worldwide, non-exclusive, royalty-free
          license to use, store, reproduce, modify, and display your User
          Content solely for the purpose of providing, operating, and improving
          the Service.
        </p>
        <p className="mb-3">
          <strong>Our Intellectual Property:</strong> The Service, including its
          original content, features, functionality, design, logos, trademarks,
          and software, is owned by us or our licensors and is protected by
          copyright, trademark, patent, trade secret, and other intellectual
          property laws.
        </p>
        <p>
          You may not copy, modify, distribute, sell, or lease any part of the
          Service or included software, nor may you reverse engineer or attempt to
          extract the source code of that software, unless laws prohibit those
          restrictions or you have our written permission.
        </p>
      </section>

      {/* PROHIBITED USES */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Prohibited Uses</h2>
        <p className="mb-3">You agree not to use the Service to:</p>
        <ul className="list-disc pl-6 space-y-2 mb-3">
          <li>
            Violate any applicable local, state, national, or international law
            or regulation
          </li>
          <li>
            Transmit any content that is unlawful, harmful, threatening, abusive,
            harassing, defamatory, vulgar, obscene, or otherwise objectionable
          </li>
          <li>
            Infringe upon the intellectual property rights, privacy rights, or
            other rights of any third party
          </li>
          <li>
            Transmit any viruses, malware, or other malicious code
          </li>
          <li>
            Attempt to gain unauthorized access to the Service, other accounts,
            computer systems, or networks connected to the Service
          </li>
          <li>
            Interfere with or disrupt the Service or servers or networks
            connected to the Service
          </li>
          <li>
            Use automated systems (such as bots, scrapers, or spiders) to access
            the Service without our express written permission
          </li>
          <li>
            Impersonate any person or entity or falsely state or otherwise
            misrepresent your affiliation with a person or entity
          </li>
        </ul>
        <p>
          We reserve the right to investigate and prosecute violations of these
          Terms to the fullest extent permitted by law.
        </p>
      </section>

      {/* AI FEATURES DISCLAIMER */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          6. Artificial Intelligence Features
        </h2>
        <p className="mb-3">
          The Service may include AI-powered features that generate suggestions,
          content, or assist with task management. You acknowledge and agree that:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-3">
          <li>
            AI-generated content is provided for informational and assistance
            purposes only and may be inaccurate, incomplete, or inappropriate
          </li>
          <li>
            You are solely responsible for reviewing, verifying, and making
            decisions based on any AI-generated content
          </li>
          <li>
            We do not guarantee the accuracy, reliability, or suitability of
            AI-generated content for any particular purpose
          </li>
          <li>
            You should not include sensitive personal information, confidential
            data, or regulated information in content that may be processed by AI
            systems
          </li>
        </ul>
        <p>
          We are not liable for any decisions, actions, or consequences resulting
          from your use of or reliance on AI-generated content.
        </p>
      </section>

      {/* DISCLAIMERS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Disclaimers</h2>
        <p className="mb-3">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
        </p>
        <p className="mb-3">
          We do not warrant that the Service will be uninterrupted, secure, or
          error-free, that defects will be corrected, or that the Service or the
          server that makes it available are free of viruses or other harmful
          components.
        </p>
        <p>
          We do not warrant or make any representations regarding the use or the
          results of the use of the Service in terms of its correctness,
          accuracy, reliability, or otherwise.
        </p>
      </section>

      {/* LIMITATION OF LIABILITY */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
        <p className="mb-3">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL
          WE, OUR AFFILIATES, AGENTS, DIRECTORS, EMPLOYEES, SUPPLIERS, OR
          LICENSORS BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION
          DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE
          LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE,
          THE SERVICE.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, OUR TOTAL LIABILITY
          FOR ANY CLAIMS UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID
          US IN THE TWELVE (12) MONTHS PRIOR TO THE EVENT GIVING RISE TO THE
          LIABILITY, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
        </p>
      </section>

      {/* INDEMNIFICATION */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless us, our affiliates,
          and our respective officers, directors, employees, and agents from and
          against any claims, liabilities, damages, losses, and expenses,
          including without limitation reasonable attorney's fees and costs, arising
          out of or in any way connected with your access to or use of the
          Service, your violation of these Terms, or your violation of any rights
          of another.
        </p>
      </section>

      {/* TERMINATION */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">10. Termination</h2>
        <p className="mb-3">
          We may terminate or suspend your account and access to the Service
          immediately, without prior notice or liability, for any reason,
          including if you breach these Terms.
        </p>
        <p className="mb-3">
          You may terminate your account at any time by deleting your account
          through the Service or by contacting us at{" "}
          <a
            href={`mailto:${TERMS_CONTACT_EMAIL}`}
            className="underline"
          >
            {TERMS_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>
          Upon termination, your right to use the Service will immediately cease.
          All provisions of these Terms that by their nature should survive
          termination shall survive, including ownership provisions, warranty
          disclaimers, indemnity, and limitations of liability.
        </p>
      </section>

      {/* GOVERNING LAW */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">11. Governing Law and Dispute Resolution</h2>
        <p className="mb-3">
          These Terms shall be governed by and construed in accordance with the
          laws of the jurisdiction in which we operate, without regard to its
          conflict of law provisions.
        </p>
        <p>
          Any disputes arising out of or relating to these Terms or the Service
          shall be resolved through binding arbitration in accordance with the
          rules of the American Arbitration Association, except where prohibited
          by law. You waive any right to a jury trial and agree to resolve
          disputes on an individual basis.
        </p>
      </section>

      {/* CHANGES TO TERMS */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time at
          our sole discretion. If we make material changes, we will provide notice
          by posting the updated Terms on this page and updating the "Last
          Updated" date. Your continued use of the Service after any such
          changes constitutes your acceptance of the new Terms.
        </p>
      </section>

      {/* SEVERABILITY */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">13. Severability</h2>
        <p>
          If any provision of these Terms is held to be invalid or unenforceable
          by a court, the remaining provisions of these Terms will remain in
          effect. The invalid or unenforceable provision will be replaced with a
          valid, enforceable provision that most closely matches the intent of the
          original provision.
        </p>
      </section>

      {/* ENTIRE AGREEMENT */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">14. Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire
          agreement between you and us regarding the Service and supersede all
          prior agreements and understandings, whether written or oral, relating
          to the Service.
        </p>
      </section>

      {/* CONTACT */}
      <section>
        <h2 className="text-xl font-semibold mb-3">15. Contact Information</h2>
        <p>
          If you have any questions about these Terms of Service, please contact
          us at{" "}
          <a
            href={`mailto:${TERMS_CONTACT_EMAIL}`}
            className="underline"
          >
            {TERMS_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Last Updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </section>
    </main>
  )
}
