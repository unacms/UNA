import type { Route } from '../lib/router';
import { Conversation, NewConversation } from '../screens/conversation';
import { GroupView } from '../features/groups/group-view';
import { EditProfile } from '../features/settings/edit-profile';
import { SettingsPanel } from '../features/settings/settings-panel';
import { ProfileView } from '../features/profile/profile-view';
import { ThreadPane } from '../features/thread/thread-pane';
import { DiscussionPane } from '../features/discussions/discussion-pane';
import { NewDiscussion } from '../features/discussions/new-discussion';
import { FilePane } from '../features/files/file-pane';
import { NewFiles } from '../features/files/new-files';
import { AlbumPane } from '../features/photos/album-pane';
import { NewAlbum, NewPhotos } from '../features/photos/new-media';
import { PhotoPane } from '../features/photos/photo-pane';
import { NewVideo } from '../features/videos/new-video';
import { VideoPane } from '../features/videos/video-pane';
import { TaskPane } from '../features/tasks/task-pane';
import { PollPane } from '../features/polls/poll-pane';
import { NewPost } from '../features/posts/new-post';
import { PostPane } from '../features/posts/post-pane';

/**
 * What the detail pane shows for a route: the open item. With nothing open there is no detail
 * pane (layout.tsx), so nothing is drawn. A profile or a group is a detail only in a window of
 * its own: the main window shows them as pages in the content pane (router.ts pageRoute).
 */
export function DetailPane({ route }: { route: Route }) {
    const d = route.detail;
    if (!d) return null;
    switch (d.kind) {
        case 'post':
            return <ThreadPane key={d.id} id={d.id} comment={d.comment ? { id: d.comment, thread: d.thread } : undefined} />;
        case 'conversation':
            return <Conversation key={d.id} id={d.id} />;
        case 'discussion':
            return <DiscussionPane key={d.id} id={d.id} comment={d.comment ? { id: d.comment, thread: d.thread } : undefined} />;
        case 'new-discussion':
            return <NewDiscussion key={d.groupId ?? 'new'} groupId={d.groupId} />;
        case 'video':
            return <VideoPane key={d.id} id={d.id} />;
        case 'new-video':
            return <NewVideo key={d.contextId ?? 'new'} contextId={d.contextId} />;
        case 'photo':
            return <PhotoPane key={d.id} id={d.id} />;
        case 'new-photos':
            return <NewPhotos key={d.contextId ?? 'new'} contextId={d.contextId} />;
        case 'album':
            return <AlbumPane key={d.id} id={d.id} />;
        case 'new-album':
            return <NewAlbum key={d.contextId ?? 'new'} contextId={d.contextId} />;
        case 'file':
            return <FilePane key={d.id} id={d.id} />;
        case 'new-files':
            return <NewFiles key={d.contextId ?? 'new'} contextId={d.contextId} />;
        case 'task':
            return <TaskPane key={d.id} id={d.id} />;
        case 'poll':
            return <PollPane key={d.id} id={d.id} />;
        case 'article':
            return <PostPane key={d.id} id={d.id} />;
        case 'new-article':
            return <NewPost key={d.contextId ?? 'new'} contextId={d.contextId} />;
        case 'new-message':
            return <NewConversation key={d.profileId ?? 'new'} profileId={d.profileId} />;
        case 'profile':
            return <ProfileView key={d.id} id={d.id} tab={d.tab ?? 'posts'} place="window" />;
        case 'group':
            return <GroupView key={d.id} id={d.id} tab={d.tab ?? 'posts'} place="window" />;
        case 'space':
            return <GroupView key={`space-${d.id}`} id={d.id} tab={d.tab ?? 'posts'} place="window" kind="space" />;
        case 'event':
            return <GroupView key={`event-${d.id}`} id={d.id} tab={d.tab ?? 'posts'} place="window" kind="event" />;
        case 'settings':
            return <SettingsPanel key={d.tab} tab={d.tab} />;
        case 'edit-profile':
            return <EditProfile key={d.id} id={d.id} />;
    }
}
