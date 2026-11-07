import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  CalendarCheck2,
  CheckCircle2,
  Instagram,
  ListChecks,
  Loader2,
  Mail,
  Plug,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const HERO_STEPS = [
  { title: "Draft 3 launch captions", state: "done" },
  { title: "Generate hashtag sets", state: "done" },
  { title: "Plan 7-day content calendar", state: "active" },
  { title: "Draft the promo blast", state: "queued" },
] as const;

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Assistant",
    body: "Describe a chore in plain words — the assistant breaks it into small, reviewable tasks and builds the workflow with you.",
  },
  {
    icon: Wand2,
    title: "Creator Studio",
    body: "Captions, hashtag sets and 7-day content plans, tuned to your tone and platform. Real generated text, ready to edit.",
  },
  {
    icon: Briefcase,
    title: "Business Studio",
    body: "Product descriptions, promotional messages and empathetic customer reply drafts for your store, in seconds.",
  },
  {
    icon: ListChecks,
    title: "Workflow Manager",
    body: "Every task tracked from pending to completed, with generated results attached and full workflow history saved.",
  },
] as const;

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

function StepIcon({ state }: { state: "done" | "active" | "queued" }) {
  if (state === "done")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
    );
  if (state === "active")
    return (
      <motion.span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary"
        animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Loader2 className="h-3.5 w-3.5" />
      </motion.span>
    );
  return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground" />;
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="landing-brand">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-heading text-lg font-semibold tracking-tight">FlowPilot AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#studios" className="transition-colors hover:text-foreground">Studios</a>
            <Link to="/integrations" className="transition-colors hover:text-foreground">Integrations</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className={buttonVariants({ size: "sm" })}
              data-testid="landing-nav-get-started-btn"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — asymmetric: copy left, live preview right */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 motion-reduce:hidden"
          style={{
            background:
              "radial-gradient(600px 360px at 15% 10%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 70%), radial-gradient(560px 320px at 85% 20%, color-mix(in oklch, var(--chart-2) 16%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:px-8">
          <motion.div {...fadeUp} className="lg:col-span-7 motion-reduce:transform-none">
            <Badge variant="secondary" className="mb-5 gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              One AI assistant for every repetitive task
            </Badge>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your repetitive tasks,{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-chart-2 bg-clip-text text-transparent">
                on autopilot
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              FlowPilot AI turns a plain-language instruction into a step-by-step workflow — captions,
              hashtags, product copy, promo messages and customer replies — then tracks every task
              until it is done.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/dashboard" className={buttonVariants({ size: "lg" })} data-testid="landing-get-started-btn">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/assistant"
                className={buttonVariants({ variant: "outline", size: "lg" })}
                data-testid="landing-meet-assistant-btn"
              >
                Meet the Assistant
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to run on managed AI — no API keys, no subscriptions.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12 }}
            className="lg:col-span-5 motion-reduce:transform-none"
          >
            <Card className="border-primary/20 bg-card/70 shadow-[0_8px_32px_rgba(124,58,237,0.12)] backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Live workflow preview
                  </span>
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    AI Assistant
                  </Badge>
                </div>
                <p className="mb-4 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed" data-testid="hero-preview-instruction">
                  “Plan a launch week of Instagram content for my candle shop.”
                </p>
                <ul className="space-y-3" data-testid="hero-preview-steps">
                  {HERO_STEPS.map((step, i) => (
                    <motion.li
                      key={step.title}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.12, duration: 0.3 }}
                      className="flex items-center gap-3 motion-reduce:transform-none"
                      data-testid={`hero-preview-step-${i}`}
                    >
                      <StepIcon state={step.state} />
                      <span
                        className={cn(
                          "text-sm",
                          step.state === "done" && "text-muted-foreground line-through decoration-border",
                          step.state === "active" && "font-medium",
                          step.state === "queued" && "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you repeat, in one place
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Built for content creators and small businesses that juggle the same digital chores every week.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:gap-6">
            {FEATURES.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="motion-reduce:transform-none"
              >
                <Card className="h-full transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] motion-reduce:transform-none">
                  <CardContent className="flex h-full flex-col gap-3 p-5 sm:p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-heading text-lg font-semibold">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Studios showcase */}
      <section id="studios" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              {
                img: "https://images.unsplash.com/photo-1594202304180-f25d9c992442?crop=entropy&cs=srgb&fm=jpg&q=85",
                icon: Instagram,
                title: "Creator Studio",
                body: "From one brief: three caption options, hashtag sets ranked broad-to-local, and a 7-day content matrix.",
                cta: "Open Creator Studio",
                to: "/creator",
                testid: "landing-creator-cta",
              },
              {
                img: "https://images.unsplash.com/photo-1707157281599-d155d1da5b4c?crop=entropy&cs=srgb&fm=jpg&q=85",
                icon: Mail,
                title: "Business Studio",
                body: "Product descriptions, promo emails and SMS, and customer reply drafts that sound like you on a good day.",
                cta: "Open Business Studio",
                to: "/business",
                testid: "landing-business-cta",
              },
            ].map(({ img, icon: Icon, title, body, cta, to, testid }) => (
              <Card key={title} className="overflow-hidden">
                <div className="relative h-48 w-full overflow-hidden sm:h-56">
                  <img
                    src={img}
                    alt={`${title} preview`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-sm font-medium backdrop-blur">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                  </span>
                </div>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                  <Link
                    to={to}
                    className={buttonVariants({ variant: "ghost", size: "sm" }) + " mt-4 -ml-2"}
                    data-testid={testid}
                  >
                    {cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations teaser — honest */}
      <section className="border-t bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Google Drive, Gmail & Calendar — on the roadmap
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Deep connections are coming in a future release. FlowPilot never pretends an
                integration is live — anything simulated is labelled as a demo, always.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { icon: Mail, label: "Gmail" },
                { icon: CalendarCheck2, label: "Calendar" },
                { icon: Plug, label: "Drive" },
              ].map(({ icon: Icon, label }) => (
                <Badge key={label} variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Icon className="h-3.5 w-3.5" />
                  {label} · not connected
                </Badge>
              ))}
              <Link
                to="/integrations"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                data-testid="landing-integrations-cta"
              >
                Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="h-3 w-3" />
            </span>
            <span className="font-heading font-semibold text-foreground">FlowPilot AI</span>
          </div>
          <p>Workflow automation for creators & small businesses — MVP build.</p>
          <Link to="/dashboard" className="transition-colors hover:text-foreground" data-testid="landing-footer-cta">
            Open the app →
          </Link>
        </div>
      </footer>
    </div>
  );
}
