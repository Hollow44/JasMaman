$(document).ready(function () {
    $(".search-collection-editor-v4").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var isReadonly = $this.data("readonly");
        var value = $this.data("value");
        var searchCollectionUrl = $this.data("searchCollectionUrl");
        var headerText = $this.data("headerText");
        var queryPlaceholder = $this.data("searchQueryInputPlaceholder");
        var querySettings = $this.data("querySettings");

        ReactDOM.render(React.createElement(SearchCollectionEditor, { name: editorName, readonly: isReadonly, value: value, searchCollectionUrl: searchCollectionUrl, searchDialogHeaderText: headerText, queryInputPlaceholder: queryPlaceholder, querySettings: querySettings }), this);
    });

    $(".multi-search-collection-item-editor-v4").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var isReadonly = $this.data("isReadonly");
        var items = $this.data("items") || [];
        var searchCollectionUrl = $this.data("searchCollectionUrl");
        var headerText = $this.data("headerText");
        var queryPlaceholder = $this.data("searchQueryInputPlaceholder");
        var querySettings = $this.data("querySettings");

        ReactDOM.render(React.createElement(MultiSearchCollectionEditor, { name: editorName, readonly: isReadonly, items: items, searchCollectionUrl: searchCollectionUrl, searchDialogHeaderText: headerText, queryInputPlaceholder: queryPlaceholder, querySettings: querySettings }), this);
    });
});