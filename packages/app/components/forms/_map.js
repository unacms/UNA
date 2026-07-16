import FormComments from './comments';
import FormFeed from './feed';
import FormPost from './post';
import FormContent from './content';
import FormConfirmEmail from './confirm_email';
import Messenger from './messenger';

export const componentsMapDefault = {
    sys_confirm_email: FormConfirmEmail,
    comment: FormComments,
    feed: FormFeed,
    feed_edit: FormFeed,
    bx_posts: FormPost,
    bx_ads: FormContent,
    bx_albums: FormContent,
    bx_forum: FormPost,
    bx_messenger: Messenger
};