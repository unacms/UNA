<?php

declare(strict_types=1);

namespace Inspector\Models;

use Inspector\Inspector;
use Inspector\Models\Partials\Host;
use Inspector\SegmentStack;

use function hash;
use function microtime;
use function random_int;
use function round;

class Segment extends PerformanceModel
{
    public ?string $model = 'segment';
    public int|float $start;
    public ?string $color = null;
    public array $transaction;
    public Host $host;
    public string $hash;
    public ?string $parent_hash = null;

    /**
     * Reference to the SegmentStack (Inspector or Scope) for managing segment lifecycle.
     */
    protected ?SegmentStack $stackManager = null;

    /**
     * Span constructor.
     */
    public function __construct(
        Transaction $transaction,
        public string $type = 'process',
        public ?string $label = null
    ) {
        $this->host = new Host();
        $this->transaction = $transaction->only(['name', 'hash', 'timestamp']);
        $this->hash = $this->generateHash();
    }

    /**
     * Set the SegmentStack instance for managing segment lifecycle.
     */
    public function setStackManager(SegmentStack $stackManager): Segment
    {
        $this->stackManager = $stackManager;
        return $this;
    }

    /**
     * Set the Inspector instance for managing segment lifecycle.
     *
     * @deprecated Use setStackManager() instead.
     */
    public function setInspector(Inspector $inspector): Segment
    {
        $this->stackManager = $inspector;
        return $this;
    }

    /**
     * Set the parent segment hash.
     */
    public function setParent(?string $parentHash): Segment
    {
        $this->parent_hash = $parentHash;
        return $this;
    }

    /**
     * Start the timer.
     */
    public function start(int|float|null $timestamp = null): Segment
    {
        $initial = $timestamp ?? microtime(true);

        $this->start = round(($initial - $this->transaction['timestamp']) * 1000, 2);
        parent::start($timestamp);
        return $this;
    }

    /**
     * End the segment and notify Inspector to remove from open segments.
     */
    public function end(int|float|null $duration = null): Segment
    {
        parent::end($duration);

        // Notify the stack manager that this segment has ended
        $this->stackManager?->endSegment($this);

        return $this;
    }

    public function setColor(string $color): Segment
    {
        $this->color = $color;
        return $this;
    }

    /**
     * Generate a unique hash for this segment.
     */
    protected function generateHash(): string
    {
        return hash('sha256', $this->type . $this->label . microtime(true) . random_int(100, 9999));
    }

    /**
     * Get the segment hash.
     */
    public function getHash(): string
    {
        return $this->hash;
    }
}
