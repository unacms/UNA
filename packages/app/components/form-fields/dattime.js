import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { View, Row } from 'app/design/view'
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { Hidden } from 'app/design/controls'

export default function FormFieldDattime(props) {
    let formContext = useFormContext();
    let rules = {};
    let name = props.name;
    let defaultValue = props.value ? props.value : '';
    let { field } = useController({ name, rules, defaultValue });
    const [selected, setSelected] = useState('');
    const [showImage, setShowImage] = useState(false);
    let dateV = field.value.split(' ');
    let date = dateV[0];
    const { colors } = Theme();
    
    return (
        <Field {...props}>
            <Modal title="Select date" onVisible={!!showImage} onClose={() => {setShowImage(false)}} outerClickClose={true} transparent={true}>
                    <Calendar className=' bg-backgroundcard dark:bg-backgroundcard-dark'
                        theme={{
                            calendarBackground: colors.card,
                        }}
                        renderArrow={direction => {return  <Icon icon={direction} width={24} height={24} />}}
                        initialDate = {date}
                        onDayPress={day => {
                            setTimeout(() => {
                                formContext.setValue(props.name, day.dateString + ' 00:00:00Z')
                            }, 100);
                            setShowImage(false);
                        }}
                        markedDates={field.value != '' ?{
                            [date]: {selected: true, selectedColor: colors.primary},
                            [selected]: {selected: true, selectedColor: colors.primary}
                        } : {
                            [selected]: {selected: true}
                        }}
                    />
                
            </Modal>
            <Row>
                <View  className='w-28 mr-2'>
                    <Hidden name={props.name} onBlur={field.onBlur} value={field.value} />
                    <Input value={date} readonly={true} />
                </View>
                <Button startDecorator="calendar" onPress={() => { setShowImage(true) }}/>
            </Row>
        </Field>
    );
}
