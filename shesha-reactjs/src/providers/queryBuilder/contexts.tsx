import { Widgets } from '@react-awesome-query-builder/antd';
import { createContext } from 'react';
//import { IPropertyItem } from '../../components/propertyAutocomplete/propertySelect';
import { IModelMetadata } from '../../interfaces/metadata';
import { IProperty } from './models';

export interface IQueryBuilderStateContext {
  fields: IProperty[];
  id?: string;
  customWidgets?: Widgets;
}

export interface IQueryBuilderActionsContext {
  setFields: (fields: IProperty[]) => void;
  fetchFields: (fieldNames: string[]) => void;
  fetchContainer: (containerPath: string) => Promise<IModelMetadata>;

  /* NEW_ACTION_ACTION_DECLARATIO_GOES_HERE */
}

export const QUERY_BUILDER_CONTEXT_INITIAL_STATE: IQueryBuilderStateContext = {
  fields: [],  
};

export const QueryBuilderStateContext = createContext<IQueryBuilderStateContext>(QUERY_BUILDER_CONTEXT_INITIAL_STATE);

export const QueryBuilderActionsContext = createContext<IQueryBuilderActionsContext>(undefined);
