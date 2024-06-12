import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Image from 'app/ui/atoms/image';
import { View, Pressable, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useContext, useState, useEffect, useCallback  } from 'react';
import { Button, Modal } from "app/design/controls";
import Form from 'app/components/elements/form';
import Map from 'app/components/elements/map';
import { appSetting, md5, absoluteApiUrl } from 'app/lib/util'

export default function (props) {

    const bAllowEdit = true;
    const settings = { minW: 1, maxW: 2, minH: 1, maxH: 2 };
    const rowHeight = 260;
    const addSettings = (item) => {
        return {
            ...item,
            minW: settings.minW,
            maxW: settings.maxW,
            minH: settings.minH,
            maxH: settings.maxH,
        }
    }

    const initedData = [
        { i: '1', x: 0, y: 0, w: 2, h: 1, type: "image", content: 'https://us-east-1.linodeobjects.com/una/bx_forum_photos_resized/v/vu/vu5/vu5uxrv6jdum8kyhaibf2fspvexpqagy.webp' },
        { i: '7', x: 2, y: 0, w: 1, h: 1, type: "text", content: 'I`ll be back' },
        { i: '9', x: 2, y: 0, w: 1, h: 1, type: "link", content: 'https://www.msn.com/en-us/news/world/possible-war-crimes-in-israeli-hostage-rescue-raid-un/ar-BB1o0YZZ' },
        {
            i: '11', x: 0, y: 0, w: 2, h: 1, type: "map", content: {

                "content_country": "IN",
                "content_state": "Telangana",
                "content_city": "Hyderabad",
                "content_zip": "500055",
                "content_lat": 17.5238527,
                "content_lng": 78.4347044,
                "content_street": "Road Number 9",
                "content_street_number": "940"
            }
        },
    ];
    initedData = initedData.map(item => (addSettings(item)));

    const [data, setData] = useState(initedData)
    const [addType, setAddType] = useState(false)
    const [containerWidth, setContainerWidth] = useState(1120)

    const onChangeLayout = (layout) => {
        const updatedData = data.map(item => {
            const layoutItem = layout.find(l => l.i === item.i);
            if (layoutItem) {
                return { ...item, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
            }
            return item;
        });
        setData(updatedData);
    };

    const onRemove = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        const updatedData = data.filter(item => item.i.toString() !== key.toString());
        setData(updatedData);

    }
    const onChange = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        let a = data.find(item => item.i.toString() === key.toString());
        setAddType(a)
    }

    const onAdd = (type) => {
        setAddType({ i: 0, x: 0, y: 0, w: 2, h: 1, type: type })
    }

    useEffect(() => {
        //TODO SAVE
        console.log("data", data, props.block.id);
    }, [data]);

    let control
    switch (addType.type) {
        case 'text':
            control = {
                name: 'content',
                type: 'textarea',
                required: true,
                value: addType.content,
                caption: '',
                placeholder: 'Content',
            };
            break;
        case 'link':
            control = {
                name: 'content',
                type: 'text',
                required: true,
                value: addType.content,
                caption: '',
                placeholder: 'Content',
            };
            break;
        case 'image':
            control = {
                name: 'content',
                type: 'files',
                required: true,
                value: addType.content,
                storage_object: 'sys_images_editor',
                images_transcoder: 'sys_images_editor',
                multiple: false,
                uploaders: [
                    "sys_cmts_html5"
                ],
                useUrl: true,
                ext_allow: "jpg,jpeg,jpe,gif,png,webp",
                ext_deny: "",
                caption: '',
                placeholder: 'Content',
            };
            break;
        case 'map':
            control = {
                name: 'content',
                type: 'location',
                required: true,
                value: '',
                caption: '',
                placeholder: 'Content',
            };
            break;
    }
    let form = {
        data:
        {
            inputs: [
                control,
                {
                    name: 'submit',
                    type: 'submit',
                    label: 'Content',
                    required: true,
                    value: 'Save',
                },
            ],
        }
    }

    const onContainerLayout = useCallback((event) => {
        setContainerWidth(event.nativeEvent.layout.width);
    });

    const onFormSubmit = (formData, d) => {
        let updatedData;
        let content = d.content;
        if (addType.type === 'map') {
            content = d;
        }
        if (addType.i > 0) {
            const layout = [addType];
            updatedData = data.map(item => {
                const layoutItem = layout.find(l => l.i === item.i);
                if (layoutItem) {
                    return { ...item, content: content };
                }
                return item;
            });
        }
        else {
            const maxI = data.reduce((max, item) => (parseInt(item.i) > max ? parseInt(item.i) : max), data[0].i);
            updatedData = [...data, addSettings({ i: (maxI + 1).toString(), x: Infinity, y: Infinity, w: 1, h: 1, type: addType.type, content: content })];
        }
        //  console.log('updatedData', updatedData)
        setData(updatedData);
        setAddType(false);
    }

    return (
        <View className="px-2 w-full">
        <View className="w-full" onLayout={onContainerLayout}>
            {addType && <Modal
                outerClickClose={false}
                onVisible={addType}
                onClose={() => {
                    setAddType(false)
                }}
                presentation='overFullScreen'
                transparent={true}
                headerBorder={true}
                title={(addType.i > 0 ? "Edit " : "Add new ") + addType.type}
            >
                <Form {...form} resetOnSubmit={true} onFormSubmit={onFormSubmit} />
            </Modal>}
            {bAllowEdit && <Row className="gap-x-4 items-center justify-center">
                <Button variant='text' size='base' rounded startDecorator='Article' onPress={() => { onAdd('text') }} />
                <Button variant='text' size='base' rounded startDecorator='Link' onPress={() => { onAdd('link') }} />
                <Button variant='text' size='base' rounded startDecorator='Image' onPress={() => { onAdd('image') }} />
                <Button variant='text' size='base' rounded startDecorator='MapPin' onPress={() => { onAdd('map') }} />
            </Row>}
            <GridLayout
                className="layout w-full"
                layout={data}
                cols={4}
                rowHeight={rowHeight}
                width={containerWidth}
                onLayoutChange={(layout) => { onChangeLayout(layout); }}
            >

                {data.map((block) => {
                    return getCell(block);
                })}
            </GridLayout>

        </View>
        </View>
    );

    function getCell(block) {
        let blockContent;
        switch (block.type) {
            case "image":
                blockContent = <><Image view='cover' sizes="(max-width:1024px) 100vw, 1024px" className=" u-cover " alt='' src={block.content} /></>
                break;
            case "text":
                blockContent = <View className="p-2 items-center justify-center h-full"><Text className='text-lg'>{block.content}</Text></View>;
                break;
            case "link":
                blockContent = <View className="items-center justify-center h-full"><iframe scrolling="no" width="100%" src={absoluteApiUrl("embeds") + block.content + '&theme=light&'} /></View>
                break;
            case "map":
                blockContent = <Map height={rowHeight * block.h} data={{ caption: block.content.content_state + ', ' + block.content.content_city + ', ' + block.content.content_street, location: { lat: block.content.content_lat, lng: block.content.content_lng } }} />
                break;
                break;
            default:
                blockContent = null;
        }

        console.log("containerWidth", data, containerWidth)

        return (
            <View key={block.i} className="border border-bdrcard dark:border-bdrcard-d shadow-sm group duration-200 overflow-hidden sm:rounded-2xl  bg-bgrcard dark:bg-bgrcard-d">
                {blockContent}
                {bAllowEdit && <View className="absolute left-1 bottom-1 z-50">
                    <Pressable onMouseDown={(event) => onRemove(event, block.i)}
                        onTouchStart={(event) => onRemove(event, block.i)}><Button variant='text' size='xs' rounded startDecorator='X' />
                    </Pressable>
                </View>}
                {bAllowEdit && <View className="absolute left-1 bottom-8 z-50"><Pressable onPressIn={(event) => { onChange(event, block.i) }}>
                    <Button variant='text' size='xs' rounded startDecorator='Pencil' />
                </Pressable>
                </View>
                }
            </View>
        );
    }
}