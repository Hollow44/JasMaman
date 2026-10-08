DELETE FROM users.tbroles;
DELETE FROM users.tbrolepermissions;


SELECT pg_catalog.nextval('users."seq_TbRoles_flRoleId"');
SELECT pg_catalog.setval('users."seq_TbRoles_flRoleId"', GREATEST(1, pg_catalog.currval('users."seq_TbRoles_flRoleId"')), true);



-- стандартная роль автоматический выдаваемая зарегитрированному пользователю
INSERT INTO users.tbroles (
	flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flroleid, flrolename, flroledescription, flproject, fluserprofile, flroleassigntype
) 
VALUES 
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 1, 'Внешний пользователь', 'Автоматически назначаемая роль всем внешним пользователям.', 'cabinet', 'external', 'Auto');


INSERT INTO users.tbrolepermissions (
	flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flroleid, flcontrollername, flpermission
) VALUES 
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 1, 'CabinetUserBankDetails', 'user-bank-details'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 1, 'CabinetUserDataModule', 'access-to-self-data-edit'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 1, 'CabinetStartPageModule', 'cabinet');



-- роли Jas Maman (константы — JasMaman.Modules/Modules/Common/Roles.cs)
INSERT INTO users.tbroles 
	(flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flroleid, flrolename, flroledescription, flproject, fluserprofile, flroleassigntype, fltags) 
VALUES 
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2000, 'JasMaman. Модератор', 'Администрирование: миграция из УМОСК, справочники, все операции', 'cabinet', 'external', 'BySysAdmin', null),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2001, 'JasMaman. Департамент мониторинга', 'Сотрудник ДМ: реестры, мониторинг отработки, уведомления', 'cabinet', 'external', 'ByAccountAdmin', null),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2002, 'JasMaman. Руководитель департамента мониторинга', 'Закрытие отработки, передача в ЮРДЕП, прекращение обязательств', 'cabinet', 'external', 'ByAccountAdmin', null),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2003, 'JasMaman. Юридический департамент', 'Претензионная и исковая работа, статусы по решению суда', 'cabinet', 'external', 'ByAccountAdmin', null),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2004, 'JasMaman. Бухгалтерия', 'Ввод оплат в счёт возмещения бюджетных средств', 'cabinet', 'external', 'ByAccountAdmin', null),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2005, 'JasMaman. Организация образования', 'Сотрудник вуза: зачисление, движение студентов, выпуск, распределение', 'cabinet', 'external', 'ByAccountAdmin', '["jas-maman-university"]');


INSERT INTO users.tbrolepermissions 
	(flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flroleid, flcontrollername, flpermission) 
VALUES 
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2000, 'CatalogsModule', 'Viewer'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2000, 'MigrationModule', 'Migrator'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2001, 'CatalogsModule', 'Viewer'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2002, 'CatalogsModule', 'Viewer'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2003, 'CatalogsModule', 'Viewer'),
	(pg_catalog.nextval('public.seq_entity_id'), pg_catalog.nextval('public.seq_request_id'), false, 0, now(), 1, 2004, 'CatalogsModule', 'Viewer');
