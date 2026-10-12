'use client'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFetch } from 'app/lib/hooks/use-fetch'
import { appSetting } from 'app/lib/util'
import EmbedJs from 'app/ui/molecules/content/embed'
import Html from 'app/ui/atoms/html'
import { embedUrlFromImageSrc, tableMarkdownFromImageSrc } from './inline-video'
import { markdownTableToHtml } from './markdown-table'

const Embed = EmbedJs as ComponentType<{ data: Record<string, any> }>

type EmbedView = { id: number; dom: HTMLElement; image: string } & ({ url: string } | { table: string })

let nextViewId = 0

/** Embed card as the post shows it; the preview image until UNA answers (or can't embed). */
function EditorEmbedCard({ url, image }: { url: string; image: string }) {
    const { data: response } = useFetch(`/api.php?r=${appSetting('urls', 'embeds_new')}${encodeURIComponent(url)}`)
    if (response?.data) return <Embed data={{ url, ...response.data }} />
    return <img src={image} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
}

/** Table block as the post shows it (the editor body has the same `u-vanilla-html` styles). */
function EditorTableCard({ markdown }: { markdown: string }) {
    return <Html data={markdownTableToHtml(markdown)} />
}

const isBlockImage = (src: unknown) => !!(embedUrlFromImageSrc(src as string) || tableMarkdownFromImageSrc(src as string))

/**
 * Web: draw body embeds (images with a `#neo-embed=` src, see toEmbedImageSrc) as embed
 * cards, and table blocks (`#neo-table=`, see markdown-table.ts) as tables, in the editor. The image node view is swapped through TipTap's node view getter,
 * so the HTML stays the same image; each card is a portal rendered by the editor (theme,
 * fetch cache). Cards ignore the pointer: a click selects the node like an image.
 */
export function useEditorEmbedViews(tipTap: any): ReactNode {
    const [views, setViews] = useState<EmbedView[]>([])

    useEffect(() => {
        const manager = tipTap?.extensionManager
        if (!manager || tipTap.isDestroyed) return undefined
        const baseGet = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(manager), 'nodeViews')?.get
        if (!baseGet) return undefined

        // Node views are built inside ProseMirror updates, which may run in a React render.
        const upsert = (view: EmbedView) => queueMicrotask(() => setViews((list) => [...list.filter((v) => v.id !== view.id), view]))
        const remove = (id: number) => queueMicrotask(() => setViews((list) => list.filter((v) => v.id !== id)))

        const createEmbedView = (initial: any) => {
            const id = ++nextViewId
            const dom = document.createElement('span')
            dom.contentEditable = 'false'
            dom.style.display = 'inline-block'
            dom.style.verticalAlign = 'text-bottom'
            dom.style.maxWidth = '100%'
            dom.style.borderRadius = '8px'
            const render = (node: any) => {
                const src = node.attrs?.src
                const image = String(src).split('#')[0]!
                const table = tableMarkdownFromImageSrc(src)
                // A table spans the body; an embed keeps the width the size menu gave it.
                dom.style.width = table ? '100%' : `${Number(node.attrs?.width) || 720}px`
                upsert(table ? { id, dom, image, table } : { id, dom, image, url: embedUrlFromImageSrc(src)! })
            }
            render(initial)
            return {
                dom,
                update: (node: any) => {
                    if (node.type !== initial.type || !isBlockImage(node.attrs?.src)) return false
                    render(node)
                    return true
                },
                selectNode: () => { dom.style.outline = '2px solid Highlight' },
                deselectNode: () => { dom.style.outline = '' },
                ignoreMutation: () => true,
                destroy: () => remove(id),
            }
        }

        Object.defineProperty(manager, 'nodeViews', {
            configurable: true,
            get() {
                const nodeViews = baseGet.call(this)
                const image = nodeViews?.image
                if (!image) return nodeViews
                return {
                    ...nodeViews,
                    image: (node: any, ...rest: any[]) =>
                        isBlockImage(node.attrs?.src) ? createEmbedView(node) : image(node, ...rest),
                }
            },
        })
        tipTap.createNodeViews?.()

        return () => {
            delete manager.nodeViews
            if (!tipTap.isDestroyed) tipTap.createNodeViews?.()
            setViews([])
        }
    }, [tipTap])

    return views.map((view) =>
        createPortal(
            <span style={{ display: 'block', pointerEvents: 'none' }}>
                {'table' in view
                    ? <EditorTableCard markdown={view.table} />
                    : <EditorEmbedCard url={view.url} image={view.image} />}
            </span>,
            view.dom,
            String(view.id),
        ),
    )
}
