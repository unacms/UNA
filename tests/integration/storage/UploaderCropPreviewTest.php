<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A single picture field (the crop uploader: profile pictures, covers, the account picture) shows the picture area
 * itself: a button which opens the file picker, and with a picture set, the picture with an edit button whose menu
 * has "Change picture" and "Remove". The ghost list under it stays in the form, hidden. A multiple crop uploader and
 * Studio's cover uploader (Designer draws its own preview) keep the "Upload and Crop" button.
 */
#[Group('integration')]
class UploaderCropPreviewTest extends BxDolIntegrationTestCase
{
    private const STORAGE = 'sys_accounts_pictures';

    private function uploader(string $sObject = 'sys_crop', bool $bMultiple = false, string $sStorage = self::STORAGE): BxDolUploader
    {
        $oUploader = BxDolUploader::getObjectInstance($sObject, $sStorage, 'phpunit' . genRndPwd(6, false));
        if (!$oUploader)
            $this->markTestSkipped('Uploader ' . $sObject . ' is not installed.');

        $oUploader->setMultiple($bMultiple);
        return $oUploader;
    }

    private function button(BxDolUploader $oUploader, array $aParams = []): string
    {
        return $oUploader->getUploaderButton($aParams + [
            'content_id' => '',
            'storage_private' => '0',
            'attrs' => '',
            'btn_class' => '',
            'button_title' => 'Upload and Crop',
            'placeholder_image' => '',
        ]);
    }

    public function testSingleFieldShowsThePictureAreaAsAButton(): void
    {
        $oUploader = $this->uploader();
        $sHtml = $this->button($oUploader);
        $sJs = $oUploader->getNameJsInstanceUploader();

        $this->assertStringContainsString('id="' . $oUploader->getIdPreview() . '"', $sHtml);
        $this->assertStringContainsString('data-shape="circle"', $sHtml);
        $this->assertMatchesRegularExpression('/<button type="button" class="bx-uploader-crop-choose[^"]*"[^>]*aria-label="' . preg_quote(bx_html_attribute(_t('_sys_uploader_crop_choose_picture')), '/') . '"[^>]*onclick="' . preg_quote($sJs, '/') . '\.choosePicture\(\);"/', $sHtml);
        $this->assertMatchesRegularExpression('/<input type="file"[^>]*accept="image\/jpeg,image\/png,image\/gif,image\/webp"[^>]*onchange="' . preg_quote($sJs, '/') . '\.onPictureChosen\(this\)"/', $sHtml, 'the cropper opens with the chosen file');
        $this->assertStringNotContainsString('Upload and Crop', $sHtml);
        $this->assertSame('!hidden', $oUploader->getResultContainerClass(), 'the ghost holding the file id stays in the form, not shown');
    }

    public function testSetPictureHasAnEditButtonWithChangeAndRemove(): void
    {
        $oUploader = $this->uploader();
        $sHtml = $this->button($oUploader);
        $sJs = $oUploader->getNameJsInstanceUploader();
        $sMenuId = $oUploader->getIdPreview() . '-menu';

        $this->assertMatchesRegularExpression('/<button type="button" class="bx-uploader-crop-edit hidden [^"]*"[^>]*aria-label="' . preg_quote(bx_html_attribute(_t('_sys_uploader_crop_edit_picture')), '/') . '" aria-haspopup="menu" aria-expanded="false" onclick="bx_menu_popup_inline\(\'#' . preg_quote($sMenuId, '/') . '\', this\);"/', $sHtml);
        $this->assertStringContainsString('id="' . $sMenuId . '"', $sHtml, 'the menu is a standard popup');
        $this->assertStringContainsString($sJs . '.choosePicture();', $sHtml);
        $this->assertStringContainsString($sJs . '.removePicture();', $sHtml);
        $this->assertStringContainsString(_t('_sys_uploader_crop_change_picture'), $sHtml);
        $this->assertStringContainsString(_t('_sys_uploader_crop_remove_picture'), $sHtml);
    }

    public function testPlaceholderIsTheLetterAvatarWhenGivenAndACameraOtherwise(): void
    {
        $sLetter = BxDolTemplate::getLetterAvatarUrl('Maya', 3);

        $sHtml = $this->button($this->uploader(), ['placeholder_image' => $sLetter]);
        $this->assertStringContainsString('<img src="' . bx_html_attribute($sLetter) . '" alt=""', $sHtml);
        $this->assertStringContainsString('bx-uploader-crop-badge', $sHtml, 'a camera badge where the edit button of a set picture is');

        $sHtml = $this->button($this->uploader());
        $this->assertStringNotContainsString('data:image/svg+xml', $sHtml);
        $this->assertStringNotContainsString('bx-uploader-crop-badge', $sHtml);
        $this->assertStringContainsString('sys-icon camera', $sHtml);
    }

    public function testDisabledFieldDisablesItsButtons(): void
    {
        $sHtml = $this->button($this->uploader(), ['btn_class' => 'bx-btn-disabled']);

        $this->assertSame(2, substr_count($sHtml, 'disabled="disabled"'), 'the picture area and the edit button');
    }

    public function testMultipleFieldKeepsTheButton(): void
    {
        $oUploader = $this->uploader('sys_crop', true);
        $sHtml = $this->button($oUploader);

        $this->assertStringContainsString('Upload and Crop', $sHtml);
        $this->assertStringNotContainsString('bx-uploader-crop-preview', $sHtml);
        $this->assertSame('', $oUploader->getResultContainerClass());
    }

    public function testStudioCoverKeepsTheButton(): void
    {
        $oUploader = $this->uploader('sys_std_crop_cover', false, 'sys_images');

        $this->assertFalse($oUploader->isPreview());
        $this->assertStringNotContainsString('bx-uploader-crop-preview', $this->button($oUploader));
    }

    public function testProfileCoverIsWide(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('People is not installed.');

        $sHtml = $this->button($this->uploader('bx_persons_cover_crop', false, 'bx_persons_pictures'));

        $this->assertStringContainsString('data-shape="cover"', $sHtml);
        $this->assertStringContainsString('aspect-[3/1]', $sHtml);
        $this->assertStringContainsString(bx_html_attribute(_t('_sys_uploader_crop_choose_cover')), $sHtml);
    }

    public function testCropperFrameIsRoundForAPicture(): void
    {
        $this->assertStringContainsString("type: 'circle'", $this->uploader()->getUploaderForm(false));
        $this->assertStringContainsString("type: 'square'", $this->uploader('sys_crop', true)->getUploaderForm(true));
    }

    public function testFormFieldHidesTheGhostListOfASinglePicture(): void
    {
        $oForm = new BxTemplFormView(['form_attrs' => ['id' => 'phpunit-crop-form', 'method' => 'post'], 'inputs' => []]);

        $aInput = ['type' => 'files', 'name' => 'picture', 'storage_object' => self::STORAGE, 'uploaders' => ['sys_crop'], 'multiple' => false, 'ghost_template' => ''];
        $sHtml = $oForm->genInputFiles($aInput);
        $this->assertMatchesRegularExpression('/class="bx-form-input-files-result !hidden"/', $sHtml);
        $this->assertStringContainsString('bx-uploader-crop-preview', $sHtml);

        $aInput['multiple'] = true;
        $sHtml = $oForm->genInputFiles($aInput);
        $this->assertMatchesRegularExpression('/class="bx-form-input-files-result "/', $sHtml);
    }

    /**
     * What an account uploads before it has a profile is owned by its system profile (the picture of its first
     * profile), and the account can remove it.
     */
    public function testAccountRemovesWhatItsSystemProfileUploaded(): void
    {
        $oAccount = $this->bxAccount('admin');

        $iSystemProfileId = 0;
        foreach ($oAccount->getProfiles(false, false) as $iProfileId => $aProfile)
            if ($aProfile['type'] == 'system')
                $iSystemProfileId = (int)$iProfileId;
        if (!$iSystemProfileId)
            $this->markTestSkipped('The account has no system profile.');

        $sFile = BX_DIRECTORY_PATH_ROOT . 'tmp/phpunit_crop_' . genRndPwd(6, false) . '.png';
        file_put_contents($sFile, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='));

        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        $iFileId = $oStorage->storeFileFromPath($sFile, false, $iSystemProfileId, 0);
        @unlink($sFile);
        if (!$iFileId)
            $this->markTestSkipped('Could not store a file: ' . $oStorage->getErrorString());

        $sResult = $this->uploader()->deleteGhost($iFileId, $iSystemProfileId);
        if ($sResult != 'ok')
            $oStorage->deleteFile($iFileId);

        $this->assertSame('ok', $sResult);
        $this->assertFalse((bool)$oStorage->getFile($iFileId));
    }
}
