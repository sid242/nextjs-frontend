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

export const DEFAULT_STARTER_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
  <!-- Header -->
  <div style="background-color: #0f172a; padding: 24px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">{{org_name}}</h1>
    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;">Exclusive Property Update</p>
  </div>

  <!-- Body -->
  <div style="padding: 24px;">
    <h2 style="color: #1e293b; font-size: 18px; margin-top: 0;">Hello {{customer_name}},</h2>
    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Thank you for your interest in <strong>{{project_name}}</strong> located at {{project_location}}.
    </p>

    <!-- Key Info Box -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #0f172a; font-size: 14px; margin-top: 0; margin-bottom: 12px; font-weight: bold;">Property Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
        <tr>
          <td style="padding: 6px 0; font-weight: bold; width: 40%;">Property Type:</td>
          <td style="padding: 6px 0;">{{property_type}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Possession:</td>
          <td style="padding: 6px 0;">{{possession_date}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: bold;">Unit Assigned:</td>
          <td style="padding: 6px 0;">{{unit_number}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #475569; font-size: 14px; line-height: 1.6;">
      Your dedicated property advisor is <strong>{{sales_member_name}}</strong>. Feel free to contact at {{sales_member_phone}} or {{sales_member_email}}.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 28px 0;">
      <a href="https://savitara.com" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 14px;">
        View Brochure & Floor Plans
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
    <p style="margin: 0;">{{org_name}} • Phone: {{org_phone}} • Email: {{org_email}}</p>
    <p style="margin: 4px 0 0 0;">This email was sent to {{customer_email}}.</p>
  </div>
</div>`;
