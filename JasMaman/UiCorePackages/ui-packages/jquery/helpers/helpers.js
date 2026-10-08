//принимает строку xml и возвращает jquery объект для работы с ней
function $toXmlObject(xmlStr) {
    var xmlDoc = $.parseXML(xmlStr);
    return $(xmlDoc);
}