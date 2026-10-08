/*reference item*/

function ReferenceItem(value, text) {
    this.Items = new Array();
    this.Value = value;
    this.Text = text;
};

function Reference(name) {
    this.Name = name;
    this.Items = new Array();
};

Reference.prototype.Search = function (value) {
    return findRefItem(value, this.Items);
};

function findRefItem(value, searchingRefItemsCollection) {
    for (var i = 0; i < searchingRefItemsCollection.length; i++) {
        var refItem = searchingRefItemsCollection[i];
        if (refItem.Value == value)
            return refItem;
        var childRefItem = findRefItem(value, refItem.Items);
        if (childRefItem != null)
            return childRefItem;
    }
    return null;
};

function YodaReferences() {
    this.ReferenceItems = new Array();
};

YodaReferences.prototype.GetReference = function (name) {
    for (var i = 0; i < this.ReferenceItems.length; i++) {
        var item = this.ReferenceItems[i];
        if (item.Name == name)
            return item;
    }
    return null;
};

function yodaRegisterReferenceJson(name, referenceJson) {

    var ref = new Reference(referenceJson.ReferenceName);

    function addJsonItemsToReference(referenceItems, jsonRefItems) {
        for (var curIndex = 0; curIndex < jsonRefItems.length; curIndex++) {
            var curSourceItem = jsonRefItems[curIndex];
            var refItem = new ReferenceItem(curSourceItem.Value, curSourceItem.Text);
            referenceItems.push(refItem);
            addJsonItemsToReference(refItem.Items, curSourceItem.Items);
        }
    }

    addJsonItemsToReference(ref.Items, referenceJson.Items);

    window.References.ReferenceItems.push(ref);
};


function yodaRegisterReference(name, xml) {
    var $xml = $toXmlObject(xml);
    var xmlRootElement = $xml.find("[name='" + name + "']").first();
    var items = parseReferenceXml(xmlRootElement);
    var ref = new Reference(name);
    for (var i = 0; i < items.length;i++)
        ref.Items.push(items[i]);
    window.References.ReferenceItems.push(ref);
};

function parseReferenceXml(xmlElement) {
    var items = new Array();
    $(xmlElement).children("ReferenceItem").each(
                function () {
                    var refItem = new ReferenceItem($(this).attr("id"), $(this).attr("text"));
                    var childs = parseReferenceXml($(this));
                    for (var i = 0; i < childs.length; i++) {
                        refItem.Items.push(childs[i]);
                    }
                    items.push(refItem);
                }
            );
    return items;
};


window.References = new YodaReferences();

