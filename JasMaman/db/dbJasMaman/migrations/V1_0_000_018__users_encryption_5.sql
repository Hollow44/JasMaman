
DROP VIEW IF EXISTS users.decrypted_tbcorpdata;

ALTER TABLE users.tbcorpdata
ALTER COLUMN flcorpstationaryphone TYPE text ;


ALTER TABLE users.tbcorpdata
ALTER COLUMN flfirstpersonfio TYPE text ;


ALTER TABLE users.tbcorpdata
ALTER COLUMN flcorpmobilephone TYPE text ;


ALTER TABLE users.tbcorpdata
ALTER COLUMN flcorpemail TYPE text ;


DROP VIEW IF EXISTS users.decrypted_tbuserdocs;

ALTER TABLE users.tbuserdocs
ALTER COLUMN flgivenby TYPE text ;


ALTER TABLE users.tbuserdocs
ALTER COLUMN flnumber TYPE text ;


ALTER TABLE users.z_history_tbcorpdata
ALTER COLUMN flfirstpersonfio TYPE text ;


ALTER TABLE users.z_history_tbcorpdata
ALTER COLUMN flcorpmobilephone TYPE text ;


ALTER TABLE users.z_history_tbcorpdata
ALTER COLUMN flcorpemail TYPE text ;


ALTER TABLE users.z_history_tbcorpdata
ALTER COLUMN flcorpstationaryphone TYPE text ;


ALTER TABLE users.z_history_tbuserdocs
ALTER COLUMN flnumber TYPE text ;


ALTER TABLE users.z_history_tbuserdocs
ALTER COLUMN flgivenby TYPE text ;



select yoda_set_column_encrypted_security_label_v0('users', 'tbcorpdata', 'flcorpstationaryphone'); 
comment on column users.tbcorpdata.flcorpstationaryphone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbcorpdata', 'flfirstpersonfio'); 
comment on column users.tbcorpdata.flfirstpersonfio is 'ENCRYPTED';



select yoda_set_column_encrypted_security_label_v0('users', 'tbcorpdata', 'flcorpmobilephone'); 
comment on column users.tbcorpdata.flcorpmobilephone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbcorpdata', 'flcorpemail'); 
comment on column users.tbcorpdata.flcorpemail is 'ENCRYPTED';



select yoda_set_column_encrypted_security_label_v0('users', 'tbuserdocs', 'flgivenby'); 
comment on column users.tbuserdocs.flgivenby is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbuserdocs', 'flnumber'); 
comment on column users.tbuserdocs.flnumber is 'ENCRYPTED';




------------------z_history_
select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flfirstpersonfio'); 
comment on column users.z_history_tbcorpdata.flfirstpersonfio is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flcorpmobilephone'); 
comment on column users.z_history_tbcorpdata.flcorpmobilephone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flcorpemail'); 
comment on column users.z_history_tbcorpdata.flcorpemail is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flcorpstationaryphone'); 
comment on column users.z_history_tbcorpdata.flcorpstationaryphone is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbuserdocs', 'flnumber'); 
comment on column users.z_history_tbuserdocs.flnumber is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbuserdocs', 'flgivenby'); 
comment on column users.z_history_tbuserdocs.flgivenby is 'ENCRYPTED';



---------------

	
	SELECT * INTO TEMP tbcorpdata_temp FROM users.tbcorpdata;
	truncate users.tbcorpdata;
	insert into users.tbcorpdata select * from tbcorpdata_temp;


	SELECT * INTO TEMP z_history_tbcorpdata_temp FROM users.z_history_tbcorpdata;
	truncate users.z_history_tbcorpdata;
	insert into users.z_history_tbcorpdata select * from z_history_tbcorpdata_temp;

	
	SELECT * INTO TEMP tbuserdocs_temp FROM users.tbuserdocs;
	truncate users.tbuserdocs;
	insert into users.tbuserdocs select * from tbuserdocs_temp;


	SELECT * INTO TEMP z_history_tbuserdocs_temp FROM users.z_history_tbuserdocs;
	truncate users.z_history_tbuserdocs;
	insert into users.z_history_tbuserdocs select * from z_history_tbuserdocs_temp;



	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flfirstpersonfio'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flcorpmobilephone'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flcorpemail'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbcorpdata', 'flcorpstationaryphone'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbuserdocs', 'flnumber'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbuserdocs', 'flgivenby'); 
	


    DROP VIEW IF EXISTS users.decrypted_z_history_tbcorpdata;
    DROP VIEW IF EXISTS users.decrypted_z_history_tbuserdocs;
    
