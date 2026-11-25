"use client";

import { PageHeader } from "@/components/molecules/page-header";
import {
  hasTenantPermission,
  TENANT_PERMISSIONS,
  TenantPermissionGate,
  useActiveTenant,
  useTenantContext,
} from "@/features/tenants";

import { ChatWorkspace } from "./chat-workspace";

interface TenantChatViewProps {
  currentUserId: string;
  initialChannelId?: string | null;
}

export function TenantChatView({ currentUserId, initialChannelId }: TenantChatViewProps) {
  const { activeTenant } = useActiveTenant();
  const { data: context } = useTenantContext(activeTenant?.id);

  const canWrite = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.CHAT_WRITE);
  const canManage = hasTenantPermission(context?.permissions, TENANT_PERMISSIONS.CHAT_MANAGE);

  return (
    <TenantPermissionGate permission={TENANT_PERMISSIONS.CHAT_READ}>
      <div className="space-y-4">
        <PageHeader
          title="Team Chat"
          description={`Real-time channels and direct messages for ${activeTenant?.name ?? "your workspace"}.`}
        />

        {activeTenant?.id && (
          <ChatWorkspace
            scope="tenant"
            scopeId={activeTenant.id}
            currentActorId={currentUserId}
            canWrite={canWrite}
            canManage={canManage}
            initialChannelId={initialChannelId}
          />
        )}
      </div>
    </TenantPermissionGate>
  );
}
