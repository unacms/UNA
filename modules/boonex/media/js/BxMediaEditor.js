/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MediaManager MediaManager
 * @ingroup     UnaModules
 */

/**
 * Image editor: crop, rotate, flip, straighten, filters, adjustments and resize.
 * No dependencies. Captions are language keys read with _t() when it is there.
 *
 * BxMediaEditor.open({
 *     src: 'https://...' | Blob | File,
 *     name: 'photo.jpg',             // file name of the result, optional
 *     aspectRatio: 16 / 9,           // lock the crop to this ratio, optional
 *     tools: ['crop', 'filter', 'finetune', 'resize'] // optional
 * }).then(function (oFile) { ... }); // a File, or null when the editor was closed
 */

(function (window, document) {
    'use strict';

    var PREVIEW_MAX_SIDE = 1600;
    var OUTPUT_MAX_PIXELS = 16000000; // iOS Safari refuses bigger canvases
    var CROP_MIN_SIZE = 32;           // display pixels
    var HISTORY_MAX = 50;

    var t = function (sKey, sFallback) {
        if (typeof window._t === 'function') {
            var s = window._t(sKey);
            if (s && s !== sKey)
                return s;
        }
        return sFallback;
    };

    /* ---------------- colour matrices (feColorMatrix layout: 4 rows of 5) ---------------- */

    var Matrix = {
        identity: function () {
            return [1, 0, 0, 0, 0,  0, 1, 0, 0, 0,  0, 0, 1, 0, 0,  0, 0, 0, 1, 0];
        },

        // apply b first, then a
        multiply: function (a, b) {
            var r = [];
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 5; j++) {
                    var v = j === 4 ? a[i * 5 + 4] : 0;
                    for (var k = 0; k < 4; k++)
                        v += a[i * 5 + k] * b[k * 5 + j];
                    r.push(v);
                }
            }
            return r;
        },

        mix: function (a, b, f) {
            return a.map(function (v, i) { return v + (b[i] - v) * f; });
        },

        brightness: function (v) {
            var o = v * 0.4;
            return [1, 0, 0, 0, o,  0, 1, 0, 0, o,  0, 0, 1, 0, o,  0, 0, 0, 1, 0];
        },

        contrast: function (x) {
            var o = (1 - x) / 2;
            return [x, 0, 0, 0, o,  0, x, 0, 0, o,  0, 0, x, 0, o,  0, 0, 0, 1, 0];
        },

        saturation: function (s) {
            var r = 0.213, g = 0.715, b = 0.072;
            return [
                r + (1 - r) * s, g - g * s, b - b * s, 0, 0,
                r - r * s, g + (1 - g) * s, b - b * s, 0, 0,
                r - r * s, g - g * s, b + (1 - b) * s, 0, 0,
                0, 0, 0, 1, 0
            ];
        },

        warmth: function (v) {
            var o = v * 0.12;
            return [1, 0, 0, 0, o,  0, 1, 0, 0, o * 0.3,  0, 0, 1, 0, -o,  0, 0, 0, 1, 0];
        },

        channels: function (r, g, b) {
            return [r, 0, 0, 0, 0,  0, g, 0, 0, 0,  0, 0, b, 0, 0,  0, 0, 0, 1, 0];
        },

        sepia: function () {
            return [0.393, 0.769, 0.189, 0, 0,  0.349, 0.686, 0.168, 0, 0,  0.272, 0.534, 0.131, 0, 0,  0, 0, 0, 1, 0];
        }
    };

    var FILTERS = [
        {name: 'none', key: '_bx_media_editor_filter_none', title: 'Original', matrix: function () { return Matrix.identity(); }},
        {name: 'mono', key: '_bx_media_editor_filter_mono', title: 'Mono', matrix: function () { return Matrix.saturation(0); }},
        {name: 'noir', key: '_bx_media_editor_filter_noir', title: 'Noir', matrix: function () { return Matrix.multiply(Matrix.contrast(1.4), Matrix.saturation(0)); }},
        {name: 'sepia', key: '_bx_media_editor_filter_sepia', title: 'Sepia', matrix: function () { return Matrix.sepia(); }},
        {name: 'vintage', key: '_bx_media_editor_filter_vintage', title: 'Vintage', matrix: function () { return Matrix.multiply(Matrix.contrast(0.9), Matrix.mix(Matrix.identity(), Matrix.sepia(), 0.5)); }},
        {name: 'fade', key: '_bx_media_editor_filter_fade', title: 'Fade', matrix: function () { return Matrix.multiply(Matrix.brightness(0.12), Matrix.multiply(Matrix.contrast(0.8), Matrix.saturation(0.8))); }},
        {name: 'vivid', key: '_bx_media_editor_filter_vivid', title: 'Vivid', matrix: function () { return Matrix.multiply(Matrix.contrast(1.1), Matrix.saturation(1.4)); }},
        {name: 'warm', key: '_bx_media_editor_filter_warm', title: 'Warm', matrix: function () { return Matrix.channels(1.08, 1, 0.88); }},
        {name: 'cool', key: '_bx_media_editor_filter_cool', title: 'Cool', matrix: function () { return Matrix.channels(0.9, 1, 1.1); }}
    ];

    var TUNES = [
        {name: 'brightness', key: '_bx_media_editor_brightness', title: 'Brightness'},
        {name: 'contrast', key: '_bx_media_editor_contrast', title: 'Contrast'},
        {name: 'saturation', key: '_bx_media_editor_saturation', title: 'Saturation'},
        {name: 'warmth', key: '_bx_media_editor_warmth', title: 'Warmth'}
    ];

    var ASPECTS = [
        {name: 'free', key: '_bx_media_editor_aspect_free', title: 'Free', ratio: null},
        {name: 'original', key: '_bx_media_editor_aspect_original', title: 'Original', ratio: 'original'},
        {name: '1:1', title: '1:1', ratio: 1},
        {name: '4:3', title: '4:3', ratio: 4 / 3},
        {name: '3:4', title: '3:4', ratio: 3 / 4},
        {name: '16:9', title: '16:9', ratio: 16 / 9},
        {name: '9:16', title: '9:16', ratio: 9 / 16}
    ];

    var TOOLS = {
        crop: {icon: 'crop', key: '_bx_media_editor_crop', title: 'Crop'},
        filter: {icon: 'wand-sparkles', key: '_bx_media_editor_filter', title: 'Filter'},
        finetune: {icon: 'sliders-horizontal', key: '_bx_media_editor_finetune', title: 'Adjust'},
        resize: {icon: 'scaling', key: '_bx_media_editor_resize', title: 'Resize'}
    };

    var clamp = function (v, a, b) {
        return Math.min(b, Math.max(a, v));
    };

    var el = function (sTag, sClass, oAttrs) {
        var e = document.createElement(sTag);
        if (sClass)
            e.className = sClass;
        if (oAttrs)
            for (var k in oAttrs)
                if (oAttrs.hasOwnProperty(k))
                    e.setAttribute(k, oAttrs[k]);
        return e;
    };

    // a Lucide icon from plugins_public, painted with the text colour
    var icon = function (sIcon) {
        var e = el('span', 'bx-media-editor-icon', {'aria-hidden': 'true'});
        e.style.setProperty('--bx-me-icon', 'url("' + (window.sUrlRoot || '/') + 'plugins_public/lucide/icons/' + sIcon + '.svg")');
        return e;
    };

    var iconButton = function (sIcon, sTitle, sClass, bLabel) {
        var b = el('button', 'bx-media-editor-btn ' + (sClass || ''), {type: 'button', title: sTitle, 'aria-label': sTitle});
        b.appendChild(icon(sIcon));
        if (bLabel) {
            var s = el('span', 'bx-media-editor-btn-label');
            s.textContent = sTitle;
            b.appendChild(s);
        }
        return b;
    };

    /* ---------------- editor ---------------- */

    function BxMediaEditor(oOptions) {
        this._o = oOptions || {};
        this._aTools = (this._o.tools || ['crop', 'filter', 'finetune', 'resize']).filter(function (s) { return TOOLS[s]; });
        this._fLockedRatio = this._o.aspectRatio ? parseFloat(this._o.aspectRatio) : null;
        this._sFilterId = 'bx-media-editor-filter-' + Math.random().toString(36).slice(2);
        this._aHistory = [];
        this._iHistory = -1;
        this._sTool = this._aTools[0] || 'crop';
        this._oImage = null;
        this._oPreview = null;  // canvas with the base image (rotated, flipped, straightened)
        this._oDisplay = null;  // {x, y, w, h} of the preview inside the stage, CSS pixels
        this._oDrag = null;
        this._bBusy = false;
        this._fResolve = null;
    }

    BxMediaEditor.open = function (oOptions) {
        return new BxMediaEditor(oOptions).open();
    };

    BxMediaEditor.prototype.open = function () {
        var $this = this;
        return new Promise(function (fResolve) {
            $this._fResolve = fResolve;
            $this._build();
            $this._load($this._o.src).then(function (oImage) {
                $this._oImage = oImage;
                $this._reset(true);
                $this._showTool($this._sTool);
                $this._root.classList.remove('bx-media-editor-loading');
            }, function () {
                $this._root.classList.remove('bx-media-editor-loading');
                $this._showError(t('_bx_media_editor_err_load', 'This image cannot be opened. Try another file.'));
            });
        });
    };

    /* ---------- loading ---------- */

    BxMediaEditor.prototype._load = function (mixedSrc) {
        var $this = this;
        return new Promise(function (fResolve, fReject) {
            var oImg = new Image();
            var sUrl = mixedSrc;
            if (mixedSrc instanceof Blob) {
                sUrl = URL.createObjectURL(mixedSrc);
                $this._sObjectUrl = sUrl;
                if (!$this._o.name && mixedSrc.name)
                    $this._o.name = mixedSrc.name;
                $this._sMime = mixedSrc.type;
            }
            else if (typeof sUrl === 'string' && sUrl.indexOf('data:') !== 0) {
                try {
                    if (new URL(sUrl, window.location.href).origin !== window.location.origin)
                        oImg.crossOrigin = 'anonymous';
                } catch (e) {}
            }
            oImg.onload = function () {
                if (!oImg.naturalWidth || !oImg.naturalHeight)
                    return fReject();
                fResolve(oImg);
            };
            oImg.onerror = fReject;
            oImg.src = sUrl;
        });
    };

    /* ---------- state ---------- */

    BxMediaEditor.prototype._defaultState = function () {
        return {
            rot: 0,
            flipX: false,
            flipY: false,
            angle: 0,
            crop: {x: 0, y: 0, w: 1, h: 1},
            aspect: this._fLockedRatio ? 'locked' : 'free',
            filter: 'none',
            tune: {brightness: 0, contrast: 0, saturation: 0, warmth: 0},
            size: null // {w, h} of the result, null for the cropped size
        };
    };

    BxMediaEditor.prototype._reset = function (bInitial) {
        this._s = this._defaultState();
        this._renderPreview();
        if (this._fLockedRatio)
            this._applyAspect(this._fLockedRatio);
        this._aHistory = [];
        this._iHistory = -1;
        this._commit();
        if (!bInitial)
            this._showTool(this._sTool);
    };

    BxMediaEditor.prototype._commit = function () {
        var s = JSON.stringify(this._s);
        if (this._iHistory >= 0 && this._aHistory[this._iHistory] === s)
            return;
        this._aHistory = this._aHistory.slice(0, this._iHistory + 1);
        this._aHistory.push(s);
        if (this._aHistory.length > HISTORY_MAX)
            this._aHistory.shift();
        this._iHistory = this._aHistory.length - 1;
        this._updateHistoryButtons();
    };

    BxMediaEditor.prototype._undo = function (iStep) {
        var i = this._iHistory + iStep;
        if (i < 0 || i >= this._aHistory.length)
            return;
        var oOld = this._s;
        this._iHistory = i;
        this._s = JSON.parse(this._aHistory[i]);
        if (oOld.rot !== this._s.rot || oOld.flipX !== this._s.flipX || oOld.flipY !== this._s.flipY || oOld.angle !== this._s.angle)
            this._renderPreview();
        this._layout();
        this._applyColor();
        this._updateHistoryButtons();
        this._showTool(this._sTool);
    };

    BxMediaEditor.prototype._isChanged = function () {
        return JSON.stringify(this._s) !== JSON.stringify(this._defaultState());
    };

    /* ---------- geometry ---------- */

    // size of the image after the 90 degree rotation
    BxMediaEditor.prototype._baseSize = function () {
        var w = this._oImage.naturalWidth, h = this._oImage.naturalHeight;
        return this._s.rot % 180 ? {w: h, h: w} : {w: w, h: h};
    };

    // draw the base image (rotation, flips, straightening) into a context scaled by k
    BxMediaEditor.prototype._drawBase = function (oCtx, k) {
        var s = this._s, b = this._baseSize();
        var a = s.angle * Math.PI / 180;
        var c = Math.abs(Math.cos(a)), n = Math.abs(Math.sin(a));
        var fCover = Math.max((b.w * c + b.h * n) / b.w, (b.w * n + b.h * c) / b.h);

        // straightening and flips go along the screen axes, then the 90 degree rotation
        oCtx.save();
        oCtx.translate(b.w * k / 2, b.h * k / 2);
        oCtx.rotate(a);
        oCtx.scale(s.flipX ? -1 : 1, s.flipY ? -1 : 1);
        oCtx.rotate(s.rot * Math.PI / 180);
        oCtx.scale(fCover * k, fCover * k);
        oCtx.imageSmoothingQuality = 'high';
        oCtx.drawImage(this._oImage, -this._oImage.naturalWidth / 2, -this._oImage.naturalHeight / 2);
        oCtx.restore();
    };

    BxMediaEditor.prototype._renderPreview = function () {
        var b = this._baseSize();
        var k = Math.min(1, PREVIEW_MAX_SIDE / Math.max(b.w, b.h));
        var c = this._oPreview || el('canvas', 'bx-media-editor-canvas');
        c.width = Math.max(1, Math.round(b.w * k));
        c.height = Math.max(1, Math.round(b.h * k));
        var oCtx = c.getContext('2d');
        oCtx.clearRect(0, 0, c.width, c.height);
        this._drawBase(oCtx, k);
        if (!this._oPreview) {
            this._oPreview = c;
            this._eCanvasWrap.insertBefore(c, this._eCanvasWrap.firstChild);
        }
        this._layout();
        this._applyColor();
    };

    // place the preview inside the stage: the crop area when cropping, the cropped image otherwise
    BxMediaEditor.prototype._layout = function () {
        if (!this._oPreview)
            return;

        var oStage = this._eStage.getBoundingClientRect();
        var iPad = this._sTool === 'crop' ? 24 : 12;
        var fW = Math.max(1, oStage.width - iPad * 2), fH = Math.max(1, oStage.height - iPad * 2);
        var b = this._baseSize(), cr = this._s.crop;
        var bCrop = this._sTool === 'crop';

        // the box that has to fit: the whole image when cropping, only the crop otherwise
        var fBoxW = bCrop ? b.w : b.w * cr.w, fBoxH = bCrop ? b.h : b.h * cr.h;
        var k = Math.min(fW / fBoxW, fH / fBoxH);
        var fImgW = b.w * k, fImgH = b.h * k;
        var fBoxX = (oStage.width - fBoxW * k) / 2, fBoxY = (oStage.height - fBoxH * k) / 2;

        // the clip shows the box, the canvas moves inside it
        var oClip = this._eClip.style, oWrap = this._eCanvasWrap.style;
        oClip.left = fBoxX + 'px';
        oClip.top = fBoxY + 'px';
        oClip.width = fBoxW * k + 'px';
        oClip.height = fBoxH * k + 'px';
        oWrap.left = (bCrop ? 0 : -cr.x * fImgW) + 'px';
        oWrap.top = (bCrop ? 0 : -cr.y * fImgH) + 'px';
        oWrap.width = fImgW + 'px';
        oWrap.height = fImgH + 'px';

        // the whole image in stage coordinates, for the crop frame
        this._oDisplay = {x: fBoxX, y: fBoxY, w: fImgW, h: fImgH};

        this._layoutCrop();
    };

    BxMediaEditor.prototype._layoutCrop = function () {
        var bCrop = this._sTool === 'crop';
        this._eCrop.style.display = bCrop ? '' : 'none';
        if (!bCrop || !this._oDisplay)
            return;
        var d = this._oDisplay, cr = this._s.crop;
        var oStyle = this._eCrop.style;
        oStyle.left = (d.x + cr.x * d.w) + 'px';
        oStyle.top = (d.y + cr.y * d.h) + 'px';
        oStyle.width = (cr.w * d.w) + 'px';
        oStyle.height = (cr.h * d.h) + 'px';
    };

    BxMediaEditor.prototype._currentRatio = function () {
        var s = this._s;
        if (s.aspect === 'locked')
            return this._fLockedRatio;
        if (s.aspect === 'free')
            return null;
        for (var i = 0; i < ASPECTS.length; i++) {
            if (ASPECTS[i].name !== s.aspect)
                continue;
            if (ASPECTS[i].ratio === 'original') {
                var b = this._baseSize();
                return b.w / b.h;
            }
            return ASPECTS[i].ratio;
        }
        return null;
    };

    // the largest crop with this ratio, centred on the current crop
    BxMediaEditor.prototype._applyAspect = function (fRatio) {
        var b = this._baseSize(), cr = this._s.crop;
        if (!fRatio)
            return;
        var fCx = cr.x + cr.w / 2, fCy = cr.y + cr.h / 2;
        var fW = b.w, fH = fW / fRatio;
        if (fH > b.h) {
            fH = b.h;
            fW = fH * fRatio;
        }
        var w = fW / b.w, h = fH / b.h;
        this._s.crop = {
            x: clamp(fCx - w / 2, 0, 1 - w),
            y: clamp(fCy - h / 2, 0, 1 - h),
            w: w,
            h: h
        };
        this._s.size = null;
    };

    /* ---------- colour ---------- */

    BxMediaEditor.prototype._colorMatrix = function () {
        var s = this._s, m = Matrix.identity();
        for (var i = 0; i < FILTERS.length; i++)
            if (FILTERS[i].name === s.filter)
                m = FILTERS[i].matrix();
        var tn = s.tune;
        m = Matrix.multiply(Matrix.saturation(1 + tn.saturation / 100), m);
        m = Matrix.multiply(Matrix.contrast(1 + tn.contrast / 100), m);
        m = Matrix.multiply(Matrix.brightness(tn.brightness / 100), m);
        m = Matrix.multiply(Matrix.warmth(tn.warmth / 100), m);
        return m;
    };

    BxMediaEditor.prototype._isColorChanged = function () {
        var s = this._s, tn = s.tune;
        return s.filter !== 'none' || tn.brightness || tn.contrast || tn.saturation || tn.warmth;
    };

    BxMediaEditor.prototype._applyColor = function () {
        if (!this._oPreview)
            return;
        if (!this._isColorChanged()) {
            this._oPreview.style.filter = '';
            return;
        }
        this._eMatrix.setAttribute('values', this._colorMatrix().join(' '));
        this._oPreview.style.filter = 'url(#' + this._sFilterId + ')';
    };

    var applyMatrixToCanvas = function (oCanvas, m) {
        var oCtx = oCanvas.getContext('2d');
        var oData = oCtx.getImageData(0, 0, oCanvas.width, oCanvas.height);
        var d = oData.data;
        for (var i = 0, l = d.length; i < l; i += 4) {
            var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, a = d[i + 3] / 255;
            d[i] = clamp((m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4]) * 255, 0, 255);
            d[i + 1] = clamp((m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9]) * 255, 0, 255);
            d[i + 2] = clamp((m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14]) * 255, 0, 255);
            d[i + 3] = clamp((m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19]) * 255, 0, 255);
        }
        oCtx.putImageData(oData, 0, 0);
    };

    /* ---------- output ---------- */

    BxMediaEditor.prototype._outputSize = function () {
        var b = this._baseSize(), cr = this._s.crop;
        var w = Math.max(1, Math.round(b.w * cr.w)), h = Math.max(1, Math.round(b.h * cr.h));
        return {w: w, h: h};
    };

    BxMediaEditor.prototype._export = function () {
        var $this = this;
        var b = this._baseSize(), cr = this._s.crop;
        var oCrop = this._outputSize();
        var oSize = this._s.size || oCrop;

        // keep the canvas under the limit browsers allow
        var fDown = Math.min(1, Math.sqrt(OUTPUT_MAX_PIXELS / (oCrop.w * oCrop.h)));

        var oCanvas = el('canvas');
        oCanvas.width = Math.max(1, Math.round(oCrop.w * fDown));
        oCanvas.height = Math.max(1, Math.round(oCrop.h * fDown));
        var oCtx = oCanvas.getContext('2d');
        oCtx.translate(-cr.x * b.w * fDown, -cr.y * b.h * fDown);
        this._drawBase(oCtx, fDown);

        // the limit holds for the result too
        var fFit = Math.min(1, oCanvas.width / oSize.w, oCanvas.height / oSize.h);
        oSize = {w: Math.max(1, Math.round(oSize.w * fFit)), h: Math.max(1, Math.round(oSize.h * fFit))};

        if (oSize.w !== oCanvas.width || oSize.h !== oCanvas.height)
            oCanvas = this._scaleCanvas(oCanvas, oSize.w, oSize.h);

        if (this._isColorChanged())
            applyMatrixToCanvas(oCanvas, this._colorMatrix());

        var sMime = this._outputMime();
        return new Promise(function (fResolve, fReject) {
            oCanvas.toBlob(function (oBlob) {
                if (!oBlob)
                    return fReject();
                fResolve(new File([oBlob], $this._outputName(sMime), {type: sMime}));
            }, sMime, 0.92);
        });
    };

    // halve step by step: one big step down looks jagged
    BxMediaEditor.prototype._scaleCanvas = function (oSrc, w, h) {
        var oCur = oSrc;
        while (oCur.width / 2 >= w && oCur.height / 2 >= h) {
            var oHalf = el('canvas');
            oHalf.width = Math.round(oCur.width / 2);
            oHalf.height = Math.round(oCur.height / 2);
            var oHalfCtx = oHalf.getContext('2d');
            oHalfCtx.imageSmoothingQuality = 'high';
            oHalfCtx.drawImage(oCur, 0, 0, oHalf.width, oHalf.height);
            oCur = oHalf;
        }
        var oDst = el('canvas');
        oDst.width = w;
        oDst.height = h;
        var oCtx = oDst.getContext('2d');
        oCtx.imageSmoothingQuality = 'high';
        oCtx.drawImage(oCur, 0, 0, w, h);
        return oDst;
    };

    BxMediaEditor.prototype._outputMime = function () {
        var sMime = this._sMime || '';
        if (!sMime) {
            var m = /\.(jpe?g|png|webp)(\?|$)/i.exec(this._o.name || (typeof this._o.src === 'string' ? this._o.src : ''));
            if (m)
                sMime = 'image/' + (m[1].toLowerCase() === 'jpg' ? 'jpeg' : m[1].toLowerCase());
        }
        return ['image/jpeg', 'image/png', 'image/webp'].indexOf(sMime) !== -1 ? sMime : 'image/png';
    };

    BxMediaEditor.prototype._outputName = function (sMime) {
        var sExt = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[sMime];
        var sName = this._o.name || '';
        if (!sName && typeof this._o.src === 'string')
            sName = decodeURIComponent(this._o.src.split('?')[0].split('/').pop() || '');
        sName = sName.replace(/\.[a-z0-9]+$/i, '') || 'image';
        return sName + '.' + sExt;
    };

    /* ---------- DOM ---------- */

    BxMediaEditor.prototype._build = function () {
        var $this = this;

        var r = this._root = el('div', 'bx-media-editor bx-media-editor-loading', {role: 'dialog', 'aria-modal': 'true'});

        // colour filter for the preview
        var sNs = 'http://www.w3.org/2000/svg';
        var oSvg = document.createElementNS(sNs, 'svg');
        oSvg.setAttribute('class', 'bx-media-editor-defs');
        oSvg.setAttribute('aria-hidden', 'true');
        var oFilter = document.createElementNS(sNs, 'filter');
        oFilter.setAttribute('id', this._sFilterId);
        oFilter.setAttribute('color-interpolation-filters', 'sRGB');
        this._eMatrix = document.createElementNS(sNs, 'feColorMatrix');
        this._eMatrix.setAttribute('type', 'matrix');
        oFilter.appendChild(this._eMatrix);
        oSvg.appendChild(oFilter);
        r.appendChild(oSvg);

        // top bar
        var eTop = el('div', 'bx-media-editor-top');
        var eClose = iconButton('x', t('_bx_media_editor_close', 'Close'));
        eClose.addEventListener('click', function () { $this._close(null); });
        this._eReset = iconButton('rotate-ccw', t('_bx_media_editor_reset', 'Reset'));
        this._eReset.addEventListener('click', function () { $this._reset(false); });
        var eLeft = el('div', 'bx-media-editor-top-side');
        eLeft.appendChild(eClose);
        eLeft.appendChild(this._eReset);

        var eMid = el('div', 'bx-media-editor-top-mid');
        this._eUndo = iconButton('undo-2', t('_bx_media_editor_undo', 'Undo'));
        this._eUndo.addEventListener('click', function () { $this._undo(-1); });
        this._eRedo = iconButton('redo-2', t('_bx_media_editor_redo', 'Redo'));
        this._eRedo.addEventListener('click', function () { $this._undo(1); });
        eMid.appendChild(this._eUndo);
        eMid.appendChild(this._eRedo);

        var eRight = el('div', 'bx-media-editor-top-side bx-media-editor-top-right');
        this._eDone = el('button', 'bx-btn bx-btn-primary bx-btn-small bx-media-editor-done', {type: 'button'});
        this._eDone.textContent = t('_bx_media_editor_done', 'Done');
        this._eDone.addEventListener('click', function () { $this._done(); });
        eRight.appendChild(this._eDone);

        eTop.appendChild(eLeft);
        eTop.appendChild(eMid);
        eTop.appendChild(eRight);
        r.appendChild(eTop);

        // body: tools, stage, panel
        var eBody = el('div', 'bx-media-editor-body');
        this._eTools = el('div', 'bx-media-editor-tools', {role: 'tablist'});
        this._aTools.forEach(function (sTool) {
            var o = TOOLS[sTool];
            var b = iconButton(o.icon, t(o.key, o.title), 'bx-media-editor-tool', true);
            b.setAttribute('role', 'tab');
            b.setAttribute('data-tool', sTool);
            b.addEventListener('click', function () { $this._showTool(sTool); });
            $this._eTools.appendChild(b);
        });
        if (this._aTools.length < 2)
            this._eTools.style.display = 'none';

        var eMain = el('div', 'bx-media-editor-main');
        this._eStage = el('div', 'bx-media-editor-stage');
        this._eClip = el('div', 'bx-media-editor-clip');
        this._eCanvasWrap = el('div', 'bx-media-editor-canvas-wrap');
        this._eClip.appendChild(this._eCanvasWrap);
        this._eStage.appendChild(this._eClip);

        this._eCrop = el('div', 'bx-media-editor-crop');
        this._eCrop.appendChild(el('div', 'bx-media-editor-crop-grid'));
        ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(function (sDir) {
            var h = el('div', 'bx-media-editor-handle bx-media-editor-handle-' + sDir, {'data-dir': sDir});
            $this._eCrop.appendChild(h);
        });
        this._eStage.appendChild(this._eCrop);

        this._eError = el('div', 'bx-media-editor-error');
        this._eStage.appendChild(this._eError);
        this._eStage.appendChild(el('div', 'bx-media-editor-spinner'));

        this._ePanel = el('div', 'bx-media-editor-panel');

        eMain.appendChild(this._eStage);
        eMain.appendChild(this._ePanel);
        eBody.appendChild(this._eTools);
        eBody.appendChild(eMain);
        r.appendChild(eBody);

        this._bindCrop();

        this._fOnResize = function () { $this._layout(); };
        this._fOnKey = function (e) { $this._onKey(e); };
        window.addEventListener('resize', this._fOnResize);
        document.addEventListener('keydown', this._fOnKey);

        this._sBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(r);
        this._updateHistoryButtons();
        this._eDone.focus();
    };

    BxMediaEditor.prototype._onKey = function (e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this._close(null);
            return;
        }
        var bMod = e.ctrlKey || e.metaKey;
        if (bMod && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            this._undo(e.shiftKey ? 1 : -1);
        }
        else if (bMod && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            this._undo(1);
        }
    };

    BxMediaEditor.prototype._updateHistoryButtons = function () {
        if (!this._eUndo)
            return;
        this._eUndo.disabled = this._iHistory <= 0;
        this._eRedo.disabled = this._iHistory >= this._aHistory.length - 1;
        this._eReset.disabled = !this._oImage || !this._isChanged();
    };

    BxMediaEditor.prototype._showError = function (s) {
        this._eError.textContent = s;
        this._eError.style.display = 'block';
        this._eDone.disabled = true;
    };

    BxMediaEditor.prototype._showTool = function (sTool) {
        if (!this._oImage)
            return;
        this._sTool = sTool;
        Array.prototype.forEach.call(this._eTools.children, function (b) {
            var bActive = b.getAttribute('data-tool') === sTool;
            b.classList.toggle('bx-media-editor-tool-active', bActive);
            b.setAttribute('aria-selected', bActive ? 'true' : 'false');
        });
        this._ePanel.innerHTML = '';
        this._root.setAttribute('data-tool', sTool);
        var f = this['_panel' + sTool.charAt(0).toUpperCase() + sTool.slice(1)];
        if (f)
            f.call(this, this._ePanel);
        this._layout();
    };

    /* ---------- panels ---------- */

    BxMediaEditor.prototype._panelCrop = function (ePanel) {
        var $this = this;

        var eRow = el('div', 'bx-media-editor-row');
        var eRotate = iconButton('rotate-ccw', t('_bx_media_editor_rotate_left', 'Rotate left'), '', true);
        eRotate.addEventListener('click', function () {
            $this._s.rot = ($this._s.rot + 270) % 360;
            $this._s.crop = {x: 0, y: 0, w: 1, h: 1};
            $this._s.size = null;
            $this._renderPreview();
            var f = $this._currentRatio();
            if (f)
                $this._applyAspect(f);
            $this._layout();
            $this._commit();
        });
        var eFlipH = iconButton('flip-vertical-2', t('_bx_media_editor_flip_horizontal', 'Flip horizontally'), '', true);
        eFlipH.addEventListener('click', function () {
            $this._s.flipX = !$this._s.flipX;
            $this._s.crop.x = 1 - $this._s.crop.x - $this._s.crop.w;
            $this._renderPreview();
            $this._commit();
        });
        var eFlipV = iconButton('flip-horizontal-2', t('_bx_media_editor_flip_vertical', 'Flip vertically'), '', true);
        eFlipV.addEventListener('click', function () {
            $this._s.flipY = !$this._s.flipY;
            $this._s.crop.y = 1 - $this._s.crop.y - $this._s.crop.h;
            $this._renderPreview();
            $this._commit();
        });
        eRow.appendChild(eRotate);
        eRow.appendChild(eFlipH);
        eRow.appendChild(eFlipV);
        ePanel.appendChild(eRow);

        // straighten
        ePanel.appendChild(this._slider('straighten', t('_bx_media_editor_straighten', 'Straighten'), -45, 45, this._s.angle, '°', function (v) {
            $this._s.angle = v;
            $this._renderPreview();
        }));

        // aspect ratio, unless the caller locked it
        if (!this._fLockedRatio) {
            var eAspects = el('div', 'bx-media-editor-row bx-media-editor-chips');
            ASPECTS.forEach(function (o) {
                var b = el('button', 'bx-media-editor-chip', {type: 'button'});
                b.textContent = o.key ? t(o.key, o.title) : o.title;
                b.classList.toggle('bx-media-editor-chip-active', $this._s.aspect === o.name);
                b.addEventListener('click', function () {
                    $this._s.aspect = o.name;
                    var f = $this._currentRatio();
                    if (f)
                        $this._applyAspect(f);
                    Array.prototype.forEach.call(eAspects.children, function (c) { c.classList.remove('bx-media-editor-chip-active'); });
                    b.classList.add('bx-media-editor-chip-active');
                    $this._layoutCrop();
                    $this._commit();
                });
                eAspects.appendChild(b);
            });
            ePanel.appendChild(eAspects);
        }
    };

    BxMediaEditor.prototype._panelFilter = function (ePanel) {
        var $this = this;
        var eList = el('div', 'bx-media-editor-filters');

        // small sample of the cropped image for the thumbnails
        var oSample = el('canvas');
        var cr = this._s.crop, p = this._oPreview;
        var sx = cr.x * p.width, sy = cr.y * p.height, sw = cr.w * p.width, sh = cr.h * p.height;
        var k = 72 / Math.max(sw, sh);
        oSample.width = Math.max(1, Math.round(sw * k));
        oSample.height = Math.max(1, Math.round(sh * k));
        oSample.getContext('2d').drawImage(p, sx, sy, sw, sh, 0, 0, oSample.width, oSample.height);

        FILTERS.forEach(function (o) {
            var b = el('button', 'bx-media-editor-filter', {type: 'button'});
            var c = el('canvas');
            c.width = oSample.width;
            c.height = oSample.height;
            c.getContext('2d').drawImage(oSample, 0, 0);
            if (o.name !== 'none')
                applyMatrixToCanvas(c, o.matrix());
            var s = el('span');
            s.textContent = t(o.key, o.title);
            b.appendChild(c);
            b.appendChild(s);
            b.classList.toggle('bx-media-editor-filter-active', $this._s.filter === o.name);
            b.addEventListener('click', function () {
                $this._s.filter = o.name;
                Array.prototype.forEach.call(eList.children, function (c) { c.classList.remove('bx-media-editor-filter-active'); });
                b.classList.add('bx-media-editor-filter-active');
                $this._applyColor();
                $this._commit();
            });
            eList.appendChild(b);
        });
        ePanel.appendChild(eList);
    };

    BxMediaEditor.prototype._panelFinetune = function (ePanel) {
        var $this = this;
        TUNES.forEach(function (o) {
            ePanel.appendChild($this._slider(o.name, t(o.key, o.title), -100, 100, $this._s.tune[o.name], '', function (v) {
                $this._s.tune[o.name] = v;
                $this._applyColor();
            }));
        });
    };

    BxMediaEditor.prototype._panelResize = function (ePanel) {
        var $this = this;
        var oMax = this._outputSize();
        var oCur = this._s.size || oMax;
        var bLock = true;

        var eRow = el('div', 'bx-media-editor-row bx-media-editor-resize');
        var mkInput = function (sKey, sTitle, iValue) {
            var l = el('label', 'bx-media-editor-field');
            var s = el('span');
            s.textContent = t(sKey, sTitle);
            var i = el('input', 'bx-def-font-inputs', {type: 'number', min: '1', step: '1', inputmode: 'numeric'});
            i.value = iValue;
            l.appendChild(s);
            l.appendChild(i);
            eRow.appendChild(l);
            return i;
        };
        var eW = mkInput('_bx_media_editor_width', 'Width', oCur.w);
        var eLock = iconButton('lock', t('_bx_media_editor_keep_ratio', 'Keep proportions'), 'bx-media-editor-lock bx-media-editor-lock-on');
        eRow.appendChild(eLock);
        var eH = mkInput('_bx_media_editor_height', 'Height', oCur.h);
        ePanel.appendChild(eRow);

        var eNote = el('div', 'bx-media-editor-note');
        eNote.textContent = t('_bx_media_editor_resize_note', 'The image cannot be made larger than the cropped area.');
        ePanel.appendChild(eNote);

        var fSet = function (w, h) {
            w = clamp(Math.round(w) || 1, 1, oMax.w);
            h = clamp(Math.round(h) || 1, 1, oMax.h);
            $this._s.size = (w === oMax.w && h === oMax.h) ? null : {w: w, h: h};
            eW.value = w;
            eH.value = h;
            $this._commit();
        };
        eW.addEventListener('change', function () {
            var w = parseInt(eW.value, 10);
            fSet(w, bLock ? w * oMax.h / oMax.w : parseInt(eH.value, 10));
        });
        eH.addEventListener('change', function () {
            var h = parseInt(eH.value, 10);
            fSet(bLock ? h * oMax.w / oMax.h : parseInt(eW.value, 10), h);
        });
        eLock.addEventListener('click', function () {
            bLock = !bLock;
            eLock.classList.toggle('bx-media-editor-lock-on', bLock);
            eLock.replaceChild(icon(bLock ? 'lock' : 'lock-open'), eLock.firstChild);
            if (bLock)
                fSet(parseInt(eW.value, 10), parseInt(eW.value, 10) * oMax.h / oMax.w);
        });
    };

    BxMediaEditor.prototype._slider = function (sName, sTitle, iMin, iMax, iValue, sUnit, fOnInput) {
        var $this = this;
        var eWrap = el('label', 'bx-media-editor-slider');
        var eHead = el('span', 'bx-media-editor-slider-head');
        var eTitle = el('span');
        eTitle.textContent = sTitle;
        var eValue = el('span', 'bx-media-editor-slider-value');
        var fShow = function (v) { eValue.textContent = (v > 0 ? '+' : '') + v + sUnit; };
        fShow(iValue);
        eHead.appendChild(eTitle);
        eHead.appendChild(eValue);
        var eInput = el('input', '', {type: 'range', min: String(iMin), max: String(iMax), step: '1', name: sName});
        eInput.value = iValue;
        eInput.addEventListener('input', function () {
            var v = parseInt(eInput.value, 10);
            fShow(v);
            fOnInput(v);
        });
        eInput.addEventListener('change', function () { $this._commit(); });
        // double click puts the slider back to zero
        eInput.addEventListener('dblclick', function () {
            eInput.value = 0;
            fShow(0);
            fOnInput(0);
            $this._commit();
        });
        eWrap.appendChild(eHead);
        eWrap.appendChild(eInput);
        return eWrap;
    };

    /* ---------- crop interaction ---------- */

    BxMediaEditor.prototype._bindCrop = function () {
        var $this = this;

        this._eCrop.addEventListener('pointerdown', function (e) {
            if (e.button !== 0 || !$this._oDisplay)
                return;
            e.preventDefault();
            var sDir = e.target.getAttribute('data-dir') || 'move';
            $this._oDrag = {
                dir: sDir,
                id: e.pointerId,
                x: e.clientX,
                y: e.clientY,
                crop: JSON.parse(JSON.stringify($this._s.crop))
            };
            $this._eCrop.setPointerCapture(e.pointerId);
            $this._root.classList.add('bx-media-editor-dragging');
        });

        this._eCrop.addEventListener('pointermove', function (e) {
            var g = $this._oDrag;
            if (!g || g.id !== e.pointerId)
                return;
            $this._dragCrop(g, (e.clientX - g.x) / $this._oDisplay.w, (e.clientY - g.y) / $this._oDisplay.h);
            $this._layoutCrop();
        });

        var fEnd = function (e) {
            var g = $this._oDrag;
            if (!g || g.id !== e.pointerId)
                return;
            $this._oDrag = null;
            $this._root.classList.remove('bx-media-editor-dragging');
            if (JSON.stringify(g.crop) !== JSON.stringify($this._s.crop)) {
                $this._s.size = null;
                $this._commit();
            }
        };
        this._eCrop.addEventListener('pointerup', fEnd);
        this._eCrop.addEventListener('pointercancel', fEnd);
    };

    // dx, dy: pointer movement as a part of the image size
    BxMediaEditor.prototype._dragCrop = function (g, dx, dy) {
        var c0 = g.crop, d = this._oDisplay;
        var fMinW = CROP_MIN_SIZE / d.w, fMinH = CROP_MIN_SIZE / d.h;

        if (g.dir === 'move') {
            this._s.crop = {
                x: clamp(c0.x + dx, 0, 1 - c0.w),
                y: clamp(c0.y + dy, 0, 1 - c0.h),
                w: c0.w,
                h: c0.h
            };
            return;
        }

        var l = c0.x, t0 = c0.y, r = c0.x + c0.w, b = c0.y + c0.h;
        if (g.dir.indexOf('w') !== -1) l = clamp(l + dx, 0, r - fMinW);
        if (g.dir.indexOf('e') !== -1) r = clamp(r + dx, l + fMinW, 1);
        if (g.dir.indexOf('n') !== -1) t0 = clamp(t0 + dy, 0, b - fMinH);
        if (g.dir.indexOf('s') !== -1) b = clamp(b + dy, t0 + fMinH, 1);

        var fRatio = this._currentRatio();
        if (fRatio) {
            // ratio in normalized units: width/height of the image differ
            var k = fRatio * d.h / d.w;
            var w = r - l, h = b - t0;
            var bHorizontal = g.dir === 'e' || g.dir === 'w';
            var bVertical = g.dir === 'n' || g.dir === 's';
            if (bHorizontal || (!bVertical && w / h > k))
                h = w / k;
            else
                w = h * k;

            // the anchor is the opposite side or corner
            var fAx = g.dir.indexOf('w') !== -1 ? c0.x + c0.w : (g.dir.indexOf('e') !== -1 ? c0.x : c0.x + c0.w / 2);
            var fAy = g.dir.indexOf('n') !== -1 ? c0.y + c0.h : (g.dir.indexOf('s') !== -1 ? c0.y : c0.y + c0.h / 2);

            // shrink to fit into the image from the anchor
            var fMaxW = g.dir.indexOf('w') !== -1 ? fAx : (g.dir.indexOf('e') !== -1 ? 1 - fAx : 2 * Math.min(fAx, 1 - fAx));
            var fMaxH = g.dir.indexOf('n') !== -1 ? fAy : (g.dir.indexOf('s') !== -1 ? 1 - fAy : 2 * Math.min(fAy, 1 - fAy));
            var f = Math.min(1, fMaxW / w, fMaxH / h);
            w *= f;
            h *= f;
            if (w < fMinW || h < fMinH)
                return;

            l = g.dir.indexOf('w') !== -1 ? fAx - w : (g.dir.indexOf('e') !== -1 ? fAx : fAx - w / 2);
            t0 = g.dir.indexOf('n') !== -1 ? fAy - h : (g.dir.indexOf('s') !== -1 ? fAy : fAy - h / 2);
            r = l + w;
            b = t0 + h;
        }

        this._s.crop = {x: l, y: t0, w: r - l, h: b - t0};
    };

    /* ---------- finish ---------- */

    BxMediaEditor.prototype._done = function () {
        var $this = this;
        if (this._bBusy || !this._oImage)
            return;
        this._bBusy = true;
        this._root.classList.add('bx-media-editor-loading');
        // let the spinner show before the heavy work
        setTimeout(function () {
            $this._export().then(function (oFile) {
                $this._close(oFile);
            }, function () {
                $this._bBusy = false;
                $this._root.classList.remove('bx-media-editor-loading');
                $this._showError(t('_bx_media_editor_err_save', 'The image cannot be saved. Please try again.'));
            });
        }, 30);
    };

    BxMediaEditor.prototype._close = function (oFile) {
        if (!this._root)
            return;
        window.removeEventListener('resize', this._fOnResize);
        document.removeEventListener('keydown', this._fOnKey);
        document.body.style.overflow = this._sBodyOverflow;
        this._root.parentNode.removeChild(this._root);
        this._root = null;
        if (this._sObjectUrl)
            URL.revokeObjectURL(this._sObjectUrl);
        if (this._fResolve)
            this._fResolve(oFile);
    };

    window.BxMediaEditor = BxMediaEditor;

})(window, document);
