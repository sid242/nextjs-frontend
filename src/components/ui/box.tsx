import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

export type BoxComponent = ElementType;

/**
 * Props for the Box component.
 * `as` defaults to `"div"`. When changed, the native HTML attributes
 * of the chosen element are inferred automatically.
 */
export type BoxProps<C extends BoxComponent = "div"> = {
  /**
   * The HTML element (or custom React component) to render.
   * Defaults to `"div"`.
   *
   * @example as="section"
   * @example as="span"
   * @example as="ul"
   * @example as={Link}
   */
  as?: C;

  /** Additional Tailwind className — merged with cn() */
  className?: string;

  /** Children nodes */
  children?: ReactNode;

  /** Direct ref forwarding */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref?: Ref<any>;
} & Omit<ComponentPropsWithoutRef<C>, "className" | "children" | "ref">;

/**
 * Box
 *
 * A polymorphic layout primitive — the foundational building block for any
 * container or semantic wrapper.
 */
export function Box<C extends BoxComponent = "div">({
  as,
  className,
  ref,
  children,
  ...props
}: BoxProps<C>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn(className)} {...props}>
      {children}
    </Tag>
  );
}
