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

namespace OpenSearch\Serializers;

use OpenSearch\Exception\JsonException;
use OpenSearch\Exception\RuntimeException;

if (!defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
    //PHP < 7.2 Define it as 0 so it does nothing
    define('JSON_INVALID_UTF8_SUBSTITUTE', 0);
}

class SmartSerializer implements SerializerInterface
{
    /**
     * {@inheritdoc}
     */
    public function serialize($data): string
    {
        if (is_string($data) === true) {
            return $data;
        } else {
            $data = json_encode($data, JSON_PRESERVE_ZERO_FRACTION + JSON_INVALID_UTF8_SUBSTITUTE);
            if ($data === false) {
                throw new RuntimeException("Failed to JSON encode: ".json_last_error_msg());
            }
            if ($data === '[]') {
                return '{}';
            } else {
                return $data;
            }
        }
    }

    /**
     * {@inheritdoc}
     */
    public function deserialize(?string $data, array $headers)
    {
        if ($this->isJson($headers)) {
            return $this->decode($data);
        }
        return $data;
    }

    /**
     * Decode JSON data.
     *
     * @throws \OpenSearch\Exception\JsonException
     */
    private function decode(?string $data): array
    {
        if ($data === null || strlen($data) === 0) {
            return [];
        }

        try {
            return json_decode($data, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            if ($e->getCode() === JSON_ERROR_UTF16) {
                $escaped = str_replace('\\', '\\\\', $data);
                try {
                    return json_decode($escaped, true, 512, JSON_THROW_ON_ERROR);
                } catch (\JsonException $e) {
                    throw new JsonException($e->getCode(), $escaped, $e);
                }
            }

            throw new JsonException($e->getCode(), $data, $e);
        }
    }

    /**
     * Check the response content type to see if it is JSON.
     *
     * @param array<string,mixed> $headers
     */
    private function isJson(array $headers): bool
    {
        // Legacy support for 'transfer_stats'.
        if (!empty($headers['content_type'])) {
            return str_contains($headers['content_type'], 'json');
        }

        // Check PSR-7 headers.
        $lowercaseHeaders = array_change_key_case($headers, CASE_LOWER);
        if (array_key_exists('content-type', $lowercaseHeaders)) {
            foreach ($lowercaseHeaders['content-type'] as $type) {
                if (str_contains($type, 'json')) {
                    return true;
                }
            }
            return false;
        }

        // No content type header, so assume it is JSON.
        return true;
    }
}
