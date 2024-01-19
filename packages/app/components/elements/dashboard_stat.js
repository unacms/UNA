import { View, Row, Sc } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/ui/molecules/card'
import { fetcher } from 'app/lib/fetcher';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'

function getCounter(num, icon = '', add = '') {
    if (!num) num = 0;
    let sColor = 'gray'

    if (num > 0) {
        sColor = 'green'
        if (icon == '')
            icon = 'ArrowFatUp';
    }
    if (num < 0) {
        sColor = 'red'
        if (icon == '')
            icon = 'ArrowFatDown';
    }

    return (
        <Row className={'mb-auto    text-' + sColor + '-800 bg-' + sColor + '-200 dark:bg-' + sColor + '-950 gap-x-1 py-1 px-2 rounded-full mb-auto dark:text-' + sColor + '-200 '}>
            <Icon className={"text-" + sColor + "-600 dark:text-" + sColor + "-400"} icon={icon} width={16} height={16} />
            <Text className={"flex-none text-" + sColor + "-800 dark:text-" + sColor + "-200 text-xs"}>{num}{add}</Text>
        </Row>
    )
}

export default function ElementDashboardStat(props) {
    const { t } = useTranslation();
    const [data, setData] = useState(props.data);
    let { currentUser, setCurrentUser } = useCurrentUser()
    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await fetcher('/api.php?r=system/get_stat_block/TemplDashboardServices');
            setData(sResponse.data[0].data);
        };
        fetchData();
    }, []);

    let menu = appSetting('menu', 'dashboard')

    let menu_manage = appSetting('menu', 'dashboard_manage')
    if (!currentUser.moderator)
        menu_manage = [];

    return (
        <>
            <Row className="flex-wrap flex-auto mb-auto ">
                {menu.map((item2, index) => {
                    let item = data[item2.key];
                    if (item) {
                        if (item?.type != 'growth') {
                            return <View className="  w-1/2 lg:w-1/3 xl:w-1/4 p-2 duration-300 " key={index}>
                                <Link href={item2.link}>
                                    <Card rounded=" rounded-2xl " addClassName="w-full p-2 gap-y-2" >
                                        <Row className='space-x-1 w-full justify-between'>
                                            {
                                                item.count > 0 ? <Text className=" text-3xl -translate-y-1 font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                                                    {item.count}
                                                </Text> : <View><Link href={item2.link2} emulate={true}><Button variant="outline" startDecorator="Plus" size="sm" rounded /></Link></View>
                                            }
                                            {getCounter(item[item2.action], item2.action_icon)}
                                        </Row>
                                        <Row className="w-full my-auto gap-x-2 ">

                                            <Text className=" sm:text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                                                {t(item2.title)}
                                            </Text>
                                            <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                <Icon icon={item2.icon} width={24} height={24} />
                                            </View>
                                        </Row>
                                    </Card>
                                </Link>
                            </View>;
                        }
                        return (
                            <View className=" w-1/2 lg:w-1/3  xl:w-1/4 p-2 duration-300 " key={index}>
                                <Link href={item2.link} key={index}>
                                    <Card rounded=" rounded-2xl " addClassName="w-full p-2 gap-y-2" margin="a">
                                        <Row className=''>
                                            <Text className=" text-3xl -translate-y-1 font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                                                {item.current}
                                            </Text>
                                            {getCounter(item.growth, '', '%')}

                                        </Row>
                                        <Row className="w-full my-auto gap-x-2 ">

                                            <Text className=" sm:text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                                                {t(item2.title)}
                                            </Text>
                                            <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                                <Icon icon={item2.icon} width={24} height={24} />
                                            </View>
                                        </Row>
                                    </Card>
                                </Link>
                            </View>
                        )
                    }
                })}
            </Row>

            {menu_manage.length > 0 && <View className='mt-4'>
                <View className='ml-4 mb-2'>
                    <Text className="text-lg  text-neutral-800 dark:text-neutral-200  font-semibold">Manage tools</Text>
                </View>
                <Row className="flex-wrap flex-auto mb-auto ">
                    {menu_manage.map((item2, index) => {
                        return <View className="  w-1/2 lg:w-1/3 xl:w-1/4 p-2 duration-300 " key={index}>
                            <Link href={item2.link}>
                                <Card rounded=" rounded-2xl " addClassName="w-full  p-4 gap-y-2" >

                                    <Row className="w-full my-auto gap-x-2 items-center">
                                        <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                                            <Icon icon={item2.icon} width={24} height={24} />
                                        </View>
                                        <Text className=" sm:text-lg flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                                            {t(item2.title)}
                                        </Text>

                                    </Row>
                                </Card>
                            </Link>
                        </View>;
                    })}
                </Row></View>}
        </>
    )
}
