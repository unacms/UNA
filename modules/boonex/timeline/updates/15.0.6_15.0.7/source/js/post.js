/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

function BxTimelinePost(oOptions) {
    this._sActionsUri = oOptions.sActionUri;
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oTimelinePost' : oOptions.sObjName;
    this._iOwnerId = oOptions.iOwnerId == undefined ? 0 : parseInt(oOptions.iOwnerId);
    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this._bAutoAttach = oOptions.bAutoAttach == undefined ? false : oOptions.bAutoAttach;
    this._sAutoUploader = oOptions.sAutoUploader == undefined ? '' : oOptions.sAutoUploader;
    this._sAutoUploaderId = oOptions.sAutoUploaderId == undefined ? '' : oOptions.sAutoUploaderId;
    this._bMediaPriority = oOptions.bMediaPriority == undefined ? false : oOptions.bMediaPriority;
    this._iLimitAttachLinks = oOptions.iLimitAttachLinks == undefined ? 0 : oOptions.iLimitAttachLinks;
    this._sLimitAttachLinksErr = oOptions.sLimitAttachLinksErr == undefined ? '' : oOptions.sLimitAttachLinksErr;
    this._oAttachedLinks = oOptions.oAttachedLinks == undefined ? {} : oOptions.oAttachedLinks;
    this._sVideosAutoplay = oOptions.sVideosAutoplay == undefined ? 'off' : oOptions.sVideosAutoplay;
    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;

    var $this = this;
    if (typeof window.glOnInitEditor === 'undefined')
        window.glOnInitEditor = [];

    $(document).ready(function () {
        var oPost = $($this.sIdPost + ' form');
        if(!oPost || oPost.length == 0)
            oPost = $($this.sIdPostForm);

    	oPost.each(function() {
            $this.initFormPost($(this).attr('id'));
    	});
    });
}

BxTimelinePost.prototype = new BxTimelineMain();

BxTimelinePost.prototype.initFormPost = function(sFormId)
{
    var $this = this;
    var oForm = $('#' + sFormId);
    var oTextarea = oForm.find('textarea');
    autosize(oTextarea);

    oForm.ajaxForm({
        dataType: "json",
        beforeSubmit: function (formData, jqForm, options) {
            window[$this._sObjName].beforeFormPostSubmit(oForm);
        },
        success: function (oData) {
            window[$this._sObjName].afterFormPostSubmit(oForm, oData);
        }
    });
    
    $this.initTrackerInsertSpace(sFormId);
    if($this._bAutoAttach) 
        $this.initTrackerInsertImage(sFormId);
};

BxTimelinePost.prototype.onFormPostSubmit = function(oForm)
{
    if(this.isLockedForm($(oForm)))
        return false;

    return true;
};

BxTimelinePost.prototype.beforeFormPostSubmit = function(oForm)
{
    this.loadingInButton($(oForm).children().find(':submit'), true);
};

BxTimelinePost.prototype.afterFormPostSubmit = function (oForm, oData)
{
    var $this = this;
    var fContinue = function() {
        if(oData && oData.form != undefined && oData.form_id != undefined) {
            $('#' + oData.form_id).replaceWith(oData.form);
            $this.initFormPost(oData.form_id);

            return;
        }

        if(oData && oData.id != undefined) {
            var iId = parseInt(oData.id);
            if(iId <= 0) 
                return;

            // Refresh value in LiveUpdates
            if(oLiveUpdates != undefined) {
                var aSystems = oLiveUpdates.getSystemsTransient();
                for(var sSystem in aSystems)
                    if(sSystem.startsWith('bx_timeline')) {
                        oLiveUpdates.setValue(sSystem, oData.id);
                        break;
                    }
            }

            $('.' + $this.sClassView + ':visible').each(function() {
                var oView = $(this);
                $this._getPost(oView, iId, jQuery.extend({}, $this._oRequestParams, {view: $this._getView(oView), afps_loading: 1}));

                // Attach callback on get post */
                $this.onGetPost(oView, iId, jQuery.extend({}, $this._oRequestParams, {view: $this._getView(oView), afps_loading: 1}));
            });
        }

        $this._getForm(oForm);
    };

    this.loadingInButton($(oForm).children().find(':submit'), false);

    // Posted: a subtle success; the form back with an error: error.
    if(oData && typeof(bx_sound) == 'function')
        if(oData.form != undefined && oData.form_id != undefined)
            bx_sound('error');
        else if(oData.id != undefined && parseInt(oData.id) > 0)
            bx_sound('success', {emphasis: 'subtle'});

    if(oData && oData.message != undefined)
        bx_alert(oData.message, fContinue);
    else
        fContinue();
};
    
BxTimelinePost.prototype.initFormAttachLink = function(sFormId)
{
    var $this = this;
    var oForm = $('#' + sFormId);

    oForm.ajaxForm({
        dataType: "json",
        clearForm: true,
        beforeSubmit: function (formData, jqForm, options) {
            window[$this._sObjName].beforeFormAttachLinkSubmit(oForm);
        },
        success: function (oData) {
            window[$this._sObjName].afterFormAttachLinkSubmit(oForm, oData);
        }
    });
};

BxTimelinePost.prototype.beforeFormAttachLinkSubmit = function(oForm)
{
    this.loadingInButton($(oForm).children().find(':submit'), true);
};

BxTimelinePost.prototype.afterFormAttachLinkSubmit = function (oForm, oData)
{
    var $this = this;
    var fContinue = function() {
        if(oData && oData.item != undefined) {
            $('#' + $this._aHtmlIds['attach_link_popup']).dolPopupHide({});

            if(!$.trim(oData.item).length)
                return;

            //--- Mark that 'attach link' process was finished.
            $this._oAttachedLinks[oData.url] = oData.id;

            var iEventId = 0;
            if(oData && oData.event_id != undefined)
                iEventId = parseInt(oData.event_id);

            var oItem = $(oData.item).hide();
            $('#' + $this._aHtmlIds['attach_link_form_field'] + iEventId).prepend(oItem).find('#' + oItem.attr('id')).bx_anim('show', $this._sAnimationEffect, $this._sAnimationSpeed, function() {
                $(this).bxProcessHtml();
            });

            $this.unlockForm($('#' + $this._aHtmlIds['attach_link_form_field'] + iEventId).parents('form:first'));
            return;
        }

        if(oData && oData.form != undefined && oData.form_id != undefined) {
            $('#' + oData.form_id).replaceWith(oData.form);
            $this.initFormAttachLink(oData.form_id);

            return;
        }
    };

    this.loadingInButton($(oForm).find(':submit'), false);

    if(oData && oData.message != undefined)
        bx_alert(oData.message, fContinue);
    else
        fContinue();
};

BxTimelinePost.prototype.deleteAttachLink = function(oLink, iId)
{
    var $this = this;
    var oData = this._getDefaultData();
    oData['id'] = iId;

    var oAttachLink = $('#' + this._aHtmlIds['attach_link_item'] + iId);
    bx_loading(oAttachLink, true);
    
    jQuery.post (
        this._sActionsUrl + 'delete_attach_link/',
        oData,
        function(oData) {
            var fContinue = function() {
                if(oData && oData.code != undefined && oData.code == 0) {
                    oAttachLink.bx_anim('hide', $this._sAnimationEffect, $this._sAnimationSpeed, function() {
                        $(this).remove;

                        if(oData.url != undefined && oData.url.length != 0)
                            delete $this._oAttachedLinks[oData.url];
                    });
                }
            };

            bx_loading(oAttachLink, false);

            if(oData && oData.message != undefined)
                bx_alert(oData.message, fContinue);
            else
                    fContinue();
        },
        'json'
    );

    return false;
};

BxTimelinePost.prototype.showAttachLink = function(oLink, iEventId)
{
    if($(oLink).hasClass('bx-btn-disabled'))
        return false;

    if(this._iLimitAttachLinks != 0 && Object.keys(this._oAttachedLinks).length >= this._iLimitAttachLinks) {
        bx_alert(this._sLimitAttachLinksErr);
        return false;
    }

    var oData = this._getDefaultData();
    oData['event_id'] = iEventId;

    $(window).dolPopupAjax({
        id: {value: this._aHtmlIds['attach_link_popup'], force: true},
        url: bx_append_url_params(this._sActionsUri + 'get_attach_link_form/', oData),
        closeOnOuterClick: false,
        removeOnClose: true
    });

    return false;
};

BxTimelinePost.prototype.onAttachMediaUploadBefore = function(oUploader)
{
    $('#' + oUploader._sResultContainerId).parents('form:first').find(":submit").prop('disabled', true).addClass('bx-btn-disabled');
};

BxTimelinePost.prototype.onAttachMediaUpload = function(oUploader, iEventId)
{
    var $this = this;
    var oData = this._getDefaultData();
    oData['event_id'] = iEventId;

    if(this._bMediaPriority) {
        var oLinkFormField = $('#' + this._aHtmlIds['attach_link_form_field'] + iEventId);

        oLinkFormField.parents('form:first').find('.bx-menu-item.add-link .bx-btn').addClass('bx-btn-disabled');

        if(oLinkFormField.children().length > 0) {
            oLinkFormField.hide();

            jQuery.post (
                this._sActionsUrl + 'delete_attach_links/',
                oData,
                function(oData) {
                    if(!oData)
                        return;

                    var fContinue = function() {
                        if(oData.code == undefined)
                            return;

                        if(oData.code == 0) {
                            oLinkFormField.html('');

                            if(oData.urls != undefined && oData.urls.length != 0)
                                for(var i in oData.urls)
                                    delete $this._oAttachedLinks[oData.urls[i]];
                        }

                        oLinkFormField.show();
                    };

                    if(oData.message != undefined)
                        bx_alert(oData.message, fContinue);
                    else
                        fContinue();
                },
                'json'
            );
        }
    }

    $('#' + oUploader._sResultContainerId).parents('form:first').find(":submit").prop('disabled', false).removeClass('bx-btn-disabled');
};

BxTimelinePost.prototype.onAttachMediaRestoreGhosts = function(oUploader, aData)
{
    //perform some action after attached media's ghosts restoration.
};

BxTimelinePost.prototype.onAttachMediaDeleteGhost = function(iEventId, sMsg)
{
    if(sMsg != 'ok') 
        return;

    var oForm = $('#' + this._aHtmlIds['attach_link_form_field'] + iEventId).parents('form:first');
    if(!oForm.find('.bx-tl-uploader-file').length)
        oForm.find('.bx-menu-item.add-link .bx-btn').removeClass('bx-btn-disabled');
};

BxTimelinePost.prototype._getForm = function(oElement)
{
    var $this = this;
    var oData = this._getDefaultData();

    jQuery.post (
        this._sActionsUrl + 'get_post_form/',
        oData,
        function(oData) {
            if(oData && oData.options != undefined)
                $this.updateOptions(oData.options);

            if(oData && oData.form != undefined && oData.form_id != undefined) {
                $('#' + oData.form_id).replaceWith(oData.form);
                $this.initFormPost(oData.form_id);
            }
        },
        'json'
    );
};

BxTimelinePost.prototype._onGetPost = function(oData)
{
    var $this = this;
    var fContinue = function(oData) {
        if(!$.trim(oData.item).length) 
            return;

        var aTypes = Array.isArray(oData.type) ? oData.type : new Array(oData.type);
        aTypes.forEach(function(sType) {
            oData['type'] = sType;
            $this.oView = $($this._getHtmlId('main', oData) + ':visible');

            /*
             * Current UPF: 'Post to Feed' and Timeline: 'Post to Feed' forms 
             * should work with both Feed and For You Feed blocks.
             */
            if(!$this.oView.length && oData['type'] == 'feed')
                $this.oView = $($this._getHtmlId('main', jQuery.extend({}, oData, {type: 'feed_and_hot'})) + ':visible');

            /*
             * For backward compatibility.
             * Current UPF: 'Post to Feed' and Timeline: 'Post to Feed' forms 
             * should work with an old Account Feed ('Owner and Connections') block.
             */
            if(!$this.oView.length && oData['type'] == 'feed')
                $this.oView = $($this._getHtmlId('main', jQuery.extend({}, oData, {type: 'owner_and_connections'})) + ':visible');

            var oLoadMore = $this.oView.find('.' + $this.sSP + '-load-more');
            if(!oLoadMore.is(':visible'))
                oLoadMore.show();

            var oEmpty = $this.oView.find('.' + $this.sSP + '-empty');
            if(oEmpty.is(':visible'))
                oEmpty.hide();

            var oContent = $(oData.item).bxProcessHtml();
            switch(oData.view) {
                case 'timeline':
                    var oItems = $this.oView.find('.' + $this.sClassItems);
                    var oDivider  = oItems.find('.' + $this.sClassDividerToday);
                    var bDivider = oDivider.length > 0;

                    if(bDivider && !oDivider.is(':visible'))
                        oDivider.show();

                    oContent.hide();

                    var oItem = bDivider ? oDivider.after(oContent).next('.' + $this.sClassItem + ':hidden') : oContent.prependTo(oItems);
                    oItem.bx_anim('show', $this._sAnimationEffect, $this._iAnimationSpeed, function() {
                        $(this).find('.bx-tl-item-text .bx-tl-content').bxCheckOverflowHeight($this.sSP + '-overflow', function(oElement) {
                            $this.onFindOverflow(oElement);
                        });

                        $this.initFlickity($this.oView);
                    });

                    if($this._sVideosAutoplay != 'off')
                        $this.initVideos($this.oView);
                    break;

                case 'outline':
                    $this.prependMasonry(oContent, function(oItems) {
                        $(oItems).find('.bx-tl-item-text .bx-tl-content').bxCheckOverflowHeight($this.sSP + '-overflow', function(oElement) {
                            $this.onFindOverflow(oElement);
                        });

                        $this.initFlickity($this.oView);
                    });
                    break;
            }
        });
    };

    if(oData && oData.message != undefined && oData.message.length != 0)
        bx_alert(oData.message, function() {
                fContinue(oData);
        });
    else
        fContinue(oData);
};
