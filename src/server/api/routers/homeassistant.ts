import axios from 'axios';
import { z } from 'zod';

import { env } from '~/env.mjs';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const devicesWhitelist = [
  'switch.bedroom_lamp_socket_1',
  'switch.lumiere_de_la_chambre',
  'light.living_room_lights',
];

const api = axios.create({
  baseURL: env.HOMEASSISTANT_URL,
  headers: {
    Authorization: `Bearer ${env.HOMEASSISTANT_TOKEN}`,
  },
});

interface HAState {
  attributes: { icon: string; friendly_name: string | null };
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
  entity_id: string;
  last_changed: string;
  last_updated: string;
  state: string;
}

function isWhitelisted(
  entity:
    | { entity_id: string; entityID?: undefined }
    | { entityID: string; entity_id?: undefined }
) {
  return devicesWhitelist.includes(entity.entity_id ?? entity.entityID);
}

function formatEntity(entity: HAState) {
  return {
    id: entity.entity_id,
    name: entity.attributes.friendly_name ?? entity.entity_id,
    state: entity.state,
  };
}

export async function getStates() {
  const response = await api.get('/api/states');
  return (response.data as HAState[]).filter(isWhitelisted).map(formatEntity);
}

export async function callService(params: {
  entityID: string;
  domain: string;
  service: string;
}) {
  if (!isWhitelisted(params)) {
    throw new Error(`Invalid entityID: ${params.entityID}`);
  }
  const response = await api.post(
    `/api/services/${params.domain}/${params.service}`,
    {
      entity_id: params.entityID,
    }
  );
  return (response.data as HAState[]).filter(isWhitelisted).map(formatEntity);
}

export const homeassistantRouter = createTRPCRouter({
  getStates: protectedProcedure.query(async () => {
    return await getStates();
  }),
  callService: protectedProcedure
    .input(
      z.object({
        entityID: z.string(),
        domain: z.string(),
        service: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await callService(input);
    }),
});
