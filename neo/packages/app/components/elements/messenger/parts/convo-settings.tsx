import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import Switch from 'app/ui/atoms/switcher';
import { fetcher } from 'app/lib/fetcher';
import { playCue } from 'app/lib/sound';

export type ConvoSettingsData = {
    title?: string;
    options: { key: string; value: string }[];
    values: string[];
};

type ConvoSettingsProps = {
    lotId: string | number;
    settings: ConvoSettingsData;
    onSaved: () => void;
    onError: (message: string) => void;
};

/** Actions participants may perform in a conversation (UNA `bx_messenger/get_convo_settings`). */
export default function ConvoSettings({ lotId, settings, onSaved, onError }: ConvoSettingsProps) {
    const { t } = useTranslation();
    const [values, setValues] = useState<string[]>(settings.values || []);
    const [saving, setSaving] = useState(false);

    const toggle = (key: string) => {
        setValues((prev) => (prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]));
    };

    const save = async () => {
        setSaving(true);
        try {
            const params = encodeURIComponent(JSON.stringify({ lot: lotId, options: values }));
            const response = await fetcher('/api.php?r=bx_messenger/save_convo_settings/Services&params=' + params);
            if (response?.data?.code == 0) {
                playCue('success', { emphasis: 'subtle' });
                onSaved();
            }
            else {
                playCue('error');
                onError(response?.data?.message || t('Error'));
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <View className="w-full gap-y-4 pb-4">
            {settings.title ? <Text className="text-muted-foreground text-base">{settings.title}</Text> : null}
            <View className="gap-y-3">
                {settings.options.map((option) => (
                    <Row key={option.key} className="items-center gap-x-3">
                        <Switch value={values.includes(option.key)} onValueChange={() => toggle(option.key)} />
                        <Text className="text-popover-foreground text-base">{option.value}</Text>
                    </Row>
                ))}
            </View>
            <Row className="justify-end">
                <NeoButton style="borderedProminent" controlSize="regular" loading={saving} label={t('Save')} onPress={save} />
            </Row>
        </View>
    );
}
