// ============================================================
// Lumina — Subscription Store (RevenueCat + Zustand)
// Manages premium state, purchases, and entitlements
// ============================================================

import { create } from 'zustand';
import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';

// ── RevenueCat Configuration ────────────────────────────────
// TODO: Replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';

// Entitlement ID configured in RevenueCat dashboard
const ENTITLEMENT_ID = 'premium';

// Product identifiers (must match App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  annual: 'lumina_premium_annual',
  monthly: 'lumina_premium_monthly',
} as const;

// ── Types ───────────────────────────────────────────────────
export type SubscriptionPlan = 'annual' | 'monthly';
export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired';

interface SubscriptionState {
  // State
  isInitialized: boolean;
  isPremium: boolean;
  status: SubscriptionStatus;
  expirationDate: string | null;
  activeProduct: string | null;
  packages: PurchasesPackage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: (userId?: string) => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (plan: SubscriptionPlan) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkEntitlements: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

// ── Helpers ─────────────────────────────────────────────────
function getStatusFromCustomerInfo(info: CustomerInfo): {
  isPremium: boolean;
  status: SubscriptionStatus;
  expirationDate: string | null;
  activeProduct: string | null;
} {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    return {
      isPremium: false,
      status: 'free',
      expirationDate: null,
      activeProduct: null,
    };
  }

  const isInTrial = entitlement.periodType === 'TRIAL';

  return {
    isPremium: true,
    status: isInTrial ? 'trial' : 'active',
    expirationDate: entitlement.expirationDate,
    activeProduct: entitlement.productIdentifier,
  };
}

// ── Store ───────────────────────────────────────────────────
export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isInitialized: false,
  isPremium: false,
  status: 'free',
  expirationDate: null,
  activeProduct: null,
  packages: [],
  isLoading: false,
  error: null,

  initialize: async (userId?: string) => {
    if (get().isInitialized) return;

    try {
      const apiKey = Platform.OS === 'ios'
        ? REVENUECAT_API_KEY_IOS
        : REVENUECAT_API_KEY_ANDROID;

      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      Purchases.configure({ apiKey, appUserID: userId || undefined });

      // Listen for customer info changes (e.g., subscription renewed/expired)
      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        const state = getStatusFromCustomerInfo(info);
        set(state);
      });

      set({ isInitialized: true });

      // Check current entitlements
      await get().checkEntitlements();
      // Pre-load offerings
      await get().loadOfferings();
    } catch (e: any) {
      console.warn('[Subscription] Init error:', e.message);
      set({ isInitialized: true, error: e.message });
    }
  },

  loadOfferings: async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;

      if (current) {
        set({ packages: current.availablePackages });
      }
    } catch (e: any) {
      console.warn('[Subscription] Offerings error:', e.message);
    }
  },

  purchase: async (plan: SubscriptionPlan) => {
    const { packages } = get();
    set({ isLoading: true, error: null });

    try {
      // Find the package matching the selected plan
      const targetId = PRODUCT_IDS[plan];
      const pkg = packages.find(
        (p) => p.product.identifier === targetId
      );

      if (!pkg) {
        // Fallback: try by package type
        const fallbackType = plan === 'annual' ? 'ANNUAL' : 'MONTHLY';
        const fallbackPkg = packages.find(
          (p) => p.packageType === fallbackType
        );

        if (!fallbackPkg) {
          throw new Error(`No package found for plan: ${plan}`);
        }

        const { customerInfo } = await Purchases.purchasePackage(fallbackPkg);
        const state = getStatusFromCustomerInfo(customerInfo);
        set({ ...state, isLoading: false });
        return state.isPremium;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const state = getStatusFromCustomerInfo(customerInfo);
      set({ ...state, isLoading: false });
      return state.isPremium;
    } catch (e: any) {
      // User cancelled purchase — not an error
      if (e.userCancelled) {
        set({ isLoading: false });
        return false;
      }
      console.warn('[Subscription] Purchase error:', e.message);
      set({ isLoading: false, error: e.message });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true, error: null });

    try {
      const customerInfo = await Purchases.restorePurchases();
      const state = getStatusFromCustomerInfo(customerInfo);
      set({ ...state, isLoading: false });
      return state.isPremium;
    } catch (e: any) {
      console.warn('[Subscription] Restore error:', e.message);
      set({ isLoading: false, error: e.message });
      return false;
    }
  },

  checkEntitlements: async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const state = getStatusFromCustomerInfo(customerInfo);
      set(state);
    } catch (e: any) {
      console.warn('[Subscription] Check error:', e.message);
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
  clearError: () => set({ error: null }),
}));
