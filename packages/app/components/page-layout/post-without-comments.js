import { View, Row } from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import { useState, useRef } from 'react';
import { stripTags } from 'app/lib/util';
import { Dimensions } from 'react-native';
import Card from 'app/ui/molecules/card'
import { useIsDesktop } from 'app/context/measure';
export default function PageLayout(props) {


    const [addData, setAddData] = useState({});
    const [sizes, setSizes] = useState({cntHeight:0, listHeight:100, formHeight:0, formWidth:100});
    const isDesktop = useIsDesktop();

    const viewFormRef = useRef();
    const viewCntRef = useRef();


    
    const handleForm =  async (data) => {
        setAddData(data)
        calculateSize();
    }   

    const handleWindowSizeChange = () => {
        calculateSize();
    };


    const handleLayout = () => {
        calculateSize();
    }; 

    const calculateSize = () => {
        if (viewFormRef.current){
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                let  FormH = height
                let offset = 100;
                if (!isDesktop){
                    FormH = FormH 
                    offset = 128;
                }
                let otherH = Dimensions.get('window').height;
                otherH = otherH - FormH - offset
                viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                    setSizes({formHeight: FormH, formWidth: width-2, otherHeight:otherH, cntHeight:height})             
                });
            });
        }
    }

    const commentsData = DataByName(props.data, props.blocks.comments);

    let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
    }));

    let actionsItemIndex = aItems.findIndex(item => item.id === 'block_actions');
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className=' border-b  border-bdr dark:border-bdr-d'>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }

    actionsItemIndex = aItems.findIndex(item => item.id === 'block_author');
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className='pt-4 px-4'>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }
    let isStycky = !isDesktop || sizes.otherHeight < sizes.cntHeight;

    return ( 
        <View className="lg:py-4">
            <Card>
                <Row><View ref={viewCntRef} style ={{marginBottom: isStycky ? sizes.formHeight + 16: 16, heightx:sizes.otherHeight}} className='  w-full '>
                TODO:
                </View>
                </Row>
                <View ref={viewFormRef} style={{width:sizes.formWidth}} onLayout={handleLayout} className={isStycky? ' fixed bottom-16 lg:bottom-0 w-full' : ' w-full'} > 
                </View>
            </Card>
        </View> 
    )

}
