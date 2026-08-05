'use client'
import { View, ScrollView, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next'
import Profile from 'app/ui/molecules/profile'
import Badges from 'app/ui/molecules/badges'
import { MENTION_TYPE_LABELS } from 'app/lib/editor-mention-shared'

function MentionSuggestionItem({ user, selected, onSelect }) {
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
                {!!user.slug && (
                    <Text numberOfLines={1} className="text-xs text-muted-foreground">
                        {user.slug}
                    </Text>
                )}
            </View>
        </Pressable>
    )
}

/**
 * Shared mention suggestion list for tentap + enriched.
 * Render as a sibling of the editor surface (not inside overflow:hidden).
 */
export function MentionSuggestionsDropdown({
    suggestions,
    onSelect,
    dropdownRef,
    style,
    className = '',
}) {
    const { t } = useTranslation()
    if (!suggestions?.length) return null

    const showHeaders = new Set(suggestions.map((s) => s.type)).size > 1
    let lastType = null

    return (
        <View
            ref={dropdownRef}
            className={`absolute max-h-40 w-full max-w-md left-0 z-50 p-1 rounded-xl bg-popover shadow-card-outline dark:shadow-card-outline-deep ${className}`}
            style={style}
        >
            <ScrollView keyboardShouldPersistTaps="always">
                <View className="gap-0.5">
                    {suggestions.map((user) => {
                        const header =
                            showHeaders && user.type !== lastType ? (
                                <Text
                                    key={`h-${user.type}`}
                                    className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                                >
                                    {t(MENTION_TYPE_LABELS[user.type] || MENTION_TYPE_LABELS.other)}
                                </Text>
                            ) : null
                        lastType = user.type
                        return (
                            <View key={user.url || String(user.value)}>
                                {header}
                                <MentionSuggestionItem
                                    user={user}
                                    selected={user.selected}
                                    onSelect={() => onSelect(user)}
                                />
                            </View>
                        )
                    })}
                </View>
            </ScrollView>
        </View>
    )
}
