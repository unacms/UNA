import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting} from 'app/lib/util';

const cardTheme = appSetting('theme', 'cards');

function createCardComponent({ baseClass, Component = View, role, ariaLevel }) {
    return function CardSubComponent({ className = '', padding = '', ...props }) {
        let defPadding = ''
        if (baseClass == 'u-card-base')
            defPadding = cardTheme['u-card-padding'];
        if (baseClass == 'u-card-list')
            defPadding = cardTheme['u-card-list-padding'];

        const paddingClasses = padding ? padding : defPadding

        return (
            <Component
                className={`${cardTheme[baseClass]} ${paddingClasses} ${className} `}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        );
    };
}

const Card = createCardComponent({ baseClass: 'u-card-base' });

const CardList = createCardComponent({ baseClass: 'u-card-list' });

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
    CardList,
    CardHeader,
    CardIcon,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
};