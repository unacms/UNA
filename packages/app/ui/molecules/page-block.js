import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'

const blockTheme = appSetting('theme', 'blocks')

function createBlockComponent({
    baseClass,
    Component = View,
    role,
    isBg,
    isPad,
    ariaLevel,
    animate = false,
}) {
    return function BlockSubComponent({
        className = '',
        density,
        isBg,
        isPad,
        ...props
    }) {
        return (
            <Component
                className={`
                    ${baseClass} 
                    ${isBg && baseClass == 'u-block-base' ? blockTheme['u-block-bg'] : ''} 
                    ${isPad ? blockTheme['u-block-pad'] : ''} 
                    ${animate ? 'animate-in fade-in duration-500' : ''}
                    ${blockTheme[baseClass]} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        )
    }
}

const Block = createBlockComponent({
    baseClass: 'u-block-base',
    isBg: true,
    isPad: true,
    animate: true,
})
const BlockHeader = createBlockComponent({ baseClass: 'u-block-header' })
const BlockIcon = createBlockComponent({ baseClass: 'u-block-icon' })
const BlockName = createBlockComponent({ baseClass: 'u-block-name' })
const BlockTitle = createBlockComponent({
    baseClass: 'u-block-title',
    Component: Text,
    role: 'heading',
    ariaLevel: 3,
})

const BlockDescription = createBlockComponent({
    baseClass: 'u-block-description',
    Component: Text,
})

const BlockActions = createBlockComponent({ baseClass: 'u-block-actions' })

const BlockContent = createBlockComponent({ baseClass: 'u-block-content' })
const BlockList = createBlockComponent({ baseClass: 'u-block-list' })

const BlockFooter = createBlockComponent({ baseClass: 'u-block-footer' })

export {
    Block,
    BlockHeader,
    BlockIcon,
    BlockName,
    BlockTitle,
    BlockDescription,
    BlockActions,
    BlockContent,
    BlockList,
    BlockFooter,
}
