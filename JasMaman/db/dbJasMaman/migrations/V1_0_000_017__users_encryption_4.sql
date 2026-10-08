

DROP VIEW IF EXISTS users.decrypted_tbaccounts;

ALTER TABLE users.tbaccounts
ALTER COLUMN flnameru TYPE text ;


ALTER TABLE users.tbaccounts
ALTER COLUMN flnamekz TYPE text ;


ALTER TABLE users.z_history_tbaccounts
ALTER COLUMN flnameru TYPE text ;


ALTER TABLE users.z_history_tbaccounts
ALTER COLUMN flnamekz TYPE text ;


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccounts', 'flnameru'); 
comment on column users.tbaccounts.flnameru is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'tbaccounts', 'flnamekz'); 
comment on column users.tbaccounts.flnamekz is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccounts', 'flnameru'); 
comment on column users.z_history_tbaccounts.flnameru is 'ENCRYPTED';


select yoda_set_column_encrypted_security_label_v0('users', 'z_history_tbaccounts', 'flnamekz'); 
comment on column users.z_history_tbaccounts.flnamekz is 'ENCRYPTED';



	SELECT * INTO TEMP tbaccounts_temp FROM users.tbaccounts;
	truncate users.tbaccounts;
	insert into users.tbaccounts select * from tbaccounts_temp;


	SELECT * INTO TEMP z_history_tbaccounts_temp FROM users.z_history_tbaccounts;
	truncate users.z_history_tbaccounts;
	insert into users.z_history_tbaccounts select * from z_history_tbaccounts_temp;



	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccounts', 'flnameru'); 
	select yoda_drop_column_encrypted_security_label_v0('users', 'z_history_tbaccounts', 'flnamekz'); 
	
    DROP VIEW IF EXISTS users.decrypted_z_history_tbaccounts;
  
