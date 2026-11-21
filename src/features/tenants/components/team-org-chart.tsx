"use client";

import { useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  GitFork,
  Mail,
  RefreshCw,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { initials } from "@/lib/format";

import type { OrgChartNode } from "../import-export.types";
import { useTenantOrgChart } from "../queries";

interface OrgChartMemberCardProps {
  node: OrgChartNode;
  level?: number;
}

function OrgChartMemberCard({ node, level = 0 }: OrgChartMemberCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasReports = node.directReports && node.directReports.length > 0;

  return (
    <div className="flex flex-col items-start space-y-2">
      <div
        className={`bg-card text-card-foreground w-72 rounded-xl border p-3 shadow-2xs transition-all hover:shadow-xs ${
          level === 0 ? "border-primary/50 ring-primary/20 ring-1" : "border-border/60"
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <Avatar className="mt-0.5 size-9 border">
              {node.avatarUrl && <AvatarImage src={node.avatarUrl} alt={node.name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials(node.name || "Member")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <div className="text-foreground max-w-[150px] truncate text-xs font-semibold">
                {node.name}
              </div>
              <div className="text-muted-foreground flex max-w-[160px] items-center gap-1 truncate text-[11px]">
                <Briefcase className="size-2.5 shrink-0" />
                <span>{node.jobTitle || node.role}</span>
              </div>
              <div className="text-muted-foreground flex max-w-[160px] items-center gap-1 truncate text-[11px]">
                <Mail className="size-2.5 shrink-0" />
                <span>{node.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge
              variant={node.role === "OWNER" || node.role === "ADMIN" ? "default" : "secondary"}
              className="px-1.5 py-0 font-mono text-[9px] uppercase"
            >
              {node.role}
            </Badge>
            {node.department && (
              <Badge variant="outline" className="max-w-[80px] truncate px-1.5 py-0 text-[9px]">
                {node.department}
              </Badge>
            )}
          </div>
        </div>

        {hasReports && (
          <div className="border-border/40 text-muted-foreground mt-2.5 flex items-center justify-between border-t pt-2 text-xs">
            <span className="flex items-center gap-1 text-[11px]">
              <Users className="size-3" />
              {node.directReportsCount} direct report{node.directReportsCount === 1 ? "" : "s"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary h-6 px-1.5 text-[11px]"
            >
              {isExpanded ? (
                <>
                  Collapse <ChevronDown className="ml-0.5 size-3" />
                </>
              ) : (
                <>
                  Expand <ChevronRight className="ml-0.5 size-3" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {hasReports && isExpanded && (
        <div className="border-primary/20 mt-2 ml-4 space-y-3 border-l-2 pl-6">
          {node.directReports.map((child) => (
            <OrgChartMemberCard key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamOrgChart({ tenantId }: { tenantId?: string | null }) {
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const { data: chartData, isLoading, refetch } = useTenantOrgChart(tenantId);

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const roots = chartData?.roots ?? [];
  const departments = chartData?.departments ?? [];
  const filteredRoots =
    selectedDept === "ALL"
      ? roots
      : roots.filter(
          (r) =>
            r.department === selectedDept ||
            r.directReports.some((c) => c.department === selectedDept),
        );

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="flex flex-col justify-between gap-3 pb-4 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <GitFork className="text-primary size-4" /> Workspace Hierarchy & Reporting Tree
          </CardTitle>
          <CardDescription className="text-xs">
            Visual organizational structure mapped through team reporting lines and departments.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {departments.length > 0 && (
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-8 w-40 text-xs">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Departments
                </SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 text-xs">
            <RefreshCw className="mr-1 size-3" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-6">
        {filteredRoots.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-xs">
            No organizational hierarchy found. Assign manager relationships in the Member Drawer to
            visualize reporting lines.
          </div>
        ) : (
          <div className="flex min-w-max flex-wrap items-start gap-8 pt-2">
            {filteredRoots.map((root) => (
              <OrgChartMemberCard key={root.id} node={root} level={0} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
