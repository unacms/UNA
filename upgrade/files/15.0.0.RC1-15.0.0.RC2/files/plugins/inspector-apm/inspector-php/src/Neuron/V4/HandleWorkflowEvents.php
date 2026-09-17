<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use Inspector\Exceptions\InspectorException;
use NeuronAI\Agent\Agent;
use NeuronAI\Observability\Events\AgentError;
use NeuronAI\Observability\Events\BranchEnd;
use NeuronAI\Observability\Events\BranchStart;
use NeuronAI\Observability\Events\ChannelError;
use NeuronAI\Observability\Events\MiddlewareEnd;
use NeuronAI\Observability\Events\MiddlewareStart;
use NeuronAI\Observability\Events\WorkflowEnd;
use NeuronAI\Observability\Events\WorkflowInterrupted;
use NeuronAI\Observability\Events\WorkflowNodeEnd;
use NeuronAI\Observability\Events\WorkflowNodeStart;
use NeuronAI\Observability\Events\WorkflowStart;
use NeuronAI\Workflow\Interrupt\InterruptRequest;
use NeuronAI\Workflow\NodeInterface;
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
                ->addContext('Mapping', $mapping);
            $this->inspector->transaction()->setType('agent');
        } elseif ($this->inspector->canAddSegments()) {
            $this->segments['workflow:'.$this->scopeKey($event)] = $this->resolveScope($event)
                ->startSegment(self::SEGMENT_TYPE.'.workflow', $this->getBaseClassName($name))
                ->setColor(self::STANDARD_COLOR);

            $this->segments['workflow:'.$this->scopeKey($event)]
                ->addContext('Mapping', $mapping);
        }
    }

    /**
     * Close the workflow segment, or enrich the transaction with the final
     * state and the agent context, then flush the payload. The executor
     * dispatches WorkflowEnd for every terminal state — completed,
     * interrupted (paused), and failed (after AgentError) — so each run
     * cycle is always reported and closed.
     */
    public function workflowEnd(WorkflowEnd $event): void
    {
        $key = 'workflow:'.$this->scopeKey($event);

        if (array_key_exists($key, $this->segments)) {
            $segment = $this->segments[$key];
            unset($this->segments[$key]);

            $segment->end()
                ->addContext('State', $event->state->except('__steps'));

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
        $transaction->addContext('State', $event->state->except('__steps'));

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
     * a failure: record the interrupt requests as transaction context.
     */
    public function workflowInterrupted(WorkflowInterrupted $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $this->inspector->transaction()->addContext('Interrupt', array_map(
            fn (InterruptRequest $request): array => $request->jsonSerialize(),
            array_values($event->state->getInterruptRequests()),
        ));
    }

    /**
     * @throws Exception
     */
    public function error(AgentError $event): void
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
        $this->branchScopes[$event->branchId] = $this->inspector->fork();
    }

    public function branchEnd(BranchEnd $event): void
    {
        unset($this->branchScopes[$event->branchId]);
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
            ->addContext('State After', $event->state->except('__steps'));
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

        $this->segments[$key]->end();
        unset($this->segments[$key]);
    }
}
