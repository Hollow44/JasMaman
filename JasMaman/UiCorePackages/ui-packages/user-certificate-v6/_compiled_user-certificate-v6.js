var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// NCALayer instance
var ncaLayer = function () {
    var ncaUrl = 'wss://127.0.0.1:13579/';

    var ret = {
        // General exec
        exec: function exec(method, args, onExecuted, onConnectError) {
            if (!onConnectError) {
                onConnectError = onExecuted;
            }
            var socket = new WebSocket(ncaUrl);
            socket.onopen = function () {
                // console.log("Connection opened");

                var lang = rootDir.replaceAll('/', '');
                if (lang == 'kz') {
                    lang = 'kk';
                }

                var data = JSON.stringify({
                    //"module": "kz.gov.pki.knca.commonUtils",
                    //"method": method,
                    //"args": args

                    "module": "kz.gov.pki.knca.basics",
                    "method": "sign",
                    "args": {

                        allowedStorages: ["PKCS12"],
                        data: args[0],
                        format: "cms",
                        locale: lang,
                        signerParams: { extKeyUsageOids: [], chain: [] },

                        //decode - false по умолчанию. Если true, то data будет декодировано из base64
                        //encapsulate - true по умолчанию, встраивает значение в cms.Если false, то будет detached
                        signingParams: { decode: "true", encapsulate: "false", digested: "false", tsaProfile: null }
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
        _registerAPI: function _registerAPI(method, args) {
            var argsStr = args.join();
            var funcText = 'this.' + method + ' = function (' + argsStr + ', callback, onConnectError) {\n' + '	this.exec("' + method + '", [' + argsStr + '], callback, onConnectError);\n' + '}';
            eval(funcText);
        }
    };

    // -------------- NCA Layer API ------------------ //
    ret._registerAPI("signCmsByNcaLayer", ["base64ToSign"]);

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

    return ret;
}();

(function ($) {

    function CertInfo(_ref) {
        var certInfo = _ref.certInfo;

        return React.createElement(
            'div',
            { className: 'cert-info-container p-3 mt-3 mt-xl-0', style: { lineHeight: 1 } },
            React.createElement(
                'table',
                { className: 'cert-info-table' },
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            '\u041A\u043E\u043C\u0443 \u0432\u044B\u0434\u0430\u043D'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            certInfo.Owner
                        )
                    )
                ),
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            '\u041A\u0435\u043C \u0432\u044B\u0434\u0430\u043D'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            certInfo.Issuer
                        )
                    )
                ),
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u0435\u043D'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            '\u0441 ',
                            certInfo.ValidFrom,
                            ' \u043F\u043E ',
                            certInfo.ValidTo
                        )
                    )
                ),
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            '\u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u043A\u043B\u044E\u0447\u0430'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            certInfo.Alg
                        )
                    )
                ),
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            '\u0418\u0418\u041D'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            certInfo.IIN
                        )
                    )
                ),
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            '\u0411\u0418\u041D'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            certInfo.BIN
                        )
                    )
                ),
                React.createElement(
                    'tr',
                    null,
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-title' },
                            'E-Mail'
                        )
                    ),
                    React.createElement(
                        'td',
                        null,
                        React.createElement(
                            'div',
                            { className: 'cert-info-attr-value' },
                            certInfo.Email
                        )
                    )
                )
            )
        );
    }

    var UserCertificateV6 = function (_React$Component) {
        _inherits(UserCertificateV6, _React$Component);

        function UserCertificateV6(props) {
            _classCallCheck(this, UserCertificateV6);

            var _this = _possibleConstructorReturn(this, (UserCertificateV6.__proto__ || Object.getPrototypeOf(UserCertificateV6)).call(this, props));

            _this.state = {
                editorName: _this.props.editorName,
                useOwnContainer: _this.props.useOwnContainer,
                ncaLayerStatus: "OK",
                ncaLayerMessage: null,
                selectCertButtonEnabled: true,
                dataToSign: _this.props.editorValue.DataToSign,
                signDataUrl: _this.props.editorValue.SignDataUrl,
                signDataUrlQrImageSrc: _this.props.editorValue.SignDataUrlQrImageSrc,
                dataSignCheckUrl: _this.props.editorValue.DataSignCheckUrl,
                signData: _this.props.editorValue.SignData,
                egovAppStoreUrl: _this.props.certAlgType == "Rsa" ? "https://onelink.to/2ceg7w" : "https://onelink.to/j3b7fv",
                egovAppType: _this.props.certAlgType == "Rsa" ? "Mobile" : "Business"
            };
            _this.setNcaLayerState = _this.setNcaLayerState.bind(_this);
            _this.handleNcaLayerConnectError = _this.handleNcaLayerConnectError.bind(_this);
            _this.setSelectCertButtonEnabled = _this.setSelectCertButtonEnabled.bind(_this);
            _this.selectCert = _this.selectCert.bind(_this);
            _this.setSignData = _this.setSignData.bind(_this);
            _this.checkMobileSign = _this.checkMobileSign.bind(_this);
            return _this;
        }

        _createClass(UserCertificateV6, [{
            key: 'handleNcaLayerConnectError',
            value: function handleNcaLayerConnectError(ret) {
                if (ret.errorCode === "CONNECTION_ERROR") {
                    this.setNcaLayerState({
                        status: ret.code,
                        message: "<div class='nca-layer-error-dlg'>" + " <div class='main-info'>" + "Для функции подписи требуется программа «NCALayer» " + "</div> " + " <div class='extra-info'>" + "Программу «<a href='https://pki.gov.kz/ncalayer/' target='_blank'>NCALayer</a>» необходимо установить и запустить, согласно <a href='https://pki.gov.kz/docs/nl_ru/windows/' target='_blank'>инструкции</a>" + "</div> " + " <div class='links'>Ссылки:</div> " + " <ul>" + "  <li><a href='https://pki.gov.kz/docs/nl_ru/windows/' target='_blank'>Инструкция по настройке «NCALayer» на сайте НУЦ РК</a></li>" + "  <li><a href='https://pki.gov.kz/ncalayer/' target='_blank'>Скачать «NCALayer»</a></li>" + " </ul> " + " <div class='extra-steps-container'>" + "  <span class='extra-steps-header'>Если программа установлена и запущена, но появляется данное сообщение...</span>" + "  <div class='extra-steps'>" + "   <ul>" + "    <li>Для <b>Mozilla Firefox</b> потребуется <b>вручную</b> установить корневые сертификаты в браузер согласно инструкции по установке «NCALayer»</li>" + "    <li>Попробуйте <b>переустановить</b> программу от имени <b>администратора</b> ПК, следуя инструкции по установке «NCALayer»</li>" + "   </ul> " + "  </div>" + "</div> " + "</div>"
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
                        message: "<div class='nca-layer-error-dlg'>" + " <div class='main-info'>" + "Прослойка NCA Layer не корректно отработала запрос, убедитесь, что параметры вашего прокси сервера указаны в настройках NCA Layer" + "</div> " + "</div>"
                    });
                    return true;
                }
                return false;
            }
        }, {
            key: 'setNcaLayerState',
            value: function setNcaLayerState(model) {
                this.setState(function (state) {
                    return {
                        ncaLayerStatus: model.status,
                        ncaLayerMessage: model.message
                    };
                });
            }
        }, {
            key: 'setSelectCertButtonEnabled',
            value: function setSelectCertButtonEnabled(status) {
                this.setState(function (state) {
                    return {
                        selectCertButtonEnabled: status
                    };
                });
            }
        }, {
            key: 'selectCert',
            value: function selectCert() {
                var $self = this;
                $self.setSelectCertButtonEnabled(false);
                function b64EncodeUnicode(str) {
                    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
                        return String.fromCharCode('0x' + p1);
                    }));
                };
                var base64String = b64EncodeUnicode($self.state.dataToSign);
                ncaLayer.signCmsByNcaLayer(base64String, function (ret) {
                    $self.setSelectCertButtonEnabled(true);
                    if ($self.handleNcaLayerConnectError(ret)) {
                        return;
                    }

                    if (ret.body.result == undefined) {
                        return;
                    }

                    var singedCmsData = ret.body.result.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");
                    var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
                    $self.setSignData(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem);
                });
            }
        }, {
            key: 'setSignData',
            value: function setSignData(signedDataCms, certificate, certificatePem) {
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

                function getCertificateAlgorithmName(oid) {
                    var dgstmap = {
                        "2.16.840.1.101.3.4.2.1": "SHA-256",
                        "2.16.840.1.101.3.4.2.3": "SHA-512",
                        "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
                        "1.2.398.3.10.1.1.1.2": "ГОСТ 34.310",
                        "1.2.398.3.10.1.1.2.3.2": "ГОСТ 34.310 2015"
                    };
                    return dgstmap[oid] || oid;
                }
                function getCertAttributeValue(certificateAttributes, attributeId) {
                    var attr = certificateAttributes.typesAndValues.find(function (x) {
                        return x.type == attributeId;
                    });
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

                this.setState(function (state) {
                    return {
                        signData: { CertInfo: certInfo, CertInBase64: certPem, SignedData: signedDataCms }
                    };
                });
                clearInterval($self.interval);
                console.log("ПОХОДУ РАБОТАЕТ! БОЛЬШЕ НЕ БУДУ ПРОВЕРЯТЬ!");
            }
        }, {
            key: 'checkMobileSign',
            value: function checkMobileSign() {
                var $self = this;
                console.log('\u041F\u0420\u041E\u0412\u0415\u0420\u041A\u0410 \u041F\u041E\u0414\u041F\u0418\u0421\u0418 EGOV ' + $self.state.egovAppType + ' - ' + $self.state.dataSignCheckUrl);
                jQuery.ajax({
                    type: "GET",
                    url: $self.state.dataSignCheckUrl,
                    dataType: "json",
                    success: function success(ret) {
                        console.log("ОТВЕТ ПРИШЕЛ!");
                        console.log(ret);
                        console.log("ЕСЛИ ВСЁ-ТАКИ РЕЗУЛЬТАТ ОТЛИЧАЕТСЯ ОТ NCALayer, ТО СЕЙЧАС БУДЕТ МНОГО КРАСНОГО!");

                        if ($self.handleNcaLayerConnectError(ret)) {
                            return;
                        }

                        if (ret.body.result == undefined) {
                            return;
                        }

                        var singedCmsData = ret.body.result.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");
                        var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
                        $self.setSignData(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem);
                    },
                    error: function error(xhr, ajaxOptions, thrownError) {
                        console.log("ОШИБКА!");
                        console.log(xhr.status);
                        console.log(thrownError);
                        console.log("МОЖЕТ В СЛЕДУЮЩИЙ РАЗ ПОЛУЧИТСЯ!");
                    }
                });
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                var _this2 = this;

                var seconds = 5;
                console.log('\u041F\u0420\u041E\u0412\u0415\u0420\u042F\u042E \u0421\u0421\u042B\u041B\u041A\u0423 \u041A\u0410\u0416\u0414\u042B\u0415 ' + seconds + ' \u0421\u0415\u041A\u0423\u041D\u0414!');
                this.interval = setInterval(function () {
                    _this2.checkMobileSign();
                }, seconds * 1000);
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                clearInterval(this.interval);
            }
        }, {
            key: 'render',
            value: function render() {
                var _this3 = this;

                var Modal = ReactBootstrap.Modal;
                var Button = ReactBootstrap.Button;
                var Row = ReactBootstrap.Row;
                var Col = ReactBootstrap.Col;

                return React.createElement(
                    'div',
                    { className: this.state.useOwnContainer ? "user-certificate-v6-container p-3" : null },
                    React.createElement('input', { type: 'hidden', name: this.state.editorName, value: JSON.stringify({ SignData: this.state.signData, DataToSign: this.state.dataToSign, SignDataUrl: this.state.signDataUrl, SignDataUrlQrImageSrc: this.state.signDataUrlQrImageSrc, DataSignCheckUrl: this.state.dataSignCheckUrl }) }),
                    React.createElement(
                        Row,
                        { className: 'd-none d-sm-flex' },
                        React.createElement(
                            Col,
                            { xl: this.state.signData === null ? 12 : 7 },
                            React.createElement(
                                Row,
                                { className: 'h-100' },
                                React.createElement(
                                    Col,
                                    { className: 'col-auto' },
                                    React.createElement('img', { className: 'e-gov-mobile-qr', src: this.state.signDataUrlQrImageSrc, alt: 'eGov Mobile QR' })
                                ),
                                React.createElement(
                                    Col,
                                    { className: 'info-container' },
                                    React.createElement(
                                        'div',
                                        null,
                                        React.createElement(
                                            'strong',
                                            null,
                                            '\u0414\u043B\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u043E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 eGov ',
                                            this.state.egovAppType,
                                            React.createElement('br', null),
                                            '\u0438\u043B\u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430'
                                        ),
                                        React.createElement('br', null),
                                        React.createElement(
                                            'span',
                                            { className: 'btn btn-primary my-1', role: 'button', onClick: function onClick() {
                                                    if (_this3.state.selectCertButtonEnabled) {
                                                        _this3.selectCert();
                                                    }
                                                } },
                                            'C\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0438\u0437 \u0444\u0430\u0439\u043B\u0430'
                                        ),
                                        React.createElement('br', null),
                                        React.createElement(
                                            'span',
                                            { className: 'text-secondary' },
                                            '\u0424\u0443\u043D\u043A\u0446\u0438\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0443 \xABNCALayer\xBB \u041D\u0423\u0426 \u0420\u041A'
                                        )
                                    ),
                                    React.createElement(
                                        'div',
                                        { style: { lineHeight: 1 } },
                                        React.createElement(
                                            'span',
                                            null,
                                            '1. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 eGov ',
                                            this.state.egovAppType,
                                            ' \u043D\u0430 \u0412\u0430\u0448\u0435\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435'
                                        ),
                                        React.createElement('br', null),
                                        React.createElement(
                                            'span',
                                            null,
                                            '2. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0441\u043A\u0430\u043D\u0435\u0440 QR \u0432 \u043F\u0440\u0430\u0432\u043E\u043C \u0432\u0435\u0440\u0445\u043D\u0435\u043C \u0443\u0433\u043B\u0443 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B'
                                        ),
                                        React.createElement('br', null),
                                        React.createElement(
                                            'span',
                                            null,
                                            '3. \u041D\u0430\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u043D\u0430 \u044D\u0442\u043E\u0442 \u044D\u043A\u0440\u0430\u043D, \u0447\u0442\u043E\u0431\u044B \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043A\u043E\u0434'
                                        )
                                    )
                                )
                            )
                        ),
                        this.state.signData === null ? null : React.createElement(
                            Col,
                            { xl: 5 },
                            React.createElement(CertInfo, {
                                certInfo: this.state.signData.CertInfo
                            })
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'd-block d-sm-none' },
                        React.createElement(
                            'strong',
                            null,
                            '\u0414\u043B\u044F \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u043D\u0430\u043B\u0438\u0447\u0438\u0435 \u043C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F ',
                            React.createElement(
                                'span',
                                { className: 'text-primary' },
                                React.createElement(
                                    'a',
                                    { href: this.state.egovAppStoreUrl },
                                    'eGov ',
                                    this.state.egovAppType
                                )
                            )
                        ),
                        React.createElement('br', null),
                        React.createElement(
                            'span',
                            { className: 'text-secondary' },
                            '\u041F\u043E\u0441\u043B\u0435 \u043D\u0430\u0436\u0430\u0442\u0438\u044F \u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u0443 \u0432\u044B \u0431\u0443\u0434\u0435\u0442\u0435 \u043F\u0435\u0440\u0435\u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B \u0432 eGov ',
                            this.state.egovAppType
                        ),
                        React.createElement('br', null),
                        React.createElement(
                            'a',
                            { className: 'd-block btn btn-primary mt-3', href: this.state.signDataUrl },
                            '\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u0442\u044C \u0432 eGov ',
                            this.state.egovAppType
                        ),
                        this.state.signData === null ? null : React.createElement(CertInfo, {
                            certInfo: this.state.signData.CertInfo
                        })
                    ),
                    React.createElement(
                        Modal,
                        { show: !["OK", "CLOSED"].includes(this.state.ncaLayerStatus), onHide: function onHide() {
                                return _this3.setNcaLayerState({ status: "CLOSED", message: null });
                            }, centered: true },
                        React.createElement(
                            Modal.Header,
                            null,
                            '\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u043A NCALayer',
                            React.createElement(
                                'span',
                                { className: 'close', onClick: function onClick() {
                                        return _this3.setNcaLayerState({ status: "CLOSED", message: null });
                                    } },
                                '\xD7'
                            )
                        ),
                        React.createElement(Modal.Body, { dangerouslySetInnerHTML: { __html: this.state.ncaLayerMessage } })
                    )
                );
            }
        }]);

        return UserCertificateV6;
    }(React.Component);

    $(".user-certificate-v6").each(function () {
        var readonly = $(this).data("readonly") == "True";
        if (!readonly) {
            var certAlgType = $(this).data("certAlgType");
            var editorName = $(this).data("editorName");
            var editorValue = $(this).data("editorValue");
            var useOwnContainer = $(this).data("useOwnContainer") == "True";
            ReactDOM.render(React.createElement(UserCertificateV6, {
                certAlgType: certAlgType,
                editorName: editorName,
                editorValue: editorValue,
                useOwnContainer: useOwnContainer
            }), this);
        }
    });
})(jQuery);