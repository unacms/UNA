import { create } from 'zustand';

export const useFilesDataStore = create((set, get) => ({
    filesData: null,
    setFilesData: (value) => {
        set({ filesData: value });
    },
    // Survives ImagePicker / Modal remounts (composer attachments).
    fieldImages: {},
    setFieldImages: (key, images) => {
        if (!key) return;
        set({ fieldImages: { ...get().fieldImages, [key]: images } });
    },
    clearFieldImages: (key) => {
        if (!key) return;
        const next = { ...get().fieldImages };
        if (key.endsWith(':')) {
            Object.keys(next).forEach((k) => {
                if (k.startsWith(key)) delete next[k];
            });
        } else {
            delete next[key];
        }
        set({ fieldImages: next });
    },
}));

export const useFilesData = () => {
    const filesData = useFilesDataStore((state) => state.filesData);
    const setFilesData = useFilesDataStore((state) => state.setFilesData);

    return { filesData, setFilesData };
};