"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { NodeSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";

import { CustomImage } from "./extensions/custom-image";
import { Sep, ToolbarButton } from "./toolbar";

import "./rich-text-editor.css";

const MAX_BASE64_BYTES = 2_000_000;

function isInlineImageTooLarge(file: File) {
  const estimatedBase64Size = Math.ceil((file.size * 4) / 3);
  return estimatedBase64Size > MAX_BASE64_BYTES;
}

function notifyInlineImageTooLarge() {
  toast.error("Please use a smaller image or paste an image URL.");
}

export interface RichTextEditorProps {
  label?: string;
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  labelClassName?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  id,
  value = "",
  onChange,
  onBlur,
  labelClassName,
  className,
  placeholder,
  required,
  disabled = false,
}) => {
  const [linkState, setLinkState] = useState({
    show: false,
    url: "",
    rel: "" as "nofollow" | "",
  });
  const [imageState, setImageState] = useState({
    show: false,
    url: "",
    alt: "",
  });
  const linkPopupRef = useRef<HTMLDivElement>(null);
  const imagePopupRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /*
   * The last HTML this editor emitted. A value equal to it is our own edit
   * coming back round through the parent, not an outside change to load — a
   * boolean flag lost count when two keystrokes landed before one re-render,
   * and the stale value then reset the document (R9-10).
   */
  const lastEmittedRef = useRef<string | null>(null);

  const extensions = useMemo(
    () => [
      // StarterKit 3 bundles Link and Underline; both are registered below with
      // this editor's options, and a second copy only warned and raced them.
      StarterKit.configure({
        codeBlock: {},
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      FontFamily,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      CustomImage.configure({
        allowBase64: true,
        inline: false,
        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 50,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: null,
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder || "Start typing…" }),
    ],
    [placeholder],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        linkState.show &&
        linkPopupRef.current &&
        !linkPopupRef.current.contains(event.target as Node)
      ) {
        setLinkState((prev) => ({ ...prev, show: false }));
      }
      if (
        imageState.show &&
        imagePopupRef.current &&
        !imagePopupRef.current.contains(event.target as Node)
      ) {
        setImageState((prev) => ({ ...prev, show: false }));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [linkState.show, imageState.show]);

  /*
   * `useEditor` compares these on every render and re-applies them when one
   * differs by reference. `content` is only the initial document — later
   * values arrive through the effect below — and `editorProps` is built once;
   * passed fresh each render, both re-set the view on every keystroke, which
   * is where Media › Content's "Maximum update depth exceeded" came from.
   */
  const [initialContent] = useState(() => value || "");
  const editorProps = useMemo(
    () => ({
      attributes: {
        tabindex: "0",
      },
      handlePaste(view: EditorView, event: ClipboardEvent) {
        if (!event.clipboardData) return false;
        let imagePasted = false;
        for (const item of Array.from(event.clipboardData.items)) {
          if (item.type.startsWith("image/")) {
            imagePasted = true;
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            if (isInlineImageTooLarge(file)) {
              notifyInlineImageTooLarge();
              continue;
            }
            const reader = new FileReader();
            reader.onload = () => {
              const { schema } = view.state;
              const imageType = schema.nodes.image;
              if (imageType) {
                const node = imageType.create({
                  src: reader.result as string,
                });
                view.dispatch(view.state.tr.replaceSelectionWith(node));
              }
            };
            reader.readAsDataURL(file);
          }
        }
        return imagePasted;
      },
    }),
    [],
  );

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      lastEmittedRef.current = html;
      onChange?.(html);
    },
    onBlur() {
      onBlur?.();
    },
    editorProps,
  });

  useEffect(() => {
    if (!editor) return;

    if (value === lastEmittedRef.current) return;

    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    /*
     * `false` is doing real work: `setEditable` emits an update by default,
     * and this effect runs on mount — so every consumer received one onChange
     * of freshly re-serialised HTML (entity and attribute normalisation, not
     * an edit) before anyone typed. The project wizard buffered that phantom
     * change and reported "Unsaved changes" for merely opening the Media tab;
     * before that, the autosave era silently PATCHed it.
     */
    editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  const handleLinkSubmit = () => {
    if (!editor) return;
    if (linkState.url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href: linkState.url,
          rel: linkState.rel === "nofollow" ? "nofollow" : null,
        })
        .run();
    }
    setLinkState((prev) => ({ ...prev, show: false }));
  };

  const handleImageSubmit = () => {
    if (!editor) return;
    if (imageState.url) {
      (
        editor.chain().focus() as unknown as {
          setImage: (options: { src: string }) => { run: () => boolean };
        }
      )
        .setImage({ src: imageState.url })
        .run();
    }
    setImageState((prev) => ({ ...prev, show: false, url: "" }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      if (isInlineImageTooLarge(file)) {
        notifyInlineImageTooLarge();
        setImageState((prev) => ({ ...prev, show: false }));
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        (
          editor.chain().focus() as unknown as {
            setImage: (options: { src: string }) => { run: () => boolean };
          }
        )
          .setImage({ src: reader.result as string })
          .run();
      };
      reader.readAsDataURL(file);
    }
    setImageState((prev) => ({ ...prev, show: false }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!editor) return;

    const updateSelectionState = () => {
      if (editor.isActive("link")) {
        const attrs = editor.getAttributes("link");
        const url = (attrs.href as string) || "";
        const rel = (attrs.rel as string)?.includes("nofollow") ? "nofollow" : "";
        setLinkState((prev) =>
          prev.url === url && prev.rel === rel ? prev : { ...prev, url, rel },
        );
      } else {
        setLinkState((prev) =>
          prev.url === "" && prev.rel === "" ? prev : { ...prev, url: "", rel: "" },
        );
      }

      if (editor.isActive("image")) {
        const attrs = editor.getAttributes("image");
        const alt = (attrs.alt as string) || "";
        setImageState((prev) => (prev.alt === alt ? prev : { ...prev, alt }));
      } else {
        // The same state back when nothing changed: this runs on every
        // selection update, and a new object each time re-rendered the whole
        // editor for a caret move.
        setImageState((prev) => (prev.alt === "" ? prev : { ...prev, alt: "" }));
      }
    };

    updateSelectionState();
    editor.on("selectionUpdate", updateSelectionState);

    return () => {
      editor.off("selectionUpdate", updateSelectionState);
    };
  }, [editor]);

  if (!editor) return null;

  const can = editor.can().chain().focus();

  return (
    <div className={`tiptap-editor-c ${className || ""}`} id={id}>
      {label && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required && <span className="text-destructive ms-1">*</span>}
        </label>
      )}

      {/* ── Toolbar ── */}
      <div className="tiptap-toolbar">
        {/* Font family */}
        <select
          title="Font family"
          className="tiptap-select"
          onChange={(e) => {
            if (e.target.value === "default") {
              editor.chain().focus().unsetFontFamily().run();
            } else {
              editor.chain().focus().setFontFamily(e.target.value).run();
            }
          }}
          value={(editor.getAttributes("textStyle").fontFamily as string) || "default"}
        >
          <option value="default" className="bg-popover text-popover-foreground">
            Font
          </option>
          <option value="Inter" className="bg-popover text-popover-foreground">
            Inter
          </option>
          <option value="Arial" className="bg-popover text-popover-foreground">
            Arial
          </option>
          <option value="Georgia" className="bg-popover text-popover-foreground">
            Georgia
          </option>
          <option value="Courier New" className="bg-popover text-popover-foreground">
            Courier New
          </option>
          <option value="Times New Roman" className="bg-popover text-popover-foreground">
            Times New Roman
          </option>
        </select>

        {/* Heading */}
        <select
          title="Heading"
          className="tiptap-select"
          onChange={(e) => {
            const v = e.target.value;
            if (v === "paragraph") {
              editor.chain().focus().setParagraph().run();
            } else {
              editor
                .chain()
                .focus()
                .setHeading({ level: parseInt(v) as 1 | 2 | 3 | 4 | 5 | 6 })
                .run();
            }
          }}
          value={
            editor.isActive("heading", { level: 1 })
              ? "1"
              : editor.isActive("heading", { level: 2 })
                ? "2"
                : editor.isActive("heading", { level: 3 })
                  ? "3"
                  : editor.isActive("heading", { level: 4 })
                    ? "4"
                    : editor.isActive("heading", { level: 5 })
                      ? "5"
                      : editor.isActive("heading", { level: 6 })
                        ? "6"
                        : "paragraph"
          }
        >
          <option value="paragraph" className="bg-popover text-popover-foreground">
            Normal
          </option>
          <option value="1" className="bg-popover text-popover-foreground">
            H1
          </option>
          <option value="2" className="bg-popover text-popover-foreground">
            H2
          </option>
          <option value="3" className="bg-popover text-popover-foreground">
            H3
          </option>
          <option value="4" className="bg-popover text-popover-foreground">
            H4
          </option>
          <option value="5" className="bg-popover text-popover-foreground">
            H5
          </option>
          <option value="6" className="bg-popover text-popover-foreground">
            H6
          </option>
        </select>

        <Sep />

        {/* Text colour */}
        <label className="tiptap-color-wrap" title="Text colour">
          <span
            className="tiptap-color-label"
            style={{
              color: (editor.getAttributes("textStyle").color as string) || "inherit",
            }}
          >
            A
          </span>
          <input
            type="color"
            className="tiptap-color-input"
            onInput={(e) =>
              editor
                .chain()
                .focus()
                .setColor((e.target as HTMLInputElement).value)
                .run()
            }
            value={(editor.getAttributes("textStyle").color as string) || "#000000"}
          />
        </label>

        {/* Background colour */}
        <label className="tiptap-color-wrap" title="Background colour">
          <span
            className="tiptap-color-label"
            style={{
              backgroundColor: (editor.getAttributes("highlight").color as string) || "transparent",
            }}
          >
            bg
          </span>
          <input
            type="color"
            className="tiptap-color-input"
            onInput={(e) =>
              editor
                .chain()
                .focus()
                .setHighlight({ color: (e.target as HTMLInputElement).value })
                .run()
            }
            value={(editor.getAttributes("highlight").color as string) || "#ffffff"}
          />
        </label>

        <Sep />

        {/* Bold / Italic / Underline / Strike */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>

        <Sep />

        {/* Sub / Super */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive("subscript")}
          title="Subscript"
        >
          X<sub>2</sub>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive("superscript")}
          title="Superscript"
        >
          X<sup>2</sup>
        </ToolbarButton>

        <Sep />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          ☰
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          title="Justify"
        >
          ≣
        </ToolbarButton>

        <Sep />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          •≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered list"
        >
          1≡
        </ToolbarButton>

        <Sep />

        {/* Blockquote / Code block */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code block"
        >
          {"</>"}
        </ToolbarButton>

        <Sep />

        {/* Link / Image */}
        <div className="relative" ref={linkPopupRef}>
          <ToolbarButton
            onClick={() => {
              setLinkState((prev) => {
                if (prev.show) {
                  return { ...prev, show: false };
                } else {
                  const previousUrl = editor.getAttributes("link").href as string | undefined;
                  const previousRel = editor.getAttributes("link").rel as string | undefined;
                  return {
                    show: true,
                    url: previousUrl || "",
                    rel: previousRel?.includes("nofollow") ? "nofollow" : "",
                  };
                }
              });
              setImageState((prev) => ({ ...prev, show: false }));
            }}
            active={editor.isActive("link") || linkState.show}
            title="Link"
          >
            🔗
          </ToolbarButton>
          {linkState.show && (
            <div className="bg-popover text-popover-foreground border-border absolute top-full left-0 z-[51] mt-2 flex w-80 flex-col gap-3 rounded border p-3 shadow-xl">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="url"
                  placeholder="Enter URL..."
                  className="border-input bg-background flex-1 rounded border px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={linkState.url}
                  onChange={(e) => setLinkState((prev) => ({ ...prev, url: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLinkSubmit();
                  }}
                />
                <button
                  type="button"
                  onClick={handleLinkSubmit}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Save
                </button>
              </div>

              <div className="border-border flex flex-col gap-2 border-t pt-1">
                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs font-medium select-none">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={linkState.rel === "nofollow"}
                    onChange={(e) =>
                      setLinkState((prev) => ({
                        ...prev,
                        rel: e.target.checked ? "nofollow" : "",
                      }))
                    }
                  />
                  nofollow
                </label>

                {editor.isActive("link") && (
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      className="bg-muted hover:bg-muted/80 flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors"
                      title="Open link"
                      onClick={() => {
                        if (linkState.url) {
                          window.open(linkState.url, "_blank", "noopener");
                        }
                      }}
                    >
                      ↗ Open Link
                    </button>
                    <button
                      type="button"
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20 flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors"
                      title="Remove link"
                      onClick={() => {
                        editor.chain().focus().extendMarkRange("link").unsetLink().run();
                        setLinkState({ show: false, url: "", rel: "" });
                      }}
                    >
                      ✕ Unlink
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={imagePopupRef}>
          <ToolbarButton
            onClick={() => {
              setImageState((prev) => {
                if (prev.show) {
                  return { ...prev, show: false };
                } else {
                  return {
                    show: true,
                    url: "",
                    alt: "",
                  };
                }
              });
              setLinkState((prev) => ({ ...prev, show: false }));
            }}
            title="Insert image"
            active={imageState.show}
          >
            🖼
          </ToolbarButton>
          {imageState.show && (
            <div className="bg-popover text-popover-foreground border-border absolute top-full left-0 z-[51] mt-2 flex w-72 flex-col gap-3 rounded border p-3 shadow-xl">
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="url"
                  placeholder="Paste image URL..."
                  className="border-input bg-background flex-1 rounded border px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={imageState.url}
                  onChange={(e) => setImageState((prev) => ({ ...prev, url: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleImageSubmit();
                  }}
                />
                <button
                  type="button"
                  onClick={handleImageSubmit}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-border h-px flex-1"></div>
                <span className="text-muted-foreground text-xs">OR</span>
                <div className="bg-border h-px flex-1"></div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-muted hover:bg-muted/80 flex w-full items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-colors"
              >
                Upload from device
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          )}
        </div>

        <Sep />

        {/* ── TABLE controls ── */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          title="Insert table (3×3)"
          active={false}
        >
          ⊞ Table
        </ToolbarButton>

        {editor.isActive("table") && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Insert column left"
              active={false}
              disabled={!can.addColumnBefore().run()}
            >
              ←col
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Insert column right"
              active={false}
              disabled={!can.addColumnAfter().run()}
            >
              col→
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete column"
              active={false}
              disabled={!can.deleteColumn().run()}
            >
              ✕col
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Insert row above"
              active={false}
              disabled={!can.addRowBefore().run()}
            >
              ↑row
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Insert row below"
              active={false}
              disabled={!can.addRowAfter().run()}
            >
              row↓
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete row"
              active={false}
              disabled={!can.deleteRow().run()}
            >
              ✕row
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().mergeCells().run()}
              title="Merge cells"
              active={false}
              disabled={!can.mergeCells().run()}
            >
              ⊕merge
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().splitCell().run()}
              title="Split cell"
              active={false}
              disabled={!can.splitCell().run()}
            >
              ⊖split
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              title="Toggle header row"
              active={false}
            >
              H-row
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
              title="Toggle header column"
              active={false}
            >
              H-col
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete table"
              active={false}
            >
              🗑 Table
            </ToolbarButton>
          </>
        )}
      </div>

      {editor && (
        <BubbleMenu
          className="z-[9999999]"
          editor={editor}
          pluginKey="image-bubble-menu"
          updateDelay={0}
          shouldShow={({ state }) => {
            return (
              state.selection instanceof NodeSelection && state.selection.node.type.name === "image"
            );
          }}
        >
          <div className="tiptap-bubble-menu">
            {(() => {
              const isImageActive =
                editor.state.selection instanceof NodeSelection &&
                editor.state.selection.node.type.name === "image";

              if (isImageActive) {
                return (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          .chain()
                          .focus()
                          .updateAttributes("image", { "data-align": "left" })
                          .run()
                      }
                      className={`bubble-btn${editor.getAttributes("image")["data-align"] === "left" ? "is-active" : ""}`}
                    >
                      Align Left
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          .chain()
                          .focus()
                          .updateAttributes("image", { "data-align": "center" })
                          .run()
                      }
                      className={`bubble-btn${editor.getAttributes("image")["data-align"] === "center" ? "is-active" : ""}`}
                    >
                      Align Center
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          .chain()
                          .focus()
                          .updateAttributes("image", { "data-align": "right" })
                          .run()
                      }
                      className={`bubble-btn${editor.getAttributes("image")["data-align"] === "right" ? "is-active" : ""}`}
                    >
                      Align Right
                    </button>

                    <span className="bubble-sep" />

                    <div className="bubble-alt-input">
                      <input
                        type="text"
                        placeholder="Alt text"
                        value={imageState.alt}
                        onChange={(e) => {
                          setImageState((prev) => ({
                            ...prev,
                            alt: e.target.value,
                          }));
                        }}
                        onBlur={() => {
                          editor.commands.updateAttributes("image", {
                            alt: imageState.alt,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();

                            editor.commands.updateAttributes("image", {
                              alt: imageState.alt,
                            });
                          }
                        }}
                      />
                    </div>
                  </>
                );
              }

              return null;
            })()}
          </div>
        </BubbleMenu>
      )}

      {/* ── Editor content area ── */}
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
};
