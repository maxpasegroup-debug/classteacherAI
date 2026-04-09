"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const teacherFeatures = [
  "AI lesson planning and smart curriculum mapping",
  "Automated grading insights with performance snapshots",
  "Class communication tools that save teaching time",
];

const studentFeatures = [
  "Personalized AI learning paths and revision support",
  "Interactive practice with instant feedback loops",
  "Skill growth tracking across subjects and goals",
];

const steps = [
  { title: "Learn", description: "Students and teachers discover tailored AI-driven learning pathways." },
  { title: "Connect", description: "Collaborate with smart classroom tools, chat workflows, and voice support." },
  { title: "Grow", description: "Turn progress into measurable outcomes for both learning and earning." },
];

const testimonials = [
  {
    name: "Priya S.",
    role: "High School Teacher",
    quote: "ClassteacherAI cut my prep time in half while helping students engage more deeply in class.",
  },
  {
    name: "Arjun K.",
    role: "STEM Student",
    quote: "Nexa AI feels like a real study coach. I get help exactly when I need it, in seconds.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/30 via-cyan-300/20 to-emerald-400/35 blur-[90px]" />
        <div className="absolute bottom-[-180px] right-[-80px] h-[320px] w-[320px] rounded-full bg-emerald-300/20 blur-[90px]" />
      </div>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-3xl border border-slate-100 bg-white/80 px-6 py-10 shadow-[0_10px_60px_-30px_rgba(16,185,129,0.5)] backdrop-blur sm:px-10 sm:py-14"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 shadow-lg shadow-emerald-200" />
            <span className="text-lg font-semibold tracking-tight">ClassteacherAI</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Teach Smarter. Learn Better. Grow Faster.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            AI-powered ecosystem for teachers and students.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="rounded-xl bg-slate-900 px-6 py-3 text-center text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700"
            >
              Try Nexa AI
            </Link>
          </div>
        </motion.section>

        <section className="mt-16 grid gap-6 md:grid-cols-2">
          {[{ title: "For Teachers", items: teacherFeatures }, { title: "For Students", items: studentFeatures }].map(
            (segment, index) => (
              <motion.article
                key={segment.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
              >
                <h2 className="text-xl font-semibold">{segment.title}</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {segment.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ),
          )}
        </section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-3xl border border-emerald-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-8"
        >
          <p className="text-sm font-medium text-emerald-700">Nexa AI</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Chat-first + voice-enabled assistant for every classroom.
          </h3>
          <p className="mt-3 max-w-3xl text-slate-600">
            Ask, explain, summarize, and practice in natural conversations. Nexa AI supports teachers and students
            through both typed chat and voice interactions, making learning faster and more human.
          </p>
        </motion.section>

        <section className="mt-16">
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it Works</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-blue-600">{`0${index + 1}`}</p>
                <h4 className="mt-1 text-lg font-semibold">{step.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="mt-16 grid gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Monetization</p>
            <h4 className="mt-2 text-xl font-semibold">Teachers earn</h4>
            <p className="mt-2 text-sm text-slate-600">
              Build premium classes, sell resources, and monetize expertise through AI-accelerated teaching.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Growth</p>
            <h4 className="mt-2 text-xl font-semibold">Students learn</h4>
            <p className="mt-2 text-sm text-slate-600">
              Access quality education support with adaptive learning experiences that improve outcomes every day.
            </p>
          </div>
        </motion.section>

        <section className="mt-16">
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">Testimonials</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {testimonials.map((item, index) => (
              <motion.blockquote
                key={item.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <p className="text-slate-700">&quot;{item.quote}&quot;</p>
                <footer className="mt-4 text-sm text-slate-500">
                  {item.name} - {item.role}
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-3xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10"
        >
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">Start your AI-powered journey today</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
            Join ClassteacherAI and transform the way classrooms teach, learn, and grow.
          </p>
          <Link
            href="/auth/signup"
            className="mt-7 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Get Started
          </Link>
        </motion.section>
      </main>

      <footer className="border-t border-slate-100 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ClassteacherAI</p>
          <p>Built for future-ready classrooms.</p>
        </div>
      </footer>
    </div>
  );
}
