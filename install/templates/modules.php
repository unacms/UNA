<div class="bx-install-modules-progress">

    <h1 class="bx-def-font-h1"><?php echo _t('_sys_inst_modules_title'); ?></h1>
    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_modules_lead'); ?></p>

    <div class="bx-install-progress" role="progressbar" aria-labelledby="bx-install-progress-label" aria-valuemin="0" aria-valuemax="<?php echo count($aModules); ?>" aria-valuenow="0">
        <div class="bx-install-progress-bar"></div>
    </div>
    <p id="bx-install-progress-label" class="bx-install-progress-label" aria-live="polite"></p>

    <div class="bx-install-error-message bx-def-padding bx-def-margin-bottom" role="alert" hidden></div>

    <ul class="bx-install-modules-list">
    <?php foreach ($aModules as $aModule): ?>
        <li data-state="<?php echo bx_html_attribute($aModule['state']); ?>"><span class="bx-install-module-state" aria-hidden="true"></span><span><?php echo htmlspecialchars($aModule['title'], ENT_QUOTES, 'UTF-8'); ?></span><span class="bx-install-sr-only bx-install-module-state-text"></span></li>
    <?php endforeach; ?>
    </ul>

    <div class="bx-install-actions bx-install-actions-end" hidden>
        <button type="button" class="bx-btn" data-action="skip"><?php echo _t('_sys_inst_modules_skip'); ?></button>
        <button type="button" class="bx-btn bx-btn-primary" data-action="retry"><?php echo _t('_sys_inst_modules_retry'); ?></button>
    </div>

    <form method="post" action="?action=modules_complete" class="bx-install-modules-complete">
        <noscript><button type="submit" class="bx-btn bx-btn-primary"><?php echo _t('_sys_inst_continue'); ?></button></noscript>
    </form>

</div>
<script>
(function () {
    var oRoot = document.querySelector('.bx-install-modules-progress');
    var aItems = oRoot.querySelectorAll('.bx-install-modules-list li');
    var oBar = oRoot.querySelector('.bx-install-progress-bar');
    var oProgress = oRoot.querySelector('.bx-install-progress');
    var oLabel = oRoot.querySelector('.bx-install-progress-label');
    var oError = oRoot.querySelector('.bx-install-error-message');
    var oActions = oRoot.querySelector('.bx-install-actions');
    var oStates = {
        done: <?php echo json_encode(_t('_sys_inst_modules_state_done')); ?>,
        skipped: <?php echo json_encode(_t('_sys_inst_modules_state_skipped')); ?>,
        failed: <?php echo json_encode(_t('_sys_inst_modules_state_failed')); ?>,
        active: <?php echo json_encode(_t('_sys_inst_modules_state_active')); ?>
    };
    var sCount = <?php echo json_encode(_t('_sys_inst_modules_count')); ?>;
    var sFinishing = <?php echo json_encode(_t('_sys_inst_modules_finishing')); ?>;
    var sNetwork = <?php echo json_encode(_t('_sys_inst_modules_network_error')); ?>;

    function setState (oItem, sState) {
        oItem.setAttribute('data-state', sState);
        oItem.querySelector('.bx-install-module-state-text').textContent = oStates[sState] ? ' (' + oStates[sState] + ')' : '';
    }

    function current () {
        for (var i = 0; i < aItems.length; i++)
            if (['done', 'skipped'].indexOf(aItems[i].getAttribute('data-state')) === -1)
                return i;
        return aItems.length;
    }

    // time since this page started the install, beside the count
    var iStart = Date.now();
    function elapsed () {
        var iSec = Math.round((Date.now() - iStart) / 1000);
        return Math.floor(iSec / 60) + ':' + ('0' + iSec % 60).slice(-2);
    }

    function progress () {
        var i = current();
        oBar.style.width = (aItems.length ? Math.round(100 * i / aItems.length) : 100) + '%';
        oProgress.setAttribute('aria-valuenow', i);
        oLabel.textContent = sCount.replace('{0}', i).replace('{1}', aItems.length) + ' · ' + elapsed();
    }
    var iTimer = setInterval(progress, 1000);

    // Chrome freezes or throttles a tab in the background, which held each step back up to a minute;
    // a page that holds a Web Lock is left running, so the install keeps its pace in a background tab
    var fReleaseLock = null;
    if (navigator.locks && navigator.locks.request)
        navigator.locks.request('bx-install-modules', function () {
            return new Promise(function (fResolve) { fReleaseLock = fResolve; });
        }).catch(function () {});

    function complete () {
        clearInterval(iTimer);
        if (fReleaseLock)
            fReleaseLock();
        oLabel.textContent = sFinishing;
        oRoot.querySelector('.bx-install-modules-complete').submit();
    }

    function fail (sMessage) {
        var i = current();
        if (i < aItems.length)
            setState(aItems[i], 'failed');
        oError.textContent = sMessage;
        oError.hidden = false;
        oActions.hidden = false;
        oActions.querySelector('[data-action="retry"]').focus();
    }

    function step (bSkip) {
        var i = current();
        if (i >= aItems.length)
            return complete();

        oError.hidden = true;
        oActions.hidden = true;
        setState(aItems[i], 'active');
        progress();

        var oData = new FormData();
        if (bSkip)
            oData.append('skip', '1');

        fetch('?action=modules_step', {method: 'POST', body: oData, credentials: 'same-origin'})
            .then(function (r) { return r.json(); })
            .then(function (o) {
                if (o.code) {
                    fail((o.module ? o.module + ': ' : '') + o.message);
                    return;
                }
                setState(aItems[i], bSkip ? 'skipped' : 'done');
                progress();
                if (o.complete)
                    complete();
                else
                    step(false);
            })
            .catch(function () { fail(sNetwork); });
    }

    oActions.querySelector('[data-action="retry"]').addEventListener('click', function () { step(false); });
    oActions.querySelector('[data-action="skip"]').addEventListener('click', function () { step(true); });

    aItems.forEach(function (o) { setState(o, o.getAttribute('data-state')); });
    progress();
    step(false);
})();
</script>
