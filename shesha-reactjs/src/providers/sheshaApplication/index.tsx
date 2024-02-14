import appConfiguratorReducer from './reducer';
import ConditionalWrap from '@/components/conditionalWrapper';
import DebugPanel from '@/components/debugPanel';
import IRequestHeaders from '@/interfaces/requestHeaders';
import React, { FC, PropsWithChildren, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { ApplicationActionsProcessor } from './configurable-actions/applicationActionsProcessor';
import { ConfigurableActionDispatcherProvider } from '@/providers/configurableActionsDispatcher';
import { ConfigurationItemsLoaderProvider } from '@/providers/configurationItemsLoader';
import { DataContextManager } from '@/providers/dataContextManager';
import { DataContextProvider } from '@/providers/dataContextProvider';
import { DataSourcesProvider } from '@/providers/dataSourcesProvider';
import { FRONT_END_APP_HEADER_NAME } from './models';
import { IToolboxComponentGroup } from '@/interfaces';
import { ReferenceListDispatcherProvider } from '@/providers/referenceListDispatcher';
import { IRouter } from '@/providers/shaRouting';
import { SettingsProvider } from '@/providers/settings';
import { StackedNavigationProvider } from '@/generic-pages/dynamic/navigation/stakedNavigation';
import { useDeepCompareEffect } from 'react-use';
import {
  FormIdentifier,
  IAuthProviderRefProps,
  ThemeProvider,
  ThemeProviderProps,
  DynamicActionsDispatcherProvider,
  MetadataDispatcherProvider,
  AuthProvider,
  ShaRoutingProvider,
  AppConfiguratorProvider,
  DynamicModalProvider,
  UiProvider,
} from '@/providers';
import {
  setBackendUrlAction,
  setGlobalVariablesAction,
  setHeadersAction,
  updateToolboxComponentGroupsAction,
} from './actions';
import {
  DEFAULT_ACCESS_TOKEN_NAME,
  DEFAULT_SHESHA_ROUTES,
  ISheshaRutes,
  SHESHA_APPLICATION_CONTEXT_INITIAL_STATE,
  SheshaApplicationActionsContext,
  SheshaApplicationStateContext,
} from './contexts';
import { SheshaCommonContexts } from '../dataContextManager/models';
import { GlobalSheshaStyles } from '@/components/mainLayout/styles/indexStyles';
import { GlobalPageStyles } from '@/components/page/styles/styles';
import { nanoid } from '@/utils/uuid';

export interface IShaApplicationProviderProps {
  backendUrl: string;
  applicationName?: string;
  accessTokenName?: string;
  router?: IRouter;
  toolboxComponentGroups?: IToolboxComponentGroup[];
  unauthorizedRedirectUrl?: string;
  themeProps?: ThemeProviderProps;
  routes?: ISheshaRutes;
  noAuth?: boolean;
  homePageUrl?: string;
  /**
   * Unique identifier (key) of the front-end application, is used to separate some settings and application parts when use multiple front-ends
   */
  applicationKey?: string;
  getFormUrlFunc?: (formId: FormIdentifier) => string;
}

interface IMyCustomContext {
  property1: string;
  property2: number;
}

class MyCustomContext implements IMyCustomContext {
  readonly _name: string;
  property1: string;
  property2: number;

  constructor(name: string) {
    console.log('LOG: constructor called', name);
    this._name = name;
  }

  testMethod() {
    console.log('LOG: testMethod called');
  }
}

const ShaApplicationProvider: FC<PropsWithChildren<IShaApplicationProviderProps>> = (props) => {
  const {
    children,
    backendUrl,
    applicationName,
    applicationKey,
    accessTokenName,
    homePageUrl,
    router,
    toolboxComponentGroups = [],
    unauthorizedRedirectUrl,
    themeProps,
    routes,
    getFormUrlFunc,
  } = props;
  const initialHeaders = applicationKey ? { [FRONT_END_APP_HEADER_NAME]: applicationKey } : {};

  useEffect(() => {
    console.log('LOG: app context rendered');
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [myContext] = useState<IMyCustomContext>(() => new MyCustomContext(nanoid()));

  const [state, dispatch] = useReducer(appConfiguratorReducer, {
    ...SHESHA_APPLICATION_CONTEXT_INITIAL_STATE,
    routes: routes ?? DEFAULT_SHESHA_ROUTES,
    backendUrl,
    applicationName,
    toolboxComponentGroups,
    applicationKey,
    httpHeaders: initialHeaders,
  });

  const authRef = useRef<IAuthProviderRefProps>();

  const updateToolboxComponentGroups = (payload: IToolboxComponentGroup[]) => {
    dispatch(updateToolboxComponentGroupsAction(payload));
  };

  useDeepCompareEffect(() => {
    if (toolboxComponentGroups?.length !== 0) {
      updateToolboxComponentGroups(toolboxComponentGroups);
    }
  }, [toolboxComponentGroups]);

  const setRequestHeaders = (headers: IRequestHeaders) => {
    dispatch(setHeadersAction(headers));
  };

  const changeBackendUrl = (newBackendUrl: string) => {
    dispatch(setBackendUrlAction(newBackendUrl));
  };

  const anyOfPermissionsGranted = (permissions: string[]) => {
    if (permissions?.length === 0) return true;

    const authorizer = authRef?.current?.anyOfPermissionsGranted;
    return authorizer && authorizer(permissions);
  };

  const setGlobalVariables = (values: { [x: string]: any }) => {
    dispatch(setGlobalVariablesAction(values));
  };

  return (
    <SheshaApplicationStateContext.Provider value={state}>
      <SheshaApplicationActionsContext.Provider
        value={{
          changeBackendUrl,
          setRequestHeaders,
          // This will always return false if you're not authorized
          anyOfPermissionsGranted: anyOfPermissionsGranted, // NOTE: don't pass ref directly here, it leads to bugs because some of components use old reference even when authRef is updated
          setGlobalVariables,
        }}
      >
        <SettingsProvider>
          <ConfigurableActionDispatcherProvider>
            <UiProvider>
              <ShaRoutingProvider getFormUrlFunc={getFormUrlFunc} router={router}>
                <DynamicActionsDispatcherProvider>
                  <ConditionalWrap
                    condition={!props.noAuth}
                    wrap={(authChildren) => (
                      <AuthProvider
                        tokenName={accessTokenName || DEFAULT_ACCESS_TOKEN_NAME}
                        onSetRequestHeaders={setRequestHeaders}
                        unauthorizedRedirectUrl={unauthorizedRedirectUrl}
                        authRef={authRef}
                        homePageUrl={homePageUrl}
                      >
                        {authChildren}
                      </AuthProvider>
                    )}
                  >
                    <ConfigurationItemsLoaderProvider>
                      <ThemeProvider {...(themeProps || {})}>
                        <GlobalSheshaStyles />
                        <GlobalPageStyles />

                        <AppConfiguratorProvider>
                          <ReferenceListDispatcherProvider>
                            <MetadataDispatcherProvider>
                              <DataContextManager>
                                <DataContextProvider
                                  id={SheshaCommonContexts.ApplicationContext}
                                  name={SheshaCommonContexts.ApplicationContext}
                                  description={'Application context'}
                                  type={'root'}
                                >
                                  <StackedNavigationProvider>
                                    <DataSourcesProvider>
                                      <DynamicModalProvider>
                                        <DebugPanel>
                                          <ApplicationActionsProcessor>{children}</ApplicationActionsProcessor>
                                        </DebugPanel>
                                      </DynamicModalProvider>
                                    </DataSourcesProvider>
                                  </StackedNavigationProvider>
                                </DataContextProvider>
                              </DataContextManager>
                            </MetadataDispatcherProvider>
                          </ReferenceListDispatcherProvider>
                        </AppConfiguratorProvider>
                      </ThemeProvider>
                    </ConfigurationItemsLoaderProvider>
                  </ConditionalWrap>
                </DynamicActionsDispatcherProvider>
              </ShaRoutingProvider>
            </UiProvider>
          </ConfigurableActionDispatcherProvider>
        </SettingsProvider>
      </SheshaApplicationActionsContext.Provider>
    </SheshaApplicationStateContext.Provider>
  );
};

function useSheshaApplication(require: boolean = true) {
  const stateContext = useContext(SheshaApplicationStateContext);
  const actionsContext = useContext(SheshaApplicationActionsContext);

  if (require && (stateContext === undefined || actionsContext === undefined)) {
    throw new Error('useSheshaApplication must be used within a SheshaApplicationStateContext');
  }

  return { ...stateContext, ...actionsContext };
}

export { ShaApplicationProvider, useSheshaApplication };
