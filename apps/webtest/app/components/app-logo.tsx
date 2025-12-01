// AppLogo - Server Component
// Renders the UNA app logo (mark + text)
// Based on packages/app/static-default.js Logo component
// Mode: 'adaptive' | 'full' | 'mark' | 'text'

interface AppLogoProps {
  /** Logo display mode */
  mode?: 'adaptive' | 'full' | 'mark' | 'text'
  /** Size of the logo mark */
  markSize?: number
  /** Custom className for the container */
  className?: string
}

/**
 * UNA Logo Mark - The iconic UNA symbol
 * Responsive to dark/light theme via currentColor
 */
function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      aria-label="Logo Mark"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className="text-foreground"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.9468 11.8909C14.0127 9.83909 16.8583 8.5714 20.0001 8.5714C20.3283 8.5714 20.6533 8.58523 20.9746 8.61237C21.2844 8.63852 21.567 8.42658 21.6347 8.12318C22.2838 5.21753 24.408 2.86848 27.1804 1.90314C27.4392 1.81299 27.4658 1.43791 27.2101 1.33905C24.9733 0.474227 22.5421 0 20.0001 0C17.0609 0 14.2699 0.633998 11.7562 1.77265C11.5553 1.86368 11.4286 2.06522 11.4286 2.28582V11.685C11.4286 11.9482 11.76 12.0763 11.9468 11.8909Z"
        fill="currentColor"
      />
      <path
        d="M31.8734 36.0956C31.6877 36.2327 31.4285 36.0985 31.4285 35.8673V19.9999C31.4285 19.6717 31.4148 19.3466 31.3877 19.0254C31.3614 18.7156 31.5734 18.4331 31.8768 18.3653C34.7826 17.7162 37.1314 15.592 38.0969 12.8196C38.1869 12.5607 38.562 12.5342 38.6609 12.7899C39.5257 15.0267 40 17.4579 40 19.9999C40 26.5999 36.8031 32.453 31.8734 36.0956Z"
        fill="currentColor"
      />
      <path
        d="M35.7142 9.99996C35.7142 13.1559 33.1559 15.7142 29.9999 15.7142C26.8439 15.7142 24.2856 13.1559 24.2856 9.99996C24.2856 6.84405 26.8439 4.28569 29.9999 4.28569C33.1559 4.28569 35.7142 6.84405 35.7142 9.99996Z"
        fill="currentColor"
      />
      <path
        d="M1.90315 27.1802C1.81301 27.4391 1.43792 27.4656 1.33906 27.2099C0.47423 24.9732 0 22.542 0 20C0 13.4001 3.19687 7.54684 8.12659 3.90428C8.31231 3.76703 8.57145 3.90157 8.57145 4.13251V20C8.57145 20.3282 8.58528 20.6533 8.61242 20.9745C8.63857 21.2843 8.42662 21.5669 8.12322 21.6347C5.21756 22.2837 2.86849 24.4079 1.90315 27.1802Z"
        fill="currentColor"
      />
      <path
        d="M28.2436 38.2273C28.4448 38.1362 28.5714 37.9348 28.5714 37.7142V28.3148C28.5714 28.0517 28.2399 27.9237 28.0531 28.1091C25.9873 30.1608 23.1416 31.4285 19.9999 31.4285C19.6716 31.4285 19.3466 31.4148 19.0254 31.3876C18.7156 31.3614 18.433 31.5734 18.3652 31.8768C17.7162 34.7825 15.5919 37.1313 12.8195 38.0968C12.5607 38.187 12.5342 38.5619 12.7898 38.6608C15.0267 39.5256 17.4579 39.9999 19.9999 39.9999C22.939 39.9999 25.7302 39.3659 28.2436 38.2273Z"
        fill="currentColor"
      />
      <path
        d="M15.7145 29.9999C15.7145 33.1559 13.1561 35.7142 10.0002 35.7142C6.84426 35.7142 4.28588 33.1559 4.28588 29.9999C4.28588 26.8439 6.84426 24.2856 10.0002 24.2856C13.1561 24.2856 15.7145 26.8439 15.7145 29.9999Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * UNA Logo Text - The "UNA" wordmark
 * Responsive to dark/light theme via currentColor
 */
function LogoText({ height = 36 }: { height?: number }) {
  // Calculate width to maintain aspect ratio (68:32 original)
  const width = Math.round((height / 32) * 68)
  
  return (
    <svg
      aria-label="Logo Text"
      width={width}
      height={height}
      viewBox="0 0 68 32"
      fill="none"
      className="text-foreground"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.5 16C17.5 20.1421 14.1421 23.5 10 23.5C5.85786 23.5 2.5 20.1421 2.5 16V7.25C2.5 6.55964 1.94036 6 1.25 6C0.559644 6 0 6.55964 0 7.25V16C0 21.5228 4.47715 26 10 26C15.5228 26 20 21.5228 20 16V7.25C20 6.55964 19.4404 6 18.75 6C18.0596 6 17.5 6.55964 17.5 7.25V16Z"
        fill="currentColor"
      />
      <path
        d="M41.5 16V24.75C41.5 25.4404 42.0596 26 42.75 26C43.4404 26 44 25.4404 44 24.75V16C44 10.4772 39.5228 6 34 6C28.4772 6 24 10.4772 24 16V24.75C24 25.4404 24.5596 26 25.25 26C25.9404 26 26.5 25.4404 26.5 24.75V16C26.5 11.8579 29.8579 8.5 34 8.5C38.1421 8.5 41.5 11.8579 41.5 16Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M65.5 22.6146V24.75C65.5 25.4404 66.0596 26 66.75 26C67.4404 26 68 25.4404 68 24.75V16C68 10.4772 63.5228 6 58 6C52.4772 6 48 10.4772 48 16C48 21.5228 52.4772 26 58 26C60.9867 26 63.6676 24.6906 65.5 22.6146ZM65.5 16C65.5 20.1421 62.1421 23.5 58 23.5C53.8579 23.5 50.5 20.1421 50.5 16C50.5 11.8579 53.8579 8.5 58 8.5C62.1421 8.5 65.5 11.8579 65.5 16Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * AppLogo - Complete UNA logo component
 * 
 * Modes:
 * - 'adaptive': Shows mark always, text only on sm+ screens (default)
 * - 'full': Always shows both mark and text
 * - 'mark': Only shows the logo mark
 * - 'text': Only shows the text (hides mark on mobile)
 * 
 * @example
 * ```tsx
 * <AppLogo mode="adaptive" />
 * <AppLogo mode="full" markSize={48} />
 * <AppLogo mode="mark" />
 * ```
 */
export function AppLogo({ 
  mode = 'adaptive', 
  markSize = 36,
  className = '' 
}: AppLogoProps) {
  // Determine visibility classes based on mode
  const textClasses: Record<string, string> = {
    adaptive: 'hidden sm:block',
    mark: 'hidden',
    full: '',
    text: '',
  }

  const markClasses: Record<string, string> = {
    adaptive: '',
    mark: '',
    full: '',
    text: 'hidden sm:block',
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {mode !== 'text' && (
        <div className={markClasses[mode]}>
          <LogoMark size={markSize} />
        </div>
      )}
      {mode !== 'mark' && (
        <div className={textClasses[mode]}>
          <LogoText height={markSize} />
        </div>
      )}
    </div>
  )
}

// Export individual components for flexibility
export { LogoMark, LogoText }

