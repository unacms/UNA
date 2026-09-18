<?php

declare(strict_types=1);

/**
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * OpenSearch PHP client
 *
 * @link      https://github.com/opensearch-project/opensearch-php/
 * @copyright Copyright (c) Elasticsearch B.V (https://www.elastic.co)
 * @license   http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @license   https://www.gnu.org/licenses/lgpl-2.1.html GNU Lesser General Public License, Version 2.1
 *
 * Licensed to Elasticsearch B.V under one or more agreements.
 * Elasticsearch B.V licenses this file to you under the Apache 2.0 License or
 * the GNU Lesser General Public License, Version 2.1, at your option.
 * See the LICENSE file in the project root for more information.
 */

namespace OpenSearch\ConnectionPool;

use OpenSearch\Common\Exceptions\Curl\OperationTimeoutException;
use OpenSearch\Common\Exceptions\NoNodesAvailableException;
use OpenSearch\ConnectionPool\Selectors\SelectorInterface;
use OpenSearch\Connections\Connection;
use OpenSearch\Connections\ConnectionFactoryInterface;
use OpenSearch\Connections\ConnectionInterface;

// @phpstan-ignore classConstant.deprecatedClass
@trigger_error(SniffingConnectionPool::class . ' is deprecated in 2.4.0 and will be removed in 3.0.0.', E_USER_DEPRECATED);

/**
 * @deprecated in 2.4.0 and will be removed in 3.0.0.
 *
 */
class SniffingConnectionPool extends AbstractConnectionPool
{
    /**
     * @var int
     */
    private $sniffingInterval;

    /**
     * @var int
     */
    private $nextSniff;

    /**
     * @param ConnectionInterface[] $connections
     * @param array<string, mixed>  $connectionPoolParams
     */
    public function __construct(
        $connections,
        SelectorInterface $selector,
        ConnectionFactoryInterface $factory,
        $connectionPoolParams
    ) {
        parent::__construct($connections, $selector, $factory, $connectionPoolParams);

        $this->setConnectionPoolParams($connectionPoolParams);
        $this->nextSniff = time() + $this->sniffingInterval;
    }

    public function nextConnection(bool $force = false): ConnectionInterface
    {
        $this->sniff($force);

        $size = count($this->connections);
        while ($size--) {
            /**
             * @var Connection $connection
             */
            $connection = $this->selector->select($this->connections);
            if ($connection->isAlive() === true || $connection->ping() === true) {
                return $connection;
            }
        }

        if ($force === true) {
            throw new NoNodesAvailableException("No alive nodes found in your cluster");
        }

        return $this->nextConnection(true);
    }

    public function scheduleCheck(): void
    {
        $this->nextSniff = -1;
    }

    private function sniff(bool $force = false): void
    {
        if ($force === false && $this->nextSniff > time()) {
            return;
        }

        $total = count($this->connections);

        while ($total--) {
            /**
             * @var Connection $connection
             */
            $connection = $this->selector->select($this->connections);

            if ($connection->isAlive() xor $force) {
                continue;
            }

            if ($this->sniffConnection($connection) === true) {
                return;
            }
        }

        if ($force === true) {
            return;
        }

        foreach ($this->seedConnections as $connection) {
            /**
             * @var Connection $connection
             */
            if ($this->sniffConnection($connection) === true) {
                return;
            }
        }
    }

    private function sniffConnection(Connection $connection): bool
    {
        try {
            $response = $connection->sniff();
        } catch (OperationTimeoutException $exception) {
            return false;
        }

        $nodes = $this->parseClusterState($response);

        if (count($nodes) === 0) {
            return false;
        }

        $this->connections = [];

        foreach ($nodes as $node) {
            $nodeDetails = [
                'host' => $node['host'],
                'port' => $node['port'],
            ];
            $this->connections[] = $this->connectionFactory->create($nodeDetails);
        }

        $this->nextSniff = time() + $this->sniffingInterval;

        return true;
    }

    /**
     * @return list<array{host: string, port: int}>
     */
    private function parseClusterState($nodeInfo): array
    {
        $pattern = '/([^:]*):(\d+)/';
        $hosts = [];

        foreach ($nodeInfo['nodes'] as $node) {
            if (isset($node['http']) === true && isset($node['http']['publish_address']) === true) {
                if (preg_match($pattern, $node['http']['publish_address'], $match) === 1) {
                    $hosts[] = [
                        'host' => $match[1],
                        'port' => (int)$match[2],
                    ];
                }
            }
        }

        return $hosts;
    }

    /**
     * @param array<string, mixed> $connectionPoolParams
     */
    private function setConnectionPoolParams(array $connectionPoolParams): void
    {
        $this->sniffingInterval = (int)($connectionPoolParams['sniffingInterval'] ?? 300);
    }
}
