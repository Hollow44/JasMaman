$(function () {
    $(".search-collection-item-editor-v3").each(function () {
        var $this = $(this);
        var editorName = $(this).data("editorName");
        var querySettings = $(this).data("querySettings");
        $this.searchCollectionItemWidgetV2({
            searchCollectionUrl: $this.data("searchCollectionUrl"),
            queryInputPlaceholder: $this.data("searchQueryInputPlaceholder"),
            querySettings: querySettings,
            isReadonly: $this.data("isReadonly"),
            isInvalid: $this.hasClass("is-invalid"),
            value: $this.data("value")
        });

        $this.closest("form").submit(function () {
            var val = $this.searchCollectionItemWidgetV2("getValue");
            var $input = $("<input type='hidden' name='{0}'>".format(editorName));
            if (val != "") {
                $input.val(JSON.stringify(val));
            } else {
                $input.val("");
            }
            
            $(this).append($input);
        });
    });
});

(function ($) {
    $.widget("yoda.searchCollectionItemWidgetV2", {
        _create: function () {
            var that = this;
            var $this = $(this.element);
            var $div = $(
                " <div class='input-group input-group-merge'>"
                + `<input type='text' class='form-control ${(this.options.isInvalid ? "is-invalid" : '')}' aria-label='...' readonly>`
                + "<div class='input-group-append'>"
                + "<button type='button' class='btn btn-secondary'>{0}</button>".format(T("Выбрать"))
                + "</div>"
                + "</div>"
            );

            if (this.options.isReadonly == true) {
                $div.removeClass("input-group");
                $div.find(".input-group-append").remove();
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
                        $dialog.searchCollectionWidgetV2({
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
                this._$input.val(value.Item.Text);
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
        if (this.data("yoda-searchCollectionItemWidgetV2")) {
            if (value === undefined) {
                return this.searchCollectionItemWidgetV2("getValue");
            } else {
                return this.searchCollectionItemWidgetV2("setValue", value);
            }
        }
        return originalVal.call(this, value);
    };
})(jQuery);

(function ($) {
    $.widget("yoda.searchCollectionWidgetV2", {
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

                + " <div class=\"input-group input-group-merge\">"
                + `<input type='text' class='form-control' placeholder=''>`
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
                            $item.text(item.Item.Text);
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
                var item = $(this).data("value");
                if (item.Item.IsEmpty) {
                    return;
                }
                options.select(item);
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