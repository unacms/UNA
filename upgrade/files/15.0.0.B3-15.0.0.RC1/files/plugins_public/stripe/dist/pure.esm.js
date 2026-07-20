/* eslint-disable @typescript-eslint/no-unused-vars */
// Source of truth for the entire list of components. When you add a new component, it should be added here.
const connectElementTagNames = ["account-onboarding", "disputes-list", "payments", "payment-details", "payment-disputes", "payouts", "payouts-list", "payout-details", "balances", "account-management", "notification-banner", "instant-payouts-promotion", "issuing-card", "issuing-cards-list", "financial-account", "financial-account-transactions", "documents", "tax-registrations", "tax-settings", "balance-report", "payout-reconciliation-report"];
const ConnectElementCommonMethodConfig = {
  setOnLoadError: _listener => {},
  setOnLoaderStart: _listener => {}
};
const ConnectElementCustomMethodConfig = {
  "account-onboarding": {
    setFullTermsOfServiceUrl: _termOfServiceUrl => {},
    setRecipientTermsOfServiceUrl: _recipientTermsOfServiceUrl => {},
    setPrivacyPolicyUrl: _privacyPolicyUrl => {},
    setSkipTermsOfServiceCollection: _skipTermsOfServiceCollection => {},
    setCollectionOptions: _collectionOptions => {},
    setOnExit: _listener => {},
    setOnStepChange: _listener => {}
  },
  "account-management": {
    setCollectionOptions: _collectionOptions => {},
    setOnSectionOpen: _listener => {}
  },
  "notification-banner": {
    setCollectionOptions: _collectionOptions => {},
    setOnNotificationsChange: _listener => {}
  },
  "instant-payouts-promotion": {
    setOnInstantPayoutsPromotionLoaded: _listener => {},
    setOnInstantPayoutCreated: _listener => {}
  },
  "issuing-card": {
    setDefaultCard: _defaultCard => {},
    setCardSwitching: _cardSwitching => {},
    setFetchEphemeralKey: _fetchEphemeralKey => {},
    setShowSpendControls: _showSpendControls => {}
  },
  "issuing-cards-list": {
    setFetchEphemeralKey: _fetchEphemeralKey => {},
    setShowSpendControls: _showSpendControls => {},
    setIssuingProgram: _issuingProgram => {}
  },
  "financial-account": {
    setFinancialAccount: _financialAccount => {}
  },
  "financial-account-transactions": {
    setFinancialAccount: _financialAccount => {}
  },
  payments: {
    setDefaultFilters: _filters => {}
  },
  "payment-details": {
    setPayment: _payment => {},
    setOnClose: _listener => {}
  },
  "payment-disputes": {
    setPayment: _payment => {},
    setOnDisputesLoaded: _listener => {}
  },
  "tax-settings": {
    setHideProductTaxCodeSelector: _hidden => {},
    setDisplayHeadOfficeCountries: _countries => {},
    setOnTaxSettingsUpdated: _listener => {}
  },
  "tax-registrations": {
    setOnAfterTaxRegistrationAdded: _listener => {},
    setDisplayCountries: _countries => {},
    setOnAfterTaxRegistrationExpired: _listener => {}
  },
  "payout-details": {
    setPayout: _payout => {},
    setOnClose: _listener => {}
  },
  "payout-reconciliation-report": {
    setOnReportAvailabilityLoaded: _listener => {}
  }
};

const EXISTING_SCRIPT_MESSAGE = "loadConnect was called but an existing Connect.js script already exists in the document; existing script parameters will be used";
const V0_URL = "https://connect-js.stripe.com/v0.1/connect.js";
const V1_URL = "https://connect-js.stripe.com/v1.0/connect.js";
const findScript = () => {
  return document.querySelectorAll(`script[src="${V1_URL}"]`)[0] || document.querySelectorAll(`script[src="${V0_URL}"]`)[0] || null;
};
const injectScript = () => {
  const script = document.createElement("script");
  script.src = V1_URL;
  const head = document.head;
  if (!head) {
    throw new Error("Expected document.head not to be null. Connect.js requires a <head> element.");
  }
  document.head.appendChild(script);
  return script;
};

const componentNameMapping = connectElementTagNames.reduce((acc, name) => {
  acc[name] = `stripe-connect-${name}`;
  return acc;
}, {});
let stripePromise = null;
const isWindowStripeConnectDefined = stripeConnect => {
  // We only consider `StripeConnect` defined if `init` is a function
  // Why? HTML markup like:
  // <a id="StripeConnect"><a id="StripeConnect" name="init" href="stripe"></a></a> in the <head> of the page
  // can end up "contaminating" the window.StripeConnect object and cause issues in connect.js initialization
  return !!(stripeConnect && typeof stripeConnect === "object" && "init" in stripeConnect && typeof stripeConnect.init === "function");
};
const loadScript = () => {
  // Ensure that we only attempt to load Connect.js at most once
  if (stripePromise !== null) {
    return stripePromise;
  }
  stripePromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject("ConnectJS won't load when rendering code in the server - it can only be loaded on a browser. This error is expected when loading ConnectJS in SSR environments, like NextJS. It will have no impact in the UI, however if you wish to avoid it, you can switch to the `pure` version of the connect.js loader: https://github.com/stripe/connect-js#importing-loadconnect-without-side-effects.");
      return;
    }
    if (isWindowStripeConnectDefined(window.StripeConnect)) {
      console.warn(EXISTING_SCRIPT_MESSAGE);
      const wrapper = createWrapper(window.StripeConnect);
      resolve(wrapper);
      return;
    }
    try {
      let script = findScript();
      if (script) {
        console.warn(EXISTING_SCRIPT_MESSAGE);
      } else if (!script) {
        script = injectScript();
      }
      script.addEventListener("load", () => {
        if (isWindowStripeConnectDefined(window.StripeConnect)) {
          const wrapper = createWrapper(window.StripeConnect);
          resolve(wrapper);
        } else {
          reject(new Error("Connect.js did not load the necessary objects"));
        }
      });
      script.addEventListener("error", () => {
        reject(new Error("Failed to load Connect.js"));
      });
    } catch (error) {
      reject(error);
    }
  });
  return stripePromise;
};
const hasCustomMethod = tagName => {
  return tagName in ConnectElementCustomMethodConfig;
};
const initStripeConnect = (stripePromise, initParams) => {
  var _a;
  const eagerClientSecretPromise = (() => {
    try {
      return initParams.fetchClientSecret();
    } catch (error) {
      return Promise.reject(error);
    }
  })();
  const metaOptions = (_a = initParams.metaOptions) !== null && _a !== void 0 ? _a : {};
  const stripeConnectInstance = stripePromise.then(wrapper => wrapper.initialize(Object.assign(Object.assign({}, initParams), {
    metaOptions: Object.assign(Object.assign({}, metaOptions), {
      eagerClientSecretPromise
    })
  })));
  return {
    create: tagName => {
      let htmlName = componentNameMapping[tagName];
      if (!htmlName) {
        htmlName = tagName;
      }
      const element = document.createElement(htmlName);
      const customMethods = hasCustomMethod(tagName) ? ConnectElementCustomMethodConfig[tagName] : {};
      const methods = Object.assign(Object.assign({}, customMethods), ConnectElementCommonMethodConfig);
      for (const method in methods) {
        element[method] = function (value) {
          stripeConnectInstance.then(() => {
            if (!this[`${method}InternalOnly`]) {
              throw new Error(`Method ${method} is not available in the ${tagName} HTML element. Are you using a supported version of the "@stripe/connect-js" package? Using version: 3.4.6`);
            }
            this[`${method}InternalOnly`](value);
          });
        };
      }
      stripeConnectInstance.then(instance => {
        if (!element.isConnected && !element.setConnector) {
          // If the element is not connected to the DOM and the `setConnector` method is not
          // defined, this indicates the element was created before connect.js was loaded, and has
          // not been transformed into a custom element yet
          // To load the custom element code on it, we need to connect and disconnect it to the DOM
          // This isn't a problem, as the element will be invisible, and we know the element is already
          // not currently connected to the DOM
          const oldDisplay = element.style.display;
          element.style.display = "none";
          document.body.appendChild(element);
          document.body.removeChild(element);
          element.style.display = oldDisplay;
        }
        if (!element || !element.setConnector) {
          throw new Error(`Element ${tagName} was not transformed into a custom element. Are you using a documented component? See https://docs.stripe.com/connect/supported-embedded-components for a list of supported components`);
        }
        element.setConnector(instance.connect);
      });
      return element;
    },
    update: updateOptions => {
      stripeConnectInstance.then(instance => {
        instance.update(updateOptions);
      });
    },
    debugInstance: () => {
      return stripeConnectInstance;
    },
    logout: () => {
      return stripeConnectInstance.then(instance => {
        return instance.logout();
      });
    }
  };
};
const createWrapper = stripeConnect => {
  window.StripeConnect = window.StripeConnect || {};
  window.StripeConnect.optimizedLoading = true;
  const wrapper = {
    initialize: params => {
      var _a;
      const metaOptions = (_a = params.metaOptions) !== null && _a !== void 0 ? _a : {};
      const stripeConnectInstance = stripeConnect.init(Object.assign(Object.assign({}, params), {
        metaOptions: Object.assign(Object.assign({}, metaOptions), {
          sdk: true,
          sdkOptions: {
            // This will be replaced by the npm package version when bundling
            sdkVersion: "3.4.6"
          }
        })
      }));
      return stripeConnectInstance;
    }
  };
  return wrapper;
};

const loadConnectAndInitialize = initParams => {
  const maybeConnect = loadScript();
  if (initParams == null) {
    throw new Error("You must provide required parameters to initialize Connect");
  }
  return initStripeConnect(maybeConnect, initParams);
};

export { ConnectElementCommonMethodConfig, ConnectElementCustomMethodConfig, connectElementTagNames, loadConnectAndInitialize };
