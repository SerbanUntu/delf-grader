import { auth } from "@clerk/nextjs/server";
import { HomeView } from "./home-view";

export default async function HomePage() {
  await auth.protect();
  return <HomeView />;
}
