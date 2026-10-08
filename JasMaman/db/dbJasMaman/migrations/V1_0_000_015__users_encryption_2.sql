
DROP VIEW IF EXISTS users.decrypted_tbaccountbankaccount;

ALTER TABLE users.tbaccountbankaccount
ALTER COLUMN flbankbic TYPE text ;


ALTER TABLE users.tbaccountbankaccount
ALTER COLUMN fliik TYPE text ;



ALTER TABLE users.z_history_tbaccountbankaccount
ALTER COLUMN flbankbic TYPE text ;


ALTER TABLE users.z_history_tbaccountbankaccount
ALTER COLUMN fliik TYPE text ;



select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountbankaccount', 'flbankbic'); 
comment on column users.tbaccountbankaccount.flbankbic is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccountbankaccount', 'fliik'); 
comment on column users.tbaccountbankaccount.fliik is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountbankaccount', 'flbankbic'); 
comment on column users.z_history_tbaccountbankaccount.flbankbic is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccountbankaccount', 'fliik'); 
comment on column users.z_history_tbaccountbankaccount.fliik is 'ENCRYPTED';


---------------

	
	SELECT * INTO TEMP tbaccountbankaccount_temp FROM users.tbaccountbankaccount;
	truncate users.tbaccountbankaccount;
	insert into users.tbaccountbankaccount select * from tbaccountbankaccount_temp;


	SELECT * INTO TEMP z_history_tbaccountbankaccount_temp FROM users.z_history_tbaccountbankaccount;
	truncate users.z_history_tbaccountbankaccount;
	insert into users.z_history_tbaccountbankaccount select * from z_history_tbaccountbankaccount_temp;



	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountbankaccount', 'flbankbic'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccountbankaccount', 'fliik'); 

    DROP VIEW IF EXISTS users.decrypted_z_history_tbaccountbankaccount;
