import { convertFileSrc } from '@tauri-apps/api/core';

export const toAssetUrl = (path: string | undefined | null): string | null => {
  if (!path) return null;
  try {
    return convertFileSrc(path);
  } catch {
    return null;
  }
};