import { 
    Provider as TtProvider,
    Root as TtRoot,
    Trigger as TtTrigger,
    Portal as TtPortal,
    Content as TtContent,
    Arrow as TtArrow,
} from '@radix-ui/react-tooltip';

export default function Tooltip(oProps) {
    const { open, defaultOpen, onOpenChange, asChildTrigger, ...restProps } = oProps;

    return (
        <TtProvider>
            <TtRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
              <TtTrigger asChild={asChildTrigger}>{oProps.children}</TtTrigger>
              <TtPortal>
                <TtContent className="data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-neutral-950 dark:text-neutral-50 select-none rounded-[4px] bg-bgrcard dark:bg-bgrinput-d px-[15px] py-[10px] text-[15px] leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity]" sideOffset={5} {...restProps}>
                    {oProps.content}
                    <TtArrow className="fill-white dark:fill-gray-900" />
                </TtContent>
              </TtPortal>
            </TtRoot>
        </TtProvider>
    );
}