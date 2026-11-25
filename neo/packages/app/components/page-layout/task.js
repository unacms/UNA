import { View } from 'app/design/view';
import { cn } from 'app/lib/util';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import PostLayout from 'app/components/page-layout/post';
import { useRouter } from 'app/lib/hooks/router';
import { useCurrentUser } from 'app/context/user';
import {
    OPEN_TASK_STORAGE_KEY,
    TASKS_HOME_PATH,
    isTaskViewPath,
} from 'app/components/elements/tasks/helpers';

/**
 * A task opened by direct URL (refresh, shared link) lands in the same
 * `/tasks-home` shell as a task opened from the list: section nav, breadcrumb,
 * the task inside. The server still renders this page (SEO, no-JS, guests);
 * for a signed-in viewer on web we hand the task to tasks-home and replace
 * this history entry, so Back goes to the list like after a list-open.
 */
function useOpenInTasksHome(embedded, data) {
    const router = useRouter();
    const { currentUser } = useCurrentUser();
    useEffect(() => {
        if (embedded || Platform.OS !== 'web' || !currentUser) return;
        if (!isTaskViewPath(window.location.pathname)) return;
        // Already inside the shell (list-open): history state carries the task.
        if (window.history.state?.tasksListTask) return;
        try {
            window.sessionStorage.setItem(OPEN_TASK_STORAGE_KEY, JSON.stringify({
                url: window.location.pathname + window.location.search,
                title: data?.title || data?.page_title || '',
            }));
        } catch {
            return; // no storage: keep the standalone page
        }
        router.replace(TASKS_HOME_PATH);
    }, [embedded, currentUser, data, router]);
}

/**
 * Task item pages reuse the post composite (UNA cells → center + sidebars)
 * so `/view-task/...` and a task opened from My Tasks / a context list share
 * one layout. List-open sits in the browse card: breadcrumb stays put and
 * the post scrolls inside that card.
 */
export default function PageLayoutTask({
    breadcrumb,
    embedded = false,
    fill = false,
    layoutName = 'task',
    ...props
}) {
    useOpenInTasksHome(embedded, props.data);
    return (
        <View
            className={cn(
                'w-full',
                embedded && 'p-4',
                embedded && fill && 'flex h-full min-h-0 flex-1 flex-col',
            )}
        >
            {breadcrumb ? (
                <View className="shrink-0 pb-3 px-1">
                    {breadcrumb}
                </View>
            ) : null}
            <View className={cn(embedded && fill && 'min-h-0 flex-1 web:overflow-y-auto')}>
                <PostLayout
                    {...props}
                    layoutName={layoutName}
                    embedded={embedded}
                    headerTitle="Task"
                />
            </View>
        </View>
    );
}
