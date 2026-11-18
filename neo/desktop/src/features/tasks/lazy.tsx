/**
 * The task views as the rest of the app takes them: loaded after the app starts (task-views.ts),
 * so the startup script holds none of them. Each draws nothing until they are there, which is
 * at once after the first time.
 */
import { type ComponentType, Suspense } from 'react';

import { lazyModule } from '../../lib/lazy-module';

export const taskViewsChunk = lazyModule(() => import('./task-views'));

type Views = Awaited<ReturnType<typeof taskViewsChunk.load>>;

/** One of the views, drawn once they have loaded. */
function lazyView<P extends object>(name: string, pick: (views: Views) => ComponentType<P>): ComponentType<P> {
    function Loaded(props: P) {
        const View = pick(taskViewsChunk.use());
        return <View {...props} />;
    }
    function LazyView(props: P) {
        return (
            <Suspense fallback={null}>
                <Loaded {...props} />
            </Suspense>
        );
    }
    LazyView.displayName = `Lazy(${name})`;
    return LazyView;
}

export const TaskBoard = lazyView('TaskBoard', (v) => v.TaskBoard);
export const TaskBudgetView = lazyView('TaskBudgetView', (v) => v.TaskBudgetView);
export const MyTimers = lazyView('MyTimers', (v) => v.MyTimers);
export const TaskPane = lazyView('TaskPane', (v) => v.TaskPane);
export const ContextTasks = lazyView('ContextTasks', (v) => v.ContextTasks);
export const TaskRow = lazyView('TaskRow', (v) => v.TaskRow);
