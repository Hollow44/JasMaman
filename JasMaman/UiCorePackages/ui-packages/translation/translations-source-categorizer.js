$(document).ready(function ($) {
    $(".translations-source-categorizer-editor").each(function () {
        var $editor = $(this);
        var categories = JSON.parse($editor.attr("categories"));
        var sourceCategories = JSON.parse($editor.attr("sourceCategories"));

        var getCategoryText = function (categoryId) {
            for (var j = 0; j < categories.length; j++) {
                if (categories[j].Id == categoryId)
                    return categories[j].CategoryText;
            }
            return "Категория с Id={0} не найдена".format(categoryId);
        };
        var getCategoriesText = function (categoriesIds) {
            var ret = "";
            for (var k = 0; k < categoriesIds.length; k++) {
                ret += getCategoryText(categoriesIds[k]) + "; ";
            }
            if (ret == "")
                ret = "[Без категории]";
            return ret;
        };
        var printSourceCategories = function (sourceCategoryItem, $container) {
            $container.append("<span class='source'>{0}</span>".format(sourceCategory.Source));
            $container.append("<span class='categories' sourceCategoryItem='{0}'>{1}</span>".format(JSON.stringify(sourceCategoryItem), getCategoriesText(sourceCategoryItem.Categories)));
        };

        for (var i = 0; i < sourceCategories.length; i++) {
            var sourceCategory = sourceCategories[i];
            var $div = $("<div class='category-editor-item'>");
            printSourceCategories(sourceCategory, $div);
            $editor.append($div);
        }

        var $lastTip = null;
        var closeAllTips = function () {
            if ($lastTip != null)
                $lastTip.remove();
            $lastTip = null;
        };
        $(document).click(function () {
            closeAllTips();
        });
        $editor.delegate(".categories", "click", function (e) {
            e.stopPropagation();
            closeAllTips();
            var $this = $(this);
            var sourceCategoryItem = JSON.parse($this.attr("sourceCategoryItem"));

            var $selector = $("<div>");
            for (var i = 0; i < categories.length; i++) {
                var checked = false;
                for (var j = 0; j < sourceCategoryItem.Categories.length; j++) {
                    if (categories[i].Id == sourceCategoryItem.Categories[j]) {
                        checked = true;
                        break;
                    }
                }
                $selector.append("<div><input type='checkbox' name='category-{0}' id='category-{0}' {2}><label for='category-{0}'>{1}</label></div>".format(categories[i].Id, categories[i].CategoryText, checked ? "checked='checked'" : ""));
            }

            $selector.css("position", "absolute");
            $selector.css("background-color", "white");
            $selector.css("padding", "5px");
            $selector.css("border", "1px solid gray");
            $("body").append($selector);

            var offset = $this.offset();
            $selector.css("top", offset.top + $this.outerHeight() + 2);
            $selector.css("left", offset.left);
            $lastTip = $selector;

            $selector.click(function (e) {
                e.stopPropagation();
                var arr = new Array();
                $selector.find(":checked").each(function () {
                    var $check = $(this);
                    arr.push(parseInt($check.attr("name").replace("category-", "")));
                });
                sourceCategoryItem.Categories = arr;
                $this.attr("sourceCategoryItem", JSON.stringify(sourceCategoryItem));
                $this.text(getCategoriesText(arr));
            });
        });

        $editor.closest("form").submit(function () {
            var $form = $(this);
            var arr = new Array();
            $editor.find(".categories").each(function () {
                var item = JSON.parse($(this).attr("sourceCategoryItem"));
                arr.push(item);
            });
            var $hidden = $("<input name='{0}' type='hidden' />".format($editor.attr("editor-name")));
            $hidden.val(JSON.stringify(arr));
            $form.append($hidden);
        });
    });

    $("body").each(function () {
        var $translationsTable = $(this);
        $translationsTable.delegate(".translations-remove-text", "click", function () {
            var $this = $(this);
            var removeTextUrl = $this.attr("remove-text-url");
            var $dlg = $("<div><span class='translations-remove-text-msg'>Удалить текст?</span></div>");
            $dlg.append("<br/>");
            var $textLbl = $("<span>");
            $textLbl.text($this.attr("text"));

            $dlg.append($textLbl);
            $dlg.dialog({
                title: "Удаление текста из списка переводов",
                width: 500,
                modal: true,
                buttons: [
                        { text: "OK", click: function () {
                            $.ajax({
                                url: removeTextUrl,
                                type: "POST",
                                dataType: "JSON",
                                data: {},
                                success: function (data) {
                                    if (data.ResultCode == "OK") {
                                        $this.closest("tr").hide();
                                        $dlg.dialog("close");
                                    } else {
                                        alert("Не удалось удалить текст");
                                    }
                                },
                                error: function (a, b, c) {
                                    alert("Не удалось удалить текст.");
                                }
                            });
                        }
                        },
                        { text: "Отмена", click: function () {
                            $dlg.dialog("close");
                        }}
                    ],
                close: function () {
                    $dlg.dialog("dispose");
                }
            });
        });
        $translationsTable.delegate(".edit-translation", "click", function () {
            var $translationEditor = $("<div>");
            var $this = $(this);
            var $div = $("<div>");
            var $errors = $('<div class="validation-summary-errors"><ul></ul></div>');
            var $errorsList = $errors.children("ul");

            $translationEditor.append($errors);
            $div.append("<span class='translation-text-caption'>{0}: </span>".format("Текст"));
            $div.append("<span class='translation-text'>{0}</span>".format($this.attr("text")));
            $translationEditor.append($div);
            $translationEditor.append("<span class='translation-translated-text-caption'>{0}</span>".format("Перевод"));
            $translationEditor.append("<textarea name='translation' >{0}</textarea>".format($this.attr("translated-text")));

            $translationEditor.dialog({
                title: "Редактирование перевода",
                width: 500,
                modal: true,
                buttons: [
                        { text: "OK", click: function () {
                            var submitTranslationUrl = $this.attr("submit-translation-url");
                            var translatedText = $translationEditor.find("textarea").val();
                            $errorsList.empty();
                            $.ajax({
                                url: submitTranslationUrl,
                                type: "POST",
                                dataType: "JSON",
                                data: { yoda_form_id: "MnuTranslationsSet", TranslatedText: translatedText },
                                success: function (data) {
                                    if (data.ResultCode == "OK") {
                                        var $headRow = $translationsTable.children("thead").children("tr");
                                        var $thTranslatedText = $headRow.find("[col-name='{0}']".format("flTranslatedTextCell"));

                                        var translatedTextCellIndex = $headRow.index($thTranslatedText);
                                        $($this.closest("tr").find("td").get(translatedTextCellIndex)).children("span").text(translatedText);
                                        $this.attr("translated-text", translatedText);
                                        $translationEditor.dialog("close");
                                    } else {
                                        $errorsList.append("<li>{0}</li>".format("Перевод не сохранен." + " " + data.Error));
                                    }
                                },
                                error: function (a, b, c) {
                                    alert("Не удалось загрузить перевод.");
                                }
                            });
                        }
                        },
                        { text: "Отмена", click: function () {
                            $translationEditor.dialog("close");
                        }
                        }
                    ],
                close: function () {
                    $translationEditor.dialog("dispose");
                }
            });
        });

    });
});