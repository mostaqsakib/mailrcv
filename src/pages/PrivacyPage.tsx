import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen pt-safe">
      <Header />
      
      <main className="container px-4 py-16 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-foreground/80">
            Last updated: February 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              MailRCV is designed with privacy in mind. We collect minimal information necessary to provide our temporary email service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email messages received at your temporary inbox addresses</li>
              <li>Basic usage data to improve our service</li>
              <li>Device tokens for push notifications (optional)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>
              We use the collected information solely to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Display emails in your temporary inbox</li>
              <li>Send push notifications for new emails (if enabled)</li>
              <li>Maintain and improve our service</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Data Retention</h2>
            <p>
              Emails received at temporary addresses are automatically deleted after a period of time. 
              We do not permanently store your email content. Temporary inboxes are designed for 
              short-term use and data is not retained indefinitely.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your information. 
              However, no method of transmission over the Internet is 100% secure, 
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Third-Party Services</h2>
            <p>
              We may use third-party services for analytics and infrastructure. 
              These services have their own privacy policies governing the use of your information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us via our 
              Telegram channel at{" "}
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

export default PrivacyPage;
