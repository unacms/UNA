<?php

/**
 * Shared feedback templates and styles: toasts are announced and sit above popups, a success reply is a toast,
 * form dialogs are titled popups and labels are not set in capitals. Read from the files themselves.
 */
class FeedbackTemplatesTest extends \PHPUnit\Framework\TestCase
{
    private static function read(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../' . $sPath);
        if ($s === false)
            self::fail("$sPath is not readable.");

        return $s;
    }

    public function testToastsAreAnnouncedAboveDialogs(): void
    {
        $s = self::read('template/popup_trans_toast_holder.html');
        $this->assertStringContainsString('role="status"', $s);
        $this->assertStringContainsString('aria-live="polite"', $s);
        $this->assertStringContainsString('bx-def-z-index-modal', $s, 'A toast is not hidden behind Studio or a popup.');
    }

    public function testToastSurvivesAReloadOrRedirect(): void
    {
        $s = self::read('inc/js/functions.js');
        $this->assertStringContainsString('bx_toast_next_page(oData.toast)', $s);
        $this->assertStringContainsString("sessionStorage.getItem('bx-toast-next-page')", $s);
    }

    public function testEmptyStateButtonCanBeAButton(): void
    {
        $s = self::read('template/messageBox.html');
        $this->assertStringContainsString('<bx_if:button><button type="button"', $s);
    }

    public function testFormDialogsAreTitledPopups(): void
    {
        foreach ([
            'template/scripts/BxBaseReport.php' => "popupBox(\$sPopupId, _t('_report_do_report')",
            'template/scripts/BxBaseFavorite.php' => "_t('_favorite_popup_title_do')",
            'template/scripts/BxBaseLabel.php' => "_t('_sys_form_labels')",
            'template/scripts/BxBasePrivacy.php' => '_getGroupCustomPopupTitle($iGroupId)',
            'template/scripts/BxBaseUploaderCrop.php' => "_t('_sys_uploader_crop_popup_title')",
            'modules/boonex/albums/classes/BxAlbumsModule.php' => "_t('_bx_albums_page_block_title_move_media')",
            'modules/boonex/timeline/classes/BxTimelineModule.php' => "_t(\$bWith ? '_bx_timeline_txt_do_repost_with'",
            'studio/classes/BxDolStudioApiKeys.php' => '$this->_getAddPopupTitle()',
        ] as $sFile => $sNeedle)
            $this->assertStringContainsString($sNeedle, self::read($sFile), "$sFile opens a titled popup.");
    }

    public function testCropperHasNoSecondCloseButton(): void
    {
        foreach (['template/uploader_form_crop.html', 'studio/template/uploader_form_crop_cover.html'] as $sFile)
            $this->assertStringNotContainsString('_sys_uploader_close', self::read($sFile), "$sFile: the popup's own close button closes it.");
    }

    public function testNoAllCapsLabels(): void
    {
        foreach ([
            'template/css/common.css', 'template/css/forms.css', 'template/css/menu.css',
            'modules/boonex/artificer/data/template/system/css/forms.css',
            'modules/boonex/artificer/data/template/system/css/general.css',
            'modules/boonex/timeline/template/css/view.css',
            'studio/template/css/dashboard.css',
            'modules/boonex/analytics/template/css/studio.css',
        ] as $sFile)
            $this->assertStringNotContainsString('text-transform: uppercase', str_replace('text-transform:uppercase', 'text-transform: uppercase', self::read($sFile)), $sFile);

        foreach (['template/profile_avatar.html', 'template/auth.html', 'template/menu_multilevel.html', 'template/menu_profile_followings.html'] as $sFile)
            $this->assertDoesNotMatchRegularExpression('/class="[^"]*\buppercase\b/', self::read($sFile), $sFile);
    }
}
