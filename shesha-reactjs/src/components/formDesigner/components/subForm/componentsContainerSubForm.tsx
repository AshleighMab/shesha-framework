import { getAlignmentStyle } from 'components/formDesigner/containers/componentsContainerForm';
import { IComponentsContainerBaseProps } from 'interfaces';
import { useGlobalState, useSubForm } from 'providers';
import React, { FC, useCallback } from 'react';
import { removeUndefinedProperties } from 'utils/array';
import { executeScriptSync } from 'utils/publicUtils';
import { ICommonContainerProps } from '../../../../designer-components/container/interfaces';
import DynamicComponent from '../dynamicView/dynamicComponent';

interface IComponentsContainerSubFormProps extends IComponentsContainerBaseProps, ICommonContainerProps {}

export const ComponentsContainerSubForm: FC<IComponentsContainerSubFormProps> = (props) => {
  const { containerId, readOnly } = props;
  const { getChildComponents, context } = useSubForm();
  const components = getChildComponents(containerId);

  const style = getAlignmentStyle(props);

  //alias added for readability and avoiding names clashes
  const { value: subFormData } = useSubForm();
  const { globalState } = useGlobalState();

  const executeExpression = useCallback(
    (expression: string) => {
      if (!expression) return true;
      const evaluated = executeScriptSync(expression, { data: subFormData, globalState });
      return typeof evaluated === 'boolean' ? evaluated : true;
    },
    [subFormData, globalState]
  );

  const getReadOnlyState = (isReadOnly: boolean) => (typeof readOnly === 'boolean' ? readOnly : isReadOnly);

  return (
    <div style={removeUndefinedProperties(style)}>
      {components
        ?.filter(({ customVisibility }) => {
          return executeExpression(customVisibility);
        })
        .map(({ customEnabled, disabled: notabled, ...model }) => {
          const disabled = !executeExpression(customEnabled) || notabled;

          return (
            <DynamicComponent
              model={{
                ...model,
                context,
                isDynamic: true,
                readOnly: getReadOnlyState(model?.readOnly),
                disabled,
                customEnabled: '',
              }}
              key={model?.id}
            />
          );
        })}
    </div>
  );
};

ComponentsContainerSubForm.displayName = 'ComponentsContainer(SubForm)';
