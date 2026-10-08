import _regeneratorRuntime from 'babel-runtime/regenerator';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable */

var SpreadsheetBook = function (_React$Component) {
    _inherits(SpreadsheetBook, _React$Component);

    function SpreadsheetBook(props) {
        var _this2 = this;

        _classCallCheck(this, SpreadsheetBook);

        /** @type {BookDataProviderBase} */
        var _this = _possibleConstructorReturn(this, (SpreadsheetBook.__proto__ || Object.getPrototypeOf(SpreadsheetBook)).call(this, props));

        _this._provider = _this.props.provider;
        var bookInfo = _this.props.bookInfo;
        var gridData = _this.props.gridData;
        var pageId = gridData ? gridData.Id : null;
        _this.state = {
            bookInfo: bookInfo,
            activePageId: pageId,
            gridData: gridData,
            activeCellInfo: null,
            pendingCellInfo: null,
            saving: false,
            bookChangeIndex: 0,
            highlightedCellId: null,
            errors: _this.getErrorsData(_this.props.bookErrors),
            showErrors: !!_this.props.showErrors,
            isReadonly: !!_this.props.isReadonly,
            pastedCellIds: null,
            filterCategoryPages: true
        };
        _this.pendingState = Object.assign({}, _this.state);
        _this.onPageChange = _this.onPageChange.bind(_this);
        _this.onLanguageChange = _this.onLanguageChange.bind(_this);
        _this.onCellEditorKeyPress = _this.onCellEditorKeyPress.bind(_this);
        _this.onCellEditorKeyDown = _this.onCellEditorKeyDown.bind(_this);
        _this.onCellEditorBlur = _this.onCellEditorBlur.bind(_this);
        _this.activateNextCell = _this.activateNextCell.bind(_this);
        _this.setLocalState = _this.setLocalState.bind(_this);
        _this.onBookSave = _this.onBookSave.bind(_this);
        _this.gotoErrorCell = _this.gotoErrorCell.bind(_this);
        _this.getErrorsData = _this.getErrorsData.bind(_this);
        _this.toggleShowErrors = _this.toggleShowErrors.bind(_this);
        _this.toggleFullscreen = _this.toggleFullscreen.bind(_this);
        _this.onWindowClose = _this.onWindowClose.bind(_this);
        _this.onPaste = _this.onPaste.bind(_this);
        _this.onBodyClick = _this.onBodyClick.bind(_this);
        _this.emit = _this.emit.bind(_this);
        _this.refreshStickyCells = _this.refreshStickyCells.bind(_this);

        _this.$t = _this.props.translateFunc || function (t) {
            return t;
        };
        window.addEventListener('beforeunload', _this.onWindowClose);

        var exposeApi = _this.props.exposeApi;
        if (exposeApi) {
            Object.assign(exposeApi, {
                saveBook: function () {
                    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
                        return _regeneratorRuntime.wrap(function _callee$(_context) {
                            while (1) {
                                switch (_context.prev = _context.next) {
                                    case 0:
                                        _context.next = 2;
                                        return _this.onBookSave();

                                    case 2:
                                        return _context.abrupt('return', _context.sent);

                                    case 3:
                                    case 'end':
                                        return _context.stop();
                                }
                            }
                        }, _callee, _this2);
                    }));

                    function saveBook() {
                        return _ref.apply(this, arguments);
                    }

                    return saveBook;
                }()
            });
        }

        _this.emit('sg-book-loaded', { PageId: pageId, LangCode: bookInfo.CurLangCode });
        return _this;
    }

    /**
     * @param {'sg-book-loaded'|'sg-page-changed'|'sg-lang-changed'|'sg-book-saved'} eventType
     * @param {any} [eventArgs]
     */


    _createClass(SpreadsheetBook, [{
        key: 'emit',
        value: function emit(eventType, eventArgs) {
            var emitter = this.props.eventEmitter;
            if (!emitter) {
                return;
            }
            $(emitter).trigger({
                type: eventType,
                args: eventArgs
            });
        }
    }, {
        key: 'getErrorsData',
        value: function getErrorsData(errors) {
            errors = errors || [];
            var map = new Map();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = errors[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var error = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = error.Cells[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var cell = _step2.value;

                            if (!map.has(cell.CellId)) {
                                map.set(cell.CellId, []);
                            }
                            map.get(cell.CellId).push(error.Message);
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return {
                map: map,
                list: errors
            };
        }
    }, {
        key: 'toggleShowErrors',
        value: function toggleShowErrors() {
            this.setLocalState({
                showErrors: !this.state.showErrors
            });
        }
    }, {
        key: 'toggleFullscreen',
        value: function toggleFullscreen() {
            var element = this.props.containerElement;
            if (!element) {
                return;
            }
            var fsElements = ['fullscreenElement', 'mozFullScreenElement', 'webkitFullscreenElement', 'msFullscreenElement'];
            var fsRequestFunc = ['requestFullscreen', 'msRequestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen'].map(function (x) {
                return element[x];
            }).filter(function (x) {
                return typeof x === 'function';
            })[0];
            var fsExitFunc = ['exitFullscreen', 'msExitFullscreen', 'mozCancelFullScreen', 'webkitExitFullscreen'].map(function (x) {
                return document[x];
            }).filter(function (x) {
                return typeof x === 'function';
            })[0];
            if (!fsElements.some(function (prop) {
                return document[prop];
            })) {
                fsRequestFunc && fsRequestFunc.apply(element);
            } else {
                fsExitFunc && fsExitFunc.apply(document);
            }
        }
    }, {
        key: 'onWindowClose',
        value: function onWindowClose(event) {
            var changeIndex = this.state.bookChangeIndex;
            if (changeIndex === 0) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        }
    }, {
        key: 'setLocalState',
        value: function setLocalState(state) {
            this.setState(state);
            Object.assign(this.pendingState, state);
        }
    }, {
        key: 'onPageChange',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(pageId) {
                var gridData;
                return _regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this._provider.getGridData(pageId);

                            case 2:
                                gridData = _context2.sent;

                                this.setLocalState({
                                    activePageId: pageId,
                                    gridData: gridData,
                                    activeCellInfo: null,
                                    removingRowsRange: null
                                });
                                this.emit('sg-page-changed', { PageId: pageId });

                            case 5:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function onPageChange(_x) {
                return _ref2.apply(this, arguments);
            }

            return onPageChange;
        }()
    }, {
        key: 'onLanguageChange',
        value: function () {
            var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(langCode) {
                var pageId, bookInfo, gridData;
                return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                pageId = this.state.activePageId;
                                _context3.next = 3;
                                return this._provider.setLanguage(langCode);

                            case 3:
                                bookInfo = _context3.sent;
                                _context3.next = 6;
                                return this._provider.getGridData(pageId);

                            case 6:
                                gridData = _context3.sent;

                                this.setLocalState({
                                    bookInfo: bookInfo,
                                    gridData: gridData
                                });
                                this.emit('sg-lang-changed', { LangCode: langCode });

                            case 9:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));

            function onLanguageChange(_x2) {
                return _ref3.apply(this, arguments);
            }

            return onLanguageChange;
        }()
    }, {
        key: 'waitFor',
        value: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(ms) {
                return _regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                _context4.next = 2;
                                return new Promise(function (resolve) {
                                    return setTimeout(resolve, ms);
                                });

                            case 2:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            }));

            function waitFor(_x3) {
                return _ref4.apply(this, arguments);
            }

            return waitFor;
        }()
    }, {
        key: 'onBookSave',
        value: function () {
            var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
                var _this3 = this;

                var bookContent, changeIndex;
                return _regeneratorRuntime.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                _context6.next = 2;
                                return this._provider.getBookChangeIndex();

                            case 2:
                                _context6.t0 = _context6.sent;

                                if (!(_context6.t0 === 0)) {
                                    _context6.next = 5;
                                    break;
                                }

                                return _context6.abrupt('return');

                            case 5:
                                this.setLocalState({ saving: true });
                                _context6.next = 8;
                                return this.waitFor(1);

                            case 8:
                                _context6.prev = 8;
                                _context6.next = 11;
                                return this._provider.getBookXml();

                            case 11:
                                bookContent = _context6.sent;
                                _context6.next = 14;
                                return this._provider.getBookChangeIndex();

                            case 14:
                                changeIndex = _context6.sent;

                                if (this.props.bookSaveFormat === 'gzip') {
                                    bookContent = btoa(pako.gzip(bookContent, { to: 'string' }));
                                }
                                $.ajax({
                                    url: this.props.bookSaveUrl,
                                    method: 'POST',
                                    data: bookContent,
                                    contentType: 'application/octet-stream'
                                }).done(function (data) {
                                    _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5() {
                                        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
                                            while (1) {
                                                switch (_context5.prev = _context5.next) {
                                                    case 0:
                                                        _context5.t0 = changeIndex;
                                                        _context5.next = 3;
                                                        return _this3._provider.getBookChangeIndex();

                                                    case 3:
                                                        _context5.t1 = _context5.sent;

                                                        if (!(_context5.t0 === _context5.t1)) {
                                                            _context5.next = 8;
                                                            break;
                                                        }

                                                        _context5.next = 7;
                                                        return _this3._provider.resetBookChangeIndex();

                                                    case 7:
                                                        _this3.setLocalState({
                                                            bookChangeIndex: 0
                                                        });

                                                    case 8:
                                                    case 'end':
                                                        return _context5.stop();
                                                }
                                            }
                                        }, _callee5, _this3);
                                    }))().catch(console.error);

                                    _this3.emit('sg-book-saved');
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
                                        _this3.setLocalState({
                                            errors: _this3.getErrorsData(data.BookErrors)
                                        });
                                    } catch (e) {
                                        console.warn('Unable to parse & process server response:', e);
                                    }
                                }).fail(function () {
                                    alert(_this3.$t('Не удалось сохранить данные'));
                                }).always(function () {
                                    _this3.setLocalState({ saving: false });
                                });
                                _context6.next = 23;
                                break;

                            case 19:
                                _context6.prev = 19;
                                _context6.t1 = _context6['catch'](8);

                                this.setLocalState({ saving: false });
                                alert(this.$t('Не удалось сохранить данные'));

                            case 23:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this, [[8, 19]]);
            }));

            function onBookSave() {
                return _ref5.apply(this, arguments);
            }

            return onBookSave;
        }()
    }, {
        key: 'omitDefVal',
        value: function omitDefVal(val, defVal) {
            if (val === defVal) {
                return undefined;
            }
            return val;
        }
    }, {
        key: 'renderSpreadsheetColGroup',
        value: function renderSpreadsheetColGroup(g) {
            var cols = [React.createElement('col', { key: '-', span: '1', className: 'col-rhead' })];
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = g.Columns[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var col = _step3.value;

                    var attr = col.IsStretchMarker ? 'min-width' : 'width';
                    cols.push(React.createElement('col', { key: col.i, span: '1', style: _defineProperty({}, attr, col.Width) }));
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            return React.createElement(
                'colgroup',
                null,
                cols
            );
        }
    }, {
        key: 'setCellValue',
        value: function () {
            var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee7(r, cell, value) {
                var ret, bookChangeIndex, pageId, gridData;
                return _regeneratorRuntime.wrap(function _callee7$(_context7) {
                    while (1) {
                        switch (_context7.prev = _context7.next) {
                            case 0:
                                if (!(cell.Type !== 'InputCell' || cell.Readonly)) {
                                    _context7.next = 2;
                                    break;
                                }

                                return _context7.abrupt('return', false);

                            case 2:
                                if (!(value === undefined)) {
                                    _context7.next = 5;
                                    break;
                                }

                                console.warn('setCellValue: Attempt to set undefined value');
                                return _context7.abrupt('return', false);

                            case 5:
                                if (typeof value !== 'string') {
                                    value = '';
                                }
                                _context7.next = 8;
                                return this._provider.setInputCellValue(cell.CellId, value);

                            case 8:
                                ret = _context7.sent;

                                if (ret) {
                                    _context7.next = 11;
                                    break;
                                }

                                return _context7.abrupt('return', false);

                            case 11:
                                _context7.next = 13;
                                return this._provider.getBookChangeIndex();

                            case 13:
                                bookChangeIndex = _context7.sent;
                                pageId = this.state.activePageId;
                                gridData = this.state.gridData;

                                if (!r.IsDuplicable) {
                                    _context7.next = 22;
                                    break;
                                }

                                _context7.next = 19;
                                return this._provider.getGridData(pageId);

                            case 19:
                                gridData = _context7.sent;
                                _context7.next = 23;
                                break;

                            case 22:
                                ret.forEach(function (x) {
                                    var cell = gridData.CellById[x.CellId];
                                    if (cell) {
                                        cell.FormattedData = x.FormattedData;
                                    }
                                });

                            case 23:
                                this.setLocalState({
                                    gridData: gridData,
                                    bookChangeIndex: bookChangeIndex
                                });
                                return _context7.abrupt('return', true);

                            case 25:
                            case 'end':
                                return _context7.stop();
                        }
                    }
                }, _callee7, this);
            }));

            function setCellValue(_x4, _x5, _x6) {
                return _ref8.apply(this, arguments);
            }

            return setCellValue;
        }()
    }, {
        key: 'setCellValuesBlock',
        value: function () {
            var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee8(riStart, ciStart, vrows) {
                var ret, bookChangeIndex, gridData, pastedCellIds;
                return _regeneratorRuntime.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                _context8.next = 2;
                                return this._provider.setInputCellValuesBlock(this.state.activePageId, riStart, ciStart, JSON.stringify(vrows));

                            case 2:
                                ret = _context8.sent;

                                if (ret) {
                                    _context8.next = 5;
                                    break;
                                }

                                return _context8.abrupt('return', false);

                            case 5:
                                _context8.next = 7;
                                return this._provider.getBookChangeIndex();

                            case 7:
                                bookChangeIndex = _context8.sent;
                                gridData = this.state.gridData;

                                ret.ChangedCells.forEach(function (x) {
                                    var cell = gridData.CellById[x.CellId];
                                    if (cell) {
                                        cell.FormattedData = x.FormattedData;
                                    }
                                });
                                pastedCellIds = new Set(ret.AppliedCellIds);

                                this.setLocalState({
                                    pastedCellIds: pastedCellIds,
                                    gridData: gridData,
                                    bookChangeIndex: bookChangeIndex
                                });
                                return _context8.abrupt('return', true);

                            case 13:
                            case 'end':
                                return _context8.stop();
                        }
                    }
                }, _callee8, this);
            }));

            function setCellValuesBlock(_x7, _x8, _x9) {
                return _ref9.apply(this, arguments);
            }

            return setCellValuesBlock;
        }()
    }, {
        key: 'getCellEditor',
        value: function getCellEditor(inputCellInfo, row) {
            var cellInfo = inputCellInfo;
            if (!cellInfo) {
                return null;
            }
            var value = cellInfo.Data;
            var ret = null;
            var clickHandler = function clickHandler(e) {
                e.stopPropagation();
            };
            var focusHandler = function focusHandler(e) {
                return e.target.select && e.target.select();
            };
            if (cellInfo.IsRefCell) {
                var options = cellInfo.RefItems.map(function (x) {
                    return React.createElement(
                        'option',
                        { key: x.Code, value: x.Code },
                        x.Text
                    );
                });
                ret = React.createElement(
                    'select',
                    { autoFocus: true, defaultValue: value,
                        className: 'grid-cell-edit-input',
                        onClick: clickHandler,
                        onKeyPress: this.onCellEditorKeyPress,
                        onKeyDown: this.onCellEditorKeyDown,
                        onBlur: this.onCellEditorBlur
                    },
                    options
                );
            } else {
                var dataType = cellInfo.DataType;
                if (dataType === 'text' && row.Height > 40) {
                    dataType = 'textlines';
                }
                switch (dataType) {
                    case 'textlines':
                        ret = React.createElement('textarea', { autoFocus: true, defaultValue: value,
                            className: 'grid-cell-edit-input',
                            onClick: clickHandler,
                            onFocus: focusHandler,
                            onKeyPress: this.onCellEditorKeyPress,
                            onKeyDown: this.onCellEditorKeyDown,
                            onBlur: this.onCellEditorBlur
                        });
                        break;
                    case 'text':
                        ret = React.createElement('input', { type: 'text', autoFocus: true, defaultValue: value,
                            className: 'grid-cell-edit-input',
                            onFocus: focusHandler,
                            onClick: clickHandler,
                            onKeyPress: this.onCellEditorKeyPress,
                            onKeyDown: this.onCellEditorKeyDown,
                            onBlur: this.onCellEditorBlur
                        });
                        break;
                    case 'int':
                        ret = React.createElement('input', { autoFocus: true, type: 'number', step: '1', defaultValue: value,
                            className: 'grid-cell-edit-input',
                            onFocus: focusHandler,
                            onClick: clickHandler,
                            onKeyPress: this.onCellEditorKeyPress,
                            onKeyDown: this.onCellEditorKeyDown,
                            onBlur: this.onCellEditorBlur
                        });
                        break;
                    case 'number':
                        ret = React.createElement('input', { autoFocus: true, type: 'number', step: '0.01', defaultValue: value,
                            className: 'grid-cell-edit-input',
                            onFocus: focusHandler,
                            onClick: clickHandler,
                            onKeyPress: this.onCellEditorKeyPress,
                            onKeyDown: this.onCellEditorKeyDown,
                            onBlur: this.onCellEditorBlur
                        });
                        break;
                    case 'date':
                        ret = React.createElement('input', { autoFocus: true, type: 'date', defaultValue: value,
                            className: 'grid-cell-edit-input',
                            onClick: clickHandler,
                            onKeyPress: this.onCellEditorKeyPress,
                            onKeyDown: this.onCellEditorKeyDown,
                            onBlur: this.onCellEditorBlur
                        });
                        break;
                }
            }
            if (!ret) {
                return null;
            }
            return ret;
        }
    }, {
        key: 'onCellEditorKeyPress',
        value: function onCellEditorKeyPress(event) {
            var _this4 = this;

            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                var value = event.target.value;
                _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee9() {
                    return _regeneratorRuntime.wrap(function _callee9$(_context9) {
                        while (1) {
                            switch (_context9.prev = _context9.next) {
                                case 0:
                                    _context9.next = 2;
                                    return _this4.activeCellApplyInputValue(value);

                                case 2:
                                    if (!_context9.sent) {
                                        _context9.next = 4;
                                        break;
                                    }

                                    _this4.setActiveCellInfo(null);

                                case 4:
                                case 'end':
                                    return _context9.stop();
                            }
                        }
                    }, _callee9, _this4);
                }))().catch(console.error);
            }
        }
    }, {
        key: 'onCellEditorKeyDown',
        value: function onCellEditorKeyDown(event) {
            var _this5 = this;

            if (event.key === 'Tab') {
                var shiftKey = event.shiftKey;
                var value = event.target.value;
                event.preventDefault();
                _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee10() {
                    return _regeneratorRuntime.wrap(function _callee10$(_context10) {
                        while (1) {
                            switch (_context10.prev = _context10.next) {
                                case 0:
                                    _context10.next = 2;
                                    return _this5.activeCellApplyInputValue(value);

                                case 2:
                                    if (!_context10.sent) {
                                        _context10.next = 5;
                                        break;
                                    }

                                    _context10.next = 5;
                                    return _this5.activateNextCell(shiftKey);

                                case 5:
                                case 'end':
                                    return _context10.stop();
                            }
                        }
                    }, _callee10, _this5);
                }))().catch(console.error);
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                this.setActiveCellInfo(null);
            }
        }
    }, {
        key: 'activeCellApplyInputValue',
        value: function () {
            var _ref12 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee11(value) {
                var cellInfo, ri, ci, row, cell, inputCellInfo;
                return _regeneratorRuntime.wrap(function _callee11$(_context11) {
                    while (1) {
                        switch (_context11.prev = _context11.next) {
                            case 0:
                                cellInfo = this.state.activeCellInfo;

                                if (cellInfo) {
                                    _context11.next = 3;
                                    break;
                                }

                                return _context11.abrupt('return', false);

                            case 3:
                                ri = cellInfo.ri, ci = cellInfo.ci;
                                row = this.state.gridData.Rows[ri];
                                cell = row.Cells[ci];


                                if (value === '') {
                                    inputCellInfo = cellInfo.inputCellInfo;

                                    if (inputCellInfo && ['int', 'number'].includes(inputCellInfo.DataType)) {
                                        value = '0';
                                    }
                                }

                                _context11.t0 = cell;

                                if (!_context11.t0) {
                                    _context11.next = 12;
                                    break;
                                }

                                _context11.next = 11;
                                return this.setCellValue(row, cell, value);

                            case 11:
                                _context11.t0 = _context11.sent;

                            case 12:
                                return _context11.abrupt('return', _context11.t0);

                            case 13:
                            case 'end':
                                return _context11.stop();
                        }
                    }
                }, _callee11, this);
            }));

            function activeCellApplyInputValue(_x10) {
                return _ref12.apply(this, arguments);
            }

            return activeCellApplyInputValue;
        }()
    }, {
        key: 'onCellEditorBlur',
        value: function onCellEditorBlur(event) {
            var _this6 = this;

            this.setPendingCellInfo(null);
            try {
                event.target.focus();
            } catch (e) {
                console.log('onCellEditorBlur: Unable to refocus target, resetting active cell');
                this.setActiveCellInfo(null);
            }
            var value = event.target.value;
            _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee12() {
                return _regeneratorRuntime.wrap(function _callee12$(_context12) {
                    while (1) {
                        switch (_context12.prev = _context12.next) {
                            case 0:
                                _context12.next = 2;
                                return _this6.activeCellApplyInputValue(value);

                            case 2:
                                if (!_context12.sent) {
                                    _context12.next = 6;
                                    break;
                                }

                                _this6.setActiveCellInfo(_this6.state.pendingCellInfo);
                                _context12.next = 7;
                                break;

                            case 6:
                                console.log('onCellEditorBlur: Value rejected:', value);

                            case 7:
                            case 'end':
                                return _context12.stop();
                        }
                    }
                }, _callee12, _this6);
            }))().catch(console.error);
        }
    }, {
        key: 'activateNextCell',
        value: function () {
            var _ref14 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee13(reverse) {
                var cellInfo, delta, rows, ri, row, ci, cell, inputCellInfo;
                return _regeneratorRuntime.wrap(function _callee13$(_context13) {
                    while (1) {
                        switch (_context13.prev = _context13.next) {
                            case 0:
                                cellInfo = this.state.activeCellInfo;

                                if (cellInfo) {
                                    _context13.next = 3;
                                    break;
                                }

                                return _context13.abrupt('return');

                            case 3:
                                delta = reverse ? -1 : 1;
                                rows = this.pendingState.gridData.Rows;
                                ri = cellInfo.ri || 0;

                            case 6:
                                if (!(0 <= ri && ri < rows.length)) {
                                    _context13.next = 26;
                                    break;
                                }

                                row = rows[ri];
                                ci = cellInfo.ri === ri ? cellInfo.ci + delta : !reverse ? 0 : row.Cells.length - 1;

                            case 9:
                                if (!(0 <= ci && ci < row.Cells.length)) {
                                    _context13.next = 23;
                                    break;
                                }

                                cell = row.Cells[ci];

                                if (!(cell.Type !== 'InputCell')) {
                                    _context13.next = 13;
                                    break;
                                }

                                return _context13.abrupt('continue', 20);

                            case 13:
                                _context13.next = 15;
                                return this._provider.getInputCellInfo(cell.CellId);

                            case 15:
                                inputCellInfo = _context13.sent;

                                if (inputCellInfo) {
                                    _context13.next = 18;
                                    break;
                                }

                                return _context13.abrupt('continue', 20);

                            case 18:
                                this.setActiveCellInfo({ cell: cell, row: row, ri: ri, ci: ci, inputCellInfo: inputCellInfo });
                                return _context13.abrupt('return');

                            case 20:
                                ci += delta;
                                _context13.next = 9;
                                break;

                            case 23:
                                ri += delta;
                                _context13.next = 6;
                                break;

                            case 26:
                            case 'end':
                                return _context13.stop();
                        }
                    }
                }, _callee13, this);
            }));

            function activateNextCell(_x11) {
                return _ref14.apply(this, arguments);
            }

            return activateNextCell;
        }()
    }, {
        key: 'renderCell',
        value: function renderCell(row, cell, ri, ci, isHeader) {
            var _this7 = this;

            var isReadonly = this.state.isReadonly || isHeader;
            var cellClass = cell.Style;
            if (cell.Type === 'InputCell') {
                cellClass += ' input-cell';
            }
            var fixedColumnsDelta = cell.i + (cell.ColSpan || 1) - this.state.gridData.FixedColumns;
            if (fixedColumnsDelta <= 0) {
                cellClass += ' fixed';
                if (fixedColumnsDelta === 0) {
                    cellClass += ' sg-br';
                }
            }
            var highlightedCellId = this.state.highlightedCellId;
            if (highlightedCellId && cell.CellId === highlightedCellId) {
                cellClass += ' highlighted-cell';
            }
            var pastedCellIds = this.state.pastedCellIds;
            if (pastedCellIds && cell.CellId && pastedCellIds.has(cell.CellId)) {
                cellClass += ' pasted-cell';
            }
            var activeCellInfo = this.state.activeCellInfo;
            var isActive = !isReadonly && activeCellInfo && ri === activeCellInfo.ri && ci === activeCellInfo.ci;
            var content = !isActive ? cell.FormattedData : this.getCellEditor(activeCellInfo.inputCellInfo, row);
            var onClick = !isReadonly && cell.Type === 'InputCell' && !cell.ReadOnly ? _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee14() {
                var inputCellInfo, cellInfo;
                return _regeneratorRuntime.wrap(function _callee14$(_context14) {
                    while (1) {
                        switch (_context14.prev = _context14.next) {
                            case 0:
                                _context14.next = 2;
                                return _this7._provider.getInputCellInfo(cell.CellId);

                            case 2:
                                inputCellInfo = _context14.sent;

                                if (inputCellInfo) {
                                    _context14.next = 5;
                                    break;
                                }

                                return _context14.abrupt('return');

                            case 5:
                                cellInfo = { cell: cell, row: row, ri: ri, ci: ci, inputCellInfo: inputCellInfo };

                                if (!_this7.state.activeCellInfo) {
                                    _this7.setActiveCellInfo(cellInfo);
                                } else {
                                    _this7.setPendingCellInfo(cellInfo);
                                }

                            case 7:
                            case 'end':
                                return _context14.stop();
                        }
                    }
                }, _callee14, _this7);
            })) : null;

            var title = null;
            if (cell.CellId && this.state.showErrors) {
                var cellErrors = this.state.errors.map.get(cell.CellId);
                if (cellErrors) {
                    cellClass += ' has-error';
                    title = cellErrors.join(';\n');
                }
            }

            var td = React.createElement(
                'td',
                {
                    key: cell.i,
                    'data-ci': cell.i,
                    rowSpan: cell.RowSpan,
                    colSpan: cell.ColSpan,
                    className: cellClass,
                    onClick: onClick,
                    title: title
                },
                content
            );
            return td;
        }
    }, {
        key: 'renderRowHeaderCell',
        value: function renderRowHeaderCell(row, renderRemoveMarkers) {
            var _this8 = this;

            var removable = renderRemoveMarkers;
            var className = !removable ? 'rhead fixed' : 'rhead fixed removable';
            var clickHandler = !removable ? null : _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee15() {
                var pageId, range, state, removed;
                return _regeneratorRuntime.wrap(function _callee15$(_context15) {
                    while (1) {
                        switch (_context15.prev = _context15.next) {
                            case 0:
                                pageId = _this8.state.activePageId;
                                _context15.next = 3;
                                return _this8._provider.getRowsForRemove(pageId, row.i);

                            case 3:
                                range = _context15.sent;

                                if (range) {
                                    _context15.next = 7;
                                    break;
                                }

                                alert(_this8.$t('Строка недоступна для удаления'));
                                return _context15.abrupt('return');

                            case 7:
                                _this8.setLocalState({
                                    removingRowsRange: range
                                });
                                _context15.next = 10;
                                return _this8.waitFor(1);

                            case 10:
                                state = {
                                    removingRowsRange: null
                                };

                                if (!confirm(_this8.$t('Подтвердите удаление выбранных строк. Связанные строки из других таблиц также будут удалены.'))) {
                                    _context15.next = 22;
                                    break;
                                }

                                _context15.next = 14;
                                return _this8._provider.removeGroupRows(pageId, row.i);

                            case 14:
                                removed = _context15.sent;

                                if (!removed) {
                                    _context15.next = 22;
                                    break;
                                }

                                _context15.next = 18;
                                return _this8._provider.getGridData(pageId);

                            case 18:
                                state.gridData = _context15.sent;
                                _context15.next = 21;
                                return _this8._provider.getBookChangeIndex();

                            case 21:
                                state.bookChangeIndex = _context15.sent;

                            case 22:
                                _this8.setLocalState(state);

                            case 23:
                            case 'end':
                                return _context15.stop();
                        }
                    }
                }, _callee15, _this8);
            }));
            var content = !removable || row.Height < 10 ? null : React.createElement('span', { className: 'fa fa-remove' });
            var td = React.createElement(
                'td',
                { key: '-', className: className, onClick: clickHandler },
                content
            );
            return td;
        }

        /**
         * @typedef {{cell: object, row: object, ri: number, ci:number, inputCellInfo: object}} SgCellInfo
         */

        /**
         * @param {SgCellInfo} cellInfo
         */

    }, {
        key: 'setActiveCellInfo',
        value: function setActiveCellInfo(cellInfo) {
            this.setLocalState({
                activeCellInfo: cellInfo,
                pendingCellInfo: null
            });
        }
    }, {
        key: 'setPendingCellInfo',
        value: function setPendingCellInfo(cellInfo) {
            this.setLocalState({
                pendingCellInfo: cellInfo
            });
        }
    }, {
        key: 'renderSpreadsheetGridPart',
        value: function renderSpreadsheetGridPart(grid, isHeader) {
            var _this9 = this;

            var grows = isHeader ? grid.HeadRows : grid.Rows;
            var rows = [];
            var rrange = this.state.removingRowsRange;
            var isReadonly = this.props.isReadonly;

            var colsCount = 0;
            grows.forEach(function (r, ri) {
                var curColsCount = 0;
                var tds = [_this9.renderRowHeaderCell(r, !isHeader && !isReadonly)];
                r.Cells.forEach(function (cell, ci) {
                    curColsCount += cell.ColSpan || 1;
                    tds.push(_this9.renderCell(r, cell, ri, ci, isHeader));
                });
                if (!colsCount) {
                    colsCount = curColsCount + 1;
                    tds.push(React.createElement('td', { key: 'lc', rowSpan: grows.length + 1, className: 'sg-tc' }));
                }
                var rowClass = null;
                if (r.IsDuplicable) {
                    rowClass = 'duplicable';
                }
                if (rrange && rrange.from <= r.i && r.i <= rrange.to) {
                    rowClass += ' removing';
                }

                rows.push(React.createElement(
                    'tr',
                    { key: r.i, height: r.Height, className: rowClass },
                    tds
                ));
            });
            if (isHeader) {
                // first row for measurements
                var fixedColumns = this.state.gridData.FixedColumns || 0;
                var tds = [];
                tds.push(React.createElement('td', { key: '-', className: 'rhead fixed' }));
                grid.Columns.forEach(function (col) {
                    var className = col.i === fixedColumns - 1 ? 'fixed sg-br' : col.i < fixedColumns ? 'fixed' : null;
                    tds.push(React.createElement('td', { key: col.i, 'data-ci': col.i, className: className }));
                });
                tds.push(React.createElement('td', { key: 'lc', className: 'sg-tc' }));

                rows.unshift(React.createElement(
                    'tr',
                    { key: 'fr', height: '3px' },
                    tds
                ));
            }
            rows.push(React.createElement(
                'tr',
                { key: 'lr' },
                React.createElement('td', { key: 'lrc', colSpan: colsCount, className: 'sg-tr' })
            ));

            return rows;
        }
    }, {
        key: 'renderGridHeader',
        value: function renderGridHeader(activePageId) {
            var _this10 = this;

            var navMode = this.props.navMode;

            var bookInfo = this.state.bookInfo;
            var grids = bookInfo.Grids;

            var dropdown = null;
            var navTabs = null;

            if (navMode === 'tabs') {
                var filterPages = this.state.filterCategoryPages;
                var activeCategory = !filterPages ? '[ALL]' : (grids.filter(function (grid) {
                    return grid.Id == activePageId;
                })[0] || grids[0] || {}).Category || '';
                var categoryGrids = !filterPages ? grids : grids.filter(function (grid) {
                    return (grid.Category || '') === activeCategory;
                });
                var navItems = [];

                var _loop = function _loop(grid) {
                    var className = 'nav-link';
                    if (activePageId === grid.Id) {
                        className += ' active';
                    }
                    var navItem = React.createElement(
                        'li',
                        { className: 'nav-item', key: grid.Id },
                        React.createElement(
                            'span',
                            { className: className, onClick: function onClick() {
                                    return _this10.onPageChange(grid.Id);
                                } },
                            grid.Id
                        )
                    );
                    navItems.push(navItem);
                };

                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = categoryGrids[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var grid = _step4.value;

                        _loop(grid);
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }

                navTabs = React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        { colSpan: '10', className: 'sg-nav-tabs' },
                        React.createElement(
                            'ul',
                            { className: 'nav nav-tabs' },
                            navItems
                        )
                    )
                );

                var categories = new Map();
                grids.forEach(function (grid) {
                    var category = grid.Category || '';
                    if (!categories.has(category)) {
                        categories.set(category, {
                            name: category,
                            title: category || _this10.$t('Прочее'),
                            onClick: function onClick() {
                                _this10.setLocalState({ filterCategoryPages: true });
                                _this10.onPageChange(grid.Id);
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
                        onClick: function onClick() {
                            return _this10.setLocalState({ filterCategoryPages: false });
                        }
                    });
                }
                var menuItems = [];
                var othersItem = null;
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = categories.values()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var category = _step5.value;

                        var _className = 'dropdown-item';
                        if (activeCategory === category.name) {
                            _className += ' selected';
                        }
                        var menuItem = React.createElement(
                            'div',
                            { key: category.name || '-', className: _className, onClick: category.onClick },
                            React.createElement(
                                'span',
                                { className: 'page-text ml-2' },
                                category.title
                            )
                        );
                        if (!category.name) {
                            othersItem = menuItem;
                        } else {
                            menuItems.push(menuItem);
                        }
                    }
                } catch (err) {
                    _didIteratorError5 = true;
                    _iteratorError5 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion5 && _iterator5.return) {
                            _iterator5.return();
                        }
                    } finally {
                        if (_didIteratorError5) {
                            throw _iteratorError5;
                        }
                    }
                }

                if (othersItem) {
                    menuItems.push(othersItem);
                }
                if (menuItems.length) {
                    dropdown = React.createElement(
                        'div',
                        { className: 'btn-group' },
                        React.createElement(
                            'button',
                            { type: 'button', className: 'btn btn-success dropdown-toggle', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
                            this.$t('Разделы')
                        ),
                        React.createElement(
                            'div',
                            { className: 'dropdown-menu pages' },
                            menuItems
                        )
                    );
                }
            } else {
                var _menuItems = [];
                var _category = '';

                var _loop2 = function _loop2(_grid) {
                    var curCategory = _grid.Category || '';
                    if (_category !== curCategory) {
                        _category = curCategory;
                        _menuItems.push(React.createElement(
                            'h6',
                            { key: _grid.Id + '-cat', className: 'dropdown-header pl-3' },
                            curCategory || _this10.$t('Прочее')
                        ));
                    }
                    var className = 'dropdown-item';
                    if (activePageId === _grid.Id) {
                        className += ' selected';
                    }
                    var menuItem = React.createElement(
                        'div',
                        { key: _grid.Id, className: className, onClick: function onClick() {
                                return _this10.onPageChange(_grid.Id);
                            } },
                        React.createElement(
                            'span',
                            { className: 'page-id' },
                            _grid.Id
                        ),
                        React.createElement(
                            'span',
                            { className: 'page-text ml-2' },
                            _grid.Description
                        )
                    );
                    _menuItems.push(menuItem);
                };

                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = grids[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var _grid = _step6.value;

                        _loop2(_grid);
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                dropdown = React.createElement(
                    'div',
                    { className: 'btn-group' },
                    React.createElement(
                        'button',
                        { type: 'button', className: 'btn btn-success dropdown-toggle', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
                        activePageId
                    ),
                    React.createElement(
                        'div',
                        { className: 'dropdown-menu pages' },
                        _menuItems
                    )
                );
            }

            var activeGrid = grids.filter(function (x) {
                return x.Id === activePageId;
            })[0];
            var tdUnit = !activeGrid.DefaultUnit ? null : React.createElement(
                'td',
                { className: 'page-unit fit-width' },
                activeGrid.DefaultUnit
            );

            var errorsCount = this.state.errors.list.length;
            var tdErrorsClass = 'book-errors fit-width';
            if (this.state.showErrors) {
                tdErrorsClass += ' active';
            }
            var tdErrors = !errorsCount ? null : React.createElement(
                'td',
                { className: tdErrorsClass, onClick: this.toggleShowErrors },
                this.$t('Ошибки:'),
                ' ',
                React.createElement(
                    'span',
                    { className: 'badge badge-danger' },
                    errorsCount
                )
            );

            var showSaveButton = this.props.bookSaveUrl && !this.props.isReadonly && this.props.showSaveButton;
            var tdBtnSave = !showSaveButton ? null : React.createElement(
                'td',
                { className: 'fit-width' },
                React.createElement(
                    'div',
                    { className: 'btn btn-success', onClick: function onClick() {
                            return _this10.onBookSave();
                        } },
                    this.$t('Сохранить')
                )
            );

            var showFullscreenButton = this.props.showFullscreen && this.props.containerElement;
            var tdBtnFullscreen = !showFullscreenButton ? null : React.createElement(
                'td',
                { className: 'fit-width' },
                React.createElement(
                    'div',
                    { className: 'btn btn-info', onClick: function onClick() {
                            return _this10.toggleFullscreen();
                        }, title: this.$t('Полноэкранный режим') },
                    React.createElement('span', { className: 'fa fa-arrows-alt' })
                )
            );

            var langCode = bookInfo.CurLangCode;
            var langText = '';
            var langMenuItems = [];

            var _loop3 = function _loop3(lang) {
                var className = 'dropdown-item';
                if (langCode === lang.Code) {
                    className += ' selected';
                    langText = lang.Value;
                }
                var menuItem = React.createElement(
                    'div',
                    { key: lang.Code, className: className, onClick: function onClick() {
                            return _this10.onLanguageChange(lang.Code);
                        } },
                    React.createElement(
                        'span',
                        { className: 'lang-text' },
                        lang.Value
                    )
                );
                langMenuItems.push(menuItem);
            };

            var _iteratorNormalCompletion7 = true;
            var _didIteratorError7 = false;
            var _iteratorError7 = undefined;

            try {
                for (var _iterator7 = bookInfo.Languages[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                    var lang = _step7.value;

                    _loop3(lang);
                }
            } catch (err) {
                _didIteratorError7 = true;
                _iteratorError7 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion7 && _iterator7.return) {
                        _iterator7.return();
                    }
                } finally {
                    if (_didIteratorError7) {
                        throw _iteratorError7;
                    }
                }
            }

            var tdLangs = !langMenuItems.length || this.state.isReadonly ? null : React.createElement(
                'td',
                { className: 'fit-width' },
                React.createElement(
                    'div',
                    { className: 'btn-group' },
                    React.createElement(
                        'button',
                        { type: 'button', className: 'btn btn-info dropdown-toggle', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
                        langText
                    ),
                    React.createElement(
                        'div',
                        { className: 'dropdown-menu dropdown-menu-right langs' },
                        langMenuItems
                    )
                )
            );

            var tdDropdown = null;
            if (dropdown) {
                tdDropdown = React.createElement(
                    'td',
                    { className: 'fit-width' },
                    dropdown
                );
            }

            var header = React.createElement(
                'div',
                { className: 'grid-header' },
                React.createElement(
                    'table',
                    null,
                    React.createElement(
                        'tbody',
                        null,
                        React.createElement(
                            'tr',
                            { className: 'sg-nav-header' },
                            tdDropdown,
                            React.createElement(
                                'td',
                                { className: 'page-title' },
                                activeGrid.Description
                            ),
                            tdUnit,
                            tdErrors,
                            tdLangs,
                            tdBtnFullscreen,
                            tdBtnSave
                        ),
                        navTabs
                    )
                )
            );
            return header;
        }
    }, {
        key: 'gotoErrorCell',
        value: function () {
            var _ref17 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee16(cellInfo) {
                var cellId, gridId, bookInfo, el;
                return _regeneratorRuntime.wrap(function _callee16$(_context16) {
                    while (1) {
                        switch (_context16.prev = _context16.next) {
                            case 0:
                                cellId = cellInfo.CellId;
                                gridId = cellInfo.GridId;

                                if (!(gridId !== this.state.activePageId)) {
                                    _context16.next = 8;
                                    break;
                                }

                                bookInfo = this.state.bookInfo;

                                if (bookInfo.Grids.map(function (x) {
                                    return x.Id;
                                }).includes(gridId)) {
                                    _context16.next = 6;
                                    break;
                                }

                                return _context16.abrupt('return');

                            case 6:
                                _context16.next = 8;
                                return this.onPageChange(gridId);

                            case 8:
                                this.setLocalState({
                                    highlightedCellId: cellId
                                });
                                _context16.next = 11;
                                return this.waitFor(10);

                            case 11:
                                el = document.querySelector('td.highlighted-cell');

                                el && el.scrollIntoView({ block: 'center', inline: 'center' });

                                _context16.next = 15;
                                return this.waitFor(1000);

                            case 15:
                                this.setLocalState({
                                    highlightedCellId: null
                                });

                            case 16:
                            case 'end':
                                return _context16.stop();
                        }
                    }
                }, _callee16, this);
            }));

            function gotoErrorCell(_x12) {
                return _ref17.apply(this, arguments);
            }

            return gotoErrorCell;
        }()
    }, {
        key: 'renderBookErrorList',
        value: function renderBookErrorList() {
            var _this11 = this;

            var errors = this.state.errors.list;
            if (!errors.length || !this.state.showErrors) {
                return null;
            }

            var errorItems = errors.map(function (error, index) {
                var cellLinks = error.Cells.map(function (cell, i) {
                    return React.createElement(
                        'span',
                        {
                            key: index + '-' + i,
                            className: 'btn btn-sm btn-link',
                            onClick: function onClick() {
                                return _this11.gotoErrorCell(cell);
                            }
                        },
                        i + 1
                    );
                });
                return React.createElement(
                    'div',
                    { className: 'grid-error-item', key: index },
                    React.createElement(
                        'span',
                        { className: 'error-number' },
                        index + 1
                    ),
                    ' ',
                    React.createElement(
                        'span',
                        { className: 'error-title' },
                        error.Message
                    ),
                    ' ',
                    cellLinks
                );
            });

            var ret = React.createElement(
                'div',
                { className: 'grid-errors' },
                errorItems
            );
            return ret;
        }
    }, {
        key: 'onBodyClick',
        value: function onBodyClick() {
            if (this.state.pastedCellIds) {
                this.setLocalState({
                    pastedCellIds: null
                });
            }
        }
    }, {
        key: 'onPaste',
        value: function onPaste(e) {
            var data = e.clipboardData.getData('text/plain');
            var activeCellInfo = this.state.activeCellInfo;
            if (!activeCellInfo || !data) {
                return;
            }
            if (!data.includes('\n') && !data.includes('\t')) {
                return;
            }
            data = data.replace(/\r/g, '');
            e.preventDefault();
            var row = activeCellInfo.row,
                cell = activeCellInfo.cell;

            var rows = data.split('\n');
            if (!rows[rows.length - 1]) {
                rows.pop();
            }
            rows = rows.map(function (row) {
                return row.split('\t');
            });
            this.setActiveCellInfo(null);
            this.setCellValuesBlock(row.i, cell.i, rows).catch(console.error);
        }
    }, {
        key: 'render',
        value: function render() {
            var activePageId = this.state.activePageId;
            var grid = this.state.gridData;
            var savingDiv = !this.state.saving ? null : React.createElement(
                'div',
                { className: 'grid-saving' },
                React.createElement('div', { className: 'msg-background' }),
                React.createElement(
                    'div',
                    { className: 'msg-panel' },
                    this.$t('Сохранение данных...')
                )
            );

            var columns = grid.Columns;
            var tableWidth = 0;
            columns.map(function (x) {
                return tableWidth += x.Width || 50;
            });
            return React.createElement(
                'div',
                { className: 'sg-editor-body' },
                savingDiv,
                this.renderBookErrorList(),
                this.renderGridHeader(activePageId),
                React.createElement(
                    'div',
                    { className: 'sg-table-wrapper' },
                    React.createElement(
                        'table',
                        { className: 'sg-table', key: activePageId, width: tableWidth },
                        this.renderSpreadsheetColGroup(grid),
                        React.createElement(
                            'thead',
                            null,
                            this.renderSpreadsheetGridPart(grid, true)
                        ),
                        React.createElement(
                            'tbody',
                            { onPaste: this.onPaste, onClick: this.onBodyClick },
                            this.renderSpreadsheetGridPart(grid, false)
                        )
                    )
                )
            );
        }

        // supporting fixed columns and rows

    }, {
        key: 'refreshStickyCells',
        value: function refreshStickyCells() {
            var container = this.props.containerElement;
            if (!container) {
                return;
            }
            var table = container.querySelector('table.sg-table');
            if (!table) {
                return;
            }
            var top = 0;
            var _iteratorNormalCompletion8 = true;
            var _didIteratorError8 = false;
            var _iteratorError8 = undefined;

            try {
                for (var _iterator8 = table.tHead.rows[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                    var r = _step8.value;
                    var _iteratorNormalCompletion11 = true;
                    var _didIteratorError11 = false;
                    var _iteratorError11 = undefined;

                    try {
                        for (var _iterator11 = r.cells[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                            var _cell = _step11.value;

                            _cell.style.top = top + 'px';
                        }
                    } catch (err) {
                        _didIteratorError11 = true;
                        _iteratorError11 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion11 && _iterator11.return) {
                                _iterator11.return();
                            }
                        } finally {
                            if (_didIteratorError11) {
                                throw _iteratorError11;
                            }
                        }
                    }

                    top += $(r).outerHeight();
                }

                // detect cell positions first
            } catch (err) {
                _didIteratorError8 = true;
                _iteratorError8 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion8 && _iterator8.return) {
                        _iterator8.return();
                    }
                } finally {
                    if (_didIteratorError8) {
                        throw _iteratorError8;
                    }
                }
            }

            var colLefts = {};
            var zrow = table.rows[0];
            var zleft = 0;
            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = zrow.cells[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var cell = _step9.value;

                    colLefts[cell.dataset.ci] = zleft;
                    zleft += $(cell).outerWidth();
                }
                // then apply to column cells
            } catch (err) {
                _didIteratorError9 = true;
                _iteratorError9 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion9 && _iterator9.return) {
                        _iterator9.return();
                    }
                } finally {
                    if (_didIteratorError9) {
                        throw _iteratorError9;
                    }
                }
            }

            var _iteratorNormalCompletion10 = true;
            var _didIteratorError10 = false;
            var _iteratorError10 = undefined;

            try {
                for (var _iterator10 = table.rows[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                    var _r = _step10.value;
                    var _iteratorNormalCompletion12 = true;
                    var _didIteratorError12 = false;
                    var _iteratorError12 = undefined;

                    try {
                        for (var _iterator12 = _r.cells[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                            var _cell2 = _step12.value;

                            if (!_cell2.classList.contains('fixed')) {
                                break;
                            }
                            var ci = _cell2.dataset.ci;
                            _cell2.style.left = (ci && colLefts[ci] || 0) + 'px';
                        }
                    } catch (err) {
                        _didIteratorError12 = true;
                        _iteratorError12 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion12 && _iterator12.return) {
                                _iterator12.return();
                            }
                        } finally {
                            if (_didIteratorError12) {
                                throw _iteratorError12;
                            }
                        }
                    }
                }
            } catch (err) {
                _didIteratorError10 = true;
                _iteratorError10 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion10 && _iterator10.return) {
                        _iterator10.return();
                    }
                } finally {
                    if (_didIteratorError10) {
                        throw _iteratorError10;
                    }
                }
            }
        }
    }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.refreshStickyCells();
        }
    }, {
        key: 'componentDidUpdate',
        value: function componentDidUpdate() {
            this.refreshStickyCells();
        }
    }]);

    return SpreadsheetBook;
}(React.Component);

function waitForMonoGetReady() {
    return new Promise(function (resolve) {
        // hook App.init to avoid 'require' loading
        if (MONO.mono_wasm_runtime_is_ready) {
            resolve();
        } else {
            var init = window.App.init;
            window.App.init = function () {
                init.apply(this, arguments);
                resolve();
            };
        }
    });
}

var bookContentTypes = {
    xmlBook: 'xml-book',
    viewModel: 'view-model'
};

function getUnpackedData(data) {
    // try to ungzip data with non-regular structure
    if (typeof data === 'string' && !['<', '{', '['].includes(data[0])) {
        data = pako.ungzip(atob(data), { 'to': 'string' });
    }
    return data;
}

$(document).ready(function () {
    $(".sg-editor").each(_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee17() {
        var $this, $t, bookLoadUrl, bookSaveUrl, bookSaveFormat, langCode, showErrors, navMode, isReadonly, showSaveButton, showFullscreen, bookErrors, bookContent, bookContentType, bookData, provider, bookInfo, pageId, gridData, api;
        return _regeneratorRuntime.wrap(function _callee17$(_context17) {
            while (1) {
                switch (_context17.prev = _context17.next) {
                    case 0:
                        $this = $(this);

                        $t = window.T || function (t) {
                            return t;
                        };

                        _context17.prev = 2;
                        bookLoadUrl = $this.attr('book-load-url') || $this.attr('book-url');
                        bookSaveUrl = $this.attr('book-save-url');
                        bookSaveFormat = $this.attr('book-save-format') || 'gzip';
                        langCode = $this.attr('lang-code');
                        showErrors = ($this.attr('show-errors') || 'false').toLowerCase() === 'true';
                        navMode = $this.attr('nav-mode');
                        isReadonly = ($this.attr('is-readonly') || 'false').toLowerCase() === 'true';
                        showSaveButton = ($this.attr('show-save-button') || 'true').toLowerCase() === 'true';
                        showFullscreen = ($this.attr('show-fullscreen') || 'true').toLowerCase() === 'true';
                        bookErrors = $this.attr('book-errors');
                        bookContent = $this.attr('book-content');
                        bookContentType = $this.attr('book-content-type');

                        if (!(!bookLoadUrl && !bookContent)) {
                            _context17.next = 17;
                            break;
                        }

                        throw new Error('Either "book-load-url" or "book-content" should be specified');

                    case 17:

                        bookErrors = bookErrors && JSON.parse(getUnpackedData(bookErrors));
                        bookContent = getUnpackedData(bookContent);

                        if (bookContent && !bookContentType) {
                            // try auto-detect content type from content
                            bookContentType = bookContent[0] === '<' ? bookContentTypes.xmlBook : bookContentTypes.viewModel;
                        }
                        // remove large text blocks from html markup
                        $this.removeAttr('book-errors');
                        $this.removeAttr('book-content');

                        bookData = {
                            Content: bookContent,
                            ContentType: bookContentType,
                            BookErrors: bookErrors
                        };

                        if (bookData.Content) {
                            _context17.next = 26;
                            break;
                        }

                        _context17.next = 26;
                        return new Promise(function (resolve, reject) {
                            $.ajax({ url: bookLoadUrl, dataType: 'text' }).done(function (data) {
                                try {
                                    data = getUnpackedData(data);
                                    if (data.startsWith('{')) {
                                        var serverBookData = JSON.parse(data);
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

                    case 26:
                        provider = null;
                        bookInfo = null;

                        if (!(bookData.ContentType === bookContentTypes.xmlBook)) {
                            _context17.next = 37;
                            break;
                        }

                        _context17.next = 31;
                        return waitForMonoGetReady();

                    case 31:
                        provider = new BookDataProviderWasm();
                        _context17.next = 34;
                        return provider.loadBook({
                            xmlContent: bookData.Content,
                            langCode: langCode
                        });

                    case 34:
                        bookInfo = _context17.sent;
                        _context17.next = 46;
                        break;

                    case 37:
                        if (!(bookData.ContentType === bookContentTypes.viewModel)) {
                            _context17.next = 45;
                            break;
                        }

                        provider = new BookDataProviderView();
                        _context17.next = 41;
                        return provider.loadBook(bookData.Content);

                    case 41:
                        bookInfo = _context17.sent;

                        isReadonly = true;
                        _context17.next = 46;
                        break;

                    case 45:
                        throw new Error('Unknown book content type: ' + bookData.ContentType);

                    case 46:
                        pageId = bookInfo.Grids[0].Id;
                        _context17.next = 49;
                        return provider.getGridData(pageId);

                    case 49:
                        gridData = _context17.sent;
                        api = {};

                        ReactDOM.render(React.createElement(SpreadsheetBook, {
                            bookInfo: bookInfo,
                            bookSaveUrl: bookSaveUrl,
                            bookSaveFormat: bookSaveFormat,
                            bookErrors: bookData.BookErrors,
                            showErrors: showErrors,
                            showSaveButton: showSaveButton,
                            showFullscreen: showFullscreen,
                            isReadonly: isReadonly,
                            eventEmitter: this,
                            containerElement: this,
                            provider: provider,
                            exposeApi: api,
                            navMode: navMode,
                            translateFunc: $t,
                            gridData: gridData
                        }), this);
                        $this.data('api', api);
                        _context17.next = 59;
                        break;

                    case 55:
                        _context17.prev = 55;
                        _context17.t0 = _context17['catch'](2);

                        console.error('sg-editor: Unable to load book:', _context17.t0);
                        $this.html('<div class="alert alert-danger" role="alert">' + $t('Ошибка при загрузке таблиц') + '</div>');

                    case 59:
                    case 'end':
                        return _context17.stop();
                }
            }
        }, _callee17, this, [[2, 55]]);
    })));
});

/* ------- Book Data Providers ------- */

function addGridDataCellById(gridData) {
    gridData.CellById = {};
    var _arr = [gridData.HeadRows, gridData.Rows];
    for (var _i = 0; _i < _arr.length; _i++) {
        var rs = _arr[_i];var _iteratorNormalCompletion13 = true;
        var _didIteratorError13 = false;
        var _iteratorError13 = undefined;

        try {
            for (var _iterator13 = rs[Symbol.iterator](), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
                var r = _step13.value;
                var _iteratorNormalCompletion14 = true;
                var _didIteratorError14 = false;
                var _iteratorError14 = undefined;

                try {
                    for (var _iterator14 = r.Cells[Symbol.iterator](), _step14; !(_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done); _iteratorNormalCompletion14 = true) {
                        var c = _step14.value;

                        if (c.CellId) {
                            gridData.CellById[c.CellId] = c;
                        }
                    }
                } catch (err) {
                    _didIteratorError14 = true;
                    _iteratorError14 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion14 && _iterator14.return) {
                            _iterator14.return();
                        }
                    } finally {
                        if (_didIteratorError14) {
                            throw _iteratorError14;
                        }
                    }
                }
            }
        } catch (err) {
            _didIteratorError13 = true;
            _iteratorError13 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion13 && _iterator13.return) {
                    _iterator13.return();
                }
            } finally {
                if (_didIteratorError13) {
                    throw _iteratorError13;
                }
            }
        }
    }
    return gridData;
}

function chunkSubstr(str, size) {
    var numChunks = Math.ceil(str.length / size);
    var chunks = new Array(numChunks);

    for (var i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size);
    }
    return chunks;
}

var BookDataProviderBase = function () {
    function BookDataProviderBase() {
        _classCallCheck(this, BookDataProviderBase);
    }

    _createClass(BookDataProviderBase, [{
        key: 'loadBook',
        value: function () {
            var _ref19 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee18(args) {
                return _regeneratorRuntime.wrap(function _callee18$(_context18) {
                    while (1) {
                        switch (_context18.prev = _context18.next) {
                            case 0:
                                return _context18.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context18.stop();
                        }
                    }
                }, _callee18, this);
            }));

            function loadBook(_x13) {
                return _ref19.apply(this, arguments);
            }

            return loadBook;
        }()
    }, {
        key: 'getBookInfo',
        value: function () {
            var _ref20 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee19() {
                return _regeneratorRuntime.wrap(function _callee19$(_context19) {
                    while (1) {
                        switch (_context19.prev = _context19.next) {
                            case 0:
                                return _context19.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context19.stop();
                        }
                    }
                }, _callee19, this);
            }));

            function getBookInfo() {
                return _ref20.apply(this, arguments);
            }

            return getBookInfo;
        }()
    }, {
        key: 'getGridData',
        value: function () {
            var _ref21 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee20(pageId) {
                return _regeneratorRuntime.wrap(function _callee20$(_context20) {
                    while (1) {
                        switch (_context20.prev = _context20.next) {
                            case 0:
                                return _context20.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context20.stop();
                        }
                    }
                }, _callee20, this);
            }));

            function getGridData(_x14) {
                return _ref21.apply(this, arguments);
            }

            return getGridData;
        }()
    }, {
        key: 'getRowsForRemove',
        value: function () {
            var _ref22 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee21(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee21$(_context21) {
                    while (1) {
                        switch (_context21.prev = _context21.next) {
                            case 0:
                                return _context21.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context21.stop();
                        }
                    }
                }, _callee21, this);
            }));

            function getRowsForRemove(_x15, _x16) {
                return _ref22.apply(this, arguments);
            }

            return getRowsForRemove;
        }()
    }, {
        key: 'removeGroupRows',
        value: function () {
            var _ref23 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee22(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee22$(_context22) {
                    while (1) {
                        switch (_context22.prev = _context22.next) {
                            case 0:
                                return _context22.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context22.stop();
                        }
                    }
                }, _callee22, this);
            }));

            function removeGroupRows(_x17, _x18) {
                return _ref23.apply(this, arguments);
            }

            return removeGroupRows;
        }()
    }, {
        key: 'getBookXml',
        value: function () {
            var _ref24 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee23() {
                return _regeneratorRuntime.wrap(function _callee23$(_context23) {
                    while (1) {
                        switch (_context23.prev = _context23.next) {
                            case 0:
                                return _context23.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context23.stop();
                        }
                    }
                }, _callee23, this);
            }));

            function getBookXml() {
                return _ref24.apply(this, arguments);
            }

            return getBookXml;
        }()
    }, {
        key: 'setLanguage',
        value: function () {
            var _ref25 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee24(langCode) {
                return _regeneratorRuntime.wrap(function _callee24$(_context24) {
                    while (1) {
                        switch (_context24.prev = _context24.next) {
                            case 0:
                                return _context24.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context24.stop();
                        }
                    }
                }, _callee24, this);
            }));

            function setLanguage(_x19) {
                return _ref25.apply(this, arguments);
            }

            return setLanguage;
        }()
    }, {
        key: 'getBookChangeIndex',
        value: function () {
            var _ref26 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee25() {
                return _regeneratorRuntime.wrap(function _callee25$(_context25) {
                    while (1) {
                        switch (_context25.prev = _context25.next) {
                            case 0:
                                return _context25.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context25.stop();
                        }
                    }
                }, _callee25, this);
            }));

            function getBookChangeIndex() {
                return _ref26.apply(this, arguments);
            }

            return getBookChangeIndex;
        }()
    }, {
        key: 'resetBookChangeIndex',
        value: function () {
            var _ref27 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee26() {
                return _regeneratorRuntime.wrap(function _callee26$(_context26) {
                    while (1) {
                        switch (_context26.prev = _context26.next) {
                            case 0:
                                return _context26.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context26.stop();
                        }
                    }
                }, _callee26, this);
            }));

            function resetBookChangeIndex() {
                return _ref27.apply(this, arguments);
            }

            return resetBookChangeIndex;
        }()
    }, {
        key: 'getInputCellInfo',
        value: function () {
            var _ref28 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee27(cellId) {
                return _regeneratorRuntime.wrap(function _callee27$(_context27) {
                    while (1) {
                        switch (_context27.prev = _context27.next) {
                            case 0:
                                return _context27.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context27.stop();
                        }
                    }
                }, _callee27, this);
            }));

            function getInputCellInfo(_x20) {
                return _ref28.apply(this, arguments);
            }

            return getInputCellInfo;
        }()
    }, {
        key: 'setInputCellValue',
        value: function () {
            var _ref29 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee28(cellId, value) {
                return _regeneratorRuntime.wrap(function _callee28$(_context28) {
                    while (1) {
                        switch (_context28.prev = _context28.next) {
                            case 0:
                                return _context28.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context28.stop();
                        }
                    }
                }, _callee28, this);
            }));

            function setInputCellValue(_x21, _x22) {
                return _ref29.apply(this, arguments);
            }

            return setInputCellValue;
        }()
    }, {
        key: 'setInputCellValuesBlock',
        value: function () {
            var _ref30 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee29(pageId, rowStart, colStart, valsJson) {
                return _regeneratorRuntime.wrap(function _callee29$(_context29) {
                    while (1) {
                        switch (_context29.prev = _context29.next) {
                            case 0:
                                return _context29.abrupt('return', null);

                            case 1:
                            case 'end':
                                return _context29.stop();
                        }
                    }
                }, _callee29, this);
            }));

            function setInputCellValuesBlock(_x23, _x24, _x25, _x26) {
                return _ref30.apply(this, arguments);
            }

            return setInputCellValuesBlock;
        }()
    }]);

    return BookDataProviderBase;
}();

var BookDataProviderView = function (_BookDataProviderBase) {
    _inherits(BookDataProviderView, _BookDataProviderBase);

    function BookDataProviderView() {
        _classCallCheck(this, BookDataProviderView);

        return _possibleConstructorReturn(this, (BookDataProviderView.__proto__ || Object.getPrototypeOf(BookDataProviderView)).apply(this, arguments));
    }

    _createClass(BookDataProviderView, [{
        key: 'loadBook',
        value: function () {
            var _ref31 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee30(viewModel) {
                return _regeneratorRuntime.wrap(function _callee30$(_context30) {
                    while (1) {
                        switch (_context30.prev = _context30.next) {
                            case 0:
                                if (typeof viewModel === 'string') {
                                    viewModel = JSON.parse(viewModel);
                                }
                                viewModel.GridData.forEach(addGridDataCellById);
                                this._viewModel = viewModel;
                                _context30.next = 5;
                                return this.getBookInfo();

                            case 5:
                                return _context30.abrupt('return', _context30.sent);

                            case 6:
                            case 'end':
                                return _context30.stop();
                        }
                    }
                }, _callee30, this);
            }));

            function loadBook(_x27) {
                return _ref31.apply(this, arguments);
            }

            return loadBook;
        }()
    }, {
        key: 'getBookInfo',
        value: function () {
            var _ref32 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee31() {
                return _regeneratorRuntime.wrap(function _callee31$(_context31) {
                    while (1) {
                        switch (_context31.prev = _context31.next) {
                            case 0:
                                return _context31.abrupt('return', this._viewModel.BookInfo);

                            case 1:
                            case 'end':
                                return _context31.stop();
                        }
                    }
                }, _callee31, this);
            }));

            function getBookInfo() {
                return _ref32.apply(this, arguments);
            }

            return getBookInfo;
        }()
    }, {
        key: 'getGridData',
        value: function () {
            var _ref33 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee32(pageId) {
                return _regeneratorRuntime.wrap(function _callee32$(_context32) {
                    while (1) {
                        switch (_context32.prev = _context32.next) {
                            case 0:
                                return _context32.abrupt('return', this._viewModel.GridData.filter(function (x) {
                                    return x.Id === pageId;
                                })[0]);

                            case 1:
                            case 'end':
                                return _context32.stop();
                        }
                    }
                }, _callee32, this);
            }));

            function getGridData(_x28) {
                return _ref33.apply(this, arguments);
            }

            return getGridData;
        }()
    }, {
        key: 'getRowsForRemove',
        value: function () {
            var _ref34 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee33(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee33$(_context33) {
                    while (1) {
                        switch (_context33.prev = _context33.next) {
                            case 0:
                                return _context33.abrupt('return', false);

                            case 1:
                            case 'end':
                                return _context33.stop();
                        }
                    }
                }, _callee33, this);
            }));

            function getRowsForRemove(_x29, _x30) {
                return _ref34.apply(this, arguments);
            }

            return getRowsForRemove;
        }()
    }, {
        key: 'removeGroupRows',
        value: function () {
            var _ref35 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee34(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee34$(_context34) {
                    while (1) {
                        switch (_context34.prev = _context34.next) {
                            case 0:
                                return _context34.abrupt('return', false);

                            case 1:
                            case 'end':
                                return _context34.stop();
                        }
                    }
                }, _callee34, this);
            }));

            function removeGroupRows(_x31, _x32) {
                return _ref35.apply(this, arguments);
            }

            return removeGroupRows;
        }()
    }, {
        key: 'getBookXml',
        value: function () {
            var _ref36 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee35() {
                return _regeneratorRuntime.wrap(function _callee35$(_context35) {
                    while (1) {
                        switch (_context35.prev = _context35.next) {
                            case 0:
                                throw Error('Not implemented');

                            case 1:
                            case 'end':
                                return _context35.stop();
                        }
                    }
                }, _callee35, this);
            }));

            function getBookXml() {
                return _ref36.apply(this, arguments);
            }

            return getBookXml;
        }()
    }, {
        key: 'setLanguage',
        value: function () {
            var _ref37 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee36(langCode) {
                return _regeneratorRuntime.wrap(function _callee36$(_context36) {
                    while (1) {
                        switch (_context36.prev = _context36.next) {
                            case 0:
                                _context36.next = 2;
                                return this.getBookInfo();

                            case 2:
                                return _context36.abrupt('return', _context36.sent);

                            case 3:
                            case 'end':
                                return _context36.stop();
                        }
                    }
                }, _callee36, this);
            }));

            function setLanguage(_x33) {
                return _ref37.apply(this, arguments);
            }

            return setLanguage;
        }()
    }, {
        key: 'getBookChangeIndex',
        value: function () {
            var _ref38 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee37() {
                return _regeneratorRuntime.wrap(function _callee37$(_context37) {
                    while (1) {
                        switch (_context37.prev = _context37.next) {
                            case 0:
                                return _context37.abrupt('return', 0);

                            case 1:
                            case 'end':
                                return _context37.stop();
                        }
                    }
                }, _callee37, this);
            }));

            function getBookChangeIndex() {
                return _ref38.apply(this, arguments);
            }

            return getBookChangeIndex;
        }()
    }, {
        key: 'resetBookChangeIndex',
        value: function () {
            var _ref39 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee38() {
                return _regeneratorRuntime.wrap(function _callee38$(_context38) {
                    while (1) {
                        switch (_context38.prev = _context38.next) {
                            case 0:
                                return _context38.abrupt('return', 0);

                            case 1:
                            case 'end':
                                return _context38.stop();
                        }
                    }
                }, _callee38, this);
            }));

            function resetBookChangeIndex() {
                return _ref39.apply(this, arguments);
            }

            return resetBookChangeIndex;
        }()
    }, {
        key: 'getInputCellInfo',
        value: function () {
            var _ref40 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee39(cellId) {
                return _regeneratorRuntime.wrap(function _callee39$(_context39) {
                    while (1) {
                        switch (_context39.prev = _context39.next) {
                            case 0:
                                return _context39.abrupt('return', false);

                            case 1:
                            case 'end':
                                return _context39.stop();
                        }
                    }
                }, _callee39, this);
            }));

            function getInputCellInfo(_x34) {
                return _ref40.apply(this, arguments);
            }

            return getInputCellInfo;
        }()
    }, {
        key: 'setInputCellValue',
        value: function () {
            var _ref41 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee40(cellId, value) {
                return _regeneratorRuntime.wrap(function _callee40$(_context40) {
                    while (1) {
                        switch (_context40.prev = _context40.next) {
                            case 0:
                                return _context40.abrupt('return', false);

                            case 1:
                            case 'end':
                                return _context40.stop();
                        }
                    }
                }, _callee40, this);
            }));

            function setInputCellValue(_x35, _x36) {
                return _ref41.apply(this, arguments);
            }

            return setInputCellValue;
        }()
    }, {
        key: 'setInputCellValuesBlock',
        value: function () {
            var _ref42 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee41(pageId, rowStart, colStart, valsJson) {
                return _regeneratorRuntime.wrap(function _callee41$(_context41) {
                    while (1) {
                        switch (_context41.prev = _context41.next) {
                            case 0:
                                return _context41.abrupt('return', false);

                            case 1:
                            case 'end':
                                return _context41.stop();
                        }
                    }
                }, _callee41, this);
            }));

            function setInputCellValuesBlock(_x37, _x38, _x39, _x40) {
                return _ref42.apply(this, arguments);
            }

            return setInputCellValuesBlock;
        }()
    }]);

    return BookDataProviderView;
}(BookDataProviderBase);

var BookDataProviderWasm = function (_BookDataProviderBase2) {
    _inherits(BookDataProviderWasm, _BookDataProviderBase2);

    function BookDataProviderWasm() {
        _classCallCheck(this, BookDataProviderWasm);

        return _possibleConstructorReturn(this, (BookDataProviderWasm.__proto__ || Object.getPrototypeOf(BookDataProviderWasm)).apply(this, arguments));
    }

    _createClass(BookDataProviderWasm, [{
        key: 'loadBook',

        /**
         * @param {{
         *  xmlContent: string,
         *  langCode: string
         * }} args
         */
        value: function () {
            var _ref43 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee42(args) {
                var xmlContent, langCode, MAX_CONTENT_LENGTH, contentParts, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15, part, bookInfo;

                return _regeneratorRuntime.wrap(function _callee42$(_context42) {
                    while (1) {
                        switch (_context42.prev = _context42.next) {
                            case 0:
                                xmlContent = args.xmlContent, langCode = args.langCode;
                                MAX_CONTENT_LENGTH = 1000000;
                                contentParts = chunkSubstr(xmlContent, MAX_CONTENT_LENGTH);
                                _iteratorNormalCompletion15 = true;
                                _didIteratorError15 = false;
                                _iteratorError15 = undefined;
                                _context42.prev = 6;

                                for (_iterator15 = contentParts[Symbol.iterator](); !(_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done); _iteratorNormalCompletion15 = true) {
                                    part = _step15.value;

                                    this._gridInvoke("AppendContent", [part]);
                                }
                                _context42.next = 14;
                                break;

                            case 10:
                                _context42.prev = 10;
                                _context42.t0 = _context42['catch'](6);
                                _didIteratorError15 = true;
                                _iteratorError15 = _context42.t0;

                            case 14:
                                _context42.prev = 14;
                                _context42.prev = 15;

                                if (!_iteratorNormalCompletion15 && _iterator15.return) {
                                    _iterator15.return();
                                }

                            case 17:
                                _context42.prev = 17;

                                if (!_didIteratorError15) {
                                    _context42.next = 20;
                                    break;
                                }

                                throw _iteratorError15;

                            case 20:
                                return _context42.finish(17);

                            case 21:
                                return _context42.finish(14);

                            case 22:
                                bookInfo = this._gridloadBook('content');

                                if (!(langCode && bookInfo.CurLangCode !== langCode)) {
                                    _context42.next = 27;
                                    break;
                                }

                                _context42.next = 26;
                                return this.setLanguage(langCode);

                            case 26:
                                bookInfo = _context42.sent;

                            case 27:
                                _context42.next = 29;
                                return this.resetBookChangeIndex();

                            case 29:
                                return _context42.abrupt('return', bookInfo);

                            case 30:
                            case 'end':
                                return _context42.stop();
                        }
                    }
                }, _callee42, this, [[6, 10, 14, 22], [15,, 17, 21]]);
            }));

            function loadBook(_x41) {
                return _ref43.apply(this, arguments);
            }

            return loadBook;
        }()

        /**
         * @param {string} method
         * @param {any} args
         * @param {boolean} rawResult
         * @private
         */

    }, {
        key: '_gridInvoke',
        value: function _gridInvoke(method, args, rawResult) {
            console.time(method);
            var json = Module.mono_call_static_method("[SpreadsheetWasm] SpreadsheetWasm.GridCalculator:" + method, args);
            var ret = undefined;
            if (rawResult) {
                ret = json;
            } else if (json !== undefined) {
                ret = JSON.parse(json);
            }
            console.timeEnd(method);
            return ret;
        }
    }, {
        key: '_gridloadBook',
        value: function _gridloadBook(content) {
            return this._gridInvoke('LoadBook', [content]);
        }
    }, {
        key: 'getBookInfo',
        value: function () {
            var _ref44 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee43() {
                return _regeneratorRuntime.wrap(function _callee43$(_context43) {
                    while (1) {
                        switch (_context43.prev = _context43.next) {
                            case 0:
                                return _context43.abrupt('return', this._gridInvoke('GetBookInfo', []));

                            case 1:
                            case 'end':
                                return _context43.stop();
                        }
                    }
                }, _callee43, this);
            }));

            function getBookInfo() {
                return _ref44.apply(this, arguments);
            }

            return getBookInfo;
        }()
    }, {
        key: 'getGridData',
        value: function () {
            var _ref45 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee44(pageId) {
                var ret;
                return _regeneratorRuntime.wrap(function _callee44$(_context44) {
                    while (1) {
                        switch (_context44.prev = _context44.next) {
                            case 0:
                                ret = this._gridInvoke("GetGridData", [pageId]);
                                return _context44.abrupt('return', addGridDataCellById(ret));

                            case 2:
                            case 'end':
                                return _context44.stop();
                        }
                    }
                }, _callee44, this);
            }));

            function getGridData(_x42) {
                return _ref45.apply(this, arguments);
            }

            return getGridData;
        }()
    }, {
        key: 'getRowsForRemove',
        value: function () {
            var _ref46 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee45(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee45$(_context45) {
                    while (1) {
                        switch (_context45.prev = _context45.next) {
                            case 0:
                                return _context45.abrupt('return', this._gridInvoke('GetRowsForRemove', [pageId, rowIndex]));

                            case 1:
                            case 'end':
                                return _context45.stop();
                        }
                    }
                }, _callee45, this);
            }));

            function getRowsForRemove(_x43, _x44) {
                return _ref46.apply(this, arguments);
            }

            return getRowsForRemove;
        }()
    }, {
        key: 'removeGroupRows',
        value: function () {
            var _ref47 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee46(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee46$(_context46) {
                    while (1) {
                        switch (_context46.prev = _context46.next) {
                            case 0:
                                return _context46.abrupt('return', this._gridInvoke('RemoveGroupRows', [pageId, rowIndex]));

                            case 1:
                            case 'end':
                                return _context46.stop();
                        }
                    }
                }, _callee46, this);
            }));

            function removeGroupRows(_x45, _x46) {
                return _ref47.apply(this, arguments);
            }

            return removeGroupRows;
        }()
    }, {
        key: 'getBookXml',
        value: function () {
            var _ref48 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee47() {
                return _regeneratorRuntime.wrap(function _callee47$(_context47) {
                    while (1) {
                        switch (_context47.prev = _context47.next) {
                            case 0:
                                return _context47.abrupt('return', this._gridInvoke('GetBookXml', [], true));

                            case 1:
                            case 'end':
                                return _context47.stop();
                        }
                    }
                }, _callee47, this);
            }));

            function getBookXml() {
                return _ref48.apply(this, arguments);
            }

            return getBookXml;
        }()
    }, {
        key: 'setLanguage',
        value: function () {
            var _ref49 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee48(langCode) {
                return _regeneratorRuntime.wrap(function _callee48$(_context48) {
                    while (1) {
                        switch (_context48.prev = _context48.next) {
                            case 0:
                                return _context48.abrupt('return', this._gridInvoke('SetLanguage', [langCode]));

                            case 1:
                            case 'end':
                                return _context48.stop();
                        }
                    }
                }, _callee48, this);
            }));

            function setLanguage(_x47) {
                return _ref49.apply(this, arguments);
            }

            return setLanguage;
        }()
    }, {
        key: 'getBookChangeIndex',
        value: function () {
            var _ref50 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee49() {
                return _regeneratorRuntime.wrap(function _callee49$(_context49) {
                    while (1) {
                        switch (_context49.prev = _context49.next) {
                            case 0:
                                return _context49.abrupt('return', this._gridInvoke('GetBookChangeIndex', []));

                            case 1:
                            case 'end':
                                return _context49.stop();
                        }
                    }
                }, _callee49, this);
            }));

            function getBookChangeIndex() {
                return _ref50.apply(this, arguments);
            }

            return getBookChangeIndex;
        }()
    }, {
        key: 'resetBookChangeIndex',
        value: function () {
            var _ref51 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee50() {
                return _regeneratorRuntime.wrap(function _callee50$(_context50) {
                    while (1) {
                        switch (_context50.prev = _context50.next) {
                            case 0:
                                return _context50.abrupt('return', this._gridInvoke('ResetBookChangeIndex', []));

                            case 1:
                            case 'end':
                                return _context50.stop();
                        }
                    }
                }, _callee50, this);
            }));

            function resetBookChangeIndex() {
                return _ref51.apply(this, arguments);
            }

            return resetBookChangeIndex;
        }()
    }, {
        key: 'getInputCellInfo',
        value: function () {
            var _ref52 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee51(cellId) {
                return _regeneratorRuntime.wrap(function _callee51$(_context51) {
                    while (1) {
                        switch (_context51.prev = _context51.next) {
                            case 0:
                                return _context51.abrupt('return', this._gridInvoke('GetInputCellInfo', [cellId]));

                            case 1:
                            case 'end':
                                return _context51.stop();
                        }
                    }
                }, _callee51, this);
            }));

            function getInputCellInfo(_x48) {
                return _ref52.apply(this, arguments);
            }

            return getInputCellInfo;
        }()
    }, {
        key: 'setInputCellValue',
        value: function () {
            var _ref53 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee52(cellId, value) {
                return _regeneratorRuntime.wrap(function _callee52$(_context52) {
                    while (1) {
                        switch (_context52.prev = _context52.next) {
                            case 0:
                                return _context52.abrupt('return', this._gridInvoke('SetInputCellValue', [cellId, value]));

                            case 1:
                            case 'end':
                                return _context52.stop();
                        }
                    }
                }, _callee52, this);
            }));

            function setInputCellValue(_x49, _x50) {
                return _ref53.apply(this, arguments);
            }

            return setInputCellValue;
        }()
    }, {
        key: 'setInputCellValuesBlock',
        value: function () {
            var _ref54 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee53(pageId, rowStart, colStart, valsJson) {
                return _regeneratorRuntime.wrap(function _callee53$(_context53) {
                    while (1) {
                        switch (_context53.prev = _context53.next) {
                            case 0:
                                return _context53.abrupt('return', this._gridInvoke('SetInputCellValuesBlock', [pageId, rowStart, colStart, valsJson]));

                            case 1:
                            case 'end':
                                return _context53.stop();
                        }
                    }
                }, _callee53, this);
            }));

            function setInputCellValuesBlock(_x51, _x52, _x53, _x54) {
                return _ref54.apply(this, arguments);
            }

            return setInputCellValuesBlock;
        }()
    }, {
        key: 'getBookViewModel',
        value: function () {
            var _ref55 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee54() {
                return _regeneratorRuntime.wrap(function _callee54$(_context54) {
                    while (1) {
                        switch (_context54.prev = _context54.next) {
                            case 0:
                                return _context54.abrupt('return', this._gridInvoke('GetBookViewModel', []));

                            case 1:
                            case 'end':
                                return _context54.stop();
                        }
                    }
                }, _callee54, this);
            }));

            function getBookViewModel() {
                return _ref55.apply(this, arguments);
            }

            return getBookViewModel;
        }()
    }]);

    return BookDataProviderWasm;
}(BookDataProviderBase);

var BookDataProviderServer = function (_BookDataProviderBase3) {
    _inherits(BookDataProviderServer, _BookDataProviderBase3);

    function BookDataProviderServer() {
        _classCallCheck(this, BookDataProviderServer);

        return _possibleConstructorReturn(this, (BookDataProviderServer.__proto__ || Object.getPrototypeOf(BookDataProviderServer)).apply(this, arguments));
    }

    _createClass(BookDataProviderServer, [{
        key: 'loadBook',
        value: function () {
            var _ref56 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee55(args) {
                return _regeneratorRuntime.wrap(function _callee55$(_context55) {
                    while (1) {
                        switch (_context55.prev = _context55.next) {
                            case 0:
                            case 'end':
                                return _context55.stop();
                        }
                    }
                }, _callee55, this);
            }));

            function loadBook(_x55) {
                return _ref56.apply(this, arguments);
            }

            return loadBook;
        }()
    }, {
        key: 'getBookInfo',
        value: function () {
            var _ref57 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee56() {
                return _regeneratorRuntime.wrap(function _callee56$(_context56) {
                    while (1) {
                        switch (_context56.prev = _context56.next) {
                            case 0:
                            case 'end':
                                return _context56.stop();
                        }
                    }
                }, _callee56, this);
            }));

            function getBookInfo() {
                return _ref57.apply(this, arguments);
            }

            return getBookInfo;
        }()
    }, {
        key: 'getGridData',
        value: function () {
            var _ref58 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee57(pageId) {
                return _regeneratorRuntime.wrap(function _callee57$(_context57) {
                    while (1) {
                        switch (_context57.prev = _context57.next) {
                            case 0:
                            case 'end':
                                return _context57.stop();
                        }
                    }
                }, _callee57, this);
            }));

            function getGridData(_x56) {
                return _ref58.apply(this, arguments);
            }

            return getGridData;
        }()
    }, {
        key: 'getRowsForRemove',
        value: function () {
            var _ref59 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee58(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee58$(_context58) {
                    while (1) {
                        switch (_context58.prev = _context58.next) {
                            case 0:
                            case 'end':
                                return _context58.stop();
                        }
                    }
                }, _callee58, this);
            }));

            function getRowsForRemove(_x57, _x58) {
                return _ref59.apply(this, arguments);
            }

            return getRowsForRemove;
        }()
    }, {
        key: 'removeGroupRows',
        value: function () {
            var _ref60 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee59(pageId, rowIndex) {
                return _regeneratorRuntime.wrap(function _callee59$(_context59) {
                    while (1) {
                        switch (_context59.prev = _context59.next) {
                            case 0:
                            case 'end':
                                return _context59.stop();
                        }
                    }
                }, _callee59, this);
            }));

            function removeGroupRows(_x59, _x60) {
                return _ref60.apply(this, arguments);
            }

            return removeGroupRows;
        }()
    }, {
        key: 'getBookXml',
        value: function () {
            var _ref61 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee60() {
                return _regeneratorRuntime.wrap(function _callee60$(_context60) {
                    while (1) {
                        switch (_context60.prev = _context60.next) {
                            case 0:
                            case 'end':
                                return _context60.stop();
                        }
                    }
                }, _callee60, this);
            }));

            function getBookXml() {
                return _ref61.apply(this, arguments);
            }

            return getBookXml;
        }()
    }, {
        key: 'setLanguage',
        value: function () {
            var _ref62 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee61(langCode) {
                return _regeneratorRuntime.wrap(function _callee61$(_context61) {
                    while (1) {
                        switch (_context61.prev = _context61.next) {
                            case 0:
                            case 'end':
                                return _context61.stop();
                        }
                    }
                }, _callee61, this);
            }));

            function setLanguage(_x61) {
                return _ref62.apply(this, arguments);
            }

            return setLanguage;
        }()
    }, {
        key: 'getBookChangeIndex',
        value: function () {
            var _ref63 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee62() {
                return _regeneratorRuntime.wrap(function _callee62$(_context62) {
                    while (1) {
                        switch (_context62.prev = _context62.next) {
                            case 0:
                                return _context62.abrupt('return', 0);

                            case 1:
                            case 'end':
                                return _context62.stop();
                        }
                    }
                }, _callee62, this);
            }));

            function getBookChangeIndex() {
                return _ref63.apply(this, arguments);
            }

            return getBookChangeIndex;
        }()
    }, {
        key: 'resetBookChangeIndex',
        value: function () {
            var _ref64 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee63() {
                return _regeneratorRuntime.wrap(function _callee63$(_context63) {
                    while (1) {
                        switch (_context63.prev = _context63.next) {
                            case 0:
                            case 'end':
                                return _context63.stop();
                        }
                    }
                }, _callee63, this);
            }));

            function resetBookChangeIndex() {
                return _ref64.apply(this, arguments);
            }

            return resetBookChangeIndex;
        }()
    }, {
        key: 'getInputCellInfo',
        value: function () {
            var _ref65 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee64(cellId) {
                return _regeneratorRuntime.wrap(function _callee64$(_context64) {
                    while (1) {
                        switch (_context64.prev = _context64.next) {
                            case 0:
                            case 'end':
                                return _context64.stop();
                        }
                    }
                }, _callee64, this);
            }));

            function getInputCellInfo(_x62) {
                return _ref65.apply(this, arguments);
            }

            return getInputCellInfo;
        }()
    }, {
        key: 'setInputCellValue',
        value: function () {
            var _ref66 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee65(cellId, value) {
                return _regeneratorRuntime.wrap(function _callee65$(_context65) {
                    while (1) {
                        switch (_context65.prev = _context65.next) {
                            case 0:
                            case 'end':
                                return _context65.stop();
                        }
                    }
                }, _callee65, this);
            }));

            function setInputCellValue(_x63, _x64) {
                return _ref66.apply(this, arguments);
            }

            return setInputCellValue;
        }()
    }, {
        key: 'setInputCellValuesBlock',
        value: function () {
            var _ref67 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee66(pageId, rowStart, colStart, valsJson) {
                return _regeneratorRuntime.wrap(function _callee66$(_context66) {
                    while (1) {
                        switch (_context66.prev = _context66.next) {
                            case 0:
                            case 'end':
                                return _context66.stop();
                        }
                    }
                }, _callee66, this);
            }));

            function setInputCellValuesBlock(_x65, _x66, _x67, _x68) {
                return _ref67.apply(this, arguments);
            }

            return setInputCellValuesBlock;
        }()
    }]);

    return BookDataProviderServer;
}(BookDataProviderBase);