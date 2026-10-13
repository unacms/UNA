;window.oNavMenu = (function($) {
    const sTablet = 'tablet',
          sPhone = 'phone',
          sDesktop = 'desktop';

    const aModePrefixes = { [sPhone]: { pfx: '', width: 0 }, [sTablet]: { pfx: 'md', width: 768 }, [sDesktop]: { pfx: 'xl', width: 1280 }};

    const { historyColumn } = window.oMessengerSelectors.HISTORY,
        { listColumn } = window.oMessengerSelectors.TALKS_LIST,
        { infoColumn } = window.oMessengerSelectors.INFO,
        { menuColumn } = window.oMessengerSelectors.MENU_AREA,
        { historyPanel, groupsPanel } = window.oMessengerSelectors.TALK_BLOCK,

    aBlockViewScheme = {
        [historyPanel]: {
            view: 'col-span-10'
        },
        [groupsPanel]: {
            view: 'col-span-6',
            columns: {
                [historyPanel]: 'col-span-4'
            }
        },
        [infoColumn]: {
            view: 'col-span-6',
            columns: {
                [historyPanel]: 'col-span-4'
            }
        },
    },
    _this = this;

    let aMainViewScheme = {
                           [historyColumn]: {
                               [sDesktop]: { view: 'col-span-5', enabled: true },
                               [sTablet]: { view : 'col-span-6', enabled: true },
                               [sPhone]: { view : 'col-span-10', columns: { [listColumn]: 'hidden' }},
                           },
                           [listColumn]: {
                               [sDesktop]: { view: 'col-span-3', enabled: true },
                               [sTablet]: { view: 'col-span-4', enabled: true },
                               [sPhone]: { view: 'col-span-10', enabled: true, columns: { [historyColumn]: 'hidden' }},
                           },
                           [menuColumn]: {
                               [sDesktop]: { view: 'col-span-2', enabled: true, columns: { [listColumn]: 'col-span-2', [historyColumn]: 'col-span-3' }},
                               [sTablet]: {
                                   view: 'col-span-3',
                                   columns: { [listColumn]: 'col-span-3', [historyColumn]: 'col-span-4' }
                               },
                               [sPhone]: {
                                   view: 'col-span-8', columns: { [listColumn]: 'col-span-2' }
                               },
                           },
                           [infoColumn]: {
                                [sDesktop]: {
                                    view: 'col-span-3',
                                    columns: {
                                        [menuColumn]: 'col-span-2',
                                        [listColumn]: 'col-span-2',
                                        [historyColumn]: 'col-span-3'
                                    }
                                },
                                [sTablet]: {
                                    view: 'col-span-4',
                                    columns: {
                                        [listColumn]: 'col-span-3',
                                        [historyColumn]: 'col-span-3'
                                    }
                                },
                                [sPhone]: {
                                    view: 'col-span-10',
                                    columns: {
                                        [historyColumn]: 'hidden'
                                    }
                                },
                            },
                         };

    function oMessengerMenu() {
        this.sMode = null;
        this.bUpdate = false;
        this.bUniqueMode = false;
    }

    oMessengerMenu.prototype.setUniqueMode = function(bValue){
        this.bUniqueMode = bValue;

        if (this.bUniqueMode) {
            aMainViewScheme = {
                [historyColumn]: {
                    [sDesktop]: { view: 'col-span-6', enabled: true },
                    [sTablet]: { view : 'col-span-6', enabled: true },
                    [sPhone]: { view : 'col-span-10', columns: { [listColumn]: 'hidden' }},
                },
                [listColumn]: {
                    [sDesktop]: { view: 'col-span-4', enabled: true },
                    [sTablet]: { view: 'col-span-4', enabled: true },
                    [sPhone]: { view: 'col-span-10', enabled: true, columns: { [historyColumn]: 'hidden' }},
                },
                [menuColumn]: {
                    [sDesktop]: { view: 'hidden'},
                    [sTablet]: {
                        view: 'col-span-3',
                        columns: { [listColumn]: 'col-span-3', [historyColumn]: 'col-span-4' }
                    },
                    [sPhone]: {
                        view: 'col-span-8', columns: { [listColumn]: 'col-span-2' }
                    },
                },
                [infoColumn]: {
                    [sDesktop]: {
                        view: 'col-span-3',
                        columns: {
                            [listColumn]: 'col-span-3',
                            [historyColumn]: 'col-span-4'
                        }
                    },
                    [sTablet]: {
                        view: 'col-span-4',
                        columns: {
                            [listColumn]: 'col-span-3',
                            [historyColumn]: 'col-span-3'
                        }
                    },
                    [sPhone]: {
                        view: 'col-span-10',
                        columns: {
                            [historyColumn]: 'hidden'
                        }
                    },
                },
            };
        }
    }

    oMessengerMenu.prototype.removeClasses = function(sSelector, sPrefix = ''){
        const sPattern = 'col-[^\\s]+',
              sMainPattern = new RegExp(`${sPrefix.length ? sPrefix + ':' : ''}${sPattern}`, "gi");

        return $(sSelector).removeClass(function(i, sClass){
            if (!sClass)
                return;

            let mixedList = sClass.match(sMainPattern);
            return Array.isArray(mixedList) && mixedList.join(' ');
        });
    }

    oMessengerMenu.prototype.toggle = function(sEl, sViewMode, bUpdate = false){
        const sScreenMode = sViewMode ? sViewMode : this.sMode,
            { pfx } = aModePrefixes[sScreenMode],
            { view, columns } = aMainViewScheme[sEl][sScreenMode],
            sHide = 'hidden',
            sShow = pfx.length ? `${pfx}:${view}` : view,
            aColumns = columns ? Object.keys(columns) : [];

        if ((!$(sEl).is(':visible') && !bUpdate) || (bUpdate && $(sEl).is(':visible'))) {
            $(sEl).removeClass(sHide).addClass(sShow);

            aColumns.forEach((sColumn) => {
                let sViewClass = columns[sColumn];
                sViewClass = pfx.length ? `${pfx}:${sViewClass}` : sViewClass;

                this.removeClasses(sColumn, pfx).addClass(sViewClass);
            });
        }
        else
        {
            $(sEl).removeClass(sShow).addClass(sHide);
            aColumns.forEach((sColumn) => {
                let sViewClass = aMainViewScheme[sColumn][sScreenMode].view,
                    sHideClass = columns[sColumn];

                sViewClass = pfx.length && sViewClass ? `${pfx}:${sViewClass}` : sViewClass;
                sHideClass = pfx.length && sHideClass ? `${pfx}:${sHideClass}` : sHideClass;

                this.removeClasses(sColumn, pfx)
                    .removeClass(sHideClass)
                    .addClass(sViewClass);
            });
        }

        return $(sEl);
    };

    oMessengerMenu.prototype.setViewMode = function(){
        const iScreenWidth = $(window).width(),
              aScreenMods = Object.keys(aModePrefixes);

        this.sMode = sPhone;
        aScreenMods.forEach((sDevice) => {
            const { width } = aModePrefixes[sDevice];
            if (iScreenWidth >= width)
                this.sMode = sDevice;
        });
    }

    oMessengerMenu.prototype.updateView = function(sMode){
        const { pfx } = aModePrefixes[this.sMode],
            aColumns = Object.keys(aMainViewScheme);

        if (this.bUpdate) // use resize only if menu or info block was opened
            aColumns.forEach((sColumn) => {
                const { view, enabled } = aMainViewScheme[sColumn][this.sMode],
                    sViewClass = ( pfx.length && view ? `${pfx}:${view}` : view );

                if (enabled === true && $(sColumn).hasClass('hidden') && !$(sColumn).is(':visible'))
                    $(sColumn).removeClass('hidden');

                this.removeClasses(sColumn, pfx).addClass(enabled === true ? sViewClass : 'hidden');
            });
    }

    oMessengerMenu.prototype.toggleInfoPanel = function(){
        if (!this.sMode)
            this.setActiveItem();

        if ($(menuColumn).is(':visible') && this.sMode !== sDesktop)
            this.toggle(menuColumn);

        this.bUpdate = true;

        return this.toggle(infoColumn);
    }

    oMessengerMenu.prototype.toggleMenuPanel = function(){
        if (!this.sMode)
            this.setViewMode();

        if (this.sMode === sDesktop)
            return $(menuColumn);

        if ($(infoColumn).is(':visible') && this.sMode !== sDesktop)
            this.toggle(infoColumn);

        this.bUpdate = true;
        return this.toggle(menuColumn);
    }

    oMessengerMenu.prototype.toggleHistoryPanel = function(){
        if (!this.sMode)
            this.setViewMode();

        if (this.sMode !== sPhone)
            return;

        if ($(menuColumn).is(':visible') && this.sMode === sPhone)
            this.toggle(menuColumn);

        this.bUpdate = true;
        return this.toggle(historyColumn);
    }

    oMessengerMenu.prototype.setActiveItem = function(oItem, sArea ){
        const { talksListItems, active } = window.oMessengerSelectors.TALKS_LIST;

        if (oItem)
            $(talksListItems)
                .removeClass(active)
                .end()
                .find(oItem)
                .addClass(active);

        if (sArea && $(`li.bx-menu-item-${sArea}`).hasClass('bx-mi-collapsed'))
            $('a',`li.bx-menu-item-${sArea}`).click();
    }
    /**
     * bForce means close/false or open/true actions
     * @param bForce
     */
    oMessengerMenu.prototype.togglePanelMode = function(bForce = null) {
        const { historyColumn } = window.oMessengerSelectors.HISTORY,
              { panel } = window.oMessengerSelectors.TALKS_LIST,
               oPanel = $(historyColumn),
               bPanelEnabled = oPanel.hasClass(panel),
               fFunc = (bEnable) => !bEnable ? oPanel.removeClass(panel) : oPanel.addClass(panel);

        return fFunc( bForce !== null ? bForce : !bPanelEnabled );
    }

    oMessengerMenu.prototype.toggleBlockPanel = function(sPanel, fCallback) {
        const { view, columns } = sPanel && aBlockViewScheme[sPanel];

        if (!$(sPanel).is(':visible')) {
            $(sPanel).removeClass('hidden').addClass(view);

            for(const column in columns){
                const view = columns[column];
                this.removeClasses(column).addClass(view);
            };

            if (typeof fCallback === 'function')
                fCallback();
        }
        else
        {
            $(sPanel).removeClass(view).addClass('hidden');
            for(const column in columns){
                const { view } = aBlockViewScheme[column];
                this.removeClasses(column).addClass(view);
            };
        }
    }

    oMessengerMenu.prototype.toggleBlockGroupsPanel = function(oItem) {
        if ($(infoColumn).is(':visible'))
            this.toggleBlockPanel(infoColumn);

        this.toggleBlockPanel(groupsPanel);
    }

    oMessengerMenu.prototype.toggleBlockInfoPanel = function(oItem) {
        if ($(groupsPanel).is(':visible'))
            this.toggleBlockPanel(groupsPanel);

        this.toggleBlockPanel(infoColumn);
    }

    oMessengerMenu.prototype.toggleAlwaysOnTopBlock = function(bForce = null) {
        const { talksList, topItem, panel } = window.oMessengerSelectors.TALKS_LIST,
              { historyColumn } = window.oMessengerSelectors.HISTORY,
              oTopItem = $(talksList).find(topItem),
              bIsVisible = $(historyColumn).hasClass(panel),
              fFunc = (bShow) => bShow ? oTopItem.removeClass('hidden') : oTopItem.addClass('hidden');

        this.togglePanelMode(bForce);
        return fFunc( bForce !== null ? bForce : !bIsVisible );
    }

    const _oMenu = new oMessengerMenu();
    return {
                toggleMenuPanel: () => _oMenu.toggleMenuPanel(),
                togglePanelMode: (bEnable = false) => _oMenu.togglePanelMode(bEnable),
                showInfoPanel: () => _oMenu.toggleInfoPanel(),
                showHistoryPanel: () => _oMenu.toggleHistoryPanel(),
                toggleMenuItem: (oItem, sArea = undefined) => _oMenu.setActiveItem(oItem, sArea),
                toggleAlwaysOnTop: (bForce = null) => _oMenu.toggleAlwaysOnTopBlock(bForce),
                toggleBlockGroupsPanel: (oItem) => _oMenu.toggleBlockGroupsPanel(oItem),
                toggleBlockInfoPanel: (oItem) => _oMenu.toggleBlockInfoPanel(oItem),
                isHistoryColActive: () => $(historyColumn).is(':visible'),
                isMenuColActive: () => $(menuColumn).is(':visible'),
                onResize:() => {
                    const sMode = _oMenu.sMode;

                    _oMenu.setViewMode();
                    if (sMode !== _oMenu.sMode)
                        _oMenu.updateView(sMode);
                },
                setUniqueMode: (bEnable) => _oMenu.setUniqueMode(bEnable)
            };
})(jQuery);