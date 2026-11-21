import { useEffect, useState } from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Sheet } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { fetcher } from 'app/lib/fetcher';
import MenuCards, { type MenuCardItem } from './menu-cards';

/**
 * UNA's "Accounts without a profile" set to "Ask after sign-in" (Studio > Settings > Account): after signing in, an
 * account with no profile of its own gets the "Create your profile" window, as on UNA's site, with UNA's title and
 * text (`profile_prompt` in the viewer's data) and the profile types of its `sys_add_profile` menu (`menu`), drawn as
 * the site draws them: cards with descriptions. It opens once: NEO tells UNA it was shown (system/account_profile_prompt_seen), so the next
 * page doesn't ask again until the next sign-in. Choosing a type opens its form and closes the window (`path`).
 */
export default function ProfilePrompt({ path }: Readonly<{ path?: string }>) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [prompt, setPrompt] = useState<{ title?: string; text?: string } | null>(null);
    const [openedAt, setOpenedAt] = useState<string | undefined>(undefined);

    const due = currentUser ? currentUser.profile_prompt : false;
    const items: MenuCardItem[] = (currentUser ? currentUser.menu?.items : undefined) ?? [];
    const show = !!due && items.length > 0 && !(currentUser && currentUser.profile_required);

    // Open as soon as UNA asks; a profile type chosen (its form is the next page) closes it.
    if (show && !prompt) {
        setPrompt(due);
        setOpenedAt(path);
    }
    if (prompt && !show && path !== openedAt) {
        setPrompt(null);
    }

    // Shown: UNA doesn't ask again until the next sign-in, neither here nor on the next page's data.
    useEffect(() => {
        if (!show) return;
        setCurrentUser({ profile_prompt: false });
        fetcher('/api.php?r=system/account_profile_prompt_seen/TemplServiceAccount').catch((err: unknown) => {
            console.warn('Profile prompt: could not tell UNA it was shown:', err);
        });
    }, [show, setCurrentUser]);

    return (
        <Sheet visible={!!prompt} title={prompt?.title} onClose={() => setPrompt(null)}>
            <View className="gap-4">
                {prompt?.text ? <Text className="text-base text-muted-foreground">{prompt.text}</Text> : null}
                <MenuCards items={items} />
            </View>
        </Sheet>
    );
}
