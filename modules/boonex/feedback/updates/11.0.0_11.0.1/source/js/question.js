/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Feedback Feedback
 * @ingroup     UnaModules
 *
 * @{
 */

function BxFdbQuestion(oOptions) {
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxFdbQuestion' : oOptions.sObjName;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;
}

BxFdbQuestion.prototype.answerOnSelect = function(oElement, iQuestion) {
    var $this = this;

    var fOnOk = function(oPopup) {
        var oParams = jQuery.extend({}, $this._getDefaultParams(), {
            question_id: iQuestion, 
            answer_id: $(oElement).val(),
            text: $(oPopup).find("input[type = 'text']").val()
        });

        $.get(
            $this._sActionsUrl + 'answer/',
            oParams,
            function(oData){
                processJsonData(oData);
            },
            'json'
        );
    };

    bx_prompt(_t('_bx_feedback_txt_enter_text'), '', fOnOk);
};


/**
 * Methods for 'Answers' custom field.
 */
/*
BxFdbQuestion.prototype.answerOnType = function(oEvent, sName) {
    var oParent = $(oEvent.target).parents('.bx-form-input-answer:first');
    oParent.find("input[type = 'checkbox']").val(oParent.find("input[name = '" + sName + "']").val().trim());
};
*/

BxFdbQuestion.prototype.answerAdd = function(oButton, sName) {
    var oField = $(oButton).parents('#bx-form-element-' + sName);

    var oIndex = oField.find("input[type = 'hidden'][name = '" + sName + "_ind']");
    var iIndex = oIndex.val();

    var sSample = oField.find('.bx-form-input-answer-sample:first').html().replace(/\|x\|/g, iIndex);

    oField.find('.bx-form-input-answer:last').after($(sSample));
    oIndex.val(parseInt(iIndex) + 1);
};

BxFdbQuestion.prototype.answerDelete = function(oButton) {
    $(oButton).parents('.bx-form-input-answer:first').remove();
};

/**
 * Internal methods.
 */
BxFdbQuestion.prototype._getDefaultParams = function() {
    var oDate = new Date();
    return {_t:oDate.getTime()};
};