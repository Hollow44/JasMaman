
ALTER TABLE users.z_history_tbusers
ALTER COLUMN flfullname TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flstationaryphone TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN fllastname TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flblockreason TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flemail TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flmobilephone TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flgroupname TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flfirstname TYPE text ;


ALTER TABLE users.z_history_tbusers
ALTER COLUMN flmiddlename TYPE text ;




select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flfullname'); 
comment on column users.z_history_tbusers.flfullname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flstationaryphone'); 
comment on column users.z_history_tbusers.flstationaryphone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'fllastname'); 
comment on column users.z_history_tbusers.fllastname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flblockreason'); 
comment on column users.z_history_tbusers.flblockreason is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flemail'); 
comment on column users.z_history_tbusers.flemail is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flmobilephone'); 
comment on column users.z_history_tbusers.flmobilephone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flgroupname'); 
comment on column users.z_history_tbusers.flgroupname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flfirstname'); 
comment on column users.z_history_tbusers.flfirstname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flmiddlename'); 
comment on column users.z_history_tbusers.flmiddlename is 'ENCRYPTED';




---------------


	SELECT * INTO TEMP z_history_tbusers_temp FROM users.z_history_tbusers;
	truncate users.z_history_tbusers;
	insert into users.z_history_tbusers select * from z_history_tbusers_temp;

	

	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flfullname'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flstationaryphone'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'fllastname'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flblockreason'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flemail'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flmobilephone'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flgroupname'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flfirstname'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusers', 'flmiddlename'); 

    DROP VIEW IF EXISTS users.decrypted_z_history_tbusers;
  
