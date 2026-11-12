/**
 * Which modules the open network's API has (`GET /api/v2` `modules`), and where a context
 * profile opens. A group and a space are both profiles of kind `group`; the module they belong
 * to says which paths show them (`/groups/{id}`, `/spaces/{id}`), so a profile of kind `group`
 * routes by its `module` through the modules the site lists. Until the site has answered (and on
 * an older site that sends no list) every context opens as a group, as before.
 */
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { Schema } from 'una-api';

import { unwrap } from './api';
import { useApp } from './context';
import { type DetailRoute, profileRoute, type ProfileTab } from './router';

export type ModuleInfo = Schema<'ModuleInfo'>;

/** The kinds of context the app has pages for; the detail route of each is its kind. */
export type ContextKind = 'group' | 'space' | 'event';

/** The tag of a context module's paths, and the kind of page its contexts open in. */
const TAG_KINDS: Record<string, ContextKind> = { groups: 'group', spaces: 'space', events: 'event' };

export const SITE_MODULES_KEY = ['site-modules'] as const;

/** The modules of the site the app shows now, by module name; null until it answered. */
let known: ReadonlyMap<string, ModuleInfo> | null = null;

/** What the site listed (null: not known). The hook keeps it; tests set it. */
export function setSiteModules(modules: readonly ModuleInfo[] | null | undefined): void {
    known = modules ? new Map(modules.map((m) => [m.module, m])) : null;
}

/** Whether the site's API has a module with this tag; null while that is not known. */
export function siteHasTag(tag: string): boolean | null {
    if (!known) return null;
    for (const m of known.values()) if (m.tag === tag) return true;
    return false;
}

/**
 * The kind of page a context of this module opens in: `group` for one of Groups, `space` for
 * one of Spaces, `event` for one of Events. Null for a module the site lists with no page here
 * (courses, until the app has them) and for one it does not list: such a context opens as a
 * profile. While the list is not known, `group`.
 */
export function contextKindOf(module: string | null | undefined): ContextKind | null {
    if (!known || !module) return 'group';
    const info = known.get(module);
    return info ? (TAG_KINDS[info.tag] ?? null) : null;
}

/**
 * Where a profile opens: a context as its own kind of page (a group, a space), anything else,
 * a context of a module without a page here among them, as a profile.
 */
export function profileDetail(profile: { id: string; kind?: string | null; module?: string | null }, tab: ProfileTab = 'posts'): DetailRoute {
    if (profile.kind !== 'group') return profileRoute(profile.id, tab);
    const kind = contextKindOf(profile.module);
    return kind ? { kind, id: profile.id } : profileRoute(profile.id, tab);
}

/**
 * GET /api/v2's `modules`, kept for contextKindOf while this window shows the site. Null for a
 * site that sends no list.
 */
export function useSiteModules() {
    const { api } = useApp();
    const query = useQuery({
        queryKey: SITE_MODULES_KEY,
        queryFn: async (): Promise<ModuleInfo[] | null> => {
            const info = unwrap(await api.GET('/'));
            const modules = Array.isArray(info.modules) ? info.modules : null;
            setSiteModules(modules);
            return modules;
        },
        staleTime: 10 * 60_000,
    });
    const data = query.data;
    useEffect(() => {
        // also what the offline cache brought back, which no queryFn has seen
        if (data !== undefined) setSiteModules(data);
    }, [data]);
    return query;
}

export type Audience = NonNullable<ModuleInfo['audiences']>[number];

/**
 * The audiences a new entry of the module of this tag may have, as the site lists them (the
 * privacy groups it has turned on); every one until it said, or from a site that sends none.
 */
export function useAudiences(tag: string): readonly Audience[] {
    const modules = useSiteModules().data;
    const audiences = modules?.find((m) => m.tag === tag)?.audiences;
    return audiences?.length ? audiences : ALL_AUDIENCES;
}

const ALL_AUDIENCES: readonly Audience[] = ['public', 'members', 'friends', 'private'];

/** Whether the site has the module of this tag: true or false once it said, null until then. */
export function useSiteHasTag(tag: string): boolean | null {
    const modules = useSiteModules().data;
    if (modules === undefined) return null;
    return !!modules?.some((m) => m.tag === tag);
}
