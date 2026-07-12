import { create } from 'zustand';

interface LprState {
  isOpen: boolean;
  openLpr: () => void;
  closeLpr: () => void;
}

export const useLprStore = create<LprState>((set) => ({
  isOpen: false,
  openLpr: () => set({ isOpen: true }),
  closeLpr: () => set({ isOpen: false }),
}));
