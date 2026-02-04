import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen pt-safe">
      <Header />
      
      <main className="container px-4 py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground/80">
            Last updated: February 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using MailRCV, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
            <p>
              MailRCV provides temporary, disposable email addresses for receiving emails. 
              This service is intended for legitimate purposes such as:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Protecting your primary email from spam</li>
              <li>Signing up for services without revealing your real email</li>
              <li>Testing email functionality during development</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Acceptable Use</h2>
            <p>
              You agree NOT to use MailRCV for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any illegal activities or fraudulent purposes</li>
              <li>Harassment, abuse, or harm to others</li>
              <li>Circumventing security measures of other services</li>
              <li>Sending spam or malicious content</li>
              <li>Any activity that violates applicable laws</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. No Guarantee of Service</h2>
            <p>
              MailRCV is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uninterrupted or error-free service</li>
              <li>Delivery of all emails</li>
              <li>Retention of emails for any specific period</li>
              <li>Privacy from the public (inboxes may be accessible to others)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Limitation of Liability</h2>
            <p>
              MailRCV and its operators shall not be liable for any direct, indirect, incidental, 
              special, or consequential damages arising from the use or inability to use our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>
              For questions about these Terms, contact us via Telegram at{" "}
              <a 
                href="https://t.me/MailRCV" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                t.me/MailRCV
              </a>.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsPage;
