export function appSetting(section, name) {
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
      },
      dark: {
        primary: '#3B82F6',
        background: '#000000',
        barsBackground: '#111827',
        barsColor: '#D1D5DB',
        selectBorder: 'rgba(55, 65, 81, 0.3)',
        selectBackground: 'rgba(17, 24, 39, 1)',
        selectBackgroundActive: 'rgba(55, 65, 81, 0.5)',
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
        'u-btn-link-text':
          ' group-active:text-brand-700 dark:group-active:text-brand-600 group-hover:text-brand-500  dark:group-hover:text-brand-400 font-semibold text-brand-600 dark:text-brand-500 ',
        'u-btn-link-trans': ' duration-200 ',
        'u-btn-outline-cnt':
        ' border active:shadow-none border-black/10  dark:border-white/10    hover:bg-neogray-100 active:bg-neogray-300  dark:hover:bg-neogray-700 dark:active:bg-neogray-900 ',
        'u-btn-outline-text':
        ' font-semibold text-neogray-700 group-hover:text-neogray-900 dark:text-neogray-300 dark:group-hover:text-neogray-50',
        'u-btn-outline-trans': ' duration-200 ',
      },
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
          url: '/view-persons-profile/dr-andrey-yasko-phd',
          icon: 'app-messages',
        },
        {
          title: 'Notifications',
          url: '/notifications-view',
          icon: 'app-notifications',
        },
        {
          title: 'Logout',
          url: '/logout',
          icon: 'app-usermenu',
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
          url: '/view-persons-profile/dr-andrey-yasko-phd',
          icon: 'app-messages',
        },
        {
          title: 'Notifications',
          url: '/notifications-view',
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
  return settings[section] ? settings[section][name] : ''
}
