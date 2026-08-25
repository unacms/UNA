<?php

define('BX_SKIP_INSTALL_CHECK', 1);

$aPathInfo = pathinfo(__FILE__);
$sHeaderPath = $aPathInfo['dirname'] . '/../inc/header.inc.php';
if (!file_exists($sHeaderPath))
    die("Script is not installed\n");

require_once($sHeaderPath);

class BxDolTestCase extends \PHPUnit\Framework\TestCase
{

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
