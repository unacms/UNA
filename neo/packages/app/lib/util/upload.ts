import { Platform } from 'react-native'
import i18n from 'i18next';
import { fetcher } from 'app/lib/fetcher';
import { xhrRequest } from 'app/lib/xhr-request';
import { ImageManipulator, SaveFormat } from 'app/lib/image/manipulator';
import { appSetting } from 'app/config';
import { isWeb } from './layout';
import { genRnd } from './misc';

const UPLOAD_TIMEOUT_MS: number = (appSetting as (...args: any[]) => any)('config', 'upload_timeout_ms') || 300000;
const DIRECT_UPLOAD_OVER_MB: number | undefined = (appSetting as (...args: any[]) => any)('config', 'direct_upload_over_mb');

/** Picker metadata passed along with an upload (mime/name hints). */
export type UploadExtra = {
    mimeType?: string;
    fileType?: string;
    fileName?: string;
    name?: string;
    [key: string]: unknown;
} | null | undefined;

function guessMimeFromExt(ext: string | undefined): string {
    const e = String(ext || '').toLowerCase();
    if (!e) return 'application/octet-stream';
    if (e === 'jpg' || e === 'jpeg' || e === 'jpe') return 'image/jpeg';
    if (e === 'png' || e === 'gif' || e === 'webp' || e === 'heic' || e === 'heif' || e === 'bmp') return `image/${e}`;
    if (e === 'svg') return 'image/svg+xml';
    if (e === 'mov') return 'video/quicktime';
    if (e === 'mp4' || e === 'm4v' || e === 'webm' || e === 'avi' || e === '3gp') return `video/${e}`;
    if (e === 'pdf') return 'application/pdf';
    return `application/${e}`;
}

function extFromMime(mime: string | undefined): string {
    const type = String(mime || '').toLowerCase();
    if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg';
    if (type === 'image/svg+xml') return 'svg';
    if (type === 'video/quicktime') return 'mov';
    const sub = type.split('/')[1];
    return sub && sub !== 'octet-stream' ? sub : '';
}

function resolveNativeUploadMeta(uri: string, extraVar: UploadExtra): { name: string; type: string } {
    const uriPath = String(uri || '').split('?')[0]!;
    const uriName = decodeURIComponent(uriPath.split('/').pop() || '');
    const uriExt = uriName.match(/\.([a-z0-9]+)$/i)?.[1];
    const type = extraVar?.mimeType || extraVar?.fileType || guessMimeFromExt(uriExt);
    const mimeExt = extFromMime(type) || uriExt || '';
    const rawName = extraVar?.fileName || extraVar?.name || uriName || 'upload';
    const name = rawName.includes('.')
        ? rawName
        : (mimeExt ? `${rawName}.${mimeExt}` : rawName);
    return { name: name || 'upload', type: type || 'application/octet-stream' };
}

/** Original picked name, with the extension swapped when an image was re-encoded (crop/webp). */
function pickedFileName(name: string | undefined, blobType: string): string {
    const clean = String(name || '').split(/[\\/]/).pop() || '';
    if (!clean.includes('.')) return '';
    if (!blobType.startsWith('image/')) return clean;
    const mimeExt = extFromMime(blobType);
    const ext = clean.split('.').pop()!.toLowerCase();
    const same = ext === mimeExt || (mimeExt === 'jpg' && ext === 'jpeg');
    return same || !mimeExt ? clean : clean.replace(/\.[^.]+$/, '.' + mimeExt);
}

function urltoFile(url: string, defaultFilename = 'file', defaultMimeType = 'application/octet-stream'): Promise<File> {
    return fetch(url)
        .then(function (response) {
            return response.blob().then(function (blob) {
                const mimeType = blob.type || defaultMimeType;
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = defaultFilename;

                if (contentDisposition && contentDisposition.includes('filename')) {
                    const matches = contentDisposition.match(/filename="?(.+?)"?$/);
                    if (matches && matches[1]) {
                        filename = matches[1];
                    }
                } else {
                    const urlParts = url.split('/');
                    const rawFilename = urlParts[urlParts.length - 1]!;

                    if (rawFilename.includes('.') && rawFilename.split('.').length > 1) {
                        filename = rawFilename;
                    } else {
                        if (mimeType != 'image/svg+xml') {
                            const ext = mimeType.split('/')[1] || 'bin';
                            filename = `${rawFilename || defaultFilename}.${ext}`;
                        }
                        else {
                            filename = `${rawFilename || defaultFilename}.svg`;
                        }
                    }
                }
                return new File([blob], filename, { type: mimeType });
            });
        })
        .catch(function (error) {
            console.error('Error converting URL to File:', error);
            throw error;
        });
}

export const uploadImageFile = async (file: Blob, fetchUrl: string, calback: (result: any, extraVar: UploadExtra) => void, extraVar?: UploadExtra) => {
    const formData = new FormData();

    formData.append("file", file);
    const result = await fetcher([fetchUrl, null, formData], false, { timeoutMs: UPLOAD_TIMEOUT_MS });
    if (result?.data?.link) {
        calback(result?.data?.link, extraVar);
    }
    else {
        calback(result, extraVar)
    }
}

const PICKER_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'jpe', 'jfif', 'gif', 'png', 'svg', 'webp', 'heic', 'heif', 'bmp', 'tif', 'tiff', 'ico', 'avif']);
const PICKER_VIDEO_EXTS = new Set(['mp4', 'mov', 'm4v', 'avi', 'webm', '3gp', 'mkv', 'mpg', 'mpeg', 'wmv', 'flv', 'ogv']);

/** Storage ext list ("jpg,png" / ".jpg, .png") → normalized extensions. */
export const splitExtList = (list: string | null | undefined): string[] =>
    String(list || '').toLowerCase().split(',').map((s) => s.trim().replace(/^\./, '')).filter(Boolean);

/** Lowercased extension of a file name, '' when there is none. */
export const fileNameExt = (name: string | null | undefined): string =>
    String(name || '').match(/\.([a-z0-9]{1,10})$/i)?.[1]?.toLowerCase() || '';

/** Attachment kind from a file name: 'image' | 'video' | 'file'. */
export const attachmentKindByName = (name: string | null | undefined): 'image' | 'video' | 'file' => {
    const ext = fileNameExt(name);
    if (PICKER_IMAGE_EXTS.has(ext)) return 'image';
    if (PICKER_VIDEO_EXTS.has(ext)) return 'video';
    return 'file';
};

/**
 * What a storage's `ext_allow` (UNA markers already expanded) lets the user pick; `ext_deny` is checked per file:
 * 'images' (photo picker), 'media' (photos + videos) or 'any' (document picker).
 */
export const getStoragePickerKind = (extAllow?: string | null): 'images' | 'media' | 'any' => {
    const allow = splitExtList(extAllow);
    // deny-mode storage (empty allow list) accepts everything except the deny list.
    if (!allow.length) return 'any';
    if (allow.every((e) => PICKER_IMAGE_EXTS.has(e))) return 'images';
    if (allow.every((e) => PICKER_IMAGE_EXTS.has(e) || PICKER_VIDEO_EXTS.has(e))) return 'media';
    return 'any';
};

/** Client-side mirror of the storage ext check. Names without an extension are left to the server. */
export const isExtAllowed = (name: string | null | undefined, extAllow?: string | null, extDeny?: string | null): boolean => {
    const ext = fileNameExt(name);
    if (!ext) return true;
    const allow = splitExtList(extAllow);
    if (allow.length && !allow.includes(ext)) return false;
    return !splitExtList(extDeny).includes(ext);
};

const BYTES_IN_KB = 1024;
const BYTES_IN_MB = BYTES_IN_KB * 1024;

/** Human-readable size for UI: "512 B", "3 KB", "1.4 MB". Empty string for missing/zero. */
export const formatFileSize = (bytes: number | string | null | undefined): string => {
    const n = Number(bytes);
    if (!n || n < 0) return '';
    if (n < BYTES_IN_KB) return `${n} B`;
    if (n < BYTES_IN_MB) return `${Math.round(n / BYTES_IN_KB)} KB`;
    return `${(n / BYTES_IN_MB).toFixed(1)} MB`;
};

export const getUploadSizeMb = async ({ file, uri, fileSizeBytes }: { file?: { size?: number } | null; uri?: string; fileSizeBytes?: number }): Promise<number> => {
    if (typeof fileSizeBytes === 'number' && fileSizeBytes > 0) {
        return fileSizeBytes / BYTES_IN_MB;
    }

    if (file && typeof file.size === 'number') {
        return file.size / BYTES_IN_MB;
    }

    if (uri && Platform.OS === 'web') {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            return (blob?.size || 0) / BYTES_IN_MB;
        } catch {
            return 0;
        }
    }

    return 0;
}

export const prepareImageForUpload = async ({
    uri,
    width,
    height,
    fileSizeBytes,
    maxWidth,
    maxHeight,
    cropToSquare = false,
    squareSize,
    webpOverMb = 4,
}: {
    uri: string;
    width?: number;
    height?: number;
    fileSizeBytes?: number;
    maxWidth?: number;
    maxHeight?: number;
    cropToSquare?: boolean;
    squareSize?: number;
    /** Re-encode as WebP when the original exceeds this size (MB). */
    webpOverMb?: number;
}): Promise<string> => {
    const originalSizeMb = await getUploadSizeMb({ uri, fileSizeBytes });
    const shouldConvertToWebp = originalSizeMb > webpOverMb;
    // expo-image-manipulator's web .d.ts types the export as the class, but at runtime it is
    // the module instance (as on native) — use the native instance typing.
    const context = (ImageManipulator as unknown as { manipulate: (uri: string) => any }).manipulate(uri);
    let hasActions = false;

    if (
        typeof width === 'number' &&
        typeof height === 'number' &&
        typeof maxWidth === 'number' &&
        typeof maxHeight === 'number' &&
        maxWidth > 0 &&
        maxHeight > 0 &&
        (width > maxWidth || height > maxHeight)
    ) {
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        context.resize({
            width: Math.max(1, Math.round(width * scale)),
            height: Math.max(1, Math.round(height * scale)),
        });
        hasActions = true;
    }

    if (cropToSquare && typeof width === 'number' && typeof height === 'number') {
        let squareSide = width;
        if (width !== height) {
            squareSide = width > height ? height : width;
            context.crop({
                width: squareSide,
                height: squareSide,
                originX: width > height ? Math.round((width - squareSide) / 2) : 0,
                originY: height > width ? Math.round((height - squareSide) / 2) : 0,
            });
            hasActions = true;
        }

        if (typeof squareSize === 'number' && squareSide > squareSize) {
            context.resize({ width: squareSize, height: squareSize });
            hasActions = true;
        }
    }

    if (!hasActions && !shouldConvertToWebp) {
        return uri;
    }

    const renderedImage = await context.renderAsync();
    const processedImage = await renderedImage.saveAsync({
        ...(shouldConvertToWebp ? { format: SaveFormat.WEBP } : {}),
    });

    return processedImage.uri;
}

/** Set once UNA rejects the CORS preflight of a progress-reporting direct upload. */
let directUploadProgressBlocked = false;

const shouldUploadDirect = (size: number): boolean =>
    typeof DIRECT_UPLOAD_OVER_MB === 'number' && DIRECT_UPLOAD_OVER_MB >= 0 && size > DIRECT_UPLOAD_OVER_MB * BYTES_IN_MB;

/**
 * Web: POST the file straight to UNA with a one-time token (`get_upload_token`, fetched through
 * the proxy as the logged in user), so big files skip the Next proxy body limit.
 * Resolves `null` when UNA can't issue a token (older server) — the caller falls back to the proxy.
 * UNA must allow the app origin (Studio → API → origins) for the cross-origin response to be readable.
 */
async function uploadDirectToUna(
    fetchUrl: string,
    formData: FormData,
    signal?: AbortSignal,
    onProgress?: (fraction: number) => void,
): Promise<any | null> {
    const query = fetchUrl.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const tokenPath = '/api.php?r=system/get_upload_token/TemplUploaderServices'
        + '&uo=' + encodeURIComponent(params.get('uo') || '')
        + '&so=' + encodeURIComponent(params.get('so') || '');
    const tokenRes = await fetcher(tokenPath, false, { signal, maxAttempts: 1, silent: true });
    const token: string | undefined = tokenRes?.data?.token;
    const url: string | undefined = tokenRes?.data?.url;
    if (!token || !url) return null;

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);
    const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    const directUrl = `${url}?${query}&ut=${encodeURIComponent(token)}&lang=${i18n.language}`;
    try {
        if (onProgress && !directUploadProgressBlocked) {
            let sentAny = false;
            try {
                const r = await xhrRequest(directUrl, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal,
                    onUploadProgress: (fraction) => {
                        if (fraction > 0) sentAny = true;
                        onProgress(fraction);
                    },
                });
                return await r.json().catch(() => ({}));
            } catch (err) {
                if (sentAny || !(err instanceof TypeError)) throw err;
                // Nothing left the browser: UNA rejected the preflight that progress events require.
                directUploadProgressBlocked = true;
            }
        }
        // No custom headers: a "simple" CORS request, so the browser skips the preflight.
        const r = await fetch(directUrl, {
            method: 'POST',
            body: formData,
            credentials: 'omit',
            signal: controller.signal,
        });
        return await r.json().catch(() => ({}));
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }
}

/** Upload a local/data/blob image URI; `calback` gets `{ result, extraVar }` with the full API payload. */
export const uploadImage = async (
    uri: string,
    fetchUrl: string,
    calback: (payload: { result: any; extraVar: UploadExtra }) => void,
    extraVar?: UploadExtra,
    options: { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {},
) => {
    const { signal, onProgress } = options;
    if (isWeb) {
        let fileType = '';
        let fileExt = '';
        if (uri.startsWith('data:')) {
            // For data URI
            fileType = uri.split(';')[0]!.split(':')[1] as string; // MIME type
            fileExt = fileType.split('/')[1] as string; // extension
            if (fileExt == 'svg+xml') {
                fileExt = 'svg';
            }

        } else if (uri.startsWith('blob:')) {
            // Enriched web paste: URL.createObjectURL — no filename/extension in the URI
            fileType = extraVar?.mimeType || extraVar?.fileType || 'image/png';
            fileExt = extFromMime(fileType) || 'png';
            if (fileExt === 'svg+xml') fileExt = 'svg';
        } else {
            
            const fileName = uri.split('/').pop()!; // file name
            fileExt = fileName.split('.').pop()!; // extension
            fileType = `image/${fileExt}`; // MIME type
        }
        const formData = new FormData();
        const picked = await urltoFile(uri, genRnd(8) + '.' + fileExt, fileType);
        // blob: URLs carry a random UUID, not the picked name — keep the user's original file name.
        const originalName = pickedFileName(extraVar?.fileName || extraVar?.name, picked.type);
        const file = originalName ? new File([picked], originalName, { type: picked.type }) : picked;
        if (signal?.aborted) {
            const err: Error & { aborted?: boolean } = new Error('Aborted');
            err.name = 'AbortError';
            err.aborted = true;
            throw err;
        }
        formData.append("file", file);
        let result: any = null;
        if (shouldUploadDirect(file.size)) {
            try {
                result = await uploadDirectToUna(fetchUrl, formData, signal, onProgress);
            } catch (err: any) {
                if (signal?.aborted || err?.name === 'AbortError') throw err;
                console.warn('[upload] direct upload to UNA failed, retrying through the proxy:', err);
            }
        }
        if (!result) {
            result = await fetcher([fetchUrl, null, formData], false, {
                timeoutMs: UPLOAD_TIMEOUT_MS,
                signal,
                onUploadProgress: onProgress,
            });
        }
        // Always pass the full API payload so callers can read data.ghost
        // (passing only data.link dropped ghosts and left preload spinners).
        calback({ result, extraVar });
        return;
    }

    const formData = new FormData();
    const { name, type } = resolveNativeUploadMeta(uri, extraVar);
    // RN FormData takes a { uri, name, type } descriptor instead of a Blob.
    formData.append("file", {
        uri,
        name,
        type,
    } as unknown as Blob);

    const result = await fetcher([fetchUrl, null, formData], false, {
        timeoutMs: UPLOAD_TIMEOUT_MS,
        signal,
        onUploadProgress: onProgress,
    });
    calback({ result, extraVar });
};
