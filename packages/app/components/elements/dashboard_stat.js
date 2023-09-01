import { View, Row } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'

function getCounter(num, icon='', add='') {
    if (!num) num = 0;
    let sColor = 'gray'

    if (num > 0){
        sColor = 'green'
        if (icon == '')
            icon = 'ArrowFatUp';
    }
    if (num < 0){
        sColor = 'red'
        if (icon == '')
            icon = 'ArrowFatDown';
    }

    return <Row className={'my-auto  text-'+sColor+'-800 bg-'+sColor+'-200 dark:bg-'+sColor+'-950 gap-x-1 py-1 px-2 rounded-full dark:text-'+sColor+'-200 '}>
    <Icon className={"text-"+sColor+"-600 dark:text-"+sColor+"-400"} icon={icon} width={16} height={16} />
    <Text className={"flex-none text-"+sColor+"-800 dark:text-"+sColor+"-200 text-xs"}>{num}{add}
    </Text>
    </Row>
}

export default function ElementDashboardStat(props) {
    let menu = appSetting('menu', 'dashboard') 

    return (
        <Row className="flex-wrap flex-auto mb-auto "> 

        {menu.map((item2, index) => {
            let item = props.data[item2.key];
            console.log(item, item2.action, item[item2.action]);
            if (item.type != 'growth') {
                return <View className=" w-1/2 lg:w-1/3 p-2">
                <Link href={item2.link}>
                  <View
                    className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
                  >
                    <Row className='space-x-1 w-full justify-between'>
                      {
                        item.count > 0 ? <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                        {item.count}
                        </Text> : <View><Link href={item2.link2} emulate={true}><Button title="Add new" size="sm" rounded/></Link></View>
                      }
                      {getCounter(item[item2.action], item2.action_icon)}
                    </Row>
                    <Row className="w-full my-auto gap-x-2 ">
                      <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                        <Icon icon={item2.icon} width={24} height={24} />
                      </View>
                      <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                      {item2.title}
                      </Text>
                    </Row>
                  </View>
                </Link>
              </View>;
            }
            return <View className=" w-1/2 lg:w-1/3 p-2">
          
            <Link href={item2.link} key={index}>
              <View
                className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
              >
                <Row className=''>
                <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                {item.current} 
                </Text>
                {getCounter(item.growth, '', '%')}
               
                </Row>
                <Row className="w-full my-auto gap-x-2 ">
                  <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                    <Icon icon={item2.icon} width={24} height={24} />
                  </View>
                  <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                   {item2.title}
                  </Text>
                </Row>
              </View>
            </Link>
          </View>;
        })}

            
        </Row>   
    ) 
    /*
    <View className=" w-1/2 lg:w-1/3 px-2 py-1.5 ">
          <Link href="/account-settings-email">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                        sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto w-auto">
                <Button variant="outline" startDecorator="Gear" rounded />
              </Row>
              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto  text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Settings
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5 ">
          <Link href="/logout">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                        sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button variant="outline" startDecorator="SignOut" rounded />
              </Row>

              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Sign out
                </Text>
              </View>
            </View>
          </Link>
        </View>
        */
}
