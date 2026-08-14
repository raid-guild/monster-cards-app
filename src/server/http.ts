import { NextResponse } from "next/server";
import type { ApiEnvelope } from "@/lib/types";
import { safeRequestId } from "@/lib/utils";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiEnvelope<T>>({ data, error: null }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiEnvelope<never>>(
    { data: null, error: { code, message, requestId: safeRequestId() } },
    { status },
  );
}
