import { CodeOutlined } from '@ant-design/icons';
import { Input, message } from 'antd';
import { InputProps } from 'antd/lib/input';
import moment from 'moment';
import React from 'react';
import ConfigurableFormItem from '../../components/formDesigner/components/formItem';
import { customEventHandler } from '../../components/formDesigner/components/utils';
import ReadOnlyDisplayFormItem from '../../components/readOnlyDisplayFormItem';
import { IToolboxComponent } from '../../interfaces';
import { DataTypes, StringFormats } from '../../interfaces/dataTypes';
import { useForm, useFormData, useGlobalState, useSheshaApplication } from '../../providers';
import { FormMarkup } from '../../providers/form/models';
import { evaluateString, getStyle, validateConfigurableComponentSettings } from '../../providers/form/utils';
import { axiosHttp } from '../../utils/fetchers';
import { ITextFieldComponentProps, TextType } from './interfaces';
import settingsFormJson from './settingsForm.json';
import { migrateCustomFunctions, migratePropertyName } from '../../designer-components/_common-migrations/migrateSettings';

const settingsForm = settingsFormJson as FormMarkup;

const renderInput = (type: TextType) => {
  switch (type) {
    case 'password':
      return Input.Password;
    default:
      return Input;
  }
};

const TextFieldComponent: IToolboxComponent<ITextFieldComponentProps> = {
  type: 'textField',
  isInput: true,
  isOutput: true,
  canBeJsSetting: true,
  name: 'Text field',
  icon: <CodeOutlined />,
  dataTypeSupported: ({ dataType, dataFormat }) =>
    dataType === DataTypes.string &&
    (dataFormat === StringFormats.singleline ||
      dataFormat === StringFormats.emailAddress ||
      dataFormat === StringFormats.phoneNumber ||
      dataFormat === StringFormats.password),
  factory: (model: ITextFieldComponentProps, _c, form) => {
    const { formMode, setFormDataAndInstance } = useForm();
    const { data: formData } = useFormData();
    const { globalState, setState: setGlobalState } = useGlobalState();
    const { backendUrl } = useSheshaApplication();

    const readOnly = model?.readOnly || (formMode === 'readonly' && model.textType !== 'password');

    const InputComponentType = renderInput(model.textType);

    const inputProps: InputProps = {
      className: 'sha-input',
      placeholder: model.placeholder,
      prefix: model.prefix,
      suffix: model.suffix,
      bordered: !model.hideBorder,
      maxLength: model.validate?.maxLength,
      size: model?.size,
      disabled: model.disabled,
      readOnly,
      style: getStyle(model?.style, formData),
    };

    const eventProps = {
      model,
      form,
      formData,
      formMode,
      globalState,
      http: axiosHttp(backendUrl),
      message,
      moment,
      setFormData: setFormDataAndInstance,
      setGlobalState,
    };

    return (
      <ConfigurableFormItem
        model={model}
        initialValue={
          (model?.passEmptyStringByDefault && '') ||
          evaluateString(model?.initialValue, { formData, formMode, globalState })
        }
      >
          {(value, onChange) => 
            readOnly 
              ? <ReadOnlyDisplayFormItem value={value} disabled={model.disabled} />
              : <InputComponentType {...inputProps} {...customEventHandler(eventProps)} disabled={model.disabled} value={value} onChange={onChange} />
          }
      </ConfigurableFormItem>
    );
  },
  settingsFormMarkup: settingsForm,
  validateSettings: (model) => validateConfigurableComponentSettings(settingsForm, model),
  initModel: (model) => ({
    textType: 'text',
    ...model,
  }),
  migrator: (m) => m
    .add<ITextFieldComponentProps>(0, (prev) => ({ ...prev, textType: 'text' }))
    .add<ITextFieldComponentProps>(1, (prev) => migratePropertyName(migrateCustomFunctions(prev)))
  ,
  linkToModelMetadata: (model, metadata): ITextFieldComponentProps => {
    return {
      ...model,
      textType: metadata.dataFormat === StringFormats.password ? 'password' : 'text',
    };
  },
};

export default TextFieldComponent;
