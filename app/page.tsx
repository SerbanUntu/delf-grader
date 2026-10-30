import { PageHeader } from "@/components/page-header";

export default function HomePage() {
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />
      <main className="container animate-in fade-in py-8 duration-300">
        <h1 className="text-3xl font-semibold tracking-tight">Classes</h1>
        <p className="mt-2 text-muted-foreground">No classes yet.</p>
      </main>
    </>
  );
}
