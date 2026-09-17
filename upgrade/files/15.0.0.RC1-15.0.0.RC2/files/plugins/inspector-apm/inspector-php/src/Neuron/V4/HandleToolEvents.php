<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use Inspector\Exceptions\InspectorException;
use Inspector\Models\Segment;
use NeuronAI\Observability\Events\ToolCalled;
use NeuronAI\Observability\Events\ToolCalling;

use function array_key_exists;
use function spl_object_id;

trait HandleToolEvents
{
    /**
     * Open tool call segments keyed by branch scope and ToolCall instance.
     *
     * @var array<string, Segment>
     */
    protected array $toolCalls = [];

    /**
     * @throws InspectorException
     */
    public function toolCalling(ToolCalling $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        // $event->fork is true when tools run in parallel child processes
        // (pcntl_fork). In that case we fork from the current branch scope so
        // the tool segment is correctly nested under the branch.
        $scope = $event->fork ? $this->resolveScope($event)->fork() : $this->resolveScope($event);

        $key = $this->scopeKey($event).':'.spl_object_id($event->tool);

        $name = $event->tool->getName();

        $this->toolCalls[$key] = $scope->startSegment(
            self::SEGMENT_TYPE.'.tool',
            "tool_call( {$name} )"
        )
            ->setColor(self::STANDARD_COLOR);
    }

    public function toolCalled(ToolCalled $event): void
    {
        $key = $this->scopeKey($event).':'.spl_object_id($event->tool);

        if (!array_key_exists($key, $this->toolCalls)) {
            return;
        }

        $segment = $this->toolCalls[$key];
        unset($this->toolCalls[$key]);

        $segment->addContext('Inputs', $event->tool->getInputs());

        if ($event->tool->hasResult()) {
            $segment->addContext('Output', $event->tool->getResult());
        }

        $segment->end();
    }
}
