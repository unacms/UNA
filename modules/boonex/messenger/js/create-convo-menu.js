;window.oMessengerCreateConvo = (function($) {
    const { filterCriteria, filterCriteriaForm } = window.oMessengerSelectors.CREATE_TALK;

    return {
        onSelectConvoFilter : (sType) => {
            bx_loading_content(filterCriteria, true);
            $.post('modules/?r=messenger/get_filter_criteria', { type: sType }, ({ html, code}) => {
                if (!code)
                    $(`${filterCriteriaForm}`).html(html);

                bx_loading_content(filterCriteria, false);
            }, 'json');

            $(`${filterCriteria} ul > li`).removeClass('bx-menu-tab-active');
            $(`${filterCriteria} ul > li > a.${sType}`).parent().addClass('bx-menu-tab-active');
        }
    }
})(jQuery);