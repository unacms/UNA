Inter, used to draw share cards (see inc/classes/BxDolShareCardRenderer.php).

Inter-Variable.ttf
    Upstream release from https://github.com/rsms/inter, unmodified.

Inter-SemiBold.ttf
    A static instance of the file above, produced with fontTools:

        from fontTools.ttLib import TTFont
        from fontTools.varLib import instancer
        f = TTFont('Inter-Variable.ttf')
        inst = instancer.instantiateVariableFont(
            f, {'wght': 600, 'opsz': 28}, inplace=False, updateFontNames=True)
        inst.save('Inter-SemiBold.ttf')

    GD and Imagick both rasterise only a variable font's default instance, which is
    Regular - so without a real face, bold had to be faked by drawing the same outlines
    twice a pixel apart. That thickens a glyph on one axis and reads as smeared rather
    than bold. wght 600 is Inter's own named SemiBold; opsz 28 is its display end, which
    suits a 56px title.

Both files are licensed under the SIL Open Font License 1.1 (OFL.txt). Inter declares no
Reserved Font Name, so the instance keeps the family name.
