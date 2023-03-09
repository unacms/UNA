import { A, H1, P, Text, TextLink } from 'app/design/typography'
import React, { useCallback, useMemo, useRef,useState } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet,  } from 'react-native';
import { Button } from 'app/design/controls'
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import {
  ScrollView,
  FlatList
} from 'react-native-gesture-handler';

import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import HomeSVG from 'app/design/HomeSVG';
import AnimatedTabBar, {AnimatedTabBarView, TabsConfig, BubbleTabBarItemConfig} from '@gorhom/animated-tabbar';


export function PostScreen() {

  interface AnimatedSVGProps {
    /**
     * The tab animated focus:
     * 1 is active
     * 0 is inactive
     */
    animatedFocus: Animated.Node<number>;
  
    /**
     * Animated color.
     */
    color: Animated.Node<string>;
  
    /**
     * Icon size.
     */
    size: number;
  }

  
  const AnimatedPath = Animated.createAnimatedComponent(Path);
  
  
  
  const AnimatedSVG = ({ animatedFocus, color, size }: AnimatedSVGProps) => {
    return (
      <Svg width={24} height={24} viewBox="0 0 20 22">
        <AnimatedPath
          d="M1 8l9-7 9 7v11a2 2 0 01-2 2H3a2 2 0 01-2-2V8z"
          stroke={color}
          strokeWidth={2}
          fill="none"
          fillRule="evenodd"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  };


  const tabs: TabsConfig<BubbleTabBarItemConfig> = {
    Home: {
      labelStyle: {
        color: '#5B37B7',
      },
      icon: {
        component: HomeSVG ,
        activeColor: 'rgba(91,55,183,1)',
        inactiveColor: 'rgba(0,0,0,1)',
      },
      background: {
        activeColor: 'rgba(223,215,243,1)',
        inactiveColor: 'rgba(223,215,243,0)',
      },
    },
    Profile: {
      labelStyle: {
        color: '#1194AA',
      },
      icon: {
        component: HomeSVG ,
        activeColor: 'rgba(17,148,170,1)',
        inactiveColor: 'rgba(0,0,0,1)',
      },
      background: {
        activeColor: 'rgba(207,235,239,1)',
        inactiveColor: 'rgba(207,235,239,0)',
      },
    },
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#999',
    },
    tabBarContainer: {
      borderRadius: 25,
    },
  });

  const [index, setIndex] = useState(0);


  
  return (
    <View style={styles.container}>
      <Text>{index}</Text>
      <AnimatedTabBarView
        tabs={tabs}
        itemOuterSpace={{
          horizontal: 6,
          vertical: 12,
        }}
        itemInnerSpace={12}
        iconSize={20}
        style={styles.tabBarContainer}
        index={index}
        onIndexChange={setIndex}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
});









