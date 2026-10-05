import { appSetting } from 'app/lib/util/settings'

const DEFAULT_MAX = 2000
const DEFAULT_WEBP_OVER_MB = 4
const DEFAULT_PICTURE_SIZE = 400

function asObject(value: any) {
    return value && typeof value === 'object' ? value : {}
}

export function getModuleFromFormName(formName: string) {
    const name = String(formName || '').toLowerCase()
    if (!name) return ''
    const match = name.match(/^(bx_[a-z0-9]+)/)
    return match ? match[1] : name
}

export function parseAspectRatioClass(cls: string) {
    const str = String(cls || '')
    const match = str.match(/aspect-(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/)
    if (match) return Number(match[1]) / Number(match[2])
    if (str.includes('aspect-square')) return 1
    if (str.includes('aspect-video')) return 16 / 9
    return null
}

export function getImageUploadConfig() {
    return asObject(appSetting('forms', 'image_upload'))
}

export function getImageUploadLimits(formName: string) {
    const cfg = getImageUploadConfig()
    const module = getModuleFromFormName(formName)
    const skipMap = asObject(cfg.skip_resize)
    const moduleCfg = asObject(asObject(cfg.by_module)[module as string])
    const skip = skipMap[module as string] === true || moduleCfg.skip === true

    return {
        module,
        skip,
        maxWidth: Number(moduleCfg.max_width || cfg.max_width) || DEFAULT_MAX,
        maxHeight: Number(moduleCfg.max_height || cfg.max_height) || DEFAULT_MAX,
        webpOverMb: Number(moduleCfg.webp_over_mb || cfg.webp_over_mb) || DEFAULT_WEBP_OVER_MB,
    }
}

export function shouldSkipImageCrop(formName: string) {
    const module = getModuleFromFormName(formName)
    if (!module) return false
    if (appSetting('cover', 'skip_crop', module) === true) return true
    return getImageUploadLimits(formName).skip
}

export function getCoverAspectClass(formNameOrModule: string) {
    const module = getModuleFromFormName(formNameOrModule)
    const byModule = module ? appSetting('cover', 'aspect_ratio_by_module', module) : ''
    if (byModule) return byModule
    return appSetting('cover', 'aspect_ratio') || 'aspect-3/1'
}

export function getPictureCropOutput() {
    return Number(appSetting('cover', 'picture_size')) || DEFAULT_PICTURE_SIZE
}

export function getCoverCropMaxWidth() {
    return Number(appSetting('cover', 'crop_max_width')) || DEFAULT_MAX
}

export function getUploadWebpOverMb() {
    return Number(getImageUploadConfig().webp_over_mb) || DEFAULT_WEBP_OVER_MB
}
