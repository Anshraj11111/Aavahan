'use strict';

const Registration = require('../registrations/registration.model');

const EXPORT_FIELDS = [
  'uniqueRegistrationId', 'fullName', 'email', 'phone', 'instituteName',
  'department', 'yearOrSemester', 'city', 'gender', 'eventTitle', 'eventDay',
  'participationType', 'teamName', 'amountExpected', 'amountPaid',
  'transactionId', 'paymentStatus', 'registrationStatus', 'checkedIn',
  'checkedInAt', 'adminRemarks', 'createdAt',
];

function buildFilteredQuery(query) {
  const { eventId, registrationStatus, paymentStatus, day, search } = query;
  const filter = {};
  if (eventId) filter.eventId = eventId;
  if (registrationStatus) filter.registrationStatus = registrationStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (day) filter.eventDay = day;
  if (search) {
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [{ fullName: re }, { email: re }, { phone: re }, { uniqueRegistrationId: re }];
  }
  return filter;
}

async function exportCSV(query, res) {
  const { createObjectCsvStringifier } = require('csv-writer');
  const filter = buildFilteredQuery(query);
  const registrations = await Registration.find(filter).lean();

  const csvStringifier = createObjectCsvStringifier({
    header: EXPORT_FIELDS.map((f) => ({ id: f, title: f })),
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
  res.write(csvStringifier.getHeaderString());
  res.write(csvStringifier.stringifyRecords(registrations));
  res.end();
}

async function exportExcel(query, res) {
  const ExcelJS = require('exceljs');
  const filter = buildFilteredQuery(query);
  const registrations = await Registration.find(filter).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Registrations');

  sheet.columns = EXPORT_FIELDS.map((f) => ({ header: f, key: f, width: 20 }));
  registrations.forEach((r) => sheet.addRow(r));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="registrations.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { exportCSV, exportExcel };
