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
