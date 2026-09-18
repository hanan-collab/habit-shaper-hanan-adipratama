import type { RequestHandler, Response } from 'express';
import { parseBody, parseInput } from '../../common/validation.js';
import { trackingEventDto, trackingParamsDto } from './tracking.dto.js';
import { TrackingEventKind } from './tracking.enum.js';
import type { TrackingService } from './tracking.service.js';

const params = <T>(schema: Parameters<typeof parseInput<T>>[0], value: unknown, response: Response) =>
  parseInput(schema, value, response, 'Request parameters are invalid');

export type TrackingController = {
  putCompletion: RequestHandler;
  deleteCompletion: RequestHandler;
  putRelapse: RequestHandler;
  deleteRelapse: RequestHandler;
};

export function createTrackingController(service: TrackingService): TrackingController {
  const put = (kind: TrackingEventKind): RequestHandler => async (request, response) => {
    const path = params(trackingParamsDto, request.params, response);
    const input = parseBody(trackingEventDto, request.body, response);
    if (!path || !input) return;
    response.json(await service.put(
      request.authUser!.id, request.authUser!.timezone, path.habitId, path.date, kind, input,
    ));
  };
  const remove = (kind: TrackingEventKind): RequestHandler => async (request, response) => {
    const path = params(trackingParamsDto, request.params, response);
    if (!path) return;
    await service.delete(request.authUser!.id, request.authUser!.timezone, path.habitId, path.date, kind);
    response.status(204).send();
  };
  return {
    putCompletion: put(TrackingEventKind.Completed),
    deleteCompletion: remove(TrackingEventKind.Completed),
    putRelapse: put(TrackingEventKind.Relapsed),
    deleteRelapse: remove(TrackingEventKind.Relapsed),
  };
}
