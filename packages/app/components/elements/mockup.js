'use client'

import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import Image from 'app/ui/atoms/image'
import { BlockWrapper } from 'app/components/block-wrapper'
import { isMockupEmpty, parseMockup } from 'app/lib/mockup-parse'

function MockupNode({ node }) {
    if (!node) return null

    const { type, className } = node
    const children = Array.isArray(node.children)
        ? node.children.map((child, index) => (
            <MockupNode key={child.id || index} node={child} />
        ))
        : null

    if (type === 'text') {
        return <Text className={className || 'text-foreground'}>{node.text}</Text>
    }

    if (type === 'icon') {
        return <Icon icon={node.icon} size={node.size || 24} className={className} />
    }

    if (type === 'image') {
        return (
            <Image
                src={node.src}
                alt={node.alt || ''}
                className={className || 'w-full h-48 rounded-xl'}
            />
        )
    }

    if (type === 'button') {
        if (node.href) {
            return <NeoButtonLink href={node.href} style={node.style} label={node.label} className={className} />
        }
        return <NeoButton style={node.style} label={node.label} className={className} />
    }

    if (type === 'row') {
        return <Row className={className}>{children}</Row>
    }

    return <View className={className}>{children}</View>
}

export default function ElementMockup(props) {
    const tree = parseMockup(props.data ?? props.content ?? props)
    if (!tree) return null

    return (
        <BlockWrapper {...props.blockWrapperProps}>
            <MockupNode node={tree} />
        </BlockWrapper>
    )
}

ElementMockup.checkEmpty = (item) => !isMockupEmpty(item)
