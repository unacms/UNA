/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */
 
/**
 * Primus class to work with the server and main messenger class
 */ 
;window.oRTWSF = (function(){
	let _oPrimus = null, _oData = Object.create(null), _sIdent, sJWT, _sIP = '0.0.0.0';

	return {
			/**
			* Init Primus with provided settings and attaches listeners on event emitters from the server
			*@param object oOptions options
			*/
			init:function(oOptions){
				const _this = this,
					{ server, ip, ident, jwt } = oOptions;

				_this._sIdent = ident || _this._sIdent;
				_this._sIP = ip || _this._sIP;
				if (!server.length) {
					console.log('Jot Server is not defined');
					return;
				}

				if (_oPrimus === null)
					_oPrimus = new Primus(server);

				// on data received from the server
				_oPrimus.on('data', function(oData) {
						if (typeof oData.action !== "undefined" && !_oPrimus.emit(oData.action, oData))
							console.log('Unknown server response', oData);
						}).on('error', function error(oError) {
							console.log('Primus Error', oError);
						}).on('reconnect scheduled', function (oOptions) {
							console.log('Reconnecting in %d ms', oOptions.scheduled);
							console.log('This is attempt %d out of %d', oOptions.attempt, oOptions.retries);
							_this.onReconnecting(oOptions);
						}).on('reconnected', function (oOptions) {
							_this.onReconnected(oOptions);
						}).on('reconnect failed', function (oOptions) {
							_this.onReconnectFailed(oOptions);
						}).on('open', function () {
							const oSettings = _this.getSettings();
							if (typeof oSettings !== 'undefined' && typeof oSettings.user_id !== 'undefined' && typeof oSettings.status !== 'undefined'){
								this.write({
									 action:'init',
									 jwt: jwt,
									 ip:_this._sIP,
									 ident:_this._sIdent,
									 user_id: oSettings.user_id,
									 status: oSettings.status 
								});
							}
						}).on('typing', function (oData) {
							_this.onTyping(oData);
						}).on('msg', function (oData){
							_this.onMessage(oData);
						}).on('update_status', function (oData) {
							_this.onStatusUpdate(oData);
						}).on('check_sent', function (oData) {
							_this.onServerResponse(oData);
						}).on('denied', function (oData) {
							console.log('Access Denied for your IP');
							_this.onReconnecting(oOptions);
						}).on('jwt-error', function (oData) {
							console.log('JWT token is not verified!');
							_this.onDestroy(oData);
						}).on('token-init', function (oData) {
							const { token } = oData;
							sJWT = token;
						});
			},
			isInitialized:() => _oPrimus !== null && typeof _oPrimus !== 'undefined',
			/* 
			*Methods occur when received data from the server or on primus events 
			*BEGIN 
			*/
			onTyping:function(){
				console.log('overwrite it in the main messenger class');
			},		
			onMessage:function(){
				console.log('overwrite it in the main messenger class');
			},
			onStatusUpdate:function(){
				console.log('overwrite it in the main messenger class');
			},
			getSettings:function(){
				console.log('overwrite it in the main messenger class');
			},
			onServerResponse:function(){
				console.log('overwrite it in the main messenger class');
			},
			onReconnecting:function(){
				console.log('overwrite it in the main messenger class');
			},
			onReconnected:function(){
				console.log('overwrite it in the main messenger class');
			},
			onReconnectFailed:function(){
				console.log('overwrite it in the main messenger class');
			},
			onDestroy:function(){
				console.log('overwrite it in the main messenger class');
			},
			/** End **/

		 	/*
			*Methods are called on members' activities in chat window and send data to the server 
			*BEGIN
			*/
			initSettings:function(oData){
				this.exec('init', oData);
			},
			message:function(oData){
				this.exec('msg', oData);
			},
			typing:function(oData){
				this.exec('typing', oData);
			},
			end:function(oData){
				this.exec('before_delete', oData);
				_oPrimus.end();
			},
			updateStatus:function(oData){
				this.exec('update_status', oData);
			},
			exec:function(sParam, oData){
				if (!this.isInitialized())
					return;
				
				if (!_oPrimus.writable)
					_oPrimus.open();

				const oObject = { action:sParam, ip:this._sIP, ident:this._sIdent };
				_oPrimus.write($.extend(oData, oObject));
			}
			/** END **/
		}
})();

/** @} */
