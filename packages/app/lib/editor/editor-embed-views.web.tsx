'use client'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFetch } from 'app/lib/hooks/use-fetch'
import { appSetting } from 'app/lib/util'
import EmbedJs from 'app/ui/molecules/content/embed'
import { embedUrlFromImageSrc } from './inline-video'

const Embed = EmbedJs as ComponentType<{ data: Record<string, any> }>

type EmbedView = { id: number; dom: HTMLElement; url: string; image: string }

let nextViewId = 0

/** Embed card as the post shows it; the preview image until UNA answers (or can't embed). */
function EditorEmbedCard({ url, image }: { url: string; image: string }) {
    const { data: response } = useFetch(`/api.php?r=${appSetting('urls', 'embeds_new')}${encodeURIComponent(url)}`)
    if (response?.data) return <Embed data={{ url, ...response.data }} />
    return <img src={image} alt="" style={{ display: 'block', width: '100%', height: 'auto' }} />
}

/**
 * Web: draw body embeds (images with a `#neo-embed=` src, see toEmbedImageSrc) as embed
 * cards in the editor. The image node view is swapped through TipTap's node view getter,
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
                dom.style.width = `${Number(node.attrs?.width) || 720}px`
                upsert({ id, dom, url: embedUrlFromImageSrc(node.attrs?.src)!, image: String(node.attrs?.src).split('#')[0]! })
            }
            render(initial)
            return {
                dom,
                update: (node: any) => {
                    if (node.type !== initial.type || !embedUrlFromImageSrc(node.attrs?.src)) return false
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
                        embedUrlFromImageSrc(node.attrs?.src) ? createEmbedView(node) : image(node, ...rest),
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
                <EditorEmbedCard url={view.url} image={view.image} />
            </span>,
            view.dom,
            String(view.id),
        ),
    )
}
