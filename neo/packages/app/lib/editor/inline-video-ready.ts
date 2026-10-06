/** Native: is the transcoded mp4 there yet? UNA answers 404 until it is (no CORS on native). */
export async function isInlineVideoReady(src: string): Promise<boolean> {
    try {
        const res = await fetch(src, { method: 'HEAD' })
        return res.ok
    } catch {
        return false
    }
}
