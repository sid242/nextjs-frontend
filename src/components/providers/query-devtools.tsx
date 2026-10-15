"use client";

import dynamic from "next/dynamic";

const Devtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools),
  { ssr: false },
);

/** Inspect cache, keys and refetches while developing. Renders nothing in production builds. */
export function QueryDevtools() {
  return process.env.NODE_ENV === "development" ? (
    <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
  ) : null;
}
