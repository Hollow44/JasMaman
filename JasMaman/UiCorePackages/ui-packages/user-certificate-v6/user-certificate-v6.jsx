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
                // console.log("Connection opened");

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

    return (ret);
}();

(function ($) {

    function CertInfo({
        certInfo
    }) {
        return (
            <div className="cert-info-container p-3 mt-3 mt-xl-0" style={{ lineHeight: 1 }}>
                <table className="cert-info-table">
                    <tr>
                        <td><div className="cert-info-attr-title">Кому выдан</div></td>
                        <td><div className="cert-info-attr-value">{certInfo.Owner}</div></td>
                    </tr>
                    <tr>
                        <td><div className="cert-info-attr-title">Кем выдан</div></td>
                        <td><div className="cert-info-attr-value">{certInfo.Issuer}</div></td>
                    </tr>
                    <tr>
                        <td><div className="cert-info-attr-title">Действителен</div></td>
                        <td><div className="cert-info-attr-value">с {certInfo.ValidFrom} по {certInfo.ValidTo}</div></td>
                    </tr>
                    <tr>
                        <td><div className="cert-info-attr-title">Алгоритм ключа</div></td>
                        <td><div className="cert-info-attr-value">{certInfo.Alg}</div></td>
                    </tr>
                    <tr>
                        <td><div className="cert-info-attr-title">ИИН</div></td>
                        <td><div className="cert-info-attr-value">{certInfo.IIN}</div></td>
                    </tr>
                    <tr>
                        <td><div className="cert-info-attr-title">БИН</div></td>
                        <td><div className="cert-info-attr-value">{certInfo.BIN}</div></td>
                    </tr>
                    <tr>
                        <td><div className="cert-info-attr-title">E-Mail</div></td>
                        <td><div className="cert-info-attr-value">{certInfo.Email}</div></td>
                    </tr>
                </table>
            </div>
        );
    }

    class UserCertificateV6 extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                editorName: this.props.editorName,
                useOwnContainer: this.props.useOwnContainer,
                ncaLayerStatus: "OK",
                ncaLayerMessage: null,
                selectCertButtonEnabled: true,
                dataToSign: this.props.editorValue.DataToSign,
                signDataUrl: this.props.editorValue.SignDataUrl,
                signDataUrlQrImageSrc: this.props.editorValue.SignDataUrlQrImageSrc,
                dataSignCheckUrl: this.props.editorValue.DataSignCheckUrl,
                signData: this.props.editorValue.SignData,
                egovAppStoreUrl: this.props.certAlgType == "Rsa" ? "https://onelink.to/2ceg7w" : "https://onelink.to/j3b7fv",
                egovAppType: this.props.certAlgType == "Rsa" ? "Mobile" : "Business"
            };
            this.setNcaLayerState = this.setNcaLayerState.bind(this);
            this.handleNcaLayerConnectError = this.handleNcaLayerConnectError.bind(this);
            this.setSelectCertButtonEnabled = this.setSelectCertButtonEnabled.bind(this);
            this.selectCert = this.selectCert.bind(this);
            this.setSignData = this.setSignData.bind(this);
            this.checkMobileSign = this.checkMobileSign.bind(this);
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
                signData: { CertInfo: certInfo, CertInBase64: certPem, SignedData: signedDataCms },
            }));
            clearInterval($self.interval);
            console.log("ПОХОДУ РАБОТАЕТ! БОЛЬШЕ НЕ БУДУ ПРОВЕРЯТЬ!");
        }

        checkMobileSign() {
            var $self = this;
            console.log(`ПРОВЕРКА ПОДПИСИ EGOV ${$self.state.egovAppType} - ${$self.state.dataSignCheckUrl}`);
            jQuery.ajax({
                type: "GET",
                url: $self.state.dataSignCheckUrl,
                dataType: "json",
                success: function (ret) {
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
                error: function (xhr, ajaxOptions, thrownError) {
                    console.log("ОШИБКА!");
                    console.log(xhr.status);
                    console.log(thrownError);
                    console.log("МОЖЕТ В СЛЕДУЮЩИЙ РАЗ ПОЛУЧИТСЯ!");
                }
            });
        }

        componentDidMount() {
            var seconds = 5;
            console.log(`ПРОВЕРЯЮ ССЫЛКУ КАЖДЫЕ ${seconds} СЕКУНД!`);
            this.interval = setInterval(() => {
                this.checkMobileSign()
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

            return <div className={this.state.useOwnContainer ? "user-certificate-v6-container p-3" : null }>
                <input type="hidden" name={this.state.editorName} value={JSON.stringify({ SignData: this.state.signData, DataToSign: this.state.dataToSign, SignDataUrl: this.state.signDataUrl, SignDataUrlQrImageSrc: this.state.signDataUrlQrImageSrc, DataSignCheckUrl: this.state.dataSignCheckUrl })} />
                <Row className="d-none d-sm-flex">
                    <Col xl={this.state.signData === null ? 12 : 7}>
                        <Row className="h-100">
                            <Col className="col-auto">
                                <img className="e-gov-mobile-qr" src={this.state.signDataUrlQrImageSrc} alt="eGov Mobile QR" />
                            </Col>
                            <Col className="info-container">
                                <div>
                                    <strong>Для подписания отсканируйте QR в приложении eGov {this.state.egovAppType}<br />или выберите сертификат из файла</strong>
                                    <br />
                                    <span className="btn btn-primary my-1" role="button" onClick={() => { if (this.state.selectCertButtonEnabled) { this.selectCert(); } }}>Cертификат из файла</span>
                                    <br />
                                    <span className="text-secondary">Функция подписи использует программу «NCALayer» НУЦ РК</span>
                                </div>
                                <div style={{ lineHeight: 1 }}>
                                    <span>1. Откройте eGov {this.state.egovAppType} на Вашем устройстве</span><br />
                                    <span>2. Запустите сканер QR в правом верхнем углу страницы</span><br />
                                    <span>3. Наведите телефон на этот экран, чтобы считать код</span>
                                </div>
                            </Col>
                        </Row>
                    </Col>
                        {this.state.signData === null
                            ? 
                                null
                            :
                                <Col xl={5}>
                                    <CertInfo
                                        certInfo={this.state.signData.CertInfo}
                                    ></CertInfo>
                                </Col>
                        }
                </Row>
                <div className="d-block d-sm-none">
                    <strong>Для подписания необходимо наличие мобильного приложения <span className="text-primary"><a href={this.state.egovAppStoreUrl}>eGov {this.state.egovAppType}</a></span></strong>
                    <br />
                    <span className="text-secondary">После нажатия на кнопку вы будете перенаправлены в eGov {this.state.egovAppType}</span>
                    <br />
                    <a className="d-block btn btn-primary mt-3" href={this.state.signDataUrl}>Подписать в eGov {this.state.egovAppType}</a>
                    {this.state.signData === null
                        ?
                        null
                        :
                        <CertInfo
                            certInfo={this.state.signData.CertInfo}
                        ></CertInfo>
                    }
                </div>
                <Modal show={!["OK", "CLOSED"].includes(this.state.ncaLayerStatus)} onHide={() => this.setNcaLayerState({ status: "CLOSED", message: null })} centered>
                    <Modal.Header>
                        Не удалось подключиться к NCALayer<span className="close" onClick={() => this.setNcaLayerState({ status: "CLOSED", message: null })}>×</span>
                    </Modal.Header>
                    <Modal.Body dangerouslySetInnerHTML={{ __html: this.state.ncaLayerMessage }}>

                    </Modal.Body>
                </Modal>
            </div>;
        }
    }

    $(".user-certificate-v6").each(function () {
        var readonly = $(this).data("readonly") == "True";
        if (!readonly) {
            var certAlgType = $(this).data("certAlgType");
            var editorName = $(this).data("editorName");
            var editorValue = $(this).data("editorValue");
            var useOwnContainer = $(this).data("useOwnContainer") == "True";
            ReactDOM.render(
                <UserCertificateV6
                    certAlgType={certAlgType}
                    editorName={editorName}
                    editorValue={editorValue}
                    useOwnContainer={useOwnContainer}
                />,
                this
            );
        }
    });
})(jQuery);