// backend/src/types/pack-size-metadata.ts
export type PackSizeMetadata = {
  is_pack_sale?: boolean;
  unit_price?: number;
  pack_chart?: number[]; // e.g. [1,2,1]
  size_chart?: string[]; // e.g. ["S","M","L"]
};
