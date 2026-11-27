import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: true, follow: true },
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignIn />
    </main>
  );
}
