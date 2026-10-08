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

/**
 * Opens the photo library outside a files field and returns the picked assets
 * (empty when cancelled or denied). Call it straight from a press handler: on
 * web the file dialog only opens while the click still counts as a user
 * gesture, so nothing may be awaited before it.
 */
export async function pickLibraryMedia(mediaTypes: PickerMediaType[], bMultiple = true): Promise<ImagePicker.ImagePickerAsset[]> {
    if (Platform.OS !== 'web') {
        const current = await ImagePicker.getMediaLibraryPermissionsAsync();
        const permission = current.granted ? current : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            showPermissionAlert('library', permission.canAskAgain);
            return [];
        }
    }

    const result = await ImagePicker.launchImageLibraryAsync(getImagePickerOptions(mediaTypes, bMultiple));
    if (result.canceled || !result.assets?.length)
        return [];

    return result.assets.filter((asset) => !asset.uri.startsWith('data:application/octet-stream'));
}
