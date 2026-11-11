import { Router } from 'express';
import { z } from 'zod';
import { parse } from '../../middleware/validate.js';
import { idParams, objectId } from '../../lib/validators.js';
import { doctorBody, doctorListQuery, doctorPatch, lookupQuery } from './doctor.schemas.js';
import * as svc from './doctor.service.js';
import * as patients from '../patients/patient.service.js';
import { patientListQuery, patientUnderDoctorBody } from '../patients/patient.schemas.js';

export const doctorRouter = Router();

doctorRouter.get('/', async (req, res) => {
  res.json(await svc.listDoctors(parse(doctorListQuery, req.query)));
});

doctorRouter.get('/lookup', async (req, res) => {
  res.json({ items: await svc.lookupDoctors(parse(lookupQuery, req.query).q) });
});

doctorRouter.get('/facets', async (_req, res) => {
  res.json(await svc.doctorFacets());
});

doctorRouter.post('/', async (req, res) => {
  res.status(201).json(await svc.createDoctor(parse(doctorBody, req.body)));
});

doctorRouter.get('/:id', async (req, res) => {
  res.json(await svc.getDoctor(parse(idParams, req.params).id));
});

doctorRouter.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json(await svc.updateDoctor(id, parse(doctorPatch, req.body)));
});

doctorRouter.delete('/:id', async (req, res) => {
  await svc.deleteDoctor(parse(idParams, req.params).id);
  res.status(204).end();
});

// A doctor's own patient list.
doctorRouter.get('/:id/patients', async (req, res) => {
  const { id } = parse(idParams, req.params);
  await svc.getDoctorOr404(id);
  res.json(await patients.listPatients({ ...parse(patientListQuery, req.query), doctor: id }));
});

doctorRouter.post('/:id/patients', async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.status(201).json(await patients.createPatient({ ...parse(patientUnderDoctorBody, req.body), doctor: id }));
});

doctorRouter.delete('/:id/patients/:patientId', async (req, res) => {
  const { id, patientId } = parse(z.object({ id: objectId, patientId: objectId }), req.params);
  await patients.deletePatient(patientId, id);
  res.status(204).end();
});
