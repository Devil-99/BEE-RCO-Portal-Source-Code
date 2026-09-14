import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApi } from "./apiSlices/authApi";
import { entityDashboardApi } from "./apiSlices/entityDashboardApi";
import { aeaDashboardApi } from "./apiSlices/aeaDashboardApi";
import { firmDashboardApi } from "./apiSlices/firmDashboardApi";
import { commonApi } from "./apiSlices/commonApi";
import { formApi } from "./apiSlices/formApi";
import formsApi from "./apiSlices/forms/formApi";
import { formsApi as formsApiHooks } from "./apiSlices/forms/formApi";
import { trackStatusApi } from "./apiSlices/trackStatusApi";
import { smsApi } from "./apiSlices/smsApi";
import { adminControlApi } from "./apiSlices/adminControlApi";
import { paymentAnalyticsApi } from "./apiSlices/paymentAnalyticsApi";
import loginReducer from "./LoginSlice";
import registrationReducer from "./RegistrationSlice";
import commonReducer from "./CommonSlice";
import sessionReducer from "./sessionSlice";
import formReducer from "./FormSlice";
import { sessionApi } from "./apiSlices/sessionApi";
import { entityApi } from "./apiSlices/entityApi";
import { sectorApi } from "./apiSlices/sectorControlApi";
import { stateApi } from "./apiSlices/stateControlApi";
import { organizationApi } from "./apiSlices/organizationControlApi";
import { patApi } from "./apiSlices/patControlApi";
import { financialYearApi } from "./apiSlices/finanicalYearControlApi";
import { submissionPeriodApi } from "./apiSlices/submissionPeriodControlApi";
import { rcoApi } from "./apiSlices/rcoTargetControlApi";
import {aeaApi} from "./apiSlices/AEAControlApi";
import { auditFirmApi } from "./apiSlices/auditFirmControlApi";
import {patSearchApi} from "./apiSlices/patSearchApi";
import { corporateAPI } from "./apiSlices/corporate/corporateAPI";
import { helpdeskAPI } from "./apiSlices/helpdesk/helpdeskApi";
import { dashboardApi } from "./apiSlices/summary-dashboard/dashboardApi";
import { rbacApi } from "./apiSlices/Admin/RbacApi";
import { energyManagerApi } from "./apiSlices/Admin/EnergyManagerApi";
import { workflowsTabApi } from "./apiSlices/workflowsTabApi";
import { paymentCategoryApi } from "./apiSlices/paymentCategoryApi";
import { buyoutApi } from "./apiSlices/buyoutApi";
import { categoryApi } from "./apiSlices/categoryApi";
import { mopDashboardApi } from "./apiSlices/mopDashboardApi";

const store = configureStore({
  reducer: {
    login: loginReducer,
    registration: registrationReducer,
    commonState: commonReducer,
    session: sessionReducer,
    formState: formReducer,
    [authApi.reducerPath]: authApi.reducer,
    [entityDashboardApi.reducerPath]: entityDashboardApi.reducer,
    [aeaDashboardApi.reducerPath]: aeaDashboardApi.reducer,
    [firmDashboardApi.reducerPath]: firmDashboardApi.reducer,
    [commonApi.reducerPath]: commonApi.reducer,
    [formApi.reducerPath]: formApi.reducer,
    [formsApi.reducerPath]: formsApi.reducer,
    [trackStatusApi.reducerPath]: trackStatusApi.reducer,
    [smsApi.reducerPath]: smsApi.reducer,
    [sessionApi.reducerPath]: sessionApi.reducer,
    [adminControlApi.reducerPath]: adminControlApi.reducer,
    [paymentAnalyticsApi.reducerPath]: paymentAnalyticsApi.reducer,
    [entityApi.reducerPath]: entityApi.reducer,
    [sectorApi.reducerPath]: sectorApi.reducer,
    [stateApi.reducerPath]: stateApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
    [patApi.reducerPath]: patApi.reducer,
    [financialYearApi.reducerPath]: financialYearApi.reducer,
    [submissionPeriodApi.reducerPath]: submissionPeriodApi.reducer,
    [rcoApi.reducerPath]: rcoApi.reducer,
    [aeaApi.reducerPath]: aeaApi.reducer,
    [auditFirmApi.reducerPath]: auditFirmApi.reducer,
    [patSearchApi.reducerPath]: patSearchApi.reducer,
    [corporateAPI.reducerPath]: corporateAPI.reducer,
    [helpdeskAPI.reducerPath]: helpdeskAPI.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [rbacApi.reducerPath]: rbacApi.reducer,
    [energyManagerApi.reducerPath]: energyManagerApi.reducer,
    [workflowsTabApi.reducerPath]: workflowsTabApi.reducer,
    [paymentCategoryApi.reducerPath]: paymentCategoryApi.reducer,
    [buyoutApi.reducerPath]: buyoutApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [mopDashboardApi.reducerPath]: mopDashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(paymentCategoryApi.middleware)
      .concat(entityDashboardApi.middleware)
      .concat(aeaDashboardApi.middleware)
      .concat(firmDashboardApi.middleware)
      .concat(commonApi.middleware)
      .concat(formApi.middleware)
      .concat(formsApi.middleware)
      .concat(trackStatusApi.middleware)
      .concat(smsApi.middleware)
      .concat(sessionApi.middleware)
      .concat(adminControlApi.middleware)
      .concat(paymentAnalyticsApi.middleware)
      .concat(entityApi.middleware)
      .concat(sectorApi.middleware)
      .concat(stateApi.middleware)
      .concat(organizationApi.middleware)
      .concat(patApi.middleware) 
      .concat(financialYearApi.middleware)
      .concat(submissionPeriodApi.middleware) 
      .concat(rcoApi.middleware)
      .concat(aeaApi.middleware)
      .concat(auditFirmApi.middleware)
      .concat(patSearchApi.middleware)
      .concat(corporateAPI.middleware)
      .concat(helpdeskAPI.middleware)
      .concat(dashboardApi.middleware)
      .concat(rbacApi.middleware)
      .concat(buyoutApi.middleware)
      .concat(energyManagerApi.middleware)
      .concat(workflowsTabApi.middleware)
      .concat(categoryApi.middleware)
      .concat(mopDashboardApi.middleware)
});

// For enabling refetchOnFocus/refetchOnReconnect behaviors for auto-refecthing data
setupListeners(store.dispatch);

export default store;
