INSERT INTO users.tbaccounts(flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flaccountid, flaccounttype, flxin, flnameru, flnamekz, flisblocked, flblockreason) VALUES (-1, -1, false, 0, now(), -1, 'guest', 'Internal', 'guest', '  ', '  ', false, NULL);
INSERT INTO users.tbusers(flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, fluserid, fllogin, flaccountid, flaccounttype, flxin, fliin, flgroupname, flfirstname, fllastname, flmiddlename, flfullname, flemail, flmobilephone, flismobilephoneconfirmed, flstationaryphone, flpassword, flisblocked, flblockreason, flautoblockafter, flregistrationdate) VALUES (-1, -1, false, 0, now(), -1, -2, 'guest', 'guest', 'Internal', 'guest', 'guest', 'guest', '', '', '', '  ', '-', NULL, false, NULL, '', false, NULL, NULL, now());

INSERT INTO users.tbaccountmodel (flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flaccountid, flupdatedat, flprevupdateversion, flupdateversion, flaccountdatamodel) VALUES (3288, 6777, false, 0, now(), -1, 'guest', now(), 0, 1, '{"Account" : {"AccountId" : "guest", "AccountType" : "Internal", "Xin" : "guest", "NameRu" : "guest guest guest", "NameKz" : "guest guest guest", "IsBlocked" : false, "BlockReason" : null}, "AccountAddresses" : null, "AccountAdmins" : null, "BankAccount" : null, "CorpData" : null}');
INSERT INTO users.tbusermodel (flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, fllogin, flupdatedat, flprevupdateversion, flupdateversion, fluserdatamodel) VALUES (3299, 6788, false, 0, now(), -1, 'guest', now(), 0, 1, '{"AccountId" : "guest", "AccountType" : "Internal", "AccountXin" : "guest", "UserId" : -2, "User" : {"Login" : "guest", "Iin" : "guest", "GroupName" : "guest", "FirstName" : "guest", "LastName" : "guest", "MiddleName" : "guest", "FullName" : "guest guest guest", "Email" : "-", "MobilePhone" : null, "IsMobilePhoneConfirmed" : false, "StationaryPhone" : null, "IsBlocked" : false, "BlockReason" : null, "AutoBlockAfter" : null, "RegistrationDate" : "2021-01-01T00:00:00.433153"}, "UserDocs" : null, "UserRoles" : null}');


INSERT INTO users.z_history_tbaccounts (
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flaccountid, flaccounttype, flxin, flnameru, flnamekz, flisblocked, flblockreason
)
SELECT 
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flaccountid, flaccounttype, flxin, flnameru, flnamekz, flisblocked, flblockreason
FROM users.tbaccounts;

INSERT INTO users.z_history_tbusers (
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, fluserid, fllogin, flaccountid, flaccounttype, flxin, fliin, flgroupname, flfirstname, fllastname, flmiddlename, flfullname, flemail, flmobilephone, flismobilephoneconfirmed, flstationaryphone, flpassword, flisblocked, flblockreason, flautoblockafter, flregistrationdate
)
SELECT 
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, fluserid, fllogin, flaccountid, flaccounttype, flxin, fliin, flgroupname, flfirstname, fllastname, flmiddlename, flfullname, flemail, flmobilephone, flismobilephoneconfirmed, flstationaryphone, flpassword, flisblocked, flblockreason, flautoblockafter, flregistrationdate
FROM users.tbusers;

INSERT INTO users.z_history_tbaccountmodel (
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flaccountid, flupdatedat, flprevupdateversion, flupdateversion, flaccountdatamodel
)
SELECT 	
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, flaccountid, flupdatedat, flprevupdateversion, flupdateversion, flaccountdatamodel
FROM users.tbaccountmodel;

INSERT INTO users.z_history_tbusermodel (
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, fllogin, flupdatedat, flprevupdateversion, flupdateversion, fluserdatamodel
) 
SELECT 
  flentityid, flrequestid, flishidden, flrequesttype, flrequestdate, flrequestuserid, fllogin, flupdatedat, flprevupdateversion, flupdateversion, fluserdatamodel
FROM users.tbusermodel;
