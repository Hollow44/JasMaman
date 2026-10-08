CREATE OR REPLACE FUNCTION get_yoda_key()
    RETURNS uuid
    LANGUAGE 'sql'
    COST 100
    STABLE
AS $BODY$
    SELECT id from pgsodium.valid_key WHERE name = 'yoda';
$BODY$;

CREATE OR REPLACE FUNCTION public.yoda_encrypt_v0(valToEncrypt text)
RETURNS text
LANGUAGE plpgsql
AS $function$

BEGIN
	 RETURN CASE WHEN  valToEncrypt IS NULL THEN NULL WHEN valToEncrypt = '' THEN '' ELSE
		pg_catalog.encode(
			pgsodium.crypto_aead_det_encrypt(
			pg_catalog.convert_to(valToEncrypt, 'utf8'),
			pg_catalog.convert_to(('')::text, 'utf8'),
			get_yoda_key(),
			NULL
			),
			'base64')
		END;
END;
		
$function$
;

CREATE OR REPLACE FUNCTION public.yoda_decrypt_v0(valToDecrypt text)
RETURNS text
LANGUAGE plpgsql
AS $function$

BEGIN
	 RETURN CASE WHEN  valToDecrypt IS NULL THEN NULL WHEN valToDecrypt = '' THEN '' ELSE
	 	convert_from(
			pgsodium.crypto_aead_det_decrypt(
				decode(valToDecrypt, 'base64'::text), 
				convert_to(''::text, 'utf8'::name), 
				get_yoda_key(), 
				NULL::bytea), 
			'utf8'::name)
		END;
END;
		
$function$
;
