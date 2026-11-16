import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { blockBgClasses, normalizeTiers, responsiveClasses } from 'app/lib/responsive-classes'
import { blockSize, blockSizeKey, withoutGap } from 'app/lib/block-size'

const blockTheme = appSetting('theme', 'blocks')

/**
 * UNA padding classes for one side (`pad-x`, `pad-y`) on the tiers in `pad`, at Studio's "Padding" `size`
 * (compact, large; '' regular, see lib/block-size.ts). A theme without the sized keys keeps its regular padding.
 */
function padClasses(padSide, pad, size) {
    if (!padSide || !pad) return ''
    const regularKey = 'u-block-' + padSide
    const sizedKey = blockSizeKey(regularKey, size)
    const hasSized = blockTheme[sizedKey] != null
    if (pad === true) return hasSized ? blockTheme[sizedKey] : blockTheme[regularKey]
    return responsiveClasses(hasSized ? blockSizeKey('block-' + padSide, size) : 'block-' + padSide, pad)
}

/** The parts that follow Studio's "Title size" (`theme.blocks` `<part>-compact` / `-large`): the title and the header icon. */
const TITLE_PARTS = new Set(['u-block-title', 'u-block-title-stacked', 'u-block-header-icon'])

/**
 * The part's theme classes. The gap between a block's title and content follows its padding size, as on the site; the
 * title takes its sized type (a theme without the sized keys keeps the regular title).
 */
function themeClasses(baseClass, padSize, titleSize) {
    if (TITLE_PARTS.has(baseClass) && titleSize) {
        return blockTheme[blockSizeKey(baseClass, titleSize)] ?? blockTheme[baseClass] ?? ''
    }
    const sizedGap = baseClass === 'u-block-base' && padSize ? blockTheme['u-block-gap-' + padSize] : null
    if (sizedGap == null) return blockTheme[baseClass] || ''
    return `${withoutGap(blockTheme[baseClass])} ${sizedGap}`
}

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
        padSize,
        titleSize,
        rounded,
        ...props
    }) {
        // isBg / isPad: on or off (UNA designbox), or the tiers ['mobile', 'tablet',
        // 'desktop'] where they apply (block config `designbox`, see block-wrapper.js).
        const bg = baseClass === 'u-block-base' ? normalizeTiers(isBg) : false
        const pad = normalizeTiers(isPad)

        // Card chrome (fill, outline shadow, radius) only where UNA background is on; the
        // outline only where the corners are rounded (a square block runs to the screen edge).
        const bgClass = bg ? blockBgClasses(bg, rounded) : ''
        const roundedClass = bg ? responsiveClasses('rounded', rounded) : ''

        // UNA padding: py on the shell, px on header / content / footer.
        const padSide = baseClass === 'u-block-base'
            ? 'pad-y'
            : baseClass === 'u-block-header' || baseClass === 'u-block-content' || baseClass === 'u-block-footer'
                ? 'pad-x'
                : ''
        const size = pad ? blockSize(padSize) : ''
        const padClass = padClasses(padSide, pad, size)
        const themeClass = themeClasses(baseClass, size, blockSize(titleSize))

        return (
            <Component
                className={`${baseClass} ${bgClass} ${padClass} ${animate ? blockTheme['u-block-animate'] || '' : ''} ${themeClass} ${roundedClass} ${className}`}
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
// The header's parts, in shadcn/ui's Card terms: BlockHeader (CardHeader) is a row of BlockHeaderIcon,
// BlockName (BlockTitle over BlockDescription: CardTitle, CardDescription) and BlockActions (CardAction).
// A block with no description draws its icon as BlockTitleIcon, bare, on the title's line.
const BlockHeaderIcon = createBlockComponent({ baseClass: 'u-block-header-icon' })
const BlockTitleIcon = createBlockComponent({ baseClass: 'u-block-title-icon' })
/** @deprecated the 36px tile before the title: BlockHeaderIcon or BlockTitleIcon instead. */
const BlockIcon = createBlockComponent({ baseClass: 'u-block-icon' })
const BlockName = createBlockComponent({ baseClass: 'u-block-name' })
const BlockNameStacked = createBlockComponent({ baseClass: 'u-block-name-stacked' })
const BlockTitle = createBlockComponent({
    baseClass: 'u-block-title',
    Component: Text,
    role: 'heading',
    ariaLevel: 2,
})

const BlockTitleStacked = createBlockComponent({
    baseClass: 'u-block-title-stacked',
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
    BlockHeaderIcon,
    BlockTitleIcon,
    BlockNameStacked,
    BlockTitleStacked,
    BlockName,
    BlockTitle,
    BlockDescription,
    BlockActions,
    BlockContent,
    BlockList,
    BlockFooter,
}
