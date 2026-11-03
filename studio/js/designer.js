/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioDesigner(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioDesigner' : oOptions.sObjName;
    this.sParamPrefix = oOptions.sParamPrefix == undefined ? 'dsg' : oOptions.sParamPrefix;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
}

BxDolStudioDesigner.prototype.makeDefault = function(sUri) {
    var $this = this;
    var oDate = new Date();
    var aParams = {_t: oDate.getTime()};
    aParams[this.sParamPrefix + '_action'] = 'make_default';
    aParams[this.sParamPrefix + '_value'] = sUri;

    $.post(
        this.sActionsUrl,
        aParams,
        function(oData) {
            if(oData.code != 0 && oData.message.length > 0) {
                bx_alert(oData.message);
                return;
            }

            document.location.href = document.location.href; 
        },
        'json'
    );
};

BxDolStudioDesigner.prototype.deleteLogo = function(sName, oButton) {
    var $this = this;

    bx_confirm($(oButton).attr('data-confirm'), function() {
        var oDate = new Date();
        var aParams = {_t: oDate.getTime()};
        aParams[$this.sParamPrefix + '_action'] = 'delete_logo';
        aParams[$this.sParamPrefix + '_value'] = sName;
        aParams['csrf_token'] = $(oButton).parents('form:first').find('input[name=csrf_token]').val();

        $.post(
            $this.sActionsUrl,
            aParams,
            function(oData) {
                if(oData.code != 0 && oData.message.length > 0) {
                    bx_alert(oData.message);
                    return;
                }

                // Every preview may change (a dark slot shows the light image when it has none), so reload them all.
                document.location.reload();
            },
            'json'
        );
    });
};

/**
 * Shows the editor's code, saved or not, in the Landing page preview: posted to splash.php with the form's CSRF token,
 * which splash.php checks before it renders posted code for an admin.
 */
BxDolStudioDesigner.prototype.previewSplash = function(oButton, sFrame, sUrl) {
    var oForm = $(oButton).parents('form:first');
    var oCode = oForm.find('textarea[name=code]');
    var oEditor = oCode.nextAll('.CodeMirror').get(0);
    var sCode = oEditor && oEditor.CodeMirror ? oEditor.CodeMirror.getValue() : oCode.val();

    // A form of its own (forms don't nest), posted into the preview frame.
    var oPost = $('<form method="post" class="bx-std-hidden"></form>').attr({action: sUrl, target: sFrame});
    oPost.append($('<input type="hidden" name="code" />').val(sCode));
    oPost.append($('<input type="hidden" name="csrf_token" />').val(oForm.find('input[name=csrf_token]').val()));

    $('body').append(oPost);
    oPost.get(0).submit();
    oPost.remove();
};

/**
 * Full-screen code editor: moves the code editor of the form's sField textarea into a modal dialog, and back when the
 * dialog closes. The editor itself moves, so its text, history and cursor stay as they were.
 */
BxDolStudioDesigner.prototype.openCodeFullscreen = function(oButton, sDialog, sField) {
    var oDialog = document.getElementById(sDialog);
    var oEditor = $(oButton).parents('form:first').find('textarea[name="' + (sField || 'code') + '"]').nextAll('.CodeMirror').get(0);
    if(!oDialog || typeof(oDialog.showModal) != 'function' || !oEditor || !oEditor.CodeMirror)
        return;

    var oMarker = document.createComment('');
    var sHeight = oEditor.style.height;
    oEditor.parentNode.insertBefore(oMarker, oEditor);
    $(oDialog).find('.adm-dsg-fs-code').append(oEditor);

    $(oDialog).one('close', function() {
        oMarker.parentNode.replaceChild(oEditor, oMarker);
        oEditor.style.height = sHeight;
        oEditor.CodeMirror.refresh();
        oButton.focus();
    });

    oDialog.showModal();
    oEditor.CodeMirror.refresh();
    oEditor.CodeMirror.focus();
};

/**
 * Full-screen preview: a modal dialog with its own frame, showing the editor's code at a chosen viewport width.
 */
BxDolStudioDesigner.prototype.openPreviewFullscreen = function(oButton, sDialog, sFrame, sUrl) {
    var $this = this;
    var oDialog = document.getElementById(sDialog);
    if(!oDialog || typeof(oDialog.showModal) != 'function') {
        window.open(sUrl, '_blank', 'noopener');
        return;
    }

    // Dragging the frame's resize handle changes its width, and the window the room for it: keep the scale and controls in step.
    var oViewport = $(oDialog).find('.adm-dsg-fs-viewport').get(0);
    if(!oViewport.bxObserved && typeof(window.ResizeObserver) != 'undefined') {
        var oObserver = new ResizeObserver(function() {
            $this.syncPreviewViewport(oDialog);
        });
        oObserver.observe(oViewport);
        oObserver.observe($(oDialog).find('.adm-dsg-fs-stage').get(0));
        oViewport.bxObserved = true;
    }

    $(oDialog).one('close', function() {
        oButton.focus();
    });

    oDialog.showModal();
    this.syncPreviewViewport(oDialog);
    this.previewSplash(oButton, sFrame, sUrl);
};

/**
 * Sets the full-screen preview's width: a preset, a typed width, or no width (Custom), which moves focus to the width field.
 */
BxDolStudioDesigner.prototype.setPreviewViewport = function(oControl, iWidth) {
    var oDialog = $(oControl).parents('dialog:first');
    var oViewport = oDialog.find('.adm-dsg-fs-viewport').get(0);

    iWidth = parseInt(iWidth, 10);
    if(isNaN(iWidth)) {
        oViewport.setAttribute('data-custom', 1);
        this.syncPreviewViewport(oDialog.get(0));
        oDialog.find('.adm-dsg-fs-width-input').focus().select();
        return;
    }

    iWidth = Math.min(3840, Math.max(320, iWidth));
    if($(oControl).is('.adm-dsg-fs-width-input'))
        $(oControl).val(iWidth);

    oViewport.removeAttribute('data-custom');
    oViewport.style.width = iWidth + 'px';
    this.syncPreviewViewport(oDialog.get(0));
};

/**
 * Fits the full-screen preview into its stage: a width wider than the stage is scaled down, so the page still lays
 * out at that width. Then the width field, the zoom readout and the pressed preset follow.
 */
BxDolStudioDesigner.prototype.syncPreviewViewport = function(oDialog) {
    var oStage = $(oDialog).find('.adm-dsg-fs-stage').get(0);
    var oViewport = $(oDialog).find('.adm-dsg-fs-viewport').get(0);
    var oStyle = window.getComputedStyle(oStage);
    var iRoomX = oStage.clientWidth - parseFloat(oStyle.paddingLeft) - parseFloat(oStyle.paddingRight);
    var iRoomY = oStage.clientHeight - parseFloat(oStyle.paddingTop) - parseFloat(oStyle.paddingBottom);

    var iSet = oViewport.offsetWidth;
    var fScale = iRoomX > 0 && iSet > iRoomX ? iRoomX / iSet : 1;

    oViewport.style.transform = fScale < 1 ? 'scale(' + fScale + ')' : '';
    oViewport.style.height = Math.round(iRoomY / fScale) + 'px';
    $(oViewport).toggleClass('adm-dsg-fs-scaled', fScale < 1);
    $(oDialog).find('.adm-dsg-fs-fit').css('width', Math.floor(iSet * fScale) + 'px');
    $(oDialog).find('.adm-dsg-fs-scale').text(Math.round(fScale * 100) + '%').prop('hidden', fScale >= 1);

    var oInput = $(oDialog).find('.adm-dsg-fs-width-input');
    if(!oInput.is(':focus'))
        oInput.val(iSet);

    // A preset is on while its width is set and Custom wasn't chosen; Custom is on otherwise.
    var bCustom = oViewport.hasAttribute('data-custom');
    var bPreset = false;
    $(oDialog).find('.adm-dsg-fs-vp[data-width]').each(function() {
        var bOn = !bCustom && parseInt($(this).attr('data-width'), 10) == iSet;
        bPreset = bPreset || bOn;
        $(this).attr('aria-pressed', bOn ? 'true' : 'false');
    });
    $(oDialog).find('.adm-dsg-fs-vp:not([data-width])').attr('aria-pressed', bPreset ? 'false' : 'true');
};

BxDolStudioDesigner.prototype.deleteIcon = function(sName, oButton) {
    var $this = this;

    bx_confirm($(oButton).attr('data-confirm'), function() {
        var oDate = new Date();
        var aParams = {_t: oDate.getTime()};
        aParams[$this.sParamPrefix + '_action'] = 'delete_icon';
        aParams[$this.sParamPrefix + '_value'] = sName;
        aParams['csrf_token'] = $(oButton).parents('form:first').find('input[name=csrf_token]').val();

        $.post(
            $this.sActionsUrl,
            aParams,
            function(oData) {
                if(oData.code != 0 && oData.message.length > 0) {
                    bx_alert(oData.message);
                    return;
                }

                // The preview now shows what replaces the icon: the default, or the other favicon.
                document.location.reload();
            },
            'json'
        );
    });
};

BxDolStudioDesigner.prototype.deleteCover = function(sType, oButton) {
    var $this = this;

    bx_confirm($(oButton).attr('data-confirm'), function() {
        var oDate = new Date();
        var aParams = {_t: oDate.getTime()};
        aParams[$this.sParamPrefix + '_action'] = 'delete_cover';
        aParams[$this.sParamPrefix + '_value'] = sType;
        aParams['csrf_token'] = $(oButton).parents('form:first').find('input[name=csrf_token]').val();

        $.post(
            $this.sActionsUrl,
            aParams,
            function(oData) {
                if(oData.code != 0 && oData.message.length > 0) {
                    bx_alert(oData.message);
                    return;
                }

                // The preview now shows the default cover.
                document.location.reload();
            },
            'json'
        );
    });
};
/** @} */
