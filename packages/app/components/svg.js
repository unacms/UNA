import { View } from 'app/design/view'

import Svg, {
  Circle,
  Path,
  Rect,
  Line,
  Polyline,
  Polygon,
  G,
  LinearGradient,
  Stop,
  Defs,
} from 'react-native-svg'
import { StyleSheet } from 'react-native'
export function Icon(props) {
  let { icon, className, ...rest } = props
  let data = null

  switch (icon) {
    case 'logo-mark':
      data = (
        <Svg
          className={className}
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Rect
            x="21.0051"
            y="120"
            width="60"
            height="60"
            rx="4"
            transform="rotate(-45 21.0051 120)"
            fill="currentColor"
          />
          <Rect
            x="77.5736"
            y="63.4315"
            width="60"
            height="60"
            rx="4"
            transform="rotate(-45 77.5736 63.4315)"
            fill="currentColor"
            className="group-hover:animate-pulse "
          />
          <Rect
            x="77.5736"
            y="176.569"
            width="60"
            height="60"
            rx="4"
            transform="rotate(-45 77.5736 176.569)"
            fill="currentColor"
          />
          <Rect
            x="134.142"
            y="120"
            width="60"
            height="60"
            rx="4"
            transform="rotate(-45 134.142 120)"
            fill="currentColor"
          />
          <Defs>
            <linearGradient
              id="paint0_linear_90_6"
              x1="81.0086"
              y1="119.996"
              x2="20.9045"
              y2="180.101"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#F59E0B" />
              <stop offset="1" stop-color="#F97316" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_90_6"
              x1="137.577"
              y1="63.4279"
              x2="77.4731"
              y2="123.532"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#F59E0B" />
              <stop offset="1" stop-color="#F97316" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_90_6"
              x1="137.577"
              y1="176.565"
              x2="77.4731"
              y2="236.669"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#F59E0B" />
              <stop offset="1" stop-color="#F97316" />
            </linearGradient>
            <linearGradient
              id="paint3_linear_90_6"
              x1="194.146"
              y1="119.996"
              x2="134.042"
              y2="180.101"
              gradientUnits="userSpaceOnUse"
            >
              <stop stop-color="#F59E0B" />
              <stop offset="1" stop-color="#F97316" />
            </linearGradient>
          </Defs>
        </Svg>
      )
      break

    case 'neo-mark':
      data = (
        <Svg
          className={className}
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <G opacity="0.7">
            <Path
              d="M122.564 96.8414L20.0986 199.307L114.682 152.015L122.564 96.8414Z"
              fill="url(#paint0_linear_2_130597)"
            />
            <Path
              d="M156.72 182.23L259.185 79.7637L164.602 127.056L156.72 182.23Z"
              fill="url(#paint1_linear_2_130597)"
            />
          </G>
          <Path
            d="M156.72 62.6862L122.564 96.8415V216.385L156.72 182.23V62.6862Z"
            fill="url(#paint2_linear_2_130597)"
          />
          <Defs>
            <LinearGradient
              id="paint0_linear_2_130597"
              x1="139.642"
              y1="79.7637"
              x2="139.642"
              y2="199.307"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stop-color="#FB923C" />
              <Stop offset="1" stop-color="#EA580C" />
            </LinearGradient>
            <LinearGradient
              id="paint1_linear_2_130597"
              x1="139.642"
              y1="79.7637"
              x2="139.642"
              y2="199.307"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor="#FB923C" />
              <Stop offset="1" stopColor="#EA580C" />
            </LinearGradient>
            <LinearGradient
              id="paint2_linear_2_130597"
              x1="139.642"
              y1="62.6862"
              x2="139.642"
              y2="216.385"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor="#FB923C" />
              <Stop offset="1" stop-color="#EA580C" />
            </LinearGradient>
          </Defs>
        </Svg>
      )
      break

    case 'logo-text':
      data = (
        <Svg
          className={className + ' mr-0 ml-0'}
          viewBox="0 0 326 118"
          fill="none"
        >
          <Path
            d="M0.63664 116V2.38114H15.9905L22.617 24.3615V116H0.63664ZM79.184 116L11.7884 28.7252L15.9905 2.38114L83.3861 89.6559L79.184 116ZM79.184 116L72.8808 94.6662V2.38114H95.0227V116H79.184ZM118.064 116V2.38114H140.044V116H118.064ZM134.226 116V96.6056H197.096V116H134.226ZM134.226 67.3524V48.6045H191.439V67.3524H134.226ZM134.226 21.7755V2.38114H196.288V21.7755H134.226ZM266.409 117.778C258.113 117.778 250.355 116.269 243.136 113.252C236.025 110.236 229.775 106.087 224.388 100.808C219.109 95.4204 214.96 89.1711 211.943 82.0598C208.927 74.8408 207.418 67.1369 207.418 58.9481C207.418 50.7594 208.873 43.1633 211.782 36.1597C214.799 29.0484 218.947 22.853 224.227 17.5734C229.614 12.1861 235.863 8.03784 242.974 5.12868C250.086 2.11177 257.79 0.603316 266.086 0.603316C274.49 0.603316 282.248 2.11177 289.359 5.12868C296.471 8.03784 302.666 12.1861 307.946 17.5734C313.333 22.853 317.535 29.0484 320.552 36.1597C323.569 43.271 325.077 50.921 325.077 59.1098C325.077 67.2985 323.569 74.9485 320.552 82.0598C317.535 89.1711 313.333 95.4204 307.946 100.808C302.666 106.087 296.471 110.236 289.359 113.252C282.356 116.269 274.706 117.778 266.409 117.778ZM266.086 97.2521C273.413 97.2521 279.77 95.6359 285.157 92.4035C290.545 89.1711 294.747 84.6996 297.764 78.989C300.888 73.2784 302.451 66.5982 302.451 58.9481C302.451 53.3453 301.589 48.2273 299.865 43.5942C298.141 38.9611 295.663 34.9745 292.43 31.6344C289.198 28.1865 285.373 25.5467 280.955 23.715C276.538 21.8833 271.581 20.9674 266.086 20.9674C258.975 20.9674 252.672 22.5836 247.177 25.816C241.789 28.9407 237.533 33.3583 234.409 39.0689C231.392 44.7795 229.883 51.4059 229.883 58.9481C229.883 64.6587 230.745 69.8844 232.469 74.6253C234.301 79.3661 236.779 83.4066 239.904 86.7468C243.136 90.0869 246.961 92.6728 251.379 94.5045C255.904 96.3362 260.807 97.2521 266.086 97.2521Z"
            fill="currentColor"
          />
        </Svg>
      )
      break

    case 'discover':
      data = (
        <Svg className={className + ' mr-0 ml-0'} viewBox="0 0 24 24">
          <Path
            fill="currentColor"
            d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm1,17.93V19a1,1,0,0,0-2,0v.93A8,8,0,0,1,4.07,13H5a1,1,0,0,0,0-2H4.07A8,8,0,0,1,11,4.07V5a1,1,0,0,0,2,0V4.07A8,8,0,0,1,19.93,11H19a1,1,0,0,0,0,2h.93A8,8,0,0,1,13,19.93ZM15.14,7.55l-5,2.12a1,1,0,0,0-.52.52l-2.12,5a1,1,0,0,0,.21,1.1,1,1,0,0,0,.7.3.93.93,0,0,0,.4-.09l5-2.12a1,1,0,0,0,.52-.52l2.12-5a1,1,0,0,0-1.31-1.31Zm-2.49,5.1-2.28,1,1-2.28,2.28-1Z"
          />
        </Svg>
      )
      break

    case 'about':
      data = (
        
          <Svg className={className + ' mr-0 ml-0'} fill='currentColor' viewBox="0 0 24 24">
            <Path d="M22.601 2.062a1 1 0 0 0-.713-.713A11.252 11.252 0 0 0 10.47 4.972L9.354 6.296 6.75 5.668a2.777 2.777 0 0 0-3.387 1.357l-2.2 3.9a1 1 0 0 0 .661 1.469l3.073.659a13.42 13.42 0 0 0-.555 2.434 1 1 0 0 0 .284.836l3.1 3.1a1 1 0 0 0 .708.293c.028 0 .057-.001.086-.004a12.169 12.169 0 0 0 2.492-.49l.644 3.004a1 1 0 0 0 1.469.661l3.905-2.202a3.035 3.035 0 0 0 1.375-3.304l-.668-2.76 1.237-1.137A11.204 11.204 0 0 0 22.6 2.062ZM3.572 10.723l1.556-2.76a.826.826 0 0 1 1.07-.375l1.718.416-.65.772a13.095 13.095 0 0 0-1.59 2.398Zm12.47 8.222-2.715 1.532-.43-2.005a11.34 11.34 0 0 0 2.414-1.62l.743-.683.404 1.664a1.041 1.041 0 0 1-.416 1.112Zm1.615-6.965-3.685 3.386a9.773 9.773 0 0 1-5.17 2.304l-2.405-2.404a10.932 10.932 0 0 1 2.401-5.206l1.679-1.993a.964.964 0 0 0 .078-.092L11.99 6.27a9.278 9.278 0 0 1 8.81-3.12 9.218 9.218 0 0 1-3.143 8.829Zm-.923-6.164a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5Z"/></Svg>
      )
      break

    case 'home':
      data = (
        <Svg className={className + ' mr-0 ml-0'} viewBox="0 0 24 24">
          <Path
            fill="currentColor"
            d="M20,8h0L14,2.74a3,3,0,0,0-4,0L4,8a3,3,0,0,0-1,2.26V19a3,3,0,0,0,3,3H18a3,3,0,0,0,3-3V10.25A3,3,0,0,0,20,8ZM14,20H10V15a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1Zm5-1a1,1,0,0,1-1,1H16V15a3,3,0,0,0-3-3H11a3,3,0,0,0-3,3v5H6a1,1,0,0,1-1-1V10.25a1,1,0,0,1,.34-.75l6-5.25a1,1,0,0,1,1.32,0l6,5.25a1,1,0,0,1,.34.75Z"
          />
        </Svg>
      )
      break

    case 'contact':
      data = (
        <Svg className={className + ' mr-0 ml-0'}  viewBox="0 0 24 24" ><path fill="currentColor" d="M20.34,9.32l-14-7a3,3,0,0,0-4.08,3.9l2.4,5.37h0a1.06,1.06,0,0,1,0,.82l-2.4,5.37A3,3,0,0,0,5,22a3.14,3.14,0,0,0,1.35-.32l14-7a3,3,0,0,0,0-5.36Zm-.89,3.57-14,7a1,1,0,0,1-1.35-1.3l2.39-5.37A2,2,0,0,0,6.57,13h6.89a1,1,0,0,0,0-2H6.57a2,2,0,0,0-.08-.22L4.1,5.41a1,1,0,0,1,1.35-1.3l14,7a1,1,0,0,1,0,1.78Z"/></Svg>
      )
      break

    case 'contact':
      data = (
        <Svg
          className={className + ' mr-0 ml-0'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Line x1="22" y1="2" x2="11" y2="13"></Line>
          <Polygon points="22 2 15 22 11 13 2 9 22 2"></Polygon>
        </Svg>
      )
      break

    case 'reply':
      data = (
        <Svg className={className + ' mr-0 ml-0'} viewBox="0 0 24 24"><Path fill="currentColor" d="M14.7,6.6h-7l2.9-2.9c0.4-0.4,0.4-1,0-1.4c-0.4-0.4-1-0.4-1.4,0L4.6,6.9l0,0c-0.4,0.4-0.4,1,0,1.4L9.2,13c0.2,0.2,0.4,0.3,0.7,0.3v0c0.3,0,0.5-0.1,0.7-0.3c0.4-0.4,0.4-1,0-1.4L7.7,8.6h7c1.7,0,3,1.3,3,3V21c0,0.6,0.4,1,1,1s1-0.4,1-1v-9.4C19.7,8.9,17.4,6.6,14.7,6.6z"/></Svg>
      )
      break

    case 'messages':
      data = (
        <Svg className={className + ' mr-0 ml-0'} fill='currentColor' viewBox="0 0 24 24">
          <Path d="M17,9H7a1,1,0,0,0,0,2H17a1,1,0,0,0,0-2Zm-4,4H7a1,1,0,0,0,0,2h6a1,1,0,0,0,0-2ZM12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.26,6.33l-2,2a1,1,0,0,0-.21,1.09A1,1,0,0,0,3,22h9A10,10,0,0,0,12,2Zm0,18H5.41l.93-.93a1,1,0,0,0,0-1.41A8,8,0,1,1,12,20Z"/>
        </Svg>
      )
      break

    case 'notifications':
      data = (
        <Svg
          className={className + ' mr-0 ml-0 p-[1px]'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></Path>
          <Path d="M13.73 21a2 2 0 0 1-3.46 0"></Path>
        </Svg>
      )
      break

    case 'search':
      data = (
        <Svg
          className={className + ' mr-0 ml-0'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Circle cx="11" cy="11" r="8"></Circle>
          <Line x1="21" y1="21" x2="16.65" y2="16.65"></Line>
        </Svg>
      )
      break

    case 'account':
      data = (
        <Svg className={className + ' mr-0 ml-0'} viewBox="0 0 24 24"><path fill="currentColor" d="M15.71,12.71a6,6,0,1,0-7.42,0,10,10,0,0,0-6.22,8.18,1,1,0,0,0,2,.22,8,8,0,0,1,15.9,0,1,1,0,0,0,1,.89h.11a1,1,0,0,0,.88-1.1A10,10,0,0,0,15.71,12.71ZM12,12a4,4,0,1,1,4-4A4,4,0,0,1,12,12Z"/></Svg>
      )
      break

    case 'rocket':
      data = (
        <Svg
          className={className + ' mr-0 ml-0'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></Path>
          <Path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></Path>
          <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></Path>
          <Path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></Path>
        </Svg>
      )
      break

    case 'plus':
      data = (
        <Svg className={className + ' mr-0 ml-0 '}
        viewBox="0 0 24 24"
        fill="none"><Path fill="currentColor" d="M19,11H13V5a1,1,0,0,0-2,0v6H5a1,1,0,0,0,0,2h6v6a1,1,0,0,0,2,0V13h6a1,1,0,0,0,0-2Z"/></Svg>
      )
      break

    case 'menu':
      data = (
        <Svg
          className={className + ' mr-0 ml-0'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokelinecap="round"
          strokeLinejoin="round"
        >
          <Line x1="4" y1="12" x2="20" y2="12"></Line>
          <Line x1="4" y1="6" x2="20" y2="6"></Line>
          <Line x1="4" y1="18" x2="20" y2="18"></Line>
        </Svg>
      )
      break

    case 'hash':
      data = (
        <Svg
          className={className + ' mr-0 ml-0 p-[1px]'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Line x1="4" y1="9" x2="20" y2="9"></Line>
          <Line x1="4" y1="15" x2="20" y2="15"></Line>
          <Line x1="10" y1="3" x2="8" y2="21"></Line>
          <Line x1="16" y1="3" x2="14" y2="21"></Line>
        </Svg>
      )
      break

    case 'post':
      data = (
        <Svg className={className + ' mr-0 ml-0'} fill="currentColor" viewBox="0 0 24 24">
          <Path d="M13,11H7a1,1,0,0,0,0,2h6a1,1,0,0,0,0-2Zm4-4H7A1,1,0,0,0,7,9H17a1,1,0,0,0,0-2Zm2-5H5A3,3,0,0,0,2,5V15a3,3,0,0,0,3,3H16.59l3.7,3.71A1,1,0,0,0,21,22a.84.84,0,0,0,.38-.08A1,1,0,0,0,22,21V5A3,3,0,0,0,19,2Zm1,16.59-2.29-2.3A1,1,0,0,0,17,16H5a1,1,0,0,1-1-1V5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1Z" />
        </Svg>
      )
      break

    case 'group':
      data = (
        <Svg className={className + ' mr-0 ml-0'} viewBox="0 0 24 24"><path fill="currentColor" d="M19.68,6.88a4.4,4.4,0,0,0-3.31-.32,4.37,4.37,0,0,0-8.73,0,4.48,4.48,0,0,0-3.31.29,4.37,4.37,0,0,0,.61,8,4.4,4.4,0,0,0-.8,2.5,5,5,0,0,0,.07.75A4.34,4.34,0,0,0,8.5,21.73a4.68,4.68,0,0,0,.64,0A4.42,4.42,0,0,0,12,20a4.42,4.42,0,0,0,2.86,1.69,4.68,4.68,0,0,0,.64,0,4.36,4.36,0,0,0,3.56-6.87,4.36,4.36,0,0,0,.62-8ZM10.34,4.94a2.4,2.4,0,0,1,3.32,0,2.43,2.43,0,0,1,.52,2.66l-.26.59-.66.58A4.07,4.07,0,0,0,12,8.55a4,4,0,0,0-1.61.34L9.83,7.6A2.39,2.39,0,0,1,10.34,4.94Zm-6.1,6.84A2.37,2.37,0,0,1,7.94,9l.49.43.35.8A3.92,3.92,0,0,0,8,12.55,2.85,2.85,0,0,0,8,13l-.55,0h0l-.84.08A2.37,2.37,0,0,1,4.24,11.78Zm6.6,6.08a2.38,2.38,0,0,1-4.66-.08,3.07,3.07,0,0,1,0-.42,2.33,2.33,0,0,1,1.17-2L7.86,15l.91-.1a4,4,0,0,0,2.38,1.57ZM12,14.55a2,2,0,1,1,2-2A2,2,0,0,1,12,14.55Zm5.82,3.22a2.36,2.36,0,0,1-2.68,1.94,2.39,2.39,0,0,1-2-1.85l-.14-.6.21-.92a4,4,0,0,0,2.2-1.76l.5.3.09,0,.66.39A2.38,2.38,0,0,1,17.82,17.77Zm1.94-6a2.39,2.39,0,0,1-2.13,1.33h-.24L16.75,13,16,12.59v0a4,4,0,0,0-1-2.64l.43-.37,0,0L16.06,9a2.37,2.37,0,0,1,3.7,2.82Z"/></Svg>
      )
      break

    case 'people':
      data = (
        <Svg className={className + ' mr-0 ml-0'}
        viewBox="0 0 24 24"
        fill="currentColor"><Path d="M12.3,12.22A4.92,4.92,0,0,0,14,8.5a5,5,0,0,0-10,0,4.92,4.92,0,0,0,1.7,3.72A8,8,0,0,0,1,19.5a1,1,0,0,0,2,0,6,6,0,0,1,12,0,1,1,0,0,0,2,0A8,8,0,0,0,12.3,12.22ZM9,11.5a3,3,0,1,1,3-3A3,3,0,0,1,9,11.5Zm9.74.32A5,5,0,0,0,15,3.5a1,1,0,0,0,0,2,3,3,0,0,1,3,3,3,3,0,0,1-1.5,2.59,1,1,0,0,0-.5.84,1,1,0,0,0,.45.86l.39.26.13.07a7,7,0,0,1,4,6.38,1,1,0,0,0,2,0A9,9,0,0,0,18.74,11.82Z"/></Svg>
      )
      break
  }

  if (data)
    return (
      <View {...rest} className={className}>
        {data}
      </View>
    )
  else return <View></View>
}
