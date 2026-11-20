# Form Architecture, Mutations & Page vs Dialog Invariants

This rule governs the architecture, validation, layout, and component standards for all forms, data input, and mutation workflows in this Next.js frontend application.

---

## 1. Mandatory `FormWrapper` & Controlled Components for All Forms

Every form handling data creation, updates, mutations, or input collection **MUST** adhere to the following architecture:

### 1.1 Never Use Raw Uncontrolled Inputs or Fragmented `useState`

- **FORBIDDEN**: Creating a web of individual `useState` hooks for form fields (e.g. `const [name, setName] = useState('')`, `const [email, setEmail] = useState('')`).
- **FORBIDDEN**: Using raw HTML `<input>`, `<textarea>`, `<select>`, or unintegrated UI components directly for form mutations without form-context integration.
- **FORBIDDEN**: Writing raw `<form onSubmit={handleSubmit}>` without `FormWrapper`.

### 1.2 Mandatory Pattern: `FormWrapper` + React Hook Form + Zod

All forms must be initialized with `useForm` from `react-hook-form` and validated using `zodResolver(schema)`:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormWrapper,
  ControlledInput,
  ControlledSelect,
  ControlledSwitch,
  ControlledCheckbox,
  ControlledTextarea,
  ControlledPhoneInput,
} from "@/components/molecules/forms";
import { SubmitButton } from "@/components/molecules/submit-button";

const methods = useForm<MyFormInput>({
  resolver: zodResolver(myFormSchema),
  defaultValues: { ... },
});

<FormWrapper methods={methods} onSubmit={onSubmit} className="space-y-4">
  <ControlledInput
    control={methods.control}
    name="title"
    label="Title"
    placeholder="Enter title"
  />
  <ControlledSelect
    control={methods.control}
    name="status"
    label="Status"
    options={statusOptions}
  />
  <SubmitButton isPending={isPending} loadingText="Saving...">
    Save Changes
  </SubmitButton>
</FormWrapper>
```

### 1.3 Available Controlled Components (`@/components/molecules/forms`)

Always import and use the canonical controlled components:

- `ControlledInput`: Standard text, email, number, URL, password inputs.
- `ControlledSelect`: Dropdown single-select with label and error state.
- `ControlledTextarea`: Multi-line text inputs.
- `ControlledSwitch`: Boolean feature/status toggles.
- `ControlledCheckbox`: Multi-select or boolean agreement checks.
- `ControlledPhoneInput`: International telephone number input with country codes.
- `ControlledRadioGroup`: Mutually exclusive option groups.
- `ControlledRichTextEditor`: Rich WYSIWYG editor integration.

### 1.4 Strictly Forbid Arbitrary `setTimeout` in Form Submissions & Async Redirections

- **FORBIDDEN**: Wrapping post-mutation navigation, state updates, or store resets in arbitrary delays (e.g., `setTimeout(() => { router.replace(...) }, 1000)`).
- **MANDATORY**: Execute routing, cache invalidation, and state transitions deterministically using async/await promises:
  ```tsx
  await mutation.mutateAsync(values);
  resetAllStores();
  router.replace(destination);
  router.refresh();
  ```
- Arbitrary timeouts degrade user-perceived performance, cause memory leaks on unmounted components, introduce race conditions, and break automated testing.

---

## 2. Page vs Dialog Invariant: The 4-5 Field Threshold

To maintain optimal UX, accessibility, and visual balance across desktop and mobile, strict constraints govern when to use a Modal/Dialog versus a dedicated Page:

### 2.1 Dialog / Modal: Strictly for Short Actions (<= 4 Fields)

Modals (`Dialog`, `Sheet`) are **strictly reserved** for quick, focused operations with **4 or fewer fields**:

- Confirmation prompts (0-1 fields).
- Quick status updates or toggle dialogs (1 field).
- Invite member dialog (Email, Role, optional Message = 3 fields).
- Change password dialog (Current password, New password, Confirm password = 3 fields).
- Single-attribute assigners (e.g. Assign subscription tier = 2 fields).

### 2.2 Dedicated Page: Mandatory for Forms with More than 4-5 Fields (> 4 Fields)

When any form or workflow for creating, updating, or configuring an entity has **more than 4-5 fields**, it **MUST NEVER** be placed in a modal dialog. It must be implemented as a dedicated full-screen page route:

- **Create Route**: `/w/[tenantSlug]/<resource>/new` or `/platform/<resource>/new`
- **Edit Route**: `/w/[tenantSlug]/<resource>/[id]/edit` or `/platform/<resource>/[id]`
- **Colocated Form Component**: `<Resource>FormPage` in `src/features/<resource>/components/<resource>-form-page.tsx`

### 2.3 Required Layout for Dedicated Form Pages

Every form page must feature:

1. **Header Navigation**:
   - Breadcrumbs or a Back Button (`<Button variant="ghost" asChild><Link href="..."><ArrowLeft /> Back to List</Link></Button>`).
   - Page Title (`text-2xl font-bold tracking-tight text-foreground`) and descriptive subtitle.
2. **Container & Layout**:
   - Max width constraint: `max-w-4xl mx-auto space-y-6`.
   - Card grouping: Group related inputs into semantic `Card` sections (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`).
3. **Responsive Grid**:
   - Inputs arranged in 2-column or 3-column responsive grids (`grid grid-cols-1 md:grid-cols-2 gap-4`).
4. **Action Footer**:
   - Clear Cancel button (navigating back to listing) and primary `SubmitButton` showing loading spinners during mutations.
