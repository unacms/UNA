// @neo/test-components
// Shared UI components for web (Next.js) and native (Expo)
// Built on HeroUI v3 for web, HeroUI Native for React Native

// ============================================
// Custom Components (platform-specific implementations)
// ============================================
export * from "./components/button"
export * from "./components/tabs"
export * from "./components/performance-footer"

// ============================================
// Re-export HeroUI v3 components for web
// These are RSC-compatible (built on React Aria Components)
// https://v3.heroui.com/docs/components
// ============================================
export {
  // Layout & Structure
  Card,
  CardRoot,
  CardContent,
  CardTitle,
  CardDescription,
  CardHeader,
  CardFooter,
  Separator,
  Surface,
  
  // Overlays - Modal uses compound pattern: Modal.Header, Modal.Body etc.
  Modal,
  ModalRoot,
  ModalTrigger,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
  Popover,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  
  // Navigation
  // Note: Dropdown is imported directly from @heroui/react due to module resolution issues
  // The Dropdown wrapper in ./components/dropdown is ready for future use
  Link,
  
  // Forms
  Input,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Select,
  Switch,
  TextField,
  TextArea,
  NumberField,
  
  // Feedback
  Chip,
  Spinner,
  Skeleton,
  Alert,
  
  // Utility
  Kbd,
  Avatar,
  
  // Re-export Button for direct HeroUI usage if needed
  Button as HeroUIButton,
} from "@heroui/react"

// ============================================
// Theme tokens and utilities
// ============================================
export * from "./theme"
