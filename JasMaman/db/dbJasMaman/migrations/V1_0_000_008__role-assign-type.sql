ALTER TABLE users.tbroles
ADD COLUMN flRoleAssignType character varying(14);


ALTER TABLE users.z_history_tbroles
ADD COLUMN flRoleAssignType character varying(14);

update users.tbroles set flRoleAssignType = case
	when flautoassigned = true then 'Auto' else 'BySysAdmin'
end;

update users.z_history_tbroles set flRoleAssignType = case
	when flautoassigned = true then 'Auto' else 'BySysAdmin'
end;

ALTER TABLE users.tbroles
ALTER COLUMN flRoleAssignType SET NOT NULL;


ALTER TABLE users.z_history_tbroles
ALTER COLUMN flRoleAssignType SET NOT NULL;


ALTER TABLE users.tbaccounts
ADD COLUMN flTags character varying ;


ALTER TABLE users.tbroles 
RENAME flautoassigned TO __rm__flautoassigned; -- Дабы не потерять данные, просто переименовываем колонку. Удалить можно на следующих итерациях. Либо если вы уверенны что ничего страшного не произойдет замените на DROP COLUMN самостоятельно.


ALTER TABLE users.tbroles
ADD COLUMN flTags character varying ;


ALTER TABLE users.z_history_tbaccounts
ADD COLUMN flTags character varying ;


ALTER TABLE users.z_history_tbroles 
RENAME flautoassigned TO __rm__flautoassigned; -- Дабы не потерять данные, просто переименовываем колонку. Удалить можно на следующих итерациях. Либо если вы уверенны что ничего страшного не произойдет замените на DROP COLUMN самостоятельно.


ALTER TABLE users.z_history_tbroles
ADD COLUMN flTags character varying ;