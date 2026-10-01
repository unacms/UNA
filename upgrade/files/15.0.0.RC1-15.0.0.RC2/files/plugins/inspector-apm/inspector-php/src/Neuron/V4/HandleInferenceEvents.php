<?php

declare(strict_types=1);

namespace Inspector\Neuron\V4;

use Inspector\Models\Segment;
use Inspector\Models\Token;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Chat\Messages\Usage;
use NeuronAI\Observability\Events\InferenceStart;
use NeuronAI\Observability\Events\InferenceStop;
use NeuronAI\Observability\Events\MessageSaved;
use NeuronAI\Observability\Events\MessageSaving;

use function array_key_exists;

trait HandleInferenceEvents
{
    /**
     * Open inference segments keyed by branch scope key.
     *
     * @var array<string, Segment>
     */
    protected array $inferences = [];

    public function messageSaving(MessageSaving $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $label = $this->getBaseClassName($event->message::class);
        $key = $this->scopeKey($event).':'.($event->message->getMetadata('__id') ?? $event->message::class);

        $this->segments[$key] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.chathistory', "save_message( {$label} )")
            ->setColor(self::STANDARD_COLOR);
    }

    public function messageSaved(MessageSaved $event): void
    {
        $key = $this->scopeKey($event).':'.($event->message->getMetadata('__id') ?? $event->message::class);

        if (!array_key_exists($key, $this->segments)) {
            return;
        }

        $segment = $this->segments[$key];
        unset($this->segments[$key]);

        $segment->addContext('Message', $this->prepareMessageItem($event->message));
        $segment->end();
    }

    public function inferenceStart(InferenceStart $event): void
    {
        if (!$this->inspector->canAddSegments()) {
            return;
        }

        $label = $this->getBaseClassName($event->message::class);

        $this->inferences[$this->scopeKey($event)] = $this->resolveScope($event)
            ->startSegment(self::SEGMENT_TYPE.'.inference', "inference( {$label} )")
            ->setColor(self::STANDARD_COLOR);
    }

    public function inferenceStop(InferenceStop $event): void
    {
        $key = $this->scopeKey($event);

        if (!array_key_exists($key, $this->inferences)) {
            return;
        }

        $segment = $this->inferences[$key];
        unset($this->inferences[$key]);

        $segment->end();

        if ($event->message instanceof Message) {
            $segment->addContext('Message', $this->prepareMessageItem($event->message));
        }

        // The event carries the inbound message the inference started from,
        // while the provider attaches token usage to the response message.
        $usage = $event->response->message()->getUsage();

        if ($usage instanceof Usage) {
            $token = new Token($this->inspector->transaction());
            $token->setInputTokens($usage->inputTokens)
                ->setOutputTokens($usage->outputTokens);
            $this->inspector->addEntries($token);
        }
    }
}
