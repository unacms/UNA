import { useQuery } from '@tanstack/react-query';

import { useApp } from '../../lib/context';
import { type TaskContext, TASK_CONTEXTS_KEY } from './board';

/** The contexts one has tasks in, with their lists and counts (the sidebar's Tasks, a board's title). */
export function useTaskContexts() {
    const { api } = useApp();
    return useQuery({ queryKey: TASK_CONTEXTS_KEY, queryFn: async (): Promise<TaskContext[]> => (await api.GET('/me/task-contexts')).data?.items ?? [] });
}
