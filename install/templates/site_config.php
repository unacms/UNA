<div class="bx-install-site-config">

    <h1 class="bx-def-font-h1"><?php echo _t('_sys_inst_site_config'); ?></h1>
    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_site_config_lead'); ?></p>

   <?=$sForm; ?>

</div>
<script>
(function () {
    var oForm = document.querySelector('.bx-install-site-config form');
    if (!oForm)
        return;

    // the form is shown a step at a time (the sections carry data-step), and sent once from the last step
    var aSteps = ['database', 'site', 'apps'];
    var oNext = oForm.querySelector('[data-nav="next"]');
    var oBack = oForm.querySelector('[data-nav="back"]');
    var oSubmit = oForm.querySelector('button[type="submit"]');
    var aNextTitles = {
        database: <?php echo json_encode(_t('_sys_inst_conf_next_site')); ?>,
        site: <?php echo json_encode(_t('_sys_inst_conf_next_apps')); ?>
    };
    var sCurrent = aSteps[0];
    var oMessages = {
        required: <?php echo json_encode(_t('_sys_inst_conf_err_required')); ?>,
        email: <?php echo json_encode(_t('_sys_inst_conf_err_email')); ?>,
        url: <?php echo json_encode(_t('_sys_inst_conf_err_url')); ?>
    };

    var sections = function (sStep) {
        return oForm.querySelectorAll('.bx-form-section-wrapper[data-step="' + sStep + '"]');
    };
    var show = function (sStep, bFocus) {
        sCurrent = sStep;
        var iStep = aSteps.indexOf(sStep);
        oForm.querySelectorAll('.bx-form-section-wrapper[data-step]').forEach(function (o) {
            o.hidden = o.getAttribute('data-step') !== sStep;
        });
        oBack.hidden = 0 === iStep;
        oNext.hidden = iStep === aSteps.length - 1;
        oSubmit.hidden = !oNext.hidden;
        if (!oNext.hidden)
            oNext.textContent = aNextTitles[sStep];

        // the header's stepper follows
        document.querySelectorAll('.bx-install-stepper li').forEach(function (oItem) {
            var i = aSteps.indexOf(oItem.getAttribute('data-step'));
            if (-1 === i)
                return;
            oItem.classList.toggle('is-current', i === iStep);
            oItem.classList.toggle('is-done', i < iStep);
            if (i === iStep)
                oItem.setAttribute('aria-current', 'step');
            else
                oItem.removeAttribute('aria-current');
        });

        if (bFocus) {
            var oFirst = sections(sStep)[0];
            var oInput = oFirst && oFirst.querySelector('input:not([type="hidden"]), select');
            window.scrollTo(0, 0);
            if (oInput)
                oInput.focus({preventScroll: true});
        }
    };

    // the browser's own checks of the step's fields, shown the way the server shows its messages
    var valid = function (sStep) {
        var oFirstBad = null;
        sections(sStep).forEach(function (oSection) {
            oSection.querySelectorAll('input, select').forEach(function (oInput) {
                if ('hidden' === oInput.type || 'checkbox' === oInput.type)
                    return;
                var oWrapper = oInput.closest('.bx-form-value');
                var oWarn = oWrapper.querySelector('.bx-form-warn');
                if (oInput.checkValidity()) {
                    if (oWarn && oWarn.hasAttribute('data-client'))
                        oWarn.remove();
                    if (!oWarn || oWarn.hasAttribute('data-client'))
                        oInput.removeAttribute('aria-invalid');
                    return;
                }
                if (!oWarn) {
                    oWarn = document.createElement('div');
                    oWarn.className = 'bx-form-warn';
                    oWarn.setAttribute('data-client', '1');
                    oWarn.id = oInput.id + '-error';
                    oInput.closest('.bx-form-input-wrapper').after(oWarn);
                    oInput.setAttribute('aria-describedby', (oWarn.id + ' ' + (oInput.getAttribute('aria-describedby') || '')).trim());
                }
                var v = oInput.validity;
                oWarn.textContent = v.valueMissing ? oMessages.required : (v.typeMismatch && oMessages[oInput.type] ? oMessages[oInput.type] : oInput.validationMessage);
                oInput.setAttribute('aria-invalid', 'true');
                if (!oFirstBad)
                    oFirstBad = oInput;
            });
        });
        if (oFirstBad)
            oFirstBad.focus();
        return !oFirstBad;
    };

    oNext.addEventListener('click', function () {
        if (valid(sCurrent))
            show(aSteps[aSteps.indexOf(sCurrent) + 1], true);
    });
    oBack.addEventListener('click', function () {
        show(aSteps[aSteps.indexOf(sCurrent) - 1], true);
    });
    // Enter in a field goes to the next step instead of sending the form early
    oForm.addEventListener('keydown', function (e) {
        if ('Enter' === e.key && !e.isComposing && 'INPUT' === e.target.tagName && 'checkbox' !== e.target.type && !oNext.hidden) {
            e.preventDefault();
            oNext.click();
        }
    });

    // after the server sent the form back, open the step with the first message
    var oError = oForm.querySelector('[aria-invalid="true"]');
    var oErrorSection = oError && oError.closest('.bx-form-section-wrapper[data-step]');
    show(oErrorSection ? oErrorSection.getAttribute('data-step') : (document.querySelector('.bx-install-error-message') ? 'database' : aSteps[0]), false);
    if (oError)
        oError.focus();

    // the module list: starter set, all, none, and how many are checked
    var oModules = oForm.querySelector('.bx-install-modules');
    if (oModules) {
        var aStarter = JSON.parse(oModules.getAttribute('data-starter') || '[]');
        var oCount = oModules.querySelector('.bx-install-modules-count');
        var aBoxes = function () { return oModules.querySelectorAll('input[type="checkbox"]:not(:disabled)'); };
        var count = function () {
            var n = 0;
            aBoxes().forEach(function (o) { if (o.checked) n++; });
            oCount.textContent = oCount.getAttribute('data-template').replace('{0}', n).replace('{1}', aBoxes().length);
            oSubmit.textContent = oSubmit.getAttribute('data-template').replace('{0}', n);
        };
        oModules.addEventListener('change', count);
        oModules.querySelectorAll('[data-select]').forEach(function (oButton) {
            oButton.addEventListener('click', function () {
                var sWhat = oButton.getAttribute('data-select');
                aBoxes().forEach(function (o) {
                    o.checked = 'all' === sWhat || ('starter' === sWhat && aStarter.indexOf(o.value) !== -1);
                });
                count();
            });
        });
        count();
    }

    // switching the language reloads the page: keep what was typed, passwords aside
    var sKey = 'bx-install-site-config';
    var save = function () {
        var o = {modules: []};
        oForm.querySelectorAll('input, select').forEach(function (oInput) {
            if (!oInput.name || 'password' === oInput.type || 'hidden' === oInput.type)
                return;
            if ('checkbox' === oInput.type) {
                if (oInput.checked)
                    o.modules.push(oInput.value);
            }
            else if ('language' !== oInput.name) {
                o[oInput.name] = oInput.value;
            }
        });
        try { sessionStorage.setItem(sKey, JSON.stringify(o)); } catch (e) {}
    };
    // the switcher is in the footer, after this script: listen on the document
    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('.bx-install-lang-item'))
            save();
    });

    var sSaved = null;
    try { sSaved = sessionStorage.getItem(sKey); sessionStorage.removeItem(sKey); } catch (e) {}
    if (sSaved && !document.querySelector('.bx-install-error-message')) {
        var o = JSON.parse(sSaved);
        oForm.querySelectorAll('input, select').forEach(function (oInput) {
            if ('checkbox' === oInput.type && !oInput.disabled)
                oInput.checked = o.modules.indexOf(oInput.value) !== -1;
            else if (oInput.name && 'password' !== oInput.type && 'hidden' !== oInput.type && Object.prototype.hasOwnProperty.call(o, oInput.name))
                oInput.value = o[oInput.name];
        });
        if (oModules)
            oModules.dispatchEvent(new Event('change'));
    }

    // a second click while the database is created would start over
    oForm.addEventListener('submit', function () {
        var oButton = oForm.querySelector('button[type="submit"]');
        setTimeout(function () { oButton.disabled = true; oButton.setAttribute('aria-busy', 'true'); }, 0);
    });
})();
</script>
