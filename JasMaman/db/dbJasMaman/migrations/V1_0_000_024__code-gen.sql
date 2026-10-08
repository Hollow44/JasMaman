
DROP VIEW IF EXISTS users.decrypted_tbcorprelatedjobs;

ALTER TABLE users.tbcorprelatedjobs
ALTER COLUMN flgbdulmodelinjson TYPE text ;


DROP VIEW IF EXISTS users.decrypted_tbuserconsent;

ALTER TABLE users.tbuserconsent
ALTER COLUMN flcertinfo TYPE text ;


DROP VIEW IF EXISTS users.decrypted_tbuserrelatedjobs;

ALTER TABLE users.tbuserrelatedjobs
ALTER COLUMN flgbdflmodelinjson TYPE text ;


ALTER TABLE users.z_history_tbuserconsent
ALTER COLUMN flcertinfo TYPE text ;

select yoda_set_column_encrypted_security_label_v0('users', 'tbcorprelatedjobs', 'flgbdulmodelinjson'); 

comment on column users.tbcorprelatedjobs.flgbdulmodelinjson is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbuserconsent', 'flcertinfo'); 

comment on column users.tbuserconsent.flcertinfo is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbuserrelatedjobs', 'flgbdflmodelinjson'); 

comment on column users.tbuserrelatedjobs.flgbdflmodelinjson is 'ENCRYPTED';


comment on column users.z_history_tbuserconsent.flcertinfo is 'ENCRYPTED';


SELECT * INTO TEMP _tmp_tbcorprelatedjobs FROM users.tbcorprelatedjobs;
	TRUNCATE users.tbcorprelatedjobs;
	INSERT INTO users.tbcorprelatedjobs SELECT * FROM _tmp_tbcorprelatedjobs;


SELECT yoda_set_column_encrypted_security_label_v0('users', 'tbcorprelatedjobs', 'flgbdulmodelinjson');

    
SELECT * INTO TEMP _tmp_tbuserconsent FROM users.tbuserconsent;
	TRUNCATE users.tbuserconsent;
	INSERT INTO users.tbuserconsent SELECT * FROM _tmp_tbuserconsent;


SELECT yoda_set_column_encrypted_security_label_v0('users', 'tbuserconsent', 'flcertinfo');

    
SELECT * INTO TEMP _tmp_tbuserrelatedjobs FROM users.tbuserrelatedjobs;
	TRUNCATE users.tbuserrelatedjobs;
	INSERT INTO users.tbuserrelatedjobs SELECT * FROM _tmp_tbuserrelatedjobs;


SELECT yoda_set_column_encrypted_security_label_v0('users', 'tbuserrelatedjobs', 'flgbdflmodelinjson');


update users.z_history_tbuserconsent
set flcertinfo = yoda_encrypt_v0(flcertinfo);
