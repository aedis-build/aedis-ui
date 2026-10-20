import { securityHeaders, type SecurityHeadersOptions } from "@/lib/security-headers";
import { allowedOrigins } from "@/lib/untrusted";

/**
 * Headers for the embedded app: only the host origins from configuration may frame it (frame-ancestors), never a
 * wildcard. With no valid host origin nobody may frame it.
 */
export function embeddedAppHeaders({ hostOrigins, ...options }: Omit<SecurityHeadersOptions, "frameAncestors"> & { hostOrigins: string[] }) {
  return securityHeaders({ ...options, frameAncestors: allowedOrigins(hostOrigins) });
}

/** Headers for the host: it may frame only the embedded apps from configuration (frame-src), never a wildcard. */
export function hostAppHeaders({ frameOrigins, ...options }: Omit<SecurityHeadersOptions, "frameSrc"> & { frameOrigins: string[] }) {
  return securityHeaders({ ...options, frameSrc: allowedOrigins(frameOrigins) });
}
