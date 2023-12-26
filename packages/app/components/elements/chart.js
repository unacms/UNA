import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect, useMemo } from 'react';
import { appSetting, setClipboard } from 'app/lib/util'
//import { VictoryChart, VictoryLine } from "victory-native";
import Dropdown from 'app/ui/atoms/dropdown'
import Calendar from 'app/ui/atoms/calendar'

function getColor(color) {
    if (color == 'orange') return '#f97316';
    if (color == 'yellow') return '#eab308';
    if (color == 'green') return '#22c55e';
}

function VictoryPieChart({data, colorScale}) {
    const [VictoryPie, setVictoryPie] = useState(null);
    useEffect(() => {
        const loadVictoryComponents = async () => {
            const victoryModule = await import('victory-native');
            setVictoryPie(() => victoryModule.VictoryPie);
        };
        loadVictoryComponents();
    }, []);

    if (!VictoryPie) {
        return null; // or return a loading spinner
    }

    return <VictoryPie data={data} colorScale={colorScale}/>
}

function VictoryLineChart({size, dataChart}) {
    const [VictoryChart, setVictoryChart] = useState(null);
    const [VictoryLine, setVictoryLine] = useState(null);

    useEffect(() => {
        const loadVictoryComponents = async () => {
            const victoryModule = await import('victory-native');
            setVictoryChart(() => victoryModule.VictoryChart);
            setVictoryLine(() => victoryModule.VictoryLine);
        };

        loadVictoryComponents();
    }, []);

    if (!VictoryChart || !VictoryLine) {
        return null; // or return a loading spinner
    }

    return (
        <VictoryChart
            width={size[0]}
            height={size[1]}
            domainPadding={{ x: [0, 0], y: [2, 2] }}
        >
            <VictoryLine
                interpolation="basis"
                animate={{
                    duration: 2000,
                    onLoad: { duration: 1000 }
                }}

                style={{
                    data: { stroke: getColor("green"), },

                }}
                data={dataChart}
            />
        </VictoryChart>
    );
}



export default function ElementChart({ data }) {

    const [chartParams, setChartParams] = useState(data.params);
    const [dataChart, setDataChart] = useState([]);
    const [size, setSize] = useState([300, 300]);

    const fetchData = async () => {
        if (data.endpoint) {
            const queryParams = Object.entries(chartParams)
                .map(([key, value]) => `&params[]=${encodeURIComponent(value)}`)
                .join('');
            const sUrl = '/api.php?r=' + data.endpoint + queryParams;
            const sResponse = await fetcher(sUrl);
            if (sResponse?.data?.data) {
                const transformedData = sResponse.data.data.map(([x, y]) => ({ x: new Date(x), y: y }));
                setDataChart(transformedData);
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [chartParams]);

    const setParamValue = (key, value, format = '') => {
        if (format == 'date') {
            const date = new Date(value * 1000);
            value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        setChartParams({
            ...chartParams,
            [key]: value
        });
    }

    let CharComponent = null;

    if (data.type == 'pie') {
        const transformedData = data.labels.map((label, index) => {
            return { x: '', y: data.data.data[index] };
        });
        var backgroundColor = appSetting('layout', 'profile_colors');
        var backgroundColor2 = backgroundColor.map(color => getColor(color));
        CharComponent = (
            <View>
                <View className='w-full aspect-square'>
                    <VictoryPieChart colorScale={backgroundColor2} data={transformedData} />
                </View>
                <Row className='gap-x-2 mb-4 justify-center'>
                    {data.labels.map((label, index) => (
                        <Row key={"chart" + index} className='gap-x-2'>
                            <View className={'aspect-square w-4  bg-' + backgroundColor[index] + '-500'}></View>
                            <Text key={index}>{label}</Text>
                        </Row>
                    ))}
                </Row>
                {data.text && <Text className=" text-center text-xl font-medium">{data.text}</Text>}
            </View>
        )
    }

    if (data.type == 'line') {
        CharComponent = (
            <>
                <View className='w-full aspect-video' onLayout={(event) => {
                    setSize([event.nativeEvent.layout.width, event.nativeEvent.layout.height]);
                }}
                >
                    <VictoryLineChart size={size} dataChart={dataChart}/>
                </View>
                <View className='lg:flex-row gap-4 lg:mx-auto'>
                    {
                        Object.keys(data.form.inputs).map((key, index) => (
                            <View key={index}>
                                {
                                    data.form.inputs[key].type == 'select' && (
                                        (() => {
                                            let values = [];
                                            if (Array.isArray(data.form.inputs[key].values)) {
                                                values = data.form.inputs[key].values.map(function (key) {
                                                    return key.value ? { label: key.value, value: key.key } : null;
                                                });
                                                values = values.filter(Boolean);
                                            }
                                            return (
                                                <View >
                                                    <Dropdown
                                                        labelField="label"
                                                        valueField="value"
                                                        onChange={(value) => setParamValue(data.form.inputs[key].name, value)}
                                                        data={values}
                                                    />
                                                </View>
                                            );
                                        })()
                                    )
                                }
                                {
                                    data.form.inputs[key].type == 'datepicker' && (
                                        <View>
                                            <Calendar value={data.form.inputs[key].value} type={data.form.inputs[key].type} name={data.form.inputs[key].name} onChange={(value) => { setParamValue(data.form.inputs[key].name, value, 'date') }} />
                                        </View>
                                    )
                                }
                            </View>
                        ))
                    }
                </View>
            </>
        );
    }
    return (
        <>
            <View className='mb-4'>
                <Text className="text-lg font-bold text-neutral-800 dark:text-neutral-200">{data.title}</Text>
            </View>
            <View className='max-w-5xl w-full mx-auto'>
                {CharComponent}
            </View>
        </>
    )
}
