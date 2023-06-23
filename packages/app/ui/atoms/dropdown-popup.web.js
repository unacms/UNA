import { Root, Trigger, Portal, Content }  from '@radix-ui/react-dropdown-menu'
import 'app/styles/dropdown.css';

export default function DropdownPopup(oProps) {
    let { open, onOpenChange, ...rest } = oProps;

    const sTitle = oProps?.title ? oProps.title : '';
    const bAsChildTrigger = oProps?.asChildTrigger ? oProps.asChildTrigger : false;

    return (
        <Root open={open} onOpenChange={(bOpen) => {onOpenChange(bOpen)}}>
            <Trigger asChild={bAsChildTrigger} aria-label={sTitle}>
                {oProps.children[0]}
            </Trigger>
            <Portal>
                <Content className="DropdownMenuContent border border-bordercolormodal dark:border-bordercolormodal-dark backdrop-blur m-1 bg-backgroundmodal dark:bg-backgroundmodal-dark shadow-xl ">
                    {oProps.children[1]}
                </Content>
            </Portal>
        </Root>
    );
}