"use client";

import React, { useState } from "react";
import { MailIcon, SendIcon } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

import { STANDARD_VARIABLES } from "../constants";
import { useTestSendEmailTemplate } from "../queries";
import type { EmailTemplate } from "../types";

interface TestSendDialogProps {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitialVariables(template: EmailTemplate): Record<string, string> {
  const defaults: Record<string, string> = {};
  const allVars = template.variables || [];
  for (const key of allVars) {
    const found = STANDARD_VARIABLES.find((v) => v.key === key);
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
  const [recipient, setRecipient] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>(() =>
    getInitialVariables(template),
  );

  const testSendMutation = useTestSendEmailTemplate();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    await testSendMutation.mutateAsync({
      id: template.id,
      data: {
        to: recipient,
        variables: variableValues,
      },
    });

    onOpenChange(false);
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <MailIcon className="size-5" />
          </div>
          <div>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Dispatch a test copy of &quot;{template.name}&quot; via tenant SMTP
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSend} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label htmlFor="recipient-email">Recipient Email Address *</Label>
          <Input
            id="recipient-email"
            type="email"
            required
            placeholder="e.g. yourname@example.com"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <p className="text-muted-foreground text-[11px]">
            A real email will be delivered to this inbox with the interpolated variables below.
          </p>
        </div>

        {template.variables && template.variables.length > 0 && (
          <div className="border-border/70 space-y-2 border-t pt-3">
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
                    className="col-span-7 h-7 font-sans text-xs"
                    value={variableValues[key] || ""}
                    onChange={(e) =>
                      setVariableValues((prev) => ({ ...prev, [key]: e.target.value }))
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={testSendMutation.isPending || !recipient}
            className="gap-1.5"
          >
            {testSendMutation.isPending ? (
              <>
                <Spinner className="size-4" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <SendIcon className="size-4" />
                <span>Send Test Email</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
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
