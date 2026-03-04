import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const testimonials = [
  {
    name: "Alex R.",
    role: "Developer",
    text: "MailRCV saved me from spam hell. I use it for every online signup now. The instant inbox is a game changer.",
    rating: 5,
  },
  {
    name: "Sarah K.",
    role: "Privacy Advocate",
    text: "Finally a temp mail service that's fast, clean, and doesn't bombard you with ads. The password protection is a nice touch.",
    rating: 5,
  },
  {
    name: "James T.",
    role: "QA Engineer",
    text: "The bulk generate feature is incredible for testing. I can create 500 test emails in seconds. Worth every penny.",
    rating: 5,
  },
  {
    name: "Maria L.",
    role: "Freelancer",
    text: "I use the custom domain feature for client projects. Professional disposable emails — my clients love it!",
    rating: 5,
  },
  {
    name: "David P.",
    role: "Student",
    text: "Free plan is generous enough for my needs. No signup required is the best part — just works instantly.",
    rating: 4,
  },
];

export const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 sm:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-10" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[300px] bg-accent/5 blur-[180px] rounded-full" />

      <div className="container relative z-10 px-4">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Testimonials
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Loved by <span className="gradient-text">thousands</span>
            </h2>
            <p className="text-muted-foreground">See what our users are saying</p>
          </div>
        </ScrollReveal>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {testimonials.slice(0, 3).map((t, i) => (
            <ScrollReveal key={i} delay={i * 0.1}>
              <div className="group relative rounded-2xl p-6 bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500 h-full">
                <Quote className="w-8 h-8 text-primary/15 mb-4" />
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Scrolling ticker for remaining */}
        <ScrollReveal delay={0.3}>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {testimonials.slice(3).map((t, i) => (
              <div key={i} className="rounded-2xl p-5 bg-card/40 backdrop-blur-xl border border-border/30 hover:border-primary/20 transition-all duration-500">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.text}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground">{t.name} <span className="text-muted-foreground font-normal">· {t.role}</span></p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
