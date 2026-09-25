import { atom, useSetAtom, useAtomValue } from 'jotai';
import { getPageData } from 'app/lib/util';

import type { ReactNode } from 'react';

export type ModalState = {
    visible: boolean;
    loading: boolean;
    /** Page URL for `mode: 'url'`. */
    url: string;
    /** Web address-bar URL while the modal is open; empty → `url`. */
    historyUrl: string;
    /** Loaded page data; `'loading'` while fetching, `false` when none. */
    pageData: any;
    mode: 'url' | 'content';
    /** Rendered body for `mode: 'content'`. */
    content: ReactNode;
    title: ReactNode;
};

export const defaultModalState: ModalState = {
    visible: false,
    loading: false,
    url: '',
    historyUrl: '',
    pageData: false,
    mode: 'url',
    content: null,
    title: null,
};

export const modalAtom = atom<ModalState>(defaultModalState);


export const openModalByUrlAtom = atom(
    null,
    async (_get, set, url: string | undefined, historyUrl: string = '') => {
        if (!url) return;

        set(modalAtom, {
            visible: true,
            loading: true,
            url,
            historyUrl,
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
                historyUrl,
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
    (_get, set, payload: { content: ReactNode; title?: ReactNode }) => {
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