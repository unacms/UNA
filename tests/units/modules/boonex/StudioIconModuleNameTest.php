<?php

/**
 * Studio shows its own art for an app (studio/template/images/modules/<name>.svg) by the module name in front of "@"
 * in the icon its install SQL stores ("bx_posts@modules/boonex/posts/|std-icon.svg"). A different name there makes
 * Studio fall back to the module's older std-icon.svg, as SMTP Mailer did with "bx_smtpmailer".
 */
class StudioIconModuleNameTest extends \PHPUnit\Framework\TestCase
{
    private const MODULES = __DIR__ . '/../../../../modules/boonex/';

    public function testIconsNameTheirOwnModule(): void
    {
        $iChecked = 0;
        foreach (glob(self::MODULES . '*/install/sql/install.sql') as $sSql) {
            $sDir = dirname($sSql, 3);
            $sConfig = (string)file_get_contents($sDir . '/install/config.php');
            if (!preg_match("#'name'\s*=>\s*'([^']+)'#", $sConfig, $aName))
                continue;

            $sFolder = 'modules/boonex/' . basename($sDir) . '/';
            preg_match_all("#'([a-z0-9_]+)@" . preg_quote($sFolder, '#') . "\|[^']+'#", (string)file_get_contents($sSql), $aIcons);
            foreach ($aIcons[1] as $sPrefix) {
                $this->assertSame($aName[1], $sPrefix, $sFolder . 'install/sql/install.sql names another module in a Studio icon.');
                $iChecked++;
            }
        }

        $this->assertGreaterThan(50, $iChecked, 'No Studio icons were found in install SQL.');
    }
}
