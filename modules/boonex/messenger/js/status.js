/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */
 
/**
 * Update Profile statuses (Online, Offline, Away)
 */
 
;window.oMessengerMemberStatus = {
	iCheckOnline: 3000,
	iTimeout: null,
	iHidden: false,
	iStatus:-1,
	init:function(fCallback){
		var _this = this;

		$(window).on('focus blur', function (e)
		{
			var iNewStatus = {focus:1, pageshow:1}[e.type] ? 1 : 2;
							
			if (_this.iStatus == iNewStatus) 
				clearTimeout(_this.iTimeout);							
			else
			{				
				if (typeof fCallback === 'function')
				{
					_this.iTimeout = setTimeout(
					function()
					{
						fCallback(iNewStatus); 
						_this.iStatus = iNewStatus;
					}, _this.iCheckOnline);
						
				}	
				else 
					iTimeout = setTimeout(function()
					{
						_this.onChange(iNewStatus);
						_this.iStatus = iNewStatus;
					}, 	_this.iCheckOnline);
			}
						
		});
	},
	onChange:function(iStatus){
		console.log('Status changed to ', this.iStatus);
	},
	getStatus:function(){
		return this.iStatus == -1 ? 0 : this.iStatus;
	}
		 
};

/** @} */
