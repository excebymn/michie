import { invoke } from "./api";

export const integrationsService = {
  getDiscordRpEnabled: async () =>
    await invoke<boolean>("get_discord_rp_enabled"),
  setDiscordRpEnabled: async (enabled: boolean) =>
    await invoke<void>("set_discord_rp_enabled", { enabled }),
};