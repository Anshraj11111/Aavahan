'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { exportCSV, exportExcel } = require('./export.service');

const downloadCSV = asyncHandler(async (req, res) => {
  await exportCSV(req.query, res);
});

const downloadExcel = asyncHandler(async (req, res) => {
  await exportExcel(req.query, res);
});

module.exports = { downloadCSV, downloadExcel };
