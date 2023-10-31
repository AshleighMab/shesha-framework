import { useEffect, useMemo, useState } from 'react';
import { IConfigurableFormComponent, useFormExpression, useSheshaApplication } from '../../../../';
import { IConfigurableActionConfiguration } from '../../../../interfaces/configurableAction';
import { useForm } from '../../../../providers';
import { useConfigurableAction } from '../../../../providers/configurableActionsDispatcher';
import { IWizardComponentProps, IWizardStepProps } from './models';
import { getDefaultStep, getStepDescritpion, getWizardStep, isEmptyArgument } from './utils';

interface IWizardComponent {
  back: () => void;
  components: IConfigurableFormComponent[];
  current: number;
  currentStep: IWizardStepProps;
  cancel: () => void;
  done: () => void;
  content: (description: string, index: number) => string;
  next: () => void;
  visibleSteps: IWizardStepProps[];
}

export const useWizard = (model: Omit<IWizardComponentProps, 'size'>): IWizardComponent => {
  const { anyOfPermissionsGranted } = useSheshaApplication();
  const { formMode } = useForm();

  const { argumentsEvaluationContext, executeBooleanExpression, executeExpression, executeAction } =
    useFormExpression();

  const {
    propertyName: actionOwnerName,
    id: actionsOwnerId,
    steps: tabs,
    defaultActiveValue,
    defaultActiveStep,
    showStepStatus,
    sequence,
  } = (model as IWizardComponentProps) || {};

  const [current, setCurrent] = useState(() => {
    const localCurrent = defaultActiveStep ? tabs?.findIndex(({ id }) => id === defaultActiveStep) : 0;

    return localCurrent < 0 ? 0 : localCurrent;
  });

  const [components, setComponents] = useState<IConfigurableFormComponent[]>();

  //Remove every tab from the equation that isn't visible either by customVisibility or permissions
  const visibleSteps = useMemo(
    () =>
      tabs.filter(({ customVisibility, permissions }) => {
        const granted = anyOfPermissionsGranted(permissions || []);
        const isVisibleByCondition = executeBooleanExpression(customVisibility, true);

        return !((!granted || !isVisibleByCondition) && formMode !== 'designer');
      }),
    [tabs]
  );

  const currentStep = visibleSteps[current];

  useEffect(() => {
    if (defaultActiveStep || defaultActiveValue) {
      setCurrent(getDefaultStep(tabs, defaultActiveValue, defaultActiveStep, executeExpression));
    }
  }, [defaultActiveValue, defaultActiveStep]);

  useEffect(() => {
    const actionConfiguration = currentStep?.onBeforeRenderActionConfiguration;

    if (!isEmptyArgument(actionConfiguration)) {
      executeAction({
        actionConfiguration: actionConfiguration,
        argumentsEvaluationContext
      });
    }
  }, [currentStep]);

  const actionDependencies = [actionOwnerName, actionsOwnerId, current];

  // #region configurable actions
  useConfigurableAction(
    {
      name: 'Back',
      owner: actionOwnerName,
      ownerUid: actionsOwnerId,
      hasArguments: false,
      executer: () => {
        back();
        return Promise.resolve();
      },
    },
    actionDependencies
  );

  useConfigurableAction(
    {
      name: 'Next',
      owner: actionOwnerName,
      ownerUid: actionsOwnerId,
      hasArguments: false,
      executer: () => {
        next();
        return Promise.resolve();
      },
    },
    actionDependencies
  );

  useConfigurableAction(
    {
      name: 'Cancel',
      owner: actionOwnerName,
      ownerUid: actionsOwnerId,
      hasArguments: false,
      executer: () => {
        cancel();
        return Promise.resolve();
      },
    },
    actionDependencies
  );

  useConfigurableAction(
    {
      name: 'Done',
      owner: actionOwnerName,
      ownerUid: actionsOwnerId,
      hasArguments: false,
      executer: () => {
        done();
        return Promise.resolve();
      },
    },
    actionDependencies
  );
  //#endregion

  const onAfterCallback = (callback: () => void, after?: (step: IWizardStepProps) => void) => {
    try {
      callback();
    } finally {
      if (after) after(currentStep);
    }
  };

  const successCallback = (type: 'back' | 'next') => {
    setTimeout(() => {
      const step = getWizardStep(visibleSteps, current, type);

      if (step >= 0 && step !== current) {
        setCurrent(step);
      }
      setComponents(currentStep?.components);
    }, 100); // It is necessary to have time to complete a request
  };

  /// NAVIGATION
  const executeActionIfConfigured = (
    beforeAccessor: (step: IWizardStepProps) => IConfigurableActionConfiguration,
    afterAccessor: (step: IWizardStepProps) => IConfigurableActionConfiguration,
    success?: (actionResponse: any) => void,
  ) => {
    const beforeAction = beforeAccessor(currentStep);

    const successFunc = (response: any) => {
      onAfterCallback(
        () => { 
          if (success) success(response);
        },
        () => {
          const afterAction = afterAccessor(currentStep);
          if (!isEmptyArgument(afterAction))
            executeAction({
              actionConfiguration: afterAction,
              argumentsEvaluationContext
            });
        }
      );
    };

    if (isEmptyArgument(beforeAction)) {
      successFunc(null);
      return;
    }

    executeAction({
      actionConfiguration: beforeAction,
      argumentsEvaluationContext,
      success: successFunc,
    });
  };

  const next = () => {
    if (current < tabs.length - 1)
      executeActionIfConfigured(
        (tab) => tab.beforeNextActionConfiguration,
        (tab) => tab.afterNextActionConfiguration,
        () => successCallback('next'),
      );
  };

  const back = () => {
    if (current > 0)
      executeActionIfConfigured(
        (tab) => tab.beforeBackActionConfiguration,
        (tab) => tab.afterBackActionConfiguration,
        () => successCallback('back'),
      );
  };

  const cancel = () =>
    executeActionIfConfigured(
      (tab) => tab.beforeCancelActionConfiguration,
      (tab) => tab.afterCancelActionConfiguration
    );

  const done = () =>
    executeActionIfConfigured(
      (tab) => tab.beforeDoneActionConfiguration,
      (tab) => tab.afterDoneActionConfiguration
    );


  const content = getStepDescritpion(showStepStatus, sequence, current);

  return { back, components, current, currentStep, cancel, done, content, next, visibleSteps };
};
