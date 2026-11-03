import { useState, type ComponentType, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next';
import { View, Pressable } from 'app/design/view'
import { NeoButtonLink, Sheet } from 'app/design/controls'
import { Text } from 'app/design/typography'
import Profile from 'app/ui/molecules/profile/profile'
import { useCurrentUser } from 'app/context/user'
import { fetcher } from 'app/lib/fetcher';
import { useFetch } from 'app/lib/hooks/use-fetch';
import { BlockWrapper as BlockWrapperJs } from 'app/components/block-wrapper'
import RadioButton from 'app/ui/atoms/radiobutton'

// JS component: every prop is optional (as in components/block.tsx).
const BlockWrapper = BlockWrapperJs as ComponentType<Record<string, any>>;

/** A profile of the account, from `system/account_profile_switcher`. */
type SwitcherProfile = {
    id: number | string;
    display_name: string;
    url?: string;
    avatar?: string;
};

type SwitcherData = { active_profile_id?: number | string; profiles?: SwitcherProfile[] };

/** UNA's envelope: `data` is a list of blocks; the switcher is the first one. */
type SwitcherResponse = { data?: Array<{ data?: SwitcherData }> };

/** An item of the account's `sys_add_profile` menu (a profile type that can be created). */
type AddProfileItem = { name: string; title: string };

type ProfileSwitcherProps = {
    /** The trigger, pressed to open the list. */
    children?: ReactNode;
    /** Classes for the trigger's Pressable (`u-neo-btn-link`, hit area). */
    className?: string;
    /** Names the trigger: a passive NeoButton inside drops its own label. */
    accessibilityLabel?: string;
    /** Leave out the "Your Profiles" heading inside the list (the sheet already shows the title). */
    hideTitle?: boolean;
    /** Only the profiles, without the buttons to add one. */
    listOnly?: boolean;
    blockWrapperProps?: Record<string, unknown>;
};

/**
 * Children mode: the Pressable host owns the press, so `accessibilityLabel` names
 * it (a passive NeoButton inside drops its own). Callers pass `u-neo-btn-link`
 * (+ `hit-area-4` small / `hit-area-8` mini) in `className` for the ring and target.
 */
export default function ProfileSwitcher({ className, children, hideTitle, listOnly, blockWrapperProps, accessibilityLabel }: Readonly<ProfileSwitcherProps>) {
    const { t } = useTranslation();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [show, setShow] = useState(false)

    const handleSwitch = async (id: SwitcherProfile['id']) => {
        try {
            const result = await fetcher('/api.php?r=system/switch_profile/TemplServiceAccount&params[]=' + id);
            const user = result?.data;
            // UNA answers a refused switch with error text: keep the current profile and the list open.
            if (!user || typeof user !== 'object' || user.id != id) {
                console.warn('Profile switch refused:', user);
                return;
            }
            setCurrentUser(user);
            setShow(false);
        } catch (err) {
            console.warn('Profile switch failed:', err);
        }
    };

    // Loaded when the modal opens; staleTime 0 re-checks on every open (cached list shows meanwhile).
    // The last param is show_all: without it UNA leaves out the active profile.
    const { data: sResponse } = useFetch<SwitcherResponse>(
        show ? '/api.php?r=system/account_profile_switcher/TemplServiceProfiles&params=' + encodeURIComponent('[0,null,"",1]') : null,
        { staleTime: 0 }
    );
    const data = sResponse?.data?.[0]?.data;
    const profileList = data?.profiles;
    const menuItems: AddProfileItem[] | undefined = currentUser ? currentUser.menu?.items : undefined;
    const addItems = menuItems ?? [];

    // Nothing to switch to and nothing to add (an empty add menu; a missing one still shows it).
    const nothingToOffer = !!currentUser && (currentUser.profiles_count ?? 0) < 2 && Array.isArray(menuItems) && menuItems.length === 0;
    if (!currentUser || nothingToOffer || currentUser.profiles_count == currentUser.profiles_limit) {
        return <></>;
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Pressable
                className={className || ''}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                onPress={() => setShow(true)}
            >
                {children}
            </Pressable>
            <Sheet visible={show && !!data} title={t("Your Profiles")} onClose={() => { setShow(false) }}>
                <View className="flex-col">
                    {!hideTitle && <View className="flex-row items-center justify-between">
                        <Text className="text-lg px-1.5 py-2 font-bold text-secondary-foreground">
                            {t('Your Profiles')}
                        </Text>
                    </View>
                    }
                    {/* One radio row per profile; the checked one is the profile the account acts as. */}
                    <View accessibilityRole="radiogroup" className="w-full gap-1">
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
                    {!listOnly && addItems.length > 0 && <View className='flex-col sm:flex-row gap-2 mt-4 w-full'>
                        {addItems.map((item) => (
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
            </Sheet>
        </BlockWrapper>
    )
}
