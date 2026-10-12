<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AIProxy AI Proxy
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAiProxyException extends Exception
{
    public function __construct(protected int $iHttpCode, string $sMessage)
    {
        parent::__construct($sMessage);
    }

    public function httpCode(): int
    {
        return $this->iHttpCode;
    }
}

class BxAiProxyCompletion
{
    /**
     * Studio model id for this turn. The request body model is ignored.
     */
    public function providerId(array $aBody, int $iConfiguredId): int
    {
        if ($iConfiguredId <= 0)
            throw new BxAiProxyException(503, 'The proxy model is not available');

        return $iConfiguredId;
    }

    /**
     * @param callable(int): NeuronAI\Providers\AIProviderInterface $fFactory
     * @param callable(string): void|null $fEmit
     */
    public function run(array $aBody, int $iConfiguredId, callable $fFactory, ?callable $fEmit = null): ?string
    {
        [$oProvider, $aMessages] = $this->prepare($aBody, $iConfiguredId, $fFactory);
        $sId = 'chatcmpl-' . bin2hex(random_bytes(8));
        if (!empty($aBody['stream'])) {
            $this->streamTo($oProvider, $aMessages, $sId, $fEmit ?? static function (string $sEvent) {
            });
            return null;
        }

        try {
            $oMessage = $oProvider->chat(...$aMessages);
        }
        catch (BxAiProxyException $oException) {
            throw $oException;
        }
        catch (Throwable $oException) {
            $this->logProvider($oException);
            throw new BxAiProxyException(503, 'The proxy model is not available');
        }

        if (!$oMessage instanceof NeuronAI\Chat\Messages\Message)
            throw new BxAiProxyException(503, 'The proxy model is not available');

        return json_encode($this->completionArray($sId, $oMessage), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    /**
     * @param callable(int): NeuronAI\Providers\AIProviderInterface $fFactory
     * @return array{0: NeuronAI\Providers\AIProviderInterface, 1: list<NeuronAI\Chat\Messages\Message>}
     */
    protected function prepare(array $aBody, int $iConfiguredId, callable $fFactory): array
    {
        $iId = $this->providerId($aBody, $iConfiguredId);
        try {
            $oProvider = $fFactory($iId);
        }
        catch (BxAiProxyException $oException) {
            throw $oException;
        }
        catch (Throwable $oException) {
            $this->logProvider($oException);
            throw new BxAiProxyException(503, 'The proxy model is not available');
        }

        if (!$oProvider instanceof NeuronAI\Providers\AIProviderInterface)
            throw new BxAiProxyException(503, 'The proxy model is not available');

        $aMapped = $this->mapBody($aBody);
        if ($aMapped['system'] !== '')
            $oProvider->systemPrompt($aMapped['system']);
        if ($aMapped['tools'] !== [])
            $oProvider->setTools($aMapped['tools']);
        if ($aMapped['messages'] === [])
            throw new BxAiProxyException(400, 'Bad request');

        return [$oProvider, $aMapped['messages']];
    }

    /**
     * @return array{system: string, messages: list<NeuronAI\Chat\Messages\Message>, tools: list<NeuronAI\Tools\Tool>}
     */
    protected function mapBody(array $aBody): array
    {
        if (!isset($aBody['messages']) || !is_array($aBody['messages']))
            throw new BxAiProxyException(400, 'Bad request');

        $aSystem = [];
        $aMessages = [];
        $aCallNames = [];
        foreach ($aBody['messages'] as $aMessage) {
            if (!is_array($aMessage))
                continue;

            $sRole = (string)($aMessage['role'] ?? '');
            if ($sRole === 'system' || $sRole === 'developer') {
                $sText = $this->textOf($aMessage['content'] ?? '');
                if ($sText !== '')
                    $aSystem[] = $sText;
                continue;
            }

            if ($sRole === 'tool') {
                $sCallId = (string)($aMessage['tool_call_id'] ?? '');
                $sName = (string)($aMessage['name'] ?? ($aCallNames[$sCallId] ?? 'tool'));
                if ($sName === '')
                    $sName = 'tool';
                $oTool = NeuronAI\Tools\Tool::make($sName, '');
                if ($sCallId !== '')
                    $oTool->setCallId($sCallId);
                $oTool->setResult($this->textOf($aMessage['content'] ?? ''));
                $aMessages[] = new NeuronAI\Chat\Messages\ToolResultMessage([$oTool]);
                continue;
            }

            if ($sRole === 'assistant' && !empty($aMessage['tool_calls']) && is_array($aMessage['tool_calls'])) {
                $aCalls = [];
                foreach ($aMessage['tool_calls'] as $aCall) {
                    if (!is_array($aCall))
                        continue;
                    $oTool = $this->callTool($aCall);
                    $sCallId = (string)($oTool->getCallId() ?? '');
                    if ($sCallId !== '')
                        $aCallNames[$sCallId] = $oTool->getName();
                    $aCalls[] = $oTool;
                }
                if ($aCalls === [])
                    continue;
                $aMessages[] = new NeuronAI\Chat\Messages\ToolCallMessage($this->contentBlocks($aMessage['content'] ?? null), $aCalls);
                continue;
            }

            if ($sRole === 'assistant') {
                $aMessages[] = new NeuronAI\Chat\Messages\AssistantMessage($this->contentBlocks($aMessage['content'] ?? ''));
                continue;
            }

            if ($sRole === 'user')
                $aMessages[] = new NeuronAI\Chat\Messages\UserMessage($this->contentBlocks($aMessage['content'] ?? ''));
        }

        return [
            'system' => implode("\n\n", $aSystem),
            'messages' => $aMessages,
            'tools' => $this->definedTools($aBody),
        ];
    }

    /**
     * @return list<NeuronAI\Tools\Tool>
     */
    protected function definedTools(array $aBody): array
    {
        if (empty($aBody['tools']) || !is_array($aBody['tools']))
            return [];

        $aTools = [];
        foreach ($aBody['tools'] as $aTool) {
            if (!is_array($aTool))
                continue;
            $aFunction = isset($aTool['function']) && is_array($aTool['function']) ? $aTool['function'] : $aTool;
            $sName = (string)($aFunction['name'] ?? '');
            if ($sName === '')
                continue;
            $aParameters = isset($aFunction['parameters']) && is_array($aFunction['parameters']) ? $aFunction['parameters'] : [];
            $aTools[] = $this->stubTool($sName, (string)($aFunction['description'] ?? ''), $aParameters);
        }
        return $aTools;
    }

    protected function stubTool(string $sName, string $sDescription, array $aParameters): NeuronAI\Tools\Tool
    {
        $oTool = NeuronAI\Tools\Tool::make($sName, $sDescription);
        foreach ($this->schemaProperties($aParameters) as $oProperty)
            $oTool->addProperty($oProperty);
        return $oTool;
    }

    /**
     * @return list<NeuronAI\Tools\ToolPropertyInterface>
     */
    protected function schemaProperties(array $aSchema): array
    {
        $aProperties = isset($aSchema['properties']) && is_array($aSchema['properties']) ? $aSchema['properties'] : [];
        $aRequired = isset($aSchema['required']) && is_array($aSchema['required']) ? $aSchema['required'] : [];
        $aBuilt = [];
        foreach ($aProperties as $sProp => $aProperty) {
            if (!is_string($sProp) || !is_array($aProperty))
                continue;
            $aBuilt[] = $this->schemaProperty($sProp, $aProperty, in_array($sProp, $aRequired, true));
        }
        return $aBuilt;
    }

    protected function schemaProperty(string $sName, array $aSchema, bool $bRequired): NeuronAI\Tools\ToolPropertyInterface
    {
        $sType = $aSchema['type'] ?? 'string';
        try {
            $oType = NeuronAI\Tools\PropertyType::fromSchema(is_array($sType) ? $sType : (string)$sType);
        }
        catch (Throwable $oException) {
            $oType = NeuronAI\Tools\PropertyType::STRING;
        }
        $sDescription = isset($aSchema['description']) ? (string)$aSchema['description'] : null;

        if ($oType === NeuronAI\Tools\PropertyType::ARRAY)
            return $this->arrayProperty($sName, $aSchema, $bRequired, $sDescription);
        if ($oType === NeuronAI\Tools\PropertyType::OBJECT)
            return $this->objectProperty($sName, $aSchema, $bRequired, $sDescription);

        $aEnum = isset($aSchema['enum']) && is_array($aSchema['enum']) ? array_values($aSchema['enum']) : [];
        return new NeuronAI\Tools\ToolProperty($sName, $oType, $sDescription, $bRequired, $aEnum);
    }

    protected function arrayProperty(string $sName, array $aSchema, bool $bRequired, ?string $sDescription): NeuronAI\Tools\ArrayProperty
    {
        $oItems = null;
        if (isset($aSchema['items']) && is_array($aSchema['items']) && !array_is_list($aSchema['items']))
            $oItems = $this->schemaProperty($sName . '_item', $aSchema['items'], false);

        $iMin = isset($aSchema['minItems']) && is_int($aSchema['minItems']) && $aSchema['minItems'] >= 0 ? $aSchema['minItems'] : null;
        $iMax = isset($aSchema['maxItems']) && is_int($aSchema['maxItems']) && $aSchema['maxItems'] >= 0 ? $aSchema['maxItems'] : null;
        if ($iMin !== null && $iMax !== null && $iMin > $iMax) {
            $iMin = null;
            $iMax = null;
        }

        return new NeuronAI\Tools\ArrayProperty($sName, $sDescription, $bRequired, $oItems, $iMin, $iMax);
    }

    protected function objectProperty(string $sName, array $aSchema, bool $bRequired, ?string $sDescription): NeuronAI\Tools\ObjectProperty
    {
        return new NeuronAI\Tools\ObjectProperty($sName, $sDescription, $bRequired, null, $this->schemaProperties($aSchema));
    }

    protected function callTool(array $aCall): NeuronAI\Tools\Tool
    {
        $aFunction = isset($aCall['function']) && is_array($aCall['function']) ? $aCall['function'] : [];
        $sName = (string)($aFunction['name'] ?? 'tool');
        if ($sName === '')
            $sName = 'tool';
        $oTool = NeuronAI\Tools\Tool::make($sName, '');
        $sId = (string)($aCall['id'] ?? '');
        if ($sId !== '')
            $oTool->setCallId($sId);

        $mixedArgs = $aFunction['arguments'] ?? [];
        if (is_string($mixedArgs)) {
            $mixedDecoded = json_decode($mixedArgs, true);
            $mixedArgs = is_array($mixedDecoded) ? $mixedDecoded : [];
        }
        elseif (!is_array($mixedArgs))
            $mixedArgs = [];
        $oTool->setInputs($mixedArgs);
        return $oTool;
    }

    protected function contentBlocks(mixed $mixed): string|array|null
    {
        if (is_string($mixed) || $mixed === null)
            return $mixed;
        if (!is_array($mixed) || $mixed === [])
            return '';
        if (!array_is_list($mixed))
            $mixed = [$mixed];

        $aBlocks = [];
        foreach ($mixed as $aBlock) {
            if (!is_array($aBlock))
                continue;
            $oBlock = $this->contentBlock($aBlock);
            if ($oBlock)
                $aBlocks[] = $oBlock;
        }
        return $aBlocks === [] ? '' : $aBlocks;
    }

    protected function contentBlock(array $aBlock): ?NeuronAI\Chat\Messages\ContentBlocks\ContentBlockInterface
    {
        $sType = (string)($aBlock['type'] ?? '');
        if ($sType === 'text' || ($sType === '' && isset($aBlock['text'])))
            return new NeuronAI\Chat\Messages\ContentBlocks\TextContent((string)($aBlock['text'] ?? ''));

        if ($sType !== 'image_url')
            return null;

        $sUrl = '';
        if (isset($aBlock['image_url']) && is_array($aBlock['image_url']))
            $sUrl = (string)($aBlock['image_url']['url'] ?? '');
        elseif (isset($aBlock['image_url']))
            $sUrl = (string)$aBlock['image_url'];
        if ($sUrl === '')
            return null;

        if (preg_match('#^data:([^;]+);base64,(.+)$#s', $sUrl, $aMatch))
            return new NeuronAI\Chat\Messages\ContentBlocks\ImageContent($aMatch[2], NeuronAI\Chat\Enums\SourceType::BASE64, $aMatch[1]);

        return new NeuronAI\Chat\Messages\ContentBlocks\ImageContent($sUrl, NeuronAI\Chat\Enums\SourceType::URL);
    }

    protected function textOf(mixed $mixed): string
    {
        if (is_string($mixed))
            return $mixed;
        if (!is_array($mixed))
            return '';
        if (!array_is_list($mixed))
            $mixed = [$mixed];

        $aParts = [];
        foreach ($mixed as $aBlock) {
            if (is_string($aBlock))
                $aParts[] = $aBlock;
            elseif (is_array($aBlock))
                $aParts[] = (string)($aBlock['text'] ?? '');
        }
        return implode('', $aParts);
    }

    /**
     * @param list<NeuronAI\Chat\Messages\Message> $aMessages
     */
    protected function streamTo(NeuronAI\Providers\AIProviderInterface $oProvider, array $aMessages, string $sId, callable $fEmit): void
    {
        $bText = false;
        try {
            $oGen = $oProvider->stream(...$aMessages);
            foreach ($oGen as $oChunk) {
                if ($oChunk instanceof NeuronAI\Chat\Messages\Stream\Chunks\TextChunk && $oChunk->content !== '') {
                    $bText = true;
                    $fEmit($this->contentDelta($sId, $oChunk->content));
                }
            }
            $oMessage = $oGen->getReturn();
        }
        catch (BxAiProxyException $oException) {
            throw $oException;
        }
        catch (Throwable $oException) {
            $this->logProvider($oException);
            throw new BxAiProxyException(503, 'The proxy model is not available');
        }

        if (!$oMessage instanceof NeuronAI\Chat\Messages\Message)
            throw new BxAiProxyException(503, 'The proxy model is not available');

        if ($oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage) {
            $this->emitToolCalls($sId, $oMessage, $fEmit);
        }
        else {
            if (!$bText) {
                $sContent = (string)$oMessage->getContent();
                if ($sContent !== '')
                    $fEmit($this->contentDelta($sId, $sContent));
            }
            $fEmit($this->sse([
                'id' => $sId,
                'object' => 'chat.completion.chunk',
                'choices' => [[
                    'index' => 0,
                    'delta' => new stdClass(),
                    'finish_reason' => 'stop',
                ]],
            ]));
        }
        $fEmit("data: [DONE]\n\n");
    }

    protected function emitToolCalls(string $sId, NeuronAI\Chat\Messages\ToolCallMessage $oMessage, callable $fEmit): void
    {
        $iIndex = 0;
        foreach ($oMessage->getTools() as $oTool) {
            $sCallId = (string)($oTool->getCallId() ?? ('call_' . $iIndex));
            $aInputs = $oTool->getInputs();
            $sArgs = json_encode($aInputs === [] ? new stdClass() : $aInputs, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $fEmit($this->sse([
                'id' => $sId,
                'object' => 'chat.completion.chunk',
                'choices' => [[
                    'index' => 0,
                    'delta' => [
                        'tool_calls' => [[
                            'index' => $iIndex,
                            'id' => $sCallId,
                            'type' => 'function',
                            'function' => [
                                'name' => $oTool->getName(),
                                'arguments' => '',
                            ],
                        ]],
                    ],
                    'finish_reason' => null,
                ]],
            ]));
            $fEmit($this->sse([
                'id' => $sId,
                'object' => 'chat.completion.chunk',
                'choices' => [[
                    'index' => 0,
                    'delta' => [
                        'tool_calls' => [[
                            'index' => $iIndex,
                            'function' => [
                                'arguments' => $sArgs,
                            ],
                        ]],
                    ],
                    'finish_reason' => null,
                ]],
            ]));
            $iIndex++;
        }
        $fEmit($this->sse([
            'id' => $sId,
            'object' => 'chat.completion.chunk',
            'choices' => [[
                'index' => 0,
                'delta' => new stdClass(),
                'finish_reason' => 'tool_calls',
            ]],
        ]));
    }

    protected function completionArray(string $sId, NeuronAI\Chat\Messages\Message $oMessage): array
    {
        $aMessage = [
            'role' => 'assistant',
            'content' => $oMessage->getContent(),
        ];
        $sFinish = 'stop';
        if ($oMessage instanceof NeuronAI\Chat\Messages\ToolCallMessage) {
            $sFinish = 'tool_calls';
            $aCalls = [];
            foreach ($oMessage->getTools() as $oTool) {
                $aInputs = $oTool->getInputs();
                $aCalls[] = [
                    'id' => (string)($oTool->getCallId() ?? ''),
                    'type' => 'function',
                    'function' => [
                        'name' => $oTool->getName(),
                        'arguments' => json_encode($aInputs === [] ? new stdClass() : $aInputs, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    ],
                ];
            }
            $aMessage['tool_calls'] = $aCalls;
            if ($aMessage['content'] === null || $aMessage['content'] === '')
                $aMessage['content'] = null;
        }

        return [
            'id' => $sId,
            'object' => 'chat.completion',
            'choices' => [[
                'index' => 0,
                'message' => $aMessage,
                'finish_reason' => $sFinish,
            ]],
        ];
    }

    protected function contentDelta(string $sId, string $sContent): string
    {
        return $this->sse([
            'id' => $sId,
            'object' => 'chat.completion.chunk',
            'choices' => [[
                'index' => 0,
                'delta' => ['content' => $sContent],
                'finish_reason' => null,
            ]],
        ]);
    }

    protected function sse(array $aPayload): string
    {
        return 'data: ' . json_encode($aPayload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n\n";
    }

    protected function logProvider(Throwable $oException): void
    {
        bx_log('sys_agents', 'AI proxy provider failed: ' . $oException->getMessage(), BX_LOG_ERR);
    }
}

/** @} */
