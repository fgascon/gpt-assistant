import { search } from 'googlethis';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

function cleanup<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const output: Partial<T> = {};
  Object.keys(obj).forEach((key: keyof T) => {
    const value = obj[key];
    if (
      value !== null &&
      value !== undefined &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      output[key] = value;
    }
  });
  return output;
}

async function googleSearch(terms: string) {
  const { results, featured_snippet, knowledge_panel, unit_converter } =
    await search(terms, {
      page: 0,
      safe: false, // Safe Search
      parse_ads: false, // If set to true sponsored results will be parsed
      additional_params: {
        // add additional parameters here, see https://moz.com/blog/the-ultimate-guide-to-the-google-search-parameters and https://www.seoquake.com/blog/google-search-param/
        hl: 'en',
      },
    });

  if (unit_converter.formula || unit_converter.input || unit_converter.output) {
    return { unit_converter };
  }

  const firstResult = results[0];
  if (!firstResult) {
    return undefined;
  }

  const featured =
    featured_snippet.title ?? featured_snippet.description
      ? cleanup({ ...featured_snippet })
      : undefined;
  const panel =
    knowledge_panel.title ?? knowledge_panel.description
      ? cleanup({ ...knowledge_panel })
      : undefined;
  return {
    featured,
    panel,
    first: {
      title: firstResult.title,
      description: firstResult.description,
      url: firstResult.url,
    },
  };
}

export const googleRouter = createTRPCRouter({
  search: protectedProcedure.input(z.string()).query(async req => {
    return await googleSearch(req.input);
  }),
});
