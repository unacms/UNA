/**
 * What each section's list pane draws, one entry per section (lib/sections.ts names them). The
 * shell draws `ListPane` and knows no section's screen itself.
 */
import type { ReactNode } from 'react';

import type { ListRoute, Section } from '../lib/router';
import { ConnectionsPage } from '../features/connections/connections-page';
import { Discussions } from '../features/discussions/discussion-list';
import { EventsBrowse } from '../features/events/event-list';
import { ContextsBrowse, GroupsBrowse } from '../features/groups/group-list';
import { GroupView } from '../features/groups/group-view';
import { MediaBrowse } from '../features/media/media-browse';
import { SitePage } from '../features/page-blocks/site-page';
import { PeoplePage } from '../features/people/people-page';
import { Posts } from '../features/posts/post-list';
import { SearchView } from '../features/search/search-view';
import { SettingsList } from '../features/settings/settings-list';
import { TaskBoard } from '../features/tasks/task-board';
import { TaskBudgetView } from '../features/tasks/task-budget';
import { MyTimers } from '../features/tasks/task-timers';
import { Feed } from '../screens/feed';
import { Messages } from '../screens/messages';
import { Notifications } from '../screens/notifications';
import { Profile } from '../screens/profile';

const SECTION_PANES: Readonly<Record<Section, (list: ListRoute) => ReactNode>> = {
    home: () => <Feed key="home" section="home" />,
    explore: () => <Feed key="explore" section="explore" />,
    notifications: () => <Notifications />,
    messages: () => <Messages />,
    // one's friends, requests received and sent, following and followers, a tab each
    connections: () => <ConnectionsPage />,
    // the network's people: Recent, Active, Online (Persons' pages), and one's friends
    people: () => <PeoplePage />,
    // the Posts module's posts: the newest, the most viewed, or one's own
    posts: () => <Posts />,
    discussions: () => <Discussions />,
    search: () => <SearchView />,
    // a page: someone's profile, or one's own
    profile: (list) => <Profile list={list} />,
    // a group's page, or the groups to browse
    groups: (list) => (list.group ? <GroupView key={list.group} id={list.group} tab={list.groupTab ?? 'posts'} /> : <GroupsBrowse joined={list.feed === 'joined'} />),
    // a space's page, or the top level spaces to browse
    spaces: (list) => (list.group ? <GroupView key={`space-${list.group}`} id={list.group} tab={list.groupTab ?? 'posts'} kind="space" /> : <ContextsBrowse kind="space" joined={list.feed === 'joined'} />),
    // an event's page, or the events: upcoming, one's own, past
    events: (list) => (list.group ? <GroupView key={`event-${list.group}`} id={list.group} tab={list.groupTab ?? 'posts'} kind="event" /> : <EventsBrowse />),
    // the media modules' lists: Videos, Photos, Albums
    media: () => <MediaBrowse />,
    // My timers, a context's budget, or a board: My tasks (assigned or created), a context's tasks or one of its lists
    tasks: (list) => {
        if (list.taskView === 'budget' && list.taskContext) return <TaskBudgetView key={`budget-${list.taskContext}`} contextId={list.taskContext} />;
        return list.taskView === 'timers' ? <MyTimers /> : <TaskBoard key={list.taskContext ? `context-${list.taskContext}` : `mine-${list.taskRole ?? 'assigned'}`} list={list} />;
    },
    settings: () => <SettingsList />,
    // a page of the site's that the app has no screen for: its blocks (a sidebar item opens one)
    page: (list) => <SitePage key={list.page ?? ''} path={list.page ?? null} />,
};

/** The list pane of the section a route is in. */
export function ListPane({ list }: { list: ListRoute }) {
    return SECTION_PANES[list.section](list);
}
