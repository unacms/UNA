import { View, Row, Pressable } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Tooltip from 'app/ui/atoms/tooltip'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';

export default function MenuTopItem({ link, title, index, icon, isTitle, isActive, items }) {
    return items?.length > 0 ?
        <DropdownMenu
            mode="popup"
            items={items}
            defaultOpen={false}
        >
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} isPopup={true}/>
        </DropdownMenu>
        : <Link variant="text" size="lg" className=" min-w-16 flex-auto relative group web:active:scale-95 web:duration-100 " href={link} alt={title}>
            <MenuTopItem_ title={title} icon={icon} isTitle={isTitle} isActive={isActive} isPopup={false} />
        </Link>

}


function MenuTopItem_({ title, icon, isTitle, isActive, isPopup }) {
    return (

        <Tooltip content={title}>
            <View className="flex-auto web:group">
                <Row
                    className={`items-center content-center justify-center px-2 h-12 flex-auto flex-wrap rounded-lg  ${isActive
                        ? ' web:hover:bg-accent/60 active:bg-accent text-accent-foreground'
                        : 'text-secondary-foreground web:group-hover:text-foreground web:hover:bg-muted/80 web:group-focus:bg-muted/80 web:active:bg-border/80 '
                        }`}
                >
                    <Icon
                        icon={icon}
                        className={`${isActive ? "text-accent-foreground h-9 w-9 my-auto items-center justify-center flex" : "text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                    />
                    {isTitle && <Text className={`whitespace-nowrap text-ellipsis overflow-hidden tracking-tight font-medium ${isActive ? 'text-accent-foreground' : 'text-secondary-foreground'} text-sm px-2 leading-5`}>{title}</Text>}
                    {/*
                        isPopup && <Icon
                        icon={icon}
                        className={`${isActive ? "text-accent-foreground h-9 w-9 my-auto items-center justify-center flex" : "text-secondary-foreground web:group-hover:text-foreground h-9 w-9 items-center justify-center flex"}`}
                    />
                    */}
                </Row>
            </View>
        </Tooltip>

    )
}