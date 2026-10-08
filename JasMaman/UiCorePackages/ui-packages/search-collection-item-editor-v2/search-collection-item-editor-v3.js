$(function () {
    $(".search-collection-item-editor").each(function () {
        var $this = $(this);
        var editorName = $(this).data("editorName");
        var querySettings = $(this).data("querySettings");
        $this.searchCollectionItemWidget({
            searchCollectionUrl: $this.data("searchCollectionUrl"),
            queryInputPlaceholder: $this.data("searchQueryInputPlaceholder"),
            querySettings: querySettings,
            isReadonly: $this.data("isReadonly"),
            value: $this.data("value")
        });

        $this.closest("form").submit(function () {
            var val = $this.searchCollectionItemWidget("getValue");
            var $input = $("<input type='hidden' name='{0}'>".format(editorName));
            $input.val(JSON.stringify(val));
            $(this).append($input);
        });
    });
});

(function ($) {
    $.widget("yoda.searchCollectionItemWidget", {
        _create: function () {
            var that = this;
            var $this = $(this.element);
            var $div = $(
                " <div class='input-group input-group-merge'>"
                + "<input type='text' class='form-control' aria-label='...' readonly>"
                + "<div class='input-group-append'>"
                + "<button type='button' class='btn btn-secondary'>{0}</button>".format(T("Выбрать"))
                + "</div>"
                + "</div>"
            );

            if (this.options.isReadonly == true) {
                $div.removeClass("input-group");
                $div.find(".input-group-btn").remove();
            }
            var $input = $div.find("input.form-control");
            that._$input = $input;
            that.setValue(this.options.value);

            $div.on("click", "button", function () {
                var $dialog = $("<div>");
                $dialog.dialog({
                    title: T("Выбрать объект"),
                    modal: true,
                    width: 600,
                    height: 500,
                    open: function () {
                        $dialog.searchCollectionWidget({
                            searchCollectionUrl: that.options.searchCollectionUrl,
                            queryInputPlaceholder: that.options.queryInputPlaceholder,
                            querySettings: that.options.querySettings,
                            select: function (value) {
                                that.setValue(value);
                                $dialog.dialog("close");
                            }
                        });
                    },
                    close: function () {
                        $dialog.remove();
                    }
                });
            });
            $this.append($div);
            that._$widget = $div;
            // $input.on("change", function(){
            //     this.element.trigger("change")
            // });
            that._on(that.element, {
                "change input": function (event) {
                    this._trigger("change", event, {
                        value: this.getValue()
                    });
                }
            });
        },
        setValue: function (val) {
            this._value = val;
            this._refresh();
        },
        getValue: function () {
            return this._value;
        },
        _refresh: function () {
            var value = this.getValue();
            if (value) {
                this._$input.val(value.Item.SearchItemText);
            } else {
                this._$input.val("");
            }
            this._$input.change();
        },
        destroy: function () {
            this._$widget.remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
})(jQuery);

(function ($) {
    var originalVal = $.fn.val;
    $.fn.val = function (value) {
        if (this.data("yoda-searchCollectionItemWidget")) {
            if (value === undefined) {
                return this.searchCollectionItemWidget("getValue");
            } else {
                return this.searchCollectionItemWidget("setValue", value);
            }
        }
        return originalVal.call(this, value);
    };
})(jQuery);

(function ($) {
    $.widget("yoda.searchCollectionWidget", {
        _create: function () {
            var that = this;
            var options = this.options;
            var searchCollectionUrl = options.searchCollectionUrl;
            var queryInputPlaceholder = options.queryInputPlaceholder || "";
            var onQueryExecuted = options.onQueryExecuted || function () { };

            var $widget = $(
                "<div>"
                + "<div class='row'>"
                + "<div class='col-md-12 search-query-input-toolbar'>"

                +" <div class=\"input-group input-group-merge\">"
                + "<input type='text' class='form-control' placeholder=''>"
                + "<div class='input-group-append'>"
                + "<button type='button' class='btn btn-secondary btn-search'>{0}</button>".format(T("Найти"))
                + "</div>"
                + "</div>"

                + "</div>"
                + "</div>"
                + "<div class=\"list-group\">"
                + "<span class=\"list-group-item\">"
                + T("Нет записей")
                + "</span>"
                + "</div>"
                + "</div>"
            );
            var $query = $widget.find("input");
            $query.prop("placeholder", queryInputPlaceholder);
            var $listGroup = $widget.find(".list-group");

            $widget.on("click", ".btn-search", function () {
                var $this = $(this);
                if ($this.hasClass("searching")) {
                    return;
                }
                $this.addClass("searching");
                $listGroup.empty();
                $listGroup.append("<span class=\"list-group-item searching-in-process \">{0}</span>".format(T("Загрузка данных...")));
                var query = {
                    Query: $query.val()
                };


                if (options.querySettings) {
                    query.Settings = JSON.stringify(options.querySettings);
                }

                $.ajax({
                    url: searchCollectionUrl,
                    data: query,
                    success: function (result) {
                        $this.removeClass("searching");
                        $listGroup.empty();
                        onQueryExecuted(result);

                        for (var i = 0; i < result.length; i++) {
                            var item = result[i];
                            var $item = $("<span class=\"list-group-item search-collection-item\">");
                            $item.text(item.Item.SearchItemText);
                            $listGroup.append($item);
                            $item.data("value", item);
                        }
                        if (result.length === 0) {
                            var $item = $("<span class=\"list-group-item search-collection-result-empty\">{0}</span>".format(T("По вашему запросу ничего не найдено")));
                            $listGroup.append($item);
                        }

                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        $listGroup.empty();
                        if (jqXHR.responseJSON) {
                            var $msg = $("<span class=\"list-group-item\">");
                            $msg.text(T("Не удалось загрузить данные. {0}").format(jqXHR.responseJSON.message));
                            $listGroup.append($msg);
                        } else {
                            $listGroup.append("<span class=\"list-group-item\">{0}</span>".format(T("Не удалось загрузить данные")));
                        }
                        $this.removeClass("searching");

                        onQueryExecuted([]);
                    }
                });
            });
            $widget.on("click", ".search-collection-item", function () {
                options.select($(this).data("value"));
            });
            this.element.append($widget);
            this._$widget = $widget;
        },
        destroy: function () {
            this._$widget.remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
})(jQuery);