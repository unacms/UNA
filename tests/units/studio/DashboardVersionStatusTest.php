<?php

class DashboardVersionStatusTestProxy extends BxTemplStudioDashboard
{
    public function __construct()
    {
        // only getVersionStatus is used: it needs no page, blocks or database
    }
}

/**
 * Studio > Dashboard > Updates: the line under the installed version.
 */
class DashboardVersionStatusTest extends BxDolTestCase
{
    public static function cases(): array
    {
        return [
            'latest stable' => ['14.0.0', '14.0.0', '15.0.0-RC4', 'stable', 'ok', '_adm_dbd_txt_ver_is_latest_stable'],
            'latest beta' => ['15.0.0-RC4', '14.0.0', '15.0.0-RC4', 'beta', 'ok', '_adm_dbd_txt_ver_is_latest_beta'],
            'latest beta on the stable channel' => ['15.0.0-RC4', '14.0.0', '15.0.0-RC4', 'stable', 'ok', '_adm_dbd_txt_ver_is_latest_beta'],
            'beta behind on the beta channel' => ['15.0.0-RC2', '14.0.0', '15.0.0-RC4', 'beta', 'fail', '_adm_dbd_txt_ver_update_to', '15.0.0-RC4'],
            'stable behind on the stable channel' => ['13.1.0', '14.0.0', '15.0.0-RC4', 'stable', 'fail', '_adm_dbd_txt_ver_update_to', '14.0.0'],
            'stable behind on the beta channel' => ['13.1.0', '14.0.0', '15.0.0-RC4', 'beta', 'fail', '_adm_dbd_txt_ver_update_to', '15.0.0-RC4'],
            'old beta, nothing newer on stable' => ['15.0.0-RC2', '14.0.0', '15.0.0-RC4', 'stable', 'fail', '_adm_dbd_txt_ver_update_to', '15.0.0-RC4'],
            'case of the suffix' => ['15.0.0-rc4', '14.0.0', '15.0.0-RC4', 'beta', 'ok', '_adm_dbd_txt_ver_is_latest_beta'],
            'development copy' => ['15.0.0', '14.0.0', '15.0.0-RC4', 'beta', 'undef', '_adm_dbd_txt_ver_is_newer'],
            'beta check failed' => ['14.0.0', '14.0.0', '', 'beta', 'ok', '_adm_dbd_txt_ver_is_latest_stable'],
            'check failed' => ['14.0.0', '', '', 'stable', 'undef', '_adm_dbd_txt_ver_check_failed'],
        ];
    }

    /**
     * @dataProvider cases
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('cases')]
    public function testStatus(string $sInstalled, string $sStable, string $sBeta, string $sChannel, string $sStatus, string $sKey, string $sTarget = ''): void
    {
        $a = (new DashboardVersionStatusTestProxy())->getVersionStatus($sInstalled, $sStable, $sBeta, $sChannel);

        $this->assertSame($sStatus, $a['status']);
        $this->assertSame(_t($sKey, $sTarget), $a['value']);
    }
}
