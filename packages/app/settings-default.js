import Svg, {Path} from 'react-native-svg'
    
    const svgLogoText = (
        <Svg
            className='h-10 w-14 hidden sm:block text-gray-800dark:text-gray-200 mr-0 ml-0'
            viewBox="0 0 224 80"
            fill="none"
            aria-label="Logo"
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
        </Svg>
    );
    
    const svgLogoMark = (
        <Svg className='group-hover:rotate-45 text-neutral-600 dark:text-neutral-200 group-hover:text-neutral-800 dark:group-hover:text-neutral-50 duration-200 h-10 w-10 mr-0 ml-0'
            viewBox="0 0 240 240"
            fill="none"
            aria-label="Logo"
            xmlns="http://www.w3.org/2000/svg">
            <Path d="M117.672 24.3335C119.234 22.7714 121.766 22.7714 123.329 24.3335L160.098 61.103C161.66 62.6651 161.66 65.1978 160.098 66.7599L123.329 103.529C121.766 105.092 119.234 105.092 117.672 103.529L80.9021 66.7599C79.34 65.1978 79.34 62.6651 80.9021 61.1031L117.672 24.3335Z" className=' text-primary dark:text-primary-dark' fill="currentColor"/>
            <Path d="M174.24 80.902C175.802 79.3399 178.335 79.3399 179.897 80.902L216.667 117.672C218.229 119.234 218.229 121.766 216.667 123.328L179.897 160.098C178.335 161.66 175.802 161.66 174.24 160.098L137.471 123.328C135.909 121.766 135.909 119.234 137.471 117.672L174.24 80.902Z"className=' text-primary dark:text-primary-dark' fill="currentColor"/>
            <Path d="M61.103 80.902C62.6651 79.3399 65.1978 79.3399 66.7599 80.902L103.529 117.672C105.092 119.234 105.092 121.766 103.529 123.328L66.7599 160.098C65.1978 161.66 62.6651 161.66 61.1031 160.098L24.3335 123.328C22.7714 121.766 22.7714 119.234 24.3335 117.672L61.103 80.902Z"className=' text-primary dark:text-primary-dark' fill="currentColor"/>
            <Path d="M117.672 137.471C119.234 135.908 121.766 135.908 123.328 137.471L135.854 149.996C137.416 151.559 137.416 154.091 135.854 155.653L123.328 168.179C121.766 169.741 119.234 169.741 117.672 168.179L105.146 155.653C103.584 154.091 103.584 151.559 105.146 149.996L117.672 137.471Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="currentColor"/>
            <Path d="M141.915 161.714C143.477 160.152 146.01 160.152 147.572 161.714L160.098 174.24C161.66 175.802 161.66 178.335 160.098 179.897L147.572 192.423C146.01 193.985 143.477 193.985 141.915 192.423L129.389 179.897C127.827 178.335 127.827 175.802 129.389 174.24L141.915 161.714Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="currentColor"/>
            <Path d="M93.428 161.714C94.9901 160.152 97.5227 160.152 99.0848 161.714L111.611 174.24C113.173 175.802 113.173 178.335 111.611 179.897L99.0848 192.423C97.5227 193.985 94.9901 193.985 93.428 192.423L80.9021 179.897C79.34 178.335 79.34 175.802 80.9021 174.24L93.428 161.714Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="currentColor"/>
            <Path d="M117.672 185.958C119.234 184.396 121.766 184.396 123.328 185.958L135.854 198.484C137.416 200.046 137.416 202.578 135.854 204.141L123.328 216.666C121.766 218.229 119.234 218.229 117.672 216.666L105.146 204.141C103.584 202.578 103.584 200.046 105.146 198.484L117.672 185.958Z" className='group-hover:animate-pulse text-accent dark:text-accent-dark' fill="currentColor"/>
        </Svg>
    );
    
    export const settingsDefault = {
        lang_keys: {
            vote_performed_by_popup_title: 'Likes',
            rvote_performed_by_popup_title: 'Reactions',
            score_performed_by_popup_title: 'Upvotes',
            ntfs_popup_title: 'Notifications',
            ntfs_popup_view_all: 'View all',
        },
        feed: {
            show_selector_view: false,
            default_view: '',
        },
        entry: {
            default_view: '',
        },
        layout: {
            max_width: 'max-w-7xl',
            cell_gap: 4,
            cell_style: '',
        },
        comments:{
            show_header: false
        },
    
        menu_items: {
            'main_menu': ['home', 'about', 'posts-home', 'persons-home', 'groups-home', 'channels-home'],
            'profile_menu': ['view-persons-profile', 'persons-profile-friends', 'posts-author'],
            'bx_posts_submenu': {
                name:'Posts',
                icon:'File',
                items: ['posts-home', 'posts-popular'],
                add:[
                    {icon: 'search', name:"Search"},
                    {icon: 'plus', name: "Add", link: '/create-post'},
                    {icon: 'DotsThreeOutlineVertical', name:"More"}
                ]
            },
            'bx_persons_submenu': {
                name:'People',
                icon:'Users',
                items: ['persons-home', 'persons-active'],
                add:[
                    {icon: 'search', name:"Search"},
                    {icon: 'DotsThreeOutlineVertical', name:"More"}
                ]
            },
            'bx_persons_view_submenu': ['view-persons-profile', 'persons-profile-info', 'persons-profile-friends'],
            'bx_groups_submenu': {
                name:'Groups',
                icon:'UsersThree',
                items: ['groups-home', 'groups-joined'],
                add:[
                    {icon: 'search', name: "Search"},
                    {icon: 'plus', name: "Add", link: '/create-group-profile'},
                    {icon: 'DotsThreeOutlineVertical', name: "More"}
                ]
            },
            'bx_groups_view_submenu': ['view-group-profile', 'group-fans'],
            'bx_channels_submenu': {
                name:'Channels',
                icon:'Hash',
                items: ['channels-home', 'channels-top'],
                add:[
                    {icon: 'search', name:"Search"},
                    {icon: 'DotsThreeOutlineVertical', name:"More"}
                ]
            },
            'bx_channels_view_submenu': ['view-channel-profile'],
        },

        layouts: {
            'messenger':{
                layout: 'custom_messenger',
                blocks: {
                    inbox: {name: 'bx_messenger:get_block_inbox'},
                    lot: {name: 'bx_messenger:get_block_lot'},
                },
            },
            'home':{
                layout: 'custom_home',
                blocks: {
                    menu: {name: 'system:profile_menu', showTitle: false, showBg: false},
                    feed: {name: 'bx_timeline:get_block_view_home', showTitle: false, showBg: false},
                    posts: {name: 'bx_posts:browse_public', showTitle: false, showBg: false},
                },
            },
            //############ POSTS PAGES ############
            'posts-home':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_posts:browse_public', showTitle: false, showBg: false},
                },
            },
            'posts-popular':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_posts:browse_popular', showTitle: false, showBg: false},
                },
            },
            'view-post': {
                layout: 'custom_post',
                blocks: {
                    author: {name: 'bx_posts:entity_author', showTitle: false, showBg: false},
                    text: {name: 'bx_posts:entity_text_block', showTitle: false, showBg: false},
                    actions: {name: 'bx_posts:entity_all_actions', showTitle: false, showBg: false},
                    comments: {name: 'bx_posts:entity_comments', showTitle: false, showBg: false},
                },
            },
            //############ GROUPS PAGES ############
            'groups-home':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_groups:browse_recent_profiles', showTitle: false, showBg: false},
                }
            },
            'groups-joined':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_groups:browse_joined_entries', showTitle: false, showBg: false},
                }
            },
            'view-group-profile':{
                layout: 'custom_profile',
                blocks: {
                    col1:{name: 'bx_groups:entity_info', showTitle: false, showBg: false, perLine:1},
                    col2:{name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine:1}
                }
            },
            'group-fans':{
                layout: 'custom_profile',
                blocks: {
                    col1:{name: 'bx_groups:fans_table', showTitle: false, showBg: false, perLine:1}
                }
            },
            //############ CHANNELS PAGES ############
            'channels-home':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_channels:browse_recent_profiles', showTitle: false, showBg: false},
                }
            },
            'channels-top':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_channels:browse_top_profiles', showTitle: false, showBg: false},
                }
            },
            'view-channel-profile':{
                layout: 'custom_profile',
                blocks: {
                    col2:{name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine: 1}
                }
            },
            //############ PERSONS PAGES ############
            'persons-home':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_persons:browse_recent_profiles', showTitle: false, showBg: false},
                }
            },
            'persons-active':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_persons:browse_active_profiles', showTitle: false, showBg: false},
                }
            },
            'view-persons-profile':{
                layout: 'custom_profile',
                blocks: {
                    col1:{name: 'bx_timeline:get_block_view_profile', showTitle: false, showBg: false, perLine:1}
                }
            },
            'persons-profile-friends':{
                layout: 'custom_profile',
                blocks: {
                    col1:{name: 'system:connections_table', showTitle: false, showBg: false, perLine:1}
                }
            },
            'persons-profile-info':{
                layout: 'custom_profile',
                blocks: {
                    col0:{name: 'bx_persons:entity_text_block', showTitle: false, showBg: false},
                    col1:{name: 'bx_persons:entity_info_full', showTitle: false, showBg: false},
                }
            },
            'notifications-view':{
                layout: 'custom_blackbox',
                blocks: {
                    browse:{name: 'bx_notifications:get_block_view', showTitle: false, showBg: false, perLine:1},
                }
            },
        },
        theme: {
            light: {
                primary: '#0284c7',
                barsBackground: 'rgba(255,255,255,0.9)',
                barsColor: '#4B5563',
                selectBorder: 'rgba(156, 163, 175, 0.3)',
                fieldBackground: 'rgba(249, 240, 251, 1)',
                blockBorder: '#E5E7EB',
                tabsBackground: '#F3F4F6',
                activeTabBackground: '#DBEAFE',
                screenBackground: '#E5E7EB',
            },
            dark: {
                default: '#D1D5DB', //fix for icons color in iOS
                primary: '#0ea5e9',
                background: '#000000',
                barsBackground: 'rgba(31,41,55,0.9)',
                barsColor: '#D1D5DB',
                selectBorder: 'rgba(55, 65, 81, 0.3)',
                fieldBackground: '#030712',
                blockBorder: '#030712',
                screenBackground: '#030407',
            },
            button_styles: {
                'u-btn-default-cnt':
                ' border border-bordercolorbutton dark:border-bordercolorbutton-dark hover:bg-backgroundbutton-hover dark:hover:bg-backgroundbutton-darkhover active:shadow-none bg-backgroundbutton dark:bg-backgroundbutton-dark hover:bg-backgroundbutton active:opacity-50 dark:hover:bg-backgroundbutton-dark shadow-sm hover:shadow  ',
                'u-btn-default-text':
                ' font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-50',
                'u-btn-default-trans': 'duration-200 ',
                'u-btn-primary-cnt':
                ' border active:shadow-none border-bordercolorbutton  dark:border-bordercolorbutton-dark shadow-sm hover:shadow bg-primary-600 hover:bg-primary-500 active:bg-primary-700 dark:bg-primary-800 dark:hover:bg-primary-700 dark:active:bg-primary-900',
                'u-btn-primary-text': ' font-semibold text-gray-100 group-hover:text-white ',
                'u-btn-primary-trans': 'duration-200 ',
                'u-btn-danger-cnt':
                ' border active:shadow-none border-black/10 dark:border-white/10 shadow bg-red-600 hover:bg-red-500 active:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:active:bg-red-900',
                'u-btn-danger-text': 'font-semibold text-gray-100 group-hover:text-white ',
                'u-btn-danger-trans': 'duration-200',
                'u-btn-text-cnt':
                ' border border-transparent hover:bg-backgroundbutton-hover active:opacity-50 dark:hover:bg-backgroundbutton-darkhover  ',
                'u-btn-text-text':
                ' font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-50',
                'u-btn-text-trans': ' duration-200 ',
                'u-btn-link-cnt': ' border border-transparent ',
                'u-btn-link-text': ' group-active:text-primary-700 dark:group-active:text-primary-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 font-semibold text-primary dark:text-primary-dark ',
                'u-btn-link-trans': ' duration-200 ',
                'u-btn-outline-cnt': ' border active:shadow-none border-bordercolorbutton dark:border-bordercolorbutton-dark hover:bg-backgroundbutton active:opacity-50 dark:hover:bg-backgroundbutton-dark',
                'u-btn-outline-text':
                ' font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-50',
                'u-btn-outline-trans': ' duration-200 ',
            },
            svg:{
                'logo-text': svgLogoText,
                'logo-mark': svgLogoMark,
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
                'app-plus':'Plus',
                'left': 'ArrowLeft',
                'right': 'ArrowRight',
                'notifications': 'Bell',
                'messages': 'ChatCircleText',
                'search': 'MagnifyingGlass',
                'account': 'UserCircle',
                'comments': 'ChatsCircle',
                'file-alt': 'NoteBlank',
                'contact': 'PaperPlaneRight',
                'reply': 'ArrowBenDownRight',
                'hashtag': 'Hash'
            },
        },
        menu: {
            bottom_tabs_logged: [
                {
                    key:'/tab0',
                    title: 'Home',
                    url: '/home',
                    icon: 'app-home',
                },
                {
                    key:'/tab1',
                    title: 'Explore',
                    url: '/posts-home',
                    icon: 'app-explore',
                },
                {
                    key:'/tab2',
                    title: 'People',
                    url: '/persons-home',
                    icon: 'users',
                },
                {
                    key:'/tab3',
                    title: 'Add',
                    url: '/create-post', //'/view-persons-profile/dr-andrey-yasko-phd',
                    icon: 'app-plus',
                },
                {
                    key:'/tab4',
                    title: 'Notifications',
                    url: '/notifications-view', //'/view-persons-profile/dr-andrey-yasko-phd',
                    icon: 'app-notifications',
                },
                {
                    key:'/tab5',
                    title: 'Logout',
                    url: '/logout',
                    icon: 'app-usermenu',
                },
            ],
            bottom_tabs_non_logged: [
                {
                    key:'/tab0',
                    title: 'Home',
                    url: '/home',
                    icon: 'app-home',
                },
                {
                    key:'/tab1',
                    title: 'Explore',
                    url: '/posts-home',
                    icon: 'app-explore',
                },
                {
                    key:'/tab2',
                    title: 'People',
                    url: '/persons-home',
                    icon: 'users',
                },
                {
                    key:'/tab3',
                    title: 'Add',
                    url: '/create-post', //'/view-persons-profile/dr-andrey-yasko-phd',
                    icon: 'app-plus',
                },
                {
                    key:'/tab4',
                    title: 'Notifications',
                    url: '/notifications-view',
                    icon: 'app-notifications',
                },
                {
                    key:'/tab5',
                    title: 'Login',
                    url: '/login',
                    icon: 'app-usermenu',
                },
            ],
        },
    };