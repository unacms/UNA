import { BlockWrapper } from 'app/components/block-wrapper'
import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { getComponent } from 'app/components/registry';

export default function ElementLang({ data, blockWrapperProps, url }) {
    const MenuItemSidebar = getComponent('menu-item', 'sidebar');


    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className='w-full gap-3.5'>
                {data.content.items
                    .map((a) => {
                        const isActive = `/${url}` === a.url;
                        const activeWrapperClassName = isActive ? 'u-link-ghost-active  rounded-lg' : '';
                        console.log(a.url);
                        return (
                            <Link
                                href={a.url}
                                key={`lmenu-${a.url}`}
                                alt={a.name}
                                variant="ghost"
                                size="lg"
                                className={`group ${activeWrapperClassName}`.trim()}
                            >
                                <MenuItemSidebar title={a.name} icon={a.icon || 'Circle'} isActive={isActive} />
                            </Link>
                        )
                    })
                }
            </View>
        </BlockWrapper>
    );
}
