;(function($){
    const sMenuId = 'data-group-id',
          sParentsGroupSelector = 'data-talks-type',
          { menuAddonCounter } = window.oMessengerSelectors.SYSTEM;

    let oMenuBubbleStructure = null;

    $.fn.extend({
        updateMenuBubbles: function(iLotId, mixedMode, bAdd = true) {
            const { oNotifications } = this.get(0),
                sLotId = iLotId.toString();
            if (oMenuBubbleStructure === null || !iLotId)
                return;

            if (bAdd)
                return executeAction(mixedMode, 'add', sLotId);

            performAction('delete', sLotId);
        },
        initMenuBubbles: function(){
            const { oNotifications } = this.get(0),
                { collapsableArea, chevronUpIcon, addonWrapper } = window.oMessengerSelectors.MENU_AREA;

            if (oMenuBubbleStructure === null)
                oMenuBubbleStructure = oNotifications;

            const fFunc = function(){
                if (+$(menuAddonCounter, this).html())
                    $(addonWrapper, this).removeClass('hidden');
            };

            $(collapsableArea).on('click', function(){
               if (!$(this).find(chevronUpIcon).is(':visible'))
                   $(addonWrapper, this).addClass('hidden');
               else
                   fFunc.apply(this);
            }).each(fFunc);
        }
    });

    function updateInbox(bInc = true){
        let iInbox = +oMenuBubbleStructure['inbox'];
        if (iInbox > 0 && !bInc)
            iInbox--;

        if (bInc)
            iInbox++;

        oMenuBubbleStructure['inbox'] = iInbox;
    }

    function executeAction(oType, sAction, iConvoId){
        const { type, groups_type, group_id } = oType;

        try {
                switch(sAction){
                    case 'delete':
                            if (typeof groups_type !== 'undefined') {
                                delete oMenuBubbleStructure[type][groups_type][group_id][iConvoId];

                                if (!Object.keys(oMenuBubbleStructure[type][groups_type][group_id]).length){
                                    delete oMenuBubbleStructure[type][groups_type][group_id];

                                    if (!Object.keys(oMenuBubbleStructure[type][groups_type]).length)
                                        delete oMenuBubbleStructure[type][groups_type][group_id];

                                    if (!Object.keys(oMenuBubbleStructure[type]).length)
                                        delete oMenuBubbleStructure[type];
                                }
                            } else
                                delete oMenuBubbleStructure[type][iConvoId];

                            updateInbox(false);
                        break;
                    case 'add':
                        let bExecute = false;
                        if ( typeof groups_type !== 'undefined' ) {
                            if (typeof oMenuBubbleStructure[type][groups_type] === 'undefined') {
                                oMenuBubbleStructure[type][groups_type] = {[group_id]: {[iConvoId]: 1}};
                                bExecute = true;
                            }
                            else
                              if (typeof oMenuBubbleStructure[type][groups_type][group_id] === 'undefined') {
                                  oMenuBubbleStructure[type][groups_type][group_id] = {[iConvoId]: 1};
                                  bExecute = true;
                              }
                              else
                                if (typeof oMenuBubbleStructure[type][groups_type][group_id][iConvoId] === 'undefined') {
                                    oMenuBubbleStructure[type][groups_type][group_id][iConvoId] = 1;
                                    bExecute = true;
                                }
                        } else
                            if ( typeof oMenuBubbleStructure[type][iConvoId] === 'undefined' ) {
                                oMenuBubbleStructure[type][iConvoId] = 1;
                                bExecute = true;
                            }

                        if (bExecute)
                            updateInbox();
                }

        } catch (e) {
            console.log('error counter update', e);
        }

        updateNavMenuBubbles(type, groups_type);
    }

    function performAction(sAction, iConvoId){
        for (const sType in oMenuBubbleStructure){
            if (sType === 'inbox')
                continue;

            if (sType === 'groups'){
                const oGroups = oMenuBubbleStructure[sType];
                for(const sGroup in oGroups){
                    for(const iGroupId in oGroups[sGroup]){
                        const aConvos = Object.keys(oGroups[sGroup][iGroupId]);

                        if (~aConvos.indexOf(iConvoId)){
                            return executeAction({ type:  sType, groups_type: sGroup, group_id: iGroupId}, sAction, iConvoId);
                        }
                    }
                }
            }
            else
            {
                const oItems = oMenuBubbleStructure[sType],
                     aConvosList = Object.keys(oItems);

                if (~aConvosList.indexOf(iConvoId))
                    return executeAction({ type:  sType }, sAction, iConvoId);

            }
        }

    }

    function updateNavMenuBubbles(sType, sSubGroup){
        let iCounter = 0;

        if (sType === 'groups' && typeof sSubGroup === 'string') {
            if (typeof oMenuBubbleStructure[sType][sSubGroup] !== 'undefined'){
                let iMainCounter = Object.keys(oMenuBubbleStructure[sType][sSubGroup]).length;
                const oTalkObject = $(`[${sParentsGroupSelector}="${sSubGroup}"]`),
                      fFunc = (oGroups, iGroupId) => {
                            let iCounter = oGroups[iGroupId] ? Object.keys(oGroups[iGroupId]).length : 0,
                                oGroup = $(`[${sMenuId}="${iGroupId}"] ${menuAddonCounter}`);

                        oGroup.html(iCounter);
                        if (!iCounter)
                            oGroup.parent().addClass('hidden');
                        else
                            oGroup.parent().removeClass('hidden');
                      };

                oTalkObject.html(iMainCounter);
                if (!iMainCounter)
                    oTalkObject.parent().addClass('hidden');
                else
                    oTalkObject.parent().removeClass('hidden');

                const oGroupItems = oMenuBubbleStructure[sType][sSubGroup];
                if (!Object.keys(oGroupItems).length)
                    $(`li[class*="${sSubGroup}"] li`).each(function(){
                        let iGroupId = +$(this).data('group-id');
                        if (iGroupId)
                            fFunc(oGroupItems, iGroupId);
                    });
                else
                    Object.keys(oGroupItems).forEach((iGroupId) => fFunc(oGroupItems, iGroupId));
            }
        }
        else
        {
            let oTalkType = $(`[${sParentsGroupSelector}="${sType}"]`);
            iCounter = +Object.keys(oMenuBubbleStructure[sType]).length;
            oTalkType.html(iCounter);
            if (!iCounter)
                oTalkType
                    .parent()
                    .addClass('hidden');
            else
                oTalkType
                    .parent()
                    .removeClass('hidden');
        }

        const oIndex = $(`[${sParentsGroupSelector}="inbox"]`).html(oMenuBubbleStructure['inbox']);
        if (+oMenuBubbleStructure['inbox'])
            oIndex.parent().removeClass('hidden');
        else
            oIndex.parent().addClass('hidden');
    }
})(jQuery);