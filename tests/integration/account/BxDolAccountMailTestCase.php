<?php

require_once __DIR__ . '/BxDolAccountTestCase.php';

/**
 * Keeps the letters UNA would send instead of sending them.
 */
class BxTestRecordMailAlertsResponse extends BxDolAlertsResponse
{
    public static $aSent = [];

    public function response($oAlert)
    {
        if ($oAlert->sUnit !== 'system' || $oAlert->sAction !== 'check_send_mail')
            return;

        self::$aSent[] = [
            'email' => $oAlert->aExtras['email'] ?? '',
            'subject' => $oAlert->aExtras['subject'] ?? '',
            'body' => $oAlert->aExtras['body'] ?? '',
        ];
        $oAlert->aExtras['override_result'] = true;
    }
}

/**
 * Account tests that check which letters go out, and to which address.
 */
abstract class BxDolAccountMailTestCase extends BxDolAccountTestCase
{
    protected function bxInstallTestAlertHandlers(): void
    {
        parent::bxInstallTestAlertHandlers();

        BxTestRecordMailAlertsResponse::$aSent = [];

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $aCache = $oProp->getValue();

        // the recorder takes the place of the handler that only skips mail
        $sId = 'phpunit_record_mail';
        $aCache['handlers'][$sId] = [
            'name' => $sId,
            'class' => BxTestRecordMailAlertsResponse::class,
            'file' => 'tests/integration/account/BxDolAccountMailTestCase.php',
            'service_call' => '',
            'active' => 1,
        ];
        $aCache['alerts']['system']['check_send_mail'] = [$sId];
        $oProp->setValue(null, $aCache);
    }

    /**
     * @return array letters sent to the address
     */
    protected function bxMailsTo(string $sEmail): array
    {
        return array_values(array_filter(BxTestRecordMailAlertsResponse::$aSent, function ($a) use ($sEmail) {
            return $a['email'] === $sEmail;
        }));
    }

    protected function bxTemplateSubject(string $sTemplate, array $aVars = []): string
    {
        $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($sTemplate, $aVars);
        $this->assertIsArray($aTemplate, 'Email template ' . $sTemplate . ' should exist.');

        return $aTemplate['Subject'];
    }
}
