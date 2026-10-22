import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useAppState } from './state';
import { fetchPrice, WEBVIEW_SCRIPT, USER_AGENT } from './priceScraper';

const RefreshContext = createContext({ refresh: async () => {}, refreshing: false });

const STALE_MS = 60 * 60 * 1000; // à l'ouverture, on ne revérifie pas un produit vu il y a < 1 h
const WEBVIEW_TIMEOUT_MS = 22000;

export function PriceRefresherProvider({ children }) {
  const { state, dispatch } = useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const [webItem, setWebItem] = useState(null); // produit en cours de lecture via la WebView
  const resolverRef = useRef(null);
  const timerRef = useRef(null);
  const runningRef = useRef(false);
  const startedRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const finishWeb = useCallback((result) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setWebItem(null);
    if (resolve) resolve(result);
  }, []);

  const readWithWebView = useCallback(
    (item) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setWebItem(item);
        timerRef.current = setTimeout(() => finishWeb({ price: null, title: null }), WEBVIEW_TIMEOUT_MS);
      }),
    [finishWeb]
  );

  const refresh = useCallback(
    async (items) => {
      if (runningRef.current) return;
      const list = (items || stateRef.current.priceWatchlist).filter((p) => p.url);
      if (!list.length) return;
      runningRef.current = true;
      setRefreshing(true);
      try {
        for (const item of list) {
          let res = await fetchPrice(item.url);
          if (!res.price) res = await readWithWebView(item);
          const patch = { id: item.id, lastChecked: Date.now() };
          if (res.price) {
            patch.currentPrice = res.price;
            patch.priceError = false;
          } else {
            patch.priceError = true; // on garde l'ancien prix s'il y en avait un
          }
          if (res.title && !item.product) patch.product = res.title;
          dispatch({ type: 'UPDATE_PRICE_WATCH', payload: patch });
        }
      } finally {
        runningRef.current = false;
        setRefreshing(false);
      }
    },
    [dispatch, readWithWebView]
  );

  // Vérification automatique une fois par lancement
  useEffect(() => {
    if (!state.loaded || startedRef.current) return;
    startedRef.current = true;
    const stale = state.priceWatchlist.filter(
      (p) => p.url && (!p.lastChecked || Date.now() - p.lastChecked > STALE_MS)
    );
    if (stale.length) refresh(stale);
  }, [state.loaded]);

  return (
    <RefreshContext.Provider value={{ refresh, refreshing }}>
      {children}
      {webItem ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
        >
          <WebView
            key={webItem.id}
            source={{ uri: webItem.url }}
            userAgent={USER_AGENT}
            javaScriptEnabled
            domStorageEnabled
            injectedJavaScript={WEBVIEW_SCRIPT}
            onMessage={(e) => {
              try {
                finishWeb(JSON.parse(e.nativeEvent.data));
              } catch (err) {
                finishWeb({ price: null, title: null });
              }
            }}
            onError={() => finishWeb({ price: null, title: null })}
            onHttpError={() => finishWeb({ price: null, title: null })}
          />
        </View>
      ) : null}
    </RefreshContext.Provider>
  );
}

export function usePriceRefresher() {
  return useContext(RefreshContext);
}