import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Time from 'app/ui/atoms/time'
import Html from 'app/ui/atoms/html'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'
import ProfilesList from 'app/ui/molecules/profile_list'
import Link from 'app/ui/atoms/link'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementEntityInfo({ data, blockWrapperProps }) {
    const defaultIcon = appSetting('entry', 'default_info_icon');
    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key]
        const v = a.values ? a.values[a.value] : a.value
        if (v) {
            if (a.type) {
                let value = getValue(a);
                if (value) {
                    return (
                        <View className={(a.type != 'textarea' ? 'flex-row items-center ' : '') + " gap-2"} key={a.name}>
                            <Row className="items-center ">
                                <View className="text-secondary-foreground overflow-hidden items-center justify-center w-6 h-6">{getIcon(a)}</View>
                                <View className={`${defaultIcon ? "ml-2" : ''} `}>
                                    <Text className="font-bold text-base text-card-foreground ">
                                        {a.caption}
                                    </Text>
                                </View>
                            </Row>
                            <View className="flex-1">
                                {getValue(a)}
                            </View>
                        </View>
                    )
                }
            } else {
                return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
            }
        }
    })

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='gap-3'>
                {inputs}
            </View>
        </BlockWrapper>
    )

    function getValue(a) {
        function isUrl(str) {
            if (typeof str !== 'string' || !str.trim()) return false;

            const value = str.trim();

            // 1. Сначала пробуем как есть
            try {
                const url = new URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (e) {
                // 2. Если нет протокола — пробуем добавить https://
                try {
                    const url = new URL('https://' + value);
                    return url.hostname.includes('.');
                } catch (e2) {
                    return false;
                }
            }
        }

        const getHandleForDisplay = (input) => {
            if (typeof input !== 'string') return input;

            const original = input;
            let value = input.trim();
            if (!value) return original;

            if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)) {
                value = 'https://' + value;
            }

            try {
                const url = new URL(value);

                let hostname = url.hostname.toLowerCase();
                hostname = hostname.replace(/^(www|m)\./, '');

                const pathSegments = url.pathname.split('/').filter(Boolean);
                if (pathSegments.length === 0) return original;

                const firstSegment = decodeURIComponent(pathSegments[0]);

                const getSlug = (segment) => {
                    if (!segment) return null;
                    const cleaned = segment.replace(/^@/, '').trim();
                    return cleaned || null;
                };

                const isTwitter =
                    hostname === 'twitter.com' || hostname.endsWith('.twitter.com');
                const isX = hostname === 'x.com' || hostname.endsWith('.x.com');
                const isInstagram =
                    hostname === 'instagram.com' || hostname.endsWith('.instagram.com');
                const isGithub =
                    hostname === 'github.com' || hostname.endsWith('.github.com');
                const isLinkedIn =
                    hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
                const isTikTok =
                    hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com');
                const isFacebook =
                    hostname === 'facebook.com' || hostname.endsWith('.facebook.com');
                const isYouTube =
                    hostname === 'youtube.com' ||
                    hostname.endsWith('.youtube.com') ||
                    hostname === 'youtu.be';

                // Twitter / X / Instagram → @username
                if (isTwitter || isX || isInstagram) {
                    const slug = getSlug(firstSegment);
                    return slug ? `@${slug}` : original;
                }

                // GitHub → username
                if (isGithub) {
                    const slug = getSlug(firstSegment);
                    return slug ?? original;
                }

                // LinkedIn → slug
                if (isLinkedIn) {
                    const [first, second] = pathSegments;
                    let slug = null;

                    if (first === 'in' && second) slug = getSlug(second);
                    else if (first === 'company' && second) slug = getSlug(second);
                    else if (first === 'school' && second) slug = getSlug(second);

                    return slug ?? original;
                }

                // TikTok → @username
                if (isTikTok) {
                    const slug = getSlug(firstSegment);
                    return slug ? `@${slug}` : original;
                }

                // Facebook → slug (обычно /pageusername)
                if (isFacebook) {
                    const slug = getSlug(firstSegment);
                    return slug ?? original;
                }

                // YouTube
                if (isYouTube) {
                    // youtu.be/VIDEO_ID → считаем ссылкой на видео
                    if (hostname === 'youtu.be') {
                        return original;
                    }

                    const [first, second] = pathSegments;

                    // /@handle → @handle
                    if (first && first.startsWith('@')) {
                        const slug = getSlug(first);
                        return slug ? `@${slug}` : original;
                    }

                    // /channel/UCxxxx  /user/Name  /c/CustomName → slug без @
                    if (
                        (first === 'channel' || first === 'user' || first === 'c') &&
                        second
                    ) {
                        const slug = getSlug(second);
                        return slug ?? original;
                    }

                    // /watch, /shorts, /live и прочие видео-ссылки → как есть
                    return original;
                }

                return original;
            } catch {
                return original;
            }
        };

        switch (a.type) {
            case 'datepicker':
            case 'datetime':
                if (isNaN(a.value)) {
                    a.value = (new Date(a.value) / 1000);
                }

                return <Time stylesName=" text-base text-label-secondary " ts={a.value}></Time>

            case 'select':
                if (a.value != 0 && a.value != '') {
                    const sel = a?.values?.find(item => item.key.toString() === a.value.toString())
                    return (
                        <Text className=" text-label-secondary text-base ">
                            {a.values ? (sel ? sel.value : a.values[a.value]) : a.value} {/* {a.values ? (a.values[a.value].value ? a.values[a.value].value : a.values[a.value]) : a.value}*/}
                        </Text>
                    )
                }
                return false

            case 'textarea':
                return <Html data={a.values ? a.values[a.value] : a.value} />

            case 'datepicker':
                var birthDate = new Date(a.value)
                var ageDifMs = Date.now() - birthDate.getTime()
                var ageDate = new Date(ageDifMs)
                return (
                    <Text className=" text-label-secondary text-base ">
                        {(Math.abs(ageDate.getUTCFullYear() - 1970)).toString()}
                    </Text>
                )

            case 'location':
                return <Text className=" text-label-secondary text-base ">
                    {a.value.location_string}
                </Text>

            case 'initial_members':
                return <ProfilesList
                    data={
                        a.value_data
                    }
                    showEmpty={false}
                    maxCount={3}
                    displaySize="xs"
                />


            case 'switcher':
                return <Text className=" text-label-secondary text-base ">
                    {a.value == 1 ? 'Yes' : 'No'}
                </Text>

            default:
                if (a.name == "profile_last_active") {
                    if (isNaN(a.value)) {
                        a.value = (new Date(a.value) / 1000);
                    }

                    return <Time stylesName=" text-base text-label-secondary " ts={a.value}></Time>
                }

                if (isUrl(a.value)) {
                    return (
                        <Link href={a.value} target="_blank">
                            <Text className=" text-label-secondary text-base   whitespace-normal break-words">
                                {getHandleForDisplay(a.value)}
                            </Text>
                        </Link>
                    )
                }

                return (
                    <Text className=" text-label-secondary text-base   whitespace-normal break-words">
                        {a.value}
                    </Text>
                )
        }
    }

    function getIcon(a) {
        if (a.icon) {
            return <Icon  icon={a.icon.charAt(0).toUpperCase() + a.icon.slice(1)} />
        }
        switch (a.name) {
            case 'gender':
                return <Icon icon="VenusAndMars" />

            case 'birthday':
                return <Icon icon="Cake" />

            case 'fullname':
                return <Icon icon="FileBadge2" />

            default:
                return defaultIcon ? <Icon icon={defaultIcon} /> : <></>
        }
    }
}
