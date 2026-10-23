import { createHash } from "node:crypto";

import { REPOSITORY } from "./config";

export const ISSUER = "https://token.actions.githubusercontent.com";
export const WORKFLOW = ".github/workflows/release.yml";
/** The platform's reusable release workflow: it builds and attests a registry in a job isolated from the repository (SLSA Build L3). */
export const PLATFORM_BUILDER = "aedis-build/aedis-platform/.github/workflows/release-registry-js.yml";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/** sigstore's verify(): checks the signature, the certificate chain, the transparency log and the signer identity. */
export type SignatureCheck = (bundle: unknown, options: { certificateIdentityURI: string; certificateIssuer: string }) => Promise<unknown>;

type Statement = {
  _type?: string;
  subject?: { name?: string; digest?: { sha256?: string } }[];
  predicateType?: string;
  predicate?: { buildDefinition?: { externalParameters?: { workflow?: { ref?: string; repository?: string; path?: string } } } };
};

export class ProvenanceError extends Error {
  constructor(message: string) {
    super(`provenance: ${message}`);
    this.name = "ProvenanceError";
  }
}

/**
 * Verifies a registry release before anything from it is written: the Sigstore bundle must be signed by the
 * repository's release workflow for exactly this tag, or by the platform's reusable release workflow that it called,
 * and its SLSA provenance must name this archive (by sha256), that repository, that release workflow and this tag.
 * Any mismatch throws. Aedis UI and third-party registries get the same checks; only the repository differs.
 */
export async function verifyRelease({ archive, bundle, release, assetName, check, repository = REPOSITORY }: { archive: Uint8Array; bundle: unknown; release: string; assetName: string; check: SignatureCheck; repository?: string }) {
  if (!bundle || typeof bundle !== "object") throw new ProvenanceError("missing attestation bundle");
  const own = `https://github.com/${repository}/${WORKFLOW}@refs/tags/${release}`;
  // sigstore matches the identity as a regular expression against the certificate's subject. The signer is the
  // repository's own release workflow at this tag, or the platform builder at whatever commit the caller pinned;
  // the provenance below still has to name that repository's release workflow and this tag as the caller.
  const identity = `^(?:${escape(own)}|${escape(`https://github.com/${PLATFORM_BUILDER}@`)}[^@]+)$`;
  try {
    await check(bundle, { certificateIdentityURI: identity, certificateIssuer: ISSUER });
  } catch (error) {
    throw new ProvenanceError(`signature does not verify for ${own} or the platform builder: ${(error as Error).message}`);
  }

  const envelope = (bundle as { dsseEnvelope?: { payload?: string; payloadType?: string } }).dsseEnvelope;
  if (!envelope?.payload || envelope.payloadType !== "application/vnd.in-toto+json") throw new ProvenanceError("bundle carries no in-toto statement");
  let statement: Statement;
  try {
    statement = JSON.parse(Buffer.from(envelope.payload, "base64").toString("utf8")) as Statement;
  } catch {
    throw new ProvenanceError("statement is not JSON");
  }
  if (statement._type !== "https://in-toto.io/Statement/v1") throw new ProvenanceError("unexpected statement type");
  if (statement.predicateType !== "https://slsa.dev/provenance/v1") throw new ProvenanceError("not SLSA provenance");

  const digest = createHash("sha256").update(archive).digest("hex");
  const subject = statement.subject?.find((s) => s.name === assetName);
  if (!subject) throw new ProvenanceError(`statement does not name ${assetName}`);
  if (subject.digest?.sha256 !== digest) throw new ProvenanceError(`${assetName} does not match its attestation (tampered or replaced)`);

  const workflow = statement.predicate?.buildDefinition?.externalParameters?.workflow;
  if (workflow?.repository !== `https://github.com/${repository}`) throw new ProvenanceError(`built from ${workflow?.repository ?? "an unknown repository"}`);
  if (workflow.path !== WORKFLOW) throw new ProvenanceError(`built by ${workflow.path ?? "an unknown workflow"}, not ${WORKFLOW}`);
  if (workflow.ref !== `refs/tags/${release}`) throw new ProvenanceError(`built from ${workflow.ref ?? "an unknown ref"}, not ${release}`);
  return { digest };
}
