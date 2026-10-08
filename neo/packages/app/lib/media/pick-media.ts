import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';
import i18n from 'i18next';

export type PickerMediaType = 'images' | 'videos';

export function showPermissionAlert(type: 'camera' | 'library', canAskAgain?: boolean) {
    const isCamera = type === 'camera';
    const title = isCamera ? i18n.t('media_permission_camera_title') : i18n.t('media_permission_library_title');
    const message = canAskAgain === false
        ? i18n.t('media_permission_denied')
        : i18n.t('media_permission_required');

    const buttons: { text: string; style?: 'cancel'; onPress?: () => void }[] = [{ text: i18n.t('Cancel'), style: 'cancel' }];

    if (canAskAgain === false || Platform.OS === 'ios') {
        buttons.push({
            text: i18n.t('Open Settings'),
            onPress: () => Linking.openSettings(),
        });
    }

    Alert.alert(title, message, buttons, { cancelable: true });
}

/** The alert the files field shows when the picker itself fails. */
export function showPickerError(err: unknown) {
    const message = err instanceof Error ? err.message : undefined;
    Alert.alert(i18n.t('Upload error'), message ?? i18n.t('Could not open media picker.'));
}

export function getImagePickerOptions(mediaTypes: PickerMediaType[] | undefined, bMultiple: boolean): ImagePicker.ImagePickerOptions {
    const types = mediaTypes?.length ? mediaTypes : ['images' as const];
    const includesVideo = types.includes('videos');
    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: types,
        quality: 1,
        allowsMultipleSelection: Boolean(bMultiple),
    };

    if (Platform.OS === 'ios') {
        options.preferredAssetRepresentationMode = includesVideo
            ? ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible
            : ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current;
        if (includesVideo) {
            options.shouldDownloadFromNetwork = true;
        }
    }

    return options;
}

export type PickedMedia = {
    assets: ImagePicker.ImagePickerAsset[];
    /** Picks dropped as unreadable (`data:application/octet-stream`, as the files field drops them), or 1 when the picker rejected the selection. */
    unsupported: number;
};

/**
 * Opens the photo library outside a files field. Returns `null` when the user
 * cancels, denies access or the picker fails (the user gets the files field's
 * alert). Call it straight from a press handler: on web the file dialog only
 * opens while the click still counts as a user gesture, so nothing may be
 * awaited before it.
 */
export async function pickLibraryMedia(mediaTypes: PickerMediaType[], bMultiple = true): Promise<PickedMedia | null> {
    let result: ImagePicker.ImagePickerResult;
    try {
        if (Platform.OS !== 'web') {
            const current = await ImagePicker.getMediaLibraryPermissionsAsync();
            const permission = current.granted ? current : await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                showPermissionAlert('library', permission.canAskAgain);
                return null;
            }
        }
        result = await ImagePicker.launchImageLibraryAsync(getImagePickerOptions(mediaTypes, bMultiple));
    } catch (err) {
        // Web rejects the whole pick when any file isn't an image or video;
        // report that like the dropped picks below. Anything else is a failure.
        if (Platform.OS === 'web' && err instanceof Error && /unsupported file type/i.test(err.message))
            return { assets: [], unsupported: 1 };
        console.warn('[pick-media] library pick failed:', err);
        showPickerError(err);
        return null;
    }
    if (result.canceled || !result.assets?.length)
        return null;

    const assets = result.assets.filter((asset) => !asset.uri.startsWith('data:application/octet-stream'));
    return { assets, unsupported: result.assets.length - assets.length };
}
