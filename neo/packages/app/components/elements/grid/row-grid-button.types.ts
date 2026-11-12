/** A row action of a UNA grid, as the grid endpoint sends it. */
export type GridRowAction = {
    name: string;
    title?: string;
    icon?: string;
    /** link opens `url`; modal and object open the action's form; menu loads a menu; callback runs the action. */
    type?: 'link' | 'modal' | 'object' | 'menu' | 'callback' | string;
    url?: string;
    object?: unknown;
    params?: unknown;
    [key: string]: unknown;
};

export type GridRowId = string | number;

export type RowGridButtonProps = {
    id: GridRowId;
    itemAction: GridRowAction;
};

export type RowActionsOverflowProps = {
    id: GridRowId;
    actions: GridRowAction[];
};
