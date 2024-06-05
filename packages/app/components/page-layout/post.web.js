import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useRef,useEffect } from 'react';
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'
import { CommentsParts } from 'app/lib/comments-helpers'

export default function PageLayout(props) {
    const [sizes, setSizes] = useState({ cntHeight: 0, listHeight: 100, formHeight: 0, formWidth: 100 });

    const viewFormRef = useRef();
    const viewCntRef = useRef();
    const windowDimensions = useWindowDimensions();

    useEffect(() => {
        calculateSize();
    }, [windowDimensions]);

    const handleLayout = () => {
        calculateSize();
    };

    const windowWidth = windowDimensions.width + 24;

    const calculateSize = () => {
        if (viewFormRef.current) {
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                let FormH = height
                let offset = 90;
                if (windowDimensions.width < 1024) {
                    FormH = FormH
                    offset = 128;
                }
                let otherH = windowDimensions.height;
                otherH = otherH - FormH - offset
                viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                    setSizes({ formHeight: FormH, formWidth: width, otherHeight: otherH, cntHeight: height })
                });
            });
        }
    }

    let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
    }));

    let actionsItemIndex = aItems.findIndex(item => item.id === 'block_actions');
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className=''>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }

    let header = <></>

    actionsItemIndex = aItems.findIndex(item => item.id === 'block_author');
    if (actionsItemIndex !== -1) {
        if (windowDimensions.width < 1024) {
            header = (
                <><Row className='py-2 px-3 w-full items-center fixed top-0 z-50 border-b  bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-bdrnavbar dark:border-bdrnavbar-d flex-row justify-start'>
                    {getBackButtonWeb()}
                    <View style={{ width: windowWidth - 92 }}>
                        {aItems[actionsItemIndex].data}
                    </View>
                </Row></>
            );
            aItems.splice(actionsItemIndex, 1);
        }
        else {
            aItems[actionsItemIndex].data = (
                <View className='  '>
                    {aItems[actionsItemIndex].data}
                </View>
            );
        }

    }

    const commentsData = DataByName(props.data, props.blocks.comments);
    const offset = commentsData?.content[0]?.form?.data?.inputs?.cmt_text?.html === 2 ? "pb-36 " : "pb-2";
    const isStycky = windowDimensions.width < 1024 || sizes.otherHeight < sizes.cntHeight;
    const CommentsPartsData = CommentsParts(commentsData?.content[0], aItems);

    return (
        <>
            {header}
            <View className=" py-0 lg:px-4 mt-14 lg:mt-4 ">
                <View className="max-w-5xl mx-auto w-full border-bdrcard dark:border-bdrcard-d group duration-500  lg:rounded-2xl bg-bgrcard dark:bg-bgrcard-d ">
                    <Row className='pb-20'>
                        <View ref={viewCntRef} style={{ marginBottom: isStycky ? /*sizes.formHeight +*/ 16 : 24, heightx: sizes.otherHeight }} className={'w-full  p-3 sm:p-6 '+ (windowDimensions.width < 1024 ? '' : offset)}>
                            {CommentsPartsData[0]}
                        </View>
                    </Row>
                    <View ref={viewFormRef} style={{ width: sizes.formWidth }} onLayout={handleLayout} className={isStycky ? ' px-3 bg-bgrcard dark:bg-bgrcard-d border-t border-bdr dark:border-bdr-d fixed bottom-0 w-full ' : ' px-6 py-2 w-full sm:rounded-b-2xl border-t border-bdr dark:border-bdr-d '} >
                        {CommentsPartsData[1]} 
                    </View>
                </View>
            </View>
        </>
    )
}
