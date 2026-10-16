<?php

/**
 * "Recommended friends" on the members' home page: with nothing to suggest (a new or small site) the block shows an
 * empty state with a link to find people, instead of rendering nothing and leaving its page column blank.
 */
class BxBaseServiceProfilesRecommendationsTest extends BxDolTestCase
{
    // No profile has this id, so there is nothing to recommend to it.
    private const NO_RECOMMENDATIONS_PROFILE = 2147483000;

    private function browse(array $aParams)
    {
        return BxDolService::call('system', 'browse_recommendations_friends', [self::NO_RECOMMENDATIONS_PROFILE, $aParams], 'TemplServiceProfiles');
    }

    public function testNothingToRecommendRendersNothingByDefault(): void
    {
        $this->assertEmpty($this->browse(['per_page' => 3]), 'Blocks without empty_state keep hiding themselves.');
    }

    public function testEmptyStateExplainsAndLinksToPeople(): void
    {
        $sHtml = $this->browse(['per_page' => 3, 'empty_state' => true]);

        $this->assertStringContainsString('bx-recommendations-empty', $sHtml);
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_title'), $sHtml);
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_text'), $sHtml);

        $oMethod = new ReflectionMethod('BxBaseServiceProfiles', '_getRecommendationsEmptyStateUrl');
        $sUrl = $oMethod->invoke(new BxTemplServiceProfiles());
        if ($sUrl === '') {
            $this->assertStringNotContainsString('bx-btn', $sHtml, 'Without a profile module there is nowhere to send people, so no button.');
            return;
        }

        $this->assertStringStartsWith(BX_DOL_URL_ROOT, $sUrl);
        $this->assertStringContainsString('href="' . $sUrl . '"', $sHtml);
        $this->assertStringContainsString(_t('_sys_recom_friends_empty_action'), $sHtml);
    }

    public function testEmptyStateWinsOverTheGenericEmptyMessage(): void
    {
        $sHtml = $this->browse(['empty_state' => true, 'empty_message' => true]);

        $this->assertStringContainsString('bx-recommendations-empty', $sHtml);
        $this->assertStringNotContainsString('bx-msg-box', $sHtml);
    }
}
