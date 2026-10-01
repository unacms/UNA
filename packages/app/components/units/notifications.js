import { memo, useState } from 'react';
import { Platform } from 'react-native';
import { View, Row } from 'app/design/view'
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile/profile';
import Html from 'app/ui/atoms/html';
import { Skeleton } from 'app/ui/atoms/skeleton';
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal'
import { appSetting, stripTags } from 'app/lib/util'
import { Text } from 'app/design/typography';

/**
 * Same row as the Messages conversation list (messenger/parts/item-convo.js):
 * 8px outside + 8px inside the highlight, a 44px avatar, time top-right.
 * The text runs on for up to 3 lines instead of title + snippet.
 */
function Unit({ data }) {
    const isSkeleton = data?.skeleton;
    const url = data?.content?.subentry_url_api ? data?.content?.subentry_url_api?.replace('{bx_url_root}', '') :
        (data?.content?.entry_url_api ? data?.content?.entry_url_api?.replace('{bx_url_root}', '') :
            data?.content?.entry_url?.replace('{bx_url_root}', ''));
    const content_parsed = (data?.content_parsed?.site || data?.content_parsed || '').replace('&#8230;', '...');
    const isShowPlainText = appSetting('notifications', 'show_plain_text');
    // Native has no :active for the inner Row, so track the press to show the
    // hover highlight while the finger is down (web keeps hover / :active).
    const [pressed, setPressed] = useState(false);
    const pressProps = Platform.OS === 'web' ? null : { onPressIn: () => setPressed(true), onPressOut: () => setPressed(false) };
    return (
        <LinkOrModal href={url} showInModal={data.type ? appSetting('browse', 'show_in_modal', data.type) : false} {...pressProps}>
            <View className="group w-full max-w-4xl mx-auto px-2 py-0.5 web:cursor-pointer">
                <Row className={`${pressed ? 'bg-muted/60 ' : ''}relative w-full overflow-hidden gap-3 rounded-xl px-2 py-2 web:group-hover:bg-muted/60 active:bg-muted/60 web:duration-200`}>
                    <View className="rounded-full flex-none bg-secondary mb-auto">
                        <Skeleton visible={isSkeleton} className="h-11 w-11 rounded-full">
                            <Profile {...data.author_data} displayType="unit_wo_info" displaySize="base" />
                        </Skeleton>
                    </View>
                    <Row className="flex-1 min-w-0 my-auto items-start gap-1">
                        <View className="flex-1 min-w-0">
                            <Skeleton visible={isSkeleton} className="h-3 w-full">
                                {isShowPlainText ? <Text className="text-sm leading-5 font-medium text-secondary-foreground web:group-hover:text-foreground line-clamp-3" numberOfLines={3}>{stripTags(content_parsed)}</Text> :
                                    <Html data={content_parsed} customClassName="u-vanilla-html-small text-sm leading-5 line-clamp-3" />
                                }
                            </Skeleton>
                        </View>
                        <Skeleton visible={isSkeleton} className="h-3 w-8">
                            <Time className="text-sm text-muted-foreground whitespace-nowrap" ts={data.date} />
                        </Skeleton>
                    </Row>
                </Row>
            </View>
        </LinkOrModal>
    );
}

export default memo(Unit);
