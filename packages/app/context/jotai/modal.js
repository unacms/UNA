import { atom, useSetAtom, useAtomValue } from 'jotai';
import { getPageData } from 'app/lib/util';

export const defaultModalState = {
    visible: false,
    loading: false,
    url: '',
    pageData: false,
};

export const modalAtom = atom(defaultModalState);


export const openModalByUrlAtom = atom(
    null,
    async (_get, set, url) => {
        if (!url) return;

        set(modalAtom, {
            visible: true,
            loading: true,
            url,
            pageData: 'loading',
        });

        try {
            const sResponse = await getPageData(url, false);
            set(modalAtom, {
                visible: true,
                loading: false,
                url,
                pageData: sResponse?.data || false,
            });
        } catch (e) {
            set(modalAtom, defaultModalState);
        }
    }
);

export const closeModalAtom = atom(
    null,
    (_get, set) => {
        set(modalAtom, defaultModalState);
    }
);

// hooks (по аналогии с layout.js)
export const useModal = () => useAtomValue(modalAtom);
export const useOpenModalByUrl = () => useSetAtom(openModalByUrlAtom);
export const useCloseModal = () => useSetAtom(closeModalAtom);