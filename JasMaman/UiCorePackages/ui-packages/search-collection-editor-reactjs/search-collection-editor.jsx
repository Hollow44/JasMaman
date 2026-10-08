$(document).ready(function () {
    $(".search-collection-editor-v2").each(function () {
        const $this = $(this);
        const editorName = $this.data("editorName");
        const isReadonly = $this.data("readonly");
        const value = $this.data("value");
        const searchCollectionUrl = $this.data("searchCollectionUrl");
        const headerText = $this.data("headerText");
		const queryPlaceholder = $this.data("searchQueryInputPlaceholder");
		const querySettings = $this.data("querySettings")

        ReactDOM.render(
			<SearchCollectionEditor name={editorName} readonly={isReadonly} value={value} searchCollectionUrl={searchCollectionUrl} searchDialogHeaderText={headerText} queryInputPlaceholder={queryPlaceholder} querySettings={querySettings} />,
            this
        );
    });

    $(".two-field-search-collection-editor").each(function () {
        const $this = $(this);
        const editorName = $this.data("editorName");
        const isReadonly = $this.data("readonly");
        const value = $this.data("value");
        const searchCollectionUrl = $this.data("searchCollectionUrl");
        const headerText = $this.data("headerText");
		const queryPlaceholder = $this.data("searchQueryInputPlaceholder");
		const querySettings = $this.data("querySettings")

        ReactDOM.render(
            <SearchCollectionEditor twoFielded={true} name={editorName} readonly={isReadonly} value={value} searchCollectionUrl={searchCollectionUrl} searchDialogHeaderText={headerText} queryInputPlaceholder={queryPlaceholder} querySettings={querySettings} />,
            this
        );
    });

    $(".multi-search-collection-editor-v2").each(function () {
        const $this = $(this);
        const editorName = $this.data("editorName");
        const isReadonly = $this.data("readonly");
        const items = $this.data("items") || [];
        const searchCollectionUrl = $this.data("searchCollectionUrl");
        const headerText = $this.data("headerText");
        const queryPlaceholder = $this.data("searchQueryInputPlaceholder");
		const querySettings = $this.data("querySettings")

        ReactDOM.render(
			<MultiSearchCollectionEditor name={editorName} readonly={isReadonly} items={items} searchCollectionUrl={searchCollectionUrl} searchDialogHeaderText={headerText} queryInputPlaceholder={queryPlaceholder} querySettings={querySettings} />,
            this
        );
    });
});