import { useState, useEffect } from 'react';
import Field from './_field';
import { Switch } from 'app/design/controls'
import { Theme } from 'app/design/theme';
import { useFormContext } from 'react-hook-form';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function FormFieldSwitcher(props) {
    const [isEnabled, setIsEnabled] = useState(props.checked ? true : false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    const { colors } = Theme();
    const formContext = useFormContext();

    useEffect(() => {
        formContext.setValue(props.name, isEnabled ? 1 : 0)
    }, [props.name, isEnabled]);

    if (props.use_caption_as_placeholder)
        props.placeholder = props.caption;

    // TODO: improve value
    return (
        <Field {...props}>
            <Row className='gap-x-2 items-center'>
            <Switch
                trackColor={{false: colors.border, true: colors.primary}}
                thumbColor={'#ffffff'}
                activeThumbColor={'#ffffff'}
                ios_backgroundColor={colors.background}
                onValueChange={toggleSwitch}
                value={isEnabled}
                aria-label={props.caption}
            />
            <Text className="text-neutral-700 dark:text-neutral-200  text-sm">{props.caption}</Text>
            </Row>
        </Field>
    );
}

