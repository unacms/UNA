function BxDevPolyglot(oOptions) {
    this._sActionsUrl = oOptions.sActionUrl;
    this._sPolyglotUrl = oOptions.sPolyglotUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxDevPolyglot' : oOptions.sObjName;
    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
}

BxDevPolyglot.prototype.recompile = function(sLanguage) {
	this.perform('recompile', sLanguage);
};

BxDevPolyglot.prototype.restore = function(sLanguage, sModule) {
	this.perform('restore', sLanguage, sModule);
};

BxDevPolyglot.prototype.perform = function(sAction, sLanguage, sModule) {
    var $this = this;
    var oDate = new Date();
    var oParams = {
    	pgt_action: sAction,
        _t:oDate.getTime()
    };

    if(sLanguage)
    	oParams['pgt_language'] = sLanguage;

    if(sModule)
    	oParams['pgt_module'] = sModule;

    bx_loading($('body'), true);

    $.post(
        this._sPolyglotUrl,
        oParams,
        function(oData) {
        	bx_loading($('body'), false);

        	if(oData.code !== undefined && oData.content) {
                if(parseInt(oData.code) == 0)
                    bx_toast(oData.content);
                else
                    bx_alert(oData.content);
            }
        },
        'json'
    );
};
