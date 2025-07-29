import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { cn } from 'app/lib/util';
import { useLayoutSettings } from 'app/context/layout-settings';

function createCardComponent({ baseClass, Component = View, role, ariaLevel }) {
    return function CardSubComponent({ className, density, ...props }) {
        const { density: globalDensity } = useLayoutSettings();
        const finalDensity = density ?? globalDensity;

        return (
            <Component
                className={cn(`${baseClass}-${finalDensity}`, className)}
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

export {
    Card,
    CardHeader,
    CardIcon,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
};