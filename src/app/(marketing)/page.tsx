import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHTS = [
  {
    title: "Secure by default",
    text: "httpOnly cookie sessions, CSRF checks, a strict CSP and a backend-for-frontend layer.",
  },
  {
    title: "Built to scale",
    text: "Feature modules with enforced boundaries, so teams can work in parallel.",
  },
  { title: "Realtime ready", text: "Socket.IO events keep lists fresh without polling." },
];

export default function HomePage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16">
      <section className="grid max-w-2xl gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          A production-minded Next.js foundation
        </h1>
        <p className="text-muted-foreground text-lg">
          Authentication, uploads, realtime updates and a clean architecture, ready for your
          product.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
