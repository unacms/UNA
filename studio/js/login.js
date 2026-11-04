/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

function BxDolStudioLogin() {
	$(document).ready(function() {		
		$('#bx-std-login-form-box').dolPopup({
	        fog: {
	            color: '#fff',
	            opacity: 0
	        },
	        closeOnOuterClick: false
		}).removeClass('bx-popup-responsive'); // a block on phones too, not a full screen sheet (media-phone.css)
	});
}

/** @} */
