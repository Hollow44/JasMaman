$(document).ready(
    function ($) {
        $(".translation-parse-result").each(function () {
            var $this = $(this);
            var parseResult = JSON.parse($(this).attr("parseResult"));

            var notFoundedTexts = parseResult.NotFoundTexts;
            var textParamsNotEqual = parseResult.TextParamsNotEqual;
            var okTexts = parseResult.OkTexts;
            var textsWithoutTranslation = parseResult.TextsWithoutTranslation;

            var addBlock = function (blockText) {
                var $div = $("<div>");
                $this.append($div);
                $div.append("<span>{0}</span>".format(blockText));
                return $div;
            };
            if (notFoundedTexts.length > 0) {
                var $notFoundedBlock = addBlock("Следующие тексты не были найдены");
                for (var i = 0; i < notFoundedTexts.length; i++) {
                    $notFoundedBlock.append("<div>{0}</div>".format(notFoundedTexts[i]));
                }
            }
            if (textParamsNotEqual.length > 0) {
                var $paramsNotEqualBlock = addBlock("Не совподают параметры");
                var $table = $("<table><thead><tr><th>{0}</th><th>{1}</th></tr></thead><tbody></tbody></table>".format("Текст", "Перевод"));
                $paramsNotEqualBlock.append($table);
                var $tbody = $table.children("tbody");

                for (var key in textParamsNotEqual) {
                    if (textParamsNotEqual.hasOwnProperty(key)) {
                        $tbody.append("<tr><td>{0}</td><td>{1}</td></tr>", key, textParamsNotEqual[key]);
                    }
                }
            }
            if (textsWithoutTranslation.length) {
                var $textWithoutTranslationBlock = addBlock("Строки без переводов");
                for (var i = 0; i < textsWithoutTranslation.length; i++) {
                    $textWithoutTranslationBlock.append("<div>{0}</div>".format(textsWithoutTranslation[i]));
                }
            }
            var $previewTable = addBlock("Предварительный просмотр");
            var $translationsTable = $("<table><thead><th>{0}</th><th>{1}</th><th>{2}</th></thead><tbody></tbody></table>".format("Текст", "Перевод", "Предыдущий перевод"));
            $previewTable.append($translationsTable);
            var $tbodyTranslations = $translationsTable.children("tbody");
            for (var text in okTexts) {
                if (okTexts.hasOwnProperty(text)) {
                    $tbodyTranslations.append("<tr><td>{0}</td><td>{1}</td><td>{2}</td></tr>".format(text, okTexts[text].Translation, okTexts[text].PrevTranslation));
                }
            }
        });
    }
);