import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { formatPageTitle } from "@/lib/site";
import { HomeView } from "./home-view";

export const metadata: Metadata = {
  title: { absolute: formatPageTitle("Classes") },
};

export default async function HomePage() {
  await auth.protect();
  return <HomeView />;
}
