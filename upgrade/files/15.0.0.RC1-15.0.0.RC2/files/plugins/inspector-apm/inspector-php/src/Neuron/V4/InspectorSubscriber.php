<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use Inspector\Configuration;
use Inspector\Exceptions\InspectorException;
use Inspector\Inspector;
use Inspector\Models\Segment;
use Inspector\Scope;
use NeuronAI\Agent\Agent;
use NeuronAI\Chat\Enums\SourceType;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Observability\Events\AgentError;
use NeuronAI\Observability\Events\BranchEnd;
use NeuronAI\Observability\Events\BranchStart;
use NeuronAI\Observability\Events\ChannelError;
use NeuronAI\Observability\Events\Deserialized;
use NeuronAI\Observability\Events\Deserializing;
use NeuronAI\Observability\Events\Extracted;
use NeuronAI\Observability\Events\Extracting;
use NeuronAI\Observability\Events\InferenceStart;
use NeuronAI\Observability\Events\InferenceStop;
use NeuronAI\Observability\Events\MemoryRecalled;
use NeuronAI\Observability\Events\MemoryRecalling;
use NeuronAI\Observability\Events\MemoryStored;
use NeuronAI\Observability\Events\MemoryStoring;
use NeuronAI\Observability\Events\MessageSaved;
use NeuronAI\Observability\Events\MessageSaving;
use NeuronAI\Observability\Events\MiddlewareEnd;
use NeuronAI\Observability\Events\MiddlewareStart;
use NeuronAI\Observability\Events\PostProcessed;
use NeuronAI\Observability\Events\PostProcessing;
use NeuronAI\Observability\Events\PreProcessed;
use NeuronAI\Observability\Events\PreProcessing;
use NeuronAI\Observability\Events\Retrieved;
use NeuronAI\Observability\Events\Retrieving;
use NeuronAI\Observability\Events\SchemaGenerated;
use NeuronAI\Observability\Events\SchemaGeneration;
use NeuronAI\Observability\Events\ToolCalled;
use NeuronAI\Observability\Events\ToolCalling;
use NeuronAI\Observability\Events\Validated;
use NeuronAI\Observability\Events\Validating;
use NeuronAI\Observability\Events\WorkflowEnd;
use NeuronAI\Observability\Events\WorkflowInterrupted;
use NeuronAI\Observability\Events\WorkflowNodeEnd;
use NeuronAI\Observability\Events\WorkflowNodeStart;
use NeuronAI\Observability\Events\WorkflowStart;
use NeuronAI\Observability\ObservabilityEvent;
use NeuronAI\Tools\ProviderToolInterface;
use NeuronAI\Tools\ToolInterface;
use NeuronAI\Tools\Toolkits\ToolkitInterface;
use NeuronAI\Tools\ToolPropertyInterface;
use NeuronAI\Workflow\Workflow;

use function array_map;
use function strrchr;
use function substr;

/**
 * Trace your AI agents and workflows built with Neuron AI 4.x through the
 * PSR-14 observability system, to detect errors and performance bottlenecks
 * in real-time.
 *
 * The subscriber is a PSR-14 listener: attach it to a workflow (or agent) with
 *
 *     $subscriber = InspectorSubscriber::instance();
 *     $agent->subscribe(ObservabilityEvent::class, $subscriber);
 *
 * or, equivalently, `$subscriber->subscribe($agent)`. Each Workflow instance
 * owns its own dispatcher, so the same subscriber can be attached to multiple
 * concurrent workflows and isolates open segments by branch and by run.
 */
class InspectorSubscriber
{
    use HandleWorkflowEvents;
    use HandleInferenceEvents;
    use HandleToolEvents;
    use HandleRagEvents;
    use HandleStructuredEvents;
    use HandleMemoryEvents;

    public const SEGMENT_TYPE = 'agent';
    public const STANDARD_COLOR = '#FF800C';

    /**
     * Open segments keyed by "{scope}::{phase}".
     *
     * @var array<string, Segment>
     */
    protected array $segments = [];

    /**
     * Forked Inspector scopes for concurrent parallel branches, keyed by branchId.
     *
     * @var array<string, Scope>
     */
    protected array $branchScopes = [];

    protected static ?InspectorSubscriber $instance = null;

    /**
     * Whether the subscriber started the current transaction itself. The
     * payload is flushed automatically at WorkflowEnd only when the
     * subscriber owns the transaction lifecycle; a transaction opened by the
     * host application is left to the host.
     *
     * @var bool
     */
    protected bool $ownsTransaction = false;

    public function __construct(
        protected Inspector $inspector,
    ) {
    }

    /**
     * Build a subscriber from environment configuration, mirroring the
     * INSPECTOR_* environment variables supported by the platform SDKs.
     *
     * @throws InspectorException
     */
    public static function instance(
        ?string $key = null,
        ?string $transport = null,
        ?int $maxItems = null,
        bool $splitMonitoring = false,
    ): self {
        $configuration = new Configuration($key ?? $_ENV['INSPECTOR_INGESTION_KEY'] ?? null);
        $configuration->setTransport($transport ?? $_ENV['INSPECTOR_TRANSPORT'] ?? 'async');
        $configuration->setMaxItems((int) ($maxItems ?? $_ENV['INSPECTOR_MAX_ITEMS'] ?? $configuration->getMaxItems()));

        if (isset($_ENV['INSPECTOR_URL'])) {
            $configuration->setUrl($_ENV['INSPECTOR_URL']);
        }

        /*
         * Split monitoring between agents and workflows.
         * Each workflow owns its own dispatcher, so a shared listener instance
         * is safe by default; splitting creates a dedicated Inspector per class.
         */
        if (isset($_ENV['NEURON_SPLIT_MONITORING']) || $splitMonitoring) {
            return new self(new Inspector($configuration));
        }

        if (!self::$instance instanceof self) {
            self::$instance = new self(new Inspector($configuration));
        }

        return self::$instance;
    }

    /**
     * Register this listener on the given workflow or agent, receiving
     * every ObservabilityEvent it dispatches.
     */
    public function subscribe(Workflow $workflow): void
    {
        $workflow->subscribe(ObservabilityEvent::class, $this);
    }

    /**
     * PSR-14 listener entry point. Receives every ObservabilityEvent when
     * subscribed with ObservabilityEvent::class.
     */
    public function __invoke(ObservabilityEvent $event): void
    {
        match ($event::class) {
            AgentError::class => $this->error($event),
            ChannelError::class => $this->channelError($event),

            WorkflowStart::class => $this->workflowStart($event),
            WorkflowEnd::class => $this->workflowEnd($event),
            WorkflowInterrupted::class => $this->workflowInterrupted($event),
            WorkflowNodeStart::class => $this->nodeStart($event),
            WorkflowNodeEnd::class => $this->nodeEnd($event),
            BranchStart::class => $this->branchStart($event),
            BranchEnd::class => $this->branchEnd($event),
            MiddlewareStart::class => $this->middlewareStart($event),
            MiddlewareEnd::class => $this->middlewareEnd($event),

            MessageSaving::class => $this->messageSaving($event),
            MessageSaved::class => $this->messageSaved($event),
            InferenceStart::class => $this->inferenceStart($event),
            InferenceStop::class => $this->inferenceStop($event),
            ToolCalling::class => $this->toolCalling($event),
            ToolCalled::class => $this->toolCalled($event),

            MemoryRecalling::class => $this->memoryRecalling($event),
            MemoryRecalled::class => $this->memoryRecalled($event),
            MemoryStoring::class => $this->memoryStoring($event),
            MemoryStored::class => $this->memoryStored($event),

            SchemaGeneration::class => $this->schemaGeneration($event),
            SchemaGenerated::class => $this->schemaGenerated($event),
            Extracting::class => $this->extracting($event),
            Extracted::class => $this->extracted($event),
            Deserializing::class => $this->deserializing($event),
            Deserialized::class => $this->deserialized($event),
            Validating::class => $this->validating($event),
            Validated::class => $this->validated($event),

            Retrieving::class => $this->ragRetrieving($event),
            Retrieved::class => $this->ragRetrieved($event),
            PreProcessing::class => $this->preProcessing($event),
            PreProcessed::class => $this->preProcessed($event),
            PostProcessing::class => $this->postProcessing($event),
            PostProcessed::class => $this->postProcessed($event),

            default => null,
        };
    }

    /**
     * Resolve the Inspector Scope for the branch the event belongs to.
     *
     * Returns the forked Scope for known parallel branches, or the main
     * Inspector for the main execution path.
     */
    protected function resolveScope(ObservabilityEvent $event): Inspector|Scope
    {
        if ($event->branchId !== null && isset($this->branchScopes[$event->branchId])) {
            return $this->branchScopes[$event->branchId];
        }

        return $this->inspector;
    }

    /**
     * Stable scope key for segment registries, isolating concurrent branches.
     */
    protected function scopeKey(ObservabilityEvent $event): string
    {
        return $event->branchId ?? '__main__';
    }

    /**
     * Strip base64 payloads from message content blocks before attaching
     * them to segment context.
     *
     * @param Message $item
     * @return array<string, mixed>
     */
    protected function prepareMessageItem(Message $item): array
    {
        $message = $item->jsonSerialize();
        if (isset($message['content'])) {
            $message['content'] = array_map(function (array $block): array {
                if (($block['source_type'] ?? null) === SourceType::BASE64
                    || ($block['source_type'] ?? null) === SourceType::BASE64->value
                ) {
                    unset($block['source']);
                }
                return $block;
            }, $message['content']);
        }

        return $message;
    }

    /**
     * @return array<string, mixed>
     */
    protected function getAgentContext(Agent $agent): array
    {
        $mapTool = fn (ToolInterface $tool): array => [
            $tool->getName() => [
                'description' => $tool->getDescription(),
                'properties' => array_map(
                    fn (ToolPropertyInterface $property) => $property->jsonSerialize(),
                    $tool->getProperties()
                ),
            ],
        ];

        return [
            'Agent' => [
                'provider' => $agent->getProvider()::class,
                'instructions' => (string) $agent->getInstructions()->getContent(),
            ],
            'Tools' => array_map(fn (ToolInterface|ToolkitInterface|ProviderToolInterface $tool) => match (true) {
                $tool instanceof ToolInterface => $mapTool($tool),
                $tool instanceof ToolkitInterface => [$tool::class => array_map($mapTool, $tool->tools())],
                default => $tool->jsonSerialize(),
            }, $agent->getTools()),
        ];
    }

    protected function getBaseClassName(string $class): string
    {
        return substr((string) strrchr($class, '\\'), 1);
    }
}
