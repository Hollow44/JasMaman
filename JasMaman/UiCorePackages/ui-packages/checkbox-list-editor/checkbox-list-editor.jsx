class CheckboxListEditor extends React.Component {
    constructor(props) {
        super(props);

        var items = $.extend(true, [], props.items);

        for (var i = 0; i < items.length; i++) {
            var curItem = items[i];
            var item = props.selectedIds.find(id => curItem.Id === id);
            curItem.selected = item !== undefined;
        }
        this.onItemChecked = this.onItemChecked.bind(this);
        this.onItemsChecked = this.onItemsChecked.bind(this);
        this.state = {
            items: items,
            selectedAll: true,
            readonly: props.readonly
        };
    }
    onItemChecked(index) {
        if (!this.state.readonly) {
            var items = $.extend(true, [], this.state.items);
            items[index].selected = !items[index].selected;
            var allItemsCheck = !items.some(x => x.selected === false);
            this.setState({
                items: items,
                selectedAll: allItemsCheck
            });
        }
    }
    onItemsChecked(selectedAll) {
        if (!this.state.readonly) {
            var items = $.extend(true, [], this.state.items);
            selectedAll = !selectedAll;
            for (var i = 0; i < items.length; i++) {
                items[i].selected = selectedAll;
            }
            this.setState({
                items: items,
                selectedAll: selectedAll
            });
        }
    }
    render() {
        var items = this.state.items.map((x, index) => (
            <li key={x.Id} className="list-group-item list-group-item-selectable" onClick={e => this.onItemChecked(index)}>
                <span className={(x.selected ? "state-icon uil-check-square" : "state-icon uil-square-full")} />
                {x.Text}
            </li>
        ));
        var noRows = this.state.items.length === 0 ? (<li className="list-group-item no-rows-item">Нет записей</li>) : null;
        return (
            <div>
                <div onClick={e => this.onItemsChecked(this.state.selectedAll)}>
                    <span className={(this.state.selectedAll ? "state-icon glyphicon glyphicon-check" : "state-icon glyphicon glyphicon-unchecked")} />
                    Выбрать все
                </div>
                <ul className="list-group">
                    {items}
                    {noRows}
                </ul>
                <input name={this.props.name} type="hidden" value={JSON.stringify(this.state.items.filter(x => x.selected).map(x => x.Id))} />
            </div>
        );
    }
}

$(document).ready(function () {
    $(".checkbox-list-editor").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var items = $this.data("items");
        var selectedIds = $this.data("selectedIds");

        ReactDOM.render(
            <CheckboxListEditor name={editorName} items={items} selectedIds={selectedIds} noRowsText={$this.data("noRowsText")} readonly={$this.data("readonly")} />,
            this
        );
    });
});
