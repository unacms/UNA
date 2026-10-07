import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useFormInstanceId } from 'app/context/form-instance';

const isNative = Platform.OS !== 'web';
const EMPTY_ORDER: string[] = [];

/** Focus callbacks kept outside store state (not serializable / no re-render needed). */
const focusFns = new Map<string, () => void>();

function fieldKey(instanceId: string | null | undefined, name: string) {
    return `${instanceId ?? ''}:${name}`;
}

type FormFocusChainStore = {
    /** Field order per form instance. */
    orders: Record<string, string[]>;
    register: (instanceId: string | null, name: string, focus: () => void) => void;
    unregister: (instanceId: string | null, name: string) => void;
    /** Focus the next registered field; false when there is none. */
    focusNext: (instanceId: string, name: string) => boolean;
    clear: (instanceId: string | null) => void;
};

export const useFormFocusChainStore = create<FormFocusChainStore>()((set, get) => ({
    orders: {},

    register: (instanceId, name, focus) => {
        if (!instanceId || !name || typeof focus !== 'function') return;
        focusFns.set(fieldKey(instanceId, name), focus);
        const order = get().orders[instanceId] ?? EMPTY_ORDER;
        if (order.includes(name)) return;
        set({
            orders: {
                ...get().orders,
                [instanceId]: [...order, name],
            },
        });
    },

    unregister: (instanceId, name) => {
        if (!instanceId || !name) return;
        focusFns.delete(fieldKey(instanceId, name));
        const order = get().orders[instanceId];
        if (!order?.includes(name)) return;
        const next = order.filter((n) => n !== name);
        const orders = { ...get().orders };
        if (next.length === 0) delete orders[instanceId];
        else orders[instanceId] = next;
        set({ orders });
    },

    focusNext: (instanceId, name) => {
        const order = get().orders[instanceId] ?? EMPTY_ORDER;
        const index = order.indexOf(name);
        if (index < 0) return false;
        for (let i = index + 1; i < order.length; i++) {
            const focus = focusFns.get(fieldKey(instanceId, order[i]!));
            if (focus) {
                focus();
                return true;
            }
        }
        return false;
    },

    clear: (instanceId) => {
        if (!instanceId) return;
        const order = get().orders[instanceId];
        if (order) {
            order.forEach((name) => focusFns.delete(fieldKey(instanceId, name)));
            const orders = { ...get().orders };
            delete orders[instanceId];
            set({ orders });
        }
    },
}));

/** Next focuses next field, Done submits. No-op on web. */
export function useNativeReturnKeyNav(name: string | undefined, handleSubmit?: () => void) {
    const inputRef = useRef<{ focus?: () => void } | null>(null);
    const instanceId = useFormInstanceId();
    const order = useFormFocusChainStore((s) =>
        instanceId ? (s.orders[instanceId] ?? EMPTY_ORDER) : EMPTY_ORDER
    );
    const register = useFormFocusChainStore((s) => s.register);
    const unregister = useFormFocusChainStore((s) => s.unregister);
    const focusNext = useFormFocusChainStore((s) => s.focusNext);

    useEffect(() => {
        if (!isNative || !instanceId || !name) return;
        register(instanceId, name, () => inputRef.current?.focus?.());
        return () => unregister(instanceId, name);
    }, [instanceId, name, register, unregister]);

    if (!isNative || !name || !instanceId) {
        return { inputRef, returnKeyProps: {} };
    }

    const index = order.indexOf(name);
    const last = index < 0 || index === order.length - 1;

    return {
        inputRef,
        returnKeyProps: {
            returnKeyType: last ? 'done' : 'next',
            blurOnSubmit: last,
            onSubmitEditing: () => {
                if (last) {
                    Keyboard.dismiss();
                    handleSubmit?.();
                    return;
                }
                focusNext(instanceId, name);
            },
        },
    };
}
