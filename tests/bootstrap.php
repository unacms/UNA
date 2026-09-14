<?php

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;

define('BX_SKIP_INSTALL_CHECK', 1);

$aPathInfo = pathinfo(__FILE__);
$sHeaderPath = $aPathInfo['dirname'] . '/../inc/header.inc.php';
if (!file_exists($sHeaderPath))
    die("Script is not installed\n");

require_once($sHeaderPath);

class BxDolTestCase extends \PHPUnit\Framework\TestCase
{
    /**
     * @var list<callable>|null
     */
    private $_aExceptionHandlersBackup;

    #[Before]
    protected function bxSnapshotExceptionHandlers(): void
    {
        $this->_aExceptionHandlersBackup = $this->bxActiveExceptionHandlers();
    }

    #[After]
    protected function bxRestoreExceptionHandlers(): void
    {
        if ($this->_aExceptionHandlersBackup === null)
            return;

        foreach ($this->bxActiveExceptionHandlers() as $mixedIgnored)
            restore_exception_handler();

        foreach ($this->_aExceptionHandlersBackup as $mixedHandler)
            set_exception_handler($mixedHandler);

        $this->_aExceptionHandlersBackup = null;
    }

    /**
     * @return list<callable>
     */
    private function bxActiveExceptionHandlers(): array
    {
        $aHandlers = [];

        while (true) {
            $mixedHandler = set_exception_handler(static function (): void {});
            restore_exception_handler();

            if ($mixedHandler === null)
                break;

            $aHandlers[] = $mixedHandler;
            restore_exception_handler();
        }

        $aHandlers = array_reverse($aHandlers);
        foreach ($aHandlers as $mixedHandler)
            set_exception_handler($mixedHandler);

        return $aHandlers;
    }

    protected function bxRequireAntispam()
    {
        bx_import('BxDolModule');
        $oModule = BxDolModule::getInstance('bx_antispam');
        if (!$oModule)
            $this->markTestSkipped('bx_antispam module is not installed.');

        if (!BxDolDb::getInstance()->isTableExists('bx_antispam_dnsbl_rules'))
            $this->markTestSkipped('bx_antispam module is not installed (table bx_antispam_dnsbl_rules is missing).');

        return $oModule;
    }

    function bxMockGet ($sClass, $aModule = array(), $bDisableContructor = false)
    {
        if ($aModule)
            bx_import(bx_ltrim_str($sClass, $aModule['class_prefix']), $aModule);
        else
            bx_import($sClass);

        if ($bDisableContructor) {
            $GLOBALS['bxDolClasses'][$sClass] = $this->getMockBuilder($sClass)
                ->disableOriginalConstructor()
                ->getMock();
        } else {
            $GLOBALS['bxDolClasses'][$sClass] = $this->createMock($sClass);
        }

        return $GLOBALS['bxDolClasses'][$sClass];
    }

    function bxMockFree (&$o)
    {
        if (!$o)
            return;

        // PHPUnit 12 names doubles MockObject_* / TestStub_*; older versions used Mock_*.
        $sClassName = preg_replace('/^(?:MockObject|TestStub|Mock)_/', '', get_class($o));
        $sClassName = preg_replace('/_[A-Za-z0-9]+$/', '', $sClassName);
        unset($GLOBALS['bxDolClasses'][$sClassName]);
        unset($o);
    }

}
