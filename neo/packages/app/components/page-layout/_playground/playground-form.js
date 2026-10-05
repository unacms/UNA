'use client';

import { Suspense, useCallback, useState } from 'react';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls';
import Form from 'app/components/form';
import {
    PLAYGROUND_FORM_NAME,
    createPlaygroundFormData,
} from './playground-form-data';

function formDataToPlain(formData) {
    const out = {};
    if (!formData) return out;

    if (typeof formData.entries === 'function') {
        for (const [key, value] of formData.entries()) {
            if (key in out) {
                const prev = out[key];
                out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
            } else {
                out[key] = value;
            }
        }
        return out;
    }

    if (Array.isArray(formData._parts)) {
        for (const part of formData._parts) {
            const key = part?.[0];
            if (key == null) continue;
            out[key] = part[1];
        }
    }

    return out;
}

function serializeDump(value) {
    try {
        return JSON.stringify(
            value,
            (_key, item) => {
                if (typeof File !== 'undefined' && item instanceof File) {
                    return {
                        $file: true,
                        name: item.name,
                        size: item.size,
                        type: item.type,
                    };
                }
                return item;
            },
            2
        );
    } catch {
        return String(value);
    }
}

function DumpPanel({ dump, onClear }) {
    const empty = !dump;
    const json = empty
        ? '// Submit the form above.\n// This is what Form would POST (RHF values + FormData).'
        : serializeDump(dump.payload);

    return (
        <View className="w-full gap-2 rounded-xl border border-border bg-card p-4">
            <Row className="items-center justify-between gap-2">
                <View className="flex-1 gap-0.5">
                    <Text className="text-base font-semibold text-foreground">
                        Posted payload
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        {empty
                            ? 'Submit the form above to capture the payload'
                            : `Submitted ${dump.at}`}
                    </Text>
                </View>
                {empty ? null : (
                    <NeoButton
                        label="Clear"
                        style="bordered"
                        controlSize="mini"
                        onPress={onClear}
                    />
                )}
            </Row>
            <View className="rounded-lg border border-border/60 bg-muted/40">
                <Text
                    selectable
                    className="p-3 font-mono text-xs leading-5 text-foreground"
                >
                    {json}
                </Text>
            </View>
        </View>
    );
}

export default function PlaygroundForm() {
    const [dump, setDump] = useState(null);
    const [formData] = useState(createPlaygroundFormData);

    const onFormSubmit = useCallback((postedFormData, values) => {
        setDump({
            at: new Date().toISOString(),
            payload: {
                values,
                formData: formDataToPlain(postedFormData),
            },
        });
    }, []);

    const onClear = useCallback(() => setDump(null), []);

    return (
        <View className="w-full gap-6">
            <View className="gap-1">
                <Text className="text-2xl font-semibold text-foreground">
                    Form fields (UNA JSON)
                </Text>
                <Text className="text-sm text-muted-foreground">
                    Same `Form` as production, fed from synthetic JSON at
                    /pg/form. Submit stays local — the payload emulator
                    is below the form. Fixtures live in playground-form-data.js.
                </Text>
            </View>

            <Suspense fallback={null}>
                <Form
                    data={formData}
                    name={PLAYGROUND_FORM_NAME}
                    onFormSubmit={onFormSubmit}
                    exProps={{ skipUnsavedCloseGuard: true }}
                />
            </Suspense>

            <DumpPanel dump={dump} onClear={onClear} />
        </View>
    );
}
