/** Theme colour of a shape: a semantic token, so forks re-tint the art through their palette. */
export type IllustrationTone = 'muted' | 'accent' | 'primary' | 'accentForeground' | 'primaryForeground';

export type IllustrationShape = {
    d: string;
    tone: IllustrationTone;
    /** Draws inner subpaths as holes (rings). */
    evenOdd?: boolean;
};

export type IllustrationName = 'splash' | 'join';

export type IllustrationProps = {
    name: IllustrationName;
    className?: string;
};
