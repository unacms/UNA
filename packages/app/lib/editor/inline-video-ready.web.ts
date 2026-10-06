/**
 * Web: is the transcoded mp4 there yet? UNA answers 404 until it is. A cross-origin fetch
 * can't read that (no CORS on image_transcoder.php), a detached <video> loading metadata can.
 */
export function isInlineVideoReady(src: string): Promise<boolean> {
    return new Promise((resolve) => {
        const video = document.createElement('video')
        const done = (ok: boolean) => {
            video.onloadedmetadata = null
            video.onerror = null
            video.removeAttribute('src')
            video.load()
            resolve(ok)
        }
        video.preload = 'metadata'
        video.muted = true
        video.onloadedmetadata = () => done(true)
        video.onerror = () => done(false)
        video.src = src
    })
}
