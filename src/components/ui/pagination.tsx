import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<
  ComponentProps<"button">,
  "className" | "disabled" | "onClick" | "children" | "aria-label" | "type"
> &
  VariantProps<typeof buttonVariants>;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  type = "button",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type={type}
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        "h-8 min-w-8 cursor-pointer px-2 font-mono text-xs font-medium disabled:cursor-not-allowed",
        isActive && "border-primary/40 bg-accent text-accent-foreground font-bold shadow-2xs",
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  children,
  ...props
}: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="sm"
      className={cn("h-8 w-auto gap-1.5 px-3 font-sans text-xs select-none", className)}
      {...props}
    >
      <ChevronLeftIcon className="size-4 shrink-0" />
      {children ?? <span>Previous</span>}
    </PaginationLink>
  );
}

function PaginationNext({ className, children, ...props }: ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="sm"
      className={cn("h-8 w-auto gap-1.5 px-3 font-sans text-xs select-none", className)}
      {...props}
    >
      {children ?? <span>Next</span>}
      <ChevronRightIcon className="size-4 shrink-0" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("text-muted-foreground flex size-8 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
