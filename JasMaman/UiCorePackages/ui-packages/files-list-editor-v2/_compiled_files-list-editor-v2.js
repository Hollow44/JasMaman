"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var FilesListEditorV2 = /*#__PURE__*/function (_React$Component) {
  function FilesListEditorV2(props) {
    var _this;
    _classCallCheck(this, FilesListEditorV2);
    _this = _callSuper(this, FilesListEditorV2, [props]);
    _defineProperty(_this, "onDragLeave", function (event) {
      event.preventDefault();
    });
    _defineProperty(_this, "onDragOver", function (event) {
      event.preventDefault();
    });
    _defineProperty(_this, "onDrop", function (event) {
      event.preventDefault();
      event.dataTransfer.files.forEach(function (file) {
        _this.handleFile(file);
      });
    });
    _this.state = {
      name: _this.props.name,
      readonly: _this.props.readonly,
      files: _this.props.files ? _this.props.files.map(function (file, index) {
        file.index = index;
        file.fileExtension = file.fileName.split(".")[file.fileName.split(".").length - 1];
        file.fileUpLoaded = true;
        file.fileUpLoadProgress = 100;
        return file;
      }) : [],
      settings: _this.props.settings,
      valid: _this.props.valid,
      errors: _this.props.errors,
      creatorDevice: null
    };
    _this.setCreatorDevice = _this.setCreatorDevice.bind(_this);
    _this.getHumanReadableFileSize = _this.getHumanReadableFileSize.bind(_this);
    _this.addFile = _this.addFile.bind(_this);
    _this.setFile = _this.setFile.bind(_this);
    _this.onProgress = _this.onProgress.bind(_this);
    _this.fileSended = _this.fileSended.bind(_this);
    _this.fileNotSended = _this.fileNotSended.bind(_this);
    _this.handleFile = _this.handleFile.bind(_this);
    _this.handleFileChange = _this.handleFileChange.bind(_this);
    _this.onDragLeave = _this.onDragLeave.bind(_this);
    _this.onDragOver = _this.onDragOver.bind(_this);
    _this.onDrop = _this.onDrop.bind(_this);
    _this.removeFile = _this.removeFile.bind(_this);
    _this.getFileExtensionIcon = _this.getFileExtensionIcon.bind(_this);
    _this.headRef = React.createRef();
    return _this;
  }
  _inherits(FilesListEditorV2, _React$Component);
  return _createClass(FilesListEditorV2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var $this = this;
      $this.setCreatorDevice();
      $(window).resize(function () {
        $this.setCreatorDevice();
      });
    }
  }, {
    key: "setCreatorDevice",
    value: function setCreatorDevice() {
      var _this2 = this;
      this.setState(function (state) {
        return {
          creatorDevice: $(_this2.headRef.current).width() <= 768 ? "Phone" : "Computer"
        };
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(oldProps) {
      var _this3 = this;
      if (this.props.files && this.state.files.map(function (x) {
        return x.fileName;
      }).join("") !== this.props.files.map(function (x) {
        return x.fileName;
      }).join("") || this.props.readonly !== this.state.readonly) {
        this.setState(function (state) {
          return {
            files: _this3.props.files,
            readonly: _this3.props.readonly
          };
        });
      }
    }
  }, {
    key: "getHumanReadableFileSize",
    value: function getHumanReadableFileSize(fileSize) {
      function getBaseLog(x, y) {
        return Math.log(x) / Math.log(y);
      }
      var suf = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
      if (fileSize == 0) {
        return "0" + suf[0];
      }
      var bytes = Math.abs(fileSize);
      var place = Math.abs(Math.floor(getBaseLog(bytes, 1024)));
      var num = Math.round(bytes / Math.pow(1024, place), 2);
      return "".concat((Math.sign(fileSize) * num).toFixed(2)).replace(".", ",") + suf[place];
    }
  }, {
    key: "addFile",
    value: function addFile(file) {
      var files = this.state.files;
      file.index = files.length;
      files.push(file);
      if (this.props.onChange) {
        console.log('send file changes');
        this.props.onChange(files.filter(function (x) {
          return x.Removed !== true;
        }).map(function (file, index) {
          file.index = index;
          return file;
        }));
      }
      this.setState({
        files: files
      });
      return file.index;
    }
  }, {
    key: "setFile",
    value: function setFile(index, file) {
      var files = this.state.files;
      file.index = index;
      files[index] = file;
      if (files.filter(function (x) {
        return isNullOrUndefined(x.fileUpLoaded);
      }).length == 0 && this.props.onChange) {
        console.log('send file changes');
        this.props.onChange(files.filter(function (x) {
          return x.Removed !== true;
        }).map(function (file, index) {
          file.index = index;
          return file;
        }));
      }
      this.setState({
        files: files
      });
    }
  }, {
    key: "onProgress",
    value: function onProgress(index, percent) {
      console.log('File ' + index + '. ' + percent + '%');
      var files = this.state.files;
      var file = files[index];
      file.fileUpLoadProgress = percent;
      this.setFile(index, file);
    }
  }, {
    key: "fileSended",
    value: function fileSended(index, file) {
      console.log('File ' + index + ' sended.');
      console.log(file);
      file.fileName = file.FileName;
      file.fileId = file.FileId;
      file.fileSize = file.FileSize;
      file.humanReadableFileSize = file.HumanReadableFileSize;
      file.downloadUrl = file.DownloadUrl;
      file.fileExtension = file.fileName.split(".")[file.fileName.split(".").length - 1];
      file.fileUpLoaded = true;
      file.fileUpLoadProgress = 100;
      this.setFile(index, file);
    }
  }, {
    key: "fileNotSended",
    value: function fileNotSended(index, message) {
      console.log('File ' + index + ' not sended.');
      console.log(message);
      var files = this.state.files;
      var file = files[index];
      file.fileUpLoaded = false;
      file.fileException = message;
      file.fileUpLoadProgress = null;
      this.setFile(index, file);
    }
  }, {
    key: "handleFile",
    value: function handleFile(file) {
      var _this4 = this;
      if (!file) return;
      var index = this.addFile({
        fileName: file.name,
        fileExtension: file.name.split(".")[file.name.split(".").length - 1],
        fileSize: file.size,
        humanReadableFileSize: this.getHumanReadableFileSize(file.size),
        fileUpLoaded: null,
        fileUpLoadProgress: 0
      });
      console.log('File ' + index + ' sending.');
      console.log(file);
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('POST', this.state.settings.fileUploadUrl);
      xhr.upload.onprogress = function (event) {
        _this4.onProgress(index, Math.round(event.loaded / event.total * 100));
      };
      xhr.onload = function () {
        if (xhr.status === 200 && xhr.response.result === "OK") _this4.fileSended(index, xhr.response.savedFiles[0]);else _this4.fileNotSended(index, xhr.response.message);
      };
      xhr.onerror = function () {
        _this4.fileNotSended(index, T("Не удалось отправить файл"));
      };
      var myData = new FormData();
      myData.append('__RequestVerificationToken', $('input[name="__RequestVerificationToken"]').val());
      myData.append(file.name, file);
      myData.append('descriptions', JSON.stringify([{
        fileName: file.name
      }]));
      xhr.send(myData);

      //xhr.abort()
    }
  }, {
    key: "handleFileChange",
    value: function handleFileChange(event) {
      var _this5 = this;
      event.target.files.forEach(function (file) {
        _this5.handleFile(file);
      });
    }
  }, {
    key: "removeFile",
    value: function removeFile(index) {
      console.log('File ' + index + '. ' + ' Remove');
      var files = this.state.files;
      var file = files[index];
      file.Removed = true;
      this.setFile(index, file);
    }
  }, {
    key: "getFileExtensionIcon",
    value: function getFileExtensionIcon(extension, fileUpLoaded) {
      //if (fileUpLoaded === false) {
      //    return "mdi mdi-file-remove-outline";
      //}
      //if (fileUpLoaded !== true) {
      //    return "mdi mdi-file-clock-outline";
      //}
      if (isNullOrUndefined(fileUpLoaded)) {
        return "mdi mdi-file-clock-outline";
      }
      extension = extension.toLowerCase();
      switch (extension) {
        case "pdf":
          return "mdi mdi-file-pdf-outline";
        case "xls":
        case "xlsx":
          return "mdi mdi-file-excel-outline";
        case "doc":
        case "docx":
          return "mdi mdi-file-word-outline";
        case "jpg":
        case "jpeg":
        case "png":
          return "mdi mdi-file-image-outline";
        case "json":
        case "cs":
        case "html":
        case "css":
        case "scss":
        case "js":
        case "jsx":
          return "mdi mdi-file-code-outline";
        case "txt":
          return "mdi mdi-file-document-outline";
        default:
          return "mdi mdi-file-outline";
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this6 = this;
      if (this.state.creatorDevice == "Phone") {
        return /*#__PURE__*/React.createElement("div", {
          className: "user-select-none",
          ref: this.headRef
        }, !this.state.readonly && /*#__PURE__*/React.createElement("div", {
          className: "btn " + (this.state.valid ? "btn-dark" : "btn-danger") + " btn-sm" + (this.state.files.filter(function (x) {
            return x.Removed !== true;
          }).length > 0 ? " mb-2" : ""),
          style: {
            "position": "relative"
          },
          onDrop: this.onDrop,
          onDragOver: this.onDragOver,
          onDragLeave: this.onDragLeave
        }, /*#__PURE__*/React.createElement("label", {
          className: "w-100 h-100",
          style: {
            "position": "absolute",
            "left": "0",
            "top": "0"
          }
        }, /*#__PURE__*/React.createElement("input", {
          type: "file",
          className: "d-none",
          onChange: this.handleFileChange,
          multiple: "multiple",
          value: []
        })), T("Прикрепить файлы")), !this.state.valid && /*#__PURE__*/React.createElement("div", {
          className: "text-danger"
        }, this.state.errors.map(function (error) {
          return /*#__PURE__*/React.createElement("div", null, error);
        })), /*#__PURE__*/React.createElement("input", {
          type: "text",
          className: "d-none",
          id: this.state.name,
          name: this.state.name,
          value: JSON.stringify(this.state.files.filter(function (x) {
            return x.Removed !== true;
          }))
        }), this.state.files.filter(function (x) {
          return x.Removed !== true;
        }).map(function (file) {
          return /*#__PURE__*/React.createElement("div", {
            className: "pb-2",
            key: file.index
          }, /*#__PURE__*/React.createElement("a", {
            href: _this6.state.readonly ? file.downloadUrl : null
          }, /*#__PURE__*/React.createElement("div", {
            className: "row align-items-center"
          }, /*#__PURE__*/React.createElement("div", {
            className: "col text-break"
          }, /*#__PURE__*/React.createElement("a", {
            className: !_this6.state.readonly ? "text-muted" : "text-primary",
            href: _this6.state.readonly ? file.downloadUrl : null
          }, file.fileName)), !_this6.state.readonly && /*#__PURE__*/React.createElement("div", {
            className: "col-auto"
          }, /*#__PURE__*/React.createElement("a", {
            className: "text-danger border-bottom border-danger",
            onClick: function onClick() {
              return _this6.removeFile(file.index);
            }
          }, T("Удалить")))), isNullOrUndefined(file.fileUpLoaded) && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
            className: "rounded text-center",
            style: {
              "position": "relative"
            }
          }, /*#__PURE__*/React.createElement("div", {
            className: "h-100 rounded bg-success",
            style: {
              "opacity": "0.5",
              "position": "absolute",
              "left": "0",
              "top": "0",
              "width": file.fileUpLoadProgress + "%"
            }
          }), /*#__PURE__*/React.createElement("div", null, file.fileUpLoadProgress + "%"))), file.fileUpLoaded === false && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", {
            className: "text-danger"
          }, file.fileException))));
        }));
      } else {
        return /*#__PURE__*/React.createElement("div", {
          className: "user-select-none",
          ref: this.headRef
        }, !this.state.readonly && /*#__PURE__*/React.createElement("div", {
          className: "rounded bg-white text-center p-3" + (this.state.valid ? "" : " border-danger"),
          style: {
            "position": "relative",
            "border": "2px dashed #dee2e6"
          },
          onDrop: this.onDrop,
          onDragOver: this.onDragOver,
          onDragLeave: this.onDragLeave
        }, /*#__PURE__*/React.createElement("label", {
          className: "w-100 h-100",
          style: {
            "position": "absolute",
            "left": "0",
            "top": "0"
          }
        }, /*#__PURE__*/React.createElement("input", {
          type: "file",
          className: "d-none",
          onChange: this.handleFileChange,
          multiple: "multiple",
          value: []
        })), /*#__PURE__*/React.createElement("i", {
          className: "h2 text-muted dripicons-cloud-upload"
        }), /*#__PURE__*/React.createElement("h4", null, T("Перенесите файлы или нажмите сюда, чтобы загрузить"))), !this.state.valid && /*#__PURE__*/React.createElement("div", null, this.state.errors.map(function (error) {
          return /*#__PURE__*/React.createElement("div", {
            className: "text-danger"
          }, error);
        })), /*#__PURE__*/React.createElement("input", {
          type: "text",
          className: "d-none",
          id: this.state.name,
          name: this.state.name,
          value: JSON.stringify(this.state.files.filter(function (x) {
            return x.Removed !== true;
          }))
        }), this.state.files.filter(function (x) {
          return x.Removed !== true;
        }).map(function (file) {
          return /*#__PURE__*/React.createElement("div", {
            className: "card mt-1 mb-0 shadow-none border dz-processing dz-error dz-complete",
            key: file.index
          }, /*#__PURE__*/React.createElement("div", {
            className: "p-2"
          }, /*#__PURE__*/React.createElement("div", {
            className: "row align-items-center"
          }, /*#__PURE__*/React.createElement("div", {
            className: "col-auto pr-0"
          }, /*#__PURE__*/React.createElement("div", {
            className: "avatar-sm rounded bg-light text-center " + _this6.getFileExtensionIcon(file.fileExtension, file.fileUpLoaded),
            style: {
              "fontSize": "2rem"
            }
          })), /*#__PURE__*/React.createElement("div", {
            className: (file.fileUpLoaded === true ? "col" : "col-auto") + " text-break"
          }, /*#__PURE__*/React.createElement("a", {
            className: "font-weight-bold" + (!_this6.state.readonly ? " text-muted" : " text-primary"),
            href: _this6.state.readonly ? file.downloadUrl : null
          }, file.fileName), /*#__PURE__*/React.createElement("p", {
            className: "mb-0"
          }, /*#__PURE__*/React.createElement("strong", null, file.humanReadableFileSize))), isNullOrUndefined(file.fileUpLoaded) && /*#__PURE__*/React.createElement("div", {
            className: "col"
          }, /*#__PURE__*/React.createElement("div", {
            className: "rounded text-center",
            style: {
              "position": "relative"
            }
          }, /*#__PURE__*/React.createElement("div", {
            className: "h-100 rounded bg-success",
            style: {
              "opacity": "0.5",
              "position": "absolute",
              "left": "0",
              "top": "0",
              "width": file.fileUpLoadProgress + "%"
            }
          }), /*#__PURE__*/React.createElement("div", null, file.fileUpLoadProgress + "%"))), file.fileUpLoaded === false && /*#__PURE__*/React.createElement("div", {
            className: "col"
          }, /*#__PURE__*/React.createElement("strong", {
            className: "text-danger"
          }, file.fileException)), !_this6.state.readonly && /*#__PURE__*/React.createElement("div", {
            className: "col-auto"
          }, /*#__PURE__*/React.createElement("a", {
            className: "btn btn-link btn-lg text-muted",
            onClick: function onClick() {
              return _this6.removeFile(file.index);
            }
          }, /*#__PURE__*/React.createElement("i", {
            className: "dripicons-cross"
          }))))));
        }));
      }
    }
  }]);
}(React.Component);
$(document).ready(function ($) {
  InitFilesListEditorV2();
});
function InitFilesListEditorV2() {
  $(".files-list-editor-v2").each(function () {
    var $this = $(this);
    var name = $this.data("name");
    var readonly = $this.data("readonly").toLowerCase() == "true";
    var files = $this.data("files");
    var settings = $this.data("settings");
    var valid = $this.data("valid").toLowerCase() == "true";
    var errors = $this.data("errors");
    ReactDOM.render( /*#__PURE__*/React.createElement(FilesListEditorV2, {
      name: name,
      readonly: readonly,
      files: files,
      settings: settings,
      valid: valid,
      errors: errors
    }), this);
  });
}