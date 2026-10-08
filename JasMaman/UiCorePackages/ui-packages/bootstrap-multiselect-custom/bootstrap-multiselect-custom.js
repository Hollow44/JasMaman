// Патч фильтрации: сравнение по lowerCase
(function patchFilterBehavior() {
    const originalFilter = $.fn.multiselect.Constructor.prototype.filter;
    $.fn.multiselect.Constructor.prototype.filter = function (query) {
        if (typeof query === 'string') {
            query = query.toLowerCase();
        }

        this.$select.find('option').each(function () {
            const $option = $(this);
            const label = $option.attr("label") || $option.text();
            $option.data('filterText', label.toLowerCase());
        });

        originalFilter.call(this, query);
    };
})();

// Инициализация .multiselect.multiselect-custom
$(function () {
    $(".multiselect.multiselect-custom").each(function () {
        var $this = $(this);
        var fieldText = $this.data("nonSelectedText");
        var popupContainerTemplate = $this.data("popupContainerTemplate") ??
            '<div class="multiselect-container dropdown-menu col-12"></div>';

        $this.multiselect({
            enableHTML: true,
            enableResetButton: true,
            nonSelectedText: fieldText,
            selectAllText: "Выбрать всё",
            maxHeight: 300,
            includeSelectAllOption: $this.data("includeSelectAllOption"),
            enableClickableOptGroups: true,
            enableFiltering: true,                     // 👈 включён фильтр
            enableCaseInsensitiveFiltering: true,     // 👈 доп. опция
            buttonClass: `form-control custom-select text-left-important ${($this.hasClass("input-validation-error") ? " input-validation-error" : "")}`,
            buttonWidth: '100%',
            buttonText: function (options, select) {
                if (options.length === 0) {
                    return fieldText;
                } else if (options.length > 3) {
                    return ['<b>Выбрано</b> (', options.length, ')'].join('');
                } else {
                    var labels = [];
                    options.each(function () {
                        if ($(this).attr('label') !== undefined) {
                            labels.push($(this).attr('label'));
                        } else {
                            labels.push($(this).html());
                        }
                    });
                    return labels.join(', ');
                }
            },
            templates: {
                popupContainer: popupContainerTemplate
            }
        });

        // Растягиваем поле ввода фильтра на 100%
        $this.on('shown.bs.multiselect', function () {
            $('.multiselect-search').css({
                width: '100%',
                'box-sizing': 'border-box',
                padding: '4px 8px'
            });
        });
    });
});