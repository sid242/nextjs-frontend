"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon, SendIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ControlledInput, FormWrapper } from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { STANDARD_VARIABLES } from "../constants";
import { useTestSendEmailTemplate } from "../queries";
import type { EmailTemplate } from "../types";

const testSendFormSchema = z.object({
  recipient: z.string().trim().email("Please enter a valid recipient email address"),
});

type TestSendFormValues = z.infer<typeof testSendFormSchema>;

interface TestSendDialogProps {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitialVariables(template: EmailTemplate): Record<string, string> {
  const defaults: Record<string, string> = {};
  const allVars = template?.variables ?? [];
  for (const key of allVars) {
    const found = STANDARD_VARIABLES.find((v) => v?.key === key);
    defaults[key] = found ? found.sample : `Sample ${key}`;
  }
  return defaults;
}

function TestSendDialogContent({
  template,
  onOpenChange,
}: {
  template: EmailTemplate;
  onOpenChange: (open: boolean) => void;
}) {
  const initialVars = useMemo(() => getInitialVariables(template), [template]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(initialVars);

  const testSendMutation = useTestSendEmailTemplate();

  const methods = useForm<TestSendFormValues>({
    resolver: zodResolver(testSendFormSchema),
    defaultValues: {
      recipient: "",
    },
  });

  const onSubmit = async (values: TestSendFormValues) => {
    await testSendMutation.mutateAsync({
      id: template.id,
      data: {
        to: values.recipient.trim(),
        variables: variableValues,
      },
    });

    onOpenChange(false);
  };

  return (
    <DialogContent className="border-border/80 max-w-lg rounded-2xl shadow-xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
            <MailIcon className="size-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Send Test Email</DialogTitle>
            <DialogDescription className="text-xs">
              Dispatch a test copy of &quot;{template.name}&quot; via tenant SMTP
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4 pt-2">
        <ControlledInput
          name="recipient"
          label="Recipient Email Address"
          type="email"
          required
          placeholder="e.g. yourname@example.com"
          hint="A real email will be delivered to this inbox with the interpolated variables below."
        />

        {template?.variables && template.variables.length > 0 && (
          <div className="border-border/80 space-y-2 border-t pt-3">
            <div className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Template Variables ({template.variables.length})
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {template.variables.map((key) => (
                <div key={key} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="text-muted-foreground col-span-5 truncate font-mono" title={key}>
                    {`{{${key}}}`}
                  </span>
                  <Input
                    className="border-border/80 col-span-7 h-8 rounded-xl font-sans text-xs"
                    value={variableValues[key] ?? ""}
                    onChange={(e) =>
                      setVariableValues((prev) => ({ ...prev, [key]: e?.target?.value ?? "" }))
                    }
                    placeholder={`Value for ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={testSendMutation.isPending}
            className="border-border/80 rounded-xl text-xs"
          >
            Cancel
          </Button>
          <SubmitButton
            pending={testSendMutation.isPending}
            pendingText="Dispatching..."
            className="gap-1.5 rounded-xl text-xs"
          >
            <SendIcon className="size-4" />
            <span>Send Test Email</span>
          </SubmitButton>
        </DialogFooter>
      </FormWrapper>
    </DialogContent>
  );
}

export function TestSendDialog({ template, open, onOpenChange }: TestSendDialogProps) {
  if (!template || !open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TestSendDialogContent key={template.id} template={template} onOpenChange={onOpenChange} />
    </Dialog>
  );
}
