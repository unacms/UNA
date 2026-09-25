<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use NeuronAI\Observability\Events\PostProcessed;
use NeuronAI\Observability\Events\PostProcessing;
use NeuronAI\Observability\Events\PreProcessed;
use NeuronAI\Observability\Events\PreProcessing;
use NeuronAI\Observability\Events\Retrieved;
use NeuronAI\Observability\Events\Retrieving;

use function array_key_exists;
use function count;
use function md5;

trait HandleRagEvents
{
    public function ragRetrieving(Retrieving $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $questionText = (string) $event->question->getContent();
        $key = $this->scopeKey($event).':'.md5($questionText.$event->question->getRole());

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.retrieval', "vector_retrieval( {$questionText} )")
            ->setColor(self::STANDARD_COLOR);
    }

    public function ragRetrieved(Retrieved $event): void
    {
        $questionText = (string) $event->question->getContent();
        $key = $this->scopeKey($event).':'.md5($questionText.$event->question->getRole());

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Data', [
            'question' => $questionText,
            'documents' => count($event->documents),
        ]);
        $segment->end();
    }

    public function preProcessing(PreProcessing $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':'.$event->processor;

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.preprocessing', $event->processor)
            ->setColor(self::STANDARD_COLOR);

        $this->segments[$key]->addContext('Original', $event->original->jsonSerialize());
    }

    public function preProcessed(PreProcessed $event): void
    {
        $key = $this->scopeKey($event).':'.$event->processor;

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Processed', $event->processed->jsonSerialize());
        $segment->end();
    }

    public function postProcessing(PostProcessing $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $key = $this->scopeKey($event).':'.$event->processor;

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.postprocessing', $event->processor)
            ->setColor(self::STANDARD_COLOR);

        $this->segments[$key]->addContext('Question', $event->question->jsonSerialize())
            ->addContext('Documents', $event->documents);
    }

    public function postProcessed(PostProcessed $event): void
    {
        $key = $this->scopeKey($event).':'.$event->processor;

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('PostProcess', $event->documents);
        $segment->end();
    }
}
