import { useCallback, useState } from 'react'
import { ButtonMenuActionDefault, ButtonMenuActionText, Modal, NeoButton } from 'app/design/controls'
import { View } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher'
import { BlockByDataInt as BlockByData } from 'app/components/block'
import { getComponent } from 'app/components/registry'
import emitter from 'app/context/emitter'

async function openModalFromRequest(oProps, setFormBlock) {
    const requestUrl = oProps?.data?.request_url
    if (!requestUrl) return

    const response = await fetcher('/api.php?r=' + requestUrl)
    setFormBlock({
        content: response?.data,
        designbox_id: 0,
        title: oProps.title,
    })
}

export default function MenuItemModal(oProps) {
    const DropdownMenuItem = getComponent('menu-item', 'dropdown')
    const [formBlock, setFormBlock] = useState(null)

    const bShowActionAsButton = oProps.params?.show_action_as_button == undefined
        || oProps.params.show_action_as_button === true
    const bShowVertical = oProps?.params?.showVertical === true
    const ButtonAction = bShowActionAsButton ? ButtonMenuActionDefault : ButtonMenuActionText

    const sButtonIcon = oProps.icon || ''
    const isPrimary = oProps.primary === true || oProps.primary === 1 || oProps.primary === '1'
    const neoButtonStyle = isPrimary
        ? (oProps.params?.button_primary_style || oProps.params?.button_style)
        : oProps.params?.button_style

    const handlePress = () => {
        void openModalFromRequest(oProps, setFormBlock)
    }

    const handleClose = useCallback(() => {
        setFormBlock(null)
    }, [])

    // After form submit success: close modal and reload wiki page.
    // Emit is a no-op when no wiki listener is mounted.
    const handleFormEmpty = useCallback(() => {
        setFormBlock(null)
        emitter.emit('wiki', { action: 'reload' })
    }, [])

    const formModal = formBlock ? (
        <Modal
            title={formBlock.title || ' '}
            onVisible={!!formBlock}
            onClose={handleClose}
            scrollable
            transparent
        >
            <View className="px-3 sm:px-4">
                <BlockByData
                    block={formBlock}
                    onFormEmpty={handleFormEmpty}
                    exProps={{
                        onClose: handleClose,
                        resetOnSubmit: true,
                        formOnly: true,
                    }}
                />
            </View>
        </Modal>
    ) : null

    if (oProps.mode === 'dropdown-menu') {
        return (
            <>
                {formModal}
                <DropdownMenuItem
                    item={{ title: oProps.title, icon: sButtonIcon }}
                    handleSelect={handlePress}
                />
            </>
        )
    }

    const buttonAction = oProps.params?.button_style ? (
        <NeoButton
            label={oProps.title}
            image={sButtonIcon}
            style={neoButtonStyle}
            controlSize={oProps.params?.button_size}
            borderShape={oProps.params?.button_border_shape}
            width={oProps.params?.button_full_width ? 'fill' : 'auto'}
            contentInsets={oProps.params?.button_content_insets}
            onPress={handlePress}
        />
    ) : (
        <ButtonAction
            onPress={handlePress}
            title={oProps.title}
            startDecorator={sButtonIcon}
            variant={isPrimary ? 'primary' : oProps.params?.button_variant}
            size={oProps.params?.button_size}
            rounded={oProps.params?.button_rounded}
            fullWidth={oProps.params?.button_full_width}
        />
    )

    return (
        <View className={'menu-item flex-auto ' + (bShowVertical ? ' w-full' : ' flex-row items-center justify-center')}>
            {formModal}
            {buttonAction}
        </View>
    )
}
