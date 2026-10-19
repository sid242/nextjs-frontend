import { ResizableNodeView } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import { NodeSelection } from "@tiptap/pm/state";

/**
 * The image node, taught to resize.
 *
 * Lifted out of the editor because it is a Tiptap extension rather than a
 * component: it has its own attribute schema, its own HTML rendering and its
 * own node view, and none of that is anything the editor around it reads.
 */

/**
 * A node attribute in the form a DOM attribute can hold, or null if it has none.
 *
 * Tiptap types its attrs as `Record<string, unknown>`, so an object reaching
 * `String()` here would set the literal text `[object Object]` on the element
 * and look, in the DOM, exactly like a value someone meant to put there. The
 * narrowing at `renderHTML` above already guards its own path; this is the same
 * guard for the update path, which had been left with a bare `String()`.
 */
function attributeText(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

/**
 * A CSS pixel length from a node attribute, or `''` to clear the property.
 *
 * Both shapes are legitimate: the resize handle commits a number, and
 * `parseHTML` above stores a string with the `px` already stripped. Zero and
 * the empty string clear the property, which is what the truthiness check this
 * replaces did with either.
 */
function pixels(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) && value !== 0 ? `${value}px` : "";
  if (typeof value === "string" && value.trim() !== "") return `${value.trim()}px`;
  return "";
}

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-align": {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes: Record<string, unknown>) => {
          return {
            "data-align": attributes["data-align"] as string,
          };
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width") || element.style.width;
          return width ? width.replace("px", "") : null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.width) return {};
          return {
            width: attributes.width as string | number,
          };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute("height") || element.style.height;
          return height ? height.replace("px", "") : null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.height) return {};
          return {
            height: attributes.height as string | number,
          };
        },
      },
    };
  },
  addNodeView() {
    if (!this.options.resize || !this.options.resize.enabled || typeof document === "undefined") {
      return null;
    }

    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = this.options.resize;

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("img");

      Object.entries(HTMLAttributes as Record<string, unknown>).forEach(([key, value]) => {
        if (value != null) {
          switch (key) {
            case "width":
            case "height":
              break;
            default:
              if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
              ) {
                el.setAttribute(key, String(value));
              }
              break;
          }
        }
      });

      el.src = (HTMLAttributes as { src?: string }).src || "";

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width: number, height: number) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width: number, height: number) => {
          const pos = getPos();
          if (pos === undefined) {
            return;
          }

          editor.commands.updateAttributes("image", { width, height });
        },
        onUpdate: (updatedNode: { type: typeof node.type; attrs: Record<string, unknown> }) => {
          if (updatedNode.type !== node.type) {
            return false;
          }

          Object.entries(updatedNode.attrs).forEach(([key, value]) => {
            if (value == null) {
              if (key !== "width" && key !== "height") {
                el.removeAttribute(key);
              }
              return;
            }

            if (key === "width" || key === "height") {
              return;
            }

            const text = attributeText(value);
            if (text === null) {
              return;
            }

            if (key === "src") {
              el.src = text;
              return;
            }

            el.setAttribute(key, text);
          });

          el.style.width = pixels(updatedNode.attrs.width);
          el.style.height = pixels(updatedNode.attrs.height);

          return true;
        },
        options: {
          ...(directions ? { directions } : {}),
          min: {
            ...(typeof minWidth === "number" ? { width: minWidth } : {}),
            ...(typeof minHeight === "number" ? { height: minHeight } : {}),
          },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
        },
      });

      const dom = nodeView.dom;

      dom.style.cursor = "pointer";

      const handleMouseDown = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        if (target.closest("[data-resize-handle]")) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const pos = getPos();

        if (typeof pos !== "number") return;

        editor.view.focus();

        const transaction = editor.state.tr.setSelection(
          NodeSelection.create(editor.state.doc, pos),
        );

        editor.view.dispatch(transaction);
      };

      dom.addEventListener("mousedown", handleMouseDown);

      const originalDestroy = nodeView.destroy?.bind(nodeView);

      nodeView.destroy = () => {
        dom.removeEventListener("mousedown", handleMouseDown);
        originalDestroy?.();
      };

      return nodeView;
    };
  },
});
