"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardGrid } from "@/components/card-grid";
import { ClassActions } from "@/components/item-actions";
import { ItemCard } from "@/components/item-card";
import { NameDialog } from "@/components/name-dialog";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { classNamePlaceholder } from "@/lib/format";

export default function HomePage() {
  const router = useRouter();
  const classes = useQuery(api.classes.list);
  const createClass = useMutation(api.classes.create);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Classes", href: "/" }]} />
      <main className="container animate-in fade-in py-8 duration-300">
        <PageTitle
          title="Classes"
          actions={
            <Button onClick={() => setIsCreating(true)}>
              <PlusIcon aria-hidden className="mr-2 size-4" />
              New class
            </Button>
          }
        />
        <div className="mt-8">
          <CardGrid
            items={classes}
            emptyMessage="No classes yet. Create one to get started."
            renderItem={(schoolClass) => (
              <ItemCard
                key={schoolClass._id}
                href={`/classes/${schoolClass._id}`}
                title={schoolClass.name}
                actions={<ClassActions schoolClass={schoolClass} />}
              />
            )}
          />
        </div>
        <NameDialog
          open={isCreating}
          onOpenChange={setIsCreating}
          title="New class"
          initialName=""
          placeholder={classNamePlaceholder}
          required
          submitLabel="Create"
          onSave={async (name) => {
            const classId = await createClass({ name });
            router.push(`/classes/${classId}`);
          }}
        />
      </main>
    </>
  );
}
