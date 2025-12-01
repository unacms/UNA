'use client'

// Dropdown Web Implementation - re-exports HeroUI v3 Dropdown
// https://v3.heroui.com/docs/components/dropdown
// CSS styling handled via globals.css with BEM classes

import { Dropdown as HeroUIDropdown } from "@heroui/react"

/**
 * Dropdown - Re-export of HeroUI v3 Dropdown
 * Uses compound component pattern with sub-components
 * 
 * @example
 * ```tsx
 * <Dropdown>
 *   <Button aria-label="Menu">Actions</Button>
 *   <Dropdown.Popover>
 *     <Dropdown.Menu onAction={(key) => console.log(key)}>
 *       <Dropdown.Item id="edit" textValue="Edit">
 *         <Label>Edit</Label>
 *       </Dropdown.Item>
 *     </Dropdown.Menu>
 *   </Dropdown.Popover>
 * </Dropdown>
 * ```
 */
export const Dropdown = HeroUIDropdown

