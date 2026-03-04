import { ScrollReveal } from "./ScrollReveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Do I need to sign up to use MailRCV?",
    answer: "No! You can use MailRCV as a guest without any signup. Just pick a username and start receiving emails instantly. Signing up gives you more inboxes, longer retention, and password protection.",
  },
  {
    question: "How long are emails stored?",
    answer: "It depends on your plan: Guest emails are stored for 24 hours, Free plan emails for 7 days, and Pro plan emails are stored forever.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. We don't collect any personal information. Guest inboxes are completely anonymous. Even with an account, we only store your email for login — nothing else.",
  },
  {
    question: "Can I password-protect my inbox?",
    answer: "Yes! Free and Pro plan users can set a password on any inbox. This means only you can access the emails — nobody else can view them even if they know the username.",
  },
  {
    question: "What is a custom domain?",
    answer: "Pro users can bring their own domain (e.g., you@yourdomain.com) instead of using our default domains. This makes your disposable emails look more professional.",
  },
  {
    question: "How much does the Pro plan cost?",
    answer: "Just $1/month or $10 for lifetime access. Pro gives you unlimited inboxes, unlimited emails, permanent retention, custom domains, and bulk email generation.",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-12 sm:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[180px] rounded-full" />

      <div className="container relative z-10 px-4 max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about MailRCV
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 p-6 sm:p-8">
            <Accordion type="single" collapsible className="space-y-0">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border/30">
                  <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:no-underline hover:text-primary transition-colors py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
