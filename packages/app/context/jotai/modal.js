import { atom, useSetAtom, useAtomValue } from 'jotai';
import { getPageData } from 'app/lib/util';

export const defaultModalState = {
    visible: false,
    loading: false,
    url: '',
    pageData: false,
    mode: 'url',
    content: null,
    title: null,
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
            mode: 'url',
            content: null,
            title: null,
        });

        try {
            const sResponse = await getPageData(url, false);
            set(modalAtom, {
                visible: true,
                loading: false,
                url,
                pageData: sResponse?.data || false,
                mode: 'url',
                content: null,
                title: null,
            });
        } catch (e) {
            set(modalAtom, defaultModalState);
        }
    }
);

export const openModalWithContentAtom = atom(
    null,
    (_get, set, payload) => {
        if (!payload?.content) return;
        set(modalAtom, {
            ...defaultModalState,
            visible: true,
            mode: 'content',
            content: payload.content,
            title: payload.title ?? null,
        });
    }
);

export const closeModalAtom = atom(
    null,
    (_get, set) => {
        set(modalAtom, defaultModalState);
    }
);


export const useModal = () => useAtomValue(modalAtom);
export const useOpenModalByUrl = () => useSetAtom(openModalByUrlAtom);
export const useOpenModalWithContent = () => useSetAtom(openModalWithContentAtom);
export const useCloseModal = () => useSetAtom(closeModalAtom);