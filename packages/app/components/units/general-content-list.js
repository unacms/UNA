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
            width: width,
            borderRadius: 0,
            marginLeft:0,
            marginRight:0,
            marginBottom:8,
          
          },
         card_image: {
             width:width-2,
             borderRadius: 0,
         },    
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
        <View className="u-card" style={styles.card}>
       <View className="bg-card  duration-200 hover:shadow-lg active:shadow-none dark:bg-card-dark overflow-hidden border sm:rounded-lg hover:border-bordercolor/20  border-bordercolor/10 dark:border-bordercolor-dark/10 dark:hover:border-bordercolor-dark/20  w-full">
                 <Link href={data.url}>
           
                        
        {data.image &&
                    <View className="w-full bg-gray-500/20 aspect-video w-full overflow-hidden items-center" >
                        <Image {...data.image} alt={data.title} view="cover" className="u-cover" style={styles.card_image} />
                        
                    </View>
                } 
        {!data.image &&<View className="bg-brand/10 dark:bg-brand-dark/10  w-full sm:rounded-t-md aspect-video"></View> }
        
        <View className="px-4">
                          <View className=" overflow-hidden w-full my-3 h-10  ">
                              <Text className='text-gray-800    dark:text-gray-200 text-base leading-5  tracking-tight font-semibold'>
                              {data.title}
                              </Text>
                              <Text className=" text-gray-600 dark:text-gray-400 mt-1">{data.summary_plain}</Text>   
                          </View>
                          
                          <View className='pb-3'>
                              <Profile {...data.author_data} displayType="minimal" displaySize="xs"  className="" />
                            </View>
         </View>
                      
            </Link>
             </View>
               </View>  
                
       
      );
}
