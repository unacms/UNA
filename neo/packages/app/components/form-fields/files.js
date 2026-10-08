import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Field, { getValidationRules } from './_field';
import { View, Row, Pressable } from 'app/design/view';
import * as ImagePicker from 'expo-image-picker';
import { NeoButton, legacyToNeoButtonProps } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { genRnd, appSetting, prepareImageForUpload } from 'app/lib/util';
import * as DocumentPicker from 'expo-document-picker';
import { fetcher } from 'app/lib/fetcher';
import { useFormContext } from 'react-hook-form';
import { useFieldController } from 'app/lib/form/use-form-field';
import { filesFieldValue } from 'app/lib/form/field-initial-values';
import { uploadImage, md5, getStoragePickerKind, isExtAllowed, splitExtList } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { Image as ImageNative, Alert, Platform } from 'react-native';
import { Image as ImageRN } from 'react-native';
import Video from 'app/ui/atoms/video';
import Msg from 'app/ui/molecules/dialogs/msg';
import { lazyComponent } from 'app/lib/lazy-component';

// Crop UI (zoomable view + crop math) loads on first crop, not with every form.
const ImageCropModal = lazyComponent(() => import('app/lib/image/crop-modal'), { name: 'ImageCropModal' });
import { getImageCropKind, isSvgAsset, getAssetImageSize } from 'app/lib/image/crop';
import { getCoverAspectClass, getImageUploadLimits, shouldSkipImageCrop } from 'app/lib/image/upload-settings';
import { useTranslation } from 'react-i18next'
import emitter, { EVENTS } from 'app/context/emitter';
import { CaptionForFileInput } from 'app/customization/functions';
import i18n from 'i18next';
import { useFormInstanceId } from 'app/context/form-instance';
import { trackFormUploadStart, trackFormUploadEnd, formResponseHasFieldErrors, FILES_FIELD_MIRRORS } from 'app/lib/form/form-helpers';
import { isInlineImagePaste, revokePastedBlobUri } from 'app/lib/editor/editor-paste-images';
import { setUploadProgress, clearUploadProgress } from 'app/lib/upload-progress';
import UploadProgress from 'app/ui/atoms/upload-progress';
import { getImagePickerOptions, showPermissionAlert } from 'app/lib/media/pick-media';
import { takeFieldAssets } from 'app/lib/form/pending-field-assets';

function resolvePickerSource(source, fallback = 'library') {
    if (source === 'camera' || source === 'library') {
        return source;
    }
    return fallback;
}

const IMAGE_FIELD_NAMES = new Set(['photo', 'cmt_image', 'pictures', 'picture', 'covers', 'avatar', 'badge']);
const VIDEO_FIELD_NAMES = new Set(['video', 'videos']);
const FILE_FIELD_NAMES = new Set(['file', 'files']);
// One field for every module's comments: the storage's ext rules decide images-only vs any file.
const STORAGE_DRIVEN_FIELD_NAMES = new Set(['cmt_image']);
const IMAGE_EXTS = ['jpg', 'jpeg', 'jpe', 'gif', 'png', 'svg', 'webp', 'heic', 'heif'];
const VIDEO_EXTS = ['mp4', 'mov', 'm4v', 'avi', 'webm', '3gp'];

function shouldUseMediaPicker(fieldName, extDeny, extAllow) {
    if (FILE_FIELD_NAMES.has(fieldName)) return false;
    if (IMAGE_FIELD_NAMES.has(fieldName) || VIDEO_FIELD_NAMES.has(fieldName)) return true;
    return isMediaField(extDeny, extAllow);
}

function isMediaField(extDeny, extAllow) {
    if (extDeny === '' || extAllow === 'mp3,m4a,m4b,wma,wav,3gp') {
        return true;
    }
    if (extDeny?.length && !'jpg,jpeg,jpe,gif,png,svg,webp'.split(',').some((s) => extDeny.split(',').includes(s))) {
        return true;
    }
    return false;
}

function allowListHasAny(extAllow, exts) {
    const allow = (extAllow ?? '').toLowerCase();
    if (!allow) return false;
    return exts.some((ext) => allow.includes(ext));
}

/**
 * Pick media types for the system picker.
 * Camera + videos requires NSMicrophoneUsageDescription on iOS; image-only
 * fields must not request video so photo capture works without mic permission.
 */
function resolvePickerMediaTypes(fieldName, extAllow, source) {
    if (IMAGE_FIELD_NAMES.has(fieldName)) {
        return ['images'];
    }
    if (VIDEO_FIELD_NAMES.has(fieldName)) {
        // Composer "Add Photos or Videos" shares this field.
        return ['images', 'videos'];
    }

    const hasImages = allowListHasAny(extAllow, IMAGE_EXTS);
    const hasVideos = allowListHasAny(extAllow, VIDEO_EXTS);

    if (hasImages && !hasVideos) {
        return ['images'];
    }
    if (hasVideos && !hasImages) {
        return ['videos'];
    }

    // Camera UI for mixed/unknown fields: photos only (avoids mic requirement).
    if (source === 'camera') {
        return ['images'];
    }

    if (hasImages && hasVideos) {
        return ['images', 'videos'];
    }

    return ['images', 'videos'];
}

/** Survives ImagePicker remounts of the files field (same as abort maps). */
const fieldImagesByKey = new Map();

function readFieldImages(key) {
    if (!key) return undefined;
    return fieldImagesByKey.get(key);
}

function writeFieldImages(key, images) {
    if (!key) return;
    fieldImagesByKey.set(key, images || []);
}

function clearFieldImages(prefix) {
    if (!prefix) return;
    if (prefix.endsWith(':')) {
        for (const key of [...fieldImagesByKey.keys()]) {
            if (key.startsWith(prefix)) fieldImagesByKey.delete(key);
        }
        return;
    }
    fieldImagesByKey.delete(prefix);
}

const inFlightUploadIds = new Set();
/** Module-level so abort/cancel survives ImagePicker remounts of the files field. */
const uploadAbortControllers = new Map();
const cancelledUploadIds = new Set();

function assetMimeType(asset) {
    if (asset?.mimeType) return asset.mimeType;
    if (asset?.type === 'video' || (typeof asset?.type === 'string' && asset.type.startsWith('video'))) {
        return 'video/mp4';
    }
    if (asset?.type === 'image' || (typeof asset?.type === 'string' && asset.type.startsWith('image'))) {
        return 'image/jpeg';
    }
    return undefined;
}

export default function (props) {
    
    const name = props.name;
    const persistKey = [props.form_name, name].filter(Boolean).join(':');
    const [message, setMessage] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [images, setImages] = useState(() => {
        if (persistKey && fieldImagesByKey.has(persistKey)) {
            return fieldImagesByKey.get(persistKey);
        }
        return props?.values_src;
    });
    const imageSource = { images };
    const setImageSource = (updater) => {
        setImages((prevImages) => {
            const prev = { images: prevImages ?? [] };
            const next = typeof updater === 'function' ? updater(prev) : updater;
            const nextImages = next?.images || [];
            if (persistKey) writeFieldImages(persistKey, nextImages);
            return nextImages;
        });
    };
    const formContext = useFormContext();
    const formValue = formContext.watch(name);
    const obfuscateFaces = formContext.watch('obfuscate_faces');
    const video_source = formContext.watch('video_source');
    const rules = getValidationRules(props);
    // Same as Form's default for the type (field-initial-values).
    const defaultValue = props?.values_src ? filesFieldValue(props.values_src) : '';
    const { field } = useFieldController({ name, rules, defaultValue });
    const bMultiple = props.multiple;
    const [hasPermissionCamera, requestPermissionCamera] = ImagePicker.useCameraPermissions();
    const [hasPermissionLibrary, requestPermissionLibrary] = ImagePicker.useMediaLibraryPermissions();
    const [cropSession, setCropSession] = useState(null);

    const isAutoGhosts = appSetting('forms', 'auto_ghosts_in_files')
    const formInstanceId = useFormInstanceId();
    const formName = props.form_name;

    useEffect(() => {
        if (!persistKey) return;
        if (!fieldImagesByKey.has(persistKey) && props?.values_src) {
            writeFieldImages(persistKey, props.values_src);
        }
    }, [persistKey, props?.values_src]);

    const url = useMemo(() => {
        return '/api.php?r=system/get_data_api/TemplUploaderServices/&params[]=&obfuscate_faces=' + obfuscateFaces + '&uo=' + (props.uploaders?.[0] ?? '') + '&so=' + props.storage_object + '&uid=' + genRnd(8) + '&img_trans=' + props.images_transcoder + '&m=' + (bMultiple ? 1 : 0) + '&c=' + props.content_id + '&p=' + (props.privacy ? 1 : 0);
    }, [obfuscateFaces, props.uploaders, props.storage_object, props.images_transcoder, props.content_id, props.privacy, bMultiple]);

    const getImageMergeKey = (img) => {
        // Preload items use hash; server ghosts often have no hash — use stable ids.
        // Never key on undefined: Map would collapse all existing files into one.
        if (img?.hash != null && img.hash !== '') return `hash:${img.hash}`;
        if (img?.file_id != null && img.file_id !== '') return `id:${img.file_id}`;
        if (img?.file_remote_id) return `remote:${img.file_remote_id}`;
        return null;
    };

    const setImageSourceN = (newImages, bMultipleFlag) => {
        if (!bMultipleFlag) {
            setImageSource({
                images: newImages
            });
            return;
        }
        setImageSource(prev => {
            const existingImages = prev?.images || [];

            const newImagesMap = new Map();
            for (const img of newImages) {
                const key = getImageMergeKey(img);
                if (key != null) newImagesMap.set(key, img);
            }

            // Replace preload (by hash) or keep existing; never match on missing keys
            const mergedImages = existingImages.map((img) => {
                const key = getImageMergeKey(img);
                return key != null && newImagesMap.has(key) ? newImagesMap.get(key) : img;
            });

            const existingKeys = new Set(
                existingImages.map(getImageMergeKey).filter((k) => k != null)
            );
            const newOnlyImages = newImages.filter((img) => {
                const key = getImageMergeKey(img);
                return key == null || !existingKeys.has(key);
            });

            return {
                ...prev,
                images: [...mergedImages, ...newOnlyImages]
            };
        });
    }

    const onUploadFinished = useCallback((payload) => {
        const hash = payload?.extraVar?.hash;
        const uploadId = payload?.extraVar?.uploadId || hash;
        const result = payload?.result;
        const ghost = result?.data?.ghost;
        const extraVar = payload?.extraVar || {};

        if (uploadId) {
            uploadAbortControllers.delete(uploadId);
            trackFormUploadEnd(formName, formInstanceId, uploadId);
        }

        revokePastedBlobUri(extraVar.pastedUri)

        // Explicit cancel (or aborted preload) must not hydrate a ghost into persist.
        if (uploadId && cancelledUploadIds.has(uploadId)) {
            cancelledUploadIds.delete(uploadId);
            return;
        }

        // Apply each completion immediately — do not funnel through a single
        // uploadFinished state (parallel uploads were overwriting each other).
        if (isAutoGhosts && ghost) {
            setImageSourceN([{ ...ghost, hash, inlinePaste: !!extraVar.inlinePaste }], bMultiple);
            const src = ghost.file_url || ghost.url || result?.data?.link
            if (extraVar.inlinePaste && src) {
                emitter.emit(EVENTS.editor, {
                    action: 'insert_inline_image',
                    form_name: formName,
                    src,
                    width: extraVar.width,
                    height: extraVar.height,
                })
            }
        } else if (isAutoGhosts) {
            // UNA rejected the file (wrong extension, size, …): drop the pending tile and say why.
            console.warn('[files] upload returned no ghost', result);
            setImageSource((prev) => ({
                ...prev,
                images: (prev?.images || []).filter((img) =>
                    uploadId ? img.uploadId !== uploadId : img.hash !== hash
                ),
            }));
            setUploadError(result?.error || i18n.t('Upload failed'));
        } else if (hash) {
            setImageSource((prev) => ({
                ...prev,
                images: (prev?.images || []).map((img) =>
                    img.hash === hash ? { ...img, preload: false } : img
                ),
            }));
        }
    }, [isAutoGhosts, bMultiple, formName, formInstanceId]);

    useEffect(() => {
        if (props.previewPlaceHolder) {
            props.previewPlaceHolder(name, GhostsList(imageSource.images, bMultiple, handleDelete, props));
        }
        // The form default already holds the ids of the saved files (values_src,
        // see field-initial-values): write only real changes — uploads, removals,
        // or uploads kept from an unsaved earlier session of this form.
        const fileIds = images ? filesFieldValue(images) : '';
        const mirror = images && FILES_FIELD_MIRRORS[name];
        if (mirror && formContext.getValues(mirror) !== fileIds) {
            formContext.setValue(mirror, fileIds);
        }
        if (formContext.getValues(name) !== fileIds) {
            field.onChange(fileIds);
        }
    }, [images]);

    const uploadImages = async (asset) => {
        const existing = persistKey
            ? (readFieldImages(persistKey) || [])
            : (imageSource.images ? imageSource.images : []);
        if (!asset) return existing;
        setUploadError(null);

        const objectsToAdd = [];

        const uploadOne = async (i, hash, uploadId) => {
            if (!uploadId || inFlightUploadIds.has(uploadId)) return;
            if (cancelledUploadIds.has(uploadId)) {
                trackFormUploadEnd(formName, formInstanceId, uploadId);
                return;
            }
            inFlightUploadIds.add(uploadId);
            const controller = new AbortController();
            uploadAbortControllers.set(uploadId, controller);
            const uri = i.uri;
            const mimeType = assetMimeType(i);
            const extraVar = {
                hash,
                uploadId,
                mimeType,
                fileName: i.fileName || i.name,
                inlinePaste: !!i.inlinePaste,
                width: i.width,
                height: i.height,
                pastedUri: i.uri,
            };
            const isImage =
                mimeType?.includes('image/') ||
                i?.type === 'image' ||
                (typeof i?.type === 'string' && i.type.startsWith('image'));

            const sendFile = (fileUri, fileMeta = extraVar) => uploadImage(
                fileUri,
                url + '&a=upload',
                onUploadFinished,
                fileMeta,
                {
                    signal: controller.signal,
                    onProgress: (fraction) => setUploadProgress(uploadId, fraction),
                }
            );

            try {
                if (cancelledUploadIds.has(uploadId) || controller.signal.aborted) {
                    trackFormUploadEnd(formName, formInstanceId, uploadId);
                    return;
                }
                if (isImage && i?.cropped) {
                    await sendFile(uri);
                } else if (isImage) {
                    await new Promise((resolve, reject) => {
                        ImageNative.getSize(
                            uri,
                            async (width, height) => {
                                try {
                                    if (cancelledUploadIds.has(uploadId) || controller.signal.aborted) {
                                        trackFormUploadEnd(formName, formInstanceId, uploadId);
                                        resolve();
                                        return;
                                    }
                                    let preparedUri = uri;
                                    try {
                                        const limits = getImageUploadLimits(formName);
                                        if (!limits.skip) {
                                            preparedUri = await prepareImageForUpload({
                                                uri,
                                                width,
                                                height,
                                                fileSizeBytes: i?.fileSize || i?.size,
                                                maxWidth: limits.maxWidth,
                                                maxHeight: limits.maxHeight,
                                                webpOverMb: limits.webpOverMb,
                                            });
                                        }
                                    } catch (prepareErr) {
                                        console.warn('[files] image prepare failed, uploading original:', prepareErr);
                                    }
                                    if (cancelledUploadIds.has(uploadId) || controller.signal.aborted) {
                                        trackFormUploadEnd(formName, formInstanceId, uploadId);
                                        resolve();
                                        return;
                                    }
                                    const preparedMeta = preparedUri === uri
                                        ? extraVar
                                        : { ...extraVar, mimeType: undefined, fileName: undefined };
                                    await sendFile(preparedUri, preparedMeta);
                                    resolve();
                                } catch (err) {
                                    reject(err);
                                }
                            },
                            () => {
                                sendFile(uri).then(resolve).catch(reject);
                            }
                        );
                    });
                } else {
                    await sendFile(uri);
                }
            } catch (err) {
                revokePastedBlobUri(extraVar.pastedUri)
                if (err?.aborted || err?.name === 'AbortError') {
                    trackFormUploadEnd(formName, formInstanceId, uploadId);
                } else {
                    console.error('[files] upload failed:', err);
                    // Keep the preview — ImagePicker over a modal remounts the form and
                    // aborting the first attempt used to strip the attachment.
                    trackFormUploadEnd(formName, formInstanceId, uploadId);
                }
            } finally {
                inFlightUploadIds.delete(uploadId);
                uploadAbortControllers.delete(uploadId);
                clearUploadProgress(uploadId);
            }
        };

        // Register every pending slot synchronously first, then kick off uploads
        // without awaiting — preloads return immediately, submit stays disabled
        // until each uploadId gets upload_end.
        for (const i of asset) {
            const uri = i.uri;
            const hash = i.resumeHash || md5(uri);
            const uploadId = i.resumeUploadId || `${hash}:${genRnd(8)}`;
            if (!i.resumeUploadId) {
                objectsToAdd.push({
                    preload: true,
                    file_type: assetMimeType(i),
                    type: i.type,
                    fileName: i.fileName || i.name,
                    fileSize: i.fileSize || i.size,
                    hash,
                    uploadId,
                    uri,
                    inlinePaste: !!i.inlinePaste,
                });
            }
            // If this uploadId is already flying (ImagePicker remount resume),
            // do not re-start the pending marker — the original completion will
            // end it. Re-starting after clearFormPendingUploads would stick
            // Publish on a new useId forever.
            if (!inFlightUploadIds.has(uploadId) && !cancelledUploadIds.has(uploadId)) {
                trackFormUploadStart(formName, formInstanceId, uploadId);
            }
            void uploadOne(i, hash, uploadId);
        }

        if (!objectsToAdd.length) return existing;
        const next = bMultiple ? [...existing, ...objectsToAdd] : [...objectsToAdd];
        if (persistKey) writeFieldImages(persistKey, next);
        return next;
    }

    const finishPickedAssets = useCallback(async (assets) => {
        if (!assets?.length) return;
        const kind = getImageCropKind(name);
        const asset = assets[0];

        if (kind && !shouldSkipImageCrop(formName) && asset && !asset.cropped && !isSvgAsset(asset)) {
            const size = await getAssetImageSize(asset);
            if (size) {
                setCropSession({
                    assets,
                    asset,
                    uri: asset.uri,
                    width: size.width,
                    height: size.height,
                    kind,
                });
                return;
            }
        }

        const k = await uploadImages(assets);
        setImageSourceN(k, bMultiple);
    }, [name, bMultiple, formName]);

    const handleCropCancel = useCallback(() => {
        setCropSession(null);
    }, []);

    const handleCropConfirm = useCallback(async ({ uri }) => {
        const session = cropSession;
        if (!session) return;
        const croppedAsset = {
            ...session.asset,
            uri,
            cropped: true,
            width: undefined,
            height: undefined,
            fileSize: undefined,
        };
        setCropSession(null);
        const k = await uploadImages([croppedAsset]);
        setImageSourceN(k, bMultiple);
    }, [cropSession, bMultiple]);

    // Media the feed composer picked before opening this form (pending-field-assets).
    useEffect(() => {
        const queued = takeFieldAssets(name);
        if (queued?.length) void finishPickedAssets(queued);
    }, [name, finishPickedAssets]);

    const resumedUploads = useRef(false);
    useEffect(() => {
        if (!persistKey || resumedUploads.current || !images?.length) return;
        const pending = images.filter((img) => img.preload && img.uri && !img.file_id && img.uploadId);
        if (!pending.length) return;
        resumedUploads.current = true;
        void uploadImages(pending.map((img) => ({
            uri: img.uri,
            mimeType: img.file_type,
            type: img.type,
            fileName: img.fileName,
            fileSize: img.fileSize,
            resumeUploadId: img.uploadId,
            resumeHash: img.hash,
        })));
    }, [images, persistKey]);

    const selectImage1 = useCallback(async (type, bIsMedia, mediaTypesOverride) => {
        const extAllow = props.ext_allow ?? '';

        if (bIsMedia) {
            const mediaTypes = mediaTypesOverride?.length
                ? mediaTypesOverride
                : resolvePickerMediaTypes(name, extAllow, type);

            let result = null;

            if (type != 'camera') {
                if (!hasPermissionLibrary?.granted) {
                    const permission = await requestPermissionLibrary();
                    if (!permission?.granted) {
                        showPermissionAlert('library', permission?.canAskAgain);
                        return;
                    }
                }

                result = await ImagePicker.launchImageLibraryAsync(
                    getImagePickerOptions(mediaTypes, bMultiple)
                );
            } else {
                if (!hasPermissionCamera?.granted) {
                    const permission = await requestPermissionCamera();
                    if (!permission?.granted) {
                        showPermissionAlert('camera', permission?.canAskAgain);
                        return;
                    }
                }

                result = await ImagePicker.launchCameraAsync(
                    getImagePickerOptions(mediaTypes, bMultiple)
                );
            }

            if (!result?.canceled && result?.assets?.length) {
                const goodAssets = result.assets.filter(
                    asset => !asset.uri.startsWith('data:application/octet-stream')
                );
                if (goodAssets.length !== result.assets.length) {
                    setMessage('Some files are not supported.');
                }
                await finishPickedAssets(goodAssets);
            }
        } else {
            try {
                // Web `accept` understands extensions; native pickers only take MIME types.
                const allowList = splitExtList(extAllow);
                const result = await DocumentPicker.getDocumentAsync({
                    type: Platform.OS === 'web' && allowList.length ? allowList.map((e) => '.' + e) : '*/*',
                    multiple: true
                });

                if (!result.canceled && result.assets?.length) {
                    const allowed = result.assets.filter(
                        (asset) => isExtAllowed(asset.name || asset.fileName, extAllow, props.ext_deny)
                    );
                    if (allowed.length !== result.assets.length) {
                        setMessage('Some files are not supported.');
                    }
                    if (allowed.length) {
                        await finishPickedAssets(allowed);
                    }
                }
            } catch (err) {
                console.error('Error picking document:', err);
            }
        }
    }, [name, props.ext_allow, props.ext_deny, bMultiple, hasPermissionCamera, hasPermissionLibrary, requestPermissionCamera, requestPermissionLibrary, finishPickedAssets]);

    const selectImage = useCallback(async (source, mediaTypesOverride) => {
        try {
            const extAllow = props.ext_allow ?? '';
            const extDeny = props.ext_deny ?? '';
            const type = resolvePickerSource(source, props.source ?? 'library');
            let bIsMedia = shouldUseMediaPicker(name, extDeny, extAllow);
            // Camera always shoots photos; the library button follows the storage rules.
            if (STORAGE_DRIVEN_FIELD_NAMES.has(name) && type !== 'camera' && !mediaTypesOverride?.length) {
                const kind = getStoragePickerKind(extAllow);
                bIsMedia = kind !== 'any';
                if (kind === 'media') mediaTypesOverride = ['images', 'videos'];
            }

            if (Platform.OS === 'web' || !bIsMedia) {
                await selectImage1(type, bIsMedia, mediaTypesOverride);
                return;
            }

            if (type === 'camera') {
                if (typeof requestPermissionCamera !== 'function') {
                    throw new Error('requestPermissionCamera is not available');
                }
                const permission = hasPermissionCamera?.granted
                    ? hasPermissionCamera
                    : await requestPermissionCamera();
                if (permission?.granted) {
                    await selectImage1('camera', bIsMedia, mediaTypesOverride);
                } else {
                    showPermissionAlert('camera', permission?.canAskAgain);
                }
                return;
            }

            if (typeof requestPermissionLibrary !== 'function') {
                throw new Error('requestPermissionLibrary is not available');
            }
            const permission = hasPermissionLibrary?.granted
                ? hasPermissionLibrary
                : await requestPermissionLibrary();
            if (permission?.granted) {
                await selectImage1('library', bIsMedia, mediaTypesOverride);
            } else {
                showPermissionAlert('library', permission?.canAskAgain);
            }
        } catch (err) {
            console.error('[files] selectImage failed:', err);
            Alert.alert(i18n.t('Upload error'), err?.message ?? i18n.t('Could not open media picker.'));
        }
    }, [name, props.ext_deny, props.ext_allow, props.source, hasPermissionCamera, hasPermissionLibrary, requestPermissionCamera, requestPermissionLibrary, selectImage1]);

    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.fieldFiles(name), (data) => {
            if (data.action == 'add') {
                // Let the composer Plus remount finish before presenting a picker.
                setTimeout(() => selectImage(data.source, data.mediaTypes), 50);
            }
            if (data.action == 'clear') {
                setImageSource({ images: [] });
            }
        });
        return () => {
            subscription.remove();
        };
    }, [name, selectImage]);

    useEffect(() => {
        // "Close without saving": forget the uploads kept for remounts, or they
        // come back (and make the form dirty) when the form is opened again.
        const subscription = emitter.addListener(EVENTS.unsavedFormDiscard, (data) => {
            if (!formInstanceId || !data?.formInstanceIds?.includes(formInstanceId)) return;
            clearFieldImages(persistKey);
            setImages(props?.values_src);
        });
        return () => subscription.remove();
    }, [formInstanceId, persistKey]);

    const awaitingSubmitRef = useRef(false);
    useEffect(() => {
        if (!formName) return undefined;
        const acceptsPastedImages = !!(
            props.asDefaultStorage || IMAGE_FIELD_NAMES.has(name)
        );
        const resetImages = () => {
            clearFieldImages(`${formName}:`);
            setImages(props?.values_src);
        };
        const subscription = emitter.addListener(EVENTS.form(formName), (data) => {
            if (data.action == 'submited') {
                // Wait for UNA's reply: on validation errors the uploaded files must stay.
                if (data.awaitsResponse) awaitingSubmitRef.current = true;
                else resetImages();
            }
            if (data.action == 'received' && awaitingSubmitRef.current) {
                awaitingSubmitRef.current = false;
                // No data = request failed; keep the files so the user can retry.
                if (data.data !== undefined && !formResponseHasFieldErrors(data.data)) resetImages();
            }
            if (data.action == 'pasted_images' && acceptsPastedImages && data.images?.length) {
                const inlinePaste = typeof data.inlinePaste === 'boolean' ? data.inlinePaste : isInlineImagePaste(formName)
                const assets = data.images.map((img) => ({ ...img, inlinePaste }))
                uploadImages(assets).then((k) => setImageSource({ images: k }));
            }
        });
        return () => {
            subscription.remove();
        };
    }, [formName, name, props.asDefaultStorage]);

    const handleDelete = useCallback(async (target) => {
        const isObj = target != null && typeof target === 'object';
        const fileId = isObj ? target.file_id : target;
        const uploadId = isObj ? target.uploadId : null;
        const hash = isObj ? target.hash : null;

        // Preload cancel: end pending flag + abort network (file_id is still missing).
        if (uploadId) {
            cancelledUploadIds.add(uploadId);
            const controller = uploadAbortControllers.get(uploadId);
            if (controller) {
                try {
                    controller.abort();
                } catch {
                    // ignore
                }
                uploadAbortControllers.delete(uploadId);
            }
            inFlightUploadIds.delete(uploadId);
            trackFormUploadEnd(formName, formInstanceId, uploadId);
        }

        setImageSource(prev => ({
            ...prev,
            images: (prev.images || []).filter((item) => {
                if (isObj) {
                    if (uploadId && item.uploadId === uploadId) return false;
                    if (fileId != null && fileId !== '' && item.file_id === fileId) return false;
                    if ((fileId == null || fileId === '') && hash && item.hash === hash) return false;
                    return true;
                }
                return item.file_id !== target;
            }),
        }));

        if (fileId != null && fileId !== '') {
            await fetcher(url + "&a=delete&id=" + fileId);
        }
    }, [url, formName, formInstanceId]);

    const handleDeleteSingle = useCallback(async (target) => {
        await handleDelete(target);
    }, [handleDelete]);


    // may be need improve in future
    if (video_source == 'embed')
        return null;

    // Mounted only while a crop session is open so the lazy chunk is not fetched upfront.
    const cropModal = cropSession ? (
        <ImageCropModal
            visible={!!cropSession}
            uri={cropSession?.uri}
            sourceWidth={cropSession?.width}
            sourceHeight={cropSession?.height}
            kind={cropSession?.kind || 'picture'}
            module={formName}
            fileSizeBytes={cropSession?.asset?.fileSize || cropSession?.asset?.size}
            onCancel={handleCropCancel}
            onConfirm={handleCropConfirm}
        />
    ) : null;

    if (props.view == 'button') {
        return <>
            {cropModal}
            <ButtonCover imageSource={imageSource} selectImage={selectImage} />
        </>
    }
    if (props.view == 'preview') {
        return <>
            {cropModal}
            {imageSource?.images?.length > 0 ? <ActionButton onSelectAssets={finishPickedAssets} uploadImages={uploadImages} imagesList={imageSource.images} bMultiple={bMultiple} props={props} selectImage={selectImage} handleDelete={handleDelete} />
                : <></>}
        </>
    }
    if (props.list_only){
        return GhostsList(imageSource.images, bMultiple, handleDelete, props);
    }
    return (
        <Field {...props} error={uploadError || props.error} error2={formContext.formState.errors[name]}>
            {cropModal}
            <Msg onVisible={message} title={message} handleOk={() => { setMessage(false) }} />
            {!props.hide_button && <View>
                <ActionButton onSelectAssets={finishPickedAssets} uploadImages={uploadImages} imagesList={imageSource.images} props={props} bMultiple={bMultiple} selectImage={selectImage} handleDelete={handleDeleteSingle} />
            </View>}
            {!!props.hide_button && <Row className='flex-wrap gap-1'>{GhostsList(imageSource.images, bMultiple, handleDelete, props)}</Row>}
        </Field>
    );
}

function ActionButton({ imagesList, props, selectImage, handleDelete, bMultiple, uploadImages, onSelectAssets }) {
    const { t } = useTranslation()
    const drop = useRef(null);
    const iconMap = {
        photo: "Image",
        cmt_image: "Image",
        pictures: "Image",
        video: "Image",
        videos: "Image",
        files: "Paperclip",
        file: "Paperclip",
        sounds: "FileAudio"
    };

    let sIcon = iconMap[props.name] || "Plus";
    let sTitle = sIcon === "Plus" ? t("Select " + props.name) : "";
    if (props.source == 'camera') {
        sIcon = 'Camera';
    }

    useEffect(() => {
        if (drop.current && Platform.OS === 'web') {
            drop.current.addEventListener('dragover', handleDragOver);
            drop.current.addEventListener('drop', handleDrop);
            return () => {
                if (drop.current) {
                    drop.current.removeEventListener('dragover', handleDragOver);
                    drop.current.removeEventListener('drop', handleDrop);
                }
            };
        }
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const { files } = e.dataTransfer;

        if (files && files.length) {
            if (files && files.length) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const picked = [{ uri: event.target.result }];
                    if (onSelectAssets) {
                        await onSelectAssets(picked);
                    } else {
                        await uploadImages(picked);
                    }
                };
                reader.readAsDataURL(files[0]);
            }
        }
    };
    const sLabel = props.title ? props.title : sTitle;
    const sTooltip = t("Add " + props.name);
    let button = <NeoButton
        {...legacyToNeoButtonProps({
            variant: props.variant || 'text',
            size: props.size || 'base',
            rounded: props.rounded,
            title: sLabel,
            startDecorator: props.icon ? props.icon : sIcon,
            tooltip: sTooltip,
        })}
        accessibilityLabel={sLabel || sTooltip}
        onPress={() => selectImage(props.source ?? 'library')}
    />

    if (!bMultiple || props.useSingle) {
        let img = (imagesList || []).find((item) => !item?.inlinePaste) || null;
        if (!img && props.useUrl) {
            img = { file_url: props.value, file_type: "image/jpeg" };
        }
        let w = 'web:w-full ' + getCoverAspectClass(props.form_name);

        const isPictureField = props.name == 'picture' || props.name == 'avatar' || props.name == 'badge';
        if (props.name == 'picture' || props.name == 'avatar')
            w = 'w-48 h-48 overflow-hidden rounded-full';
        if (props.name == 'badge')
            w = 'w-18 h-18 overflow-hidden rounded-full';

        if (!props.viewClasses) {
            w += isPictureField
                ? ' bg-input border-border overflow-hidden'
                : ' bg-input border-border rounded-xl overflow-hidden'
        }
        else {
            w += ' ' + props.viewClasses
        }

        const isImage = img?.file_type?.includes('image/');
        const isPreload = img?.preload;

        button = (
            <Pressable onPress={() => selectImage(props.source ?? 'library')} >
                <View className={`qq ${w} native:max-w-full items-center justify-center bg-input `}>
                      {(!img || !img?.file_url) && (<View ref={drop} className={`ss ${w} text-muted-foreground/50 text-lg flex-auto w-full border-border  justify-center flex-col border border-dashed text-center`}>
                        <Text className='text-muted-foreground/50 text-lg justify-center flex-col text-center'>
                            {props?.placeholder || CaptionForFileInput(props)}
                        </Text>
                    </View>)}
                    {img != null && (<>
                        {(isImage && (img.uri || img.file_url)) && <ImageRN
                            source={{ uri: img.uri || img.file_url }}
                            style={{ width: '100%', height: '100%', opacity: isPreload ? 0.5 : 1 }}
                            resizeMode="cover"
                            view="cover"
                            alt=""
                        />}
                        {isPreload && <View className="absolute inset-0 items-center justify-center bg-background/50"><UploadProgress uploadId={img.uploadId} size={64} /></View>}
                        <View className='absolute top-1 right-1'>
                            <NeoButton
                                style="glass"
                                controlSize="mini"
                                borderShape="circle"
                                image="X"
                                accessibilityLabel={t('Close')}
                                onPress={() => handleDelete(img)}
                            />
                        </View>
                    </>)
                    }
                </View>
            </Pressable>
        );
    }
    return button;
}

function GhostsList(imagesList, bMultiple, handleDelete, props) {
    const visible = (imagesList || []).filter((img) => !img?.inlinePaste)
    if (!visible.length || props.name === 'cover' || props.name === 'picture') {
        return null;
    }

    const isCover = props.preview === "cover";

    const sizes = [
        isCover ? "w-full h-[30vh] mb-4 sm:rounded-xl" : "h-20 aspect-video mt-2 mr-2 rounded-lg",
        " justify-center items-center overflow-hidden bg-muted  ",
    ].join(" ");

    return visible.map((img, index) => {
        const isImage = img?.file_type?.includes('image/');
        const isVideo = img?.file_type?.includes('video/');
        const isPreload = img?.preload;
        return (
            <View
                key={`file-${props.name}-${index}`}
                className={`${sizes}`}
            >
                {isImage ? <ImageRN
                    source={{ uri: img.uri || img.file_url }}
                    style={{ width: '100%', height: '100%', opacity: isPreload ? 0.5 : 1 }}
                    resizeMode="cover"
                    view="cover"
                    alt=""
                /> : (

                    isVideo ? (
                        <Video src={img.uri || img.file_url} fill cover previewTime={3} />
                    ) : (
                        <View className="h-16 w-16 text-muted-foreground  items-center justify-center"><Icon icon="File" className="w-9 h-9" size={36} /></View>
                    )

                )}

                {isPreload && <View className="absolute inset-0 items-center justify-center bg-background/50"><UploadProgress uploadId={img.uploadId} /></View>}

                <View className="absolute top-1 right-1">
                    <NeoButton
                        style="glass"
                        controlSize="mini"
                        borderShape="circle"
                        image="X"
                        accessibilityLabel={i18n.t('Close')}
                        onPress={() => handleDelete(img)}
                    />
                </View>

            </View>
        );
    });
}

function ButtonCover({ imageSource, selectImage }) {
    const { t } = useTranslation();
    let imagesList = imageSource.images;
    let img = imagesList && imagesList.find(item => item.preload === true)
    let isImages = imagesList && imagesList.find(item => item.preload !== true)

    return !isImages && <NeoButton
        label={t('Add Cover')}
        image="Image"
        loading={!!img?.preload}
        controlSize="mini"
        onPress={() => selectImage('library')}
    />
}
