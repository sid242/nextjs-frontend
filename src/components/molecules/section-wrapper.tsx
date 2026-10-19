import type { HTMLAttributes, ReactNode, Ref } from "react";

import { Box, type BoxComponent, type BoxProps } from "@/components/ui/box";
import { cn } from "@/lib/utils";

export interface SectionWrapperProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  wrapperClassName?: string;
  containerClassName?: string;
  fullWidth?: boolean;
  children: ReactNode;
  wrapperProps?: BoxProps<BoxComponent>;
  containerProps?: BoxProps<BoxComponent>;
  ref?: Ref<HTMLElement>;
}

/**
 * SectionWrapper
 *
 * Consistent layout container component with outer section spacing
 * and inner max-width container constraints.
 */
export function SectionWrapper({
  id,
  fullWidth = false,
  wrapperClassName,
  containerClassName,
  children,
  wrapperProps,
  containerProps,
  ref,
  ...rest
}: SectionWrapperProps) {
  return (
    <Box
      as="section"
      id={id}
      ref={ref}
      className={cn("w-full px-6 md:px-8 lg:px-20", wrapperClassName)}
      {...wrapperProps}
      {...rest}
    >
      <Box
        className={cn(
          "py-12 md:py-16 lg:py-24",
          fullWidth ? "w-full" : "mx-auto max-w-7xl",
          containerClassName,
        )}
        {...containerProps}
      >
        {children}
      </Box>
    </Box>
  );
}
