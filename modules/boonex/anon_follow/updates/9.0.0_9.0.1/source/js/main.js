/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AnonymousFollow Anonymous Follow
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Perform connections AJAX request. 
 * In case of error - it shows js alert with error message.
 * In case of success - the page is reloaded.
 * 
 * @param sObj - connections object
 * @param sAction - 'add', 'remove' or 'reject'
 * @param iContentId - content id, initiator is always current logged in user
 * @param bConfirm - show confirmation dialog
 */
function bx_conn_action_anon(e, sObj, sAction, iContentId, bConfirm, fOnComplete) {
    var fPerform = function() {
		var aParams = {
		    obj: sObj,
		    act: sAction,
		    id: iContentId,
			anon: 1,
		};
		var fCallback = function (data) {
		    bx_loading_btn(e, 0);
		    if ('object' != typeof(data))
		        return;
		    if (data.err) {
		        bx_alert(data.msg);
		    } else {
		        if ('function' == typeof(fOnComplete))
		            fOnComplete(data, e);
		        else if (!loadDynamicBlockAuto(e))
		            location.reload();
		        else
		            $('#bx-popup-ajax-wrapper-bx_persons_view_actions_more').remove();
		    }
		};
		
		bx_loading_btn(e, 1);
		
		$.ajax({
		    dataType: 'json',
		    url: sUrlRoot + 'conn.php',
		    data: aParams,
		    type: 'POST',
		    success: fCallback
		});
    };

    if (typeof(bConfirm) != 'undefined' && bConfirm)
    	bx_confirm(_t('_Are_you_sure'), fPerform);
    else
    	fPerform();
}