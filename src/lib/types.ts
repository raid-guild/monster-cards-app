export type MonsterTraits = {
  tokenId: string;
  sheetName: string;
  monsterName: string;
  size: string;
  alignment: string;
  actions: string[];
  specialAbility: string;
  weakness: string;
  locomotion: string;
  languages: string[];
  rawLines: string[];
};

export type GenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed_retryable"
  | "failed_terminal"
  | "cancelled";

export type GenerationCheckpoint =
  | "verifying_ownership"
  | "reading_traits"
  | "generating_illustration"
  | "assembling_card"
  | "uploading_assets"
  | "publishing";

export type PublicJob = {
  id: string;
  status: GenerationStatus;
  checkpoint: GenerationCheckpoint | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  queuedAt: string;
  updatedAt: string;
};

export type PublicVisualization = {
  id: string;
  tokenId: string;
  styleSlug: string;
  styleLabel: string;
  styleVersion: number;
  model: string;
  cardUrl: string;
  thumbnailUrl: string;
  downloadUrl: string;
  createdAt: string;
  requester: string;
};

export type MonsterRecord = MonsterTraits & {
  originalImageUrl: string;
  visualization: PublicVisualization | null;
  job: PublicJob | null;
};

export type ApiEnvelope<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string; requestId: string } };
