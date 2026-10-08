class MultiSearchCollectionEditor extends React.Component {
    constructor(props) {
        super(props);
                
        this.state = {
            dialogState: "Closed"
        };

        this.state.items = this.props.items === null ? [] : this.props.items;
        this.onAdd = this.onAdd.bind(this);
        this.addBtnClickHandler = this.addBtnClickHandler.bind(this);
        this.removeBtnClickHandler = this.removeBtnClickHandler.bind(this);
        this.onSearchDialogClose = this.onSearchDialogClose.bind(this);
        this.getOpsCellOrNullIfReadonly = this.getOpsCellOrNullIfReadonly.bind(this);
        this.changed = this.changed.bind(this);
        this.onValueChange = this.onValueChange.bind(this);
    }

    onAdd(item) {
        if (this.state.items.some(x => x.SearchItemId === item.SearchItemId)) {
            this.setState({
                errorMessage: "Такая же запись была добавлена ранее"
            });
            return;
        }
        var items = $.extend(true, [], this.state.items);
        items.push(item);
        this.setState({
            items: items,
            dialogState: "Closed"
        });
        this.changed(items);
    }
    addBtnClickHandler() {
        this.setState({
            dialogState: "Open",
            errorMessage: null
        });
    }
    removeBtnClickHandler(rowIndex) {
        if (confirm("Удалить запись?") !== true) {
            return;
        }
        var items = $.extend(true, [], this.state.items);
        items.splice(rowIndex, 1);
        this.setState({ items: items });
        this.changed(items);
    }
    onSearchDialogClose() {
        this.setState({
            dialogState: "Closed"
        });
    }
    getOpsCellOrNullIfReadonly(rowIndex) {
        if (this.props.readonly === true) {
            return null;
        }
        return <td><span className="badge badge-danger" onClick={e => this.removeBtnClickHandler(rowIndex)}>Удалить</span></td>;
    }

    changed(value) {
        this.props.onChange(value);
    }

    onValueChange(value) {
        this.props.onChange(value);
    }

    render() {
        var emptyItem = this.state.items.length === 0
            ? (<tr className="empty-item"><td colSpan={(this.props.readonly === true ? 2 : 3)}>{T("Нет записей")}</td></tr>)
            : null;
        var items = this.state.items.map((x, index) => <tr><td>{index + 1}</td>{this.getOpsCellOrNullIfReadonly(index)}<td>{x.SearchItemText}</td></tr>);

        var addBtn = this.props.readonly === true
            ? null
            : <div><button className="btn btn-primary" type="button" onClick={e => this.addBtnClickHandler()}>Добавить</button></div>;

        var opColHeaderTd = this.props.readonly === true
            ? null
            : <th width="180px">Операции</th>;

        return (
            <div>
                {addBtn}
				<SearchCollectionQueryEditor show={(this.state.dialogState === "Open")} onHide={e => this.onSearchDialogClose()} headerText={this.props.searchDialogHeaderText} onSelect={item => this.onAdd(item)} searchCollectionUrl={this.props.searchCollectionUrl} queryInputPlaceholder={this.props.queryInputPlaceholder} querySettings={this.props.querySettings} errorMessage={this.state.errorMessage} />
                <table className="table">
                    <thead>
                        <tr>
                            <th width="20px">№</th>
                            {opColHeaderTd}
                            <th>Данные</th>
                        </tr>
                    </thead>
                    <tbody>
                        {emptyItem}
                        {items}
                    </tbody>
                </table>
                <input name={this.props.name} value={JSON.stringify(this.state.items)} type="hidden" onChange={this.onValueChange.bind(this)} />
            </div>
        );
    }
}
