import { Platform } from 'react-native'
import { fetcher } from 'app/lib/fetcher';
import { ImageManipulator, SaveFormat } from 'app/lib/image/manipulator';
import { appSetting } from 'app/config';
import { isWeb } from './layout';
import { genRnd } from './misc';

const UPLOAD_TIMEOUT_MS = appSetting('config', 'upload_timeout_ms') || 300000;

function guessMimeFromExt(ext) {
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

function extFromMime(mime) {
    const type = String(mime || '').toLowerCase();
    if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg';
    if (type === 'image/svg+xml') return 'svg';
    if (type === 'video/quicktime') return 'mov';
    const sub = type.split('/')[1];
    return sub && sub !== 'octet-stream' ? sub : '';
}

function resolveNativeUploadMeta(uri, extraVar) {
    const uriPath = String(uri || '').split('?')[0];
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

function urltoFile(url, defaultFilename = 'file', defaultMimeType = 'application/octet-stream') {
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
                    const rawFilename = urlParts[urlParts.length - 1];

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

export const uploadImageFile = async (file, fetchUrl, calback, extraVar) => {
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

export const getUploadSizeMb = async ({ file, uri, fileSizeBytes }) => {
    if (typeof fileSizeBytes === 'number' && fileSizeBytes > 0) {
        return fileSizeBytes / (1024 * 1024);
    }

    if (file && typeof file.size === 'number') {
        return file.size / (1024 * 1024);
    }

    if (uri && Platform.OS === 'web') {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            return (blob?.size || 0) / (1024 * 1024);
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
}) => {
    const originalSizeMb = await getUploadSizeMb({ uri, fileSizeBytes });
    const shouldConvertToWebp = originalSizeMb > webpOverMb;
    const context = ImageManipulator.manipulate(uri);
    let hasActions = false;

    if (
        typeof width === 'number' &&
        typeof height === 'number' &&
        typeof maxWidth === 'number' &&
        typeof maxHeight === 'number' &&
        (width > maxWidth || height > maxHeight)
    ) {
        let resizeWidth = maxWidth;
        let resizeHeight = maxHeight;

        if (width > height) {
            resizeHeight = Math.round((height * resizeWidth) / width);
        } else {
            resizeWidth = Math.round((width * resizeHeight) / height);
        }

        context.resize({ width: resizeWidth, height: resizeHeight });
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

export const uploadImage = async (uri, fetchUrl, calback, extraVar, options = {}) => {
    const { signal } = options;
    if (isWeb) {
        let fileType = '';
        let fileExt = '';
        if (uri.startsWith('data:')) {
            // For data URI
            fileType = uri.split(';')[0].split(':')[1]; // MIME type
            fileExt = fileType.split('/')[1]; // extension
            if (fileExt == 'svg+xml') {
                fileExt = 'svg';
            }

        } else {
            const fileName = uri.split('/').pop(); // file name
            fileExt = fileName.split('.').pop(); // extension
            fileType = `image/${fileExt}`; // MIME type
        }
        const formData = new FormData();
        const file = await urltoFile(uri, genRnd(8) + '.' + fileExt, fileType);
        if (signal?.aborted) {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            err.aborted = true;
            throw err;
        }
        formData.append("file", file);
        const result = await fetcher([fetchUrl, null, formData], false, {
            timeoutMs: UPLOAD_TIMEOUT_MS,
            signal,
        });
        // Always pass the full API payload so callers can read data.ghost
        // (passing only data.link dropped ghosts and left preload spinners).
        calback({ result, extraVar });
        return;
    }

    const formData = new FormData();
    const { name, type } = resolveNativeUploadMeta(uri, extraVar);
    formData.append("file", {
        uri,
        name,
        type,
    });

    const result = await fetcher([fetchUrl, null, formData], false, {
        timeoutMs: UPLOAD_TIMEOUT_MS,
        signal,
    });
    calback({ result, extraVar });
};
