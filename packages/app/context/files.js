import { create } from 'zustand';

export const useFilesDataStore = create((set) => ({
    filesData: null, 
    setFilesData: (value) => {
        set({ filesData: value });
    },
}));

export const useFilesData = () => {
    const filesData = useFilesDataStore((state) => state.filesData);
    const setFilesData = useFilesDataStore((state) => state.setFilesData);

    return { filesData, setFilesData };
};