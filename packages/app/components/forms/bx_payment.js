'use client'

import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { View } from 'app/design/view'
import { getFormFieldByData, getHiddenFields } from 'app/lib/form-helpers'
import { appSetting } from 'app/lib/util'
import PaymentItems from 'app/components/form-fields/payment_items'

/**
 * Syncs initial_members `client` selection into hidden `client_id`
 * (UNA classic JS: oPaymentOrders.showPopup).
 */
function ClientIdSync() {
    const formContext = useFormContext()
    const client = useWatch({ control: formContext.control, name: 'client' })

    useEffect(() => {
        if (client == null || client === '') {
            formContext.setValue('client_id', '')
            return
        }
        const id = Array.isArray(client) ? client[0] : client
        if (id != null && id !== '') {
            formContext.setValue('client_id', String(id))
        }
    }, [client, formContext])

    return null
}

export default function FormBxPayment(props) {
    const { data, handleSubmit, name } = props
    const inputs = data?.inputs
    if (!inputs) return null

    const useCaptionAsPlaceholder = appSetting('forms', 'without_captions').includes(name)
    const visibleKeys = Object.keys(inputs).filter(
        (key) => inputs[key] && inputs[key].type !== 'hidden'
    )
    const lastKey = visibleKeys[visibleKeys.length - 1]
    const moduleRequestUrl = inputs.module_id?.request_url

    return (
        <View className={appSetting('forms', 'form_container')}>
            <ClientIdSync />
            {getHiddenFields(inputs, handleSubmit)}
            <View className="w-full gap-4">
                {visibleKeys.map((key) => {
                    const field = inputs[key]
                    const fieldProps = {
                        form_name: name,
                        noPadding: key === lastKey,
                        use_caption_as_placeholder: useCaptionAsPlaceholder,
                    }

                    // Replace empty UNA custom HTML with interactive items picker
                    if (key === 'items' || field?.name === 'items') {
                        return (
                            <PaymentItems
                                key="payment-items"
                                {...field}
                                {...fieldProps}
                                module_request_url={moduleRequestUrl}
                                request_url={moduleRequestUrl}
                            />
                        )
                    }

                    // Skip cancel (modal close handles it); keep submit via input_set
                    if (field?.type === 'input_set' && field?.[1]?.name === 'do_cancel') {
                        const submitOnly = { ...field, 1: undefined }
                        return getFormFieldByData(
                            submitOnly,
                            handleSubmit,
                            'default',
                            fieldProps,
                            key
                        )
                    }

                    return getFormFieldByData(
                        field,
                        handleSubmit,
                        'default',
                        fieldProps,
                        key
                    )
                })}
            </View>
        </View>
    )
}
