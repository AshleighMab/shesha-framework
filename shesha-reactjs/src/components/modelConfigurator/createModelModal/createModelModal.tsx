import { ConfigurableForm,  FormMarkup, useModelConfigurator } from '@/index';
import { Modal, message } from 'antd';
import React, { FC } from 'react';

import markup from './createModelModal.json';
import { useShaFormRef } from '@/providers/form/providers/shaFormProvider';

export interface ICreateModelModalProps {
}

export const CreateModelModal: FC<ICreateModelModalProps> = () => {

  //const [modal, contextHolder] = Modal.useModal();
  const { isCreateNew, save, cancel } = useModelConfigurator();
  const formRef = useShaFormRef();

  const handleOk = () => {
    formRef.current?.submit();
  };

  const onSave = (values) => {
    save(values)
      .then(() => {
        message.success('Configuration saved successfully');
      })
      .catch((error) => {
        if (!error?.errorFields) message.error('Failed to save configuration');
      })
      .finally(() => {
      });
  };

  return isCreateNew &&
    <>
      <Modal
        title="Create entity confifurations"
        open={isCreateNew}
        onOk={handleOk}
        onCancel={cancel}
        width={'50%'}
      >
        <ConfigurableForm
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          mode='edit'
          //className='sha-form-settings-editor'
          shaFormRef={formRef}
          onFinish={onSave}
          markup={markup as FormMarkup}
          //initialValues={formSettings}
        />
      </Modal>
    </>
  ;
};