'use client'

import Form from 'app/components/form'
import { BlockWrapper } from 'app/components/block-wrapper'

/**
 * Manual Order form (UNA payment_order_add).
 * Uses the shared Form + bx_payment custom form for module→items loading.
 */
export default function PaymentOrderAdd(props) {
    const { classContainerName, blockWrapperProps, ...rest } = props

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Form {...rest} name={rest.name || 'bx_payment'} />
        </BlockWrapper>
    )
}
