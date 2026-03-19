'use strict';

const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  CULTURAL_ADMIN: 'cultural_admin',
  TECHNICAL_ADMIN: 'technical_admin',
  COORDINATOR: 'coordinator',
});

const ALL_ROLES = Object.values(ROLES);

const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN];

module.exports = { ROLES, ALL_ROLES, MANAGEMENT_ROLES };
