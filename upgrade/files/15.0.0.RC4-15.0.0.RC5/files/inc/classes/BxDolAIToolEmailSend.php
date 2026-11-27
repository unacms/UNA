<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\ToolProperty;;

class BxDolAIToolEmailSend extends BxDolAITool
{
    public function __construct()
    {
        parent::__construct(
            'email_send',
            'Use this tool to send e-mail.',
        );
    }

    protected function properties(): array
    {
        return [
            new ToolProperty(
                name: 'email',
                type: PropertyType::STRING,
                description: 'Recipient email, one or several comma separated emails.',
                required: true
            ),
            new ToolProperty(
                name: 'subject',
                type: PropertyType::STRING,
                description: 'Mail subject.',
                required: true
            ),
            new ToolProperty(
                name: 'body',
                type: PropertyType::STRING,
                description: 'Mail body.',
                required: true
            ),
        ];
    }

    public function __invoke(string $email, string $subject, string $body): bool
    {
        $bSent = sendMail($email, $subject, $body);
        if ($bSent)
            $this->adminLog('email', $email, 'send', null, [
                'email' => $email,
                'subject' => $subject,
                'body' => BxDolAdminLog::maskText($body),
            ]);

        return $bSent;
    }
}
