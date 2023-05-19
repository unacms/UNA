import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import 'app/styles/dropdown.css';

export default function DropdownPopup(oProps) {
    let { open, onOpenChange, ...rest } = oProps;

    const sTitle = oProps?.title ? oProps.title : '';

    return (
        <DropdownMenu.Root open={open} onOpenChange={(bOpen) => {onOpenChange(bOpen)}}>
            <DropdownMenu.Trigger aria-label={sTitle}>
                {oProps.children[0]}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="DropdownMenuContent border border-bordercolormodal dark:border-bordercolormodal-dark backdrop-blur m-1 bg-backgroundmodal dark:bg-backgroundmodal-dark shadow-xl ">
                    {oProps.children[1]}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}