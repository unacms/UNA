<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use NeuronAI\Observability\Events\Deserialized;
use NeuronAI\Observability\Events\Deserializing;
use NeuronAI\Observability\Events\Extracted;
use NeuronAI\Observability\Events\Extracting;
use NeuronAI\Observability\Events\SchemaGenerated;
use NeuronAI\Observability\Events\SchemaGeneration;
use NeuronAI\Observability\Events\Validated;
use NeuronAI\Observability\Events\Validating;

use function array_key_exists;
use function json_decode;

trait HandleStructuredEvents
{
    public function schemaGeneration(SchemaGeneration $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':schema';
        $class = $this->getBaseClassName($event->class);

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.structured-output', "schema_generate( {$class} )")
            ->setColor(self::STANDARD_COLOR);
    }

    public function schemaGenerated(SchemaGenerated $event): void
    {
        $key = $this->scopeKey($event).':schema';

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Schema', $event->schema);
        $segment->end();
    }

    public function extracting(Extracting $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':extract';

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.structured-output', 'extract_output')
            ->setColor(self::STANDARD_COLOR);
    }

    public function extracted(Extracted $event): void
    {
        $key = $this->scopeKey($event).':extract';

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Data', [
            'response' => $event->message->jsonSerialize(),
            'json' => $event->json,
        ])->addContext('Schema', $event->schema);
        $segment->end();
    }

    public function deserializing(Deserializing $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':deserialize';
        $class = $this->getBaseClassName($event->class);

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.structured-output', "deserialize( {$class} )")
            ->setColor(self::STANDARD_COLOR);
    }

    public function deserialized(Deserialized $event): void
    {
        $key = $this->scopeKey($event).':deserialize';

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Class', $event->class);
        $segment->end();
    }

    public function validating(Validating $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':validate';
        $class = $this->getBaseClassName($event->class);

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.structured-output', "validate( {$class} )")
            ->setColor(self::STANDARD_COLOR);
    }

    public function validated(Validated $event): void
    {
        $key = $this->scopeKey($event).':validate';

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Json', json_decode($event->json));

        if ($event->violations !== []) {
            $segment->addContext('Violations', $event->violations);
        }

        $segment->end();
    }
}
