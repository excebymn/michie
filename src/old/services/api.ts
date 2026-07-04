import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type EventHandler<T> = (event: { payload: T }) => void;

export async function invoke<T>(cmd: string, payload?: unknown): Promise<T> {
  return await tauriInvoke<T>(cmd, payload as any);
}

export async function onEvent<T = unknown>(eventName: string, handler: EventHandler<T>) {
  const unlisten = await listen<T>(eventName, handler);
  return unlisten;
}
