<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The person birthday: optional, its author alone sees it until they choose who else does, and a birthday nobody
 * entered (an empty date column keeps '0000-00-00') is no date, not an age of 2026.
 */
#[Group('integration')]
class BirthdayFieldTest extends BxDolIntegrationTestCase
{
    public function testZeroDateIsNoDate(): void
    {
        $this->assertSame('', bx_process_output('0000-00-00', BX_DATA_DATE_UTC));
        $this->assertSame('1990-05-04 00:00:00Z', bx_process_output('1990-05-04', BX_DATA_DATE_UTC));

        foreach (['', '0000-00-00', '0000-00-00Z', '0000-00-00 00:00:00', '0000-00-00 00:00:00Z'] as $s)
            $this->assertTrue(BxDolFormCheckerHelper::checkDateRange($s, 18, 99, false), "'$s' is an empty optional date.");
        $this->assertFalse(BxDolFormCheckerHelper::checkDateRange('2020-01-01', 18, 99, false), 'A real date is still checked.');
    }

    public function testBirthdayIsOptionalAndPrivateByDefault(): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
            $this->markTestSkipped('Persons is not installed.');

        $aInput = BxDolDb::getInstance()->getRow("SELECT `required`, `privacy`, `privacy_default` FROM `sys_form_inputs` WHERE `object` = 'bx_person' AND `name` = 'birthday'");
        $this->assertSame(0, (int)$aInput['required']);
        $this->assertSame(1, (int)$aInput['privacy']);
        $this->assertSame((string)BX_DOL_PG_MEONLY, (string)$aInput['privacy_default']);

        $oForm = BxDolForm::getObjectInstance('bx_person', 'bx_person_view');
        $this->assertNotEmpty($oForm);
        $this->assertSame((string)BX_DOL_PG_MEONLY, (string)($oForm->aInputs['birthday']['privacy_default'] ?? ''), 'The form carries the default to its privacy check.');
    }
}
