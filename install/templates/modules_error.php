<div class="bx-install-modules-progress">

    <h1 class="bx-def-font-h1"><?php echo _t(isset($sTitleKey) ? $sTitleKey : '_sys_inst_modules_failed'); ?></h1>

    <div class="bx-install-error-message bx-def-padding bx-def-margin-bottom" role="alert"><?php echo $sErrorMessage; ?></div>

    <?php if (!isset($bBack) || $bBack): ?>
    <div class="bx-install-actions bx-install-actions-end">
        <a href="?action=modules" class="bx-btn bx-btn-primary"><?php echo _t('_sys_inst_modules_back_to_progress'); ?></a>
    </div>
    <?php endif; ?>

</div>
