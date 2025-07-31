import { View } from 'app/design/view';
import { useLayoutSettings } from 'app/context/layout-settings';
import { Text } from 'app/design/typography'
import { appSetting} from 'app/lib/util';

const blockTheme = appSetting('theme', 'blocks');

function createBlockComponent({ baseClass, Component = View, role, ariaLevel }) {
    return function BlockSubComponent({ className = '', density, ...props }) {
        const { density: effectiveDensity } = useLayoutSettings();
        return (
            <Component
                className={`${blockTheme[baseClass]} ${blockTheme[baseClass+'-'+effectiveDensity]} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        );
    };
}

const Block = createBlockComponent({ baseClass: 'u-block-base' });

const BlockHeader = createBlockComponent({ baseClass: 'u-block-header' });

const BlockIcon = createBlockComponent({ baseClass: 'u-block-icon' });

const BlockName = createBlockComponent({ baseClass: 'u-block-name' });

const BlockTitle = createBlockComponent({
    baseClass: 'u-block-title',
    Component: Text,
    role: 'heading',
    ariaLevel: 3,
});

const BlockDescription = createBlockComponent({
    baseClass: 'u-block-description',
    Component: Text,
});

const BlockActions = createBlockComponent({ baseClass: 'u-block-actions' });

const BlockContent = createBlockComponent({ baseClass: 'u-block-content' });

const BlockFooter = createBlockComponent({ baseClass: 'u-block-footer' });

export {
    Block,
    BlockHeader,
    BlockIcon,
    BlockName,
    BlockTitle,
    BlockDescription,
    BlockActions,
    BlockContent,
    BlockFooter,
};