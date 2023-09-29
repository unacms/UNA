import { 
    Root as DmRoot, 
    Trigger as DmTrigger, 
    Portal as DmPortal, 
    Content as DmContent 
}  from '@radix-ui/react-dropdown-menu'
import { ButtonRef } from 'app/design/controls';
import Tooltip from 'app/ui/atoms/tooltip';
import 'app/styles/dropdown.css';

export default function DropdownPopup(oProps) {
    let { open, onOpenChange, asChildTrigger, title, ...restProps } = oProps;

    let bModal = true;
    let sTrigger = (
        <Tooltip content={title} asChildTrigger={true} {...restProps}>
            <DmTrigger asChild={asChildTrigger} role="button" aria-label={title}>{oProps.children[0]}</DmTrigger>
        </Tooltip>
    );

    if(oProps.children[0].type !== ButtonRef) {
        bModal = false;
        sTrigger = (
            <DmTrigger asChild={asChildTrigger}>{oProps.children[0]}</DmTrigger>
        );
    }

    return (
        <DmRoot modal={bModal} open={open} onOpenChange={(bDmOpen) => {onOpenChange(bDmOpen)}}>
            {sTrigger}
            <DmPortal>
                <DmContent className="DropdownMenuContent border border-bdrmodal dark:border-bdrmodal-d backdrop-blur m-1 bg-bgrmodal dark:bg-bgrmodal-d shadow-xl" {...restProps}>
                    {oProps.children[1]}
                </DmContent>
            </DmPortal>
        </DmRoot>
    );
}