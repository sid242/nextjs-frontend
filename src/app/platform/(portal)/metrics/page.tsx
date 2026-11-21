import { PlatformMetricsDashboard } from "@/features/analytics";

export const metadata = {
  title: "Platform Executive Metrics",
  description: "Global KPIs, plan distributions, storage aggregates, and system growth trends.",
};

export default function PlatformMetricsPage() {
  return (
    <div className="space-y-6">
      <PlatformMetricsDashboard />
    </div>
  );
}
