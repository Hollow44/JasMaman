
DROP VIEW IF EXISTS users.decrypted_tbusers;

ALTER TABLE users.tbusers
ALTER COLUMN flemail TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flgroupname TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flmobilephone TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flmiddlename TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flfirstname TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flblockreason TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flfullname TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN fllastname TYPE text ;


ALTER TABLE users.tbusers
ALTER COLUMN flstationaryphone TYPE text ;



select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flemail'); 
comment on column users.tbusers.flemail is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flgroupname'); 
comment on column users.tbusers.flgroupname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flmobilephone'); 
comment on column users.tbusers.flmobilephone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flmiddlename'); 
comment on column users.tbusers.flmiddlename is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flfirstname'); 
comment on column users.tbusers.flfirstname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flblockreason'); 
comment on column users.tbusers.flblockreason is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flfullname'); 
comment on column users.tbusers.flfullname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'fllastname'); 
comment on column users.tbusers.fllastname is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbusers', 'flstationaryphone'); 
comment on column users.tbusers.flstationaryphone is 'ENCRYPTED';



---------------


	
	SELECT * INTO TEMP tbusers_temp FROM users.tbusers;
	truncate users.tbusers;
	insert into users.tbusers select * from tbusers_temp;


  
