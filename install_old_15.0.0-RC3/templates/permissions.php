<div class="bx-install-permissions">

    <h1 class="bx-def-font-h1"><?php echo _t('_adm_admtools_Permissions'); ?></h1>
    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_msg_permissions_lead'); ?></p>

   <?=$sPermissionsStyles; ?>
   <div class="bx-install-permissions-table-wrap">
   <?=$sPermissionsTable; ?>
   </div>

    <div class="bx-install-permissions-buttons bx-def-margin-top">

        <?php if (!$bPermissionsOk): ?>
            <div class="bx-def-margin-bottom">
                <?php echo _t('_sys_inst_msg_permissions_wrong'); ?>
            </div>
            <a href="javascript:void(0);" class="bx-btn bx-btn-primary bx-btn-disabled"><?php echo _t('_sys_inst_continue'); ?></a>
        <?php endif; if ($bPermissionsOk): ?>
            <a href="?action=site_config" class="bx-btn bx-btn-primary"><?php echo _t('_sys_inst_continue'); ?></a>
        <?php endif; ?>

        <a href="javascript:void(0);" onclick="location.reload(false);" class="bx-btn"><?php echo _t('_sys_inst_refresh'); ?></a>
    </div>

</div>
