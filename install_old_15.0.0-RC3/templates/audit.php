<div class="bx-install-audit">

    <h1 class="bx-def-font-h1"><?php echo _t('_sys_inst_server_audit'); ?></h1>
    <p class="bx-install-step-lead"><?php echo _t('_sys_inst_audit_lead'); ?></p>

    <div class="bx-install-audit-summary">
        <span class="bx-install-chip bx-install-chip-ok"><?php echo _t('_sys_inst_audit_passed', (int)$iAuditPassed); ?></span>
        <span class="bx-install-chip bx-install-chip-warn"><?php echo _t('_sys_inst_audit_warnings', (int)$iAuditWarnings); ?></span>
        <span class="bx-install-chip bx-install-chip-bad"><?php echo _t('_sys_inst_audit_failed', (int)$iAuditFailed); ?></span>
    </div>

    <div class="bx-install-audit-body">
   <?=$sAuditOutput; ?>
    </div>

</div>
