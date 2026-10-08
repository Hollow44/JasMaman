create extension if not exists pgsodium;

CREATE OR REPLACE FUNCTION public.yoda_set_column_encrypted_security_label_v0(
	schema_name text,
	table_name text,
	column_name text
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
	if(not exists(select 1 from pgsodium.valid_key where name = 'yoda')) then
		perform pgsodium.create_key('aead-det', 'yoda', pgsodium.derive_key(1001));
	end if;
	execute format('SECURITY LABEL FOR pgsodium	ON COLUMN %s.%s.%s IS ''ENCRYPT WITH KEY ID %s''', 
		schema_name, 
		table_name, 
		column_name, 
		(pgsodium.get_key_by_name('yoda'::text)).id
	);
END;
$function$
;


CREATE OR REPLACE FUNCTION public.yoda_drop_column_encrypted_security_label_v0(
	schema_name text,
	table_name text,
	column_name text
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
	execute format('SECURITY LABEL FOR pgsodium	ON COLUMN %s.%s.%s IS NULL', 
		schema_name, 
		table_name, 
		column_name
	);

	execute format('DROP TRIGGER IF EXISTS %s_encrypt_secret_trigger_%s on %s.%s', 
		table_name,
		column_name,
		
		schema_name, 
		table_name
	);
END;
$function$
;



DROP VIEW IF EXISTS users.decrypted_tbaccountaddr;

ALTER TABLE users.tbaccountaddr
ALTER COLUMN fladrcountry TYPE text ;


ALTER TABLE users.tbaccountaddr
ALTER COLUMN fladrreg TYPE text ;


ALTER TABLE users.tbaccountaddr
ALTER COLUMN fladrobl TYPE text ;


ALTER TABLE users.tbaccountaddr
ALTER COLUMN flrkacode TYPE text ;


ALTER TABLE users.tbaccountaddr
ALTER COLUMN fladradr TYPE text ;


ALTER TABLE users.tbaccountaddr
ALTER COLUMN fladrindex TYPE text ;


ALTER TABLE users.z_history_tbaccountaddr
ALTER COLUMN fladrcountry TYPE text ;


ALTER TABLE users.z_history_tbaccountaddr
ALTER COLUMN fladrobl TYPE text ;


ALTER TABLE users.z_history_tbaccountaddr
ALTER COLUMN fladrreg TYPE text ;


ALTER TABLE users.z_history_tbaccountaddr
ALTER COLUMN flrkacode TYPE text ;


ALTER TABLE users.z_history_tbaccountaddr
ALTER COLUMN fladradr TYPE text ;


ALTER TABLE users.z_history_tbaccountaddr
ALTER COLUMN fladrindex TYPE text ;



select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountaddr', 'fladrcountry'); 
comment on column users.tbaccountaddr.fladrcountry is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountaddr', 'fladrreg'); 
comment on column users.tbaccountaddr.fladrreg is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountaddr', 'fladrobl'); 
comment on column users.tbaccountaddr.fladrobl is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountaddr', 'flrkacode'); 
comment on column users.tbaccountaddr.flrkacode is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountaddr', 'fladradr'); 
comment on column users.tbaccountaddr.fladradr is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountaddr', 'fladrindex'); 
comment on column users.tbaccountaddr.fladrindex is 'ENCRYPTED';



select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrcountry'); 
comment on column users.z_history_tbaccountaddr.fladrcountry is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrobl'); 
comment on column users.z_history_tbaccountaddr.fladrobl is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrreg'); 
comment on column users.z_history_tbaccountaddr.fladrreg is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'flrkacode'); 
comment on column users.z_history_tbaccountaddr.flrkacode is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladradr'); 
comment on column users.z_history_tbaccountaddr.fladradr is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrindex'); 
comment on column users.z_history_tbaccountaddr.fladrindex is 'ENCRYPTED';


---------------

	SELECT * INTO TEMP tbaccountaddr_temp FROM users.tbaccountaddr;
	truncate users.tbaccountaddr;
	insert into users.tbaccountaddr select * from tbaccountaddr_temp;


	SELECT * INTO TEMP z_history_tbaccountaddr_temp FROM users.z_history_tbaccountaddr;
	truncate users.z_history_tbaccountaddr;
	insert into users.z_history_tbaccountaddr select * from z_history_tbaccountaddr_temp;



	
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrcountry'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrobl'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrreg'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'flrkacode'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladradr'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountaddr', 'fladrindex'); 
	
    DROP VIEW IF EXISTS users.decrypted_z_history_tbaccountaddr;
  