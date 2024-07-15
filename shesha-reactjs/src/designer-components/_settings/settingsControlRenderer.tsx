import React, { FC, useRef } from 'react';
import { IConfigurableFormComponent } from '@/providers';
import { useForm } from '@/index';

interface SettingsControlRendererProps {
    id: string;
    component: IConfigurableFormComponent;
    propertyName: string;
}

export const SettingsControlRenderer: FC<SettingsControlRendererProps> = ({component, propertyName}) => {
    const model = { ...component, propertyName };

    const form = useForm();
    const componentRef = useRef();
    const toolboxComponent = form.getToolboxComponent(model.type);

    if (!toolboxComponent) return null;

    return <toolboxComponent.Factory key={model.propertyName} model={model} componentRef={componentRef} form={form.form} />;
};