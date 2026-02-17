import { create } from 'zustand';

export const useActionsDataStore = create((set) => ({
    actionsData: null, // Initial state
    setActionsData: (data) => set({ actionsData: data }),
}));

export const useActionsData = () => {
    const actionsData = useActionsDataStore((state) => state.actionsData);
    const setActionsData = useActionsDataStore((state) => state.setActionsData);

    return { actionsData, setActionsData };
};