import { MfDemoShell } from "@/components/site/mf-demo-shell";

/**
 * The live shell and billing remote of /micro-frontends, talking over createBridge: the log shows each message, a
 * forged one dropped, and a request that times out when the remote hangs.
 */
export default function MfBridgeDemo() {
  return <MfDemoShell />;
}
