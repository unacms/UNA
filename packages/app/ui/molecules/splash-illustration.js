import SvgFile from 'app/ui/molecules/svg-file';

/** Native splash illustration — themed tint via SvgFile mask. */
export default function SplashIllustration(props) {
    return (
        <SvgFile
            src_dark="splash-dark.svg"
            src_default="splash-light.svg"
            colorize
            className="text-secondary-foreground"
            alt="Splash screen illustration"
            {...props}
        />
    );
}
