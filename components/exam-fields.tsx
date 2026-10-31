"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  examDatePlaceholder,
  formatDate,
  isIsoDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/format";
import { rubrics } from "@/lib/rubrics";
import type { ExamValues } from "@/lib/schemas";

/**
 * The exam date, rubric and exam question fields shared by sessions and individual submissions.
 * It must be placed inside a form whose values include `ExamValues`.
 */
export function ExamFields() {
  const { control } = useFormContext<ExamValues>();

  return (
    <>
      <FormField
        control={control}
        name="examDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Exam date</FormLabel>
            <ExamDatePicker value={field.value} onChange={field.onChange} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="rubricId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rubric</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Choose a rubric" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {rubrics.map((rubric) => (
                  <SelectItem
                    key={rubric.id}
                    value={rubric.id}
                    className="text-base"
                  >
                    {rubric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="question"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Exam question</FormLabel>
            <FormControl>
              <Textarea
                rows={6}
                placeholder="Paste the exam question here"
                className="max-h-80 text-base"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

function ExamDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = isIsoDate(value) ? parseIsoDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            className="w-full justify-between text-base font-normal sm:w-56"
          >
            {selected ? formatDate(selected) : examDatePlaceholder}
            <CalendarIcon aria-hidden className="size-4 opacity-60" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          weekStartsOn={1}
          autoFocus
          onSelect={(date) => {
            if (date) {
              onChange(toIsoDate(date));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
