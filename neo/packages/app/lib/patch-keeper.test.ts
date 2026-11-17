import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient } from '@tanstack/react-query';
import { createPatchKeeper } from './patch-keeper.ts';
import { patchListPages, type ConnectionPatch } from './connection-patch.ts';

const KEY = ['list', 'people'];
const card = (followers: number): any => ({ id: 107, author_data: { id: 7 }, friends_count: 2, followers_count: followers });
const pages = (followers: number) => ({ pages: [{ data: [card(followers)] }], pageParams: [undefined] });
const followers = (client: QueryClient) => (client.getQueryData(KEY) as any).pages[0].data[0].followers_count;

/** A list request whose answer the test sends when it chooses. */
function request(client: QueryClient) {
    let answer: (value: unknown) => void = () => {};
    const done = client.fetchInfiniteQuery({
        queryKey: KEY,
        queryFn: () => new Promise((resolve) => { answer = resolve; }),
        staleTime: 0,
    });
    return { answer: async (followersCount: number) => { answer({ data: [card(followersCount)] }); await done; } };
}

function setup() {
    let time = 1000;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: Infinity } } });
    client.setQueryData(KEY, pages(2));
    const keeper = createPatchKeeper<ConnectionPatch>(client, patchListPages, { now: () => time });
    return { client, keeper, tick: (ms: number) => { time += ms; } };
}

test('a change is written into the cached list', () => {
    const { client, keeper } = setup();
    keeper.apply({ profileId: 7, counts: { followers_count: 3 } });
    assert.equal(followers(client), 3);
});

test('an answer asked for before the change does not put the old count back', async () => {
    const { client, keeper, tick } = setup();
    // seen starting once the keeper watches: make it watch first with a change for someone else
    keeper.apply({ profileId: 99, counts: { followers_count: 1 } });

    const revalidation = request(client);
    tick(200);
    keeper.apply({ profileId: 7, counts: { followers_count: 3 } });
    tick(300);
    await revalidation.answer(2);

    assert.equal(followers(client), 3);
});

test('a request that was on its way before the first change counts as older', async () => {
    const { client, keeper, tick } = setup();
    const revalidation = request(client);
    tick(200);
    keeper.apply({ profileId: 7, counts: { followers_count: 3 } });
    await revalidation.answer(2);

    assert.equal(followers(client), 3);
});

test('an answer asked for after the change is left alone', async () => {
    const { client, keeper, tick } = setup();
    keeper.apply({ profileId: 7, counts: { followers_count: 3 } });
    tick(500);
    const refresh = request(client);
    await refresh.answer(4);

    assert.equal(followers(client), 4, 'someone else followed too: the newer count stays');
});

test('a change is kept only for a short while', async () => {
    const { client, keeper, tick } = setup();
    const slow = request(client);
    keeper.apply({ profileId: 7, counts: { followers_count: 3 } });
    tick(11000);
    await slow.answer(2);

    assert.equal(followers(client), 2);
});

test("a second action on the profile keeps the first one's button", async () => {
    const { client, keeper } = setup();
    const button = (o: string, title: string) => ({ name: o, data: { type: 'connections_ext', o, cid: 7, name: 'add', title, actions: [] } });
    const item = { ...card(2), meta: { items: [button('sys_profiles_friends', 'Add friend'), button('sys_profiles_subscriptions', 'Follow')] } };
    client.setQueryData(KEY, { pages: [{ data: [item] }], pageParams: [undefined] });

    keeper.apply({ profileId: 7, elements: { sys_profiles_friends: { type: 'connections_ext', name: 'remove', title: 'Request sent', actions: [] } } });
    keeper.apply({ profileId: 7, counts: { followers_count: 3 }, elements: { sys_profiles_subscriptions: { type: 'connections_ext', name: 'remove', title: 'Following', actions: [] } } });
    // the list as UNA built it before both actions arrives now
    client.setQueryData(KEY, { pages: [{ data: [item] }], pageParams: [undefined] });

    const shown = (client.getQueryData(KEY) as any).pages[0].data[0];
    assert.equal(shown.followers_count, 3);
    assert.deepEqual(shown.meta.items.map((metaItem: any) => metaItem.data.title), ['Request sent', 'Following']);
});
