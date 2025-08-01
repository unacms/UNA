import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useLayoutSettings } from 'app/context/layout-settings';
import { appSetting} from 'app/lib/util';

const cardTheme = appSetting('theme', 'cards');

function createCardComponent({ baseClass, Component = View, role, ariaLevel }) {
    return function CardSubComponent({ className = '', padding = '', ...props }) {
        const { density } = useLayoutSettings();
        const paddingClasses = padding ? padding : (baseClass == 'u-card-base' ? cardTheme['u-card-padding-'+density] : '');

        return (
            <Component
                className={`${cardTheme[baseClass]} ${cardTheme[baseClass+'-'+density]} ${className} ${paddingClasses}`}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        );
    };
}

const Card = createCardComponent({ baseClass: 'u-card-base' });

const CardHeader = createCardComponent({ baseClass: 'u-card-header' });

const CardIcon = createCardComponent({ baseClass: 'u-card-icon' });

const CardTitle = createCardComponent({
    baseClass: 'u-card-title',
    Component: Text,
    role: 'heading',
    ariaLevel: 3,
});

const CardDescription = createCardComponent({
    baseClass: 'u-card-description',
    Component: Text,
});

const CardContent = createCardComponent({ baseClass: 'u-card-content' });

const CardFooter = createCardComponent({ baseClass: 'u-card-footer' });

export default Card;

export {
    Card,
    CardHeader,
    CardIcon,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
};