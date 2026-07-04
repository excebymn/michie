import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type EventHandler<T> = (event: { payload: T }) => void;

function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}

export async function invoke<T>(cmd: string, payload?: unknown): Promise<T> {
  if (!isTauriRuntime()) {
    return Promise.resolve(undefined as T);
  }

  return await tauriInvoke<T>(cmd, payload as any);
}

export async function onEvent<T = unknown>(eventName: string, handler: EventHandler<T>) {
  if (!isTauriRuntime()) {
    return () => {};
  }

  const unlisten = await listen<T>(eventName, handler);
  return unlisten;
}
