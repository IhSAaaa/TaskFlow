import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  settings?: {
    timezone?: string;
    language?: string;
    currency?: string;
    dateFormat?: string;
  };
}

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
  switchTenant: (tenantId: string) => void;
  availableTenants: Tenant[];
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenantFromStorage();
  }, []);

  const loadTenantFromStorage = () => {
    try {
      const tenantId = localStorage.getItem('tenantId');
      const tenantData = localStorage.getItem('tenantData');
      
      if (tenantId && tenantData) {
        const tenant = JSON.parse(tenantData);
        setCurrentTenant(tenant);
      }
    } catch (error) {
      console.error('Error loading tenant from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = (tenantId: string) => {
    const tenant = availableTenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      localStorage.setItem('tenantId', tenant.id);
      localStorage.setItem('tenantData', JSON.stringify(tenant));
      
      // Reload the page to refresh all tenant-specific data
      window.location.reload();
    }
  };

  const value: TenantContextType = {
    currentTenant,
    setCurrentTenant,
    switchTenant,
    availableTenants,
    loading
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}; 