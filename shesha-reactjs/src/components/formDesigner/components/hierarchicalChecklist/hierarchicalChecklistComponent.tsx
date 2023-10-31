import { ApartmentOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';
import { migrateCustomFunctions, migratePropertyName } from '../../../../designer-components/_common-migrations/migrateSettings';
import React, { MutableRefObject } from 'react';
import { IToolboxComponent } from '../../../../interfaces';
import { useFormData } from '../../../../providers';
import { FormMarkup, IConfigurableFormComponent } from '../../../../providers/form/models';
import { evaluateString, validateConfigurableComponentSettings } from '../../../../providers/form/utils';
import { IHierarchicalCheckListProps } from '../../../hierarchicalCheckList';
import { CheckListSelectionType, ISaveSelectionsInput } from '../../../hierarchicalCheckList/interface';
import ConfigurableFormItem, { IConfigurableFormItemProps } from '../formItem';
import HierarchicalCheckListWrapper from './hierarchicalChecklistWrapper';
import settingsFormJson from './settingsForm.json';

const isUuid = (value: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);

export interface IHierarchicalChecklistProps extends IHierarchicalCheckListProps, IConfigurableFormComponent {
  readonly checklistId: string;
  readonly customHint?: string;
}

export const isChecklistChecked = ({ selection: s }: ISaveSelectionsInput) =>
  !!s.filter(({ selection }) => selection === CheckListSelectionType.Yes)?.length;

export const isChecklistPopulated = ({ selection: s }: ISaveSelectionsInput) => !!s?.length;

const settingsForm = settingsFormJson as FormMarkup;

const HierarchicalChecklistComponent: IToolboxComponent<IHierarchicalChecklistProps> = {
  type: 'checklist',
  name: 'Hierarchical Checklist',
  icon: <ApartmentOutlined />,
  factory: (model: IHierarchicalChecklistProps, _componentRef: MutableRefObject<any>) => {
    const { data: formData } = useFormData();

    // TODO:: Review - formData?.ownerType, formData?.ownerId and formData?.checklistId need to be removed
    const ownerType = evaluateString(formData?.ownerType || model?.ownerType, { data: formData });
    const ownerId = evaluateString(formData?.ownerId || model?.ownerId, { data: formData });
    const checklistId = evaluateString(formData?.checklistId || model?.checklistId, { data: formData });

    const renderChecklist = (value, onChange) => {
      if (!isUuid(checklistId)) {
        return model?.dropdown ? <Skeleton.Input style={{ width: 250 }} active={false} size="default" /> : <Skeleton />;
      }

      return (
        <HierarchicalCheckListWrapper
          id={checklistId}
          ownerType={ownerType}
          ownerId={ownerId}
          readOnly={model?.disabled}
          dropdown={model?.dropdown}
          saveLocally={model?.saveLocally}
          hint={model?.customHint}
          value={value}
          onChange={onChange}
        />
      );
    };

    if (model.hidden) return null;

    const wrapperColProps: Omit<IConfigurableFormItemProps, 'model'> = model?.dropdown
      ? {}
      : { wrapperCol: { span: 24 } };

    return (
      <ConfigurableFormItem {...wrapperColProps} model={model?.dropdown ? model : { ...model, hideLabel: true }}>
        {renderChecklist}
      </ConfigurableFormItem>
    );
  },
  settingsFormMarkup: settingsForm,
  validateSettings: (model) => validateConfigurableComponentSettings(settingsForm, model),
  initModel: (model) => {
    const checklistModel = model as IHierarchicalChecklistProps;

    const customModel: IHierarchicalChecklistProps = {
      ...checklistModel,
      ownerId: '{data.ownerId}',
      checklistId: '{data.checklist.id}',
      ownerType: '',
    };
    return customModel;
  },
  migrator: (m) => m
    .add<IHierarchicalChecklistProps>(0, (prev) => migratePropertyName(migrateCustomFunctions(prev) as IHierarchicalChecklistProps))
  ,

};

export default HierarchicalChecklistComponent;
