<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A birthday field in a view form shows the age. Without a birthday the site leaves the row out,
 * and the API leaves the input out: it never sends the current year as the age ("Age 2026").
 */
#[Group('integration')]
class FormBirthdayApiTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;
        parent::tearDown();
    }

    protected function form(string $sBirthday): BxTemplFormView
    {
        $oForm = new BxTemplFormView([
            'form_attrs' => ['id' => 'phpunit_form_birthday', 'name' => 'phpunit_form_birthday', 'method' => 'post', 'action' => ''],
            'params' => ['view_mode' => 1],
            'inputs' => [
                'fullname' => ['type' => 'text', 'name' => 'fullname', 'caption' => 'Name', 'value' => 'Ann'],
                'birthday' => ['type' => 'datepicker', 'name' => 'birthday', 'caption' => 'Birthday', 'value' => $sBirthday],
            ],
        ]);

        return $oForm;
    }

    protected function apiInput(string $sBirthday): ?array
    {
        $_GET['api'] = 1;
        $aCode = $this->form($sBirthday)->getCodeAPI();
        unset($_GET['api']);

        foreach ($aCode['inputs'] ?? [] as $aInput)
            if (($aInput['name'] ?? '') === 'birthday')
                return $aInput;

        return null;
    }

    public function testApiSendsTheAge(): void
    {
        $aInput = $this->apiInput(((int)date('Y') - 30) . '-01-01');

        $this->assertNotNull($aInput);
        $this->assertSame('text', $aInput['type']);
        $this->assertSame(30, $aInput['value']);
    }

    public function testApiLeavesOutAnEmptyBirthday(): void
    {
        foreach (['0000-00-00', ''] as $sBirthday)
            $this->assertNull($this->apiInput($sBirthday), var_export($sBirthday, true) . ' has no age');
    }

    public function testSiteLeavesOutAnEmptyBirthday(): void
    {
        $sHtml = $this->form('0000-00-00')->getCode();

        $this->assertStringContainsString('Ann', $sHtml);
        $this->assertStringNotContainsString((string)date('Y'), strip_tags($sHtml));
    }
}
