"use client";

import React, { useState } from "react";
import { CheckIcon, CopyIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { STANDARD_VARIABLES, type MergeVariable } from "../constants";

interface VariableHelperProps {
  onInsert?: (variableKey: string) => void;
  selectedVariables?: string[];
  className?: string;
}

export function VariableHelper({ onInsert, className = "" }: VariableHelperProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Customer", "Project", "Sales", "Organization"];

  const filtered =
    activeCategory === "All"
      ? STANDARD_VARIABLES
      : STANDARD_VARIABLES.filter((v) => v.category === activeCategory);

  const handleClick = (v: MergeVariable) => {
    const tag = `{{${v.key}}}`;
    if (onInsert) {
      onInsert(tag);
      toast.success(`Inserted ${tag}`);
    } else {
      navigator.clipboard.writeText(tag);
      setCopiedKey(v.key);
      toast.success(`Copied ${tag} to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div className={`border-border/70 bg-muted/30 rounded-lg border p-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
          <SparklesIcon className="text-primary size-3.5" />
          <span>Merge Variables {onInsert ? "(Click to insert)" : "(Click to copy)"}</span>
        </div>
        <div className="flex items-center gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto pt-1">
        {filtered.map((v) => {
          const isCopied = copiedKey === v.key;
          return (
            <Button
              key={v.key}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleClick(v)}
              className="bg-background hover:bg-primary/10 hover:border-primary/50 h-7 gap-1.5 rounded-full px-2.5 font-mono text-xs transition-all"
              title={`Sample: ${v.sample}`}
            >
              {isCopied ? (
                <CheckIcon className="size-3 text-emerald-500" />
              ) : (
                <CopyIcon className="text-muted-foreground size-3" />
              )}
              <span>{`{{${v.key}}}`}</span>
              <span className="text-muted-foreground font-sans text-[10px] font-normal opacity-70">
                ({v.label})
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
