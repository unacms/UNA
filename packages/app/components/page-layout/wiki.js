import { View, Row, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardTitle,
} from 'app/ui/molecules/card'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import { appSetting, getBreakpoint } from 'app/lib/util'
import AuthPanel from 'app/ui/molecules/auth'
import Page from 'app/ui/molecules/page'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import { Icon } from 'app/ui/atoms/icon'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps
} from 'app/ui/molecules/resizable-panels'
import { useBreakpoint } from 'app/context/measure'
import { BlockWrapper } from 'app/components/block-wrapper'

function PageContentWiki({ children }) {
    const { t } = useTranslation()
    const isWeb = Platform.OS === 'web'
    const childList = React.Children.toArray(children)
    const [tocItems, setTocItems] = useState([])
    const centerContentRef = useRef(null)

    const centerChild = childList[0] || null
    const centerChildren = centerChild ? [centerChild] : []
    const leftChildren = childList.length > 2
        ? [childList[1], ...childList.slice(3)]
        : childList.slice(1)



    const cellsCustomConfig = useMemo(() => {
        return appSetting('layouts', 'wiki') || appSetting('layouts', 'cols-l-c-r')
    }, [])
    const groupRef = useRef(null)
    const currentBreakpoint = useBreakpoint()
    const { cells = {} } = cellsCustomConfig || {}
    const currentBreakpointName = getBreakpoint(currentBreakpoint)

    const {
        breakpoint: leftBreakpoint = 'lg',
        responsive: leftResponsive,
        ...leftBase
    } = cells.left ?? {}
    const leftPanelProps = resolvePanelProps(leftBase, leftResponsive, currentBreakpointName)

    const {
        breakpoint: centerBreakpoint,
        responsive: centerResponsive,
        ...centerBase
    } = cells.center ?? {}
    const centerPanelProps = resolvePanelProps(centerBase, centerResponsive, currentBreakpointName)

    const {
        breakpoint: rightBreakpoint = 'xl',
        responsive: rightResponsive,
        ...rightBase
    } = cells.right ?? {}
    const rightPanelProps = resolvePanelProps(rightBase, rightResponsive, currentBreakpointName)
    const handleTocPress = (id) => {
        if (!isWeb || !id) {
            return
        }

        const target = document.getElementById(id)
        if (!target) {
            return
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `#${id}`)
    }

    const onLayout = () => {
        if (isWeb) {
            setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
        }
    }

    useEffect(() => {
        if (isWeb) {
            groupRef.current?.setLayout([
                leftPanelProps.defaultSize,
                centerPanelProps.defaultSize,
                rightPanelProps.defaultSize
            ])
        }
    }, [currentBreakpointName, isWeb, leftPanelProps.defaultSize, centerPanelProps.defaultSize, rightPanelProps.defaultSize])

    useEffect(() => {
        if (!isWeb) {
            setTocItems([])
            return
        }

        const root = centerContentRef.current
        if (!root) {
            setTocItems([])
            return
        }

        const seenIds = new Map()
        const headings = Array.from(root.querySelectorAll('h2, h3'))
        const items = headings
            .map((heading) => {
                const text = heading.textContent?.trim()
                if (!text) {
                    return null
                }

                const baseId = text
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .trim()
                    .replace(/\s+/g, '-')

                const safeBaseId = baseId || 'section'
                const count = seenIds.get(safeBaseId) || 0
                seenIds.set(safeBaseId, count + 1)
                const id = count === 0 ? safeBaseId : `${safeBaseId}-${count + 1}`

                if (!heading.id) {
                    heading.id = id
                }

                return {
                    id: heading.id,
                    text,
                    level: Number(heading.tagName.slice(1))
                }
            })
            .filter(Boolean)

        setTocItems((prev) => {
            if (
                prev.length === items.length &&
                prev.every((prevItem, i) =>
                    prevItem.id === items[i]?.id &&
                    prevItem.text === items[i]?.text &&
                    prevItem.level === items[i]?.level
                )
            ) {
                return prev
            }
            return items
        })
    }, [isWeb, centerChild])

    const leftContent = (
        <View className="flex-auto w-full  p-2 sm:p-3">
            <View className="gap-3">
                {leftChildren}
            </View>
        </View>
    )

    const rightContent = (
        <BlockWrapper
            showTitle={true}
            block={{
                id: 'wiki-toc',
                title: t('On this page'),
                designbox_id: 14
            }}
        >
            <View className="gap-2">
                {tocItems.length >= 2 && (
                    tocItems.map((item) => (
                        <Row key={item.id} className={`items-center gap-2 ${item.level === 3 ? 'pl-4' : ''}`}>
                            <Icon name={item.level === 2 ? 'List' : 'Minus'} size={14} className="text-muted-foreground" />
                            <Pressable
                                onPress={() => handleTocPress(item.id)}
                                className="py-0.5"
                            >
                                <Text className="text-sm leading-tight   text-secondary-foreground web:group-hover:text-foreground">
                                    {item.text}
                                </Text>
                            </Pressable>
                        </Row>
                    ))
                )}
            </View>
        </BlockWrapper>

    )

    return (
        <View className="mx-auto w-full max-w-screen-2xl p-2 sm:p-4 md:p-6">
            <PanelGroup
                ref={groupRef}
                key={`cells-wiki${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                autoSaveId={cellsCustomConfig.sizable ? `cells-wiki` : undefined}
                direction="horizontal"
                className={` mx-auto flex-auto relative flex-row`}
                onLayout={onLayout}
            >
                <Panel className={`hidden ${leftBreakpoint}:block ${currentBreakpointName}:w-full`} {...leftPanelProps}>
                    {leftContent}
                </Panel>
                <PanelHandler gap={`hidden ${leftBreakpoint}:block`} sizable={cellsCustomConfig.sizable} />
                <Panel className={`native:w-full ${currentBreakpointName}:w-full`} {...centerPanelProps}>
                    <View ref={centerContentRef} className={` min-w-0 gap-3`}>
                        {centerChildren}
                    </View>
                </Panel>

                <PanelHandler gap={`hidden ${rightBreakpoint}:block`} sizable={cellsCustomConfig.sizable} />
                <Panel className={`hidden ${rightBreakpoint}:block ${currentBreakpointName}:w-full`} {...rightPanelProps}>
                    {rightContent}
                </Panel>
            </PanelGroup>
        </View>
    )
}

export default function PageLayoutWiki({ data, children }) {
    return (
        <Page data={data}>
            <PageContentWiki>
                {children}
            </PageContentWiki>
            <View className="flex-1" />
            <MenuFooter
                cntClasses='flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-4 min-h-14'
            />
        </Page>
    )
}
