-- UNA-Migration-Min-System-Version: 15.0.0-RC4
-- Studio > Audit > Studio log: what an MCP client changes is recorded under its own protocol.

ALTER TABLE `sys_admin_log` MODIFY `source` enum('studio','agent','mcp','api','cli') NOT NULL DEFAULT 'studio';
