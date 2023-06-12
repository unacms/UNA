'use client'

import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Platform } from 'react-native'
import {StyleSheet, PixelRatio} from 'react-native';
import { useState } from "react";
import { appSetting } from 'app/lib/util'
import { env } from 'app/lib/env'

export const SolitoImageStyled = styled(SolitoImage)

function extractStyleWidth(style) {
    if (style) {
      const { width } = StyleSheet.flatten(style);
  
      if (typeof width === 'number') {
        return width;
      }
    }
}

const config = {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
};
  
const SIZES = [...config.imageSizes, ...config.deviceSizes];
  
function normalizeWidth(width) {
    const calculatedSize = PixelRatio.getPixelSizeForLayoutSize(width);
    const matchingIndex = SIZES.findIndex((size) => size >= calculatedSize);
    
    if (matchingIndex === -1) {
      return SIZES[SIZES.length - 1];
    } else if (matchingIndex === 0) {
      return SIZES[0];
    } else {
      const left = SIZES[matchingIndex - 1];
      const right = SIZES[matchingIndex];
  
      if ((left + right) / 2 > width) {
        return left;
      }
  
      return right;
    }
}

export default function ElementImage(props) {
    
    let {width, height, alt, src, style, ...rest} = props; // remove width & height
    if (!src)
        return null;
    if (!alt)
        alt = "";    

    if (rest.view == "cover"){
        rest.fill = 'fill'
    }
    else{   
        rest.height = props.pref_height ? props.pref_height : height;
        rest.width = props.pref_width ? props.pref_width : width;
        if (Platform.OS != 'web'){
            rest.height = 'auto';
        }
    }

    let srcImIn = appSetting("urls", "images") + src;


    if (Platform.OS != 'web'){
        const imageWidth = extractStyleWidth(style) || width;
        let w = normalizeWidth(imageWidth);
        if (w > 256)
            w = 256;
        src = env('API_PROXY_URL').replace('/api', '/') +  "/_next/image?url=" + src + "&w=" + w + "&q=75"
      //  srcImIn = env('API_PROXY_URL').replace('/api', '/') +  "/_next/image?url=" + src + "&w=" + w + "&q=75";
      srcImIn = src;
    }
    
    const [srcIm, setSrcIm] = useState(srcImIn);
    const [srcOr, setSrcOr] = useState(src);
    const handleImageLoad = (e) => {
      if (srcIm!=srcOr){
        setSrcIm(srcOr)
      }

    };
  
    return (
            <SolitoImageStyled 
              priority={true} 
              {...rest} 
              src={srcIm} 
              alt={alt} 
              style={style} 
              onLoadingComplete={(e) => {
                handleImageLoad(e);
              }}
            />
    );
}
