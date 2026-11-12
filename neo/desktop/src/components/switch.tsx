type Props = {
    id: string;
    checked: boolean;
    onChange: (on: boolean) => void;
    /** Off and out of the tab order: nothing to explain (outside the app, its note says why). */
    disabled?: boolean;
    /**
     * Ignores presses but keeps focus and says why (aria-disabled): a change on its way (busy),
     * or a switch another one turns off (its reason is in `describedBy`).
     */
    inactive?: boolean;
    busy?: boolean;
    describedBy?: string;
};

/**
 * An on/off setting (spec 3.6): a button with role="switch" and aria-checked, so Space and Enter
 * toggle it; its name comes from a <label for>. The thumb's place is the cue that is not colour.
 */
export function Switch({ id, checked, onChange, disabled, inactive, busy, describedBy }: Props) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            className="switch"
            aria-checked={checked}
            disabled={disabled}
            aria-disabled={inactive || busy || undefined}
            aria-busy={busy || undefined}
            aria-describedby={describedBy}
            onClick={() => {
                if (!inactive && !busy) onChange(!checked);
            }}
        >
            <span className="switch-thumb" aria-hidden="true" />
        </button>
    );
}
