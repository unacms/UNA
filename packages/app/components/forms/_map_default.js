import FormComments from './comments';
import FormFeed from './feed';
import FormFeedEdit from './feed_edit';
import FormPost from './post';
import FormMessenger from './messenger';

export const componentsMapDefault = {
    comment: FormComments,
    feed: FormFeed,
    feed_edit: FormFeedEdit,
    bx_posts: FormPost,
    bx_forum: FormPost,
    bx_messenger: FormMessenger,
};