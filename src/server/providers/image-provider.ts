import fs from "node:fs/promises";
import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { env } from "@/server/env";

export type GenerateIllustrationInput = {
  prompt: string;
  model: string;
  referencePaths: string[];
  config: { size?: string; quality?: string; output_format?: string; output_compression?: number };
};

export type GeneratedIllustration = { bytes: Buffer; mimeType: string; providerRequestId?: string };

export interface ImageProvider { generate(input: GenerateIllustrationInput): Promise<GeneratedIllustration>; }

class OpenAIImageProvider implements ImageProvider {
  private client = new OpenAI({ apiKey: env().OPENAI_API_KEY });

  async generate(input: GenerateIllustrationInput): Promise<GeneratedIllustration> {
    const references = await Promise.all(input.referencePaths.map(async (filePath) => {
      const bytes = await fs.readFile(path.resolve(filePath));
      return toFile(bytes, path.basename(filePath), { type: filePath.endsWith(".png") ? "image/png" : "image/jpeg" });
    }));
    const response = await this.client.images.edit({
      model: input.model,
      image: references,
      prompt: input.prompt,
      size: (input.config.size ?? "1536x1024") as "1536x1024",
      quality: (input.config.quality ?? "medium") as "medium",
      output_format: (input.config.output_format ?? "webp") as "webp",
      output_compression: input.config.output_compression ?? 90,
      n: 1,
    });
    const encoded = response.data?.[0]?.b64_json;
    if (!encoded) throw new Error("Image provider returned no image data.");
    return { bytes: Buffer.from(encoded, "base64"), mimeType: "image/webp" };
  }
}

class FakeImageProvider implements ImageProvider {
  async generate(): Promise<GeneratedIllustration> {
    const source = path.resolve("public/reference/monster-card-2.jpg");
    const bytes = await sharp(source)
      .extract({ left: 75, top: 218, width: 706, height: 500 })
      .resize(1536, 1024, { fit: "cover" })
      .webp({ quality: 90 })
      .toBuffer();
    return { bytes, mimeType: "image/webp", providerRequestId: "fake-provider" };
  }
}

export function imageProvider(): ImageProvider {
  if (env().IMAGE_PROVIDER === "openai") {
    if (!env().OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for the OpenAI provider.");
    return new OpenAIImageProvider();
  }
  return new FakeImageProvider();
}
