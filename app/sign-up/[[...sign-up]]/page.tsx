import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignUp />
    </main>
  );
}
