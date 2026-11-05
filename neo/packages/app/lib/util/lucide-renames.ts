/**
 * Lucide icons renamed without an alias, by their old names: the drawing is the same under the new name
 * (checked against lucide-static 1.66.0, whose icons/ folder still has the old files). UNA, settings and older
 * code keep sending the old names (the Credits app's `copyright`, `History`, `SmilePlus`, `Trash2`), which
 * no Lucide package draws any more: web had no file for them and native no component.
 * The Lucide fallbacks turn them into the new names (`Icon` once no custom drawing has the name, `lucideAssetName`
 * for native assets), so an icons-svg drawing registered under an old name still wins. Add a row when a Lucide update
 * renames another one.
 */
export const LUCIDE_RENAMES: Readonly<Record<string, string>> = {
    Album: 'SquareBookmark',
    Angry: 'FaceAngry',
    Annoyed: 'FaceExpressionless',
    ArchiveRestore: 'ArchiveArrowUp',
    Bold: 'LetterB',
    BookMarked: 'BookBookmark',
    Building2: 'BuildingComplex',
    CircleParkingOff: 'CircleLetterPOff',
    CircleParking: 'CircleLetterP',
    Copyright: 'CircleLetterC',
    FlipHorizontal2: 'TrianglesCenterlineDashedHorizontal',
    FlipVertical2: 'TrianglesCenterlineDashedVertical',
    Frown: 'FaceSlightlyFrowning',
    Heading: 'LetterH',
    History: 'RotateCcwClock',
    Laugh: 'FaceGrinning',
    Meh: 'FaceNeutral',
    Music2: 'EighthNote',
    Music3: 'HalfNote',
    Music4: 'SixteenthNotes',
    Music: 'EighthNotes',
    Podcast: 'MicSignal',
    SmilePlus: 'FaceSlightlySmilingPlus',
    Smile: 'FaceSlightlySmiling',
    SquareM: 'SquareLetterM',
    SquareParkingOff: 'SquareLetterPOff',
    SquareParking: 'SquareLetterP',
    Trash2: 'Trash',
};

/** The current Lucide name for `name`, which may be one Lucide has since renamed. */
export function currentLucideName<T extends string | null | undefined>(name: T): T | string {
    return (name && LUCIDE_RENAMES[name]) || name;
}
