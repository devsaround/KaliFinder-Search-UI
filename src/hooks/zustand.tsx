import { create } from "zustand";

export const useIsOpen = create((set) => ({
  isOpen: false,
  // toggleIsOpen: () => set((state: any) => ({ isOpen: !state.isOpen })),
  toggleIsOpen: () => set((state: any) => ({ isOpen: !state.isOpen })),
}));
