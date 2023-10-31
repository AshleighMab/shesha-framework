import { GetDataError } from 'hooks';
import { createContext } from 'react';
import { IConfigurableFormComponent, IFlatComponentsStructure } from '../../interfaces';
import { IFormSettings, IPersistedFormProps } from '../form/models';

export interface IPersistedFormPayload
  extends Pick<IPersistedFormProps, 'id' | 'versionNo' | 'versionStatus' | 'description' | 'module' | 'name'> { }

export interface IFetchDataErrorPayload {
  error: GetDataError<unknown>;
}

export interface ISubFormStateContext extends IPersistedFormPayload, IFlatComponentsStructure {
  /** True only if the config was fetched from the server using formId
   * If the markup was passed to the sub form, this will be false
   */
  hasFetchedConfig?: boolean;
  initialValues?: any;
  components?: IConfigurableFormComponent[];
  formSettings?: IFormSettings;
  propertyName?: string;
  errors?: {
    getData?: GetDataError<unknown>;
    getForm?: GetDataError<unknown>;
    postData?: GetDataError<unknown>;
    putData?: GetDataError<unknown>;
  };
  loading?: {
    getData?: boolean;
    getForm?: boolean;
    postData?: boolean;
    putData?: boolean;
  };
  value?: any;
  context?: string;
}

export interface ISubFormActionsContext {
  getData?: () => void;
  postData?: () => void;
  putData?: () => void;
  deleteData?: () => void;
  getChildComponents: (id: string) => IConfigurableFormComponent[];
}

export const SUB_FORM_CONTEXT_INITIAL_STATE: ISubFormStateContext = {
  components: [],
  allComponents: {},
  componentRelations: {},
  formSettings: null,
  loading: {},
  errors: {},
};

export const SubFormContext = createContext<ISubFormStateContext>(SUB_FORM_CONTEXT_INITIAL_STATE);

export const SubFormActionsContext = createContext<ISubFormActionsContext>(undefined);
