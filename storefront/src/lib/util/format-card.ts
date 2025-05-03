// utils/format-card.ts
export const digitsOnly = (s: string) => s.replace(/\D+/g, "")
export const fourSplit = (s: string) =>
  digitsOnly(s)
    .match(/.{1,4}/g)
    ?.join(" ") ?? ""
