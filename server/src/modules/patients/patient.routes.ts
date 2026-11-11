import { Router } from 'express';
import { parse } from '../../middleware/validate.js';
import { idParams } from '../../lib/validators.js';
import { releaseBody, patientBody, patientListQuery, patientPatch } from './patient.schemas.js';
import * as svc from './patient.service.js';

export const patientRouter = Router();

patientRouter.get('/', async (req, res) => {
  res.json(await svc.listPatients(parse(patientListQuery, req.query)));
});

patientRouter.post('/', async (req, res) => {
  res.status(201).json(await svc.createPatient(parse(patientBody, req.body)));
});

patientRouter.get('/:id', async (req, res) => {
  res.json(await svc.getPatient(parse(idParams, req.params).id));
});

patientRouter.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json(await svc.updatePatient(id, parse(patientPatch, req.body)));
});

patientRouter.delete('/:id', async (req, res) => {
  await svc.deletePatient(parse(idParams, req.params).id);
  res.status(204).end();
});

patientRouter.post('/:id/release', async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json(await svc.releasePatient(id, parse(releaseBody, req.body ?? {})));
});

patientRouter.post('/:id/readmit', async (req, res) => {
  res.json(await svc.readmitPatient(parse(idParams, req.params).id));
});
