/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/** Ids of form error messages that fields name as their description (processWebForms). */
var glBxFormWarnId = 0;

/**
 * A plain textarea grows with its text between its CSS min-height and max-height, then scrolls. Browsers with
 * field-sizing: content (see tailwind.css) do it themselves; elsewhere it is done here, until the member drags the
 * resize handle, whose height then stays. With a length limit (data-bx-counter) the counter under it follows the text,
 * turns red over the limit, and says so to screen readers when the limit is reached.
 */
function bx_form_textarea_init(e) {
    var eTextarea = $(e);
    if (eTextarea.hasClass('bx-form-textarea-processed'))
        return;
    eTextarea.addClass('bx-form-textarea-processed');

    if (!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content'))) {
        var sHeight = '';
        var fGrow = function () {
            if (e.style.height && e.style.height != sHeight)
                return; // resized by hand

            e.style.height = 'auto';
            sHeight = (e.scrollHeight + e.offsetHeight - e.clientHeight) + 'px';
            e.style.height = sHeight;
        };
        eTextarea.on('input.bx-textarea', fGrow);
        if (eTextarea.is(':visible'))
            fGrow();
    }

    var eCounter = eTextarea.attr('data-bx-counter') ? $('#' + eTextarea.attr('data-bx-counter')) : $();
    if (eCounter.length) {
        var iMax = parseInt(eCounter.attr('data-bx-max'));
        var bReached = false;
        var fCount = function () {
            var iLen = Array.from(e.value).length;

            eCounter.find('.bx-form-input-counter-value').text(iLen + ' / ' + iMax);
            eCounter.toggleClass('text-red-700 dark:text-red-400', iLen > iMax).toggleClass('text-gray-600 dark:text-gray-400', iLen <= iMax);

            if (iLen >= iMax && !bReached)
                eCounter.find('[role=status]').text(eCounter.attr('data-bx-limit-text'));
            else if (iLen < iMax && bReached)
                eCounter.find('[role=status]').text('');
            bReached = iLen >= iMax;
        };
        eTextarea.on('input.bx-textarea', fCount);
        fCount();
    }
}

(function($) {

    $.fn.addWebForms = function(onLoad) {
        if ('undefined' === typeof(glJsLoadOnaddWebForms) || !glJsLoadOnaddWebForms.length) {
            $.fn.processWebForms.apply(this);

            if(typeof onLoad == 'function')
                onLoad();
        }
        else {
            var $this = this;
            bx_get_scripts(glJsLoadOnaddWebForms, function () {
                $.fn.processWebForms.apply($this);

                if(typeof onLoad == 'function')
                    onLoad();
            });
        }

        return this;
    }
    
    $.fn.processWebForms = function() {
        // Fields with an error: marked invalid, with the message as their description, and the first one gets the
        // focus (WCAG 3.3.1), after the page scrolls to it.
        var aErrors = $('.bx-form-warn:visible', this);
        var eFirstField = null;
        aErrors.each(function() {
            var eWarn = $(this);
            var eField = eWarn.closest('.bx-form-element-wrapper').find('input, select, textarea').not('[type="hidden"], [type="submit"], [type="button"]').first();
            if(!eField.length)
                return;

            var sId = eWarn.attr('id');
            if(!sId) {
                sId = 'bx-form-warn-' + (++glBxFormWarnId);
                eWarn.attr('id', sId);
            }

            var sDescribedBy = eField.attr('aria-describedby') || '';
            if((' ' + sDescribedBy + ' ').indexOf(' ' + sId + ' ') == -1)
                eField.attr('aria-describedby', $.trim(sDescribedBy + ' ' + sId));
            eField.attr('aria-invalid', 'true');

            if(!eFirstField)
                eFirstField = eField;
        });

        if(aErrors.length > 0)
            $([document.documentElement, document.body]).animate({
                scrollTop: aErrors.first().closest('.bx-form-element-wrapper').offset().top - 50
            }, 200, function() {
                if(eFirstField && eFirstField.is(':visible'))
                    eFirstField.get(0).focus({preventScroll: true});
            });

        // plain textareas
        $('textarea.bx-form-input-textarea:not(.bx-form-input-html, .bx-form-input-code)', this).each(function() {
            bx_form_textarea_init(this);
        });

        // switchers
        $('.bx-switcher-cont', this).each(function() {
            var eSwitcher = $(this);
            var eInput = $(this).find('input');

            if (eSwitcher.hasClass('bx-form-switcher-processed'))
                return;
            eSwitcher.addClass('bx-form-switcher-processed');

            // the visible control is a button with role=switch: its aria-checked follows the on/off class
            var fSyncState = function() {
                eSwitcher.find('[role="switch"]').attr('aria-checked', eSwitcher.hasClass('on') ? 'true' : 'false');
            };
            fSyncState();

            eSwitcher.on('click', function() {
                var $this = $(this);
                if ($this.hasClass('on')) {
                    $this.find('input').prop('checked', false).trigger('change');
                    $this.removeClass('on').addClass('off');
                } else {
                    $this.removeClass('off').addClass('on');
                    $this.find('input').prop('checked', true).trigger('change');
                }
                fSyncState();
                return false;
            });

            eInput.on('enable', function () {
                if (!$(this).prop('checked'))
                    $(this).prop('checked', true).trigger('change');
                if (!eSwitcher.hasClass('on'))
                    eSwitcher.removeClass('off').addClass('on');
                fSyncState();
            });

            eInput.on('disable', function () {
                if ($(this).prop('checked'))
                    $(this).prop('checked', false).trigger('change');
                if (!eSwitcher.hasClass('off'))
                    eSwitcher.removeClass('on').addClass('off');
                fSyncState();
            });
        });

        // collapsable headers 
        $('.bx-form-collapsable', this).each(function() {

            var eFormSection = $(this);

            if (eFormSection.hasClass('bx-form-js-processed'))
                return;

            eFormSection.addClass('bx-form-js-processed');

            var eToggle = $('.bx-form-section-title:first', eFormSection).find('a, button').first(); // the caption control, a button now (anchors in older templates)
            var fSyncExpanded = function() {
                eToggle.attr('aria-expanded', eFormSection.hasClass('bx-form-collapsed') ? 'false' : 'true');
            };
            fSyncExpanded();

            var fCallback = function() {

                if (eFormSection.hasClass('bx-form-collapsed')) {
                    // show
                    eFormSection.removeClass('bx-form-collapsed');

                    if (eFormSection.hasClass('bx-form-section-hidden')) {
                        $('.bx-form-section-content:first', eFormSection).hide();
                        eFormSection.removeClass('bx-form-section-hidden');
                    }

                    $('.bx-form-section-content:first', eFormSection).slideDown(function () {
                        eFormSection.removeClass('bx-form-section-hidden');

                        $(this).addWebForms();
                        $(this).find('.CodeMirror').each(function() {
                            this.CodeMirror.refresh();
                        });

                        //--- fire custom event 'bx_show'
                        eFormSection.trigger('bx_show');
                    }); 

                } else {
                    // hide
                    eFormSection.addClass('bx-form-collapsed');

                    $('.bx-form-section-content:first', eFormSection).slideUp(function () {                    
                        eFormSection.addClass('bx-form-collapsed bx-form-section-hidden');

                        //--- fire custom event 'bx_hide'
                        eFormSection.trigger('bx_hide');
                    }); 
                }

            };

            $('.bx-form-section-title:first', eFormSection).click(function() {
                // an accordion: a subtle open or close (interface sounds, see bx_sound)
                if(typeof(bx_sound) == 'function')
                    bx_sound(eFormSection.hasClass('bx-form-collapsed') ? 'open' : 'close', {emphasis: 'subtle'});

                fCallback();
                fSyncExpanded();
            });
        });

        $("select", this).each(function () {
            // Labels selector
            var oInput = $(this);
            if (oInput.hasClass('bx-form-select-labels')) {
                $(".bx-form-select-labels").select2ToTree();
            }
             
            if(oInput.hasClass('bx-form-input-rgb-list')) {
				oInput.bind('change', function() {
                    oInput.removeClassWild('bg-*').addClass('bg-' + $(this).val());
                });
                oInput.removeClassWild('bg-*').addClass('bg-' + $(this).val());
			}
        });

        $(".bx-form-input-wrapper-password", this).each(function() {
            var sClassInited = "bx-inited";
            if($(this).hasClass(sClassInited))
                return;

            var sClassFocus = "bx-form-input-focus";
            $(this).find("input").bind("focus", function() {
                $(this).parents(".bx-form-input-wrapper-password:first").addClass(sClassFocus);
            }).bind("blur", function() {
                $(this).parents(".bx-form-input-wrapper-password:first").removeClass(sClassFocus);
            });

            $(this).find(".password-show, .password-hide").on("click", function () {
                var oLink = $(this);
                var oFld = oLink.parents(".bx-form-input-wrapper-password:first").find("input");
                if (oLink.hasClass('password-show')) {
                    oLink.attr('title', _t('_sys_form_input_password_hide')).attr('aria-label', _t('_sys_form_input_password_hide'));
                    oFld.attr("type", "text");
                }
                else {
                    oLink.attr('title', _t('_sys_form_input_password_show')).attr('aria-label', _t('_sys_form_input_password_show'));
                    oFld.attr("type", "password");
                }
                oLink.toggleClass('password-show password-hide');
                // Markup with one icon swaps it; with both (form_field_password.html) the button's class shows the right one.
                if(!oLink.find('.bx-pw-eye').length)
                    oLink.find('i').toggleClass('eye eye-closed');
            });

            $(this).addClass(sClassInited);
        });

        $("input", this).each(function() {
            var oInput = $(this);

            var onCreateRange = function (event, ui) {
                var eInput = $(this).parent().find('input');
                var iSliderWidth = eInput.innerWidth() - 160;
                $(this).css('width',  iSliderWidth + 'px').css('top', (eInput.innerHeight() - $(this).outerHeight())/2 + 1 + 'px');
                eInput.css('padding-right', (iSliderWidth + parseFloat($(this).css('margin-right')) + 10) + 'px');                        
            };

            // DoubleRange
            if (this.getAttribute("type") == 'doublerange') {

                var cur = $(this);
                if(!cur.is(':visible') || cur.hasClass('bx-form-doublerange-processed'))
                    return;

                cur.addClass('bx-form-doublerange-processed');

                var $slider = $('<div class="bx-def-margin-right"></div>').insertAfter(cur);

                var iMin = cur.attr("min") ? parseFloat(cur.attr("min"), 10) : 0;
                var iMax = cur.attr("max") ? parseFloat(cur.attr("max"), 10) : 100;
                var sRangeDv = cur.attr("range-divider") ? cur.attr("range-divider") : '-';

                var funcGetValues = function (e) {

                    var values = e.val().split(sRangeDv, 2); // get values

                    if (typeof(values[0]) != 'undefined' && values[0].length)
                        values[0] = parseFloat(values[0]);
                    else
                        values[0] = iMin;

                    if (typeof(values[1]) != 'undefined' && values[1].length)
                        values[1] = parseFloat(values[1]);
                    else
                        values[1] = iMax;

                    return values;
                };

                var onChange = function(e, ui) {
                    values = ui.values;
                    cur.val( values[0] + sRangeDv + values[1] );
                };

                $slider.slider({
                    range: true,
                    min: iMin,
                    max: iMax,
                    step: parseFloat(cur.attr("step")) ? parseFloat(cur.attr("step")) : 1,
                    values: funcGetValues(cur),
                    change: onChange,
                    slide: onChange,
                    create: onCreateRange
                });

                cur.bind('change', function () {
                    var values = funcGetValues($(this));
                    $slider.slider("option", "values", values);
                });

            }

            // Single range or slider
            else if (this.getAttribute("type") == 'slider') {

                var cur = $(this);
                if(!cur.is(':visible') || cur.hasClass('bx-form-range-processed'))
                    return;

                cur.addClass('bx-form-range-processed');

                var $slider = $('<div class="bx-def-margin-right"></div>').insertAfter(cur)

                $slider.css('width', ($slider.parent().innerWidth() - cur.outerWidth() - 50) + 'px');

                var iMin = cur.attr("min") ? parseFloat(cur.attr("min"), 10) : 0;
                var iMax = cur.attr("max") ? parseFloat(cur.attr("max"), 10) : 100;

                var onChange = function(e, ui) {
                    cur.val( ui.value );
                };

                $slider.slider({
                    min: iMin,
                    max: iMax,
                    step: parseFloat(cur.attr("step")) ? parseFloat(cur.attr("step")) : 1,
                    value: cur.val(),
                    change: onChange,
                    slide: onChange,
                    create: onCreateRange
                });

                cur.bind('change', function () {
                    $slider.slider("option", "value", $(this).val());
                });

            }

			// Date/Time pickers
			if (this.getAttribute("type") == "date" || this.getAttribute("type") == "date_calendar" || this.getAttribute("type") == "datetime" || this.getAttribute("type") == "date_time" || this.getAttribute("type") == "datepicker" || this.getAttribute("type") == "dateselect") {
                if ($(this).hasClass('bx-form-datepicker-processed'))
                    return;
                $(this).addClass('bx-form-datepicker-processed');

                var sYearMin = '1900';
                var sYearMax = '2100';
                var m;

                if ($(this).attr('min') && (m = $(this).attr('min').match(/^(\d{4})/)))
                    sYearMin = m[1];
                if ($(this).attr('max') && (m = $(this).attr('max').match(/^(\d{4})/)))
                    sYearMax = m[1];

                var onBeforeShow = function(oInput, oInstance) {
                	$(oInstance.dpDiv).addClass('bx-form-datepicker-modal');
                };

                var parseDateUtc = function (sDate, sFormat) {
                    let oDate = moment.utc(sDate);
                    return new Date(
                        oDate.year(),
                        oDate.month(),
                        oDate.date(),
                        oDate.hour(),
                        oDate.minute(),
                        oDate.second()
                    );
                }
                var formatDateUtc = function (oDate, sFormat) {
                    return moment.utc([
                        oDate.getFullYear(),
                        oDate.getMonth(),
                        oDate.getDate(),
                        oDate.getHours(),
                        oDate.getMinutes(),
                        oDate.getSeconds()
                    ]).format(sFormat);
                }

                var bDatePicker = false;
                if (this.getAttribute("type") == "date" || this.getAttribute("type") == "date_calendar" || this.getAttribute("type") == "datepicker") { // Date picker

                    flatpickr(this, {
                        locale: sLang,
                        disableMobile: true,
                        altInput: true,
                        altFormat: this.getAttribute("data-frmt-date") ? this.getAttribute("data-frmt-date") : "F j, Y",
                        dateFormat: "YYYY-MM-DD",
                        minDate: sYearMin,
                        maxDate: sYearMax,
                        onOpen: onBeforeShow,
                        parseDate: parseDateUtc,
                        formatDate: formatDateUtc,
                    });

                    bDatePicker = true;

                } else if(this.getAttribute("type") == "datetime" || this.getAttribute("type") == "date_time") { // DateTime picker

                    var oPickerOptions = {
                        locale: sLang,
                        disableMobile: true,
                        enableTime: true,
                        altInput: true,
                        altFormat: this.getAttribute("data-frmt-date") ? this.getAttribute("data-frmt-datetime") : "D MMM YYYY h:mma",
                        dateFormat: "YYYY-MM-DD\\THH:mm:ssZ",
                        time_24hr: null === this.getAttribute("data-frmt-24h") || 'on' == this.getAttribute("data-frmt-24h") ? true : false,
                        minDate: sYearMin,
                        maxDate: sYearMax,
                        onOpen: onBeforeShow,
                        parseDate: function (sDate, sFormat) {
                            let oDate = moment.utc(sDate);
                            return oDate.toDate();
                        },
                        formatDate: function (oDate, sFormat, locale) {
                            let o;
                            if (sFormat.endsWith('Z'))
                                o = moment.utc(oDate);
                            else
                                o = moment(oDate);
                            return o.format(sFormat);
                        }
                    };

                    if (1 == $(this).attr('data-utc')) {
                        oPickerOptions.parseDate = parseDateUtc;
                        oPickerOptions.formatDate = formatDateUtc;
                    }
                    flatpickr(this, oPickerOptions);

                    bDatePicker = true;

                } else if(this.getAttribute("type") == "dateselect") { // DateTime selector
                    moment.locale(sLang);
                    $(this).combodate({
                        minYear: sYearMin,
                        maxYear: sYearMax,
                        format: 'YYYY-MM-DD',
                        template: 'DD MMMM YYYY',
                        firstItem: 'none',
                        'smartDays': true,
                        customClass: 'bx-def-font-inputs bx-form-input-select block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:text-gray-900 dark:focus:text-gray-100 focus:ring-blue-500 focus:border-opacity-70 focus:ring-opacity-20 focus:border-blue-500 text-sm text-gray-700 dark:text-gray-300 appearance-none',
                    });
                }
                
                if(bDatePicker) {
                    // flatpickr's altInput is the field the user actually sees and focuses, but it is a bare clone:
                    // it copies class/placeholder/disabled/required/tabindex and no accessible name, so carry the
                    // labelling of the original (now hidden) input over to it.
                    var oAltInput = this._flatpickr ? this._flatpickr.altInput : null;
                    if (oAltInput) {
                        var aLabelAttrs = ['aria-label', 'aria-labelledby', 'aria-describedby', 'title'];
                        for (var iLabelAttr = 0; iLabelAttr < aLabelAttrs.length; iLabelAttr++) {
                            var sLabelValue = this.getAttribute(aLabelAttrs[iLabelAttr]);
                            if (sLabelValue)
                                oAltInput.setAttribute(aLabelAttrs[iLabelAttr], sLabelValue);
                        }
                    }

                    if (typeof window.glOnColorSchemeChange === 'undefined')
                        window.glOnColorSchemeChange = [];    

                    window.glOnColorSchemeChange.push(function(iCode) {
                        var sNameL = 'flatpickr.min.css';
                        var sNameD = 'themes/dark.css';
                        var oStylesheet = null;
                        switch(iCode) {
                            case 1: //--- light
                                oStylesheet = document.head.querySelector("link[href*='" + sNameD + "']");
                                if(oStylesheet)
                                    oStylesheet.href = oStylesheet.href.replace(sNameD, sNameL);
                                else
                                    bx_get_style(sUrlRoot + 'plugins_public/flatpickr/dist/' + sNameL);
                                break;

                            case 2: //--- dark
                                oStylesheet = document.head.querySelector("link[href*='" + sNameL + "']");
                                if(oStylesheet)
                                    oStylesheet.href = oStylesheet.href.replace(sNameL, sNameD);
                                else
                                    bx_get_style(sUrlRoot + 'plugins_public/flatpickr/dist/' + sNameD);
                                break;
                        }
                    });
                }

                if (window.navigator.appVersion.search(/Chrome\/(.*?) /) == -1 || parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10) < 24)
                    if( this.getAttribute("allow_input") == null)
                        $(this).attr('readonly', 'readonly');
			}

			// RGB/RGBA pickers
			if(this.getAttribute('type') == 'text' && (oInput.hasClass('bx-form-input-rgb') || oInput.hasClass('bx-form-input-rgba')) && !oInput.hasClass('minicolors-input')) {
				oInput.attr('autocomplete', 'off');
				oInput.minicolors({
                    control: oInput.attr('data-control') || 'hue',
                    format: oInput.attr('data-format') || 'rgb',
                    letterCase: oInput.attr('data-letterCase') || 'lowercase',
                    opacity: oInput.hasClass('bx-form-input-rgba'),
                    position: oInput.attr('data-position') || 'bottom left',
                    theme: 'bootstrap'
                });
				
			}
        });
        $('form', this).addClass('bx-form-processed');
        return this;
    };

})(jQuery);

$(document).ready(function() {
    $(this).addWebForms();
});

(function($) {
    $.fn.removeClassWild = function(mask) {
        return this.removeClass(function(index, cls) {
            var re = mask.replace(/\*/g, '\\S+');
            return (cls.match(new RegExp('\\b' + re + '', 'g')) || []).join(' ');
        });
    };
})(jQuery);
/** @} */
