// Props shared by una-splash.tsx (native) and una-splash.web.tsx.

export type UnaSplashProps = {
    /** UNA's splash code for this app (`data.splash.code`), with `<neo-slot>` placeholders. */
    code: string
    /** The page data: the placeholders' parts read the login form block from it. */
    data: any
}
