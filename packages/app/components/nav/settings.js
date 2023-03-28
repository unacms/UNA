import { useCurrentUser } from 'app/context/user';

export function NavBottomTabsList(params) {

    let { currentUser, setCurrentUser } = useCurrentUser();

    const TabList = [
      {
        title: 'Home',
        url: '/home',
        icon: 'app-home'
      },
      {
        title: 'Explore',
        url: '/posts-home',
        icon: 'app-explore'
      },
      {
        title: 'Messages',
        url: '/persons-home',
        icon: 'app-messages'
      },
      {
        title: 'Notifications',
        url: '/notifications-view',
        icon: 'app-notifications'
      },
      {
        title: (currentUser ? 'Logout': 'Login'),
        url: (currentUser ? '/logout': '/login'),
        icon: 'app-usermenu'
      },
    ];

    return TabList;
}