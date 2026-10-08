var alreadyRegistredText = { };
window.alreadyRegistredText = alreadyRegistredText;
function T(text) {
    if(!window.globalPostUnregistredTextUrl) {
        return text;
    }
    if (text != "" && text != undefined && text != null) {
        var translatedText = globalTranslationsStore[text];
        if (translatedText == "" || translatedText == null || translatedText == undefined) {
            if (alreadyRegistredText[text] == true) {
                return text;
            }
            alreadyRegistredText[text] = true;
            jQuery.ajax({
                url: globalPostUnregistredTextUrl,
                type: "POST",
                dataType: "JSON",
                data: {
                    yoda_form_id: "RegisterJavascriptTranslateText",
                    Text: text,
                    FromUrl: document.URL,
                    __RequestVerificationToken: $('input[name="__RequestVerificationToken"]', $('form[id="0"]')).val(),
                }
                });
            return text;
        }
        return translatedText;
    }
    return text;
}