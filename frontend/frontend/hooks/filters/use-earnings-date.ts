import { create } from "zustand";

type StateProps = {
	earningDate: Date;
	updateEarningDate: (value: Date) => void;
};

export const useEarningsDate = create<StateProps>((set) => ({
	earningDate: new Date(),
	updateEarningDate: (value) => set({ earningDate: value }),
}));
