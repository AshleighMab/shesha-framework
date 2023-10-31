import React, { FC } from 'react';
import { IToolboxComponent, IValuable } from '../../../../interfaces';
import { IConfigurableFormComponent } from '../../../../providers/form/models';
import { LineOutlined } from '@ant-design/icons';
import { Progress, ProgressProps } from 'antd';
import { validateConfigurableComponentSettings } from '../../../../providers/form/utils';
import { alertSettingsForm } from './settings';
import { ProgressType } from 'antd/lib/progress/progress';
import ConfigurableFormItem from '../formItem';
import { migrateCustomFunctions, migratePropertyName } from '../../../../designer-components/_common-migrations/migrateSettings';

interface IProgressProps
  extends Omit<ProgressProps, 'style' | 'type' | 'size' | 'format' | 'success' | 'strokeColor'>,
    IConfigurableFormComponent {
  format?: string;
  progressType?: ProgressType;
  success?: string;
  strokeColor?: string;
  lineStrokeColor?: string;
  circleStrokeColor?: string;
}

const ProgressComponent: IToolboxComponent<IProgressProps> = {
  type: 'progress',
  name: 'Progress',
  icon: <LineOutlined />,
  factory: (model: IProgressProps) => {
    const {
      progressType,
      lineStrokeColor,
      circleStrokeColor,
      format,
      percent,
      status,
      showInfo,
      strokeColor,
      strokeLinecap,
      success,
      trailColor,
      steps,
      gapPosition,
      strokeWidth,
      width,
    } = model;

    if (model.hidden) return null;

    const getEvaluatedSuccessColor = () => {
      // tslint:disable-next-line:function-constructor
      return new Function(success)();
    };

    const getEvaluatedStrokeValue = () => {
      let color = strokeColor;
      let isLineOrCircle = false;

      if (progressType === 'line') {
        color = lineStrokeColor;
        isLineOrCircle = true;
      }

      if (progressType === 'circle') {
        color = circleStrokeColor;
        isLineOrCircle = true;
      }

      if (isLineOrCircle) {
        // tslint:disable-next-line:function-constructor
        return new Function(color)();
      } else {
        return color;
      }
    };

    const getEvaluatedFormat = (incomingPercent?: number, incomingSuccessPercent?: number) => {
      // tslint:disable-next-line:function-constructor
      return new Function('percent, successPercent', format)(incomingPercent, incomingSuccessPercent);
    };

    return (
      <ConfigurableFormItem model={model}>
        {(value) => {

          const perc = percent || value;

          return (
            <ProgressWrapper
              type={progressType}
              strokeColor={getEvaluatedStrokeValue()}
              format={getEvaluatedFormat}
              percent={perc}
              width={width}
              strokeWidth={strokeWidth}
              gapPosition={gapPosition}
              steps={steps}
              trailColor={trailColor}
              status={status}
              showInfo={showInfo}
              strokeLinecap={strokeLinecap}
              success={getEvaluatedSuccessColor()}
            />);
        }}
      </ConfigurableFormItem>
    );
  },
  settingsFormMarkup: alertSettingsForm,
  validateSettings: model => validateConfigurableComponentSettings(alertSettingsForm, model),
  migrator: (m) => m
    .add<IProgressProps>(0, (prev) => migratePropertyName(migrateCustomFunctions(prev)))
  ,
};

const ProgressWrapper: FC<IValuable & ProgressProps> = ({ percent, value, ...props }) => {
  return <Progress {...props} percent={percent || value} />;
};

export default ProgressComponent;
