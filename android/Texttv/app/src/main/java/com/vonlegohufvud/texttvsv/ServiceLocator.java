package com.vonlegohufvud.texttvsv;

public class ServiceLocator {

    private static ServiceLocator instance = null;

    private AppStateService appStateService;

    private ServiceLocator() {}

    public static ServiceLocator getInstance() {
        if (instance == null) {
            synchronized(ServiceLocator.class) {
                instance = new ServiceLocator();
            }
        }
        return instance;
    }

    public AppStateService getAppStateService() {
        if(appStateService == null) {
            appStateService = new AppStateService();
        }
        return appStateService;
    }
}
