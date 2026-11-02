import dynamic from 'next/dynamic';
import { coreFormFields } from 'app/components/registry';

// Each field type is its own chunk: fetched when a form renders it, and
// preloaded in the HTML when it was rendered during SSR (see lib/dynamic-fallback.js).
// Heavy ones (markdown editor, files, location, Stripe, phone codes, sliders)
// no longer reach pages without such a field.
//
// No `loading`, so no Suspense boundary per field: a field waits in Form's own
// boundary (components/form.js), and a server-rendered form hydrates with all its
// fields at once. With a boundary each, a field whose code had not run yet was still
// server HTML when Form re-rendered after mounting, and React rendered it again from
// scratch, dropping what had been typed before hydration (the login form on web).
const Captcha = dynamic(() => import('./captcha'));
const Custom = dynamic(() => import('./custom'));
const Hidden = dynamic(() => import('./hidden'));
const Password = dynamic(() => import('./password'));
const Submit = dynamic(() => import('./submit'));
const Switcher = dynamic(() => import('./switcher'));
const TextField = dynamic(() => import('./text'));
const Value = dynamic(() => import('./value'));
const Phone = dynamic(() => import('./phone'));
const TextTranslatable = dynamic(() => import('./text-translatable'));
const MarkdownTranslatable = dynamic(() => import('./markdown-translatable'));
const Editor = dynamic(() => import('./editor'));
const EditorMarkdown = dynamic(() => import('./editor-markdown'));
const Select = dynamic(() => import('./select'));
const Files = dynamic(() => import('./files'));
const Location = dynamic(() => import('./location'));
const Datetime = dynamic(() => import('./datetime'));
const Selector = dynamic(() => import('./selector'));
const BlockHeader = dynamic(() => import('./block-header'));
const BlockEnd = dynamic(() => import('./block-end'));
const Suggestion = dynamic(() => import('./suggestion'));
const InitialMembers = dynamic(() => import('./initial-members'));
const Labels = dynamic(() => import('./labels'));
const InputSet = dynamic(() => import('./input-set'));
const LocationRadius = dynamic(() => import('./location-radius'));
const DoubleRange = dynamic(() => import('./doublerange'));
const CheckboxSet = dynamic(() => import('./checkbox-set'));
const Visibility = dynamic(() => import('./visibility'));
const Stars = dynamic(() => import('./stars'));
const MultiField = dynamic(() => import('./multi-field'));
const Embed = dynamic(() => import('./embed'));
const Polls = dynamic(() => import('./polls'));
const StripeConnect = dynamic(() => import('./stripe-connect'));
const List = dynamic(() => import('./list'));
const Price = dynamic(() => import('./price'));

export const componentsMapDefault = {
    input_set: InputSet,
    stripe_connect: StripeConnect,
    visibility: Visibility,
    multi_field: MultiField,
    embed: Embed,
    editor: Editor,
    polls: Polls,
    initial_members: InitialMembers,
    captcha: Captcha,
    custom: Custom,
    mood: Stars,
    hidden: Hidden,
    password: Password,
    submit: Submit,
    button: Submit,
    switcher: Switcher,
    checkbox: Switcher,
    text: TextField,
    text_translatable: TextTranslatable,
    markdown_translatable: MarkdownTranslatable,
    phone: Phone,
    value: Value,
    price: Price,
    textarea: Editor,
    textarea_markdown: EditorMarkdown,
    markdown: EditorMarkdown,
    select: Select,
    select_multiple: Selector,
    radio_set: Select,
    files: Files,
    location: Location,
    selector: Selector,
    location_radius: LocationRadius,
    datetime: Datetime,
    datepicker: Datetime,
    suggestion: Suggestion,
    block_header: BlockHeader,
    block_end: BlockEnd,
    labels: Labels,
    doublerange: DoubleRange,
    checkbox_set: CheckboxSet,
    list: List
};

Object.assign(coreFormFields, componentsMapDefault);
