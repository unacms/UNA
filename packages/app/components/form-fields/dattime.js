import Field from './_field';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from 'app/design/controls'
import { View, Row } from 'app/design/view'
import { Calendar } from 'react-native-calendars';
import Dropdown from 'app/ui/atoms/dropdown'
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
    

    const [showModal, setShowModal] = useState(false);

    const bIsTime = props.type == 'datetime' ? true : false;

    let dateV = field.value.split(' ');
    
    let timeV = dateV[1];
    let valueh = '';
    let valuem = '';
    if (timeV){
        let timeV2 = timeV.split(':');
        valueh = timeV2[0];
        valuem = timeV2[1];
    }
    
    let date = dateV[0] + (bIsTime && valueh != '' ? ' ' + valueh + ':' + valuem : '');
    
    const [dValue, setdValue] = useState({dt: dateV[0], h: valueh, m: valuem});

    const { colors } = Theme();

    let valuesm = [];
    for(let i = 0; i < 60; i++) {
        let c= i.toString().padStart(2, '0');
        valuesm.push({label: c, value: c});
    }

    let valuesh = [];
    for(let i = 0; i < 24; i++) {
        let c= i.toString().padStart(2, '0');
        valuesh.push({label: c, value: c});
    }

    const setValue = () => {
        setTimeout(() => {
            formContext.setValue(props.name, dValue.dt + ' ' + dValue.h +':' + dValue.m + ':00Z')
        }, 100);
        setShowModal(false);
    }

    const setTime1 = (v) => {
        setdValue({dt:dValue.dt, h:v, m:dValue.m})
    }

    const setTime2 = (v) => {
        setdValue({dt:dValue.dt, h:dValue.h, m:v})
    }

    return (
        <Field {...props}>
            <Modal title={"Select date" + (bIsTime ? '/time' : '')} onVisible={!!showModal} onClose={() => {setShowModal(false)}} outerClickClose={false} transparent={true}>
                    <Calendar className=' bg-backgroundcard dark:bg-backgroundcard-dark'
                        theme={{
                            calendarBackground: colors.card,
                        }}
                        renderArrow={direction => {return  <Icon icon={direction} width={24} height={24} />}}
                        initialDate = {date}
                        onDayPress={day => {
                            setdValue({dt:day.dateString, h:dValue.h, m:dValue.m})
                        }}
                        markedDates={field.value != '' ?{
                            [dValue.dt]: {selected: true, selectedColor: colors.primary}
                        } : {
                            [dValue.dt]: {selected: true}
                        }}
                    />
                    <View className='w-full justify-center items-center'>
                        <Row className='justify-center items-center w-64'>
                        {
                            bIsTime && (
                                <><View>
                                    <Dropdown 
                                        labelField="label"
                                        valueField="value"
                                        onChange={setTime1}
                                        value={valueh}
                                        data={valuesh}
                                    />
                                </View>    
                                <Text className="text-2xl justify-center items-center"> : </Text>
                                <View>
                                    <Dropdown
                                        labelField="label"
                                        valueField="value"
                                        onChange={setTime2}
                                        value={valuem}
                                        data={valuesm}
                                    />
                                </View>
                                </>
                            )
                        } 
                        <View className='mx-4'><Button title="Appply" onPress={() => { setValue(true) }}/></View>  
                        </Row>
                    </View>
            </Modal>
            <Row>
                <View  className='w-40 mr-2'>
                    <Hidden name={props.name} onBlur={field.onBlur} value={field.value} />
                    <Input value={date} readonly={true} />
                </View>
                <Button startDecorator="calendar" onPress={() => { setShowModal(true) }}/>
            </Row>
        </Field>
    );
}
