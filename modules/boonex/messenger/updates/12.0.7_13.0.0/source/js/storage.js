/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */

/**
 * Work with browser storage
 */

;window.oMessengerStorage = class {
    constructor(sName = ''){
        this._sSubLot = 'lots';
        this._sName = typeof sName === 'string' && sName.length ? sName : 'una-jots-data';
        this._oData = typeof localStorage[this._sName] !== 'undefined' ? JSON.parse(localStorage.getItem(this._sName)) : {};
    }

    getLots(){
        return this._oData[this._sSubLot];
    }

    getLot(iLotId, sField){
        const sObject = this.get(this._sSubLot, iLotId);
		
		if (typeof sObject === 'string'){
			const oObject = JSON.parse(sObject);
			return sField && oObject && typeof oObject[sField] !== undefined ? oObject[sField] : oObject;
		}
		
		return;
    }

    saveLot(iLotId, mixedValue) {
        return this.set(this._sSubLot, iLotId, mixedValue);
    }
	
	saveLotItem(iLotId, mixedValue, sField) {
        return this.set(this._sSubLot, iLotId, mixedValue, sField);
    }

    deleteLot(iLotId){
        return this.delete(this._sSubLot, iLotId);
    }
	
	deleteLotItem(iLotId, sField){
        return this.delete(this._sSubLot, iLotId, sField);
    }

    getValue(sKey){
        return sKey && typeof this._oData[sKey] !== 'undefined' && this._oData[sKey];
    }

    setValue(sKey, mixedValue){
        if (sKey && typeof mixedValue !== 'undefined') {
            if (typeof this._oData[sKey] === 'undefined')
                this._oData[sKey] = mixedValue;

            this.save();
        }

        return this;
    };

    deleteValue(sKey){
        if (typeof this._oData[sKey] !== 'undefined')
            delete this._oData[sKey];

        this.save();
    }

    get(sCateg, sKey){
        return sCateg && this._oData[sCateg] && this._oData[sCateg][sKey];
    }

    set(sCateg, sKey, mixedValue, sField){
        if (sCateg && sKey && typeof mixedValue !== 'undefined') {
            if (this._oData[sCateg] === undefined)
                this._oData[sCateg] = Object.create(null);
			
			if (typeof sField !== 'undefined'){
				const oObject = typeof this._oData[sCateg][sKey] !== 'undefined' ? JSON.parse(this._oData[sCateg][sKey]) : Object.create(null);
				oObject[sField] = mixedValue;
					
				this._oData[sCateg][sKey] = JSON.stringify(oObject);
			} else 
				this._oData[sCateg][sKey] = JSON.stringify(mixedValue);
	        
            this.save();
        }

        return this;
    };

    delete(sCateg, sKey, sField){
        if (sCateg && sKey && typeof this._oData[sCateg] !== 'undefined') {
 			if (typeof sField !== 'undefined'){
 			    try {
				const oObject = JSON.parse(this._oData[sCateg][sKey]);
                    if (typeof oObject[sField] !== 'undefined') {
					delete oObject[sField];
					if ($.isEmptyObject(oObject))
						delete this._oData[sCateg][sKey];
                        else
						this._oData[sCateg][sKey] = JSON.stringify(oObject);
				}
                } catch(e){
 			        console.log('Local storage error', e.toString());
                }
			}			
			else 
				delete this._oData[sCateg][sKey];
			
            this.save();
        }

        return this;
    }
    save(){
        return localStorage && localStorage.setItem(this._sName, JSON.stringify(this._oData))
    }
};