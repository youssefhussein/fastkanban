"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("flow", flow);
    try {
      await signIn("password", formData);
      router.push("/");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error ? submissionError.message : "Authentication failed";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f3e7] px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background:repeating-linear-gradient(-45deg,transparent,transparent_14px,rgba(24,24,27,.09)_14px,rgba(24,24,27,.09)_16px)] dark:opacity-20" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="bg-lime-100 dark:bg-zinc-900">
            <CardHeader className="space-y-4">
              <Badge variant="info" className="w-fit">
                Team Workflow
              </Badge>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-700 dark:text-zinc-300">
                Fast Kanban
              </p>
              <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.03em] sm:text-6xl">
                Fast
                <span className="block text-pink-600 dark:text-pink-300">Kanban</span>
              </h1>
              <CardDescription className="max-w-lg text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Visual task arena with realtime sync. Sign in to manage projects, reorder by priority,
                and drag cards across the full board.
              </CardDescription>
            </CardHeader>
          </Card>

          <form onSubmit={(event) => void handleSubmit(event)}>
            <Card className="bg-white dark:bg-zinc-900">
              <CardHeader className="space-y-2">
                <CardTitle>{flow === "signIn" ? "Sign In" : "Create Account"}</CardTitle>
                <CardDescription>
                  {flow === "signIn"
                    ? "Use your credentials to access your board."
                    : "Set up your account to start organizing cards."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input type="email" name="email" placeholder="Email" required />
                <div className="space-y-1">
                  <Input
                    type="password"
                    name="password"
                    placeholder="Password"
                    minLength={8}
                    required
                  />
                  {flow === "signUp" ? (
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      Password must be at least 8 characters.
                    </p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Loading..." : flow === "signIn" ? "Sign In" : "Sign Up"}
                </Button>
                <p className="text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {flow === "signIn" ? "Don’t have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    className="ml-2 cursor-pointer font-black uppercase tracking-wide text-zinc-900 underline decoration-2 underline-offset-4 dark:text-zinc-100"
                    onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
                  >
                    {flow === "signIn" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
                {error ? (
                  <div className="rounded-md border-2 border-zinc-950 bg-rose-200 px-3 py-2 text-sm font-semibold text-zinc-900 dark:bg-rose-300">
                    Error: {error}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </main>
  );
}
