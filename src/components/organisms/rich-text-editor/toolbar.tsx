"use client";

import React from "react";

export const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    disabled={disabled}
    className={`tiptap-btn${active ? "is-active" : ""}${disabled ? "is-disabled" : ""}`}
  >
    {children}
  </button>
);

export const Sep = () => <span className="tiptap-sep" />;
