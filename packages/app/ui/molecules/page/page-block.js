import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { normalizeTiers, responsiveClasses } from 'app/lib/responsive-classes'

const blockTheme = appSetting('theme', 'blocks')

function createBlockComponent({
    baseClass,
    Component = View,
    role,
    ariaLevel,
    animate = false,
}) {
    return function BlockSubComponent({
        className = '',
        isBg,
        isPad,
        rounded,
        ...props
    }) {
        // isBg / isPad: on or off (UNA designbox), or the tiers ['mobile', 'tablet',
        // 'desktop'] where they apply (block config `designbox`, see block-wrapper.js).
        const bg = baseClass === 'u-block-base' ? normalizeTiers(isBg) : false
        const pad = normalizeTiers(isPad)

        // Card chrome (fill, outline shadow, radius) only where UNA background is on.
        const bgClass = bg === true ? blockTheme['u-block-bg'] : bg ? responsiveClasses('bg', bg) : ''
        const roundedClass = bg ? responsiveClasses('rounded', rounded) : ''

        // UNA padding: py on the shell, px on header / content / footer.
        const padSide = baseClass === 'u-block-base'
            ? 'pad-y'
            : baseClass === 'u-block-header' || baseClass === 'u-block-content' || baseClass === 'u-block-footer'
                ? 'pad-x'
                : ''
        const padClass = !padSide || !pad
            ? ''
            : pad === true ? blockTheme['u-block-' + padSide] : responsiveClasses('block-' + padSide, pad)

        return (
            <Component
                className={`${baseClass} ${bgClass} ${padClass} ${animate ? blockTheme['u-block-animate'] || '' : ''} ${blockTheme[baseClass] || ''} ${roundedClass} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        )
    }
}

const Block = createBlockComponent({
    baseClass: 'u-block-base',
    animate: true,
})
const BlockHeader = createBlockComponent({ baseClass: 'u-block-header' })
const BlockIcon = createBlockComponent({ baseClass: 'u-block-icon' })
const BlockName = createBlockComponent({ baseClass: 'u-block-name' })
const BlockTitle = createBlockComponent({
    baseClass: 'u-block-title',
    Component: Text,
    role: 'heading',
    ariaLevel: 2,
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
