/**
 * Toast Component - Web Implementation
 * 
 * Uses sonner for web toast notifications.
 * @see https://sonner.emilkowal.ski
 * 
 * Installation:
 * yarn add sonner
 */

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { appSetting } from 'app/lib/util';

// Get toast theme settings
const toastTheme = appSetting('theme', 'toast') || {};

/**
 * Toaster component - Add this to your app root
 * 
 * @example
 * // In your layout.js (Next.js)
 * import { Toaster } from 'app/ui/atoms/toaster';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   );
 * }
 */
export function Toaster({
    position = 'top-center',
    duration = 4000,
    visibleToasts = 3,
    closeButton = false,
    richColors = true,
    expand = false,
    theme = 'system',
    offset = '16px',
    gap = 14,
    ...props
}) {
    return (
        <SonnerToaster
            position={position}
            duration={duration}
            visibleToasts={visibleToasts}
            closeButton={closeButton}
            richColors={richColors}
            expand={expand}
            theme={theme}
            offset={offset}
            gap={gap}
            toastOptions={{
                style: toastTheme.style,
                className: toastTheme.className,
                classNames: {
                    toast: toastTheme.toastClassName,
                    title: toastTheme.titleClassName,
                    description: toastTheme.descriptionClassName,
                    success: toastTheme.successClassName,
                    error: toastTheme.errorClassName,
                    warning: toastTheme.warningClassName,
                    info: toastTheme.infoClassName,
                    ...toastTheme.classNames,
                },
                ...props.toastOptions,
            }}
            {...props}
        />
    );
}

/**
 * Toast function - Call this to show toasts
 * 
 * @example
 * import { toast } from 'app/ui/atoms/toaster';
 * 
 * // Basic toast
 * toast('Hello World');
 * 
 * // Success toast
 * toast.success('Saved successfully!');
 * 
 * // Error toast
 * toast.error('Something went wrong');
 * 
 * // Warning toast
 * toast.warning('Please check your input');
 * 
 * // Info toast
 * toast.info('New update available');
 * 
 * // Loading toast
 * const toastId = toast.loading('Uploading...');
 * // Later: toast.dismiss(toastId);
 * 
 * // Promise toast
 * toast.promise(myPromise, {
 *   loading: 'Loading...',
 *   success: (data) => 'Success!',
 *   error: (err) => 'Error occurred',
 * });
 * 
 * // With description
 * toast('Title', { description: 'More details here' });
 * 
 * // With action button
 * toast('Message', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => console.log('Undo clicked'),
 *   },
 * });
 * 
 * // Custom JSX content
 * toast.custom((t) => (
 *   <div>
 *     <p>Custom content</p>
 *     <button onClick={() => toast.dismiss(t)}>Close</button>
 *   </div>
 * ));
 * 
 * // Custom duration
 * toast('Quick message', { duration: 2000 });
 * 
 * // Dismiss a toast
 * const id = toast('Hello');
 * toast.dismiss(id);
 * 
 * // Dismiss all toasts
 * toast.dismiss();
 */
export const toast = sonnerToast;

// Re-export for convenience
export { toast as default };

// Export types from primitive for documentation
export { TOAST_TYPES, TOAST_POSITIONS } from 'app/ui/primitives/toast';

