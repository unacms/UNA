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

export function appSetting(section, name, path) {
  const settings = {
    feed: {
      show_selector_view: false,
      default_view: 'small',
    },


    theme: {
      light: {
        primary: '#2563EB',
        barsBackground: '#FFFFFF',
        barsColor: '#4B5563',
        selectBorder: 'rgba(156, 163, 175, 0.3)',
        selectBackground: 'rgba(255, 255, 255, 1)',
        selectBackgroundActive: 'rgba(209, 213, 219, 0.3)',
        blockBorder: '#E5E7EB',
      },
      dark: {
        primary: '#3B82F6',
        background: '#000000',
        barsBackground: '#111827',
        barsColor: '#D1D5DB',
        selectBorder: 'rgba(55, 65, 81, 0.3)',
        selectBackground: 'rgba(17, 24, 39, 1)',
        selectBackgroundActive: 'rgba(55, 65, 81, 0.5)',
        blockBorder: '#030712',
      },
      button_styles: {
        'u-btn-default-cnt':
          ' border active:shadow-none border-black/10  dark:border-white/10  shadow bg-neogray-200 hover:bg-neogray-100 active:bg-neogray-300 dark:bg-neogray-800 dark:hover:bg-neogray-700 dark:active:bg-neogray-900 ',
        'u-btn-default-text':
          ' font-semibold text-neogray-700 group-hover:text-neogray-900 dark:text-neogray-300 dark:group-hover:text-neogray-50',
        'u-btn-default-trans': '  duration-200 ',
        'u-btn-primary-cnt':
          ' border active:shadow-none border-black/10   dark:border-white/10 shadow bg-brand-600 hover:bg-brand-500 active:bg-brand-700 dark:bg-brand-800 dark:hover:bg-brand-700 dark:active:bg-brand-900  ',
        'u-btn-primary-text': ' font-semibold text-neogray-100 group-hover:text-white ',
        'u-btn-primary-trans': '  duration-200 ',
        'u-btn-danger-cnt':
        ' border active:shadow-none border-black/10   dark:border-white/10 shadow bg-red-600 hover:bg-red-500 active:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:active:bg-red-900  ',
        'u-btn-danger-text': '  font-semibold text-neogray-100 group-hover:text-white ',
        'u-btn-danger-trans': '  duration-200  ',
        'u-btn-text-cnt':
        ' border  border-transparent     hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/5 dark:active:bg-white/10 ',
        'u-btn-text-text':
        ' font-semibold text-neogray-700 group-hover:text-neogray-900 dark:text-neogray-300 dark:group-hover:text-neogray-50',
        'u-btn-text-trans': ' duration-200 ',
        'u-btn-link-cnt': ' border border-transparent   ',
        'u-btn-link-text': ' group-active:text-brand-700 dark:group-active:text-brand-600 group-hover:text-brand-500  dark:group-hover:text-brand-400 font-semibold text-brand-600 dark:text-brand-500 ',
        'u-btn-link-trans': ' duration-200 ',
        'u-btn-outline-cnt': ' border active:shadow-none border-black/10  dark:border-white/10    hover:bg-neogray-100 active:bg-neogray-300  dark:hover:bg-neogray-700 dark:active:bg-neogray-900 ',
        'u-btn-outline-text':
        ' font-semibold text-neogray-700 group-hover:text-neogray-900 dark:text-neogray-300 dark:group-hover:text-neogray-50',
        'u-btn-outline-trans': ' duration-200 ',
      },
      svg:{
        'logo-text':<Svg
          className='h-10 w-14 hidden sm:block text-brand dark:text-brand-dark mr-0 ml-0'
          viewBox="0 0 224 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Path
            d="M66.3277 80L14.4935 33.2075L14.7954 76.9811H0V0H0.603894L52.3375 47.4969L52.0356 2.91824H66.7303V80H66.3277Z"
            fill="currentColor"
          />
          <Path
            d="M85.8073 2.91824H136.333V17.0063H100.401V32.805H132.206V46.8931H100.401V62.8931H137.742V76.9811H85.8073V2.91824Z"
            fill="currentColor"
          />
          <Path
            d="M148.312 40.0503C148.312 34.9518 149.285 30.1216 151.231 25.5597C153.177 20.9979 155.861 16.9727 159.283 13.4843C162.772 9.92872 166.798 7.14466 171.361 5.13208C175.923 3.1195 180.822 2.11321 186.055 2.11321C191.222 2.11321 196.087 3.1195 200.649 5.13208C205.212 7.14466 209.238 9.92872 212.727 13.4843C216.284 16.9727 219.035 20.9979 220.981 25.5597C222.994 30.1216 224 34.9518 224 40.0503C224 45.283 222.994 50.1803 220.981 54.7421C219.035 59.304 216.284 63.3291 212.727 66.8176C209.238 70.239 205.212 72.9224 200.649 74.8679C196.087 76.8134 191.222 77.7862 186.055 77.7862C180.822 77.7862 175.923 76.8134 171.361 74.8679C166.798 72.9224 162.772 70.239 159.283 66.8176C155.861 63.3291 153.177 59.304 151.231 54.7421C149.285 50.1803 148.312 45.283 148.312 40.0503ZM163.409 40.0503C163.409 44.4109 164.416 48.4025 166.429 52.0252C168.509 55.5807 171.293 58.4319 174.783 60.5786C178.272 62.6583 182.197 63.6981 186.559 63.6981C190.786 63.6981 194.577 62.6583 197.932 60.5786C201.354 58.4319 204.038 55.5807 205.984 52.0252C207.93 48.4025 208.903 44.4109 208.903 40.0503C208.903 35.5556 207.896 31.5304 205.883 27.9748C203.87 24.3522 201.153 21.501 197.731 19.4214C194.309 17.2746 190.45 16.2013 186.156 16.2013C181.862 16.2013 178.003 17.2746 174.581 19.4214C171.159 21.501 168.442 24.3522 166.429 27.9748C164.416 31.5304 163.409 35.5556 163.409 40.0503Z"
            fill="currentColor"
          />
        </Svg>,
        'logo-mark': <Svg
          className='group-hover:-rotate-45 text-neogray-600 dark:text-neogray-200 group-hover:text-neogray-800 dark:group-hover:text-neogray-50   duration-300 h-10 w-10 mr-0 ml-0'
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Rect
            x="218.995"
            y="120"
            width="60"
            height="60"
            rx="4"
            transform="rotate(135 218.995 120)"
            fill="currentColor"
          />
          <Rect
            x="162.426"
            y="176.569"
            width="60"
            height="60"
            rx="4"
            transform="rotate(135 162.426 176.569)"
            fill="currentColor"
          />
          <Rect
            x="162.426"
            y="63.4314"
            width="60"
            height="60"
            rx="4"
            transform="rotate(135 162.426 63.4314)"
            fill="currentColor"
          />
          <Rect
            x="105.858"
            y="120"
            width="25.7143"
            height="25.7143"
            rx="4"
            transform="rotate(135 105.858 120)"
            // class="group-hover:animate-pulse "
            fill="#FF5511"
          />
          <Rect
            x="81.6143"
            y="144.244"
            width="25.7143"
            height="25.7143"
            rx="4"
            transform="rotate(135 81.6143 144.244)"
            // class="group-hover:animate-pulse "
            fill="#FF5511"
          />
          <Rect
            x="81.6143"
            y="95.7563"
            width="25.7143"
            height="25.7143"
            rx="4"
            transform="rotate(135 81.6143 95.7563)"
            // class="group-hover:animate-pulse "
            fill="#FF5511"
          />
          <Rect
            x="57.3707"
            y="120"
            width="25.7143"
            height="25.7143"
            rx="4"
            transform="rotate(135 57.3707 120)"
            // class="group-hover:animate-pulse "
            fill="#FF5511"
          />
        </Svg>
      },

      icons: {
        'info-circle': 'WarningCircle',
        'home': 'House',
        'app-menu': 'List',
        'app-home': 'House',
        'app-explore':'MagnifyingGlass',
        'app-messages':'ChatCircleText',
        'app-usermenu':'UserCircle',
        'app-notifications':'Bell',
        'left': 'ArrowLeft',
        'right': 'ArrowRight',
        'notifications': 'Bell',
        'messages': 'ChatCircleText',
        'search': 'MagnifyingGlass',
        'account': 'UserCircle',
        'comments': 'ChatsCircle',
        'file-alt': 'NoteBlank',
        'contact': 'PaperPlaneRight'
        
      }
    },

    menu: {
      bottom_tabs_logged: [
        {
          title: 'Home',
          url: '/home',
          icon: 'app-home',
        },
        {
          title: 'Explore',
          url: '/posts-home',
          icon: 'app-explore',
        },
        {
          title: 'Messages',
          url: '/persons-home',
          icon: 'app-messages',
        },
        {
          title: 'Notifications',
          url: '/view-persons-profile/dr-andrey-yasko-phd',
          icon: 'app-usermenu',
        },
        {
          title: 'Logout',
          url: '/logout',
          icon: 'app-notifications',
        },
      ],
      bottom_tabs_non_logged: [
        {
          title: 'Home',
          url: '/home',
          icon: 'app-home',
        },
        {
          title: 'Explore',
          url: '/posts-home',
          icon: 'app-explore',
        },
        {
          title: 'Messages',
          url: '/persons-home',
          icon: 'app-messages',
        },
        {
          title: 'Notifications',
          url: '/view-persons-profile/dr-andrey-yasko-phd',
          icon: 'app-notifications',
        },
        {
          title: 'Login',
          url: '/login',
          icon: 'app-usermenu',
        },
      ],
    },
  }
  if (path)
    return settings[section] ? settings[section][name][path] : ''

  return settings[section] ? settings[section][name] : ''
}
