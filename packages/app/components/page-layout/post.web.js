import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useRef, useEffect } from 'react';
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { CommentsParts } from 'app/lib/comments-helpers'
import { useWindowDimensions } from 'react-native'

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
    const windowWidthOr = windowDimensions.width;

    const calculateSize = () => {
        if (viewFormRef.current) {
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                const offset = windowDimensions.width < 1024 ? 128 : 90;
                const otherH = windowDimensions.height - height - offset;
                viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                    setSizes({ formHeight: height, formWidth: width, otherHeight: otherH, cntHeight: height })
                });
            });
        }
    }

    let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
    }));

    let header = <></>
    aItems.map(item => {
        if (item.id === 'block_actions') {
            item.data = (
                <View className=' border-b  border-bdr dark:border-bdr-d'>
                    {item.data}
                </View>
            );
        }
    
        if (item.id === 'block_author') {
            if (windowWidthOr < 1024) {
                header = (
                    <><Row className='py-2 px-3 w-full items-center fixed top-0 z-50 border-b  bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-bdrnavbar dark:border-bdrnavbar-d flex-row justify-start'>
                        {getBackButtonWeb()}
                        <View style={{ width: windowWidth - 92 }}>
                            {item.data}
                        </View>
                    </Row></>
                );
                item.data = null;
            } else {
                item.data = (
                    <View className='pt-4 px-4 lg:pt-4'>
                        {item.data}
                    </View>
                );
            }
        }
    });

    const commentsData = DataByName(props.data, props.blocks.comments);
    const offset = commentsData?.content[0]?.form?.data?.inputs?.cmt_text?.html === 2 ? "pb-36" : "pb-20";
    const isStycky = windowDimensions.width < 1024 || sizes.otherHeight < sizes.cntHeight;
    const CommentsPartsData = CommentsParts(commentsData?.content[0], aItems);

    return (
        <>
            {header}
            <View className=" py-0 mt-14 lg:mt-4 ">
                <View className="max-w-5xl mx-auto w-full  border-bdrcard dark:border-bdrcard-d group duration-500  lg:rounded-2xl bg-bgrcard dark:bg-bgrcard-d sm:hover:bg-bgrcard-h sm:dark:hover:bg-bgrcard-dh">
                    <Row>
                        <View ref={viewCntRef} style={{ marginBottom: isStycky ? /*sizes.formHeight +*/ 36 : 16, heightx: sizes.otherHeight }} className={'bg-greeen-500  w-full '+ (windowDimensions.width < 1024 ? '' : offset)}>
                        {CommentsPartsData[0]}
                    </View>
                    </Row>
                    <View ref={viewFormRef} style={{ width: sizes.formWidth }} onLayout={handleLayout} className={isStycky ? ' bg-bgrcard dark:bg-bgrcard-d border-bdr dark:border-bdr-d fixed bottom-0 w-full border-t border-bdr dark:border-bdr-d' : ' w-full sm:rounded-b-2xl border-t border-bdr dark:border-bdr-d '} >
                        {CommentsPartsData[1]} 
                    </View>
                </View>
            </View>
        </>
    )

}
