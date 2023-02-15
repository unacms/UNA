import Image from '../atoms/image';
import Link from '../atoms/link';
import Time from '../atoms/time';
import Profile from '../atoms/profile';

import { Text, H1 } from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'

// g-med style browsing
export default function UnitGeneral(props) {
    let data = props.data;
   
const {height, width, scale, fontScale} = useWindowDimensions();
    
    var _margin = 8;
    var _margin2 = 8;
    var _col2w = 1000;  
    var _col1w = 600;    
    
    let w = width/3 - _margin * 2 ;
    if (width < _col2w)
        w = width - _margin * 2 - 2;  
    let wi = w/3;
    let wt = w - wi - 2*_margin2-2;
    
    if (width <_col1w || width>_col2w){
        wi = w;
        wt = w;
    }
    
  /*  let fb = (_col2w - width) * 2000;
    let fb2 = (_col1w - width) * 2000;*/
    let mw = w - 2 * _margin2;
    const styles = StyleSheet.create({
      card_list: {
          flexWrap: 'wrap',
          flexDirection:'row',
          flexShrink:1 
      },
      card: {
        width: w,
        flexShrink:1,
       // flexBasis: fb,
        flexGrow: 0,
        alignContent: 'flex-start',
        borderRadius: 10,
        flexDirection:'row',
        background:'red',
          flexWrap: 'wrap',
          flexShrink:1,
           margin:_margin,
      },
     card_image: {
         width:wi,

       //  flexBasis: fb2,
        // margin: _margin2,
         //height:200,
        //background:'red'
     },
    card_image2: {
        margin: _margin2
     },    
     card_text: {
         width:wt,
         flexGrow: 1,
        // flexBasis: fb2,
     },
    card_text2: {
         margin:_margin2,
     }     
    });
    
    let im_w = 200;//wi - 2 * _margin2;
    let im_h = 200;//data.image.height*im_w/data.image.width;
    

    function SnippetInfo(props) {
        return (
           <View className="hidden sm:inline-flex items-center  font-medium tracking-tight text-green-500 text-xs">
                {/*<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 101.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 013.095 2.348.75.75 0 00.992 0 26.547 26.547 0 015.93-3.95.75.75 0 00.42-.739 41.053 41.053 0 00-.39-3.114 29.925 29.925 0 00-5.199 2.801 2.25 2.25 0 01-2.514 0c-.41-.275-.826-.541-1.25-.797a6.985 6.985 0 01-1.084 3.45 26.503 26.503 0 00-1.281-.78A5.487 5.487 0 006 12v-.54z" clipRule="evenodd" />
                </svg>*/}
                <Text className="pl-1">Dermatology</Text>
            </View>
        );
    }
    return (
        <View className="card_ist" style={styles.card_list}>
        <View className="card border-gray-700/50 border" style={styles.card}>
            <View style={styles.card_image} >
                <View  style={styles.card_image2}>
                    <Image src={data.image.src}  width={im_w}  height={im_h}  alt={data.title} className="rounded aspect-video" />
                </View>
            </View>
            <View style={styles.card_text}>
               
                   <Text style={styles.card_text2}> {Platform.OS}{im_w}I've been using UNA since 11 Sep 2020, I'm running it on two web sites. Last week a really well known Bitchute & Gab Icon made a posting about my web site and how awesome it was. Over the next two days I added almost 2 thousand users without any glitches or crashes on a VPS server. This software is robust and bad ass. Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here</Text>
            
            </View>       
</View>
       
      <View className="card border-gray-700/50 border" style={styles.card}>
            <View style={styles.card_image} >
                <View  style={styles.card_image2}>
                    <Image {...data.image} alt={data.title} className="rounded aspect-video" />
                </View>
            </View>
            <View style={styles.card_text}>
               
                   <Text style={styles.card_text2}> I've been using UNA since 11 Sep 2020, I'm running it on two web sites. Last week a really well known Bitchute & Gab Icon made a posting about my web site and how awesome it was. Over the next two days I added almost 2 thousand users without any glitches or crashes on a VPS server. This software is robust and bad ass. Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here</Text>
            
            </View>       
</View>

      <View className="card border-gray-700/50 border" style={styles.card}>
            <View style={styles.card_image} >
                <View  style={styles.card_image2}>
                    <Image {...data.image} alt={data.title} className="rounded aspect-video" />
                </View>
            </View>
            <View style={styles.card_text}>
               
                   <Text style={styles.card_text2}> I've been using UNA since 11 Sep 2020, I'm running it on two web sites. Last week a really well known Bitchute & Gab Icon made a posting about my web site and how awesome it was. Over the next two days I added almost 2 thousand users without any glitches or crashes on a VPS server. This software is robust and bad ass. Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here</Text>
            
            </View>       
</View>
     
        
      <View className="card border-gray-700/50 border" style={styles.card}>
            <View style={styles.card_image} >
                <View  style={styles.card_image2}>
                    <Image {...data.image} alt={data.title} className="rounded aspect-video" />
                </View>
            </View>
            <View style={styles.card_text}>
               
                   <Text style={styles.card_text2}> I've been using UNA since 11 Sep 2020, I'm running it on two web sites. Last week a really well known Bitchute & Gab Icon made a posting about my web site and how awesome it was. Over the next two days I added almost 2 thousand users without any glitches or crashes on a VPS server. This software is robust and bad ass. Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here Thank you and kudos goes out to the developers and those of you who help others on here. In case you're wondering, the web site that's using the software and rocking and rolling is here</Text>
            
            </View>       
</View>
        
</View>
        /*
        <Link href={data.url} className="">
         <View className="mt-[1px] sm:h-48 sm:mt-2 sm:first:mt-4 overflow-hidden border-gray-300/80 hover:border-gray-300  bg-white active:bg-gray-100 sm:hover:bg-gray-50 dark:active:bg-gray-700 dark:bg-gray-900 sm:dark:hover:bg-gray-800 dark:border-gray-800/50 dark:hover:border-gray-700/50 p-4  sm:hover:-translate-y-0.5 sm:hover:shadow-sm sm:border  sm:active:translate-y-1 sm:duration-300   sm:rounded-lg   gap-4 w-full">
        <View className="flex gap-4 w-full h-full">
            <View className=" flex-none sm:hidden h-min relative">
                <Profile {...data.author_data} displayType="unit_wo_info"  />
            </View>
            <View className="flex flex-row-reverse gap-4 flex-auto">
                    {data.image &&
                        <View className="hidden sm:block -my-2 -mx-2 h-44 aspect-video flex-none"><Image {...data.image} alt={data.title} className="rounded aspect-video" /></View>
                    } 
                    <View className="flex flex-auto flex-col-reverse sm:flex-col  ">
                        <View className="flex flex-col flex-auto gap-2">
                            <View className='flex gap-2'>
                                <h2 className="text-base flex-auto line-clamp-2 leading-tight sm:text-lg sm:leading-tight  font-bold tracking-tight text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400  ">{data.title}</h2>
                                <View className="hidden sm:inline-flex whitespace-nowrap mb-auto  flex-none font-medium tracking-tight bg-gray-100 text-gray-600 text-xs   items-center px-1 py-0.5 my-0.5 rounded-full  dark:bg-gray-700/50 dark:hover:bg-gray-600 hover:bg-gray-200 dark:text-gray-300">
                                    <Time className="px-0.5" ts={data.added}></Time>
                                </View>
                            </View>
                            
                            <p className="text-sm hidden sm:block sm:line-clamp-2  text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300  ">{data.summary_plain}</p>
                        </View>
                        <View className="flex flex-none gap-4">
                            <View className="flex-none hidden sm:block relative">      
                             
                                <Profile {...data.author_data} displayType="unit"  showLinks="false" showInfo=<SnippetInfo {...data} /> />
                            </View>
                            <View className="sm:hidden flex-auto">
                                <Profile {...data.author_data} displayType="unit_wo_image" showLinks="false" showInfo="false" />
                            </View>
                            <View className="sm:hidden whitespace-nowrap mb-auto  flex-none font-medium tracking-tight bg-gray-100 text-gray-600 text-xs  inline-flex items-center px-1 py-0.5 rounded-full  dark:bg-gray-700/50 dark:hover:bg-gray-600 hover:bg-gray-200 dark:text-gray-300">
                                <Time className="px-0.5" ts={data.added}></Time>
                            </View>
                        </View>
                    </View> 
            </View>
        </View>
        </View>
    </Link>   */
    );
}
