import type { ReactNode } from 'react';
import { NeoButtonGroup } from 'app/design/controls/neo-button/neo-button-group';
import { toControlSize } from 'app/design/controls/neo-button/control-scale';

type ButtonsGroupProps = {
    /** Legacy size (`xs`/`sm`/`base`/`lg`/`xl`) or Neo controlSize, for the group rounding. */
    size?: string
    children?: ReactNode
    [key: string]: unknown
}

/**
 * @deprecated use `NeoButtonGroup` with `ButtonMenuGroupItem` segments.
 * Kept as a thin alias over NeoButtonGroup until the legacy cleanup.
 */
export function ButtonsGroup({
    size = 'base',
    children
}: ButtonsGroupProps) {
    return (
        <NeoButtonGroup controlSize={toControlSize(size) ?? 'regular'}>
            {children}
        </NeoButtonGroup>
    )
}
