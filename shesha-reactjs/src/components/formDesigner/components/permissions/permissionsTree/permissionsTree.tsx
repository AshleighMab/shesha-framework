import { IToolboxComponent } from '../../../../../interfaces';
import { FormMarkup, IConfigurableFormComponent } from '../../../../../providers/form/models';
import { ApartmentOutlined } from '@ant-design/icons';
import settingsFormJson from './settingsForm.json';
import React from 'react';
import { validateConfigurableComponentSettings } from '../../../../../providers/form/utils';
import { PermissionsTree, PermissionsTreeMode } from '../../../../permissionsTree';
import { useForm } from '../../../../..';
import ConfigurableFormItem from '../../formItem';
import { migrateCustomFunctions, migratePropertyName } from '../../../../../designer-components/_common-migrations/migrateSettings';

export interface IPermissionsTreeComponentProps extends IConfigurableFormComponent {
  value?: string[];
  updateKey?: string;
  onChange?: (values?: string[]) => void;
  /**
   * Whether this control is disabled
   */
   disabled?: boolean;
  /**
   * If true, the automplete will be in read-only mode. This is not the same sa disabled mode
   */
  readOnly?: boolean;
  height?: number;
  mode: PermissionsTreeMode;  
}

const settingsForm = settingsFormJson as FormMarkup;

const PermissionedObjectsTreeComponent: IToolboxComponent<IPermissionsTreeComponentProps> = {
  type: 'permissionsTree',
  name: 'Permissions tree',
  icon: <ApartmentOutlined />,
  factory: (model: IPermissionsTreeComponentProps) => {
    const { formMode } = useForm();

    if (model.mode === 'Edit') {
      return (
        <PermissionsTree 
          formComponentId={model?.id}
          formComponentName={model.propertyName}
          value={model?.value} 
          updateKey={model?.updateKey}
          onChange={model?.onChange}
          readOnly={model?.readOnly || formMode === 'readonly'}
          disabled={model?.disabled}
          mode={model?.mode ?? "Select"}
          height={model?.height}
        />
      );
    } else {
      return (
        <ConfigurableFormItem model={model}>
          {(value, onChange) =>
            <PermissionsTree 
              formComponentId={model?.id}
              formComponentName={model.propertyName}
              value={value} 
              updateKey={model?.updateKey}
              onChange={onChange}
              readOnly={model?.readOnly || formMode === 'readonly'}
              disabled={model?.disabled}
              mode={model?.mode ?? "Select"}
              height={model?.height}
            />
          }
          </ConfigurableFormItem>
      );
    };
  },
  initModel: (model: IPermissionsTreeComponentProps) => {
    return {
      ...model,
    };
  },
  settingsFormMarkup: settingsForm,
  validateSettings: model => validateConfigurableComponentSettings(settingsForm, model),
  linkToModelMetadata: (model): IPermissionsTreeComponentProps => {
    return {
      ...model,
    };
  },
  migrator: (m) => m
    .add<IPermissionsTreeComponentProps>(0, (prev) => migratePropertyName(migrateCustomFunctions(prev)) as IPermissionsTreeComponentProps)
  ,
};

export default PermissionedObjectsTreeComponent;
