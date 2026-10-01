<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use NeuronAI\Observability\Events\MemoryRecalled;
use NeuronAI\Observability\Events\MemoryRecalling;
use NeuronAI\Observability\Events\MemoryStored;
use NeuronAI\Observability\Events\MemoryStoring;

use function array_key_exists;

trait HandleMemoryEvents
{
    /**
     * Delimit the actual memory recall boundary. A failure emits
     * MemoryRecalling and AgentError, but no completion event: the open
     * segment stays open until the transaction flushes.
     */
    public function memoryRecalling(MemoryRecalling $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':memory-recall';

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.memory', 'memory_recall()')
            ->setColor(self::STANDARD_COLOR);
    }

    public function memoryRecalled(MemoryRecalled $event): void
    {
        $key = $this->scopeKey($event).':memory-recall';

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Memories', $event->memoryCount);
        $segment->end();
    }

    public function memoryStoring(MemoryStoring $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':memory-store';

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.memory', 'memory_store()')
            ->setColor(self::STANDARD_COLOR);
    }

    public function memoryStored(MemoryStored $event): void
    {
        $key = $this->scopeKey($event).':memory-store';

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->end();
    }
}
