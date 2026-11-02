import { View, Pressable, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { useState, useRef } from 'react'
import { NeoButton, NeoButtonLink } from 'app/design/controls'
import { Text } from 'app/design/typography'
import Profile from 'app/ui/molecules/profile/profile'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from 'app/lib/fetcher';
import { useFetch } from 'app/lib/hooks/use-fetch';
import Redirect from 'app/ui/atoms/redirect';
import { useTranslation } from 'react-i18next';
import { Modal } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'
import RadioButton from 'app/ui/atoms/radiobutton'

/**
 * Children mode: the Pressable host owns the press, so `accessibilityLabel` names
 * it (a passive NeoButton inside drops its own). Callers pass `u-neo-btn-link`
 * (+ `hit-area-4` small / `hit-area-8` mini) in `className` for the ring and target.
 */
export default function ProfileSwitcher({ className, rounded = 'rounded-lg', children, hideTitle, listOnly, blockWrapperProps, accessibilityLabel }) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [show, setShow] = useState(false)
    const redirectdRef = useRef();
    const wrapperClassName = className || '';

    const handleSwitch = async (id) => {
        try {
            const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
            // No user back means UNA refused the switch: keep the current one and the list open.
            if (!result?.data) return;
            setCurrentUser(result.data);
            setShow(false);
        } catch (err) {
            console.warn('Profile switch failed:', err);
        }
    };

    // Loaded when the modal opens; staleTime 0 re-checks on every open (cached list shows meanwhile).
    // The last param is show_all: without it UNA leaves out the active profile.
    const { data: sResponse } = useFetch(
        show ? '/api.php?r=system/account_profile_switcher/TemplServiceProfiles&params=' + encodeURIComponent('[0,null,"",1]') : null,
        { staleTime: 0 }
    );
    const data = sResponse?.data?.[0]?.data || false;

    const handleClick = async (id) => {
        setShow(true)
    };

    const profileList = data?.profiles;

    if (!currentUser || (currentUser.profiles_count < 2 && currentUser?.menu?.items == 0) || currentUser.profiles_count == currentUser.profiles_limit) {
        return <></>;
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            {true ?
                <Pressable
                    className={wrapperClassName}
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabel}
                    onPress={() => handleClick()}
                >
                    {children}
                </Pressable> :
                <Link href={currentUser.url} emulate={true} >
                    <Row className={(rounded + " w-full group items-center px-0.5 justify-between cursor-pointer " + wrapperClassName).trim()}>
                        <Row className='flex-row items-center p-1.5'>
                            <Profile
                                {...currentUser}
                                url_avatar={currentUser.avatar}
                                displayType="unit_wo_info"
                                displaySize="base"
                            />
                            <View className='flex-col'>
                                <Text className=" text-base p-1.5 flex-auto my-auto font-semibold truncate text-secondary-foreground  web:group-hover:text-foreground  web:duration-300">
                                    {currentUser.display_name}
                                </Text>
                                <Text className=" text-xs p-1.5 flex-auto my-auto truncate text-muted-foreground  web:group-hover:text-secondary-foreground  web:duration-300">
                                    {currentUser.membership_name}
                                </Text></View>
                        </Row>
                        <View className='flex-none p-1.5'>
                            {currentUser.profiles_count > 1 && <NeoButton
                                style="borderless"
                                controlSize="small"
                                image="RefreshCw"
                                accessibilityLabel={t('Switch profile')}
                                onPress={() => handleClick()}
                            />}
                        </View>
                    </Row>
                </Link>
            }
            {(show && data) && <Modal id='file-preview' title={t("Your Profiles")} onVisible={show} onClose={() => { setShow(false) }} scrollable>
                <Redirect ref={redirectdRef} />
                <View className="   flex-col">
                    {!hideTitle && <View className="flex-row items-center  justify-between">
                        <Text className="text-lg px-1.5 py-2 font-bold text-secondary-foreground  ">
                            Your Profiles
                        </Text>
                    </View>
                    }
                    {/* One radio row per profile; the checked one is the profile the account acts as. */}
                    <View accessibilityRole="radiogroup" className="w-full">
                        {profileList?.map((item) => (
                            <RadioButton
                                key={item.id}
                                value={item.id}
                                status={item.id == currentUser.id ? 'checked' : 'unchecked'}
                                title={item.display_name}
                                icon={<Profile {...item} url_avatar={item.avatar} displayType="unit_wo_info" displaySize="md" showLinks={false} />}
                                variant="menu"
                                onPress={() => { if (item.id != currentUser.id) void handleSwitch(item.id) }}
                            />
                        ))}
                    </View>
                    {/* A gap, not a margin on each button, so every button spans the same width. */}
                    {!listOnly && !!currentUser?.menu?.items && <View className='flex-col sm:flex-row gap-2 mt-4 w-full'>
                        {currentUser.menu.items.map((item) => (
                            <View key={item.name} className='w-full sm:w-auto sm:flex-1'>
                                <NeoButtonLink
                                    href={`/${item.name}`}
                                    width="fill"
                                    image="UserCircle"
                                    label={item.name === 'create-persons-profile' ? t('Add a personal profile') : t("New " + item.title)}
                                />
                            </View>
                        ))}
                    </View>}
                </View>
            </Modal>}
        </BlockWrapper>
    )
}
