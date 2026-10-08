/* eslint-disable */

class SpreadsheetBook extends React.Component {
    constructor(props) {
        super(props);
        /** @type {BookDataProviderBase} */
        this._provider = this.props.provider;
        let bookInfo = this.props.bookInfo;
        let gridData = this.props.gridData;
        let pageId = gridData ? gridData.Id : null;
        this.state = {
            bookInfo: bookInfo,
            activePageId: pageId,
            gridData: gridData,
            activeCellInfo: null,
            pendingCellInfo: null,
            saving: false,
            bookChangeIndex: 0,
            highlightedCellId: null,
            errors: this.getErrorsData(this.props.bookErrors),
            showErrors: !!this.props.showErrors,
            isReadonly: !!this.props.isReadonly,
            pastedCellIds: null,
            filterCategoryPages: true
        };
        this.pendingState = Object.assign({}, this.state);
        this.onPageChange = this.onPageChange.bind(this);
        this.onLanguageChange = this.onLanguageChange.bind(this);
        this.onCellEditorKeyPress = this.onCellEditorKeyPress.bind(this);
        this.onCellEditorKeyDown = this.onCellEditorKeyDown.bind(this);
        this.onCellEditorBlur = this.onCellEditorBlur.bind(this);
        this.activateNextCell = this.activateNextCell.bind(this);
        this.setLocalState = this.setLocalState.bind(this);
        this.onBookSave = this.onBookSave.bind(this);
        this.gotoErrorCell = this.gotoErrorCell.bind(this);
        this.getErrorsData = this.getErrorsData.bind(this);
        this.toggleShowErrors = this.toggleShowErrors.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);
        this.onWindowClose = this.onWindowClose.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.onBodyClick = this.onBodyClick.bind(this);
        this.emit = this.emit.bind(this);
        this.refreshStickyCells = this.refreshStickyCells.bind(this);

        this.$t = this.props.translateFunc || (t => t);
        window.addEventListener('beforeunload', this.onWindowClose);

        let exposeApi = this.props.exposeApi;
        if (exposeApi) {
            Object.assign(exposeApi, {
                saveBook: async () => await this.onBookSave()
            })
        }

        this.emit('sg-book-loaded', { PageId: pageId, LangCode: bookInfo.CurLangCode });
    }

    /**
     * @param {'sg-book-loaded'|'sg-page-changed'|'sg-lang-changed'|'sg-book-saved'} eventType
     * @param {any} [eventArgs]
     */
    emit(eventType, eventArgs) {
        let emitter = this.props.eventEmitter;
        if (!emitter) {
            return;
        }
        $(emitter).trigger({
            type: eventType,
            args: eventArgs
        });
    }

    getErrorsData(errors) {
        errors = errors || [];
        let map = new Map();
        for (let error of errors) {
            for (let cell of error.Cells) {
                if (!map.has(cell.CellId)) {
                    map.set(cell.CellId, []);
                }
                map.get(cell.CellId).push(error.Message);
            }
        }
        return {
            map: map,
            list: errors
        };
    }

    toggleShowErrors() {
        this.setLocalState({
            showErrors: !this.state.showErrors
        })
    }

    toggleFullscreen() {
        let element = this.props.containerElement;
        if (!element) {
            return;
        }
        let fsElements = ['fullscreenElement', 'mozFullScreenElement', 'webkitFullscreenElement', 'msFullscreenElement'];
        let fsRequestFunc = ['requestFullscreen', 'msRequestFullscreen',
            'mozRequestFullScreen', 'webkitRequestFullscreen'].map(x => element[x]).filter(x => typeof x === 'function')[0];
        let fsExitFunc = ['exitFullscreen', 'msExitFullscreen',
            'mozCancelFullScreen', 'webkitExitFullscreen'].map(x => document[x]).filter(x => typeof x === 'function')[0];
        if (!fsElements.some(prop => document[prop])) {
            fsRequestFunc && fsRequestFunc.apply(element);
        } else {
            fsExitFunc && fsExitFunc.apply(document);
        }
    }

    onWindowClose(event) {
        let changeIndex = this.state.bookChangeIndex;
        if (changeIndex === 0) {
            return;
        }
        event.preventDefault();
        event.returnValue = '';
    }

    setLocalState(state) {
        this.setState(state);
        Object.assign(this.pendingState, state);
    }

    async onPageChange(pageId) {
        let gridData = await this._provider.getGridData(pageId);
        this.setLocalState({
            activePageId: pageId,
            gridData: gridData,
            activeCellInfo: null,
            removingRowsRange: null
        });
        this.emit('sg-page-changed', { PageId: pageId });
    }

    async onLanguageChange(langCode) {
        let pageId = this.state.activePageId;
        let bookInfo = await this._provider.setLanguage(langCode);
        let gridData = await this._provider.getGridData(pageId);
        this.setLocalState({
            bookInfo: bookInfo,
            gridData: gridData,
        });
        this.emit('sg-lang-changed', { LangCode: langCode });
    }

    async waitFor(ms) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    async onBookSave() {
        if (await this._provider.getBookChangeIndex() === 0) {
            return;
        }
        this.setLocalState({ saving: true });
        await this.waitFor(1);   // small delay to allow React rerender new state
        try {
            let bookContent = await this._provider.getBookXml();
            let changeIndex = await this._provider.getBookChangeIndex();
            if (this.props.bookSaveFormat === 'gzip') {
                bookContent = btoa(pako.gzip(bookContent, { to: 'string' }));
            }
            $.ajax({
                url: this.props.bookSaveUrl,
                method: 'POST',
                data: bookContent,
                contentType: 'application/octet-stream'
            }).done(data => {
                (async () => {
                    if (changeIndex === await this._provider.getBookChangeIndex()) {
                        await this._provider.resetBookChangeIndex();
                        this.setLocalState({
                            bookChangeIndex: 0
                        });
                    }
                })().catch(console.error);

                this.emit('sg-book-saved');
                if (!data) {
                    return;
                }
                try {
                    if (typeof data === 'string') {
                        data = JSON.parse(data);
                    }
                    if (!data.BookErrors) {
                        return;
                    }
                    this.setLocalState({
                        errors: this.getErrorsData(data.BookErrors)
                    });
                } catch (e) {
                    console.warn(`Unable to parse & process server response:`, e);
                }
            }).fail(() => {
                alert(this.$t('Не удалось сохранить данные'));
            }).always(() => {
                this.setLocalState({ saving: false });
            });
        } catch (e) {
            this.setLocalState({ saving: false });
            alert(this.$t('Не удалось сохранить данные'));
        }
    }

    omitDefVal(val, defVal) {
        if (val === defVal) {
            return undefined;
        }
        return val;
    }

    renderSpreadsheetColGroup(g) {
        var cols = [<col key={'-'} span="1" className="col-rhead" />];
        for (let col of g.Columns) {
            let attr = col.IsStretchMarker ? 'min-width' : 'width';
            cols.push(<col key={col.i} span="1" style={{ [attr]: col.Width }} />);
        }
        return <colgroup>{cols}</colgroup>;
    }

    async setCellValue(r, cell, value) {
        if (cell.Type !== 'InputCell' || cell.Readonly) {
            return false;
        }
        if (value === undefined) {
            console.warn('setCellValue: Attempt to set undefined value');
            return false;
        }
        if (typeof value !== 'string') {
            value = '';
        }
        let ret = await this._provider.setInputCellValue(cell.CellId, value);
        if (!ret) {
            return false;
        }
        let bookChangeIndex = await this._provider.getBookChangeIndex();
        let pageId = this.state.activePageId;
        let gridData = this.state.gridData;
        if (r.IsDuplicable) {
            gridData = await this._provider.getGridData(pageId);
        } else {
            ret.forEach(x => {
                let cell = gridData.CellById[x.CellId];
                if (cell) {
                    cell.FormattedData = x.FormattedData;
                }
            })
        }
        this.setLocalState({
            gridData: gridData,
            bookChangeIndex: bookChangeIndex
        });
        return true;
    }

    async setCellValuesBlock(riStart, ciStart, vrows) {
        let ret = await this._provider.setInputCellValuesBlock(this.state.activePageId, riStart, ciStart, JSON.stringify(vrows));
        if (!ret) {
            return false;
        }
        let bookChangeIndex = await this._provider.getBookChangeIndex();
        let gridData = this.state.gridData;
        ret.ChangedCells.forEach(x => {
            let cell = gridData.CellById[x.CellId];
            if (cell) {
                cell.FormattedData = x.FormattedData;
            }
        });
        let pastedCellIds = new Set(ret.AppliedCellIds);
        this.setLocalState({
            pastedCellIds: pastedCellIds,
            gridData: gridData,
            bookChangeIndex: bookChangeIndex
        });
        return true;
    }

    getCellEditor(inputCellInfo, row) {
        let cellInfo = inputCellInfo;
        if (!cellInfo) {
            return null;
        }
        let value = cellInfo.Data;
        let ret = null;
        let clickHandler = function (e) { e.stopPropagation(); }
        let focusHandler = e => e.target.select && e.target.select();
        if (cellInfo.IsRefCell) {
            let options = cellInfo.RefItems.map(x => <option key={x.Code} value={x.Code}>{x.Text}</option>);
            ret = <select autoFocus defaultValue={value}
                className='grid-cell-edit-input'
                onClick={clickHandler}
                onKeyPress={this.onCellEditorKeyPress}
                onKeyDown={this.onCellEditorKeyDown}
                onBlur={this.onCellEditorBlur}
            >{options}</select>;
        } else {
            let dataType = cellInfo.DataType;
            if (dataType === 'text' && row.Height > 40) {
                dataType = 'textlines';
            }
            switch (dataType) {
                case 'textlines':
                    ret = <textarea autoFocus defaultValue={value}
                        className='grid-cell-edit-input'
                        onClick={clickHandler}
                        onFocus={focusHandler}
                        onKeyPress={this.onCellEditorKeyPress}
                        onKeyDown={this.onCellEditorKeyDown}
                        onBlur={this.onCellEditorBlur}
                    ></textarea>;
                    break;
                case 'text':
                    ret = <input type="text" autoFocus defaultValue={value}
                        className='grid-cell-edit-input'
                        onFocus={focusHandler}
                        onClick={clickHandler}
                        onKeyPress={this.onCellEditorKeyPress}
                        onKeyDown={this.onCellEditorKeyDown}
                        onBlur={this.onCellEditorBlur}
                    />;
                    break;
                case 'int':
                    ret = <input autoFocus type="number" step="1" defaultValue={value}
                        className='grid-cell-edit-input'
                        onFocus={focusHandler}
                        onClick={clickHandler}
                        onKeyPress={this.onCellEditorKeyPress}
                        onKeyDown={this.onCellEditorKeyDown}
                        onBlur={this.onCellEditorBlur}
                    />;
                    break;
                case 'number':
                    ret = <input autoFocus type="number" step="0.01" defaultValue={value}
                        className='grid-cell-edit-input'
                        onFocus={focusHandler}
                        onClick={clickHandler}
                        onKeyPress={this.onCellEditorKeyPress}
                        onKeyDown={this.onCellEditorKeyDown}
                        onBlur={this.onCellEditorBlur}
                    />;
                    break;
                case 'date':
                    ret = <input autoFocus type="date" defaultValue={value}
                        className='grid-cell-edit-input'
                        onClick={clickHandler}
                        onKeyPress={this.onCellEditorKeyPress}
                        onKeyDown={this.onCellEditorKeyDown}
                        onBlur={this.onCellEditorBlur}
                    />;
                    break;
            }
        }
        if (!ret) {
            return null;
        }
        return ret;
    }

    onCellEditorKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            let value = event.target.value;
            (async () => {
                if (await this.activeCellApplyInputValue(value)) {
                    this.setActiveCellInfo(null);
                }
            })().catch(console.error);
        }
    }

    onCellEditorKeyDown(event) {
        if (event.key === 'Tab') {
            let shiftKey = event.shiftKey;
            let value = event.target.value;
            event.preventDefault();
            (async () => {
                if (await this.activeCellApplyInputValue(value)) {
                    await this.activateNextCell(shiftKey);
                }
            })().catch(console.error);
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.setActiveCellInfo(null);
        }
    }

    async activeCellApplyInputValue(value) {
        let cellInfo = this.state.activeCellInfo;
        if (!cellInfo) {
            return false;
        }
        let { ri, ci } = cellInfo;
        let row = this.state.gridData.Rows[ri];
        let cell = row.Cells[ci];

        if (value === '') {
            let inputCellInfo = cellInfo.inputCellInfo;
            if (inputCellInfo && ['int', 'number'].includes(inputCellInfo.DataType)) {
                value = '0';
            }
        }

        return cell && await this.setCellValue(row, cell, value);
    }

    onCellEditorBlur(event) {
        this.setPendingCellInfo(null);
        try {
            event.target.focus();
        } catch (e) {
            console.log('onCellEditorBlur: Unable to refocus target, resetting active cell');
            this.setActiveCellInfo(null);
        }
        let value = event.target.value;
        (async () => {
            if (await this.activeCellApplyInputValue(value)) {
                this.setActiveCellInfo(this.state.pendingCellInfo);
            } else {
                console.log('onCellEditorBlur: Value rejected:', value);
            }
        })().catch(console.error);
    }

    async activateNextCell(reverse) {
        let cellInfo = this.state.activeCellInfo;
        if (!cellInfo) {
            return;
        }
        let delta = reverse ? -1 : 1;
        let rows = this.pendingState.gridData.Rows;
        for (let ri = cellInfo.ri || 0; 0 <= ri && ri < rows.length; ri += delta) {
            let row = rows[ri];
            for (let ci = cellInfo.ri === ri ? cellInfo.ci + delta : !reverse ? 0 : row.Cells.length - 1; 0 <= ci && ci < row.Cells.length; ci += delta) {
                let cell = row.Cells[ci];
                if (cell.Type !== 'InputCell') {
                    continue;
                }
                let inputCellInfo = await this._provider.getInputCellInfo(cell.CellId);
                if (!inputCellInfo) {
                    continue;
                }
                this.setActiveCellInfo({ cell, row, ri, ci, inputCellInfo })
                return;
            }
        }
    }

    renderCell(row, cell, ri, ci, isHeader) {
        let isReadonly = this.state.isReadonly || isHeader;
        let cellClass = cell.Style;
        if (cell.Type === 'InputCell') {
            cellClass += ' input-cell';
        }
        let fixedColumnsDelta = cell.i + (cell.ColSpan || 1) - this.state.gridData.FixedColumns;
        if (fixedColumnsDelta <= 0) {
            cellClass += ' fixed';
            if (fixedColumnsDelta === 0) {
                cellClass += ' sg-br';
            }
        }
        let highlightedCellId = this.state.highlightedCellId;
        if (highlightedCellId && cell.CellId === highlightedCellId) {
            cellClass += ' highlighted-cell';
        }
        let pastedCellIds = this.state.pastedCellIds;
        if (pastedCellIds && cell.CellId && pastedCellIds.has(cell.CellId)) {
            cellClass += ' pasted-cell';
        }
        let activeCellInfo = this.state.activeCellInfo;
        let isActive = !isReadonly && activeCellInfo && ri === activeCellInfo.ri && ci === activeCellInfo.ci;
        let content = !isActive ? cell.FormattedData : this.getCellEditor(activeCellInfo.inputCellInfo, row);
        let onClick = !isReadonly && cell.Type === 'InputCell' && !cell.ReadOnly ? async () => {
            let inputCellInfo = await this._provider.getInputCellInfo(cell.CellId);
            if (!inputCellInfo) {
                return;
            }
            let cellInfo = { cell, row, ri, ci, inputCellInfo };
            if (!this.state.activeCellInfo) {
                this.setActiveCellInfo(cellInfo);
            } else {
                this.setPendingCellInfo(cellInfo);
            }
        } : null;

        let title = null;
        if (cell.CellId && this.state.showErrors) {
            let cellErrors = this.state.errors.map.get(cell.CellId);
            if (cellErrors) {
                cellClass += ' has-error';
                title = cellErrors.join(';\n');
            }
        }

        let td = <td
            key={cell.i}
            data-ci={cell.i}
            rowSpan={cell.RowSpan}
            colSpan={cell.ColSpan}
            className={cellClass}
            onClick={onClick}
            title={title}
        >{content}</ td>;
        return td;
    }

    renderRowHeaderCell(row, renderRemoveMarkers) {
        let removable = renderRemoveMarkers;
        let className = !removable ? 'rhead fixed' : 'rhead fixed removable';
        let clickHandler = !removable ? null : async () => {
            let pageId = this.state.activePageId;
            let range = await this._provider.getRowsForRemove(pageId, row.i);
            if (!range) {
                alert(this.$t('Строка недоступна для удаления'));
                return;
            }
            this.setLocalState({
                removingRowsRange: range
            });
            await this.waitFor(1);
            let state = {
                removingRowsRange: null
            }
            if (confirm(this.$t('Подтвердите удаление выбранных строк. Связанные строки из других таблиц также будут удалены.'))) {
                let removed = await this._provider.removeGroupRows(pageId, row.i);
                if (removed) {
                    state.gridData = await this._provider.getGridData(pageId);
                    state.bookChangeIndex = await this._provider.getBookChangeIndex();
                }
            }
            this.setLocalState(state);
        }
        let content = !removable || row.Height < 10 ? null : <span className="fa fa-remove"></span>;
        let td = <td key={'-'} className={className} onClick={clickHandler}>{content}</td>;
        return td;
    }

    /**
     * @typedef {{cell: object, row: object, ri: number, ci:number, inputCellInfo: object}} SgCellInfo
     */

    /**
     * @param {SgCellInfo} cellInfo
     */
    setActiveCellInfo(cellInfo) {
        this.setLocalState({
            activeCellInfo: cellInfo,
            pendingCellInfo: null,
        });
    }

    setPendingCellInfo(cellInfo) {
        this.setLocalState({
            pendingCellInfo: cellInfo
        });
    }

    renderSpreadsheetGridPart(grid, isHeader) {
        let grows = isHeader ? grid.HeadRows : grid.Rows;
        let rows = [];
        let rrange = this.state.removingRowsRange;
        let isReadonly = this.props.isReadonly;

        let colsCount = 0;
        grows.forEach((r, ri) => {
            let curColsCount = 0;
            let tds = [this.renderRowHeaderCell(r, !isHeader && !isReadonly)];
            r.Cells.forEach((cell, ci) => {
                curColsCount += cell.ColSpan || 1;
                tds.push(this.renderCell(r, cell, ri, ci, isHeader));
            });
            if (!colsCount) {
                colsCount = curColsCount + 1;
                tds.push(<td key="lc" rowSpan={grows.length + 1} className="sg-tc"></td>);
            }
            let rowClass = null;
            if (r.IsDuplicable) {
                rowClass = 'duplicable';
            }
            if (rrange && rrange.from <= r.i && r.i <= rrange.to) {
                rowClass += ' removing';
            }

            rows.push(<tr key={r.i} height={r.Height} className={rowClass}>{tds}</tr>);
        });
        if (isHeader) {
            // first row for measurements
            let fixedColumns = this.state.gridData.FixedColumns || 0;
            let tds = [];
            tds.push(<td key="-" className="rhead fixed"></td>);
            grid.Columns.forEach(col => {
                let className = col.i === fixedColumns - 1 ? 'fixed sg-br' : col.i < fixedColumns ? 'fixed' : null;
                tds.push(<td key={col.i} data-ci={col.i} className={className}></td>);
            });
            tds.push(<td key="lc" className="sg-tc"></td>);

            rows.unshift(<tr key="fr" height="3px">{tds}</tr>);
        }
        rows.push(<tr key="lr"><td key="lrc" colSpan={colsCount} className="sg-tr"></td></tr>);

        return rows;
    }

    renderGridHeader(activePageId) {
        let navMode = this.props.navMode;

        let bookInfo = this.state.bookInfo;
        let grids = bookInfo.Grids;

        let dropdown = null;
        let navTabs = null;

        if (navMode === 'tabs') {
            let filterPages = this.state.filterCategoryPages;
            let activeCategory = !filterPages ? '[ALL]' : (grids.filter(grid => grid.Id == activePageId)[0] || grids[0] || {}).Category || '';
            let categoryGrids = !filterPages ? grids : grids.filter(grid => (grid.Category || '') === activeCategory);
            let navItems = [];
            for (let grid of categoryGrids) {
                let className = 'nav-link';
                if (activePageId === grid.Id) {
                    className += ' active';
                }
                let navItem = <li className="nav-item" key={grid.Id}>
                    <span className={className} onClick={() => this.onPageChange(grid.Id)}>{grid.Id}</span>
                </li>
                navItems.push(navItem);
            }

            navTabs = <tr>
                <td colSpan="10" className="sg-nav-tabs">
                    <ul className="nav nav-tabs">
                        {navItems}
                    </ul>
                </td>
            </tr>

            let categories = new Map();
            grids.forEach(grid => {
                let category = grid.Category || '';
                if (!categories.has(category)) {
                    categories.set(category, {
                        name: category,
                        title: category || this.$t('Прочее'),
                        onClick: () => {
                            this.setLocalState({ filterCategoryPages: true });
                            this.onPageChange(grid.Id);
                        }
                    });
                }
            });
            if (categories.has('') && categories.size === 1) {
                categories.clear();
            } else {
                categories.set('[ALL]', {
                    name: '[ALL]',
                    title: this.$t('[ Показать все ]'),
                    onClick: () => this.setLocalState({ filterCategoryPages: false })
                })
            }
            let menuItems = [];
            let othersItem = null;
            for (let category of categories.values()) {
                let className = 'dropdown-item';
                if (activeCategory === category.name) {
                    className += ' selected';
                }
                let menuItem = <div key={category.name || '-'} className={className} onClick={category.onClick}>
                    <span className="page-text ml-2">{category.title}</span>
                </div>
                if (!category.name) {
                    othersItem = menuItem;
                } else {
                    menuItems.push(menuItem)
                }
            }
            if (othersItem) {
                menuItems.push(othersItem);
            }
            if (menuItems.length) {
                dropdown =
                    <div className="btn-group">
                        <button type="button" className="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            {this.$t('Разделы')}
                        </button>
                        <div className="dropdown-menu pages">
                            {menuItems}
                        </div>
                    </div>
            }
        } else {
            let menuItems = [];
            let category = '';
            for (let grid of grids) {
                let curCategory = grid.Category || '';
                if (category !== curCategory) {
                    category = curCategory;
                    menuItems.push(<h6 key={grid.Id + '-cat'} className="dropdown-header pl-3">{curCategory || this.$t('Прочее')}</h6>);
                }
                let className = 'dropdown-item';
                if (activePageId === grid.Id) {
                    className += ' selected';
                }
                let menuItem =
                    <div key={grid.Id} className={className} onClick={() => this.onPageChange(grid.Id)}>
                        <span className="page-id">{grid.Id}</span><span className="page-text ml-2">{grid.Description}</span>
                    </div>
                menuItems.push(menuItem);
            }

            dropdown =
                <div className="btn-group">
                    <button type="button" className="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        {activePageId}
                    </button>
                    <div className="dropdown-menu pages">
                        {menuItems}
                    </div>
                </div>
        }

        let activeGrid = grids.filter(x => x.Id === activePageId)[0];
        let tdUnit = !activeGrid.DefaultUnit ? null : <td className="page-unit fit-width">{activeGrid.DefaultUnit}</td>;

        let errorsCount = this.state.errors.list.length;
        let tdErrorsClass = 'book-errors fit-width';
        if (this.state.showErrors) {
            tdErrorsClass += ' active';
        }
        let tdErrors = !errorsCount ? null : <td className={tdErrorsClass} onClick={this.toggleShowErrors}>
            {this.$t('Ошибки:')} <span className="badge badge-danger">{errorsCount}</span>
        </td>

        let showSaveButton = this.props.bookSaveUrl && !this.props.isReadonly && this.props.showSaveButton;
        let tdBtnSave = !showSaveButton ? null : <td className="fit-width">
            <div className="btn btn-success" onClick={() => this.onBookSave()}>
                {this.$t('Сохранить')}
            </div>
        </td>

        let showFullscreenButton = this.props.showFullscreen && this.props.containerElement;
        let tdBtnFullscreen = !showFullscreenButton ? null : <td className="fit-width">
            <div className="btn btn-info" onClick={() => this.toggleFullscreen()} title={this.$t('Полноэкранный режим')}>
                <span className="fa fa-arrows-alt"></span>
            </div>
        </td>

        let langCode = bookInfo.CurLangCode;
        let langText = '';
        let langMenuItems = [];
        for (let lang of bookInfo.Languages) {
            let className = 'dropdown-item';
            if (langCode === lang.Code) {
                className += ' selected';
                langText = lang.Value;
            }
            let menuItem =
                <div key={lang.Code} className={className} onClick={() => this.onLanguageChange(lang.Code)}>
                    <span className="lang-text">{lang.Value}</span>
                </div>
            langMenuItems.push(menuItem);
        }
        let tdLangs = !langMenuItems.length || this.state.isReadonly ? null : <td className="fit-width">
            <div className="btn-group">
                <button type="button" className="btn btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {langText}
                </button>
                <div className="dropdown-menu dropdown-menu-right langs">
                    {langMenuItems}
                </div>
            </div>
        </td>

        let tdDropdown = null;
        if (dropdown) {
            tdDropdown = <td className="fit-width">{dropdown}</td>
        }

        let header =
            <div className="grid-header">
                <table>
                    <tbody>
                        <tr className="sg-nav-header">
                            {tdDropdown}
                            <td className="page-title">{activeGrid.Description}</td>
                            {tdUnit}
                            {tdErrors}
                            {tdLangs}
                            {tdBtnFullscreen}
                            {tdBtnSave}
                        </tr>
                        {navTabs}
                    </tbody>
                </table>
            </div>
        return header;
    }

    async gotoErrorCell(cellInfo) {
        let cellId = cellInfo.CellId;
        let gridId = cellInfo.GridId;

        if (gridId !== this.state.activePageId) {
            let bookInfo = this.state.bookInfo;
            if (!bookInfo.Grids.map(x => x.Id).includes(gridId)) {
                return;
            }
            await this.onPageChange(gridId);
        }
        this.setLocalState({
            highlightedCellId: cellId
        });
        await this.waitFor(10);
        let el = document.querySelector('td.highlighted-cell');
        el && el.scrollIntoView({ block: 'center', inline: 'center' });

        await this.waitFor(1000);
        this.setLocalState({
            highlightedCellId: null
        });
    }

    renderBookErrorList() {
        let errors = this.state.errors.list;
        if (!errors.length || !this.state.showErrors) {
            return null;
        }

        let errorItems = errors.map((error, index) => {
            let cellLinks = error.Cells.map((cell, i) => <span
                key={`${index}-${i}`}
                className="btn btn-sm btn-link"
                onClick={() => this.gotoErrorCell(cell)}
            >{i + 1}</span>);
            return <div className="grid-error-item" key={index}>
                <span className="error-number">{index + 1}</span> <span className="error-title">{error.Message}</span> {cellLinks}
            </div>
        })

        let ret =
            <div className="grid-errors">
                {errorItems}
            </div>
        return ret;
    }

    onBodyClick() {
        if (this.state.pastedCellIds) {
            this.setLocalState({
                pastedCellIds: null
            })
        }
    }

    onPaste(e) {
        let data = e.clipboardData.getData('text/plain');
        let activeCellInfo = this.state.activeCellInfo;
        if (!activeCellInfo || !data) {
            return;
        }
        if (!data.includes('\n') && !data.includes('\t')) {
            return;
        }
        data = data.replace(/\r/g, '');
        e.preventDefault();
        let { row, cell } = activeCellInfo;
        let rows = data.split('\n');
        if (!rows[rows.length - 1]) {
            rows.pop();
        }
        rows = rows.map(row => row.split('\t'));
        this.setActiveCellInfo(null);
        this.setCellValuesBlock(row.i, cell.i, rows).catch(console.error);
    }

    render() {
        let activePageId = this.state.activePageId;
        const grid = this.state.gridData;
        let savingDiv = !this.state.saving ? null : <div className="grid-saving">
            <div className="msg-background"></div>
            <div className="msg-panel">{this.$t('Сохранение данных...')}</div>
        </div>

        var columns = grid.Columns;
        var tableWidth = 0;
        columns.map(x => tableWidth += x.Width || 50);
        return (<div className="sg-editor-body">
            {savingDiv}
            {this.renderBookErrorList()}
            {this.renderGridHeader(activePageId)}
            <div className="sg-table-wrapper">
                <table className="sg-table" key={activePageId} width={tableWidth} >
                    {this.renderSpreadsheetColGroup(grid)}
                    <thead>
                        {this.renderSpreadsheetGridPart(grid, true)}
                    </thead>
                    <tbody onPaste={this.onPaste} onClick={this.onBodyClick}>
                        {this.renderSpreadsheetGridPart(grid, false)}
                    </tbody>
                </table>
            </div>
        </div>);
    }

    // supporting fixed columns and rows
    refreshStickyCells() {
        let container = this.props.containerElement;
        if (!container) {
            return;
        }
        let table = container.querySelector('table.sg-table');
        if (!table) {
            return;
        }
        let top = 0;
        for (let r of table.tHead.rows) {
            for (let cell of r.cells) {
                cell.style.top = `${top}px`;
            }
            top += $(r).outerHeight();
        }

        // detect cell positions first
        let colLefts = {};
        let zrow = table.rows[0];
        let zleft = 0;
        for (let cell of zrow.cells) {
            colLefts[cell.dataset.ci] = zleft;
            zleft += $(cell).outerWidth();
        }
        // then apply to column cells
        for (let r of table.rows) {
            for (let cell of r.cells) {
                if (!cell.classList.contains('fixed')) {
                    break;
                }
                let ci = cell.dataset.ci;
                cell.style.left = `${ci && colLefts[ci] || 0}px`;
            }
        }
    }

    componentDidMount() {
        this.refreshStickyCells();
    }

    componentDidUpdate() {
        this.refreshStickyCells();
    }
}

function waitForMonoGetReady() {
    return new Promise((resolve) => {
        // hook App.init to avoid 'require' loading
        if (MONO.mono_wasm_runtime_is_ready) {
            resolve();
        } else {
            let init = window.App.init;
            window.App.init = function () {
                init.apply(this, arguments);
                resolve();
            }
        }
    });
}

const bookContentTypes = {
    xmlBook: 'xml-book',
    viewModel: 'view-model'
}

function getUnpackedData(data) {
    // try to ungzip data with non-regular structure
    if (typeof data === 'string' && !['<', '{', '['].includes(data[0])) {
        data = pako.ungzip(atob(data), { 'to': 'string' });
    }
    return data;
}

$(document).ready(function () {
    $(".sg-editor").each(async function () {
        let $this = $(this);
        let $t = window.T || (t => t);
        try {
            let bookLoadUrl = $this.attr('book-load-url') || $this.attr('book-url');
            let bookSaveUrl = $this.attr('book-save-url');
            let bookSaveFormat = $this.attr('book-save-format') || 'gzip';
            let langCode = $this.attr('lang-code');
            let showErrors = ($this.attr('show-errors') || 'false').toLowerCase() === 'true';
            let navMode = $this.attr('nav-mode');
            let isReadonly = ($this.attr('is-readonly') || 'false').toLowerCase() === 'true';
            let showSaveButton = ($this.attr('show-save-button') || 'true').toLowerCase() === 'true';
            let showFullscreen = ($this.attr('show-fullscreen') || 'true').toLowerCase() === 'true';
            let bookErrors = $this.attr('book-errors');
            let bookContent = $this.attr('book-content');
            let bookContentType = $this.attr('book-content-type');

            if (!bookLoadUrl && !bookContent) {
                throw new Error('Either "book-load-url" or "book-content" should be specified');
            }

            bookErrors = bookErrors && JSON.parse(getUnpackedData(bookErrors));
            bookContent = getUnpackedData(bookContent);

            if (bookContent && !bookContentType) {
                // try auto-detect content type from content
                bookContentType = bookContent[0] === '<' ? bookContentTypes.xmlBook : bookContentTypes.viewModel;
            }
            // remove large text blocks from html markup
            $this.removeAttr('book-errors');
            $this.removeAttr('book-content');

            let bookData = {
                Content: bookContent,
                ContentType: bookContentType,
                BookErrors: bookErrors
            };

            if (!bookData.Content) {
                await new Promise((resolve, reject) => {
                    $.ajax({ url: bookLoadUrl, dataType: 'text' }).done(data => {
                        try {
                            data = getUnpackedData(data);
                            if (data.startsWith('{')) {
                                let serverBookData = JSON.parse(data);
                                bookData.Content = serverBookData.Content;
                                bookData.ContentType = serverBookData.ContentType;
                                bookData.BookErrors = serverBookData.BookErrors || bookData.BookErrors;
                            } else {
                                bookData.Content = data;
                                bookData.ContentType = bookContentTypes.xmlBook;
                            }
                            bookData.Content = getUnpackedData(bookData.Content);
                            resolve(bookData);
                        } catch (e) {
                            reject(e);
                        }
                    }).fail(reject);
                });
            }

            let provider = null;
            let bookInfo = null;
            if (bookData.ContentType === bookContentTypes.xmlBook) {
                await waitForMonoGetReady();
                provider = new BookDataProviderWasm();
                bookInfo = await provider.loadBook({
                    xmlContent: bookData.Content,
                    langCode: langCode
                });
            } else if (bookData.ContentType === bookContentTypes.viewModel) {
                provider = new BookDataProviderView();
                bookInfo = await provider.loadBook(bookData.Content);
                isReadonly = true;
            } else {
                throw new Error('Unknown book content type: ' + bookData.ContentType);
            }

            let pageId = bookInfo.Grids[0].Id;
            let gridData = await provider.getGridData(pageId);

            let api = {};
            ReactDOM.render(<SpreadsheetBook
                bookInfo={bookInfo}
                bookSaveUrl={bookSaveUrl}
                bookSaveFormat={bookSaveFormat}
                bookErrors={bookData.BookErrors}
                showErrors={showErrors}
                showSaveButton={showSaveButton}
                showFullscreen={showFullscreen}
                isReadonly={isReadonly}
                eventEmitter={this}
                containerElement={this}
                provider={provider}
                exposeApi={api}
                navMode={navMode}
                translateFunc={$t}
                gridData={gridData}
            />, this);
            $this.data('api', api);
        } catch (e) {
            console.error('sg-editor: Unable to load book:', e);
            $this.html(`<div class="alert alert-danger" role="alert">${$t('Ошибка при загрузке таблиц')}</div>`);
        }
    });
});

/* ------- Book Data Providers ------- */

function addGridDataCellById(gridData) {
    gridData.CellById = {};
    for (let rs of [gridData.HeadRows, gridData.Rows]) {
        for (let r of rs) {
            for (let c of r.Cells) {
                if (c.CellId) {
                    gridData.CellById[c.CellId] = c;
                }
            }
        }
    }
    return gridData;
}

function chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size);
    }
    return chunks;
}

class BookDataProviderBase {
    async loadBook(args) {
        return null;
    }
    async getBookInfo() {
        return null;
    }

    async getGridData(pageId) {
        return null;
    }

    async getRowsForRemove(pageId, rowIndex) {
        return null;
    }

    async removeGroupRows(pageId, rowIndex) {
        return null;
    }

    async getBookXml() {
        return null;
    }

    async setLanguage(langCode) {
        return null;
    }

    async getBookChangeIndex() {
        return null;
    }

    async resetBookChangeIndex() {
        return null;
    }

    async getInputCellInfo(cellId) {
        return null;
    }

    async setInputCellValue(cellId, value) {
        return null;
    }

    async setInputCellValuesBlock(pageId, rowStart, colStart, valsJson) {
        return null;
    }
}

class BookDataProviderView extends BookDataProviderBase {
    async loadBook(viewModel) {
        if (typeof viewModel === 'string') {
            viewModel = JSON.parse(viewModel);
        }
        viewModel.GridData.forEach(addGridDataCellById);
        this._viewModel = viewModel;
        return await this.getBookInfo();
    }

    async getBookInfo() {
        return this._viewModel.BookInfo;
    }

    async getGridData(pageId) {
        return this._viewModel.GridData.filter(x => x.Id === pageId)[0];
    }

    async getRowsForRemove(pageId, rowIndex) {
        return false;
    }

    async removeGroupRows(pageId, rowIndex) {
        return false;
    }

    async getBookXml() {
        throw Error('Not implemented');
    }

    async setLanguage(langCode) {
        return await this.getBookInfo();
    }

    async getBookChangeIndex() {
        return 0;
    }

    async resetBookChangeIndex() {
        return 0;
    }

    async getInputCellInfo(cellId) {
        return false;
    }

    async setInputCellValue(cellId, value) {
        return false;
    }

    async setInputCellValuesBlock(pageId, rowStart, colStart, valsJson) {
        return false;
    }
}

class BookDataProviderWasm extends BookDataProviderBase {
    /**
     * @param {{
     *  xmlContent: string,
     *  langCode: string
     * }} args
     */
    async loadBook(args) {
        let { xmlContent, langCode } = args;
        const MAX_CONTENT_LENGTH = 1000000;

        let contentParts = chunkSubstr(xmlContent, MAX_CONTENT_LENGTH);
        for (let part of contentParts) {
            this._gridInvoke("AppendContent", [part])
        }
        let bookInfo = this._gridloadBook('content');
        if (langCode && bookInfo.CurLangCode !== langCode) {
            bookInfo = await this.setLanguage(langCode);
        }
        await this.resetBookChangeIndex();
        return bookInfo;
    }

    /**
     * @param {string} method
     * @param {any} args
     * @param {boolean} rawResult
     * @private
     */
    _gridInvoke(method, args, rawResult) {
        console.time(method);
        let json = Module.mono_call_static_method("[SpreadsheetWasm] SpreadsheetWasm.GridCalculator:" + method, args);
        let ret = undefined;
        if (rawResult) {
            ret = json;
        } else if (json !== undefined) {
            ret = JSON.parse(json);
        }
        console.timeEnd(method);
        return ret;
    }

    _gridloadBook(content) {
        return this._gridInvoke('LoadBook', [content]);
    }

    async getBookInfo() {
        return this._gridInvoke('GetBookInfo', []);
    }

    async getGridData(pageId) {
        let ret = this._gridInvoke("GetGridData", [pageId]);
        return addGridDataCellById(ret)
    }

    async getRowsForRemove(pageId, rowIndex) {
        return this._gridInvoke('GetRowsForRemove', [pageId, rowIndex]);
    }

    async removeGroupRows(pageId, rowIndex) {
        return this._gridInvoke('RemoveGroupRows', [pageId, rowIndex]);
    }

    async getBookXml() {
        return this._gridInvoke('GetBookXml', [], true);
    }

    async setLanguage(langCode) {
        return this._gridInvoke('SetLanguage', [langCode]);
    }

    async getBookChangeIndex() {
        return this._gridInvoke('GetBookChangeIndex', []);
    }

    async resetBookChangeIndex() {
        return this._gridInvoke('ResetBookChangeIndex', []);
    }

    async getInputCellInfo(cellId) {
        return this._gridInvoke('GetInputCellInfo', [cellId]);
    }

    async setInputCellValue(cellId, value) {
        return this._gridInvoke('SetInputCellValue', [cellId, value]);
    }

    async setInputCellValuesBlock(pageId, rowStart, colStart, valsJson) {
        return this._gridInvoke('SetInputCellValuesBlock', [pageId, rowStart, colStart, valsJson]);
    }

    async getBookViewModel() {
        return this._gridInvoke('GetBookViewModel', []);
    }
}

class BookDataProviderServer extends BookDataProviderBase {
    async loadBook(args) {

    }

    async getBookInfo() {

    }

    async getGridData(pageId) {

    }

    async getRowsForRemove(pageId, rowIndex) {

    }

    async removeGroupRows(pageId, rowIndex) {

    }

    async getBookXml() {

    }

    async setLanguage(langCode) {

    }

    async getBookChangeIndex() {
        return 0;
    }

    async resetBookChangeIndex() {
    }

    async getInputCellInfo(cellId) {

    }

    async setInputCellValue(cellId, value) {

    }

    async setInputCellValuesBlock(pageId, rowStart, colStart, valsJson) {

    }
}