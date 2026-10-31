"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import { optionalNameSchema, requiredNameSchema } from "@/lib/schemas";

type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label?: string;
  initialName: string;
  placeholder: string;
  required?: boolean;
  hint?: string;
  submitLabel?: string;
  onSave: (name: string) => Promise<unknown>;
};

/**
 * A dialog with a single name field, used to create a class or a submission, and to rename any item.
 *
 * @param open Whether the dialog is shown.
 * @param onOpenChange Called when the dialog opens or closes.
 * @param title The title of the dialog.
 * @param label The label of the name field, "Name" by default.
 * @param initialName The value of the field when the dialog opens.
 * @param placeholder The placeholder of the field.
 * @param required Whether the name may be left empty.
 * @param hint A hint shown under the field.
 * @param submitLabel The label of the submit button, "Save" by default.
 * @param onSave Called with the trimmed name. The dialog closes once it finishes, and shows the error if it fails.
 */
export function NameDialog({ open, onOpenChange, ...props }: NameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <NameForm onDone={() => onOpenChange(false)} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function NameForm({
  title,
  label = "Name",
  initialName,
  placeholder,
  required = false,
  hint,
  submitLabel = "Save",
  onSave,
  onDone,
}: Omit<NameDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: required ? requiredNameSchema : optionalNameSchema,
      }),
    ),
    defaultValues: { name: initialName },
  });

  async function handleSubmit(values: { name: string }) {
    try {
      await onSave(values.name);
      onDone();
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid gap-5"
        noValidate
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input
                  placeholder={placeholder}
                  autoComplete="off"
                  className="text-base"
                  {...field}
                />
              </FormControl>
              {hint && <FormDescription>{hint}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError message={form.formState.errors.root?.message} />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
