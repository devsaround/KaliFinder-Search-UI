import { create } from 'zustand';
import type { IsOpenState } from '../types';

export const useIsOpen = create<IsOpenState>((set) => ({
  isOpen: false,
  toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
