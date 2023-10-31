import React, { FC } from 'react';
import { Select, Input, Checkbox } from 'antd';
import SectionSeparator from '../../../sectionSeparator';
import EditableTagGroup from '../../../editableTagGroup';
import { ITabPaneProps, ITabsComponentProps } from './models';
import ItemListSettingsModal from '../itemListConfigurator/itemListSettingsModal';
import itemSettings from './itemSettings.json';
import { FormMarkup } from '../../../../providers/form/models';
import { nanoid } from 'nanoid/non-secure';
import { ISettingsFormFactoryArgs } from 'interfaces';
import SettingsForm, { useSettingsForm } from '../../../../designer-components/_settings/settingsForm';
import SettingsFormItem from '../../../../designer-components/_settings/settingsFormItem';

const { Option } = Select;

export const TabSettingsForm: FC<ISettingsFormFactoryArgs<ITabsComponentProps>> = (props) => {
  return (
    SettingsForm<ITabsComponentProps>({...props, children: <TabSettings {...props}/>})
  );
};

const TabSettings: FC<ISettingsFormFactoryArgs<ITabsComponentProps>> = ({readOnly}) => {
  const { model } = useSettingsForm<ITabsComponentProps>();

  const onAddNewItem = (_, count: number) => {
    const id = nanoid();
    const buttonProps: ITabPaneProps = {
      id: id,
      itemType: 'item',
      sortOrder: count,
      name: `Tab${count + 1}`,
      key: id,
      title: `Tab ${count + 1}`,
      components: [],
    };

    return buttonProps;
  };

  const tabs = model.tabs?.map((item) => ({ ...item, label: item?.title }));

  return (
    <>
      <SectionSeparator title="Display" />
      <SettingsFormItem name="componentName" label="Component name" required={true}>
        <Input />
      </SettingsFormItem>

      <SettingsFormItem name="defaultActiveKey" label="Default Active Key" required={true}>
        <Input />
      </SettingsFormItem>

      <SettingsFormItem name="tabType" label="Tab Type">
        <Select allowClear>
          <Option value="line">Line</Option>
          <Option value="card">Card</Option>
        </Select>
      </SettingsFormItem>

      <SettingsFormItem name="size" label="Size" tooltip="This will set the size for all buttons" jsSetting >
        <Select>
          <Option value="small">Small</Option>
          <Option value="middle">Middle</Option>
          <Option value="large">Large</Option>
        </Select>
      </SettingsFormItem>

      <SettingsFormItem name="position" label="Position" tooltip="This will set the size for all buttons" jsSetting>
        <Select>
          <Option value="top">Top</Option>
          <Option value="bottom">Bottom</Option>
          <Option value="left">Left</Option>
          <Option value="right">Right</Option>
        </Select>
      </SettingsFormItem>

      <SettingsFormItem name="hidden" label="Hidden" valuePropName="checked" jsSetting>
        <Checkbox disabled={readOnly} />
      </SettingsFormItem>

      <SettingsFormItem name="visibility" label="Visibility"
        tooltip="This property will eventually replace the 'hidden' property and other properties that toggle visibility on the UI and payload"
        jsSetting
      >
        <Select>
          <Option value="Yes">Yes (Display in UI and include in payload)</Option>
          <Option value="No">No (Only include in payload)</Option>
          <Option value="Removed">Removed (Remove from UI and exlude from payload)</Option>
        </Select>
      </SettingsFormItem>

      <SectionSeparator title="Configure Tab Panes" />

      <SettingsFormItem name="tabs">
        <ItemListSettingsModal
          options={{ onAddNewItem }}
          title="Configure Tabs"
          heading="Settings"
          insertMode="after"
          callToAction="Configure Tab Panes"
          itemTypeMarkup={itemSettings as FormMarkup}
          allowAddGroups={false}
          value={tabs}
        />
      </SettingsFormItem>

      <SectionSeparator title="Security" />

      <SettingsFormItem
        label="Permissions"
        name="permissions"
        tooltip="Enter a list of permissions that should be associated with this component"
        jsSetting
      >
        <EditableTagGroup />
      </SettingsFormItem>
    </>
  );
};