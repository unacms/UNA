<?php

/**
 * Chat action buttons the agent asks for: only safe types, URLs and texts reach the chat.
 */
class BxDolAiChatUiTest extends \PHPUnit\Framework\TestCase
{
    private function sanitize($aActions)
    {
        return BxDolAiChatUi::getInstance()->sanitizeChatActions($aActions);
    }

    public function testRejectsBadInput()
    {
        $this->assertSame([], $this->sanitize('reply'));
        $this->assertSame([], $this->sanitize([
            'not an array',
            ['type' => 'reply', 'label' => '  '],
            ['type' => 'script', 'label' => 'X'],
        ]));
    }

    public function testReplyAndLink()
    {
        $this->assertSame([
            ['type' => 'reply', 'label' => 'Yes'],
            ['type' => 'link', 'label' => 'Help', 'url' => 'https://una.io/help'],
        ], $this->sanitize([
            ['type' => 'REPLY', 'label' => ' Yes '],
            ['type' => 'link', 'label' => 'Help', 'url' => 'https://una.io/help'],
            ['type' => 'link', 'label' => 'Http', 'url' => 'http://una.io/'],
            ['type' => 'link', 'label' => 'Js', 'url' => 'javascript:alert(1)'],
            ['type' => 'link', 'label' => 'Local', 'url' => 'https://localhost/'],
            ['type' => 'link', 'label' => 'Private', 'url' => 'https://10.0.0.5/'],
        ]));
    }

    public function testLinkCheckUrlNeedsMessageAndServiceUrl()
    {
        $aOut = $this->sanitize([
            ['type' => 'link', 'label' => 'A', 'url' => 'https://a.test/', 'check_url' => 'bx_projects/get_provider_connected/&params[]=aws&params[]=1', 'message' => 'AWS is connected'],
            ['type' => 'link', 'label' => 'B', 'url' => 'https://a.test/', 'check_url' => 'bx_projects/get_provider_connected'],
            ['type' => 'link', 'label' => 'C', 'url' => 'https://a.test/', 'check_url' => 'https://evil.test/x', 'message' => 'm'],
            ['type' => 'link', 'label' => 'D', 'url' => 'https://a.test/', 'check_url' => 'a/b/&params[]=<x>', 'message' => 'm'],
        ]);

        $this->assertSame('bx_projects/get_provider_connected/&params[]=aws&params[]=1', $aOut[0]['check_url']);
        $this->assertSame('AWS is connected', $aOut[0]['message']);
        foreach ([1, 2, 3] as $i) {
            $this->assertArrayNotHasKey('check_url', $aOut[$i]);
            $this->assertArrayNotHasKey('message', $aOut[$i]);
        }
    }

    public function testForm()
    {
        $this->assertSame([
            ['type' => 'form', 'label' => 'Add keys', 'form_url' => 'bx_projects/get_block_sr_provider_add/&params[]=2', 'message' => 'AWS is connected'],
            ['type' => 'form', 'label' => 'No message', 'form_url' => 'bx_projects/get_block_sr_provider_add'],
        ], $this->sanitize([
            ['type' => 'form', 'label' => 'Add keys', 'form_url' => 'bx_projects/get_block_sr_provider_add/&params[]=2', 'message' => '<b>AWS</b> is connected'],
            ['type' => 'form', 'label' => 'No message', 'form_url' => 'bx_projects/get_block_sr_provider_add', 'message' => ' '],
            ['type' => 'form', 'label' => 'Bad', 'form_url' => '../../admin'],
            ['type' => 'form', 'label' => 'Bad', 'form_url' => 'https://evil.test/a/b'],
            ['type' => 'form', 'label' => 'Missing'],
        ]));
    }

    public function testMergeFormActions()
    {
        $oChat = BxDolAiChatUi::getInstance();
        $aKeys = ['type' => 'form', 'label' => 'Add keys', 'form_url' => 'bx_projects/get_block_sr_provider_add/&params[]=2'];
        $aRole = ['type' => 'form', 'label' => 'Add keys', 'form_url' => 'bx_projects/get_block_sr_provider_add/&params[]=3'];
        $aBad = ['type' => 'form', 'label' => 'Bad', 'form_url' => 'https://evil.test/a/b'];

        // same label and form_url is one button, another form_url is another one
        $this->assertSame([$aKeys, $aRole], $oChat->mergeChatActions([$aKeys, $aBad], [$aKeys, $aRole]));

        // a form never merges with a link of the same label
        $aLink = ['type' => 'link', 'label' => 'Add keys', 'url' => 'https://a.test/'];
        $this->assertCount(2, $oChat->mergeChatActions([$aKeys], [$aLink]));

        $this->assertCount(8, $oChat->mergeChatActions(
            array_map(fn($i) => ['type' => 'form', 'label' => 'F' . $i, 'form_url' => 'a/b'], range(1, 6)),
            array_map(fn($i) => ['type' => 'reply', 'label' => 'R' . $i], range(1, 6))
        ));
    }

    public function testLimits()
    {
        $aOut = $this->sanitize([
            ['type' => 'form', 'label' => str_repeat('я', 100), 'form_url' => 'a/b', 'message' => str_repeat('я', 300)],
        ]);
        $this->assertSame(80, mb_strlen($aOut[0]['label']));
        $this->assertSame(200, mb_strlen($aOut[0]['message']));

        $this->assertCount(8, $this->sanitize(array_fill(0, 12, ['type' => 'reply', 'label' => 'x'])));
    }
}
