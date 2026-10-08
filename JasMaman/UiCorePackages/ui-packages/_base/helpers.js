if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function (action, that /*opt*/) {
        for (var i = 0, n = this.length; i < n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}

//simple string format. example: var str = "Hello, {0}!".format("world");
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
    });
};

function isNullOrUndefined(value) {
    return (value == null || value === undefined);
}

function isEmpty(value) {
    if (isNullOrUndefined(value))
        return true;
    if (value == "")
        return true;
    return false;
}

function trimText(text) {
    if(text == null || text == undefined) {
        return "";
    }
    return text.replace(/^([\s]*)|([\s]*)$/g, '');
}

//преобразование объекта в аттрибуты XML
function objToXmlAttrs(attributesObjs) {
    var conditionAttrsStr = "";
    for (var key in attributesObjs) {
        var attrValue =
                    trimText(attributesObjs[key])
                        .replace(new RegExp("&", "g"), "&amp;")
                        .replace(new RegExp("<", "g"), "&lt;")
                        .replace(new RegExp(">", "g"), "&gt;")
                        .replace(new RegExp("\"", "g"), "&quot;")
                        .replace(new RegExp("'", "g"), "&apos;");
        conditionAttrsStr += key + "=\"" + attrValue + "\" ";
    }
    return conditionAttrsStr;
}

/*
    Получить справочник

    reference: {
        table:"",
        group:"",
        name:""
        level:""
    },
    options: {
        isStatic:false, //загрузить справочник из сервера или из статично зарегистрированного?
        limitByLevel: true //элементы справочников, уровнем ниже чем level не загрузяться
    },
    callback: function(referenceItems){
    }
*/
function getReference(referenceInfo, options, callback) {
    var defaultOptions = {
        isStatic: false,
        limitByLevel: false
    };
    var settings = $.extend({}, defaultOptions, options);

    if (settings.isStatic == true) {
        var ref = window.References.GetReference(referenceInfo.name);
        callback(ref.Items);
    } else {
        if (settings.isLimitByLevel == true) {
            $getJSONReferenceLimitedByLevel(
                referenceInfo.name,
                referenceInfo.group,
                referenceInfo.table,
                referenceInfo.level,
                callback
            );
        } else {
            $getJSONReferenceFull(
                referenceInfo.name,
                referenceInfo.group,
                referenceInfo.table,
                callback);
        }
    }
}


//возвращает url с учетом виртульного каталога и с учетом текущего языка.(domain.com/virtualPath/lang)
function getActionUrl(url) {
    return rootDir + url;
}

//возвращает url с учетом виртульного каталога
function getFileUrl(url) {
    return filesRootDir + url;
}


function getAjaxLoadHtmlMarkup(loadText) {
    if(loadText === null || loadText === undefined || loadText === "") {
        loadText = "Загрузка данных...";
    }
    return "<div class='loading-data-element' style='display:block'>{0}</div>".format(loadText);
}


function randomString(length) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ'.split('');

    if (!length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = '';
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(what, i) {
        i = i || 0;
        var L = this.length;
        while (i < L) {
            if (this[i] === what) return i;
            ++i;
        }
        return -1;
    };
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) != -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function trimIfLong(text, maxLength) {
    if (maxLength === undefined) {
        maxLength = 20;
    }
    if (text.length > maxLength)
        return text.substring(0, maxLength) + "...";
    return text;
}

function bytesToSize(bytes, precision) {
    var kilobyte = 1024;
    var megabyte = kilobyte * 1024;
    var gigabyte = megabyte * 1024;
    var terabyte = gigabyte * 1024;

    if ((bytes >= 0) && (bytes < kilobyte)) {
        return bytes + ' Байт';

    } else if ((bytes >= kilobyte) && (bytes < megabyte)) {
        return (bytes / kilobyte).toFixed(precision) + ' КБ';

    } else if ((bytes >= megabyte) && (bytes < gigabyte)) {
        return (bytes / megabyte).toFixed(precision) + ' МБ';

    } else if ((bytes >= gigabyte) && (bytes < terabyte)) {
        return (bytes / gigabyte).toFixed(precision) + ' ГБ';

    } else if (bytes >= terabyte) {
        return (bytes / terabyte).toFixed(precision) + ' ТБ';

    } else {
        return bytes + ' Б';
    }
}



var dataLoadingDivHtml = "<div class='loading-data-element' style='display:block'>Загрузка данных...</div>";
function getAjaxErrorTextHtml(jqXhr, textStatus, errorThrown) {
    return "Не удалось загрузить данные ( statusText: " + jqXhr.statusText + "; responseText: " + jqXhr.responseText + "; textStatus: " + textStatus + "; errorThrown: " + errorThrown + ")";
}


