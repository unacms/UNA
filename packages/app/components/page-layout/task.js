import { View } from 'app/design/view';
import { cn } from 'app/lib/util';
import PostLayout from 'app/components/page-layout/post';

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
