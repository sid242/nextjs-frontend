# Cohesive State Grouping Guidelines

This rule outlines the requirements for organizing React component state in this repository.

---

## 1. Core Principle: Group Related State Properties

**Never declare fragmented, separate `useState` hooks for related properties of the same logical domain or operation.**
Always combine related state variables into a single cohesive state object or discriminated union.

This pattern:

- Prevents desynchronized re-renders and impossible intermediate states.
- Simplifies resetting state to defaults with a single setter invocation.
- Improves readability, maintenance, and prop-drilling clarity.

---

## 2. Table & Filter State Patterns

### ❌ Anti-Pattern (Fragmented Individual States):

```tsx
// FORBIDDEN: Multiple individual state hooks for pagination and filters
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
const [searchQuery, setSearchQuery] = useState("");
const [categoryFilter, setCategoryFilter] = useState("ALL");
const [statusFilter, setStatusFilter] = useState("ALL");
const [sortBy, setSortBy] = useState("createdAt");
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
```

### ✅ Standard Pattern (Cohesive State Objects):

```tsx
// REQUIRED: Unified pagination state
const [pagination, setPagination] = useState<{ page: number; pageSize: number }>({
  page: 1,
  pageSize: 10,
});

// REQUIRED: Unified filter state
const [filters, setFilters] = useState<{
  search: string;
  category: string;
  status: string;
}>({
  search: "",
  category: "ALL",
  status: "ALL",
});

// Helper for atomic partial updates:
const updateFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
  setFilters((prev) => ({ ...prev, [key]: value }));
};
```

---

## 3. Modal & Dialog Operation State

Modals frequently involve an open flag (`isOpen`), a target record (`item`), and temporary fields (e.g. `email`, `phone`, `reason`, `step`).
Always consolidate all modal properties into a single state object.

### ❌ Anti-Pattern (Scattered Modal State):

```tsx
// FORBIDDEN: Separate states for modal visibility, target entity, and inputs
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const [recipientEmail, setRecipientEmail] = useState("");
const [recipientPhone, setRecipientPhone] = useState("");
const [currentStep, setCurrentStep] = useState(1);
```

### ✅ Standard Pattern (Single Modal State Object):

```tsx
interface ModalState<T = unknown> {
  isOpen: boolean;
  item: T | null;
  email?: string;
  phone?: string;
  step?: number;
}

const [modalState, setModalState] = useState<ModalState<User>>({
  isOpen: false,
  item: null,
});

// Open modal with item and context in a single call:
const handleOpen = (user: User) => {
  setModalState({
    isOpen: true,
    item: user,
    email: user.email,
    phone: user.phone ?? "",
    step: 1,
  });
};

// Clean close:
const handleClose = () => {
  setModalState((prev) => ({ ...prev, isOpen: false }));
};
```

---

## 4. Temporary Operation & Feedback States (Clipboard, Expanders, Tabs)

Combine parallel operational flags:

### ❌ Anti-Pattern:

```tsx
const [copiedSlug, setCopiedSlug] = useState(false);
const [copiedToken, setCopiedToken] = useState(false);
const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
```

### ✅ Standard Pattern:

```tsx
const [clipboardState, setClipboardState] = useState<{
  copiedSlug: boolean;
  copiedVariable: string | null;
}>({
  copiedSlug: false,
  copiedVariable: null,
});

// Update cleanly:
const markCopiedVariable = (token: string) => {
  setClipboardState((prev) => ({ ...prev, copiedVariable: token }));
  setTimeout(() => {
    setClipboardState((prev) => ({ ...prev, copiedVariable: null }));
  }, 1500);
};
```
