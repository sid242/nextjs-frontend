import type { ElementType, HTMLAttributes, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Responsive Typography Variants
 * Scalable for mobile-first with responsive breakpoints and theme variables.
 */
export const typographyVariants = cva("whitespace-pre-line transition-colors", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-2xl font-semibold leading-9 tracking-[-0.5%] lg:text-[28px]",
      h2: "scroll-m-20 text-xl font-semibold leading-8 tracking-[-0.5%] lg:text-2xl",
      h3: "scroll-m-20 text-lg font-medium leading-7 tracking-[-0.5%] lg:text-xl",
      h4: "scroll-m-20 text-base font-medium leading-[26px] tracking-[-0.5%] lg:text-lg",
      h5: "text-sm font-medium leading-6 tracking-[-0.5%] lg:text-base",
      h6: "text-xs font-medium leading-5 tracking-[-0.5%] lg:text-sm",
      p: "leading-7",
      blockquote: "mt-6 border-l-2 pl-6 italic",
      code: "bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      lead: "text-muted-foreground text-xl",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-muted-foreground text-sm",
      help: "text-muted-foreground text-xs",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    color: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
      white: "text-white",
    },
  },
  defaultVariants: {
    variant: "p",
    color: "default",
  },
});

export type TypographyElement =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "div"
  | "blockquote"
  | "code"
  | ElementType;

export interface TypographyProps
  extends Omit<HTMLAttributes<HTMLElement>, "color">, VariantProps<typeof typographyVariants> {
  /**
   * Manually override the HTML tag or component.
   * If not provided, it defaults to matching the variant name (e.g. 'h1' variant renders <h1>).
   */
  as?: TypographyElement;
  ref?: Ref<HTMLElement>;
}

export function Typography({
  className,
  variant = "p",
  weight,
  color,
  as,
  ref,
  ...props
}: TypographyProps) {
  const Component: ElementType =
    as ??
    (variant && ["h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote", "code"]?.includes(variant)
      ? (variant as ElementType)
      : "p");

  return (
    <Component
      ref={ref}
      className={cn(typographyVariants({ variant, weight, color }), className)}
      {...props}
    />
  );
}
