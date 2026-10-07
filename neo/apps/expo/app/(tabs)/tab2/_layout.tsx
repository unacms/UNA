import { TabStackLayout } from 'app/components/nav/tab-stack';

// Deep links and cross-tab pushes land on `page` with the tab root below it.
export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  return <TabStackLayout tabKey='/tab2' />;
}
