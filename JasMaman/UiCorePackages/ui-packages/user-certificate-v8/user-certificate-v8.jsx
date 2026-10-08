// NCALayer instance
var ncaLayer = function () {
    var ncaUrl = 'wss://127.0.0.1:13579/';

    var ret = {
        // General exec
        exec: function (method, args, onExecuted, onConnectError) {
            if (!onConnectError) {
                onConnectError = onExecuted;
            }
            var socket = new WebSocket(ncaUrl);
            socket.onopen = function () {
                var lang = rootDir.replaceAll('/', '');
                if (lang == 'kz') {
                    lang = 'kk'
                }

                var data = JSON.stringify({
                    //"module": "kz.gov.pki.knca.commonUtils",
                    //"method": method,
                    //"args": args

                    "module": "kz.gov.pki.knca.basics",
                    "method": "sign",
                    "args": {
                        allowedStorages: [
                            "AKKaztokenStore",
                            "AKKZIDCardStore",
                            "AKEToken72KStore",
                            "AKEToken5110Store",
                            "AKJaCartaStore",
                            "PKCS12"
                        ],
                        data: args[0],
                        format: "cms",
                        locale: lang,
                        signerParams: {
                            //extKeyUsageOids: args[1],
                            extKeyUsageOids: [],
                            chain: []
                        },

                        //decode - false по умолчанию. Если true, то data будет декодировано из base64
                        //encapsulate - true по умолчанию, встраивает значение в cms.Если false, то будет detached
                        signingParams: {
                            decode: "true", encapsulate: "true", digested: "false",

                            //tsaProfile: null //отключена TSP метка
                            tsaProfile: {} //включена TSP метка
                        }
                    }
                });
                socket.send(data);
            };

            socket.onclose = function (event) {
                if (!event.wasClean) {
                    var data = {
                        statusCode: "CONNECTION_ERROR",
                        statusDescription: "Не удалось подключиться к прослойке NCA Layer. Убедитесь, что приложение запущенно",
                        errorCode: "CONNECTION_ERROR"
                    };
                    onConnectError(data);
                }
            };

            socket.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if (!data.errorCode && data.result && data.result.version) {
                    return; // Эти *безответственные* в восьмой версии стали в ответку отсылать сообщение с версией на любой вызов...
                }
                socket.close();
                if (data.code === "200") {
                    data.statusCode = "OK";
                    data.statusDescription = "Выполнено успешно";
                } else if (data.code === "500") {
                    data.statusCode = data.code;
                    data.statusDescription = "Прослойка NCA Layer не корректно отработала запрос, убедитесь, что параметры вашего прокси сервера указаны в настройках NCA Layer";
                } else {
                    if (!data.errorCode) {
                        data.errorCode = "UNKNOWN";
                    }
                    data.statusCode = data.code;
                    data.statusDescription = "NCA Layer возвратил ошибку";
                }
                onExecuted(data);
            };
        },
        _registerAPI: function (method, args) {
            var argsStr = args.join();
            var funcText =
                'this.' + method + ' = function (' + argsStr + ', callback, onConnectError) {\n' +
                '	this.exec("' + method + '", [' + argsStr + '], callback, onConnectError);\n' +
                '}';
            eval(funcText);
        }
    };

    // -------------- NCA Layer API ------------------ //
    ret._registerAPI("signCmsByNcaLayer", ["base64ToSign", "keyUsageOids"]);

    // -------------- NCA Layer Extended API ------------------ //
    ret.getCertPem = function (storageName, storagePath, alias, password, onExecuted, onConnectError) {
        this.signXml(storageName, storagePath, alias, password, "<xml></xml>", function (ret) {
            if (ret.errorCode == "NONE") {
                try {
                    ret.result = $(ret.result).find("ds\\:X509Certificate").text().trim();
                } catch (ex) {
                    ret.errorCode = "PARSE_ERROR";
                    ret.statusCode = "ERROR";
                    ret.statusDescription = "Parse XML error";
                    ret.result = "";
                }
            }
            onExecuted(ret);
        }, onConnectError);
    };

    return (ret);
}();

function CertInfo({
    certInfo
}) {
    return (
        <div className="card mb-0 bg-white font-weight-600 lh-1 p-3 mt-xl-0">
            <div className="row lh-base">
                <div className="col text-uppercase fw-800 font-16 d-flex align-items-center">{certInfo.Owner}</div>
                <div className="col-auto d-flex justify-content-end"><div className="check-icon bg-check-icon"></div></div>
            </div>
            <div className="lh-1">
                <span>{T("Действителен")}:</span>
                <span className="pl-2 text-break">с {certInfo.ValidFrom} по {certInfo.ValidTo}</span>
            </div>
            <div className="lh-1">
                <span>{T("ИИН")}:</span>
                <span className="pl-2 text-break">{certInfo.IIN}</span>
            </div>
            {certInfo.BIN &&
                <div className="lh-1">
                    <span>{T("БИН")}:</span>
                    <span className="pl-2 text-break">{certInfo.BIN}</span>
                </div>
            }
            {/*<div className="lh-base">*/}
            {/*    <span>E-Mail:</span>*/}
            {/*    <span className="pl-2 text-break">{certInfo.Email}</span>*/}
            {/*</div>*/}
        </div>
    );
}

class UserCertificateV8 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.name,
            valid: this.props.valid,
            errors: this.props.errors,
            ncaLayerStatus: "OK",
            ncaLayerMessage: null,
            selectCertButtonEnabled: true,

            dataToSign: this.props.value.dataToSign,

            initQrSignDataId: this.props.value.initQrSignDataId,
            keyUsageOids: this.props.value.keyUsageOids,

            signMobileDeepLink: null,

            signQrImageBase64: null,

            getSignResUrl: null,

            signData: null,
            egovAppStoreUrl: null,
            egovAppType: null,

            selfWidth: 0,
            windowWidth: 0,
        };
        this.setWidths = this.setWidths.bind(this);
        this.setNcaLayerState = this.setNcaLayerState.bind(this);
        this.handleNcaLayerConnectError = this.handleNcaLayerConnectError.bind(this);
        this.setSelectCertButtonEnabled = this.setSelectCertButtonEnabled.bind(this);
        this.selectCert = this.selectCert.bind(this);
        this.setSignData = this.setSignData.bind(this);
        this.checkMobileSign = this.checkMobileSign.bind(this);

        this.selfRef = React.createRef();
    }

    setWidths() {
        this.setState(state => ({
            selfWidth: $(this.selfRef.current).width(),
            windowWidth: $(window).width(),
        }));
    }

    handleNcaLayerConnectError(ret) {
        if (ret.errorCode === "CONNECTION_ERROR") {
            this.setNcaLayerState({
                status: ret.code,
                message: "<div class='nca-layer-error-dlg'>" +
                    " <div class='main-info'>" +
                    "Для функции подписи требуется программа «NCALayer» " +
                    "</div> " +
                    " <div class='extra-info'>" +
                    "Программу «<a href='https://pki.gov.kz/ncalayer/' target='_blank'>NCALayer</a>» необходимо установить и запустить, согласно <a href='https://pki.gov.kz/docs/nl_ru/windows/' target='_blank'>инструкции</a>" +
                    "</div> " +
                    " <div class='links'>Ссылки:</div> " +
                    " <ul>" +
                    "  <li><a href='https://pki.gov.kz/docs/nl_ru/windows/' target='_blank'>Инструкция по настройке «NCALayer» на сайте НУЦ РК</a></li>" +
                    "  <li><a href='https://pki.gov.kz/ncalayer/' target='_blank'>Скачать «NCALayer»</a></li>" +
                    " </ul> " +
                    " <div class='extra-steps-container'>" +
                    "  <span class='extra-steps-header'>Если программа установлена и запущена, но появляется данное сообщение...</span>" +
                    "  <div class='extra-steps'>" +
                    "   <ul>" +
                    "    <li>Для <b>Mozilla Firefox</b> потребуется <b>вручную</b> установить корневые сертификаты в браузер согласно инструкции по установке «NCALayer»</li>" +
                    "    <li>Попробуйте <b>переустановить</b> программу от имени <b>администратора</b> ПК, следуя инструкции по установке «NCALayer»</li>" +
                    "   </ul> " +
                    "  </div>" +
                    "</div> " +
                    "</div>"
            });
            return true;
        }
        if (ret.message == "action.canceled") {
            this.setNcaLayerState({
                status: "CLOSED",
                message: null
            });
            return true;
        }
        if (ret.code == "500") {
            this.setNcaLayerState({
                status: ret.code,
                message: "<div class='nca-layer-error-dlg'>" +
                    " <div class='main-info'>" +
                    "Прослойка NCA Layer не корректно отработала запрос, убедитесь, что параметры вашего прокси сервера указаны в настройках NCA Layer" +
                    "</div> " +
                    "</div>"
            });
            return true;
        }
        return false;
    }

    setNcaLayerState(model) {
        this.setState(state => ({
            ncaLayerStatus: model.status,
            ncaLayerMessage: model.message
        }));
    }

    setSelectCertButtonEnabled(status) {
        this.setState(state => ({
            selectCertButtonEnabled: status
        }));
    }

    selectCert() {
        var $self = this;
        $self.setSelectCertButtonEnabled(false);
        function b64EncodeUnicode(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
        };
        var base64String = b64EncodeUnicode($self.state.dataToSign);
        ncaLayer.signCmsByNcaLayer(base64String, $self.state.keyUsageOids, function (ret) {
            $self.setSelectCertButtonEnabled(true);
            if ($self.handleNcaLayerConnectError(ret)) {
                return;
            }

            if (ret.body.result == undefined) {
                return;
            }

            var cmsStr = ret.body.result.constructor === Array
                ? ret.body.result[0]
                : ret.body.result;
            var singedCmsData = cmsStr.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");
            var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
            $self.setSignData(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem);
        });
    }

    setSignData(signedDataCms, certificate, certificatePem) {
        var $self = this;

        var certPem = null;
        var certInfo = {
            Owner: null,
            Issuer: null,
            ValidFrom: null,
            ValidTo: null,
            Alg: null,
            IIN: null,
            BIN: null,
            Email: null
        };

        function getCertificateAlgorithmName(oid){
            var dgstmap = {
                "2.16.840.1.101.3.4.2.1": "SHA-256",
                "2.16.840.1.101.3.4.2.3": "SHA-512",
                "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
                "1.2.398.3.10.1.1.1.2": "ГОСТ 34.310",
                "1.2.398.3.10.1.1.2.3.2": "ГОСТ 34.310 2015"
            };
            return dgstmap[oid] || oid;
        }
        function getCertAttributeValue(certificateAttributes, attributeId){
            var attr = certificateAttributes.typesAndValues.find(x => x.type == attributeId);
            if (attr === undefined) {
                return "";
            }
            return attr.value.valueBlock.value;
        }
        function getOwnerAttr(attrId) {
            return getCertAttributeValue(certificate.subject, attrId);
        }
        function getIssuerAttr(attrId) {
            return getCertAttributeValue(certificate.issuer, attrId);
        }

        certInfo.Alg = getCertificateAlgorithmName(certificate.signatureAlgorithm.algorithmId);
        certPem = certificatePem;
        certPem = certPem.replace('-----BEGIN CERTIFICATE-----', '');
        certPem = certPem.replace('-----END CERTIFICATE-----', '');
        certInfo.ValidFrom = certificate.notBefore.value.toLocaleDateString();
        certInfo.ValidTo = certificate.notAfter.value.toLocaleDateString();

        var attrsIds = {
            CN: "2.5.4.3",
            G: "2.5.4.42",
            SERIALNUMBER: "2.5.4.5",
            OU: "2.5.4.11",
            E: "1.2.840.113549.1.9.1"
        };

        certInfo.Owner = (getOwnerAttr(attrsIds.CN) + " " + getOwnerAttr(attrsIds.G)).trim();
        certInfo.IIN = getOwnerAttr(attrsIds.SERIALNUMBER).substring(3);
        certInfo.BIN = getOwnerAttr(attrsIds.OU).substring(3);
        certInfo.Email = getOwnerAttr(attrsIds.E);

        certInfo.Issuer = getIssuerAttr(attrsIds.CN);

        this.setState(state => ({
            signData: { certInfo: certInfo, certInBase64: certPem, signedData: signedDataCms },
        }));
        //clearInterval($self.interval);
    }

    checkMobileSign() {
        var $self = this;
        jQuery.ajax({
            type: "GET",
            url: $self.state.getSignResUrl,
            dataType: "json",
            success: function (ret) {
                if ($self.handleNcaLayerConnectError(ret)) {
                    return;
                }

                if (ret.body.result == undefined) {
                    return;
                }

                var cmsStr = ret.body.result.constructor === Array
                    ? ret.body.result[0]
                    : ret.body.result;
                var singedCmsData = cmsStr.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");

                var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
                $self.setSignData(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
            }
        });
    }

    initMobileSign() {
        var $self = this;
        jQuery.ajax({
            type: "GET",
            url: '/get-egov-qr-sign-urls?init-qr-id=' + this.state.initQrSignDataId,
            dataType: "json",
            success: function (ret) {
                if (ret.success) {
                    $self.setState({
                        signMobileDeepLink: ret.egovAppType === "EgovBusiness" ? ret.signBusinessMobileUrl : ret.signMobileUrl,
                        signQrImageBase64: ret.signQrImageBase64,
                        getSignResUrl: ret.getSignResUrl,
                        egovAppStoreUrl: ret.egovAppType !== "EgovBusiness" ? "https://onelink.to/2ceg7w" : "https://onelink.to/j3b7fv",
                        egovAppType: ret.egovAppType
                    });
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
            }
        });
    }

    componentDidMount() {
        let $this = this;

        $this.setWidths();
        $(window).resize(function () {
            $this.setWidths();
        });

        $this.initMobileSign();

        var seconds = 5;
        $this.interval = setInterval(() => {
            $this.checkMobileSign()
        }, seconds * 1000);
    }
    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {

        const Modal = ReactBootstrap.Modal;
        const Button = ReactBootstrap.Button;
        const Row = ReactBootstrap.Row;
        const Col = ReactBootstrap.Col;

        return <div className={"card mb-0 bg-light p-3"} ref={this.selfRef}>
            <input type="hidden" name={this.state.name} value={JSON.stringify({ SignData: this.state.signData, DataToSign: this.state.dataToSign, InitQrSignDataId: this.state.initQrSignDataId })} />

            {this.state.selfWidth <= 380 || this.state.windowWidth <= 768
                ? <div className="">
                    {!isNullOrUndefined(this.state.signData) && !isNullOrUndefined(this.state.signData.certInfo)
                        ?
                        <div className="">
                            <CertInfo
                                certInfo={this.state.signData.certInfo}
                            ></CertInfo>
                            <div className="mt-1"><a className="text-info" href={this.state.signMobileDeepLink}>Подписать в eGov {this.state.egovAppType}</a></div>
                        </div>
                        : <div className="">
                            <div className="font-weight-600 lh-1">Для подписания необходимо наличие мобильного приложения <span className="text-info"><a className="text-info" href={this.state.egovAppStoreUrl}>eGov {this.state.egovAppType}</a></span></div>
                            <div className="text-secondary mt-1 lh-1">После нажатия на кнопку вы будете перенаправлены в eGov {this.state.egovAppType}</div>
                            <Button variant="info" className="rounded-lg w-100 mt-2" href={this.state.signMobileDeepLink}>Подписать в eGov {this.state.egovAppType}</Button>
                        </div>
                    }
                </div>
                : <Row className="h-100">
                    <Col className="col-auto">
                        <div className="rounded-5 bg-white p-2">
                            {this.state.signQrImageBase64
                                ? <img className="rounded-lg e-gov-mobile-qr bg-white" src={this.state.signQrImageBase64} alt="eGov Mobile QR" />
                                : <div className="rounded-lg e-gov-mobile-qr bg-white e-gov-mobile-qr-not-loaded d-flex align-items-center text-center p-4 lh-1 fw-800">{T("Не удалось загрузить QR")}</div>
                            }
                        </div>
                    </Col>
                    {!isNullOrUndefined(this.state.signData) && !isNullOrUndefined(this.state.signData.certInfo)
                        ?
                        <Col>
                            <CertInfo
                                certInfo={this.state.signData.certInfo}
                            ></CertInfo>
                            <div className="mt-1"><a className="text-info" onClick={() => { if (this.state.selectCertButtonEnabled) { this.selectCert(); } }}>Выбрать другой сертификат из файла</a></div>
                        </Col>
                        :
                        <Col>
                            <div className="font-weight-bold lh-1">Для подписания отсканируйте QR в приложении eGov {this.state.egovAppType}<br />или выберите сертификат из файла</div>
                            <Button variant="info" className="rounded-lg my-1" onClick={() => { if (this.state.selectCertButtonEnabled) { this.selectCert(); } }}>Cертификат из файла</Button>
                            <div className="text-secondary lh-1">Функция подписи использует программу «NCALayer» НУЦ РК</div>
                            <div className="mt-1 lh-1">
                                <span>1. Откройте eGov {this.state.egovAppType} на Вашем устройстве</span><br />
                                <span>2. Запустите сканер QR в правом верхнем углу страницы</span><br />
                                <span>3. Наведите телефон на этот экран, чтобы считать код</span>
                            </div>
                        </Col>
                    }
                </Row>
            }

            <Modal contentClassName="rounded-lg" show={!["OK", "CLOSED"].includes(this.state.ncaLayerStatus)} onHide={() => this.setNcaLayerState({ status: "CLOSED", message: null })} centered>
                <Modal.Header>
                    <span className="h4 pl-1 mb-1">{T("Не удалось подключиться к NCALayer")}</span><span className="close py-0 pr-1 my-auto mr-0" onClick={() => this.setNcaLayerState({ status: "CLOSED", message: null })}>×</span>
                </Modal.Header>
                <Modal.Body dangerouslySetInnerHTML={{ __html: this.state.ncaLayerMessage }}>
                </Modal.Body>
            </Modal>
        </div>;
    }
}

(function ($) {
    $(".user-certificate-v8").each(function () {
        var $this = $(this);
        var name = $this.data("name");
        var value = $this.data("value");
        var valid = `${$this.data("valid")}`.toLowerCase() != "false";
        var errors = $this.data("errors");
        ReactDOM.render(
            <UserCertificateV8
                name={name}
                value={value}
                valid={valid}
                errors={errors}
            />,
            this
        );
    });
})(jQuery);