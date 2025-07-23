import { getItemPositionById } from './utils';
import { handleActions } from 'redux-actions';
import { IModelItem } from '@/interfaces/modelConfigurator';
import { MetadataSourceType } from '@/interfaces/metadata';
import { ModelActionEnums } from './actions';
import {
  IAddItemPayload,
  IPropertiesEditorStateContext,
  IUpdateChildItemsPayload,
  IUpdateItemSettingsPayload,
  PROPERTIES_EDITOR_CONTEXT_INITIAL_STATE,
} from './contexts';
import { DataTypes } from '@/index';

const findItemById = (items: IModelItem[], id: string): IModelItem => {
  for (const item of items) {
    if (item.id === id)
      return item;
    if (item.properties && item.properties.length > 0) {
      const nested = findItemById(item.properties, id);
      if (nested)
        return nested;
    }
  }

  return null;
};

function removeIdDeep(list: IModelItem[], idToRemove: string) {
  const filtered = list.filter(entry => entry.id !== idToRemove);
  return filtered.map(entry => {
    if (!entry.properties) return entry;
    return { ...entry, properties: removeIdDeep(entry.properties, idToRemove) };
  });
}

const modelReducer = handleActions<IPropertiesEditorStateContext, any>(
  {
    [ModelActionEnums.AddItem]: (
      state: IPropertiesEditorStateContext,
      action: ReduxActions.Action<IAddItemPayload | null>
    ) => {
      const { payload } = action;

      const itemProps: IModelItem = {
        name: `New property`,
        id: payload.item?.id ?? '00000000-0000-0000-0000-000000000000', // Guid.Empty
        source: MetadataSourceType.UserDefined
      };

      const newItems = [...state.items];

      const parent = Boolean(payload.parentId)
        ? findItemById(newItems, payload.parentId)
        : null;

      if (parent) {
        parent.properties = [...(parent.properties ?? []), itemProps];
      } else newItems.push(itemProps);

      return {
        ...state,
        items: newItems,
        selectedItemId: itemProps.id,
      };
    },

    [ModelActionEnums.DeleteItem]: (
      state: IPropertiesEditorStateContext,
      action: ReduxActions.Action<string>
    ) => {
      const { payload } = action;

      const items = removeIdDeep([...state.items], payload);

      return {
        ...state,
        items,
        selectedItemId: state.selectedItemId === payload ? null : state.selectedItemId,
      };
    },

    [ModelActionEnums.SelectItem]: (
      state: IPropertiesEditorStateContext,
      action: ReduxActions.Action<string>
    ) => {
      const { payload } = action;

      return {
        ...state,
        selectedItemId: payload,
      };
    },

    [ModelActionEnums.UpdateItem]: (
      state: IPropertiesEditorStateContext,
      action: ReduxActions.Action<IUpdateItemSettingsPayload>
    ) => {
      const { payload } = action;

      const newItems = [...state.items];

      const position = getItemPositionById(newItems, payload.id);

      if (!position) return state;

      const newArray = position.ownerArray;

      newArray[position.index] = {
        ...newArray[position.index],
        ...payload.settings,
      };

      return {
        ...state,
        items: newItems,
      };
    },

    [ModelActionEnums.UpdateChildItems]: (
      state: IPropertiesEditorStateContext,
      action: ReduxActions.Action<IUpdateChildItemsPayload>
    ) => {
      const {
        payload: { index, childs: childIds },
      } = action;
      if (!Boolean(index) || index.length === 0) {
        return {
          ...state,
          items: childIds,
        };
      }
      // copy all items
      const newItems = [...state.items];
      // blockIndex - full index of the current container
      const blockIndex = [...index];
      // lastIndex - index of the current element in its' parent
      const lastIndex = blockIndex.pop();

      // search for a parent item
      const lastArr = blockIndex.reduce((arr, i) => (
        arr[i].dataType === DataTypes.array && arr[i].dataFormat === DataTypes.object && arr[i].properties[0]
          // for objects array we need to set a list of properties for the internal itemsType
          ? arr[i].properties[0].properties
          : arr[i]['properties']
      ), newItems);

      // get changed Item
      const item = lastArr[lastIndex];

      // and set a list of childs
      if (item.dataType === DataTypes.array && item.dataFormat === DataTypes.object) {
        // for objects array we need to set a list of properties for the internal itemsType
        item.properties[0].properties = childIds;
      } else {
        lastArr[lastIndex]['properties'] = childIds;
      }

      return {
        ...state,
        items: newItems,
      };
    },
  },

  PROPERTIES_EDITOR_CONTEXT_INITIAL_STATE
);

export default modelReducer;