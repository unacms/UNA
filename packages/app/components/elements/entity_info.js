import { View, Row } from 'app/design/view';
import { Text, H2 } from 'app/design/typography';
import Time from '../../ui/atoms/time';
import Html from 'app/ui/atoms/html';
import { Icon } from 'app/ui/atoms/icon'

export default function ElementEntityInfo({data}) {

    const inputs = Object.keys(data.inputs).map(function (key) {
        const a = data.inputs[key];
        const v = a.values ? a.values[a.value]: a.value;
        if (v){
            if (a.type){
                return <><Row className='items-center ' key={a.name}>{getIcon(a)}<View className='ml-4'><Text className='font-bold text-base text-neutral-800 dark:text-neutral-200'>{a.caption}</Text></View></Row>
                {getValue(a)}</>
            }
            else{
                return <Text key={a.name}>Unsupporded field type: {a.type}</Text>
            }
        }
    }); 

    return (
        <View className="">
            <View className='mx-4 mb-4 mt-4  text-neutral-800 dark:text-neutral-200'>
                <H2 className=' text-neutral-800 dark:text-neutral-200'>Info</H2>
                {inputs}
            </View>
        </View>
    );

    function getValue(a)
    {
        switch (a.type) {
            case 'datetime':
                return <Time ts={a.value}></Time>

            case 'select':
                return <Text className=' text-neutral-800 text-base dark:text-neutral-200'>{a.values ? a.values[a.value]: a.value}</Text>

            case 'textarea':      
                return <Html data={(a.values ? a.values[a.value]: a.value)} />  

            default:
                return <Text className=' text-neutral-800 text-base dark:text-neutral-200'>{a.value}</Text>
        }
    }

    function getIcon(a)
    {
        switch (a.name) {
            case 'gender':
                return <Icon icon='plus' />

            case 'birthday':
                return <Icon icon='Student' />

            case 'fullname':      
                return <Icon icon='ArrowRight' />
                
            default:
                return <Icon icon='Info' />
        }
    }
}
