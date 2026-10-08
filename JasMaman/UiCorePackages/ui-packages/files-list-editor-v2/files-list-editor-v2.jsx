class FilesListEditorV2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            readonly: this.props.readonly,
            files: this.props.files ? this.props.files.map((file, index) => {
                file.index = index;
                file.fileExtension = file.fileName.split(".")[file.fileName.split(".").length - 1];
                file.fileUpLoaded = true;
                file.fileUpLoadProgress = 100;
                return file;
            }) : [],
            settings: this.props.settings,
            valid: this.props.valid,
            errors: this.props.errors,
            creatorDevice: null
        };

        this.setCreatorDevice = this.setCreatorDevice.bind(this);
        this.getHumanReadableFileSize = this.getHumanReadableFileSize.bind(this);
        this.addFile = this.addFile.bind(this);
        this.setFile = this.setFile.bind(this);
        this.onProgress = this.onProgress.bind(this);
        this.fileSended = this.fileSended.bind(this);
        this.fileNotSended = this.fileNotSended.bind(this);
        this.handleFile = this.handleFile.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.removeFile = this.removeFile.bind(this);
        this.getFileExtensionIcon = this.getFileExtensionIcon.bind(this);

        this.headRef = React.createRef();
    }

    componentDidMount() {
        let $this = this;
        $this.setCreatorDevice();
        $(window).resize(function () {
            $this.setCreatorDevice();
        });
    }

    setCreatorDevice() {
        this.setState(state => ({
            creatorDevice: $(this.headRef.current).width() <= 768 ? "Phone" : "Computer",
        }));
    }

    componentDidUpdate(oldProps) {
        if (
            (this.props.files && this.state.files.map(x => x.fileName).join("") !== this.props.files.map(x => x.fileName).join(""))
            ||
            this.props.readonly !== this.state.readonly
        ) {
            this.setState(state => ({
                files: this.props.files,
                readonly: this.props.readonly,
            }));
        }
    }

    getHumanReadableFileSize(fileSize) {
        function getBaseLog(x, y) {
            return Math.log(x) / Math.log(y);
        }
        let suf = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
        if (fileSize == 0) {
            return "0" + suf[0];
        }
        let bytes = Math.abs(fileSize);
        let place = Math.abs(Math.floor(getBaseLog(bytes, 1024)));
        let num = Math.round(bytes / Math.pow(1024, place), 2);
        return `${(Math.sign(fileSize) * num).toFixed(2)}`.replace(".", ",") + suf[place];
    }

    addFile(file) {
        let files = this.state.files;
        file.index = files.length;
        files.push(file);
        if (this.props.onChange) {
            console.log('send file changes');
            this.props.onChange(files.filter(x => x.Removed !== true).map((file, index) => {
                file.index = index;
                return file;
            }));
        }
        this.setState({
            files: files
        });
        return file.index;
    }

    setFile(index, file) {
        let files = this.state.files;
        file.index = index;
        files[index] = file;
        if (files.filter(x => isNullOrUndefined(x.fileUpLoaded)).length == 0 && this.props.onChange) {
            console.log('send file changes');
            this.props.onChange(files.filter(x => x.Removed !== true).map((file, index) => {
                file.index = index;
                return file;
            }));
        }
        this.setState({
            files: files
        });
    }

    onProgress(index, percent) {
        console.log('File ' + index + '. ' + percent + '%');
        let files = this.state.files;
        let file = files[index];
        file.fileUpLoadProgress = percent;
        this.setFile(index, file);
    }

    fileSended(index, file) {
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

    fileNotSended(index, message) {
        console.log('File ' + index + ' not sended.');
        console.log(message);

        let files = this.state.files;
        let file = files[index];
        file.fileUpLoaded = false;
        file.fileException = message;
        file.fileUpLoadProgress = null;
        this.setFile(index, file);
    }

    handleFile(file) {
        if (!file) return;

        let index = this.addFile({
            fileName: file.name,
            fileExtension: file.name.split(".")[file.name.split(".").length - 1],
            fileSize: file.size,
            humanReadableFileSize: this.getHumanReadableFileSize(file.size),
            fileUpLoaded: null,
            fileUpLoadProgress: 0,
        });

        console.log('File ' + index + ' sending.');
        console.log(file);

        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';

        xhr.open('POST', this.state.settings.fileUploadUrl);

        xhr.upload.onprogress = (event) => {
            this.onProgress(index, Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
            if (xhr.status === 200 && xhr.response.result === "OK") this.fileSended(index, xhr.response.savedFiles[0]);
            else this.fileNotSended(index, xhr.response.message);
        };
        xhr.onerror = () => {
            this.fileNotSended(index, T("Не удалось отправить файл"))
        }

        const myData = new FormData();
        myData.append('__RequestVerificationToken', $('input[name="__RequestVerificationToken"]').val());
        myData.append(file.name, file);
        myData.append('descriptions', JSON.stringify([{ fileName: file.name }]));

        xhr.send(myData);

        //xhr.abort()
    };

    handleFileChange(event) {
        event.target.files.forEach((file) => {
            this.handleFile(file);
        });
    };

    onDragLeave = (event) => {
        event.preventDefault();
    };

    onDragOver = (event) => {
        event.preventDefault();
    };

    onDrop = (event) => {
        event.preventDefault();
        event.dataTransfer.files.forEach((file) => {
            this.handleFile(file);
        });
    };

    removeFile(index) {
        console.log('File ' + index + '. ' + ' Remove');
        let files = this.state.files;
        let file = files[index];
        file.Removed = true;
        this.setFile(index, file);
    };

    getFileExtensionIcon(extension, fileUpLoaded) {
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
            case "pdf": return "mdi mdi-file-pdf-outline";
            case "xls":
            case "xlsx": return "mdi mdi-file-excel-outline";
            case "doc":
            case "docx": return "mdi mdi-file-word-outline";
            case "jpg":
            case "jpeg":
            case "png": return "mdi mdi-file-image-outline";
            case "json":
            case "cs":
            case "html":
            case "css":
            case "scss":
            case "js":
            case "jsx": return "mdi mdi-file-code-outline";
            case "txt": return "mdi mdi-file-document-outline";
            default: return "mdi mdi-file-outline";
        }
    }

    render() {
        if (this.state.creatorDevice == "Phone") {
            return <div className={"user-select-none"} ref={this.headRef}>
                {!this.state.readonly
                    && <div
                        className={"btn " + (this.state.valid ? "btn-dark" : "btn-danger") + " btn-sm" + (this.state.files.filter(x => x.Removed !== true).length > 0 ? " mb-2" : "")}
                        style={{
                            "position": "relative",
                        }}
                        onDrop={this.onDrop}
                        onDragOver={this.onDragOver}
                        onDragLeave={this.onDragLeave}
                    >
                        <label className="w-100 h-100" style={{
                            "position": "absolute",
                            "left": "0",
                            "top": "0",
                        }}>
                            <input type="file" className="d-none" onChange={this.handleFileChange} multiple="multiple" value={[]} />
                        </label>
                        {T("Прикрепить файлы")}
                    </div>
                }
                {!this.state.valid && (
                    <div className="text-danger">
                        {this.state.errors.map(error => (
                            <div>{error}</div>
                        ))}
                    </div>
                )}
                <input type="text" className="d-none" id={this.state.name} name={this.state.name} value={JSON.stringify(this.state.files.filter(x => x.Removed !== true))} />
                {this.state.files.filter(x => x.Removed !== true).map((file) => {
                    return (<div className="pb-2" key={file.index}>
                        <a href={this.state.readonly ? file.downloadUrl : null}>
                            <div className="row align-items-center">
                                <div className="col text-break">
                                    <a className={!this.state.readonly ? "text-muted" : "text-primary"} href={this.state.readonly ? file.downloadUrl : null}>{file.fileName}</a>
                                </div>
                                {!this.state.readonly
                                    && <div className="col-auto">
                                        <a className="text-danger border-bottom border-danger" onClick={() => this.removeFile(file.index)}>
                                            {T("Удалить")}
                                        </a>
                                    </div>
                                }
                            </div>
                            {isNullOrUndefined(file.fileUpLoaded)
                                && <div>
                                    <div className="rounded text-center" style={{
                                        "position": "relative",
                                    }}>
                                        <div className="h-100 rounded bg-success" style={{
                                            "opacity": "0.5",
                                            "position": "absolute",
                                            "left": "0",
                                            "top": "0",
                                            "width": file.fileUpLoadProgress + "%",
                                        }}>
                                        </div>
                                        <div>{file.fileUpLoadProgress + "%"}</div>
                                    </div>
                                </div>
                            }
                            {file.fileUpLoaded === false && <div><strong className="text-danger">{file.fileException}</strong></div>}
                        </a>
                    </div>);
                })}
            </div>
                ;
        } else {
            return <div className={"user-select-none"} ref={this.headRef}>
                {!this.state.readonly
                    && <div
                        className={"rounded bg-white text-center p-3" + (this.state.valid ? "" : " border-danger")}
                        style={{
                            "position": "relative",
                            "border": "2px dashed #dee2e6",
                        }}
                        onDrop={this.onDrop}
                        onDragOver={this.onDragOver}
                        onDragLeave={this.onDragLeave}
                    >
                        <label className="w-100 h-100" style={{
                            "position": "absolute",
                            "left": "0",
                            "top": "0",
                        }}>
                            <input type="file" className="d-none" onChange={this.handleFileChange} multiple="multiple" value={[]} />
                        </label>
                        <i className="h2 text-muted dripicons-cloud-upload"></i>
                        <h4>{T("Перенесите файлы или нажмите сюда, чтобы загрузить")}</h4>
                    </div>
                }
                {!this.state.valid && (
                    <div>
                        {this.state.errors.map(error => (
                            <div className="text-danger">{error}</div>
                        ))}
                    </div>
                )}
                <input type="text" className="d-none" id={this.state.name} name={this.state.name} value={JSON.stringify(this.state.files.filter(x => x.Removed !== true))} />
                {this.state.files.filter(x => x.Removed !== true).map((file) => {
                    return (<div className="card mt-1 mb-0 shadow-none border dz-processing dz-error dz-complete" key={file.index}>
                        <div className="p-2">
                            <div className="row align-items-center">
                                <div className="col-auto pr-0">
                                    <div className={"avatar-sm rounded bg-light text-center " + this.getFileExtensionIcon(file.fileExtension, file.fileUpLoaded)} style={{
                                        "fontSize": "2rem"
                                    }}></div>
                                </div>
                                <div className={(file.fileUpLoaded === true ? "col" : "col-auto") + " text-break"}>
                                    <a className={"font-weight-bold" + (!this.state.readonly ? " text-muted" : " text-primary")} href={this.state.readonly ? file.downloadUrl : null}>{file.fileName}</a>
                                    <p className="mb-0"><strong>{file.humanReadableFileSize}</strong></p>
                                </div>
                                {isNullOrUndefined(file.fileUpLoaded) && <div className="col">
                                    <div className="rounded text-center" style={{
                                        "position": "relative",
                                    }}>
                                        <div className="h-100 rounded bg-success" style={{
                                            "opacity": "0.5",
                                            "position": "absolute",
                                            "left": "0",
                                            "top": "0",
                                            "width": file.fileUpLoadProgress + "%",
                                        }}>
                                        </div>
                                        <div>{file.fileUpLoadProgress + "%"}</div>
                                    </div>
                                </div>}
                                {file.fileUpLoaded === false && <div className="col"><strong className="text-danger">{file.fileException}</strong></div>}
                                {!this.state.readonly
                                    && <div className="col-auto">
                                        <a className="btn btn-link btn-lg text-muted" onClick={() => this.removeFile(file.index)}>
                                            <i className="dripicons-cross"></i>
                                        </a>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>);
                })}
            </div>
                ;
        }
    }
}

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

        ReactDOM.render(
            <FilesListEditorV2
                name={name}
                readonly={readonly}
                files={files}
                settings={settings}
                valid={valid}
                errors={errors}
            />,
            this
        );

    });
}