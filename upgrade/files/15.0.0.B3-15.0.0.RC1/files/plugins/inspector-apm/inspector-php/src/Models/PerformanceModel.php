<?php

declare(strict_types=1);

namespace Inspector\Models;

use function microtime;
use function round;

abstract class PerformanceModel extends Model
{
    public int|float $timestamp;
    public int|float|null $duration = null;

    /**
     * Start the timer.
     */
    public function start(int|float|null $timestamp = null): PerformanceModel
    {
        $this->timestamp = $timestamp ?? microtime(true);
        return $this;
    }

    /**
     * Stop the timer and calculate the duration.
     */
    public function end(int|float|null $duration = null): PerformanceModel
    {
        $this->duration = $duration ?? round((microtime(true) - $this->timestamp) * 1000, 2); // milliseconds
        return $this;
    }
}
