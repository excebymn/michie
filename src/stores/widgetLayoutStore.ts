import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cek: sesuaikan import "zustand"/"zustand/middleware" ini dengan pola yang
// dipakai appearanceStore.ts kalau ternyata berbeda (misal versi zustand lama
// pakai `createStore` atau path middleware yang lain).

interface WidgetLayoutState {
  // slotId (mis. "left-1", "right-2") -> widgetId dari widgetRegistry, atau null kalau kosong
  slots: Record<string, string | null>;
  assignWidget: (slotId: string, widgetId: string) => void;
  clearSlot: (slotId: string) => void;
}

export const useWidgetLayoutStore = create<WidgetLayoutState>()(
  persist(
    (set) => ({
      slots: {},

      assignWidget: (slotId, widgetId) =>
        set((state) => ({
          slots: { ...state.slots, [slotId]: widgetId },
        })),

      clearSlot: (slotId) =>
        set((state) => ({
          slots: { ...state.slots, [slotId]: null },
        })),
    }),
    {
      name: "michie-widget-layout",
    },
  ),
);