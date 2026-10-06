import { createAsyncThunk } from '@reduxjs/toolkit';
import { pickCustomGraphScopeForStorage } from '../../../variants/customized/utils/mergeCustomGraphScopeIntoApiParams';
import { isCustomGraphGroupScope } from '../../../variants/customized/utils/filterGroupIdsByAreaGroupScope';
import { CUSTOM_GRAPHS_UPDATED_EVENT } from './customGraphConstants';
import { normalizeCustomGraphApiPath } from './customGraphApiPaths';
import {
  createCustomGraphId,
  readCustomGraphsFromStorage,
  writeCustomGraphsToStorage,
} from './customGraphStorage';

function normalizeRenameError(err) {
  if (typeof err === 'string') return err;
  if (err?.message) return err.message;
  return 'Request failed';
}

export function createVariantCustomGraphThunks(variant) {
  const variantKey = String(variant || '').toLowerCase();

  const fetchCustomGraphs = createAsyncThunk(
    `customGraphs/${variantKey}/fetch`,
    async (_, { rejectWithValue }) => {
      try {
        return readCustomGraphsFromStorage(variantKey).map((g) => ({
          ...g,
          api_path: g?.api_path?.trim?.()
            ? g.api_path
            : normalizeCustomGraphApiPath('', g?.name),
        }));
      } catch (err) {
        return rejectWithValue(normalizeRenameError(err));
      }
    }
  );

  const createCustomGraph = createAsyncThunk(
    `customGraphs/${variantKey}/create`,
    async (payload, { rejectWithValue }) => {
      try {
        const name = String(payload?.name ?? '').trim();
        if (!name) return rejectWithValue('Widget name is required');

        const list = readCustomGraphsFromStorage(variantKey);
        const duplicate = list.some(
          (g) => String(g?.name ?? '').trim().toLowerCase() === name.toLowerCase()
        );
        if (duplicate) return rejectWithValue('Name already exists. Change the widget name.');

        const api_path = normalizeCustomGraphApiPath(payload?.api_path, name);
        const scopeFields = pickCustomGraphScopeForStorage(payload);

        const item = {
          id: createCustomGraphId(),
          page: payload?.page,
          graph_type: payload?.graph_type,
          name,
          api_path,
          ...scopeFields,
          ...(isCustomGraphGroupScope(payload?.group_scope)
            ? { group_scope: payload.group_scope }
            : {}),
          ...(Array.isArray(payload?.scoped_group_ids) && payload.scoped_group_ids.length > 0
            ? { scoped_group_ids: payload.scoped_group_ids.slice() }
            : {}),
          ...(payload?.is_area_group_widget
            ? {
                is_area_group_widget: true,
                custom_area_group_ids: Array.isArray(payload.custom_area_group_ids)
                  ? payload.custom_area_group_ids.slice()
                  : [],
              }
            : {}),
        };

        writeCustomGraphsToStorage(variantKey, [...list, item]);
        window.dispatchEvent(new CustomEvent(CUSTOM_GRAPHS_UPDATED_EVENT));
        return item;
      } catch (err) {
        return rejectWithValue(normalizeRenameError(err));
      }
    }
  );

  const deleteCustomGraph = createAsyncThunk(
    `customGraphs/${variantKey}/delete`,
    async (graphId, { rejectWithValue }) => {
      try {
        const id = String(graphId ?? '').trim();
        if (!id) return rejectWithValue('Graph id is required');
        const list = readCustomGraphsFromStorage(variantKey);
        writeCustomGraphsToStorage(
          variantKey,
          list.filter((g) => String(g?.id ?? '') !== id)
        );
        window.dispatchEvent(new CustomEvent(CUSTOM_GRAPHS_UPDATED_EVENT));
        return id;
      } catch (err) {
        return rejectWithValue(normalizeRenameError(err));
      }
    }
  );

  return { fetchCustomGraphs, createCustomGraph, deleteCustomGraph };
}
