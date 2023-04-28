import React from "react";

import { FlashList } from "@shopify/flash-list";

import { useHeaderTabContext } from "showtime-tab-view";

import { TabFlashListScrollView } from "./tab-flash-list-scroll-view";


const handleEndReached = () => {  
    console.log('End reached')
  };
  
  const handleLayout = (event) => {
    console.log(5555555555, event)
   };
 

function TabFlashListComponent(
  props,
  ref
) {
  const { scrollViewPaddingTop } = useHeaderTabContext();
  return (
    <>
    <FlashList
      {...props}
      renderScrollComponent={TabFlashListScrollView as any}
      contentContainerStyle={{ paddingTop: scrollViewPaddingTop }}
      ref={ref}
      onScroll={handleLayout}
      onEndReachedThreshold={0.5}
      onEndReached ={handleEndReached} 
    /></>
  );
}

export const TabFlashList = React.forwardRef(TabFlashListComponent) ;