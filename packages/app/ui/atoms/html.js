import React from 'react'
import Image from 'app/ui/atoms/image'
import { Row, View } from 'app/design/view'
import { P, Strong, I, EM, Div, UL, Code } from '@expo/html-elements'
import { Platform } from 'react-native'
import Link from 'app/ui/atoms/link'
import { Text, H1, H2, H3, H4, H5, H6 } from 'app/design/typography'
import { decodeText } from 'app/lib/util'
import { ParseHtmlClasses } from 'app/customization/functions';

const StyledStrong = (props) => {
    if (Platform.OS === 'web') {
        return <strong {...props} />
    }
    return <Strong {...props} />
}

const StyledI = (props) => {
    if (Platform.OS === 'web') {
        return <i {...props} />
    }
    return <I {...props} />
}

const StyledEM = (props) => {
    if (Platform.OS === 'web') {
        return <em {...props} />
    }
    return <EM {...props} />
}

const StyledP = ({ children, className, ...props }) => {
    className += 'text-card-foreground'
    className += props.isfirst === 'true' ? ' mt-0 ' : ' mt-2 '
    className += props.islast === 'true' ? ' mb-0' : ' mb-2'


    if (Platform.OS === 'web') {
        const WebDiv = 'div'
        return <WebDiv {...props} className={`${className} `} >{children}</WebDiv>
    }
    return <P className={className} {...props}>{children}</P>
}

const StyledLi = ({ children, ...props }) => {
    if (Platform.OS === 'web') {
        const WebLi = 'li'
        return <WebLi {...props}>{children}</WebLi>
    }
    return (
        <Row {...props} className={`mb-1 ml-4 flex-row items-start`}>
            <Text className="mr-2 text-foreground">•</Text>
            <Text className="flex-1 text-foreground">{children}</Text>
        </Row>
    )
}

const StyledText = (props) => {
    if (Platform.OS === 'web') {
        const WebSpan = 'span'
        return <WebSpan {...props} />
    }
    return <Text {...props} />
}

const StyledDiv = (props) => <Div {...props} />

const tagMapping = {
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,
    p: StyledP,
    strong: StyledStrong,
    b: StyledStrong,
    i: StyledI,
    em: StyledEM,
    code: Code,
    div: StyledDiv,
    li: StyledLi,
    span: StyledText,
    ul: UL,
    ol: UL
}

const getAttributeValue = (attributes, name) => {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = attributes.match(
        new RegExp(`${escapedName}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`)
    )
    return match ? (match[1] || match[2] || match[3] || '') : ''
}

const stripHtmlTags = (value = '') => value.replace(/<[^>]*>/g, '')

const parseHtmlToReact = (html, parentKey = '0') => {
    if (!/<[a-zA-Z0-9]+[^>]*>/.test(html)) {
        if (Platform.OS === 'web') return html
        return <Text>{html}</Text>
    }


    let childIndex = 0
    const getKey = (tag) => `${parentKey}-${childIndex++}-${tag}`
    const elements = []

    html = html.replace(
        /<br\s*\/?>/gi,
        (_, index) => `<br key="${getKey('br')}"></br>`
    )



    html = html.replace(
        /<img\s*([^>]*)\/?>/gi,
        (match, attributes, index) => {
            return `<customimg ${attributes} key="${getKey('img')}"></customimg>`
        }
    )

    const mainTagRegex = /<([a-zA-Z0-9]+)([^>]*)>(.*?)<\/\1>/gis
    let lastIndex = 0
    let match

    while ((match = mainTagRegex.exec(html)) !== null) {
        const [fullMatch, tag, attributes, content] = match
        const normalizedTag = tag.toLowerCase()
        const textBefore = html.slice(lastIndex, match.index)
        lastIndex = mainTagRegex.lastIndex

        if (textBefore) {
            if (Platform.OS === 'web') {
                elements.push(textBefore)
            } else {
                elements.push(<Text key={getKey('text-before')}>{textBefore}</Text>)
            }
        }

        if (normalizedTag === 'br') {
            if (Platform.OS === 'web') {
                const WebDiv = 'div'
                elements.push(<WebDiv key={getKey('br')}></WebDiv>)
            }
            else {
                elements.push(<P key={getKey('br')}></P>)
            }

            continue
        }

        let srcClass = attributes.match(/class=['"]([^'"]*)['"]/) || attributes.match(/class=([^'"\s>]+)/)

        if (normalizedTag === 'a') {
            const href = getAttributeValue(attributes, 'href')
            const srcClassString = (srcClass && srcClass[1]) ? srcClass[1] : ''
            const isMentionLink = /\bbx-mention-link\b/.test(srcClassString)
            const avatarSrc = getAttributeValue(attributes, 'data-avatar') || getAttributeValue(attributes, 'data-avatar-url')
            const title = getAttributeValue(attributes, 'title')

            if (href) {
                const parsedClassName = srcClassString
                    ? ParseHtmlClasses(srcClassString, 'link')
                    : ''

                if (isMentionLink && avatarSrc && Platform.OS === 'web') {
                    const mentionLabel = decodeText(
                        stripHtmlTags(title || content || '').trim()
                    )

                    elements.push(
                        <Link
                            key={getKey('mention-link')}
                            href={href}
                            variant="primary"
                            className={
                                'rounded p-px overflow-hidden inline-flex items-center ' +
                                parsedClassName
                            }
                        >
                            <Row className="items-center gap-1">
                                <Image
                                    src={avatarSrc}
                                    width={14}
                                    height={14}
                                    className="rounded-full"
                                />
                                <Text className="text-accent-foreground text-sm">
                                    {mentionLabel}
                                </Text>
                            </Row>
                        </Link>
                    )
                    continue
                }

                elements.push(
                    <Link
                        key={getKey('link')}
                        href={href}
                        variant="primary"
                        mode="text"
                        className={
                            'text-accent-foreground rounded px-0.5 pb-0.5 pt-[1.5px] overflow-hidden' +
                            parsedClassName
                        }
                    >
                        {parseHtmlToReact(content, getKey('content'))}
                    </Link>
                )
            }
            continue
        }

        const Component = tagMapping[normalizedTag] || StyledText

        if (tag === 'customimg') {
            const srcMatch = attributes.match(/src=['"]?([^'"\s>]+)['"]?/)
            if (srcMatch && srcMatch[1]) {
                elements.push(
                    <Image
                        key={getKey('image')}
                        src={srcMatch[1]}
                        width={100}
                        height={100}
                    />
                )
            }
            continue
        }

        elements.push(
            <Component
                key={getKey(tag)}
                className={
                    srcClass && srcClass[1]
                        ? ParseHtmlClasses(srcClass[1], 'text')
                        : ''
                }
                isfirst="false"
                islast="false"
            >
                {parseHtmlToReact(content, getKey('content'))}
            </Component>
        )
    }

    const remainingText = html.slice(lastIndex)
    if (remainingText) {
        if (Platform.OS === 'web') {
            elements.push(remainingText)
        } else {
            elements.push(<Text key={getKey('end')}>{remainingText}</Text>)
        }
    }

    if (elements.length > 0 && elements.every(React.isValidElement)) {
        elements[0] = React.cloneElement(elements[0], { isfirst: 'true' })
        elements[elements.length - 1] = React.cloneElement(
            elements[elements.length - 1],
            { islast: 'true' }
        )
    }

    return elements
}

export default function ElementHtml({ customClassName, data, innerRef }) {
    if (!data) return null
    let html = decodeText(data.replace(/\n|\r/g, '').replace(/&nbsp;/g, ' '));
    if (html.trim() != '' && !html.includes('<p')) html = `<p>${html}</p>`
    return (
        <View className={`${customClassName || 'u-vanilla-html'}`} ref={innerRef}>
            {parseHtmlToReact(html)}
        </View>
    )
}