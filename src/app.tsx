import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { hydrateStore } from '@/store/useSentimentStore';
import { mockIncidents, mockSyncTemplates } from '@/data/mockSentiment';

let hydrated = false;

function App(props) {
  useEffect(() => {
    if (!hydrated) {
      hydrateStore(mockIncidents, mockSyncTemplates);
      hydrated = true;
      console.log('[App] Store hydrated with mock data');
    }
  }, []);

  useDidShow(() => {});
  useDidHide(() => {});

  return props.children;
}

export default App;
