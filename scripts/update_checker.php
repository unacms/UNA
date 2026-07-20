#!/usr/bin/env php
<?php

/**
 * SQL Update Script Checker
 * Validates SQL update scripts for correctness and completeness
 * 
 * Usage: php script.php MODULE_DIR VERSION [--old-install=file] [--new-install=file] [--old-enable=file] [--new-enable=file]
 */

class SQLUpdateChecker {
    private $moduleName;
    private $version;
    private $updatePath;
    private $apiKey;
    private $results = [];
    private $inputFiles = [];
    
    const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    const MODEL_VER = 5;
//    const MODEL = 'gpt-4-turbo';
    const MODEL = 'gpt-5.6-terra'; // 'gpt-5'; // 'gpt-5-mini';
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
        $keyFile = $_SERVER['HOME'] . '/.una_update_script_checker';
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

    private function estimatePromptTokens($oldContent, $newContent, $updateScript) {
        $totalChars = strlen($oldContent) + strlen($newContent) + strlen($updateScript) + 1000; // +1000 for prompt text
        return (int)($totalChars * self::TOKENS_PER_CHAR);
    }
    
    private function validateContentSize($oldContent, $newContent, $updateScript, $scriptType) {
        $estimatedTokens = $this->estimatePromptTokens($oldContent, $newContent, $updateScript);
        
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
    /*
    private function checkInstallSQL($oldContent, $newContent, $updateScript) {
        echo "\n🔍 Checking install.sql update script...\n";
        
        $prompt = <<<PROMPT
You are an expert SQL validator. Analyze the SQL update script and check if it properly transforms the old install.sql to the new install.sql.

OLD install.sql:
```sql
$oldContent
```

NEW install.sql:
```sql
$newContent
```

UPDATE SCRIPT (install.sql in updates folder):
```sql
$updateScript
```

Evaluate these criteria and respond with ONLY a JSON object:
{
    "syntax_correct": {"pass": true/false, "details": "explanation"},
    "idempotent": {"pass": true/false, "details": "explanation"},
    "all_changes_included": {"pass": true/false, "details": "explanation"},
    "no_extra_changes": {"pass": true/false, "details": "explanation"},
    "old_records_deleted": {"pass": true/false, "details": "explanation"},
    "sys_objects_storage_warning": {"has_changes": true/false, "details": "explanation"},
    "inconsistencies": {"pass": true/false, "details": "explanation"}
}

Criteria:
1. syntax_correct: Check for SQL syntax errors
2. idempotent: Can be run multiple times without errors/duplicates, it uses IF EXISTS, IF NOT EXISTS, INSERT IGNORE and also deleting the same records before inserting - it's most used technique to avoid duplicates)
3. all_changes_included: All inserts, updates, and schema changes from new file are in update script
4. no_extra_changes: No changes beyond what's in the new file
5. old_records_deleted: Records in old but not in new are properly deleted
6. sys_objects_storage_warning: Check if sys_objects_storage table is modified
7. inconsistencies: Any logical problems, data integrity issues, or potential errors

Very important - evaluate each block of code in sql file (which starts with comment and until next comment) and provide some short summary if everything is ok there.

Most important is that there is a special technique for handling duplicates - before inserting a records it deletes the previous record, so there should be no dulicates upon repeated execution. If potencial duplicates still found - then print snippet with explanation.

Don't report inconsistent order in sys_form_display_inputs table - it's acceptable behaviour.

Be thorough and critical.
PROMPT;

        $response = $this->callOpenAI([
            ['role' => 'system', 'content' => 'You are a SQL expert validator. Respond only with valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ]);
        
        return $this->parseJsonResponse($response, 'install.sql');
    }
*/    
    private function checkEnableSQL($oldContent, $newContent, $updateScript) {
        echo "\n🔍 Checking enable.sql update script...\n";
        

        if (!$this->validateContentSize($oldContent, $newContent, $updateScript, 'enable.sql')) {
            return $this->getSkippedResults();
        }

        $prompt = <<<PROMPT
You are an expert SQL validator. Analyze the SQL update script and check if it properly transforms the old enable.sql to the new enable.sql.

OLD enable.sql:
```sql
$oldContent
```

NEW enable.sql:
```sql
$newContent
```

UPDATE SCRIPT (enable.sql in updates folder):
```sql
$updateScript
```

Evaluate these criteria and respond with ONLY a JSON object:
{
    "syntax_correct": {"pass": true/false, "details": "explanation"},
    "idempotent": {"pass": true/false, "details": "explanation"},
    "all_changes_included": {"pass": true/false, "details": "explanation"},
    "no_extra_changes": {"pass": true/false, "details": "explanation"},
    "old_records_deleted": {"pass": true/false, "details": "explanation"},
    "sys_objects_storage_warning": {"has_changes": true/false, "details": "explanation"},
    "inconsistencies": {"pass": true/false, "details": "explanation"}
}

Criteria:
1. syntax_correct: Check for SQL syntax errors
2. idempotent: Can be run multiple times without errors/duplicates, it uses IF EXISTS, IF NOT EXISTS, INSERT IGNORE and also deleting the same records before inserting - it's most used technique to avoid duplicates)
3. all_changes_included: All changes from new file are in update script
4. no_extra_changes: No changes beyond what's in the new file
5. old_records_deleted: Records in old but not in new are properly deleted, if no such records then pass
6. sys_objects_storage_warning: Check if sys_objects_storage table is modified
7. inconsistencies: Any logical problems or potential errors

Very important - evaluate each block of code in sql file (which starts with comment and until next comment) and provide some short summary if everything is ok there.

Most important is that there is a special technique for handling duplicates - before inserting a records it deletes the previous record, so there should be no dulicates upon repeated execution. If potencial duplicates still found - then print snippet with explanation.

Don't report inconsistent order in sys_form_display_inputs table - it's acceptable behaviour.

Be thorough and critical.
PROMPT;

        $response = $this->callOpenAI([
            ['role' => 'system', 'content' => 'You are a SQL expert validator. Respond only with valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ]);
        
        return $this->parseJsonResponse($response, 'enable.sql');
    }
    
    private function checkInstallerPHPandInstallSQL($oldContent, $newContent, $installerScript, $installSQL) {
        echo "\n🔍 Checking installer.php and install.sql update script...\n";
        
        if (!$this->validateContentSize($oldContent, $newContent, $installerScript.$installSQL, 'install.php  and enable.sql')) {
            return $this->getSkippedResults();
        }

        $prompt = <<<PROMPT
You are an expert PHP and SQL validator. Analyze the installer.php and install.sql update script and check if these files properly handles the transformation from old to new install.sql.

OLD install.sql:
```sql
$oldContent
```

NEW install.sql:
```sql
$newContent
```

PHP UPDATE SCRIPT (installer.php):
```php
$installerScript
```

SQL UPDATE SCRIPT (install.sql):
```php
$installSQL
```

Evaluate these criteria and respond with ONLY a JSON object:
{
    "syntax_correct": {"pass": true/false, "details": "explanation"},
    "idempotent": {"pass": true/false, "details": "explanation"},
    "all_changes_included": {"pass": true/false, "details": "explanation"},
    "no_extra_changes": {"pass": true/false, "details": "explanation"},
    "old_records_deleted": {"pass": true/false, "details": "explanation"},
    "sys_objects_storage_warning": {"has_changes": true/false, "details": "explanation"},
    "inconsistencies": {"pass": true/false, "details": "explanation"}
}

Criteria:
1. syntax_correct: Check for SQL syntax errors
2. idempotent: Can be run multiple times without errors/duplicates, it uses IF EXISTS, IF NOT EXISTS, INSERT IGNORE and also deleting the same records before inserting - it's most used technique to avoid duplicates)
3. all_changes_included: All changes from new file are in update script
4. no_extra_changes: No changes beyond what's in the new file
5. old_records_deleted: Records in old but not in new are properly deleted, if no such records then pass
6. sys_objects_storage_warning: Check if sys_objects_storage table is modified
7. inconsistencies: Any logical problems or potential errors

installer.php must contain the database schema changes, if no changes in table fields and other structural changes, then it will not have any SQL queries. 
install.sql contains all other changes. 
Threat these two files as a single SQL file.
Please note that installer.php has php logic for old/new fields checks and some other.

Very important - evaluate each block of code in sql file (which starts with comment and until next comment) and provide some short summary if everything is ok there.

Most important is that there is a special technique for handling duplicates - before inserting a records it deletes the previous record, so there should be no dulicates upon repeated execution. If potencial duplicates still found - then print snippet with explanation.

Don't report inconsistent order in sys_form_display_inputs table - it's acceptable behaviour.

Be thorough and critical.
PROMPT;

        $response = $this->callOpenAI([
            ['role' => 'system', 'content' => 'You are a PHP and SQL expert validator. Respond only with valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ]);
        
        return $this->parseJsonResponse($response, 'installer.php');
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
        echo "\n" . str_repeat("=", 80) . "\n";
        echo " $title\n";
        echo str_repeat("=", 80) . "\n\n";
        
        $checks = [
            'syntax_correct' => 'Syntax Correct',
            'idempotent' => 'Idempotent (Can run multiple times)',
            'all_changes_included' => 'All changes included',
            'no_extra_changes' => 'No extra changes',
            'old_records_deleted' => 'Old records deleted',
            'inconsistencies' => 'No inconsistencies'
        ];
        
        foreach ($checks as $key => $label) {
            if (isset($results[$key])) {
                if ($results[$key]['pass'] === null) {
                    $status = '⊘';
                    $color = "\033[90m"; // Gray for skipped
                } else {
                    $status = $results[$key]['pass'] ? '✓' : '✗';
                    $color = $results[$key]['pass'] ? "\033[32m" : "\033[31m";
                }
                $reset = "\033[0m";
                
                echo sprintf("%-45s %s%s%s\n", $label, $color, $status, $reset);
                if (!empty($results[$key]['details'])) {
                    echo "  └─ " . $results[$key]['details'] . "\n";
                }
            }
        }
        
        // Special handling for sys_objects_storage warning
        if (isset($results['sys_objects_storage_warning'])) {
            $warning = $results['sys_objects_storage_warning'];
            if ($warning['has_changes']) {
                echo sprintf("%-45s %s⚠%s\n", 'sys_objects_storage changes', "\033[33m", "\033[0m");
                echo "  └─ WARNING: " . $warning['details'] . "\n";
            } else {
                echo sprintf("%-45s %s✓%s\n", 'sys_objects_storage changes', "\033[32m", "\033[0m");
                echo "  └─ " . $warning['details'] . "\n";
            }
        }
        
        echo "\n";
    }
    
    public function run() {
        echo "SQL Update Script Checker\n";
        echo "Module: {$this->moduleName}\n";
        echo "Version: {$this->version}\n";
        echo str_repeat("-", 80) . "\n";
        
        // Read update scripts
        $installerPHP = $this->readFile('install/installer.php');
        $installSQL = $this->readFile('install/sql/install.sql');
        $enableSQL = $this->readFile('install/sql/enable.sql');
        if ('system' == $this->moduleName) {
            $installerPHP = $this->readFile('script.php');
            $installSQL = $this->readFile('sql.sql');
            $enableSQL = null;
        }
        
        if ($installerPHP === null && $installSQL === null && $enableSQL === null) {
            $this->error("No update scripts found in {$this->updatePath}/install/");
        }
        
        // Check installer.php(script.php) and install.sql(sql.sql) together
        if ($installSQL !== null) {
            echo "\n📄 Found install.sql\n";
            $oldInstallSQL = $this->getContent("Enter OLD install.sql content:", 'old_install');
            $newInstallSQL = $this->getContent("Enter NEW install.sql content:", 'new_install');
            
            if ($oldInstallSQL === null && $newInstallSQL === null) {
                echo "\033[90m⊘ Skipping install.sql check (empty input)\033[0m\n";
            } 
            else {
                $results = $this->checkInstallerPHPandInstallSQL($oldInstallSQL, $newInstallSQL, $installerPHP, $installSQL);
                $this->displayResults($results, "installer.php(script.php) and install.sql(sql.sql) Results");
                $this->results['installer.php'] = $results;
            }
        }

        // Check enable.sql
        if ($enableSQL !== null) {
            echo "\n📄 Found enable.sql\n";
            $oldEnableSQL = $this->getContent("Enter OLD enable.sql content:", 'old_enable');
            $newEnableSQL = $this->getContent("Enter NEW enable.sql content:", 'new_enable');
            
            if ($oldEnableSQL === null && $newEnableSQL === null) {
                echo "\033[90m⊘ Skipping enable.sql check (empty input)\033[0m\n";
            }
            else {
                $results = $this->checkEnableSQL($oldEnableSQL, $newEnableSQL, $enableSQL);
                $this->displayResults($results, "enable.sql Results");
                $this->results['enable.sql'] = $results;
            }
        }
        
        // Summary
        $this->displaySummary();
    }
    
    private function displaySummary() {
        echo str_repeat("=", 80) . "\n";
        echo " OVERALL SUMMARY\n";
        echo str_repeat("=", 80) . "\n\n";
        
        $totalPassed = 0;
        $totalFailed = 0;
        $totalSkipped = 0;
        $hasWarnings = false;
        
        foreach ($this->results as $file => $results) {
            foreach ($results as $key => $result) {
                if ($key === 'sys_objects_storage_warning') {
                    if ($result['has_changes']) {
                        $hasWarnings = true;
                    }
                    continue;
                }
                
                if (isset($result['pass'])) {
                    if ($result['pass'] === null) {
                        $totalSkipped++;
                    } elseif ($result['pass']) {
                        $totalPassed++;
                    } else {
                        $totalFailed++;
                    }
                }
            }
        }
        
        echo "Total Checks Passed: \033[32m$totalPassed\033[0m\n";
        echo "Total Checks Failed: \033[31m$totalFailed\033[0m\n";
        
        if ($totalSkipped > 0) {
            echo "Total Checks Skipped: \033[90m$totalSkipped\033[0m\n";
        }

        if ($hasWarnings) {
            echo "Warnings: \033[33mYes (sys_objects_storage modified)\033[0m\n";
        }
        
        if ($totalFailed === 0 && $totalSkipped === 0 && !$hasWarnings) {
            echo "\n\033[32m✓ All checks passed!\033[0m\n";
        } elseif ($totalFailed === 0 && $totalSkipped === 0 && $hasWarnings) {
            echo "\n\033[33m⚠ All checks passed but review warnings!\033[0m\n";
        } elseif ($totalSkipped > 0 && $totalFailed === 0) {
            echo "\n\033[33m⊘ Some checks were skipped. Manual review recommended.\033[0m\n";
        } else {
            echo "\n\033[31m✗ Some checks failed. Review the results above.\033[0m\n";
        }
        
        echo "\n";
    }
}

// Main execution
if ($argc < 3) {
    echo "Usage: php {$argv[0]} MODULE_DIR VERSION [--old-install=file] [--new-install=file] [--old-enable=file] [--new-enable=file]\n";
    echo "\nExamples:\n";
    echo "  Interactive mode:\n";
    echo "    php {$argv[0]} timeline 15.0.0-A2\n";
    echo "    php {$argv[0]} system 15.0.0-A2\n\n";
    echo "  File input mode:\n";
    echo "    php {$argv[0]} timeline 14.0.0-RC1 \\\n";
    echo "      --old-install=/path/to/old_install.sql \\\n";
    echo "      --new-install=/path/to/new_install.sql \\\n";
    echo "      --old-enable=/path/to/old_enable.sql \\\n";
    echo "      --new-enable=/path/to/new_enable.sql\n\n";
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
