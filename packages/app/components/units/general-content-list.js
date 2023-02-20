import Image from '../atoms/image';
import Link from '../atoms/link';
import Time from '../atoms/time';
import Profile from '../atoms/profile';

import { Text, H1 ,TextLink} from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import {Platform, PlatformIOSStatic} from 'react-native'

// g-med style browsing
export default function UnitGeneral(props) {
    let data = props.data;
   
const {height, width, scale, fontScale} = useWindowDimensions();
    
    let styles = StyleSheet.create({
    });
    
    if (Platform.OS != 'web'){
    
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
        let mw = w - 2 * _margin2;
        
        styles = StyleSheet.create({
          card: {
            width: w,
            flexShrink:1,
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
         },  
         card_text: {
             width:wt,
             flexGrow: 1,
         }   
        });
    }
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
           
            <View className='flex-col border-none bg-white dark:bg-gray-800 overflow-hidden mb-2 sm:m-2 sm:rounded-lg' style={styles.card}>
                 <Link href={data.url}>
                {data.image &&
                    <View style={styles.card_image} className="u-card-media flex-row aspect-video"><Image {...data.image} alt={data.title} prefWidth="500" prefHeight="400" className="u-image w-full aspect-video" /></View>
                }  
                <View className="u-card-content flex-col flex-grow" style={styles.card_text}>
                    
                    <View className='flex-col grow flex-1 mx-4 my-3'>
                        <View className='flex-row '>
                            <View className="flex-row flex-1">
                                <View className="flex-auto flex-row space-x-2">
                                    <View className="flex-none">
                                        <Profile {...data.author_data} displayType="unit_wo_info" className="" />
                                    </View>
                                    <View className="flex-none">
                                        <Profile {...data.author_data} displayType="unit_wo_image" showLinks="false" showInfo={(<Time className="" ts={data.added}></Time>)} className="" />     
                                    </View>
                                </View>
                                
                            </View> 
                        </View>
                        <Text className="text-lg  font-bold tracking-tight leading-5 text-gray-900 dark:text-gray-50 mt-3">{data.title}</Text>
                        <Text className=" text-gray-600 dark:text-gray-400 mt-1">{data.summary_plain}</Text>   
                    </View>
                </View>
                <View className='flex-none bg-gray-100 dark:bg-gray-900/50 px-4 py-3 u-card-bar w-full'>
                        <Text className="text-gray-600 dark:text-gray-400 text-xs">158 views</Text>
                        
                    </View>
                </Link>
            </View> 
       
      );
}
