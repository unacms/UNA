/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Shopify Shopify
 * @ingroup     UnaModules
 *
 * @{
 */

function BxShopifyShop(oOptions) {
    this._sDomain = oOptions.sDomain;
    this._sAccessToken = oOptions.sAccessToken;

    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxShopifyShop' : oOptions.sObjName;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this._sParamsDivider = oOptions.sParamsDivider == undefined ? '#-#' : oOptions.sParamsDivider;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;

    this._sClassCover = 'bx-cover-wrapper';
    this._sClassLoading = 'bx-spf-loading';
    this._sClassLoaded = 'bx-spf-loaded';

    this._oShopClient = window.ShopifyBuy.buildClient({
        domain: this._sDomain,
        storefrontAccessToken: this._sAccessToken
    });
}

BxShopifyShop.prototype.getUnit = function(sProduct) {
    var $this = this;

    var oUnit = $('.' + this._aHtmlIds['unit'] + sProduct + ':not(.' + this._sClassLoading + ', .' + this._sClassLoaded + '):first');
    if(!oUnit.length)
        return;

    bx_loading(oUnit.addClass(this._sClassLoading), true);

    this.fetchProductByHandle(sProduct, function (oProduct) {
        $this.onGetUnit(oProduct);
    }, function() {
        bx_loading(oUnit.removeClass(this._sClassLoading), false);

        bx_alert(_t('_bx_shopify_err_load_product'));
    });
};

BxShopifyShop.prototype.onGetUnit = function(oProduct) {
    if(!oProduct)
        return;

    var oUnit = $('.' + this._aHtmlIds['unit'] + oProduct.handle + '.' + this._sClassLoading + ':first');
    if(!oUnit.length)
        return;

    //--- Fetch product description.
    oUnit.find('.bx-spf-unit-title').text(oProduct.title);

    //--- Fetch product description.
    oUnit.find('.bx-spf-unit-summary').empty().append(this.sanitizeHtml(oProduct.descriptionHtml));
    oUnit.find('.bx-base-text-unit-strecher').text(oProduct.description);

    //--- Fetch product images.
    if(oProduct.images.length > 0)
        oUnit.find('.bx-spf-unit-thumb').css('background-image', 'url(' + JSON.stringify(String(oProduct.images[0].src)) + ')');

    //--- Fetch price.
    if(oProduct.variants.length > 0) {
        var oBuy = oUnit.find('.bx-shopify-buy');
        var sBuyContent = oBuy.html();
        oBuy.html(sBuyContent.replace('{price}', this.escapeHtml(this.getPrice(oProduct.variants[0])))).show();
    }

    bx_loading(oUnit.removeClass(this._sClassLoading).addClass(this._sClassLoaded), false);

    //--- Update Showcase wrapper.
    var oWrapper = oUnit.parents('.bx-base-unit-showcase-wrapper:first');
    if(oWrapper.length > 0 && oWrapper.hasClass('flickity-enabled'))
        oWrapper.flickity('resize');
};

BxShopifyShop.prototype.getEntry = function(sProduct) {
    var $this = this;
    var oLoading = $('.' + this._sClassCover);

    bx_loading(oLoading, true);

    this.fetchProductByHandle(sProduct, function(oProduct) {
        $this.onGetEntry(oProduct);
    }, function() {
        bx_loading(oLoading, false);

        bx_alert(_t('_bx_shopify_err_load_product'));
    });
};

BxShopifyShop.prototype.onGetEntry = function(oProduct) {
    if(!oProduct)
        return;

    //--- Fetch product title.
    $('#' + this._aHtmlIds['entry_content']).find('.bx-spf-title').text(oProduct.title);

    //--- Fetch product description.
    $('#' + this._aHtmlIds['entry_content']).find('.bx-spf-text').empty().append(this.sanitizeHtml(oProduct.descriptionHtml));

    //--- Fetch product images.
    var oSample = $('#' + this._aHtmlIds['entry_attachment_sample']);
    var oContainer = $('#' + this._aHtmlIds['entry_attachments']);
    var iImage = 0;
    oProduct.images.map(function(oImage) {
        var oAttachment = oSample.clone().removeAttr('id').removeClass('bx-spf-attachment-sample');

        var sImageSrc = String(oImage.src);

        var oPopup = oAttachment.find('.bx-popup-wrapper');
        var sPopupId = oPopup.attr('id').replace('{id}', iImage);
        oPopup.attr('id', sPopupId);
        oPopup.find('.bx-spf-attachment-popup-img').attr('src', sImageSrc);

        // The image URL comes from the shop, so it is bound here instead of being written into an onclick attribute.
        var oLink = oAttachment.find('.bx-spf-attachment-link');
        oLink.removeAttr('onclick').on('click', function() {
            $('#' + sPopupId).dolPopupImage(sImageSrc, $(this).parent());
        });
        oLink.find('.bx-spf-attachment-img').attr('src', sImageSrc);

        oContainer.append(oAttachment);

        iImage += 1;
    });
    oSample.remove();

    //--- Fetch price.
    if(oProduct.variants.length > 0) {
        var oBuy = $('#' + this._aHtmlIds['entry_buy']);

        var sBuyContent = oBuy.html();
        oBuy.html(sBuyContent.replace('{price}', this.escapeHtml(this.getPrice(oProduct.variants[0])))).show();

        var oItem = oBuy.parents('.bx-menu-item:first');
        if(oItem.attr('bx-mma-width'))
            oItem.attr('bx-mma-width', oItem.outerWidth());
    }

    bx_loading($('.' + this._sClassCover), false);
};

BxShopifyShop.prototype.getPrice = function(oVariant) {
    var mixedPrice = oVariant.price;
    if(mixedPrice && typeof mixedPrice === 'object')
        mixedPrice = mixedPrice.amount;

    return mixedPrice == undefined ? '' : String(mixedPrice);
};

BxShopifyShop.prototype.escapeHtml = function(s) {
    return $('<div />').text(s).html();
};

/**
 * Product descriptions are written in the shop, outside this site, so only basic
 * formatting is kept: no scripts, styles, event handlers or other attributes.
 */
BxShopifyShop.prototype.sanitizeHtml = function(sHtml) {
    var aTags = ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'sub', 'sup', 'small', 'span', 'div', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'hr', 'a', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td'];
    var aDrop = ['script', 'style', 'iframe', 'object', 'embed', 'frame', 'frameset', 'svg', 'math', 'template', 'noscript', 'textarea', 'select', 'button', 'input', 'form', 'link', 'meta', 'base', 'title', 'head'];

    var oFragment = document.createDocumentFragment();
    if(!sHtml)
        return oFragment;

    // DOMParser builds an inert document: nothing in it runs or loads while it is cleaned.
    var oSource = new DOMParser().parseFromString('<!doctype html><body>' + String(sHtml), 'text/html').body;

    var fClean = function(oFrom, oTo) {
        for(var i = 0; i < oFrom.childNodes.length; i++) {
            var oNode = oFrom.childNodes[i];
            if(oNode.nodeType === 3) {
                oTo.appendChild(document.createTextNode(oNode.nodeValue));
                continue;
            }

            if(oNode.nodeType !== 1)
                continue;

            var sTag = oNode.nodeName.toLowerCase();
            if(aDrop.indexOf(sTag) !== -1)
                continue;

            if(aTags.indexOf(sTag) === -1) {
                fClean(oNode, oTo);
                continue;
            }

            var oElement = document.createElement(sTag);
            if(sTag === 'a') {
                var sHref = (oNode.getAttribute('href') || '').trim();
                if(/^(https?:|mailto:)/i.test(sHref)) {
                    oElement.setAttribute('href', sHref);
                    oElement.setAttribute('target', '_blank');
                    oElement.setAttribute('rel', 'nofollow noopener noreferrer');
                }
            }

            fClean(oNode, oElement);
            oTo.appendChild(oElement);
        }
    };

    fClean(oSource, oFragment);
    return oFragment;
};

BxShopifyShop.prototype.buyProductByHandle = function(sProduct, oLink) {
    var $this = this;
    oLink = $(oLink);

    bx_loading_btn(oLink, true);

    $this.fetchProductByHandle(sProduct, function(oProduct) {
        if(oProduct.variants.length <= 0)
            return;

        $this.createCheckout(function(oCheckout) {
            $this.addItems(oCheckout.id, [{variantId:oProduct.variants[0].id, quantity: 1}], function(oCheckout){
                bx_loading_btn(oLink, false);

                location.href = oCheckout.webUrl;
            }, function() {
                bx_loading_btn(oLink, false);
                bx_alert(_t('_bx_shopify_err_purchase_product'));
            });
        }, function() {
            bx_loading_btn(oLink, false);
            bx_alert(_t('_bx_shopify_err_purchase_product'));
        });
    }, function() {
        bx_loading_btn(oLink, false);
        bx_alert(_t('_bx_shopify_err_load_product'));
    });
}
    
BxShopifyShop.prototype.fetchProduct = function(iProduct, onComplete, onError) {
    var $this = this;

    this._oShopClient.product.fetch(iProduct).then(function(oProduct) {
        if(typeof(onComplete) == 'function')
            onComplete(oProduct);
        else 
            $this.onFetchProduct(oProduct);
    }).catch(function() {
        if(typeof(onError) == 'function')
            onError();
        else 
            bx_alert(_t('_bx_shopify_err_load_product'));
    });
};

BxShopifyShop.prototype.fetchProductByHandle = function(sProduct, onComplete, onError) {
    var $this = this;

    this._oShopClient.product.fetchByHandle(sProduct).then(function(oProduct) {
        if(typeof(onComplete) == 'function')
            onComplete(oProduct);
        else 
            $this.onFetchProduct(oProduct);
    }).catch(function(oError) {
        if(typeof(onError) == 'function')
            onError();
        else 
            bx_alert(_t('_bx_shopify_err_load_product'));
    });
};

BxShopifyShop.prototype.fetchCollection = function(iCollection, onComplete, onError) {
    var $this = this;

    this._oShopClient.fetchQueryProducts({collection_id: iCollection}).then(function(oProducts) {
        if(typeof(onComplete) == 'function')
            onComplete(oProduct);
        else 
            $this.onFetchCollection(oProducts);
    }).catch(function() {
        if(typeof(onError) == 'function')
            onError();
        else 
            bx_alert(_t('_bx_shopify_err_load_collection'));
    });
};

BxShopifyShop.prototype.createCheckout = function(onComplete, onError) {
    var $this = this;

    this._oShopClient.checkout.create().then(function(oCheckout) {
        if(typeof(onComplete) == 'function')
            onComplete(oCheckout);
        else 
            $this.onCreateCheckout(oCheckout);
    }).catch(function() {
        if(typeof(onError) == 'function')
            onError();
        else 
            bx_alert(_t('_bx_shopify_err_purchase_product'));
    });
};

BxShopifyShop.prototype.addItems = function(sCheckoutId, aLineItems, onComplete, onError) {
    var $this = this;

    this._oShopClient.checkout.addLineItems(sCheckoutId, aLineItems).then(function(oCheckout) {
        if(typeof(onComplete) == 'function')
            onComplete(oCheckout);
        else 
            $this.onAddItems(oCheckout);
    }).catch(function() {
        if(typeof(onError) == 'function')
            onError();
        else 
            bx_alert(_t('_bx_shopify_err_purchase_product'));
    });
};

BxShopifyShop.prototype.onFetchProduct = function(oProduct) {
    //--- Some default action can be put here.
};

BxShopifyShop.prototype.onFetchCollection = function(oProducts) {
    //--- Some default action can be put here.
};

BxShopifyShop.prototype.onCreateCheckout = function(oCheckout) {
    //--- Some default action can be put here.
};

BxShopifyShop.prototype.onAddItems = function(oCheckout) {
    //--- Some default action can be put here.
};

/** @} */
