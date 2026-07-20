<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_FORM_METHOD_GET', 'get');
define('BX_DOL_FORM_METHOD_POST', 'post');
define('BX_DOL_FORM_METHOD_SPECIFIC', 'specific');
define('BX_DOL_FORM_METHOD_DEFAULT', BX_DOL_FORM_METHOD_POST);

define('BX_DATA_LISTS_KEY_PREFIX', '#!');
define('BX_DATA_VALUES_DEFAULT', 'LKey'); ///< Use default values for data items, @see BxDolForm::getDataItems
define('BX_DATA_VALUES_ADDITIONAL', 'LKey2'); ///< Use additional values for data items, @see BxDolForm::getDataItems
define('BX_DATA_VALUES_ALL', 'all'); ///< Return all available info for data items, @see BxDolForm::getDataItems

bx_import('BxDolPrivacy');

/**
 * Forms allows to display forms from data stored in DB tables, before it was possible to display forms from PHP arrays only.
 *
 *
 * The Form Objects have the following main advantages:
 * - Minimal coding is needed to create different forms
 * - Easy forms alterations
 * - Multiple representations of the same form
 * - Automated data inserting into database
 * - Automated data updating
 * - Automated data checking
 * - Automatic security checking
 * - Automatic spam filter
 *
 *
 * Forms API uses several definitions:
 * - Form or Form Object - record in sys_objects_form table, or instance of Form class.
 * - Form Display - set of some form inputs in particular order, displayed for some purpose; one form can have several displays, for example add and edit displays.
 * - Form Input or Form Field - form input field, like textarea, checkbox or set of radio buttons.
 *
 *
 * @section form_creating_object Creating the Form Object
 *
 * 1. Create Form Object, add record to sys_objects_form table:
 * - object - name of the Form Object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing; for example: bx_group - for group data processing, like group adding or editing.
 * - title - Form Object title to display in studio forms builder.
 * - action - url to submit form to, if url is not full and not empty, then site url is added automatically.
 * - form_attrs - serialized array of additional form attributes.
 * - submit_name - name of form field with submit button, it is used to determine if form is submitted.
 * - table - DB table name (for automatic saving/updating).
 * - key - DB table field with unique ID (for automatic updating).
 * - uri - DB table field with URI (for automatic URI generation, aling with uri_title).
 * - uri_title - DB table field with data title (for automatic URI generation, aling with uri).
 * - params - serialized array of additional form parameters:
 * - checker_helper - name of custom BxDolFormCheckerHelper class.
 * - csrf - array of Cross-site request forgery attack prevention parameters, for now only one boolean parameter is supported - disabled, so it can be disabled for particular form.
 * - active - 1 or 0, if form is inactive then it can not be used anywhere.
 * - override_class_name - user defined class name which is derived from BxTemplFormView.
 * - override_class_file - the location of the user defined class, leave it empty if class is located in system folders.
 *
 *
 * 2. Create Form Displays, add records to sys_form_displays table:
 * - display_name - name of the Form Display, in the format:
 *                  form object name, underscore, internal identifier or nothing;
 *                  for example: bx_group_add - for displaying group adding form, bx_group_edit - for displaying group editing form
 * - module - module name this display belongs to, it must be associated with name field in sys_modules table.
 * - object - form object name from sys_objects_form table this Form Display belongs to.
 * - title - Form Display title to display in studio forms builder.
 * - view_mode - display form as read-only.
 *
 *
 * 3. Create Form Fields, add records to sys_form_inputs table:
 * - object - form object name from sys_objects_form table this Form Field belongs to.
 * - module - module name this field belongs to.
 * - name - unique Form Field name in particular From Object.
 * - value - default value, or empty if there is no default value.
 * - values - possible values, for certain form field types.
 * - checked - 0 or 1, it determines if form field is checked, for certain form field types.
 * - type - form field type, for now the following types are supported:
 *      - text - text input field.
 *      - password - password input field.
 *      - textarea - multiline input field.
 *      - number - number input field.
 *      - select - select one from all available values.
 *      - select_multiple - select one, multiple or all items from all available values.
 *      - switcher - on/off switcher.
 *      - checkbox - one checkbox.
 *      - checkbox_set - set of checkboxes.
 *      - radio_set - set of radio buttons.
 *      - slider - select some numeric value within the range using slider control.
 *      - doublerange - select range values within the range using slider control.
 *      - datepicker - date selection control.
 *      - datetime - date/time selection control.
 *      - dateselect - date selection control (alternative).
 *      - captcha - image captcha.
 *      - hidden - hidden input field.
 *      - file - file upload input.
 *      - button - button control.
 *      - image - form image button.
 *      - reset - form reset button.
 *      - submit - form submit button.
 *      - value - just displaying value without any crontol.
 *      - block_header - start group of field.
 *      - custom - custom control.
 *      - input_set - set of other form controls.
 *      detailed description of every type will be described below.
 * - caption - input title.
 * - info - some info to help user to input data into the field, it's better to specify format and limits here.
 * - required - indicate that the input is required by displaying asterisk near the field,
 *              please note that this field don't perform any checking automatically,
 *              since you mark field as required you need to specify checked function which will check entered value.
 * - collapsed - display section as collapsed by default, for block_header field type only.
 * - html - display visual editor of certain type, for textarea field type only.
 *      - 0 - no visual editor, leave textarea field as it is.
 *      - 1 - standard(default) visual editor, @see BxDolEditor.
 *      - 2 - full visual editor, @see BxDolEditor.
 *      - 3 - mini visual editor, @see BxDolEditor.
 * - attrs - serialized array of additional input attributes.
 * - attrs_tr - serialized array of additional attributes for the whole input row.
 * - attrs_wrapper - serialized array of additional attributes for input wrapper.
 * - checker_func - checked function, if you marked field as required in textarea field you need to point one of the following checked functions:
 *      - Length - check value length, additional params must contain min and/or max values for checking.
 *      - Date - check if date is entered correctly.
 *      - DateTime - check if datetime is entered correctly.
 *      - Preg - check value with provided regular expression in checker_params field.
 *      - Avail - just check if value isn't 0 or empty string, additional function parameters are not used.
 *      - Email - check if value is written in valid email format.
 *      - Captcha - check if captcha is entered correctly, for captcha field type only.
 *      You can inherit BxDolFormCheckerHelper class and add own checker functions, you will need to point your custom class in Form Object params array.
 * - checker_params - serialized array of checker_func parameters.
 * - checker_error - error message to show in case of checking function returns false.
 * - db_pass - function to pass value through before saving to database and after restoring from database (for example when date need to be converted from/to timestamp value),
 *              available values are the following:
 *      - Int - convert value to integer.
 *      - Float - convert value to floating point number.
 *      - Date,DateUtc - convert value to timestamp value before saving to database, and convert from timespamp value after restoring from database.
 *      - DateTime,DateTimeUtc - convert value to timestamp value before saving to database, and convert from timespamp value after restoring from database.
 *      - Xss - it warns you that this text can contain XSS vulnerabilities and you need to be extra careful with this, and always use Forms engine to output string to the browser or use bx_process_output if going to output text manually.
 *      - XssHtml - this text cam have HTML tags, so perform XSS vulnerabilies cleaning before saving to database.
 *      - All - do not perform any conversion and pass text as it is, be careful with this, use it only when no other function can be used, and make all necessary security checking by yourself.
 *      - Preg - perform regular expression on the text before saving data to database, regular expression can be provided in db_params field.
 *      - Boolean - this is used for checkboxes with 'on' value which need to be converted into boolean value.
 *      - Set - convert set of values into bit integer before saving to database, and restore bit integer into array of values upon restoration from database, it can be used for select_multiple and checkbox_set field types.
 *      Please note that values for this field must be 1,2,4,8,... (values of power of 2); the max number of values are 31 for 32bit hardware and 63 for 64bit hardware.
 *      You can inherit BxDolFormCheckerHelper class and add own pass functions, you will need to point your custom class in Form Object params array.
 * - db_params - serialized array of db_pass parameters.
 * - editable - allow to edit this field from admin forms builder.
 * - deletable - allow to delete this field from admin forms builder.
 *
 *
 * 4. Add Form Fields and Form Displays associations, add records to sys_form_display_inputs table:
 * - display_name - name of the Form Display from sys_form_displays table.
 * - input_name - name of the Form Field from sys_form_inputs table.
 * - visible_for_levels - bit field with set of member level ids. To use member level id in bit field the level id minus 1 is used as power of 2, for example:
 *      - user level id = 1 -> 2^(1-1) = 1
 *      - user level id = 2 -> 2^(2-1) = 2
 *      - user level id = 3 -> 2^(3-1) = 4
 *      - user level id = 4 -> 2^(4-1) = 8
 * - active - 1 - form field displayed on form, or 0 - isn't displayed.
 * - order - fields are displayed in this order.
 *
 *
 * @section form_field_types Form Field Types
 *
 * Detailed description of Form Field Types.
 *
 * Almost all fields have the following common parameters:
 * - object
 * - name
 * - type
 * - caption
 * - info
 * - required
 * - attrs
 * - attrs_tr
 * - attrs_wrapper
 *
 * We will not describe above list of parameters in every type, since they work the same way for all types.
 *
 * The list below are field types with their unique parameters, which are designed especially for this field, or some parameters which work differently for the specified field type.
 *
 * text - text input field. It is displayed as regular single line text input.
 *      Parameters:
 *      - value - default value, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail, Email
 *          Make no sense to use it here: Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, All, Preg
 *          Make no sense to use it here: Date, DateTime, XssHtml, Boolean, Set
 *
 * password - password input field. It is displayed as HTML input element with invisible input.
 *      Parameters:
 *      - value - default value, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail.
 *          Make no sense to use it here: Date, DateTime, Captcha, Email.
 *      - db_pass
 *          Can be used here: Xss, All.
 *          Make no sense to use it here: Int, Float, Date, DateTime, XssHtml, Boolean, Set, Preg.
 *
 * textarea - multiline input field. It can be displayed as regular textarea field or as visual HTML editor.
 *      Parameters:
 *      - value - default value, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - use visual editor or not.
 *          - 0 - no visual editor, leave textarea field as it is.
 *          - 1 - standard(default) visual editor, @see BxDolEditor.
 *          - 2 - full visual editor, @see BxDolEditor.
 *          - 3 - mini visual editor, @see BxDolEditor.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, XssHtml, All, Preg
 *          Make no sense to use it here: Date, DateTime, Boolean, Set
 *
 * number - number input field. It is displayed as HTL text input, but with limited width. Also some browsers can add additional controls to this field.
 *      Parameters:
 *      - value - default value, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float
 *          Make no sense to use it here: Xss, XssHtml, All, Preg, Date, DateTime, Boolean, Set
 *
 * select - select one from all available values. It is displayed as HTML combo-box.
 *      Parameters:
 *      - value - default value (array index of selected item from values array), or empty - if there is no default value.
 *      - values - serialized array of available values, or reference to predefined set of values.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, All, Preg
 *          Make no sense to use it here: Date, DateTime, XssHtml, Boolean, Set
 *
 * select_multiple - select one, multiple or all items from all available values. It is displayed as HTML multiple selection input.
 *      Parameters:
 *      - value - default value (bit integer of array indexes of selected items from values array), or empty - if there is no default value.
 *      - values - serialized array of available values, or reference to predefined set of values. Array index must be power of 2. Max number of values is 31 on 32bit hardware or 63 on 64bit hardware.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int
 *          Make no sense to use it here: Float, Xss, All, Preg, Date, DateTime, XssHtml, Boolean, Set
 *
 * switcher - on/off switcher. It is displayed as custom HTML element with own styles, but on background it works as regular HTML checkbox element.
 *      Parameters:
 *      - value - the value which will be submitted if switcher is on, if switcher is off - nothing is submitted.
 *      - values - not applicable here.
 *      - checked - if set to 1 then switcher is on by default, 0 - it is off by default.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, All, Preg, Boolean
 *          Make no sense to use it here: Date, DateTime, XssHtml, Set
 *
 * checkbox - one checkbox. Displayed as HTML checkbox input element.
 *      Parameters:
 *      - value - the value which will be submitted if checkbox is checked, if checkbox isn't checked - nothing is submitted.
 *      - values - not applicable here.
 *      - checked - if set to 1 then checkbox is checked by default, 0 - it is unchecked by default.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, All, Preg, Boolean
 *          Make no sense to use it here: Date, DateTime, XssHtml, Set
 *
 * checkbox_set - set of checkboxes. It is displayed as set of checkboxes. It is displayed in one row if number of items is equal or less than 3 or every item is displayed on new line if there is more than 3 items in the set.
 *      Parameters:
 *      - value - default value (bit integer of array indexes of selected items from values array), or empty - if there is no default value.
 *      - values - serialized array of available values, or reference to predefined set of values. Array index must be power of 2. Max number of values is 31 on 32bit hardware or 63 on 64bit hardware.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int
 *          Make no sense to use it here: Float, Xss, All, Preg, Date, DateTime, XssHtml, Boolean, Set
 *
 * radio_set - set of radio buttons. It is displayed as set of radio buttons. It is displayed in one row if number of items is equal or less than 3 or every item is displayed on new line if there is more than 3 items in the set.
 *      Parameters:
 *      - value - default value (array index of selected radio button from values array), or empty - if there is no default value.
 *      - values - serialized array of available values, or reference to predefined set of values.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, All, Preg
 *          Make no sense to use it here: Date, DateTime, XssHtml, Boolean, Set
 *
 * slider - select some numeric value within the range using slider control. It is displayed as jQuery UI HTML control, but on background it works as regular HTML text input element.
 *      Parameters:
 *      - value - default value in the format, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - attrs - the following additional attributes can be used here:
 *      - min - minimal value, default is 0.
 *      - max - maximal value, default is 100.
 *      - step - value can be changed by this step only, default is 1.
 *      - checker_func
 *          Can be used here: Length, Avail
 *          Make no sense to use it here: Preg, Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Int, Float
 *          Make no sense to use it here: Xss, XssHtml, All, Preg, Date, DateTime, Boolean, Set
 *
 * doublerange - select range values within the range using slider control.
 *      Parameters:
 *      - value - default value in the format [min value]-[max value], for example 16-99, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - attrs - the following additional attributes can be used here:
 *          - min - minimal value, default is 0.
 *          - max - maximal value, default is 100.
 *          - step - value can be changed by this step only, default is 1.
 *      - checker_func
 *          Can be used here: Length, Avail
 *          Make no sense to use it here: Preg, Email, Date, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Xss, All, Preg
 *          Make no sense to use it here: Int, Float, XssHtml, Date, DateTime, Boolean, Set
 *
 * datepicker - date selection control. It is displayed as HTML text input control, when clicking on this input then popup with date selector control is appeared.
 *      Parameters:
 *      - value - default value, in the format YYYY-MMM-DD, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Date
 *          Make no sense to use it here: Length, Preg, Avail, Email, DateTime, Captcha
 *      - db_pass
 *          Can be used here: Date, DateUtc
 *          Make no sense to use it here: Int, Float, Xss, All, Preg, DateTime, XssHtml, Boolean, Set
 *
 * datetime - date/time selection control.
 *      Parameters:
 *      - value - default value, in the format YYYY-MMM-DD HH:MM:SS, or empty if there is no default value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: DateTime
 *          Make no sense to use it here: Length, Preg, Avail, Email, Date, Captcha
 *      - db_pass
 *          Can be used here: DateTime, DateTimeUtc
 *          Make no sense to use it here: Int, Float, Xss, All, Preg, Date, XssHtml, Boolean, Set
 *
 * captcha - image captcha. Displayed as image with some text along with HTML text input for entering displayed on the image text.
 *      Parameters:
 *      - value - not applicable here.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Captcha
 *          Make no sense to use it here: Length, Preg, Avail, Email, Date, DateTime
 *      - db_pass
 *          Can be used here: Xss, All, Preg
 *          Make no sense to use it here: Int, Float, Date, DateTime, XssHtml, Boolean, Set
 *
 * hidden - hidden input field. Displayed as hidden HTML input.
 *      Parameters:
 *      - value - hidden input value.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          Can be used here: Length, Preg, Avail, Email, Date, DateTime
 *          Make no sense to use it here: Captcha
 *      - db_pass
 *          Can be used here: Int, Float, Xss, All, Preg, Date, DateUtc, DateTime, DateTimeUtc, XssHtml, Boolean
 *          Make no sense to use it here: Set
 *
 * file - file upload input. Displayed as file upload HTML input.
 *      Parameters:
 *      - value - not applicable here.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func
 *          File name is passed for checking.
 *          Can be used here: Avail, Length, Preg
 *          Make no sense to use it here: Email, Date, DateTime, Captcha
 *      - db_pass
 *          File can't be stored in the database, so this field isn't applicable here.
 *
 * files - files upload input. Displayed as complex uploading HTML control.
 *          This control is too complex to describe it using default set of database fields, you need to use custom class to display this control.
 *
 * button - button control. Displayes as HTML button element.
 *      Parameters:
 *      - value - translatable button caption.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 * image - form image button. It is displayed as HTML form image input element.
 *      Parameters:
 *      - value - not applicable here.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - attrs - the following mandatory attribute must be specified here:
 *          - src - image URL.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 * reset - form reset button. Displayed as HTML form reset input button. By clicking on this button the form is reset to its default state.
 *      Parameters:
 *      - value - translatable button caption.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 * submit - form submit button. Displayed as HTML form submit input button. This button have the primary button style to distinguish it from other buttons. By clicking on this button the form is submitted.
 *      Parameters:
 *      - value - translatable button caption.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 * value - just displaying value without any control.
 *      Parameters:
 *      - value - the value to display.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 * block_header - start group of fields. Displayed as form fields divider with caption - then it can be collapsible or without caption - then it is just divider without any functionality.
 *      Parameters:
 *      - value - not applicable here.
 *      - values - not applicable here.
 *      - checked - not applicable here.
 *      - collapsed - display group of field collapsed by default, 1 - the group is collapsed, 0 - expanded (default value).
 *      - html - not applicable here.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 * custom - custom control. You need custom class to display this control, so the exact used values are determined by particular realisation.
 *
 * input_set - set of other form controls.
 *      Parameters:
 *      - value - not applicable here.
 *      - values - comma separated list of field names (by name field) of fields to display here.
 *      - checked - not applicable here.
 *      - collapsed - not applicable here.
 *      - html - not applicable here.
 *      - checker_func - not applicable here.
 *      - db_pass - not applicable here.
 *
 *
 * @section form_using_own_class Using own class for custom behavior
 *
 * It is possible to provide own class for displaying and processing the form.
 * To do this you need to point it in override_class_name and override_class_file fields in sys_objects_form table.
 * Your custom class must be inherited from BxTemplFormView class or its descendants.
 *
 *
 * @section form_display_custom_control Displaying custom field control
 *
 * It is possible to leave form field with default caption and override only the form field control.
 * To override some field you need to define the following function:
 * @code
 *      protected function genCustomInput[field name] ($aInput).
 * @endcode
 * Where [field name] is form field name.
 * For example:
 *
 * @code
 *     protected function genCustomInputCustom ($aInput) {
 *         return
 *         'r: <input type="text" size="2" value="'.(isset($aInput['value'][0]) ? $aInput['value'][0] : '').'" name="'.$aInput['name'].'[]" />' .
 *         'g: <input type="text" size="2" value="'.(isset($aInput['value'][1]) ? $aInput['value'][1] : '').'" name="'.$aInput['name'].'[]" />' .
 *         'b: <input type="text" size="2" value="'.(isset($aInput['value'][2]) ? $aInput['value'][2] : '').'" name="'.$aInput['name'].'[]" />';
 *     }
 * @endcode
 *
 *
 * @section form_display_custom_row Displaying custom field row
 *
 * Form row consists of caption and control, by default it is displayed with default design and functionality.
 * If you need to display some field with custom header and control you need to declare the following function:
 * @code
 *      protected function genCustomRow[field name] ($aInput).
 * @endcode
 * Where [field name] is form field name.
 *
 *
 * @section example Example of usage
 *
 * Printing the form for adding new record to the database:
 *
 * @code
 *      $oForm = BxDolForm::getObjectInstance('sample_form_objects', 'sample_form_objects_add'); // get form instance for specified form object and display
 *      if (!$oForm)
 *          die('"sample_form_objects_add" form object or "sample_form_objects_add" display is not defined');
 *      $oForm->initChecker(); // init form checker witout any data - adding new record
 *      if ($oForm->isSubmittedAndValid())
 *          echo 'inserted id: ' . $oForm->insert (); // add new record to the database
 *      echo $oForm->getCode(); // display form
 * @endcode
 *
 * Printing the form for editing existing record in the database:
 *
 * @code
 *      // $iEditId - ID of edited row, for example from _GET parameter
 *      $oDb = BxDolDb::getInstance();
 *      $sQuery = $oDb->prepare("SELECT * FROM `sample_input_types` WHERE id = ?", $iEditId);
 *      $aRecord = $oDb->getRow();
 *      if (!$aRecord)
 *          die("$iEditId record wasn't found.");
 *
 *      $oForm = BxDolForm::getObjectInstance('sample_form_objects', 'sample_form_objects_edit'); // get form instance for specified form object and display
 *      if (!$oForm)
 *          die('"sample_form_objects_edit" form object or "sample_form_objects_edit" display is not defined');
 *      $oForm->initChecker($aRecord); // init form checker with edited data
 *      if ($oForm->isSubmittedAndValid())
 *          echo 'updated: ' . $oForm->update ($iEditId); // update database
 *      echo $oForm->getCode(); // display form
 * @endcode
 *
 * Example of custom form class and custom checking helper class:
 *
 * @code
 *      class BxSampleForm extends BxTemplFormView {
 *
 *          public function __construct ($aInfo, $oTemplate = false) {
 *              parent::__construct ($aInfo, $oTemplate);
 *          }
 *
 *
 *          // display input with 'custom' name
 *          protected function genCustomInputCustom ($aInput) {
 *              return
 *              'r: <input type="text" size="2" value="'.(isset($aInput['value'][0]) ? $aInput['value'][0] : '').'" name="'.$aInput['name'].'[]" />' .
 *              'g: <input type="text" size="2" value="'.(isset($aInput['value'][1]) ? $aInput['value'][1] : '').'" name="'.$aInput['name'].'[]" />' .
 *              'b: <input type="text" size="2" value="'.(isset($aInput['value'][2]) ? $aInput['value'][2] : '').'" name="'.$aInput['name'].'[]" />';
 *          }
 *
 *      }
 *
 *      class BxSampleFormCheckerHelper extends BxDolFormCheckerHelper {
 *
 *          protected $_sDiv = ',';
 *
 *          // prepare RBG values to save to the DB
 *          function passRgb ($s) {
 *              if (!is_array($s))
 *                  return false;
 *
 *              $sRet = '';
 *              foreach ($s as $k => $v)
 *                  $sRet .= (int)trim($v) . $this->_sDiv;
 *
 *              return trim($sRet, $this->_sDiv);
 *          }
 *
 *          // prepare RGB values to output to the screen
 *          function displayRgb ($s) {
 *              return explode($this->_sDiv, $s);
 *          }
 *      }
 * @endcode
 *
 * The recommended way is to define forms in database, if it is impossible for some reasons you can init form object from array, there is an example:
 *
 * @code
 *      $aForm = array(
 *            'form_attrs' => array(
 *                'name'     => 'form_my',
 *                'method'   => 'post',
 *            ),
 *
 *            'params' => array (
 *                'db' => array(
 *                    'table' => 'table_name', // table name
 *                    'key' => 'ID', // key field name
 *                    'uri' => 'EntryUri', // uri field name
 *                    'uri_title' => 'Title', // title field to generate uri from
 *                    'submit_name' => 'submit_form', // some filed name with non empty value to determine if the for was submitted,
 *                                                       in most cases it is submit button name
 *                ),
 *                'csrf' => array(
 *                      'disable' => true, //if it wasn't set or has some other value then CSRF checking is enabled for current form, take a look at sys_security_form_token_enable to disable CSRF checking completely.
 *                )
 *              ),
 *
 *            'inputs' => array(
 *
 *                'Title' => array(
 *                    'type' => 'text',
 *                    'name' => 'Title', // the same as key and database field name
 *                    'caption' => 'Some caption',
 *                    'required' => true,
 *
 *                    // checker params
 *                    'checker' => array (
 *                        'func' => 'length', // see BxDolFormCheckerHelper class for all check* functions
 *                        'params' => array(3,100),
 *                        'error' => 'length must be from 3 to 100 characters',
 *                    ),
 *                    // database params
 *                    'db' => array (
 *                        'pass' => 'Xss',  // do XSS clear before getting this value, see BxDolFormCheckerHelper class for all pass* functions
 *                    ),
 *                ),
 *
 *                'Description' => array(
 *                    'type' => 'textarea',
 *                    'name' => 'Description', // the same as key and database field name
 *                    'caption' => 'Some caption',
 *                    'required' => true,
 *
 *                    // checker params
 *                    'checker' => array (
 *                        'func' => 'length',
 *                        'error' => 'enter at least 3 characters',
 *                        'params' => array(3,64000),
 *                    ),
 *                    'db' => array (
 *                        'pass' => 'XssHtml',  // do XSS clear, but keep HTML before getting this value
 *                    ),
 *                ),
 *            );
 * @endcode
 *
 * Using of above array:
 *
 * @code
 *        $oForm = new BxTemplFormView ($aForm);
 *        $oForm->initChecker();
 *
 *        if ($oForm->isSubmittedAndValid ()) {
 *
 *            // add additional vars to database, in this case creation date field is added
 *            $aValsAdd = array (
 *                'Date' => time(),
 *            );
 *
 *            echo 'insert last id: ' . $oForm->insert ($aValsAdd); // insert validated data to database
 *
 *        } else {
 *
 *            echo $oForm->getCode (); // show form
 *
 *        }
 *
 * @endcode
 *
 */
class BxDolForm extends BxDol implements iBxDolReplaceable
{
    static $TYPES_SKIP = array('files' => 1, 'location' => 1, 'nested_form' => 1);
    static $TYPES_CHECKBOX = array('checkbox' => 1, 'switcher' => 1);
    static $TYPES_TEXT = array('text' => 1, 'textarea' => 1);
    static $TYPES_FILE = array('file' => 1);

    static $FUNC_SKIP_DOMAIN_CHECK = array('email' => 1, 'emails' => 1, 'emailexist' => 1, 'emailuniq' => 1, 'emailexistorempty' => 1, 'hostdomain' => 1, 'hostdomainchat' => 1, 'emailorempty' => 1);
    static $FUNC_SKIP_MACROS_CHECK = array();

    static $LOCATION_INDEXES = array ('lat', 'lng', 'country', 'state', 'city', 'zip', 'street', 'street_number');
    static $LOCATION_INDEXES_MANDATORY = array ('lat', 'lng');

    protected $_bIsApi;

    protected $_aMarkers = array ();

    protected $oTemplate;

    protected $_isValid = true;
    protected $_bForceSetToPending = false;
    protected $_sChecker;
    protected $_sCheckerHelper;
    protected $_aSpecificValues;

    public $aFormAttrs; ///< form html element attributes
    public $aInputs; ///< form inputs
    public $aParams; ///< additional form parameters
    public $id; ///< Form element id

    protected $_aFieldsCheckForSpam = array(); ///< additional fields names to check for spam(profanity filter), now only fields with 'textarea' and 'text' are checked for spam, 'textarea' fields are checked for spam and filter for profanity, while 'text' fields are filtetered for profanity only
    protected $_aFieldsExcludeFromCheckForSpam = array(); ///<  fields names('textarea' and 'text') to exclude from  check for spam(profanity filter)

    
    protected $_iAuthorId;
    protected $_sAuthorKey; ///< array key to get author ID from Values array provided in BxDolForm::initChecker.
    protected $_sPrivacyObjectView;
    protected $_sPrivacyGroupDefault;

    public function __construct ($aInfo, $oTemplate)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        if ($oTemplate)
            $this->oTemplate = $oTemplate;
        else
            $this->oTemplate = BxDolTemplate::getInstance();

        $this->aFormAttrs    = isset($aInfo['form_attrs'])   ? $aInfo['form_attrs']  : array();
        $this->aInputs       = isset($aInfo['inputs'])       ? $aInfo['inputs']      : array();
        $this->aParams       = isset($aInfo['params'])       ? $aInfo['params']      : array();

        // get form element id
        $this->id = $this->aFormAttrs['id'] = (!empty($this->aFormAttrs['id']) ? $this->aFormAttrs['id'] : (!empty($this->aFormAttrs['name']) ? $this->aFormAttrs['name'] : 'form_advanced'));

        // set default method
        if (!isset($this->aFormAttrs['method']))
            $this->aFormAttrs['method'] = BX_DOL_FORM_METHOD_DEFAULT;

        // set default action
        if (!isset($this->aFormAttrs['action']))
            $this->aFormAttrs['action'] = '';

        $this->_sChecker = isset($this->aParams['checker']) ? $this->aParams['checker'] : 'BxDolFormChecker';
        $this->_sCheckerHelper = isset($this->aParams['checker_helper']) ? $this->aParams['checker_helper'] : '';

        $this->_sAuthorKey = 'author';
        $this->_sPrivacyObjectView = 'sys_form_inputs_allow_view_to';
        $this->_sPrivacyGroupDefault = BX_DOL_PG_ALL;
    }

    /**
     * Get form object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject, $sDisplayName, $oTemplate = false, $sParam = '')
    {
        $sKey = 'BxDolForm!'.$sObject.'!'.$sDisplayName.'!'.$sParam;

        if (isset($GLOBALS['bxDolClasses'][$sKey]))
            return $GLOBALS['bxDolClasses'][$sKey];

        $aObject = BxDolFormQuery::getFormArray($sObject, $sDisplayName);
        if (!$aObject || !is_array($aObject))
            return false;

        $sClass = 'BxTemplFormView';
        if (!empty($aObject['override_class_name'])) {
            $sClass = $aObject['override_class_name'];
            if (!empty($aObject['override_class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);
        }

        $o = new $sClass($aObject, $oTemplate);

        return ($GLOBALS['bxDolClasses'][$sKey] = $o);
    }
    
     static public function unSetObjectInstance($sObject, $sDisplayName, $oTemplate = false, $sParam = '')
     {
        $sKey = 'BxDolForm!'.$sObject.'!'.$sDisplayName.'!'.$sParam;
         unset($GLOBALS['bxDolClasses'][$sKey]);
     }

    /**
     * Get data items array
     * @param $sKey data items identifier
     * @param $isUseForSet convert data items keys to use in set fields, make it power of 2 (1,2,4,8,16,etc).
     * @param $sUseValues use default(BX_DATA_VALUES_DEFAULT) or additional(BX_DATA_VALUES_ADDITIONAL) value titles, if additinal value title is missing default title is used
     * @return data items array
     */
    public static function getDataItems($sKey, $isUseForSet = false, $sUseValues = BX_DATA_VALUES_DEFAULT)
    {
        return BxDolFormQuery::getDataItems($sKey, $isUseForSet, $sUseValues);
    }

    function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        $this->_aSpecificValues = $aSpecificValues;

        $oChecker = new $this->_sChecker($this->_sCheckerHelper);
        $oChecker->setFormMethod($this->aFormAttrs['method'], $aSpecificValues);
        $oChecker->setFormParams($this->aParams);
        $oChecker->setFieldsCheckForSpam($this->_aFieldsCheckForSpam, $this->_aFieldsExcludeFromCheckForSpam);

        // init form with default values

        $aValuesDef = array ();
        foreach ($this->aInputs as $k => $a) {
            if (!isset($a['value']) || !isset($a['db']['pass']) || isset(self::$TYPES_CHECKBOX[$a['type']]) || isset(self::$TYPES_SKIP[$a['type']]))
                continue;
            $aValuesDef[$k] = $a['value'];
        }

        $oChecker->fillWithValues($this->aInputs, $aValuesDef);

        // init form with provided values

        if ($aValues)
            $oChecker->fillWithValues($this->aInputs, $aValues);

        // init author from provided values if it's available

        if (isset($aValues[$this->_sAuthorKey]))
            $this->_iAuthorId = (int)$aValues[$this->_sAuthorKey];


        if ($this->isSubmitted ()) {

            // init form with submitted data, overwrite prevously declared values

            $bViewMode = isset($this->aParams['view_mode']) && (int)$this->aParams['view_mode'] == 1;
            $bCsrfDisabled = isset($this->aParams['csrf']['disable']) && $this->aParams['csrf']['disable'] === true;
            $oChecker->enableFormCsrfChecking(!$bViewMode && !$bCsrfDisabled);

            $this->_isValid = $oChecker->check($this->aInputs, $aValues);

            if (!$this->_initCheckerNestedForms ())
                $this->_isValid = false;

        }

        /**
         * @hooks
         * @hookdef hook-system-form_check 'system', 'form_check' - hook to override form object after data checking was performed
         * - $unit_name - equals `system`
         * - $action - equals `form_check`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [object] by ref, an instance of form, @see BxDolForm, can be overridden in hook processing
         * @hook @ref hook-system-form_check
         */
        bx_alert('system', 'form_check', 0, 0, [
            'object' => &$this,
            'inputs_ref' => &$this->aInputs,
        ]);
    }

    function getKeyValuesPair ()
    {
        $aRet = array ();
        foreach ($this->aInputs as $k => $a) {
            if (!isset($a['value']) || isset(self::$TYPES_CHECKBOX[$a['type']]) || isset(self::$TYPES_SKIP[$a['type']]))
                continue;
            $aRet[$k] = $a['value'];
        }
        return $aRet;
    }

    function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $this->autoSetToPending($aValsToAdd);

        $oChecker = new $this->_sChecker($this->_sCheckerHelper);
        $oChecker->setFormMethod($this->aFormAttrs['method'], $this->_aSpecificValues);
        $sSql = $oChecker->dbInsert($this->aParams['db'], $this->aInputs, $aValsToAdd, $isIgnore);
        if (!$sSql)
            return false;
        $oDb = BxDolDb::getInstance();
        if ($oDb->query($sSql)) {
            $iRes = $oDb->lastId();

            /**
             * @hooks
             * @hookdef hook-system-form_submitted 'system', 'form_submitted' - hook to override form object after data was submitted and saved in database
             * - $unit_name - equals `system`
             * - $action - equals `form_submitted`
             * - $object_id - newly created database record id
             * - $sender_id - currently logged in profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `action` - [string] action equals to 'insert'
             *      - `module` - [string] module name if it's available
             *      - `entry_id` - [int] newly created database record id
             *      - `form_object` - [object] by ref, an instance of form, @see BxDolForm, can be overridden in hook processing
             * @hook @ref hook-system-form_submitted
             */
            bx_alert('system', 'form_submitted', $iRes, bx_get_logged_profile_id(), [
                'action' => 'insert',
                'module' => isset($this->aParams['module']) ? $this->aParams['module'] : '',
                'entry_id' => $iRes,
                'form_object' => &$this,
                'inputs_ref' => &$this->aInputs,
            ]);

            return $iRes;
        }
        return false;
    }

    function update ($val, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $this->autoSetToPending($aValsToAdd);

        $oChecker = new $this->_sChecker($this->_sCheckerHelper);
        $oChecker->setFormMethod($this->aFormAttrs['method'], $this->_aSpecificValues);
        $sSql = $oChecker->dbUpdate($val, $this->aParams['db'], $this->aInputs, $aValsToAdd, $aTrackTextFieldsChanges);
        if (!$sSql)
            return false;
        $bRes = BxDolDb::getInstance()->query($sSql);

        /**
         * @hooks
         * @hookdef hook-system-form_submitted 'system', 'form_submitted' - hook to override form object after data was submitted and saved in database
         * - $unit_name - equals `system`
         * - $action - equals `form_submitted`
         * - $object_id - updated database record id
         * - $sender_id - currently logged in profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `action` - [string] action equals to 'update'
         *      - `module` - [string] module name if it's available
         *      - `entry_id` - [int] updated database record id
         *      - `form_object` - [object] by ref, an instance of form, @see BxDolForm, can be overridden in hook processing
         * @hook @ref hook-system-form_submitted
         */
        bx_alert('system', 'form_submitted', $val, bx_get_logged_profile_id(), [
            'action' => 'update',
            'module' => isset($this->aParams['module']) ? $this->aParams['module'] : '',
            'entry_id' => $val,
            'form_object' => &$this,
            'inputs_ref' => &$this->aInputs,
        ]);

        return $bRes;
    }

    function isStatusFieldSupported() {
        // check whether we have a status field available for this type of content
        if (isset($this->aParams['module']) && $this->aParams['module'] && $oModule = BxDolModule::getInstance($this->aParams['module'])) {
            if (isset($oModule->_oConfig->CNF)) {
                $CNF = &$oModule->_oConfig->CNF;
                if (isset($CNF['FIELD_STATUS_ADMIN']) &&
                    isset($this->aParams['db']['table']) && isset($CNF['TABLE_ENTRIES']) && $this->aParams['db']['table'] == $CNF['TABLE_ENTRIES']) {
                    return true;
                }
            }
        }

        //if this is a comments form then we support it since V13.A3 as a special case
        if (isset($this->aParams['module']) && $this->aParams['module'] == 'system' && isset($this->aParams['object']) && $this->aParams['object'] == 'sys_comment')
            return true;

        return false;
    }

    function autoSetToPending(&$aValsToAdd) {
        if ($this->isStatusFieldSupported() && $this->_bForceSetToPending) {
            $oModule = BxDolModule::getInstance($this->aParams['module']);
            $CNF = &$oModule->_oConfig->CNF;

            if (isset($oModule->_oConfig->CNF) && isset($CNF['FIELD_STATUS_ADMIN'])) $aValsToAdd[$CNF['FIELD_STATUS_ADMIN']] = 'pending';
        }
    }

    function delete ($val)
    {
        $oChecker = new $this->_sChecker($this->_sCheckerHelper);
        $oChecker->setFormMethod($this->aFormAttrs['method'], $this->_aSpecificValues);
        $sSql = $oChecker->dbDelete($val, $this->aParams['db'], $this->aInputs);
        if (!$sSql)
            return false;
        return BxDolDb::getInstance()->query($sSql);
    }

    function generateUri ()
    {
        $f = &$this->aParams['db'];
        $sUri = $this->getCleanValue ($f['uri_title']);
        return uriGenerate($sUri, $f['table'], $f['uri']);
    }

    function getCleanValue ($sName)
    {
        $oChecker = new $this->_sChecker($this->_sCheckerHelper);
        $oChecker->setFormMethod($this->aFormAttrs['method'], $this->_aSpecificValues);
        $a = isset($this->aInputs[$sName]) ? $this->aInputs[$sName] : false;
        $oRv = null;

        if ($a && isset($a['db']['pass']))
            $oRv = $oChecker->get ($sName, $a['db']['pass'], isset($a['db']['params']) && $a['db']['params'] ? $a['db']['params'] : array());
        else
            $oRv =  $oChecker->get ($sName);

        // process comma separated string for api values
        if ($this->_bIsApi && isset($this->aInputs[$sName]['type']) && !empty($oRv) && is_string($oRv) && (in_array($this->aInputs[$sName]['type'], ['checkbox_set', 'files', 'select_multiple']) || in_array($sName, ['labels'])))
            $oRv = explode(',', $oRv);

        return $oRv;
    }

    function isSubmitted ()
    {
        $aSubmitName = $this->aParams['db']['submit_name'];
        if(!is_array($aSubmitName))
            $aSubmitName = array($aSubmitName);

        foreach($aSubmitName as $sSubmitName)
            if(BxDolForm::getSubmittedValue($sSubmitName, $this->aFormAttrs['method'], $this->_aSpecificValues))
                return true;
        
        return false;
    }

    function getTemplate ()
    {
        return $this->oTemplate;
    }

    function getId ()
    {
        return $this->id;
    }

    function getName ()
    {
        return isset($this->aFormAttrs['name']) ? $this->aFormAttrs['name'] : '';
    }

    function setId ($sId)
    {
        $this->id = $sId;
        $this->aFormAttrs['id'] = $sId;
    }

    function setName($sName)
    {
        $this->aFormAttrs['name'] = $sName;
    }

    function setAction($sAction)
    {
        $this->aFormAttrs['action'] = $sAction;
    }

    function setForceSetToPending ($isValid)
    {
        $this->_bForceSetToPending = $isValid;
    }

    function setValid ($isValid)
    {
        $this->_isValid = $isValid;
    }

    function isValid ()
    {
        return $this->_isValid;
    }

    function isSubmittedAndValid ()
    {
        return ($this->isSubmitted() && $this->isValid());
    }

    function getSpecificValues()
    {
        return $this->_aSpecificValues;
    }

    function setSpecificValue($sName, $sVal)
    {
        $this->_aSpecificValues[$sName] = $sVal;
    }

    function getAuthorId()
    {
        return $this->_iAuthorId;
    }

    function setAuthorId($iAuthorId)
    {
        $this->_iAuthorId = (int)$iAuthorId;
        $this->aParams['params']['author_id'] = $this->_iAuthorId;
    }

    public static function getSubmittedValue($sKey, $sMethod, &$aSpecificValues = false)
    {
        $aData = array();
        if($sMethod == BX_DOL_FORM_METHOD_GET) {
            $aData = &$_GET;
        } else if($sMethod == BX_DOL_FORM_METHOD_POST) {
            $aData = &$_POST;
        } else if($sMethod == BX_DOL_FORM_METHOD_SPECIFIC) {
            $aData = &$aSpecificValues;
        }

        return isset($aData[$sKey]) ? $aData[$sKey] : false;
    }

    public static function setSubmittedValue($sKey, $mixedValue, $sMethod, &$aSpecificValues = false)
    {
        $aData = array();
        if($sMethod == BX_DOL_FORM_METHOD_GET) {
            $aData = &$_GET;
        } else if($sMethod == BX_DOL_FORM_METHOD_POST) {
            $aData = &$_POST;
        } else if($sMethod == BX_DOL_FORM_METHOD_SPECIFIC) {
            $aData = &$aSpecificValues;
        }

        return $aData[$sKey] = $mixedValue;
    }

    /**
     * Check if field exists
     * @param $sName field name 
     * @param $bCheckAllFields true - check all fields; false - all fields except: password, captcha, hidden, file, button, image, reset, submit, block_header, input_set
     * @return true if field exists or false otherwise
     */
    public function isFieldExist($sName, $bCheckAllFields = false)
    {
        if (!isset($this->aInputs[$sName]))
            return false;
        return $bCheckAllFields ? true : !in_array($this->aInputs[$sName]['type'], array('password', 'captcha', 'hidden', 'button', 'reset', 'submit', 'block_header', 'input_set', 'location'));
    }


    // Static Methods related to CSRF Tocken
    public static function genCsrfToken($bReturn = false)
    {
        // TODO: remove
    }
    
    public static function getCsrfToken()
    {
        if (getParam('sys_security_form_token_enable') != 'on')
            return false;

        if (!($oKeys = BxDolKey::getInstance()))
            return false;

        return $oKeys->getNewKey (false, (int)getParam('sys_security_form_token_lifetime'), BxDolSession::getInstance()->getId());
    }
    
    public static function isCsrfTokenValid($s, $bDeleteToken = true)
    {
        if (getParam('sys_security_form_token_enable') != 'on')
            return true;

        if (!($oKeys = BxDolKey::getInstance()))
            return true;

        if ($oKeys->isKeyExists($s)) {
            $bRet = $oKeys->isKeyExists($s, BxDolSession::getInstance()->getId());
            if ($bDeleteToken)
                $oKeys->removeKey($s);
            return $bRet;
        }
        return false;
    }

    public static function onModuleUninstall ($sModuleName)
    {
        BxDolFormQuery::removeFormFields($sModuleName);
    }
    
    function _initCheckerNestedForms ()
    {
        $isValid = true;

        // process nested forms
        foreach ($this->aInputs as $sKey => $aInput) {

            if (!isset($aInput['ghost_template']))
                continue;

            if (!(is_array($aInput['ghost_template']) && isset($aInput['ghost_template']['inputs'])) && !(is_object($aInput['ghost_template']) && $aInput['ghost_template'] instanceof BxDolFormNestedGhost))
                continue;

            $sName = $aInput['name'];
            $aIds = $this->getSubmittedValue($sName, $this->aFormAttrs['method']);
            if (!$aIds)
                continue;

            $aNestedForms = array ();
            foreach ($aIds as $i => $iFileId) {

                // create separate form instance for each file
                $oFormNested = false;
                if (is_object($aInput['ghost_template'])) {
                    $oFormNested = clone($aInput['ghost_template']);
                } else {
                    $oFormNested = new BxDolFormNestedGhost($aInput['name'], $aInput['ghost_template'], $this->aParams['db']['submit_name'], $this->oTemplate);
                }
                if ($iFileId && 0 != $iFileId)
                    $aNestedForms[$iFileId] = $oFormNested;
                else
                    $aNestedForms[] = $oFormNested;

                // collect nested form values
                $aSpecificValues = array ();
                if (isset($this->aParams['db']['submit_name'])) {
                    $sSubmitName = $this->aParams['db']['submit_name'];
                    if(is_array($sSubmitName))
                        $sSubmitName = reset($sSubmitName);
        
                    $aSpecificValues = array ($sSubmitName => 1);
                }

                foreach ($oFormNested->aInputs as $r) {
                    $sName = str_replace('[]', '', $r['name']);
                    $aValue = $this->getSubmittedValue($sName, $this->aFormAttrs['method']);
                    $aSpecificValues[$sName] = isset($aValue[$i]) ? $aValue[$i] : '';
                }
                $oFormNested->initChecker(array(), $aSpecificValues);

                // if nested form in invalid - then the whole worm is failed
                if (!$oFormNested->isValid ())
                    $isValid = false;
            }

            if ($aNestedForms)
                $this->aInputs[$sKey]['ghost_template'] = $aNestedForms;

        }

        return $isValid;
    }

    /**
     * Check if form field is visible.
     * @param $aInput form field array
     * @return boolean
     */
    static public function isVisible ($aInput)
    {
        return isset($aInput['visible_for_levels']) ? BxDolAcl::getInstance()->isMemberLevelInSet($aInput['visible_for_levels']) : true;
    }

    protected function _genMethodName ($s)
    {
        return bx_gen_method_name($s);
    }

    /**
     * Add replace markers. Curently markers are replaced in action, form_attrs fields.
     * @param $a array of markers as key => value
     * @return true on success or false on error
     */
    public function addMarkers ($a)
    {
        if (empty($a) || !is_array($a))
            return false;
        $this->_aMarkers = array_merge ($this->_aMarkers, $a);
        return true;
    }

    /**
     * Replace provided markers in form array
     * @param $a form description array
     * @return array where markes are replaced with real values
     */
    protected function _replaceMarkers ($a)
    {
        return bx_replace_markers($a, $this->_aMarkers);
    }

    public function getFormErrors ()
    {
        $s = '';
        foreach ($this->aInputs as $k => $a) {
            if (isset($this->aInputs[$k]['error']) && $this->aInputs[$k]['error'])
                $s .= $k . ': ' . $this->aInputs[$k]['error'] . " \n";
        }
        return $s;
    }

    protected function _getPrivacyIcon($mixedPrivacy)
    {
        switch($mixedPrivacy) {
            case BX_DOL_PG_MEONLY:
                $sResult = 'lock';
                break;

            case BX_DOL_PG_ALL:
                $sResult = 'globe';
                break;

            default:
                $sResult = 'user';
                break;
        }

        return $sResult;
    }
    
    protected function _getPrivacyGroup($sPrivacyObject, $iInputId, $iAuthorId = false)
    {
        if(!$iAuthorId)
            $iAuthorId = bx_get_logged_profile_id();

        $mixedPrivacyGroup = BxDolFormQuery::getInputPrivacy($iInputId, $iAuthorId, BxDolPrivacy::getFieldName($sPrivacyObject));
        if(empty($mixedPrivacyGroup))
            $mixedPrivacyGroup = $this->_sPrivacyGroupDefault;

        return $mixedPrivacyGroup;
    }
}

class BxDolFormChecker
{
    protected $_oChecker;
    protected $_sFormMethod;
    protected $_aFormParams;
    protected $_bFormCsrfChecking;
    protected $_aSpecificValues;
    protected $_aFieldsCheckForSpam;
    protected $_aFieldsExcludeFromCheckForSpam;

    function __construct ($sHelper = '')
    {
        $this->_sFormMethod = BX_DOL_FORM_METHOD_GET;
        $this->_bFormCsrfChecking = true;

        $sCheckerName = !empty($sHelper) ? $sHelper : 'BxDolFormCheckerHelper';
        $this->_oChecker = new $sCheckerName();
    }

    function setFormMethod($sMethod, $aSpecificValues = array())
    {
        $this->_sFormMethod = $sMethod;
        $this->_aSpecificValues = $aSpecificValues;
    }

    function setFormParams($aParams)
    {
        $this->_aFormParams = $aParams;
    }

    function setFieldsCheckForSpam($aFieldsCheckForSpam, $aFieldsExcludeFromCheckForSpam)
    {
        $this->_aFieldsCheckForSpam = $aFieldsCheckForSpam;
        $this->_aFieldsExcludeFromCheckForSpam = $aFieldsExcludeFromCheckForSpam;
    }
    
    function enableFormCsrfChecking($bFormCsrfChecking)
    {
        $this->_bFormCsrfChecking = $bFormCsrfChecking;
    }

    // check function
    function check (&$aInputs, $aValues = array())
    {
        $oChecker = $this->_oChecker;
        $iErrors = 0;

        $sSubmitName = false;

        foreach ($aInputs as $k => $a) {
            if (isset($a['visible_for_levels']) && !BxDolForm::isVisible($a))
                continue;

            if (empty($a['name']) || 'submit' == $a['type'] || 'reset' == $a['type'] || 'button' == $a['type'] || 'value' == $a['type']) {
                if (isset($a['type']) && 'submit' == $a['type'])
                    $sSubmitName = $k;
                continue;
            }

            if ('input_set' == $a['type'])
                foreach ($a as $r)
                    if (isset($r['type']) && 'submit' == $r['type'])
                        $sSubmitName = $k;

            $a['name'] = str_replace('[]', '', $a['name']);

            $sMethodGetSubmittedValue = 'getSubmittedValue' . bx_gen_method_name($a['name']);
            if(method_exists($this, $sMethodGetSubmittedValue))
                $val = $this->$sMethodGetSubmittedValue($a['name'], $this->_sFormMethod, $this->_aSpecificValues);
            else
                $val = BxDolForm::getSubmittedValue($a['name'], $this->_sFormMethod, $this->_aSpecificValues);

            if (isset(BxDolForm::$TYPES_FILE[$a['type']]))
                $val = isset($_FILES[$a['name']]['name']) ? $_FILES[$a['name']]['name'] : '';

            // check for unique
            if(isset($aInputs[$k]['unique']) && $aInputs[$k]['unique'] && !empty($this->_aFormParams['db']['key']) && !empty($this->_aFormParams['db']['table'])) {
                $sKey = $this->_aFormParams['db']['key'];
                $sTable = $this->_aFormParams['db']['table'];
                $sError = _t('_sys_form_err_not_unique_value');

                if(!empty($aValues[$sKey])) {
                    $sValDb = BxDolFormQuery::fieldGetValue($sTable, $aInputs[$k]['name'], $sKey, $aValues[$sKey]);
                    if($val != $sValDb && !BxDolFormQuery::fieldCheckUnique($sTable, $aInputs[$k]['name'], $val)) {
                        ++$iErrors;
                        $aInputs[$k]['error'] = $sError;
                    }
                }
                else if(!BxDolFormQuery::fieldCheckUnique($sTable, $aInputs[$k]['name'], $val)) {
                    ++$iErrors;
                    $aInputs[$k]['error'] = $sError;
                }
            }

            // check for links in text fields
            $sCheckerFunc = isset($a['checker']['func']) ? strtolower($a['checker']['func']) : '';
            if (
                !isset(BxDolForm::$FUNC_SKIP_DOMAIN_CHECK[$sCheckerFunc]) && 
                (!isset($a['skip_domain_check']) || false == $a['skip_domain_check']) && 
                isset(BxDolForm::$TYPES_TEXT[$a['type']]) && 
                bx_is_url_in_content($val, true) && 
                !isAdmin())
            {
                $aCheck = checkActionModule(bx_get_logged_profile_id(), 'post links', 'system');
                if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED) {
                    ++$iErrors;
                    $aInputs[$k]['error'] = $aCheck[CHECK_ACTION_MESSAGE];
                }
                else {
                    checkActionModule(bx_get_logged_profile_id(), 'post links', 'system', true);
                }
            }

            // check for macros in text fields
            $sCheckerFunc = isset($a['checker']['func']) ? strtolower($a['checker']['func']) : '';
            if (
                !isset(BxDolForm::$FUNC_SKIP_MACROS_CHECK[$sCheckerFunc]) && 
                (!isset($a['skip_macros_check']) || false == $a['skip_macros_check']) && 
                isset(BxDolForm::$TYPES_TEXT[$a['type']]) && 
                bx_is_macros_in_content($val) && 
                !isAdmin())
            {
                $aCheck = checkActionModule(bx_get_logged_profile_id(), 'use macros', 'system');
                if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED) {
                    ++$iErrors;
                    $aInputs[$k]['error'] = $aCheck[CHECK_ACTION_MESSAGE];
                }
                else {
                    checkActionModule(bx_get_logged_profile_id(), 'use macros', 'system', true);
                }
            }

            if (!isset ($a['checker']))  {
                if (isset(BxDolForm::$TYPES_CHECKBOX[$a['type']]))
                    $aInputs[$k]['checked'] = (isset($aInputs[$k]['value']) && $aInputs[$k]['value'] == $val);
                elseif (!isset(BxDolForm::$TYPES_FILE[$a['type']]) && !isset(BxDolForm::$TYPES_SKIP[$a['type']]))
                    $aInputs[$k]['value'] = bx_process_input($val);
                continue;
            }

            $sCheckFunction = array($oChecker, 'check' . bx_gen_method_name($a['checker']['func']));

            if (is_callable($sCheckFunction))
                $bool = call_user_func_array ($sCheckFunction, !empty($a['checker']['params']) ? array_merge(array($val), array_values($a['checker']['params'])) : array ($val));
            else
                $bool = true;

            if (is_string($bool)) {
                ++$iErrors;
                $aInputs[$k]['error'] = $bool;
            } elseif (!$bool) {
                ++$iErrors;
				if (isset($a['checker']['error']))
                	$aInputs[$k]['error'] = $a['checker']['error'];
            }

            if (isset(BxDolForm::$TYPES_CHECKBOX[$a['type']]))
                $aInputs[$k]['checked'] = ($aInputs[$k]['value'] == $val);
            elseif (!isset(BxDolForm::$TYPES_FILE[$a['type']]) && !isset(BxDolForm::$TYPES_SKIP[$a['type']]))
                $aInputs[$k]['value'] = bx_process_input($val);
        }

        // check CSRF token if it's needed.
        if (getParam('sys_security_form_token_enable') == 'on' && $this->_bFormCsrfChecking === true && !bx_is_api()) {
            $mixedCsrfTokenUsr = BxDolForm::getSubmittedValue('csrf_token', $this->_sFormMethod, $this->_aSpecificValues);
            unset($aInputs['csrf_token']);

            if ($mixedCsrfTokenUsr === false || !BxDolForm::isCsrfTokenValid($mixedCsrfTokenUsr)) {
                $aInputs[$sSubmitName]['error'] = _t('_sys_txt_form_submission_error_csrf_expired');
                return false;
            }
        }

        // check for spam
        if (!$iErrors) {

            foreach ($aInputs as $k => $a) {

                if (!isset($a['name']))
                    continue;

                $a['name'] = str_replace('[]', '', $a['name']);

                if ($a['type'] != 'textarea' && $a['type'] != 'text' && !in_array($a['name'], $this->_aFieldsCheckForSpam) || in_array($a['name'], $this->_aFieldsExcludeFromCheckForSpam))
                    continue;
                
                $val = BxDolForm::getSubmittedValue($a['name'], $this->_sFormMethod, $this->_aSpecificValues);
                if (!$val)
                    continue;

                if (!$oChecker->checkIsSpam($val, $a['type'])){
					BxDolForm::setSubmittedValue($a['name'], $val, $this->_sFormMethod, $this->_aSpecificValues);
                    continue;
				}
                
                ++$iErrors;

                $sErr = _t('_sys_spam_detected');
                if (BxDolRequest::serviceExists('bx_contact', 'get_contact_page_url') && ($sUrl = BxDolService::call('bx_contact', 'get_contact_page_url')))
                    $sErr = _t('_sys_spam_detected_contact', $sUrl);
                $aInputs[$k]['error'] = $sErr;
            }
        }

        // add error message near submit button
        if ($iErrors && $sSubmitName && !($this->_aFormParams['checker_errors']['summary']['disabled'] ?? false))
            $aInputs[$sSubmitName]['error'] = _t($this->_aFormParams['checker_errors']['summary']['text'] ?? '_sys_txt_form_submission_error');
    
        return $iErrors ? false : true;
    }

    // get clean value from GET/POST
    function get ($sName, $sPass = 'Xss', $aParams = array())
    {
        if (!$sPass)
            $sPass = 'Xss';
        $this->_oChecker;
        $val = BxDolForm::getSubmittedValue($sName, $this->_sFormMethod, $this->_aSpecificValues);
        return call_user_func_array (array($this->_oChecker, 'pass'.ucfirst($sPass)), $aParams ? array_merge(array($val), $aParams) : array ($val));
    }

    // db functions
    function serializeDbValues (&$aInputs, &$aValsToAdd, &$aTrackTextFieldsChanges = null, $aUnset = null)
    {
        $aValsToUpdate = array();

        if (null !== $aTrackTextFieldsChanges && isset($aTrackTextFieldsChanges['data']))
            $aTrackTextFieldsChanges['changed_fields'] = array();

        // get values from form description array
        foreach ($aInputs as $k => $a) {
            if (!isset ($a['db']) || !BxDolForm::isVisible($a)) continue;
            $sKey = str_replace('[]', '', $a['name']);
            $valClean = $this->get ($sKey, $a['db']['pass'], !empty($a['db']['params']) ? $a['db']['params'] : array());
            $aValsToUpdate[$sKey] = $valClean;
            $aInputs[$k]['db']['value'] = $valClean;

            if (null !== $aTrackTextFieldsChanges && $this->isTrackableField($a) && isset($aTrackTextFieldsChanges['data'][$a['name']]) && $aTrackTextFieldsChanges['data'][$a['name']] != $valClean)
                $aTrackTextFieldsChanges['changed_fields'][] = $a['name'];
        }

        // get values which are provided manually
        foreach ($aValsToAdd as $k => $val) {
            $aValsToUpdate[$k] = $val;
        }

        // don't update id field for update statement
        if ($aUnset) {
            foreach ($aUnset as $sKey) {
                if (isset($aValsToUpdate[$sKey]))
                    unset($aValsToUpdate[$sKey]);
            }
        }

        // build SQL query part
        return BxDolDb::getInstance()->arrayToSQL($aValsToUpdate);
    }

    function dbInsert (&$aDb, &$aInputs, $aValsToAdd = array(), $isIgnore = false)
    {
        if (!$aDb['table'])
            return '';

        $sFields = $this->serializeDbValues ($aInputs, $aValsToAdd);
        if (!$sFields)
            return '';

        return "INSERT " . ($isIgnore ? 'IGNORE' : '') . " INTO `{$aDb['table']}` SET $sFields";
    }

    function dbUpdate ($val, &$aDb, &$aInputs, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        if (!$aDb['table'] || !$aDb['key'])
            return '';

        $oDb = BxDolDb::getInstance();

        if (null !== $aTrackTextFieldsChanges && !isset($aTrackTextFieldsChanges['data'])) {
            // get row values to compare old and new values
            $sQuery = $oDb->prepare("SELECT * FROM `{$aDb['table']}` WHERE `{$aDb['key']}` = ?", $val);
            $aTrackTextFieldsChanges['data'] = $oDb->getRow($sQuery);
        }

        $sFields = $this->serializeDbValues ($aInputs, $aValsToAdd, $aTrackTextFieldsChanges, array($aDb['key']));
        if (!$sFields)
            return '';

        return $oDb->prepare("UPDATE `{$aDb['table']}` SET $sFields WHERE `{$aDb['key']}` = ?", $val);
    }

    function dbDelete ($val, &$aDb, &$aInputs)
    {
        if (!$aDb['table'] || !$aDb['key'])
            return '';

        $oDb = BxDolDb::getInstance();

        return $oDb->prepare("DELETE FROM `{$aDb['table']}` WHERE `{$aDb['key']}` = ?", $val);
    }

    function fillWithValues (&$aInputs, &$aValues)
    {
        foreach ($aInputs as $k => $a) {
            if (!isset($aValues[$k]) || isset(BxDolForm::$TYPES_SKIP[$aInputs[$k]['type']])) 
                continue;

            if (isset(BxDolForm::$TYPES_CHECKBOX[$aInputs[$k]['type']])) {
                $aInputs[$k]['checked'] = isset($aInputs[$k]['value']) ? ($aInputs[$k]['value'] == $aValues[$k]) : false;
            } else {
                $sMethod = 'display' . (isset($a['db']['pass']) ? ucfirst($a['db']['pass']) : 'Undefined');
                if (method_exists($this->_oChecker, $sMethod))
                    $aInputs[$k]['value'] = call_user_func_array (array($this->_oChecker, $sMethod), !empty($a['db']['params']) ? array_merge(array($aValues[$k]), $a['db']['params']) : array ($aValues[$k]));
                else
                    $aInputs[$k]['value'] = $aValues[$k];
            }
        }
    }

    function isTrackableField($aInput)
    {
        return isset(BxDolForm::$TYPES_TEXT[$aInput['type']]);
    }
}

class BxDolFormCheckerHelper
{
    // check functions - check values for limits or patterns

    static public function checkLength ($s, $iLenMin, $iLenMax)
    {
        if (is_array($s)) {
            foreach ($s as $k => $v) {
                $iLen = get_mb_len ($v);
                if ($iLen < $iLenMin || $iLen > $iLenMax)
                    return false;
            }
            return true;
        }
        $iLen = get_mb_len ($s);
        return $iLen >= $iLenMin && $iLen <= $iLenMax ? true : false;
    }
    static public function checkDate ($s)
    {
        return self::checkPreg ($s, '#^\d+\-\d+\-\d+$#');
    }
    static public function checkDateRange ($s, $iMin, $iMax, $bRequired = false)
    {
        if (!$bRequired && (empty($s) || '0000-00-00' == $s || '0000-00-00Z' == $s))
            return true;   
        if (self::checkPreg ($s, '#^\d+\-\d+\-\d+$#')){
            $dDate = new DateTime($s);
            $dDateMax = new DateTime("-" . $iMin . " years");
            $dDateMin = new DateTime("-" . $iMax . " years");
            if ($dDate > $dDateMin && $dDate < $dDateMax){
                return true;
            }
        }
        return false;
    }
    static public function checkDateTime ($s)
    {
        
        if (!bx_is_api()){
            // remove unnecessary opera's input value;
            $s = str_replace('T', ' ', $s);
            $s = str_replace('Z', ':00', $s);
        }
        else{
            // remove unnecessary opera's input value;
            $s = str_replace('Z', '+00:00', $s);
        }

        return self::checkPreg ($s, '#^\d+\-\d+\-\d+[\sT]{1}\d+:\d+(:\d+)?(\+\d+:\d+)?$#');
    }
    static public function checkPreg ($s, $r)
    {
        if (is_array($s)) {
            foreach ($s as $k => $v)
                if (!preg_match($r, $v))
                    return false;
            return true;
        }
        return preg_match($r, $s) ? true : false;
    }
    static public function checkAvail ($s)
    {
        if (is_array($s)) {
            return !self::_isEmptyArray($s);
        }
        return $s ? true : false;
    }
    static public function checkJson ($mixed, $bAllowEmpty = false )
    {
        if (is_array($mixed)) {            
            foreach ($mixed as $v)
                if (!self::_isJsonValid($v, $bAllowEmpty))
                    return false;
        }
        return self::_isJsonValid($mixed, $bAllowEmpty);
    }
    static public function checkProfileName($s)
    {
        if (!self::checkAvail($s))
            return false;
        
        if (self::checkPreg ($s, '#^@.+$#')){
            return false;
        }
        return true;
    }

    static public function checkLocation($s, $sName, $sMethod = BX_DOL_FORM_METHOD_DEFAULT, $bAll = false)
    {
        $aIndexes = BxDolForm::$LOCATION_INDEXES;
        foreach($aIndexes as $sIndex) {
            $sValue = BxDolForm::getSubmittedValue($sName . '_' . $sIndex, $sMethod);
            $bValue = self::checkAvail($sValue);

            if(in_array($sIndex, BxDolForm::$LOCATION_INDEXES_MANDATORY) && !$bValue)
                return false;
            if($bAll && !$bValue)
                return false;
            if(!$bAll && $bValue)
                return true;
        }

        return $bAll ? true : false;
    }

    static public function checkEmailOrEmpty($s)
    {
        if (empty($s))
            return true;
        return self::checkEmail($s);
    }
    static public function checkEmail($s)
    {
        if (false === strpos($s, '@') || strpos($s, '@') != strrpos($s, '@')) // simple check
            return false;

        if (!preg_match("/^[\pL\pNd]/u", $s)) // must start with letter or number
            return false;

        if (!preg_match("/@[\pL\pNd\.\-]+$/u", $s)) // validate domain
            return false;

        if (!getParam('sys_account_allow_plus_in_email') && false !== strpos($s, '+'))
            return false;

        $s = str_replace(array('@', '.', '-', '+', '_'), '', $s); // allowed symbols
        if (preg_match("/[^\pL^\pNd]/u", $s)) // check for undesirable chars
            return false;

        return true;
        // return self::checkPreg ($s, "/(([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?/");
    }
    static public function checkCaptcha($s)
    {
        return !bx_is_api() && ($oCaptcha = BxDolCaptcha::getObjectInstance()) !== false ? $oCaptcha->check() : true;
    }
    static public function checkIsSpam(&$val, $sType = 'textarea')
    {
        $bSpam = false;
        /**
         * @hooks
         * @hookdef hook-system-check_spam 'system', 'check_spam' - hook to override (perform) spam checking 
         * - $unit_name - equals `system`
         * - $action - equals `check_spam`
         * - $object_id - not used
         * - $sender_id - currently logged in account id
         * - $extra_params - array of additional params with the following array keys:
         *      - `is_spam` - [boolean] by ref, if checked conetent is spam or not, can be overridden in hook processing
         *      - `content` - [string] by ref, content to check, can be overridden in hook processing
         *      - `where` - [string] where the content was received from, equals to 'form'
         *      - `type` - [string] subsection where the content was received from
         * @hook @ref hook-system-check_spam
         */
        bx_alert('system', 'check_spam', 0, getLoggedId(), [
            'is_spam' => &$bSpam, 
            'content' => &$val, 

            'is_spam_ref' => &$bSpam, 
            'content_ref' => &$val,

            'where' => 'form', 
            'type' => $sType
        ]);
        return $bSpam;
    }

    // pass functions, prepare values to insert to database
    static public function passInt ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = (int)trim($v);
            }
            return $a;
        }
        return (int)$s;
    }
    static public function passFloat ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = (float)$v;
            }
            return $a;
        }
        return (float)$s;
    }
    static public function passDate ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passDate ($v, BX_DATA_DATE);
            }
            return $a;
        }
        return self::_passDate ($s, BX_DATA_DATE);
    }
    static public function passDateTs ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passDate ($v, BX_DATA_DATE_TS);
            }
            return $a;
        }
        return self::_passDate ($s, BX_DATA_DATE_TS);
    }
    static public function passDateUtc ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passDate ($v, BX_DATA_DATE_TS_UTC);
            }
            return $a;
        }
        return self::_passDate ($s, BX_DATA_DATE_TS_UTC);
    }
    static public function passDateTime ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passDate ($v, BX_DATA_DATETIME);
            }
            return $a;
        }
        return self::_passDate ($s, BX_DATA_DATETIME);
    }
    static public function passDateTimeTs ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passDate ($v, BX_DATA_DATETIME_TS);
            }
            return $a;
        }
        return self::_passDate ($s, BX_DATA_DATETIME_TS);
    }
    static public function passDateTimeUtc ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passDate ($v, BX_DATA_DATETIME_TS_UTC);
            }
            return $a;
        }
        return self::_passDate ($s, BX_DATA_DATETIME_TS_UTC);
    }
    static public function _passDate ($s, $iFormat)
    {
        $iRet = bx_process_input ($s, $iFormat);
        if (false === $iRet)
            return 0;
        return $iRet;
    }    
    static public function passXss ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = bx_process_input ($v, BX_DATA_TEXT); // "strip tags" option was here in 7.0
            }
            return $a;
        }
        return bx_process_input ($s, BX_DATA_TEXT); // "strip tags" option was here in 7.0
    }

	static public function passXssMultiline ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = bx_process_input ($v, BX_DATA_TEXT_MULTILINE);
            }
            return $a;
        }
        return bx_process_input ($s, BX_DATA_TEXT_MULTILINE);
    }

    static public function passXssHtml ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = bx_process_input ($v, BX_DATA_HTML);
            }
            return $a;
        }
        return bx_process_input ($s, BX_DATA_HTML);
    }

    static public function passAll ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = bx_process_input ($v);
            }
            return $a;
        }
        return bx_process_input ($s);
    }

    static public function passPreg ($s, $r)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = self::_passPreg ($v, $r);
            }
            return $a;
        }
        return self::_passPreg($s, $r);
    }
    static public function _passPreg ($s, $r)
    {
        if (preg_match ($r, $s, $m)) {
            return $m[1];
        }
        return '';
    }
    static public function passBoolean ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v) {
                $a[$k] = $v == 'on' ? true : false;
            }
            return $a;
        }
        return $s == 'on' ? true : false;
    }

    static public function passSet ($s)
    {
        if (is_array($s)) {
            $i = 0;
            foreach ($s as $v)
                $i |= pow (2, $v - 1);
            return $i;
        }
        return (int)$s;
    }

    // display functions, prepare values to output to the screen

    static public function displayRaw ($s)
    {
        return $s;
    }

    static public function displayDate ($i)
    {
        return bx_process_output ($i, BX_DATA_DATE_UTC);
    }
    static public function displayDateTs ($i)
    {
        return bx_process_output ($i, BX_DATA_DATETIME_TS_UTC);
    }
    static public function displayDateUtc ($i)
    {
        return bx_process_output ($i, BX_DATA_DATETIME_TS_UTC);
    }    
    static public function displayDateTime ($i)
    {
        return bx_process_output ($i, BX_DATA_DATETIME_UTC);
    }
    static public function displayDateTimeTs ($i)
    {
        return bx_process_output ($i, BX_DATA_DATETIME_TS_UTC);
    }
    static public function displayDateTimeUtc ($i)
    {
        return bx_process_output ($i, BX_DATA_DATETIME_TS_UTC);
    }    
    static public function displaySet ($i)
    {
        $i = (int)$i;

        $bit = 1;
        $bitpos = 1;
        $a = array();
        while ($bit < BX_DOL_INT_MAX && $bit > 0) {
            if ($bit & $i)
                $a[] = $bitpos;
            $bit <<= 1;
            $bitpos++;
        }
        return $a;
    }

    // for internal usage only

    static public function _isEmptyArray ($a)
    {
        return bx_is_empty_array($a);
    }

    static public function _isFullArray ($a)
    {
        return bx_is_full_array($a);
    }

    static public function _isJsonValid($s, $bAllowEmpty = false)
    {
        if ($bAllowEmpty && empty($s))
            return true;

        json_decode($s);
        return (json_last_error() == JSON_ERROR_NONE);
    }
}

/** @} */
