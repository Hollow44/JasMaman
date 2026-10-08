

DROP VIEW IF EXISTS users.decrypted_tbuserinvites;

ALTER TABLE users.tbuserinvites
ALTER COLUMN flemail TYPE text ;


ALTER TABLE users.tbuserinvites
ALTER COLUMN flinvitecode TYPE text ;


ALTER TABLE users.tbuserinvites
ALTER COLUMN fliin TYPE text ;



DROP VIEW IF EXISTS users.decrypted_tbusersauthorizationhistory;

ALTER TABLE users.tbusersauthorizationhistory
ALTER COLUMN flremoteaddr TYPE text ;


ALTER TABLE users.z_history_tbusersauthorizationhistory
ALTER COLUMN flremoteaddr TYPE text ;


ALTER TABLE users.z_history_tbuserinvites
ALTER COLUMN fliin TYPE text ;


ALTER TABLE users.z_history_tbuserinvites
ALTER COLUMN flinvitecode TYPE text ;


ALTER TABLE users.z_history_tbuserinvites
ALTER COLUMN flemail TYPE text ;


select yoda_set_column_encrypted_security_label_v0('users', 'tbuserinvites', 'flemail'); 
comment on column users.tbuserinvites.flemail is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbuserinvites', 'flinvitecode'); 
comment on column users.tbuserinvites.flinvitecode is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbuserinvites', 'fliin'); 
comment on column users.tbuserinvites.fliin is 'ENCRYPTED';

select yoda_set_column_encrypted_security_label_v0('users', 'tbusersauthorizationhistory', 'flremoteaddr'); 
comment on column users.tbusersauthorizationhistory.flremoteaddr is 'ENCRYPTED';


------------------z_history_

select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbuserinvites', 'fliin'); 
comment on column users.z_history_tbuserinvites.fliin is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbuserinvites', 'flinvitecode'); 
comment on column users.z_history_tbuserinvites.flinvitecode is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbuserinvites', 'flemail'); 
comment on column users.z_history_tbuserinvites.flemail is 'ENCRYPTED';

select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbusersauthorizationhistory', 'flremoteaddr'); 
comment on column users.z_history_tbusersauthorizationhistory.flremoteaddr is 'ENCRYPTED';


---------------

	SELECT * INTO TEMP tbuserinvites_temp FROM users.tbuserinvites;
	truncate users.tbuserinvites;
	insert into users.tbuserinvites select * from tbuserinvites_temp;


	SELECT * INTO TEMP z_history_tbuserinvites_temp FROM users.z_history_tbuserinvites;
	truncate users.z_history_tbuserinvites;
	insert into users.z_history_tbuserinvites select * from z_history_tbuserinvites_temp;

	
	SELECT * INTO TEMP tbusersauthorizationhistory_temp FROM users.tbusersauthorizationhistory;
	truncate users.tbusersauthorizationhistory;
	insert into users.tbusersauthorizationhistory select * from tbusersauthorizationhistory_temp;


	SELECT * INTO TEMP z_history_tbusersauthorizationhistory_temp FROM users.z_history_tbusersauthorizationhistory;
	truncate users.z_history_tbusersauthorizationhistory;
	insert into users.z_history_tbusersauthorizationhistory select * from z_history_tbusersauthorizationhistory_temp;


	

	
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbusersauthorizationhistory', 'flremoteaddr'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbuserinvites', 'fliin'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbuserinvites', 'flinvitecode'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbuserinvites', 'flemail'); 


    DROP VIEW IF EXISTS users.decrypted_z_history_tbusersauthorizationhistory;
    DROP VIEW IF EXISTS users.decrypted_z_history_tbuserinvites;
