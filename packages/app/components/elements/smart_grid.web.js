import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Image from 'app/ui/atoms/image';
import { View, Pressable, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { useContext, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button, Modal } from "app/design/controls";
import { fetcher } from 'app/lib/fetcher';
import Form from 'app/components/elements/form';
import Map from 'app/components/elements/map';
import { appSetting, md5, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { WidthProvider, Responsive } from "react-grid-layout";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const ResponsiveReactGridLayoutM = memo(({ data, bAllowEdit, rowHeight, breakpoint, onBreakpointChange, onResize, onDrag, getCell }) => (
    <View className={bAllowEdit ? 'grid-editable' : 'grid-readonly'}><ResponsiveReactGridLayout
        className="layout w-full"
        layouts={data}
        isResizable={bAllowEdit}
        isDraggable={bAllowEdit}

        breakpoints={{ lg: 700, sm: 0 }}
        cols={{ lg: 4, sm: 1 }}
        rowHeight={rowHeight}
        onBreakpointChange={onBreakpointChange}
        onResizeStop={onResize}
        onDragStop={onDrag}

    >
        {data[breakpoint].map((block) => {
            return getCell(block, bAllowEdit);
        })}
    </ResponsiveReactGridLayout></View>
));

export default function (props) {
    const bAllowEdit = props.is_allowed_edit;
    const blockId = props.block_id;
    const contentId = props.content_id;
    const contentModule = props.content_module;

    const defaultCols = 4;
    const settings = { minW: 1, maxW: 2, minH: 1, maxH: 2, resizeHandles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"] };
    const rowHeight = 260;
    const addSettings = (item) => {
        return {
            ...item,
            minW: settings.minW,
            maxW: settings.maxW,
            minH: settings.minH,
            maxH: settings.maxH,
            resizeHandles: settings.resizeHandles,
        }
    }
    let initedData = props.data.content;
    if (!initedData.lg)
        initedData = { lg: [], sm: [] };

    const [data, setData] = useState(initedData)
    /*useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher('/api.php?r=system/get_page_block_data/TemplServicePages&params[]=' + blockId + '&params[]=' + contentId + '&params[]=' + contentModule);
            if (sResponse.data) {
                setData(sResponse.data);
            }
            else {
                setData({ lg: [], sm: [] });
            }
        };

        fetchData();
    }, []);*/

    Object.keys(initedData).forEach(key => {
        initedData[key] = initedData[key].map(addSettings);
    });


    const [addType, setAddType] = useState(false);
    const [breakpoint, setBreakpoint] = useState('lg')


    const onChangeLayout = (layout, allLayouts) => {
    };

    const onDrag = (layout) => {
        const updatedData1 = data[breakpoint].map(item => {
            const layoutItem = layout.find(l => l.i === item.i);
            if (layoutItem) {
                return { ...item, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
            }
            return item;
        });
        const updatedData = { ...data, [breakpoint]: updatedData1 };
        setData(updatedData);

    }

    const onResize = (layout) => {
        const updatedData1 = data[breakpoint].map(item => {
            const layoutItem = layout.find(l => l.i === item.i);
            if (layoutItem) {
                return { ...item, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
            }
            return item;
        });
        const updatedData = { ...data, [breakpoint]: updatedData1 };
        setData(updatedData);
    }


    const onRemove = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        let updatedData = {};
        Object.keys(data).forEach(iter => {
            updatedData[iter] = data[iter].filter(item => item.i.toString() !== key.toString());
        });
        setData(updatedData);

    }
    const onChange = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        let a = data[breakpoint].find(item => item.i.toString() === key.toString());
        setAddType(a)
    }

    const onAdd = (type) => {
        setAddType({ i: 0, x: 0, y: 0, w: 2, h: 1, type: type })
    }

    useEffect(() => {
        saveData(data)
    }, [data]);

    const saveData = async (data) => {
        if (data) {
            const sResponse = await fetcher(['/api.php?r=system/set_page_block_data/TemplServicePages&params[]=' + blockId + '&params[]=' + contentId + '&params[]=' + contentModule, null, JSON.stringify(data)]);
        }
    }


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

    const onBreakpointChange = (breakpoint, cols) => {
        setBreakpoint(breakpoint);
    }

    const onFormSubmit = async (formData, d) => {
        let updatedData = {};
        let content_data = '';
        let content = d.content;
        if (addType.type === 'map') {
            content = d;
        }
        if (addType.type === 'link') {
            const a = await fetcher('/api.php?r=' + appSetting("urls", "embeds_new") + d.content);
            content_data = a.data;
        }
        if (addType.i > 0) {
            const layout = [addType];

            Object.keys(data).forEach(iter => {
                updatedData[iter] = data[iter].map(item => {
                    const layoutItem = layout.find(l => l.i === item.i);
                    if (layoutItem) {
                        return { ...item, content: content, content_data: content_data };
                    }
                    return item;
                });
            });
        }
        else {

            Object.keys(data).forEach(iter => {
                const maxI = data[iter].length > 0 ? data[iter].reduce((max, item) => (parseInt(item.i) > max ? parseInt(item.i) : max), data[iter][0].i) : 0;
                updatedData[iter] = [...data[iter], addSettings({ i: (maxI + 1).toString(), x: Infinity, y: Infinity, w: 1, h: 1, type: addType.type, content: content, content_data: content_data })];
            })
        }
        setData(updatedData);
        setAddType(false);
    }

    const memoizedCells = useMemo(() => {
        if (data && data[breakpoint]) {
            return data[breakpoint].map(getCell);
        }
        return [];
    }, [data, breakpoint, getCell]);

    function getCell(block, bAllowEdit) {
        let blockContent;
        switch (block.type) {
            case "image":
                blockContent = <><Image view='cover' sizes={LAYOUT_BREAKPOINTS.lg} className=" u-cover " alt='' src={block.content} /></>
                break;
            case "text":
                blockContent = <View className="py-2 px-4 items-start justify-start h-full"><Text className='text-lg'>{block.content}</Text></View>;
                break;
            case "link":
                const ImageComponent = ({ className, src }) => (
                    <Image view='cover' sizes={LAYOUT_BREAKPOINTS.lg} className={className} alt='' src={src} />
                );

                blockContent = block.content_data && (
                    <View className={`items-left justify-between h-full p-4 ${block.h == 1 && block.w == 2 ? 'flex-row' : ''}`}>
                        <View className={block.h == 1 && block.w == 2 ? 'w-1/2' : ''}>
                            <View className="h-8 w-8 rounded-full">
                                <ImageComponent className="u-cover rounded-full" src={block.content_data.logo} />
                            </View>
                            <Text className='text-base mt-2 font-semibold tracking-tight' numberOfLines={1}>{block.content_data.title}</Text>
                            {(block.h > 1 || block.w > 1) && <Text className='text-base my-2' numberOfLines={block.h == 1 && block.w == 2 ? 3 : 4}>{block.content_data.description}</Text>}
                            <Text className='text-sm'>{block.content_data.domain}</Text>
                        </View>
                        <View className={`${block.h == 1 && block.w == 2 ? 'w-1/2 items-center justify-center pl-4' : 'w-full aspect-video rounded-2xl'}`}>
                            <View className="aspect-video rounded-2xl w-full">
                                <ImageComponent className="u-cover rounded-lg" src={block.content_data.image} />
                            </View>
                        </View>
                    </View>
                );
                break;
            case "map":
                blockContent = <Map height={rowHeight * block.h} data={{ caption: block.content.content_state + ', ' + block.content.content_city + ', ' + block.content.content_street, location: { lat: block.content.content_lat, lng: block.content.content_lng } }} />
                break;
            default:
                blockContent = null;
        }

        return (
            <View key={block.i} className=" shadow groupweb:duration-200 overflow-hidden sm:rounded-2xl bg-bgrcard dark:bg-bgrcard-d">
                {blockContent}
                {bAllowEdit && <View className="absolute left-1/4 w-1/2 flex-row justify-center gap-x-4  items-center bottom-[20px] z-50">
                    <Pressable onMouseDown={(event) => onRemove(event, block.i)} onTouchStart={(event) => onRemove(event, block.i)}>
                            <Button variant='default' size='xs' rounded startDecorator='X' />
                    </Pressable>
                    <Pressable onPressIn={(event) => { onChange(event, block.i) }}>
                        <Button variant='default' size='xs' rounded startDecorator='Pencil' />
                    </Pressable>
                </View>}

            </View>
        );
    }

    return (
        <View className="px-3 sm:px-4 pt-3 pb-0.5 sm:pt-4 mb-3 w-full   rounded-none sm:rounded-2xl   border-bdrcard dark:border-bdrcard-d  shadow-sm overflow-hidden bg-bgrcard dark:bg-bgrcard-d">
            <View className="w-full overflow-hidden">
                {addType && <Modal
                    outerClickClose={false}
                    onVisible={addType}
                    onClose={() => {
                        setAddType(false)
                    }}
                    transparent={true}
                    headerBorder={true}
                    title={(addType.i > 0 ? "Edit " : "Add new ") + addType.type}
                >
                    <View className="p-4 sm:p-0">
                        <Form {...form} resetOnSubmit={true} onFormSubmit={onFormSubmit} />
                    </View>
                </Modal>}
                {bAllowEdit && <Row className="gap-x-4 items-center justify-center">
                    <Button variant='text' size='base' rounded startDecorator='NotepadText' onPress={() => { onAdd('text') }} />
                    <Button variant='text' size='base' rounded startDecorator='Link' onPress={() => { onAdd('link') }} />
                    <Button variant='text' size='base' rounded startDecorator='Image' onPress={() => { onAdd('image') }} />
                    <Button variant='text' size='base' rounded startDecorator='MapPin' onPress={() => { onAdd('map') }} />
                </Row>}
                <ResponsiveReactGridLayoutM
                    rowHeight={rowHeight}
                    data={data}
                    bAllowEdit={bAllowEdit}
                    breakpoint={breakpoint}
                    onBreakpointChange={onBreakpointChange}
                    onResize={onResize}
                    onDrag={onDrag}
                    getCell={getCell}
                    resizeHandles={["s", "w", "e", "n", "sw", "nw", "se", "ne"]}
                />
            </View>
        </View>
    );
}