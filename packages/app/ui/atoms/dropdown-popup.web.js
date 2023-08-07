import { 
    Root as DmRoot, 
    Trigger as DmTrigger, 
    Portal as DmPortal, 
    Content as DmContent 
}  from '@radix-ui/react-dropdown-menu'
import Tooltip from 'app/ui/atoms/tooltip';
import 'app/styles/dropdown.css';

export default function DropdownPopup(oProps) {
    let { open, onOpenChange, asChildTrigger, title, ...restProps } = oProps;

    return (
        <DmRoot open={open} onOpenChange={(bDmOpen) => {onOpenChange(bDmOpen)}}>
            <Tooltip content={title} asChildTrigger={true} {...restProps}>
              <DmTrigger asChild={asChildTrigger} role="button" aria-label={title}>{oProps.children[0]}</DmTrigger>
            </Tooltip>
            <DmPortal>
                <DmContent className="DropdownMenuContent border border-bordercolormodal dark:border-bordercolormodal-dark backdrop-blur m-1 bg-backgroundmodal dark:bg-backgroundmodal-dark shadow-xl" {...restProps}>
                    {oProps.children[1]}
                </DmContent>
            </DmPortal>
        </DmRoot>
    );
}