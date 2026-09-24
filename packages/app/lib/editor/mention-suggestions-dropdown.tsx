'use client'
import { View, ScrollView, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next'
import Profile from 'app/ui/molecules/profile/profile'
import Badges from 'app/ui/molecules/profile/badges'
import { MENTION_TYPE_LABELS } from 'app/lib/editor/editor-mention-shared'

function MentionSuggestionItem({ user, selected, onSelect, typeLabel }: { user: any; selected?: boolean; onSelect: (item: any) => void; typeLabel?: string }) {
    const meta = [user.slug, typeLabel].filter(Boolean).join(' · ')
    return (
        <Pressable
            onPress={onSelect}
            className={`flex-row items-center gap-2 px-2 py-1.5 rounded-lg ${selected ? 'bg-accent/60' : 'web:hover:bg-muted'}`}
        >
            <View className="flex-none">
                <Profile
                    id={user.value}
                    display_name={user.label}
                    url_avatar={user.url_avatar}
                    displayType="unit_wo_info"
                    displaySize="sm"
                    showLinks={false}
                />
            </View>
            <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-1 min-w-0">
                    <Text numberOfLines={1} className="shrink min-w-0 text-sm font-medium text-card-foreground">
                        {user.label}
                    </Text>
                    {!!user.badges?.length && (
                        <View className="flex-none flex-row items-center">
                            <Badges badges={user.badges} size="2xs" />
                        </View>
                    )}
                </View>
                {!!meta && (
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                        {meta}
                    </Text>
                )}
            </View>
        </Pressable>
    )
}

/**
 * Shared mention suggestion list for tentap + enriched.
 * Prefer `position: fixed` + viewport coords from the editor so card/feed
 * overflow:hidden cannot clip the list. Falls back to absolute in-container.
 */
export function MentionSuggestionsDropdown({
    suggestions,
    onSelect,
    dropdownRef,
    style,
    className = '',
}: { suggestions: any; onSelect: (item: any) => void; dropdownRef?: any; style?: any; className?: string }) {
    const { t } = useTranslation()
    if (!suggestions?.length) return null

    return (
        <View
            ref={dropdownRef}
            className={`absolute left-0 w-full max-h-40 max-w-md z-[100] p-1 rounded-xl bg-popover shadow-card-outline dark:shadow-card-outline-deep ${className}`}
            style={style}
        >
            <ScrollView keyboardShouldPersistTaps="always">
                <View className="gap-0.5">
                    {suggestions.map((user: any) => (
                        <MentionSuggestionItem
                            key={user.url || String(user.value)}
                            user={user}
                            selected={user.selected}
                            typeLabel={t((MENTION_TYPE_LABELS[user.type] || MENTION_TYPE_LABELS.other)!)}
                            onSelect={() => onSelect(user)}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}
