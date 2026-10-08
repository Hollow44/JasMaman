(function ($){
	$.widget("crt.certificateSelector", {
		_create: function(){
			var self = this;
			var $this = $(self.element);
			
			$this.append("<div class='cert-selector-container'>");
			$this.append("<label for='cert-selector-file' class='certificate-upload-button'>{0}</label>".format(T("Выбрать сертификат ЭЦП из файла")));
			$this.append("<input type='file' id='cert-selector-file' accept='.p12,.pfx' />");
			$this.append("</div>");

			var $certFile = $("#cert-selector-file", $this);
		    
            $("form").submit(function() {
                $certFile.remove();
		    });
			
            $certFile.click(function(){
				$certFile.val(null);
			});

		    $certFile.change(function(evt) {
		        var reader = new FileReader(); 
				var current_files = evt.target.files; 
		
				reader.onload =	function(event)	{ 
					var p12Der = event.target.result; 
					var p12Asn1 = forge.asn1.fromDer(p12Der, false);

				    var p12 = null;
					var isPasswordValid = false;
				    var localPwd = localStorage.getItem("certSecret");
				    var checkPwd = (localPwd == undefined) ? "123456" : localPwd;
					try {
						p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, checkPwd);
					    if(localPwd == checkPwd) {
                            isPasswordValid = true;  
					    }
					} catch(err){
						if(err.message.indexOf("Invalid password") < 0){
							alert(T("Выбранный вами файл не является файлом ключа"));
							return;
						} else {
							console.log(err.message);
						}
					}
				    
				    if(isPasswordValid) {
				        self._loadP12Cert(p12);
						return;
				    }
                    
					var $prompt = $(
					    "<div class='password-prompt-dlg'>" +
					    " <span class='password-label'>{0}:</span> ".format("Введите пароль") +
					    " <input type='password' class='password-input' />" +
					    " <span class='password-invalid-msg'>{0}</span>".format("Введен некорректный пароль")+
					    "</div>");
					var $pwd = $(".password-input",$prompt);
					var promptOkFunc = function() {
						var password = $pwd.val();
						if(password == ""){
							return;
						}
						try{
							p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);
						} catch (err) {
						    $prompt.addClass("invalid-pwd");
							$pwd.val(null);
							$pwd.focus();
							return;
						}
						$prompt.dialog("close");
						self._loadP12Cert(p12);
					};
					var promptCancelFunc = function(){
						$prompt.dialog("close");
					};
					$prompt.keypress(function(e) {
						if (e.keyCode == $.ui.keyCode.ENTER) {
							promptOkFunc();
						} else if (e.keyCode == $.ui.keyCode.ESCAPE) {  // NOTE: Not works on keypress, only on keydown, but dialog's ESC handler handles this event and close dialog automatically
							promptCancelFunc();
						}
					});
					var btns = {
						"OK": promptOkFunc
					};
					btns[T("Отмена")] = promptCancelFunc;
				    $prompt.dialog({
				        title: T("Пароль к файлу ключа-ЭЦП"),
				        resizable: false,
						width:300,
						height:160,
						modal: true,
						buttons: btns,
						close: function() {
							$prompt.dialog("destroy");
						}
					});
				};
				if(current_files.length > 0) {
					reader.readAsBinaryString(current_files[0]);
				}
			});
		},
		
        _loadP12Cert: function (p12) {
            var dataToSign = this.options.dataToSign;
			var certSelectedFunc = this.options.certSelectedFunc;
            
            var certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            var bag = certBags[forge.pki.oids.certBag][0];
            var cert = bag.cert;

            var certPem;

            try {
                certPem = forge.pki.certificateToPem(cert);
            } catch(err) {
                alert(T("Выбран не корректный тип сертификата. Укажите файл сертификата RSA."));
                return;
            }

            certPem = certPem.replace('-----BEGIN CERTIFICATE-----', '');
            certPem = certPem.replace('-----END CERTIFICATE-----', '');

            var keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
            var keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];

            var privateKey = keyBag.key;

            var theMd;

            switch (cert.md.algorithm) {
            case "sha1":
                theMd = forge.md.sha1.create();
                break;
            case "sha256":
                theMd = forge.md.sha256.create();
                break;
            default:
                alert(T("Выбран сертификат с неизвестным алгоритмом хэширования. Укажите файл сертификата RSA, выданный НУЦ РК."));
                return;
            }

            theMd.update(dataToSign, 'utf8');

            var signature = privateKey.sign(theMd);

            var clientSignedData = forge.util.encode64(signature);

            var bin = '', iin = '', issuedBy = '', issuedTo = '', email = '';

            var i;
            var attr;
            for (i = 0; i < cert.subject.attributes.length; i++) {
                attr = cert.subject.attributes[i];
                if (attr.name == 'commonName') {
                    issuedTo = forge.util.decodeUtf8(attr.value);
                }
                if (attr.name == "emailAddress") {
                    email = attr.value;
                }

                if (attr.name == "organizationalUnitName" && attr.value.indexOf("BIN") == 0) {
                    bin = attr.value.substring(3);
                }

                if (attr.name == "serialName") {
                    iin = attr.value.substring(3);
                }
            }

            for (i = 0; i < cert.issuer.attributes.length; i++) {
                attr = cert.issuer.attributes[i];
                if (attr.name == "commonName") {
                    issuedBy = forge.util.decodeUtf8(attr.value);
                }
            }

            var bfr = cert.validity.notBefore;
            var aftr = cert.validity.notAfter;

            var certInfo = {
                Owner: issuedTo,
                Issuer: issuedBy,
                ValidFrom: formatDate('dd.mm.yy', bfr),
                ValidTo: formatDate('dd.mm.yy', aftr),
                Alg: forge.oids[cert.signatureOid],
                IIN: iin,
                BIN: bin,
                Email: email
            };
            certSelectedFunc(clientSignedData, certInfo, certPem);
        },
		
		destroy: function(){
			$.Widget.prototype.destroy.call(this);
		},
	});
})(jQuery);