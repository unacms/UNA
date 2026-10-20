<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use Inspector\Exceptions\InspectorException;
use NeuronAI\Agent\Agent;
use NeuronAI\Observability\ObservabilityEvent;
use NeuronAI\Workflow\Observability\BranchEnd;
use NeuronAI\Workflow\Observability\BranchStart;
use NeuronAI\Workflow\Observability\ChannelError;
use NeuronAI\Workflow\Observability\MiddlewareEnd;
use NeuronAI\Workflow\Observability\MiddlewareStart;
use NeuronAI\Workflow\Observability\NodeOutcome;
use NeuronAI\Workflow\Observability\WorkflowEnd;
use NeuronAI\Workflow\Observability\WorkflowError;
use NeuronAI\Workflow\Observability\WorkflowInterrupted;
use NeuronAI\Workflow\Observability\WorkflowNodeEnd;
use NeuronAI\Workflow\Observability\WorkflowNodeStart;
use NeuronAI\Workflow\Observability\WorkflowStart;
use NeuronAI\Workflow\Interrupt\InterruptRequest;
use NeuronAI\Workflow\NodeInterface;
use NeuronAI\Workflow\WorkflowStatus;
use Exception;

use function array_key_exists;
use function array_keys;
use function array_map;
use function array_values;

trait HandleWorkflowEvents
{
    /**
     * Start the Inspector transaction for the workflow run, or open a
     * workflow segment when a transaction already exists (host-managed
     * monitoring).
     */
    public function workflowStart(WorkflowStart $event): void
    {
        if (!$this->inspector->isRecording()) {
            return;
        }

        $mapping = array_map(fn (string $eventClass, NodeInterface $node): array => [
            $eventClass => $node::class,
        ], array_keys($event->eventNodeMap), array_values($event->eventNodeMap));

        $name = $event->source !== null ? $event->source::class : 'workflow';

        if ($this->inspector->needTransaction()) {
            $this->ownsTransaction = true;

            $this->inspector->startTransaction($name)
                ->setResult('success') // success by default, it can be changed during execution
                ->addContext('Mapping', $mapping)
                ->addContext('Execution', $this->getExecutionContext($event));
            $this->inspector->transaction()->setType('agent');
        } elseif ($this->inspector->canAddSegments()) {
            $this->segments['workflow:'.$this->scopeKey($event)] = $this->resolveScope($event)
                ->startSegment(self::SEGMENT_TYPE.'.workflow', $this->getBaseClassName($name))
                ->setColor(self::STANDARD_COLOR);

            $this->segments['workflow:'.$this->scopeKey($event)]
                ->addContext('Mapping', $mapping)
                ->addContext('Execution', $this->getExecutionContext($event));
        }
    }

    /**
     * Close the workflow segment, or enrich the transaction with the final
     * state and the agent context, then flush the payload. The executor
     * dispatches WorkflowEnd for every terminal state — completed,
     * suspended, and failed — so each run cycle is always reported and
     * closed. The state status is the authoritative run outcome: a failed
     * run marks the transaction as error.
     */
    public function workflowEnd(WorkflowEnd $event): void
    {
        $key = 'workflow:'.$this->scopeKey($event);

        if (array_key_exists($key, $this->segments)) {
            $segment = $this->segments[$key];
            unset($this->segments[$key]);

            $segment->end()
                ->addContext('State', $event->state->except('__steps'))
                ->addContext('Status', $event->state->getStatus()->value);

            if ($event->source instanceof Agent) {
                foreach ($this->getAgentContext($event->source) as $contextKey => $value) {
                    $segment->addContext($contextKey, $value);
                }
            }

            return;
        }

        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $transaction = $this->inspector->transaction();
        $transaction->addContext('State', $event->state->except('__steps'))
            ->addContext('Status', $event->state->getStatus()->value);

        if ($event->state->getStatus() === WorkflowStatus::Failed) {
            $transaction->setResult('error');
        }

        if ($event->source instanceof Agent) {
            foreach ($this->getAgentContext($event->source) as $contextKey => $value) {
                $transaction->addContext($contextKey, $value);
            }
        }

        if ($this->ownsTransaction) {
            $this->ownsTransaction = false;
            $this->inspector->flush();
        }
    }

    /**
     * A run suspended waiting for external input is a scheduled pause, not
     * a failure: record the current interrupt request as transaction context.
     */
    public function workflowInterrupted(WorkflowInterrupted $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $request = $event->state->getInterruptRequest();

        if ($request instanceof InterruptRequest) {
            $this->inspector->transaction()->addContext('Interrupt', $request->jsonSerialize());
        }
    }

    /**
     * The executor reports both run failures and isolated listener failures
     * as handled WorkflowErrors: the transaction result is decided at
     * WorkflowEnd from the state status, unless the error is explicitly
     * flagged as unhandled.
     *
     * @throws Exception
     */
    public function error(WorkflowError $event): void
    {
        $this->inspector->reportException($event->exception, !$event->unhandled);

        if ($event->unhandled) {
            $this->inspector->transaction()->setResult('error');
        }
    }

    /**
     * A channel delivery failure never fails the run: report it as a
     * handled exception.
     * @throws Exception
     */
    public function channelError(ChannelError $event): void
    {
        $this->inspector->reportException($event->exception, true);
    }

    /**
     * @throws InspectorException
     */
    public function branchStart(BranchStart $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        // Fork at the moment the branch starts, while the triggering node's
        // segment is still open in the parent scope — this gives branches
        // correct nesting.
        $this->branchScopes[$this->scopeKey($event)] = $this->inspector->fork();
    }

    public function branchEnd(BranchEnd $event): void
    {
        unset($this->branchScopes[$this->scopeKey($event)]);
    }

    public function nodeStart(WorkflowNodeStart $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).'::'.$event->node;

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.node', $this->getBaseClassName($event->node))
            ->setColor(self::STANDARD_COLOR);

        $this->segments[$key]->addContext('State Before', $event->state->except('__steps'));
    }

    public function nodeEnd(WorkflowNodeEnd $event): void
    {
        $key = $this->scopeKey($event).'::'.$event->node;

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->end()
            ->addContext('State After', $event->state->except('__steps'))
            ->addContext('Outcome', $event->outcome->value);
    }

    public function middlewareStart(MiddlewareStart $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $class = $event->middleware::class;
        $key = $this->scopeKey($event).'::'.$class.'::'.$event->phase;

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(
                self::SEGMENT_TYPE.'.middleware',
                $this->getBaseClassName($class).'::'.$event->phase.'()'
            )
            ->setColor(self::STANDARD_COLOR);

        $this->segments[$key]->addContext('Event', $event->event::class);
    }

    public function middlewareEnd(MiddlewareEnd $event): void
    {
        $class = $event->middleware::class;
        $key = $this->scopeKey($event).'::'.$class.'::'.$event->phase;

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->end();

        if ($event->outcome !== NodeOutcome::Completed) {
            $segment->addContext('Outcome', $event->outcome->value);
        }
    }

    /**
     * Run identity stamped on the event at dispatch time.
     *
     * @return array<string, mixed>
     */
    protected function getExecutionContext(ObservabilityEvent $event): array
    {
        if ($event->execution === null) {
            return [];
        }

        return [
            'workflowId' => $event->execution->workflowId,
            'runId' => $event->execution->runId,
            'executionAttempt' => $event->execution->executionAttempt,
        ];
    }
}
