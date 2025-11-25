# NEO UI Component Reorganization Plan

This document outlines findings from a component architecture review and proposes improvements for better consistency, maintainability, and cross-platform support.

---

## Current Architecture Overview

### Folder Structure

```
packages/app/
├── design/           # Base design primitives (View, Text, Button, etc.)
├── ui/
│   ├── atoms/        # Basic UI building blocks (Icon, Link, Checkbox, etc.)
│   ├── molecules/    # Compound components (Profile, Tabs, ScrollList, etc.)
│   ├── primitives/   # Headless UI primitives (Accordion only)
│   └── workers/      # Background workers
├── components/       # Business logic components
│   ├── elements/     # Content elements (Browse, Feed, Messenger, etc.)
│   ├── form-fields/  # Form field types
│   ├── forms/        # Form compositions
│   ├── menu-items/   # Menu item types
│   ├── nav/          # Navigation components
│   ├── page-layout/  # Page templates
│   └── units/        # Content unit types
└── lib/              # Utilities, hooks, helpers
```

### Platform-Specific Pattern

- `component.js` → Native (React Native) implementation
- `component.web.js` → Web (Next.js) implementation

---

## Issues Identified

### 1. File Naming Inconsistency

| Location | Current Pattern | Examples |
|----------|-----------------|----------|
| `ui/atoms/` | kebab-case | `kb-avoiding-view.js`, `dropdown-popup.js` |
| `ui/molecules/` | snake_case | `scroll_list.js`, `profile_list.js` |
| `components/` | snake_case | `feed_item.js`, `entity_actions.js` |

### 2. Export Style Inconsistency

```javascript
// Different patterns used:
export default function ElementLink        // default export with prefix
export function Icon                       // named export
export { Accordion, AccordionItem }        // multiple named exports
export default memo(AtomProfile_)          // default with memo wrapper
```

### 3. Component Naming Prefixes

Inconsistent use of `Element`, `Atom_` prefixes:
- `ElementLink`, `ElementConfirm` in atoms
- `AtomProfile_` in molecules
- Plain `Tabs` in others

### 4. Incomplete Native Implementations

~~**Critical:** `ui/molecules/tabs.js` returns "Not implemented" while `tabs.web.js` has full Radix implementation.~~

✅ **RESOLVED:** Native tabs implementation completed with primitive + atom + molecule pattern.

### 5. Monolithic Files

`design/controls.js` is 900+ lines containing:
- 6+ Input variants
- Modal component
- Button, ButtonsGroup, ButtonRef
- Multiple menu button variants

### 6. Incomplete Primitives Layer

Currently `ui/primitives/` contains:
- `accordion.js` ✅
- `tabs.js` ✅ (newly added)

Still missing:
- dropdown primitive
- dialog primitive

---

## Reorganization Plan

### Phase 1: Critical Fixes (High Priority)

#### 1.1 Implement Native Tabs Component

**File:** `ui/molecules/tabs.js`

Create a native tabs implementation using the same API as the web version:

```javascript
// Proposed structure
export default function Tabs({ tabs, activeTab, fullWidth, size, contentClassName }) {
    const [currentTab, setCurrentTab] = useState(activeTab);
    
    return (
        <View>
            <ScrollView horizontal>
                {tabs.map((tab) => (
                    <Pressable key={tab.key} onPress={() => setCurrentTab(tab.key)}>
                        <Text>{tab.title}</Text>
                    </Pressable>
                ))}
            </ScrollView>
            {tabs.find(t => t.key === currentTab)?.content}
        </View>
    );
}
```

#### 1.2 Create Tabs Primitive

**File:** `ui/primitives/tabs.js`

Headless tabs component for native that mirrors Radix API:

```javascript
export const Root = TabsRoot;
export const List = TabsList;
export const Trigger = TabsTrigger;
export const Content = TabsContent;
```

### Phase 2: File Organization (Medium Priority)

#### 2.1 Standardize File Naming

Convert all files to **kebab-case**:

```
# Molecules
scroll_list.js      → scroll-list.js
profile_list.js     → profile-list.js
scroll_list_header.js → scroll-list-header.js

# Components/elements
feed_item.js        → feed-item.js
entity_actions.js   → entity-actions.js
```

#### 2.2 Split controls.js

Break `design/controls.js` into:

```
design/
├── controls/
│   ├── index.js        # Re-exports all
│   ├── input.js        # Input, InputRef, InputMulti, etc.
│   ├── button.js       # Button, ButtonsGroup, ButtonRef
│   ├── modal.js        # Modal component
│   └── picker.js       # PickerStyled variants
```

### Phase 3: Standardization (Medium Priority)

#### 3.1 Export Convention

Adopt **named exports** for all components:

```javascript
// Before
export default function ElementLink(props) { }

// After
export function Link(props) { }
```

Update index files for convenient imports:
```javascript
// ui/atoms/index.js
export { Link } from './link';
export { Icon } from './icon';
```

#### 3.2 Remove Component Prefixes

| Current | Proposed |
|---------|----------|
| `ElementLink` | `Link` |
| `ElementConfirm` | `Confirm` |
| `AtomProfile_` | `Profile` |

The folder structure (`atoms/`, `molecules/`) already indicates component type.

#### 3.3 Add forwardRef Consistently

Components that wrap DOM/native elements should support refs:

```javascript
export const Tabs = React.forwardRef(({ tabs, activeTab, ...props }, ref) => {
    // ...
});
Tabs.displayName = 'Tabs';
```

### Phase 4: Primitives Expansion (Lower Priority)

#### 4.1 Create Missing Primitives

```
ui/primitives/
├── accordion.js    # ✅ Exists
├── tabs.js         # ✅ COMPLETED
├── dropdown.js     # TODO
├── dialog.js       # TODO
└── tooltip.js      # TODO
```

Each primitive should:
- Be headless (no styling)
- Use React Context for state
- Support controlled/uncontrolled modes
- Work on both web and native

---

## Implementation Checklist

### Phase 1 (Week 1-2)
- [x] Implement native `ui/molecules/tabs.js` ✅ COMPLETED
- [x] Create `ui/primitives/tabs.js` ✅ COMPLETED
- [x] Create `ui/atoms/tabs.js` ✅ COMPLETED
- [ ] Test tabs on both platforms

### Phase 2 (Week 2-3)
- [ ] Rename snake_case files to kebab-case
- [ ] Update all imports
- [ ] Split `design/controls.js`
- [ ] Create `design/controls/index.js` for backwards compatibility

### Phase 3 (Week 3-4)
- [ ] Convert default exports to named exports
- [ ] Remove component prefixes
- [ ] Add forwardRef where needed
- [ ] Create barrel files (`index.js`) for each folder

### Phase 4 (Ongoing)
- [ ] Create primitives as needed
- [ ] Document component API patterns
- [ ] Add TypeScript types

---

## Migration Strategy

### Backwards Compatibility

Use re-exports to maintain backwards compatibility during migration:

```javascript
// design/controls.js (legacy)
export * from './controls/input';
export * from './controls/button';
export * from './controls/modal';
```

### Import Path Updates

Create a codemod or use find-replace:

```bash
# Example: Update tabs imports
find . -name "*.js" -exec sed -i '' 's/scroll_list/scroll-list/g' {} +
```

---

## Success Criteria

1. **Consistency**: All files follow kebab-case naming
2. **Cross-platform**: All molecules work on web AND native
3. **Maintainability**: No file exceeds 500 lines
4. **Predictability**: All components use named exports
5. **Documentation**: Each folder has an index.js with exports

---

## Completed Implementations

### Tabs Component (Phase 1) ✅

**Date:** November 2024

Following the Accordion pattern, tabs were implemented with a 3-layer architecture:

#### Layer 1: Primitive (`ui/primitives/tabs.js`)

Headless tabs component using React Context:

```javascript
// Exports:
export const Root = TabsRoot;      // Container with state management
export const List = TabsList;      // Tab button container
export const Trigger = TabsTrigger; // Individual tab button
export const Content = TabsContent; // Tab panel content
export { useTabsContext };         // Hook for custom components
```

**Key Features:**
- Controlled/uncontrolled modes (`value`/`defaultValue`)
- `onValueChange` callback
- Render props pattern for `TabsTrigger` children: `({ isSelected, isDisabled }) => ...`
- Accessibility: `accessibilityRole`, `aria-selected`, `data-state`
- `forceMount` prop on `TabsContent` for always-mounted panels

#### Layer 2: Styled Atom (`ui/atoms/tabs.js`)

Wraps primitives with theme styling:

```javascript
import * as TabsPrimitive from 'app/ui/primitives/tabs';

// Applies theme classes from appSetting('theme', 'tabs')
// Applies size classes from appSetting('theme', 'tabs_sizes')
export { Tabs, TabsList, TabsTrigger, TabsContent };
```

#### Layer 3: Molecule (`ui/molecules/tabs.js`)

Simplified API matching the web version:

```javascript
// Usage:
<Tabs 
    tabs={[
        { key: 'tab1', title: 'Tab 1', content: <Content1 /> },
        { key: 'tab2', title: 'Tab 2', content: <Content2 /> },
    ]}
    activeTab="tab1"
    fullWidth={false}
    size="md"
    contentClassName=""
/>
```

**Features:**
- Animated indicator using React Native Reanimated
- Horizontal scrollable tab list
- Theme-aware styling
- Same API as `tabs.web.js` (uses `@radix-ui/react-tabs`)

#### File Structure

```
ui/
├── primitives/
│   ├── accordion.js    # Existing
│   └── tabs.js         # NEW - Headless primitive
├── atoms/
│   ├── accordion.js    # Existing
│   └── tabs.js         # NEW - Styled components
└── molecules/
    ├── tabs.js         # NEW - Simplified API (native)
    └── tabs.web.js     # Existing - Radix-based (web)
```

#### Usage Examples

**Simple usage (molecule):**
```javascript
import Tabs from 'app/ui/molecules/tabs';

<Tabs 
    tabs={[
        { key: 'account', title: 'Account', content: <AccountSettings /> },
        { key: 'profile', title: 'Profile', content: <ProfileSettings /> },
    ]}
    activeTab="account"
/>
```

**Flexible usage (atoms):**
```javascript
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'app/ui/atoms/tabs';

<Tabs defaultValue="tab1">
    <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">Content 1</TabsContent>
    <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

**Custom usage (primitives):**
```javascript
import * as TabsPrimitive from 'app/ui/primitives/tabs';

<TabsPrimitive.Root value={value} onValueChange={setValue}>
    <TabsPrimitive.List>
        <TabsPrimitive.Trigger value="custom">
            {({ isSelected }) => (
                <CustomTabButton active={isSelected} />
            )}
        </TabsPrimitive.Trigger>
    </TabsPrimitive.List>
    <TabsPrimitive.Content value="custom">
        <CustomContent />
    </TabsPrimitive.Content>
</TabsPrimitive.Root>
```

---

## Notes

- Prioritize fixes that affect cross-platform functionality
- Maintain backwards compatibility during transition
- Test thoroughly on both web and native after each change
- Consider using TypeScript for new components

