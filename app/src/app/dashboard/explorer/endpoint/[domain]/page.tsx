"use client";

import { use } from "react";
import { EndpointDetailContent } from "@/components/explorer/endpoint-detail-content";

export default function DashboardEndpointDetailPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = use(params);
  return <EndpointDetailContent domain={domain} basePath="/dashboard/explorer" />;
}
