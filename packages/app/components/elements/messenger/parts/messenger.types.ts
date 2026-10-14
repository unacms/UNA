import type { ReactElement } from 'react';

/** UNA API payloads are loosely shaped; known fields are listed, the rest stays open. */
type Loose = Record<string, any>;

/** Profile data (`BxDolProfile::getData`): author, participant. */
export type ProfileData = Loose & {
    id?: number | string;
    display_name?: string;
    url?: string;
    url_avatar?: string;
    /** With `with_online`: 1 when online. */
    online?: number;
};

/** Short menu (`getShortCodeAPI`): items are requested with `system/get_menu`. */
export type ShortMenu = Loose & {
    object?: string;
    title?: string;
    params?: Loose;
};

/** UNA menu item (`getCodeAPI`). */
export type ApiMenuItem = Loose & {
    id?: number | string;
    name: string;
    title?: string;
    icon?: string;
    /** Toggles (mute, star): current state. */
    value?: number | string;
};

export type ApiMenu = Loose & {
    object?: string;
    items?: ApiMenuItem[];
};

/** One conversation of the list (`_unitLot`). */
export type Convo = Loose & {
    /** Hash, used in URLs and socket channels. */
    id: string;
    /** Numeric lot id, used by the services. */
    id2: number | string;
    title?: string;
    message?: string;
    date?: number;
    unread?: number;
    starred?: number;
    participants: ProfileData[];
    author_data?: ProfileData;
    menu?: ShortMenu;
};

/** One message (`serviceGetConvoMessages`). */
export type Jot = Loose & {
    id: number | string;
    message?: string;
    created?: number;
    lot_id?: number | string;
    lot_hash?: string;
    reply?: number | string;
    reply_message?: string;
    saved?: number;
    files?: Loose[];
    menu?: ApiMenu;
    reactions?: Loose;
    author_data?: ProfileData;
};

/** Unread on opening a talk: the 'new messages' line. */
export type UnreadInfo = {
    count: number;
    /** Id of the first unread message. */
    firstId: number;
};

/** Messages of the open talk. */
export type JotsState = {
    data: {
        params?: Loose;
        jots: Jot[];
    };
    index?: number;
    unread?: UnreadInfo;
};

/** A conversation action NEO handles (gear menu). */
export type ConvoAction = {
    id: string;
    title: string;
    icon: string;
    iconOn?: string;
    value?: boolean;
};

/** Inbox / direct / ... tab of the conversations list. */
export type MessengerMenuItem = Loose & { name: string; title: string };

export type AddButtons = ReactElement[] | ReactElement | null | undefined;
