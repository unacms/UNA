#!/usr/bin/env php
<?php

/**
 * SQL Update Script Generator
 * Generates SQL update scripts 
 * 
 * Usage: php script.php MODULE_NAME VERSION [--old-install=file] [--new-install=file] [--old-enable=file] [--new-enable=file]
 */

class SQLUpdateChecker {
    private $moduleName;
    private $version;
    private $updatePath;
    private $apiKey;
    private $results = [];
    private $inputFiles = [];
    
    const ENGINE = 'openai'; // 'deepseek' or 'openai'

    const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    const MODEL_VER = 5;
//    const MODEL = 'gpt-4-turbo';
    const MODEL = 'gpt-5.6-terra'; // 'gpt-5-mini';
    const MAX_TOKENS_PER_REQUEST = 140000; // Conservative limit for model context // 120000 for gpt4
    const MAX_TOKENS_GPT5 = 9000; // can be increased if "finish_reason: length" error occured
    const MAX_TOKENS = 4000;
    const TOKENS_PER_CHAR = 0.325; // Approximate tokens per character, to evaluate potential silent truncation
   
    public function __construct($moduleName, $version, $args) {
        $this->moduleName = $moduleName;
        $this->version = $version;
        $this->parseInputFiles($args);
        $this->loadApiKey();
        $this->findUpdatePath();
    }
    
    private function parseInputFiles($args) {
        $fileOptions = [
            '--old-install' => 'old_install',
            '--new-install' => 'new_install',
            '--old-enable' => 'old_enable',
            '--new-enable' => 'new_enable'
        ];
        
        foreach ($args as $arg) {
            foreach ($fileOptions as $option => $key) {
                if (strpos($arg, $option . '=') === 0) {
                    $file = substr($arg, strlen($option) + 1);
                    if (!file_exists($file)) {
                        $this->error("File not found: $file");
                    }
                    $this->inputFiles[$key] = $file;
                }
            }
        }
        
        // Validate: either all files provided or none
        $providedCount = count($this->inputFiles);
        if ($providedCount > 0 && $providedCount < 4) {
            $this->error("Input files must be provided for all or none. Required: --old-install, --new-install, --old-enable, --new-enable");
        }
        
        if ($providedCount === 4) {
            echo "✓ Using input files:\n";
            echo "  - Old install.sql: {$this->inputFiles['old_install']}\n";
            echo "  - New install.sql: {$this->inputFiles['new_install']}\n";
            echo "  - Old enable.sql: {$this->inputFiles['old_enable']}\n";
            echo "  - New enable.sql: {$this->inputFiles['new_enable']}\n";
        }
    }

    private function loadApiKey() {
        $keyFile = $_SERVER['HOME'] . '/.una_update_script_gen';
        if (!file_exists($keyFile)) {
            $this->error("API key file not found: $keyFile");
        }
        
        $this->apiKey = trim(file_get_contents($keyFile));
        if (empty($this->apiKey)) {
            $this->error("API key is empty in $keyFile");
        }
    }
    
    private function findUpdatePath() {

        $basePattern = "modules/boonex/{$this->moduleName}/updates/*_{$this->version}";
        if ('system' == $this->moduleName)
            $basePattern = "upgrade/files/*-{$this->version}";
    
        $paths = glob($basePattern);
        
        if (empty($paths)) {
            $this->error("No update folder found matching pattern: $basePattern");
        }
        
        if (count($paths) > 1) {
            $this->error("Multiple update folders found: " . implode(', ', $paths));
        }
        
        $this->updatePath = $paths[0];
        echo "✓ Found update path: {$this->updatePath}\n\n";
    }
    
    private function error($message) {
        echo "ERROR: $message\n";
        exit(1);
    }
    
    private function readFile($relativePath) {
        $fullPath = $this->updatePath . '/' . $relativePath;
        if (!file_exists($fullPath)) {
            return null;
        }
        return file_get_contents($fullPath);
    }
    
    private function getContentFromFile($fileKey) {
        if (!isset($this->inputFiles[$fileKey])) {
            return null;
        }
        
        $content = file_get_contents($this->inputFiles[$fileKey]);
        if ($content === false) {
            $this->error("Failed to read file: {$this->inputFiles[$fileKey]}");
        }
        
        $content = trim($content);
        
        // Show file stats
        $charCount = strlen($content);
        $estimatedTokens = (int)($charCount * self::TOKENS_PER_CHAR);
        echo "  → File: {$this->inputFiles[$fileKey]}\n";
        echo "  → Size: " . number_format($charCount) . " characters (~" . number_format($estimatedTokens) . " tokens)\n";
        
        return $content;
    }

    private function getUserInput($prompt) {
        echo "\n$prompt\n";
        echo "Enter content (end with a line containing only '~~~!'):\n";
        echo "(Leave empty to skip this check)\n";
        
        $content = '';
        $lineCount = 0;
        while (true) {
            $line = fgets(STDIN);
            if ($line === false) {
                $this->error("Failed to read input");
            }
            if (trim($line) === '~~~!') {
                break;
            }
            $content .= $line;
            $lineCount++;
        }

        $content = trim($content);
        
        if (empty($content)) {
            return null; // Signal to skip this check
        }

        // Check content size
        $charCount = strlen($content);
        $estimatedTokens = (int)($charCount * self::TOKENS_PER_CHAR);
        
        echo "  → Input size: " . number_format($charCount) . " characters (~" . number_format($estimatedTokens) . " tokens)\n";
        
        return $content;
    }
    
    private function getContent($prompt, $fileKey) {
        // If using file input mode
        if (!empty($this->inputFiles)) {
            return $this->getContentFromFile($fileKey);
        }
        
        // Otherwise use manual input
        return $this->getUserInput($prompt);
    }

    private function estimatePromptTokens($oldContent, $newContent) {
        $totalChars = strlen($oldContent) + strlen($newContent) + 3350; // +3350 for prompt text
        return (int)($totalChars * self::TOKENS_PER_CHAR);
    }
    
    private function validateContentSize($oldContent, $newContent) {
        $estimatedTokens = $this->estimatePromptTokens($oldContent, $newContent);
        
        echo "  → Estimated total tokens for analysis: ~" . number_format($estimatedTokens) . "\n";
        
        if ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST) {
            echo "\n\033[31m";
            echo "ERROR: Content is too large for analysis!\n";
            echo "  Estimated tokens: " . number_format($estimatedTokens) . "\n";
            echo "  Maximum allowed: " . number_format(self::MAX_TOKENS_PER_REQUEST) . "\n";
            echo "  \n";
            echo "  This would result in silent truncation or API errors.\n";
            echo "  Please consider:\n";
            echo "  - Breaking the update into smaller parts\n";
            echo "  - Analyzing only the most critical sections\n";
            echo "  - Using a different validation approach for large files\n";
            echo "\033[0m\n";
            
            echo "\nDo you want to continue anyway? (y/N): ";
            $response = trim(fgets(STDIN));
            
            if (strtolower($response) !== 'y') {
                echo "Skipping $scriptType analysis.\n";
                return false;
            }
            
            echo "\033[33m⚠ Proceeding with analysis - results may be incomplete!\033[0m\n\n";
        } elseif ($estimatedTokens > self::MAX_TOKENS_PER_REQUEST * 0.8) {
            echo "\033[33m  ⚠ Warning: Content is approaching token limits (" . 
                 number_format((int)($estimatedTokens / self::MAX_TOKENS_PER_REQUEST * 100)) . "% of max)\033[0m\n";
        }
        
        return true;
    }

    private function callDeepSeek($messages) {
        $data = [
            'model' => 'deepseek-chat',           // REQUIRED: Model to use
            'messages' => [                       // REQUIRED: Conversation messages
                [
                    'role' => 'user', 
                    'content' => $messages
                ]
            ],
            'max_tokens' => 8192,                 // OPTIONAL: Maximum response length
            'temperature' => 0.1,                 // OPTIONAL: Lower for more deterministic output
            'top_p' => 0.9,                       // OPTIONAL: Nucleus sampling
            'stream' => false                     // OPTIONAL: No streaming for this use case
        ];

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => 'https://api.deepseek.com/chat/completions',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        if ($error) {
            $this->error("CURL error: $error");
        }

        if ($httpCode !== 200) {
            $this->error("Deepseek API error (HTTP $httpCode): $response");
        }

        $result = json_decode($response, true);

        if (!isset($result['choices'][0]['message']['content'])) {
            $this->error("Invalid Deepseek API response: $response");
        }

        return $result['choices'][0]['message']['content'];
    }

    private function callOpenAI($messages) {
        $data = [
            'model' => self::MODEL,
            'messages' => $messages,
        ];
        if (self::MODEL_VER == 5) {
            $data['max_completion_tokens'] = self::MAX_TOKENS_GPT5; // 8000
        }
        else {
            $data['temperature'] = 0.1;
            $data['max_tokens'] = self::MAX_TOKENS;
        }

        $ch = curl_init(self::API_ENDPOINT);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey
            ],
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_TIMEOUT => 360
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        if ($error) {
            $this->error("CURL error: $error");
        }
        
        if ($httpCode !== 200) {
            $this->error("OpenAI API error (HTTP $httpCode): $response");
        }
        // echo "LOG RAW RESPONSE: \n--------\n" . $response . "\n--------\n";
        $result = json_decode($response, true);
        if (!isset($result['choices'][0]['message']['content'])) {
            $this->error("Invalid OpenAI API response: $response");
        }
        
        if (empty($result['choices'][0]['message']['content'])) {
            $this->error("Content in empty. " . (isset($result['choices'][0]['finish_reason']) ? "finish_reason: " . $result['choices'][0]['finish_reason'] : ''));
        }

        return $result['choices'][0]['message']['content'];
    }
    
    private function genSQL($oldContent, $newContent) {
        echo "\n🔍 Checking...\n";
        
        if (!$this->validateContentSize($oldContent, $newContent, 'old and new sql')) {
            return $this->getSkippedResults();
        }

        $prompt = <<<PROMPT
You are an expert PHP and SQL validator. Compare old install.sql and new install.sql then create SQL update script with the following criteria.

Criteria:
1. syntax_correct: SQL syntax must be correct and compatible with MySQL 5.5.3 or higher.
2. idempotent: generated SQL can be run multiple times without errors/duplicates, it should use IF EXISTS, IF NOT EXISTS, INSERT IGNORE and also deleting the same records before inserting when INSERT IGNORE can't use uniq indexes - it's most used technique to avoid duplicates)
3. all_changes_included: All changes from new file must be present in update script
4. no_extra_changes: No extra changes beyond what's in the new file
5. old_records_deleted: Records in old but not in new are properly deleted
6. sys_objects_storage_warning: Check if sys_objects_storage table is modified, then add TODO to get correct value for current storage engine
7. inconsistencies: report logical problems or potential errors
8. separate_schema: database schema changes must be in separate piece of code. 
9. structure_in_blocks: separate output in blicks with comments, blocks should be separated by table names or groups os simmilar tables (like `sys_options` and `sys_options_categories`)
10. no_order_update_for_forms_inputs: don't update order field for forms, just set closest one for the updated field.
11. assume data exists in the db, don't create data that already exists (like pages, blocks, settins, menus, storages, transcoders, etc).
12. don't split SQL querys into multiple lines.
13. for icon field in menu add checking for exact old value before updating it.

List of uniq table fields, as table => uniq (or set of fields with plus sign) field pairs:
sys_acl_actions => ID+Module
sys_form_displays => object+display_name
sys_form_display_inputs => display_name+input_name
sys_form_inputs => object+name
sys_form_pre_lists => key
sys_grid_actions => type+name
sys_grid_fields => object+name
sys_localization_categories => Name
sys_localization_keys => Key
sys_localization_languages => Name
sys_localization_strings => IDKey+IDLanguage
sys_modules => name
sys_modules => uri
sys_objects_category => object
sys_objects_chart => object
sys_objects_connection => object
sys_objects_content_info => name
sys_objects_editor => object
sys_objects_embeds => object
sys_objects_file_handlers => object
sys_objects_form => object
sys_objects_grid => object
sys_objects_iconset => object
sys_objects_live_updates => name
sys_objects_menu => object
sys_objects_metatags => object
sys_objects_page => object
sys_objects_page => uri
sys_objects_payments => object
sys_objects_player => object
sys_objects_privacy => object
sys_objects_push => object
sys_objects_recommendation => name
sys_objects_search_extended => object
sys_objects_sms => object
sys_objects_storage => object
sys_objects_transcoder => object
sys_objects_uploader => object
sys_objects_wiki => object
sys_options => name
sys_options_categories => name
sys_options_mixes => name
sys_options_mixes2options => option+mix_id
sys_options_types => name
sys_pages_layouts => name
sys_permalinks => standard+permalink+check
sys_profiles => type+content_id+content_id
sys_profiles_track => profile_id+action
sys_recommendation_criteria => object_id+name
sys_recommendation_data => profile_id+object_id+item_id
sys_search_extended_fields => object+name
sys_search_extended_sorting_fields => object+name+direction
sys_seo_uri_rewrites => uri_orig
sys_seo_uri_rewrites => uri_rewrite
sys_statistics => name
sys_std_pages => name
sys_std_pages_widgets => widget_id+page_id
sys_std_roles => name
sys_std_roles_members => account_id
sys_std_widgets_bookmarks => widget_id+profile_id

Write minimal necessary code. Don't use complex SQL like CASE, WHEN, THEN. 
Output must be compatible with MySQL 5.5.3 and MariaDB 5.5.
Make sure that not changed fields aren't updated.
Don't make long delete statements with long condition, simple easy to read approach is better.

OLD install.sql:
```sql
$oldContent
```

NEW install.sql:
```sql
$newContent
```

Respond with SQL script only, any comments must be added as comments in SQL
PROMPT;

        if ('deepseek' == self::ENGINE) {
            $response = $this->callDeepSeek($prompt);
        } else {
            $response = $this->callOpenAI([
                ['role' => 'system', 'content' => 'You are MySQL expert validator. Respond only with valid JSON. Main key is "sql" with generated SQL update script as value. Other keys are optional and used to report check results.'],
                ['role' => 'user', 'content' => $prompt]
            ]);
        }
        
        return $this->parseJsonResponse($response, 'sql');
    }
    
    private function parseJsonResponse($response, $filename) {
        // Try to extract JSON from response
        $response = trim($response);
        
        // Remove markdown code blocks if present
        $response = preg_replace('/```json\s*/', '', $response);
        $response = preg_replace('/```\s*$/', '', $response);
        $response = trim($response);
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error("Failed to parse JSON response for $filename: " . json_last_error_msg() . "\nResponse: $response");
        }
        
        return $data;
    }
    
    private function getSkippedResults() {
        return [
            'syntax_correct' => ['pass' => null, 'details' => 'Skipped due to size constraints'],
            'idempotent' => ['pass' => null, 'details' => 'Skipped due to size constraints'],
            'all_changes_included' => ['pass' => null, 'details' => 'Skipped due to size constraints'],
            'no_extra_changes' => ['pass' => null, 'details' => 'Skipped due to size constraints'],
            'old_records_deleted' => ['pass' => null, 'details' => 'Skipped due to size constraints'],
            'sys_objects_storage_warning' => ['has_changes' => false, 'details' => 'Skipped due to size constraints'],
            'inconsistencies' => ['pass' => null, 'details' => 'Skipped due to size constraints']
        ];
    }

    private function displayResults($results, $title) {
        // print_r($results);
        if (isset($results['sql'])) {
            echo "\nGenerated SQL Update Script:\n";
            echo "----------------------------------------\n";
            echo mysqlHighlight($results['sql']) . "\n";
            echo "----------------------------------------\n";
            unset($results['sql']);
        }
        if (!empty($results)) {
            echo "\nOther notes:\n";
            echo "----------------------------------------\n";        
            print_r($results);
            echo "----------------------------------------\n";        
            echo "\n";
        }
    }
    
    public function run() {
        echo "SQL Update Script Checker\n";
        echo "Module: {$this->moduleName}\n";
        echo "Version: {$this->version}\n";
        echo str_repeat("-", 80) . "\n";
        
        $oldInstallSQL = $this->getContent("Enter OLD install.sql content:", 'old_install');
        $newInstallSQL = $this->getContent("Enter NEW install.sql content:", 'new_install');
        
        if ($oldInstallSQL === null && $newInstallSQL === null) {
            echo "\033[90m⊘ Skipping install.sql check (empty input)\033[0m\n";
        } 
        else {
            $results = $this->genSQL($oldInstallSQL, $newInstallSQL);
            $this->displayResults($results, "installer.php(script.php) and install.sql(sql.sql) Results");
            $this->results['installer.php'] = $results;
        }
    }
}

// Main execution
if ($argc < 3) {
    echo "Usage: php {$argv[0]} MODULE_NAME VERSION [--old-install=file] [--new-install=file] [--old-enable=file] [--new-enable=file]\n";
    echo "\nExamples:\n";
    echo "  Interactive mode:\n";
    echo "    php {$argv[0]} bx_timeline 15.0.0-A2\n";
    echo "    php {$argv[0]} system 15.0.0-A2\n\n";
    echo "  File input mode (not tested!!!):\n";
    echo "    php {$argv[0]} bx_timeline 14.0.0-RC1 \\\n";
    echo "      --old-install=/path/to/old_install.sql \\\n";
    echo "      --new-install=/path/to/new_install.sql \\\n";
    echo "Note: All four file options must be provided together, or none at all.\n";
    exit(1);
}

try {
    $checker = new SQLUpdateChecker($argv[1], $argv[2], array_slice($argv, 3));
    $checker->run();
} catch (Exception $e) {
    echo "\033[31mERROR: " . $e->getMessage() . "\033[0m\n";
    exit(1);
}


function mysqlHighlight(string $sql): string
{
    // ANSI
    $RESET   = "\033[0m";
    $KEYWORD = "\033[1;34m"; // blue
    $STRING  = "\033[0;32m"; // green
    $NUMBER  = "\033[0;35m"; // magenta
    $COMMENT = "\033[0;90m"; // gray

    $placeholders = [];
    $i = 0;

    // 1️⃣ Extract comments
    $sql = preg_replace_callback(
        '/(--[^\n]*|#.*?$|\/\*[\s\S]*?\*\/)/m',
        function ($m) use (&$placeholders, &$i, $COMMENT, $RESET) {
            $key = "__C{$i}__";
            $placeholders[$key] = $COMMENT . $m[1] . $RESET;
            $i++;
            return $key;
        },
        $sql
    );

    // 2️⃣ Extract strings
    $sql = preg_replace_callback(
        "/('(?:\\\\'|[^'])*'|\"(?:\\\\\"|[^\"])*\")/",
        function ($m) use (&$placeholders, &$i, $STRING, $RESET) {
            $key = "__S{$i}__";
            $placeholders[$key] = $STRING . $m[1] . $RESET;
            $i++;
            return $key;
        },
        $sql
    );

    // 3️⃣ Numbers
    $sql = preg_replace(
        '/\b\d+(\.\d+)?\b/',
        $NUMBER . '$0' . $RESET,
        $sql
    );

    // 4️⃣ Keywords
    $keywords = [
        'SELECT','INSERT','UPDATE','DELETE','FROM','WHERE','JOIN','LEFT','RIGHT',
        'INNER','OUTER','ON','VALUES','SET','INTO','CREATE','TABLE','DROP','ALTER',
        'AND','OR','NOT','NULL','IS','IN','AS','ORDER','BY','GROUP','LIMIT',
        'HAVING','DISTINCT','UNION'
    ];

    $sql = preg_replace_callback(
        '/\b(' . implode('|', $keywords) . ')\b/i',
        fn($m) => $KEYWORD . strtoupper($m[1]) . $RESET,
        $sql
    );

    // 5️⃣ Restore strings & comments
    return strtr($sql, $placeholders);
}
