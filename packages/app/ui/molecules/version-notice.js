import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from 'app/ui/molecules/card';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';

export function VersionIncompatible({ serverVersion }) {
    const { t } = useTranslation();
    const minVersion = appSetting('config', 'min_server_version');
    const appVersion = appSetting('config', 'app_version');

    return (
        <View className={`${appSetting('layout', 'page_content_width_default')} ${appSetting('layout', 'page_content_padding_default')} lg:flex-row mx-auto my-auto`}>
            <View className="max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto gap-y-4">
                <View>
                    <Card padding="p-6  ">
                        <CardHeader>
                            <CardTitle>{t('version_incompatible_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="gap-4">
                            <Text>
                                {t('version_incompatible_text1', { version: appVersion })}
                            </Text>
                            <Text>
                                {t('version_incompatible_text2', { version: serverVersion, min_version: minVersion })}
                            </Text>
                            <Text>
                                {t('version_incompatible_text3')}
                            </Text>
                        </CardContent>
                    </Card>
                </View>
            </View>
        </View>
    );
}

export function VersionWarning({ serverVersion }) {
    const { t } = useTranslation();
    const appVersion = appSetting('config', 'app_version');
    const maxVersion = appSetting('config', 'stable_server_version');

    return (
        <View className="fixed bottom-16 left-5">
            <DropdownPopup
                open={true}
                minPopupWidth={320}
                trigger={
                    <Button
                        key="btn"
                        variant="danger"
                        size="base"
                        rounded
                        startDecorator="TriangleAlert"
                    />
                }
            >
                <View className="gap-2">
                    <Text className="text-xs text-secondary-foreground font-medium">
                        {t('version_warning_title')}
                    </Text>
                    <Text className="text-xs text-secondary-foreground ">
                        {t('version_warning_text1', { version: appVersion, server_version: serverVersion })}
                    </Text>
                    <Text className="text-xs text-secondary-foreground ">
                        {t('version_warning_text2', { version: maxVersion })}
                    </Text>
                    <Text className="text-xs text-secondary-foreground ">
                        {t('version_warning_text3')}
                    </Text>
                </View>
            </DropdownPopup>
        </View>
    );
}
