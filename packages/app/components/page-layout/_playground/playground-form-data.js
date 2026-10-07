/**
 * Synthetic UNA form JSON for /pg/form.
 * Shape matches what `Form` expects: `{ params, inputs }` where each input
 * has a `type` from `packages/app/components/form-fields/_map.js`.
 *
 * Network-backed fields (location, files, polls, suggestion, …) still render;
 * their pickers may call UNA if you interact with them.
 */
export const PLAYGROUND_FORM_NAME = 'playground_all_fields';

const CHOICES = {
    js: 'JavaScript',
    php: 'PHP',
    py: 'Python',
};

const SELECTOR_VALUES = [
    { key: 'js', value: 'JavaScript' },
    { key: 'php', value: 'PHP' },
    { key: 'py', value: 'Python' },
    { key: 'js1', value: 'JavaScript1' },
    { key: 'php1', value: 'PHP1' },
    { key: 'py1', value: 'Python1' },
    { key: 'js2', value: 'JavaScript' },
    { key: 'php2', value: 'PHP' },
    { key: 'py2', value: 'Python' },
    { key: 'js3', value: 'JavaScript' },
    { key: 'php3', value: 'PHP' },
    { key: 'py3', value: 'Python' },
];

export const PLAYGROUND_FORM_DATA = {
    params: { display: PLAYGROUND_FORM_NAME },
    inputs: {
        
        block_adaptive: {
            type: 'block_header',
            name: 'block_adaptive',
            caption: 'Adaptive labels',
        },

        adaptive_empty: {
            type: 'text',
            name: 'adaptive_empty',
            caption: 'Floating label',
            value: '',
            use_caption_as_placeholder: true,
            info: 'Empty: caption sits inside, floats on focus',
        },

        adaptive_filled: {
            type: 'password',
            name: 'adaptive_filled',
            caption: 'Floating label (filled)',
            value: 'Already filled',
            use_caption_as_placeholder: true,
            info: 'Has value: caption starts floated',
        },

        adaptive_phone: {
            type: 'phone',
            name: 'adaptive_phone',
            caption: 'Phone',
            value: '+1 (415) 555-0132',
            use_caption_as_placeholder: true,
            info: 'Has value: caption starts floated',
        },

        adaptive_password: {
            type: 'password',
            name: 'adaptive_password',
            caption: 'Password',
            value: '',
            use_caption_as_placeholder: true,
            info: 'Same pattern on password',
        },

        block_text: {
            type: 'block_header',
            name: 'block_text',
            caption: 'Text & numbers',
        },

        title: {
            type: 'text',
            name: 'title',
            caption: 'Title',
            value: 'Kitchen sink',
            placeholder: 'Title',
            info: 'Standard text field',
        },

        email: {
            type: 'text',
            name: 'email',
            caption: 'Email (server error demo)',
            value: 'not-an-email',
            error: 'Please enter a valid email',
        },

        phone: {
            type: 'phone',
            name: 'phone',
            caption: 'Phone',
            value: '',
        },

        pass: {
            type: 'password',
            name: 'pass',
            caption: 'Password',
            value: '',
        },

        amount: {
            type: 'price',
            name: 'amount',
            caption: 'Price',
            value: { value: '19.99', currency: 'USD' },
            value_currency: 'USD',
        },

        readonly_id: {
            type: 'value',
            name: 'readonly_id',
            caption: 'Record ID',
            value: '42',
        },

        names: {
            type: 'input_set',
            name: 'names',
            caption: 'Split name',
            0: {
                type: 'text',
                name: 'first_name',
                caption: 'First',
                value: 'Ada',
            },
            1: {
                type: 'text',
                name: 'last_name',
                caption: 'Last',
                value: 'Lovelace',
            },
        },

        block_choice: {
            type: 'block_header',
            name: 'block_choice',
            caption: 'Choice',
        },

        agree: {
            type: 'switcher',
            name: 'agree',
            caption: 'I agree',
            checked: 1,
        },

        notify: {
            type: 'checkbox',
            name: 'notify',
            caption: 'Notify me',
            checked: 0,
        },

        country: {
            type: 'select',
            name: 'country',
            caption: 'Country',
            value: 'us',
            values: { us: 'USA', de: 'Germany', ua: 'Italy' },
        },

        language: {
            type: 'radio_set',
            name: 'language',
            caption: 'Language',
            value: 'en',
            values: [
                { key: 'en', value: 'English' },
                { key: 'uk', value: 'Greek' },
            ],
        },

        skills: {
            type: 'select_multiple',
            name: 'skills',
            caption: 'Skills',
            value: ['js'],
            values: SELECTOR_VALUES,
        },

        category: {
            type: 'selector',
            name: 'category',
            caption: 'Category (single)',
            origtype: 'select',
            value: ['php'],
            values: SELECTOR_VALUES,
        },

        
        tags: {
            type: 'labels',
            name: 'tags',
            caption: 'Labels',
            value: ['featured'],
            values: {
                system: [{ value: 'featured' }, { value: 'staff' }],
                context: [{ value: 'local' }, { value: 'remote' }],
            },
        },


        topics: {
            type: 'checkbox_set',
            name: 'topics',
            caption: 'Topics',
            value: ['js'],
            values: CHOICES,
        },

        age: {
            type: 'doublerange',
            name: 'age',
            caption: 'Age range',
            value: '',
            attrs: { min: 18, max: 99 },
        },

        mood: {
            type: 'mood',
            name: 'mood',
            caption: 'Mood',
            value: '3',
        },

        privacy: {
            type: 'visibility',
            name: 'privacy',
            caption: 'Audience',
            value: '3',
            values: {
                3: 'Public',
                5: 'Friends',
                2: 'Me only',
            },
        },

        when: {
            type: 'datetime',
            name: 'when',
            caption: 'Date & time',
            value: '2026-08-14 12:00:00Z',
        },

        birthday: {
            type: 'datepicker',
            name: 'birthday',
            caption: 'Date only',
            value: '1990-05-01',
        },

        block_editors: {
            type: 'block_header',
            name: 'block_editors',
            caption: 'Editors & translations',
        },

        body: {
            type: 'textarea',
            name: 'body',
            caption: 'Plain textarea',
            value: 'Plain body text',
            html: 0,
        },

        html_body: {
            type: 'editor',
            name: 'html_body',
            caption: 'Rich editor',
            value: '<p>Rich <strong>HTML</strong> body</p>',
            html: 1,
        },

      
        title_i18n: {
            type: 'text_translatable',
            name: 'title_i18n',
            caption: 'Translatable title',
            translations: [
                { name: 'title_i18n-en', title: 'EN' },
                { name: 'title_i18n-uk', title: 'UK' },
            ],
            values: { en: 'Hello', uk: 'Hello2' },
        },

      

        embed: {
            type: 'embed',
            name: 'embed',
            caption: 'Embed URL',
            value: '',
            placeholder: 'https://…',
        },

        block_repeat: {
            type: 'block_header',
            name: 'block_repeat',
            caption: 'Repeatable rows',
        },

        aliases: {
            type: 'multi_field',
            name: 'aliases',
            caption: 'Aliases',
            minCount: 2,
            value: ['Ada', 'Lovelace'],
            value_ids: [1, 2],
        },

        links: {
            type: 'list',
            name: 'links',
            caption: 'Links',
            params: JSON.stringify({
                minCount: 1,
                maxCount: 4,
                fields: [
                    { name: 'label', title: 'Label' },
                    { name: 'url', title: 'URL' },
                ],
            }),
            value: JSON.stringify([
                { label: 'Docs', url: 'https://example.com' },
            ]),
        },

        block_net: {
            type: 'block_header',
            name: 'block_net',
            caption: 'Network-backed (render only; pickers may hit UNA)',
        },

        place: {
            type: 'location',
            name: 'place',
            caption: 'Location',
            value: { location_string: '' },
        },

        nearby: {
            type: 'location_radius',
            name: 'nearby',
            caption: 'Location + radius',
            value: { location_string: '' },
        },

        pictures: {
            type: 'files',
            name: 'pictures',
            caption: 'Files',
            value: '',
            multiple: true,
            uploaders: ['sys_html5'],
            storage_object: 'sys_images',
            images_transcoder: '',
            content_id: 0,
            privacy: 0,
        },

        members: {
            type: 'initial_members',
            name: 'members',
            caption: 'Members',
            value: [],
            value_data: [],
            ajax_get_suggestions: 'bx_persons/suggest',
        },

        source: {
            type: 'suggestion',
            name: 'source',
            caption: 'Suggestion',
            value: '',
            ajax_get_suggestions: 'bx_persons/suggest',
        },

        polls: {
            type: 'polls',
            name: 'polls',
            caption: 'Polls',
            value: '',
            values: [],
            request_get: '/api.php?r=playground/poll_form',
            request_submit: '/api.php?r=playground/poll_submit',
            request_remove: '/api.php?r=playground/poll_remove',
        },

        stripe: {
            type: 'stripe_connect',
            name: 'stripe',
            caption: 'Stripe',
            content: [
                {
                    title: 'Connect Stripe (demo)',
                    callback: '/api.php?r=playground/stripe',
                },
            ],
        },

        block_stubs: {
            type: 'block_header',
            name: 'block_stubs',
            caption: 'Stubs (captcha / custom / block_end render nothing)',
        },

        captcha: {
            type: 'captcha',
            name: 'captcha',
            caption: 'Captcha',
        },

        custom: {
            type: 'custom',
            name: 'custom',
            caption: 'Custom',
        },

        block_end_field: {
            type: 'block_end',
            name: 'block_end_field',
            caption: '',
        },

        save: {
            type: 'submit',
            name: 'save',
            value: 'Submit playground form',
            hide_errors: true,
        },
    },
};

export function createPlaygroundFormData() {
    return JSON.parse(JSON.stringify(PLAYGROUND_FORM_DATA));
}
