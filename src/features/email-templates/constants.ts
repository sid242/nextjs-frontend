export interface MergeVariable {
  key: string;
  label: string;
  sample: string;
  category: "Customer" | "Project" | "Sales" | "Organization";
}

export const STANDARD_VARIABLES: MergeVariable[] = [
  { key: "customer_name", label: "Customer Name", sample: "John Doe", category: "Customer" },
  {
    key: "customer_email",
    label: "Customer Email",
    sample: "john@example.com",
    category: "Customer",
  },
  {
    key: "customer_phone",
    label: "Customer Phone",
    sample: "+91 9876543210",
    category: "Customer",
  },
  { key: "project_name", label: "Project Name", sample: "Savitara Heights", category: "Project" },
  {
    key: "project_location",
    label: "Project Location",
    sample: "Bandra West, Mumbai",
    category: "Project",
  },
  {
    key: "property_type",
    label: "Property Type",
    sample: "3 BHK Luxury Apartment",
    category: "Project",
  },
  {
    key: "possession_date",
    label: "Possession Date",
    sample: "December 2027",
    category: "Project",
  },
  { key: "unit_number", label: "Unit Number", sample: "A-1402", category: "Project" },
  {
    key: "sales_member_name",
    label: "Sales Exec Name",
    sample: "Siddharth Prajapati",
    category: "Sales",
  },
  {
    key: "sales_member_email",
    label: "Sales Exec Email",
    sample: "siddharth@savitara.com",
    category: "Sales",
  },
  {
    key: "sales_member_phone",
    label: "Sales Exec Phone",
    sample: "+91 9820000000",
    category: "Sales",
  },
  {
    key: "org_name",
    label: "Company / Org Name",
    sample: "Savitara Realty",
    category: "Organization",
  },
  {
    key: "org_email",
    label: "Support Email",
    sample: "info@savitara.com",
    category: "Organization",
  },
  { key: "org_phone", label: "Office Phone", sample: "+91 22 26000000", category: "Organization" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  MARKETING: "Marketing",
  TRANSACTIONAL: "Transactional",
  NOTIFICATION: "Notification",
  CUSTOM: "Custom",
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PUBLISHED: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  DRAFT: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
  },
  ARCHIVED: {
    bg: "bg-neutral-500/10 dark:bg-neutral-500/20",
    text: "text-neutral-700 dark:text-neutral-400",
    border: "border-neutral-500/20",
  },
};
