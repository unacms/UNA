/** Theme colour of a shape: a semantic token, so forks re-tint the art through their palette. */
export type IllustrationTone = 'muted' | 'accent' | 'primary' | 'accentForeground' | 'primaryForeground';

export type IllustrationShape = {
    d: string;
    tone: IllustrationTone;
    /** Draws inner subpaths as holes (rings). */
    evenOdd?: boolean;
};

export type IllustrationName = 'splash' | 'join';

/** A picture that is not one of the app's own: UNA sends its shapes with a block (`unaPicture`, lib/intro-block.ts). */
export type IllustrationPicture = {
    viewBox: string;
    shapes: IllustrationShape[];
};

export type IllustrationProps = {
    /** One of the app's own pictures. */
    name?: IllustrationName;
    /** A picture given as shapes; wins over `name`. */
    picture?: IllustrationPicture | null;
    className?: string;
};
