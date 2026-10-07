import { create } from 'zustand';

type ActionsDataStore = {
    actionsData: any;
    setActionsData: (data: any) => void;
};

export const useActionsDataStore = create<ActionsDataStore>()((set) => ({
    actionsData: null, // Initial state
    setActionsData: (data) => set({ actionsData: data }),
}));

export const useActionsData = () => {
    const actionsData = useActionsDataStore((state) => state.actionsData);
    const setActionsData = useActionsDataStore((state) => state.setActionsData);

    return { actionsData, setActionsData };
};