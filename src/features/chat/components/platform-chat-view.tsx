"use client";

import { PageHeader } from "@/components/molecules/page-header";
import {
  hasPlatformPermission,
  PLATFORM_PERMISSION_KEYS,
  PlatformPermissionGate,
  usePlatformMe,
} from "@/features/platform";

import { ChatWorkspace } from "./chat-workspace";

interface PlatformChatViewProps {
  initialChannelId?: string | null;
}

export function PlatformChatView({ initialChannelId }: PlatformChatViewProps) {
  const { data: staff } = usePlatformMe();

  const canWrite = hasPlatformPermission(staff, PLATFORM_PERMISSION_KEYS.CHAT_WRITE);
  const canManage = hasPlatformPermission(staff, PLATFORM_PERMISSION_KEYS.CHAT_MANAGE);

  return (
    <PlatformPermissionGate permission={PLATFORM_PERMISSION_KEYS.CHAT_READ}>
      <div className="space-y-4">
        <PageHeader
          title="Operator Team Chat"
          description="Real-time internal channels and direct messages for platform staff."
        />

        <ChatWorkspace
          scope="platform"
          scopeId="platform"
          currentActorId={staff?.id}
          canWrite={canWrite}
          canManage={canManage}
          initialChannelId={initialChannelId}
        />
      </div>
    </PlatformPermissionGate>
  );
}
