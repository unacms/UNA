import Captcha from './captcha';
import Custom from './custom';
import Hidden from './hidden';
import Password from './password';
import Submit from './submit';
import Switcher from './switcher';
import TextField from './text';
import Select from './select';
import BlockHeader from './block_header';
import BlockEnd from './block_end';
import Suggestion from './suggestion';
import InitialMembers from './initial_members';
import Labels from './labels';
import InputSet from './input_set';
import DoubleRange from './doublerange';
import CheckboxSet from './checkbox_set';
import Visibility from './visibility';
import Stars from './stars';
import List from './list';

export { formFieldLazyLoaders } from './_map.lazy';

/** Sync form fields — text, auth, and simple controls stay eager. */
export const componentsMapDefault = {
    input_set: InputSet,
    visibility: Visibility,
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
    phone: TextField,
    value: TextField,
    price: TextField,
    select: Select,
    radio_set: Select,
    suggestion: Suggestion,
    block_header: BlockHeader,
    block_end: BlockEnd,
    labels: Labels,
    doublerange: DoubleRange,
    checkbox_set: CheckboxSet,
    list: List
};
