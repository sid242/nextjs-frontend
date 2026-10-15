import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SubmitButtonProps extends Omit<React.ComponentProps<typeof Button>, "type"> {
  pending?: boolean;
  pendingText?: string;
}

export function SubmitButton({
  pending,
  pendingText,
  children,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? <Spinner /> : null}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
