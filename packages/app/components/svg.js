import { View } from 'app/design/view'
import Svg, {
  Circle,
  Path,
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
        <Svg className={className} viewBox="0 0 326 118" fill="none">
          <Path
            d="M0.63664 116V2.38114H15.9905L22.617 24.3615V116H0.63664ZM79.184 116L11.7884 28.7252L15.9905 2.38114L83.3861 89.6559L79.184 116ZM79.184 116L72.8808 94.6662V2.38114H95.0227V116H79.184ZM118.064 116V2.38114H140.044V116H118.064ZM134.226 116V96.6056H197.096V116H134.226ZM134.226 67.3524V48.6045H191.439V67.3524H134.226ZM134.226 21.7755V2.38114H196.288V21.7755H134.226ZM266.409 117.778C258.113 117.778 250.355 116.269 243.136 113.252C236.025 110.236 229.775 106.087 224.388 100.808C219.109 95.4204 214.96 89.1711 211.943 82.0598C208.927 74.8408 207.418 67.1369 207.418 58.9481C207.418 50.7594 208.873 43.1633 211.782 36.1597C214.799 29.0484 218.947 22.853 224.227 17.5734C229.614 12.1861 235.863 8.03784 242.974 5.12868C250.086 2.11177 257.79 0.603316 266.086 0.603316C274.49 0.603316 282.248 2.11177 289.359 5.12868C296.471 8.03784 302.666 12.1861 307.946 17.5734C313.333 22.853 317.535 29.0484 320.552 36.1597C323.569 43.271 325.077 50.921 325.077 59.1098C325.077 67.2985 323.569 74.9485 320.552 82.0598C317.535 89.1711 313.333 95.4204 307.946 100.808C302.666 106.087 296.471 110.236 289.359 113.252C282.356 116.269 274.706 117.778 266.409 117.778ZM266.086 97.2521C273.413 97.2521 279.77 95.6359 285.157 92.4035C290.545 89.1711 294.747 84.6996 297.764 78.989C300.888 73.2784 302.451 66.5982 302.451 58.9481C302.451 53.3453 301.589 48.2273 299.865 43.5942C298.141 38.9611 295.663 34.9745 292.43 31.6344C289.198 28.1865 285.373 25.5467 280.955 23.715C276.538 21.8833 271.581 20.9674 266.086 20.9674C258.975 20.9674 252.672 22.5836 247.177 25.816C241.789 28.9407 237.533 33.3583 234.409 39.0689C231.392 44.7795 229.883 51.4059 229.883 58.9481C229.883 64.6587 230.745 69.8844 232.469 74.6253C234.301 79.3661 236.779 83.4066 239.904 86.7468C243.136 90.0869 246.961 92.6728 251.379 94.5045C255.904 96.3362 260.807 97.2521 266.086 97.2521Z"
            fill="currentColor"
          />
        </Svg>
      )
      break

    case 'discover':
      data = (
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Circle cx="12" cy="12" r="10"></Circle>
          <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></Polygon>
        </Svg>
      )
      break

    case 'about':
      data = (
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Circle cx="12" cy="12" r="10"></Circle>
          <Line x1="12" y1="16" x2="12" y2="12"></Line>
          <Line x1="12" y1="8" x2="12.01" y2="8"></Line>
        </Svg>
      )
      break

    case 'home':
      data = (
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></Path>
          <Polyline points="9 22 9 12 15 12 15 22"></Polyline>
        </Svg>
      )
      break

    case 'contact':
      data = (
        <Svg
          className={className}
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

    case 'contact':
      data = (
        <Svg
          className={className}
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
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Polyline points="9 14 4 9 9 4"></Polyline>
          <Path d="M20 20v-7a4 4 0 0 0-4-4H4"></Path>
        </Svg>
      )
      break

    case 'messages':
      data = (
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></Path>
        </Svg>
      )
      break

    case 'notifications':
      data = (
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
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
          className={className}
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
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></Path>
          <Circle cx="12" cy="7" r="4"></Circle>
        </Svg>
      )
      break

    case 'rocket':
      data = (
        <Svg
          className={className}
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
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Line x1="12" y1="5" x2="12" y2="19"></Line>
          <Line x1="5" y1="12" x2="19" y2="12"></Line>
        </Svg>
      )
      break

    case 'menu':
      data = (
        <Svg
          className={className}
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
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
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
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></Path>
          <Polyline points="14 2 14 8 20 8"></Polyline>
          <Line x1="16" y1="13" x2="8" y2="13"></Line>
          <Line x1="16" y1="17" x2="8" y2="17"></Line>
          <Line x1="10" y1="9" x2="8" y2="9"></Line>
        </Svg>
      )
      break

    case 'group':
      data = (
        <Svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M22 5V2l-5.89 5.89"></Path>
          <Circle cx="16.6" cy="15.89" r="3"></Circle>
          <Circle cx="8.11" cy="7.4" r="3"></Circle>
          <Circle cx="12.35" cy="11.65" r="3"></Circle>
          <Circle cx="13.91" cy="5.85" r="3"></Circle>
          <Circle cx="18.15" cy="10.09" r="3"></Circle>
          <Circle cx="6.56" cy="13.2" r="3"></Circle>
          <Circle cx="10.8" cy="17.44" r="3"></Circle>
          <Circle cx="5" cy="19" r="3"></Circle>
        </Svg>
      )
      break

    case 'people':
      data = (
        <Svg
          className={className}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></Path>
          <Circle cx="9" cy="7" r="4"></Circle>
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87"></Path>
          <Path d="M16 3.13a4 4 0 0 1 0 7.75"></Path>
        </Svg>
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
