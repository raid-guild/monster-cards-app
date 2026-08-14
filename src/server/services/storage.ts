import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/server/env";

let client: S3Client | undefined;

function storage() {
  const config = env();
  if (!config.BUCKET_ENDPOINT || !config.BUCKET_NAME || !config.BUCKET_ACCESS_KEY_ID || !config.BUCKET_SECRET_ACCESS_KEY) {
    throw new Error("Bucket storage is not configured.");
  }
  client ??= new S3Client({
    endpoint: config.BUCKET_ENDPOINT,
    region: config.BUCKET_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: config.BUCKET_ACCESS_KEY_ID, secretAccessKey: config.BUCKET_SECRET_ACCESS_KEY },
  });
  return { client, bucket: config.BUCKET_NAME };
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  const { client, bucket } = storage();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, ContentLength: body.byteLength }));
}

export async function getObject(key: string) {
  const { client, bucket } = storage();
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) throw new Error("Object body is empty.");
  return { bytes: Buffer.from(await response.Body.transformToByteArray()), contentType: response.ContentType };
}

export async function tryGetObject(key: string) {
  try { return await getObject(key); }
  catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

export function objectPrefix(tokenId: string, styleSlug: string, version: number, visualizationId: string) {
  return `monsters/chain-1/0xecb9b2ea457740fbde58c758e4c574834224413e/token-${tokenId}/${styleSlug}/v${version}/${visualizationId}`;
}
