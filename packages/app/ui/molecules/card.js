import { createContext, useContext, useMemo, useId } from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting } from 'app/lib/util';

const cardTheme = appSetting('theme', 'cards');
const CardContext = createContext(null);
const DEFAULT_TITLE_ID = 'region-title';

function CardSection({
    baseClass,
    Component = View,
    className = '',
    padding = '',
    ...props
}) {
    let defPadding = '';
    if (baseClass === 'u-card-base') {
        defPadding = cardTheme['u-card-padding'];
    }
    if (baseClass === 'u-card-list') {
        defPadding = cardTheme['u-card-list-padding'];
    }

    const paddingClasses = padding || defPadding;
    const classes = `${cardTheme[baseClass] || ''} ${paddingClasses} ${className}`.trim();

    return <Component className={classes} {...props} />;
}

const Card = ({
    className = '',
    padding = '',
    role = 'region',
    titleId,
    labelledBy,
    ...props
}) => {
    const { ['aria-labelledby']: ariaLabelledbyProp, ...restProps } = props;
    const generatedId = useId();
    const resolvedTitleId = titleId ?? `${generatedId}-region-title`;
    const resolvedAriaLabelledby =
        ariaLabelledbyProp ?? labelledBy ?? resolvedTitleId ?? DEFAULT_TITLE_ID;
    const contextValue = useMemo(
        () => ({
            titleId: resolvedTitleId || DEFAULT_TITLE_ID,
        }),
        [resolvedTitleId]
    );

    return (
        <CardContext.Provider value={contextValue}>
            <CardSection
                baseClass="u-card-base"
                className={className}
                padding={padding}
                role={role}
                aria-labelledby={resolvedAriaLabelledby}
                {...restProps}
            />
        </CardContext.Provider>
    );
};

const CardList = (props) => <CardSection baseClass="u-card-list" {...props} />;

const CardHeader = (props) => <CardSection baseClass="u-card-header" {...props} />;

const CardIcon = (props) => <CardSection baseClass="u-card-icon" {...props} />;

const CardActions = (props) => <CardSection baseClass="u-card-actions" {...props} />;

const CardTitle = ({ className = '', padding = '', id, ...props }) => {
    const context = useContext(CardContext);
    const resolvedId = id ?? context?.titleId ?? DEFAULT_TITLE_ID;

    return (
        <CardSection
            baseClass="u-card-title"
            Component={Text}
            className={className}
            padding={padding}
            id={resolvedId}
            {...props}
        />
    );
};

const CardDescription = (props) => (
    <CardSection baseClass="u-card-description" Component={Text} {...props} />
);

const CardContent = (props) => <CardSection baseClass="u-card-content" {...props} />;

const CardFooter = (props) => <CardSection baseClass="u-card-footer" {...props} />;

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
    CardActions,
};